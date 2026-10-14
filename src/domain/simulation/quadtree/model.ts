import { clamp, nextRandom } from '../../shared-kernel/fp';

// Pure model of the quadtree search: 300 seeded points, a capacity-driven quadtree and an 80×80 box query.

export type Point = readonly [x: number, y: number];
export const SIZE = 400, HALF_BOX = 40, MAX_DEPTH = 8, KEY_STEP = 20;
export const MIN_CAP = 1, MAX_CAP = 64, DEFAULT_CAP = 64;
export const CENTER: Point = [SIZE / 2, SIZE / 2];

/** Deterministic driver locations: two Gaussian clusters plus uniform noise (mulberry32, seed 11). */
export const makePoints = (seed: number): readonly Point[] => {
  let state = seed >>> 0;
  const r = (): number => { const [v, s] = nextRandom(state); state = s; return v; };
  const nonZero = (): number => { let v = r(); while (v === 0) v = r(); return v; };
  const g = (): number => { const u = nonZero(), v = nonZero(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const cluster = (n: number, cx: number, cy: number, sd: number): Point[] =>
    Array.from({ length: n }, () => { const x = cx + g() * sd; return [x, cy + g() * sd] as const; });
  const a = cluster(130, 110, 120, 35);
  const b = cluster(110, 285, 275, 45);
  const c = Array.from({ length: 60 }, (): Point => { const x = r() * SIZE; return [x, r() * SIZE]; });
  return [...a, ...b, ...c].map(([x, y]): Point => [clamp(2, SIZE - 2, x), clamp(2, SIZE - 2, y)]);
};
export const POINTS: readonly Point[] = makePoints(11);

export type QNode =
  | { readonly kind: 'leaf'; readonly x: number; readonly y: number; readonly w: number; readonly pts: readonly number[] }
  | { readonly kind: 'split'; readonly x: number; readonly y: number; readonly w: number; readonly kids: readonly QNode[] };

/** Split any cell holding more than `cap` points into four, up to depth 8. Points are indices into `pts`. */
export const build = (pts: readonly Point[], cap: number): QNode => {
  const node = (x: number, y: number, w: number, idx: readonly number[], d: number): QNode => {
    if (idx.length <= cap || d >= MAX_DEPTH) return { kind: 'leaf', x, y, w, pts: idx };
    const h = w / 2;
    const quads: readonly Point[] = [[x, y], [x + h, y], [x, y + h], [x + h, y + h]];
    return {
      kind: 'split', x, y, w,
      kids: quads.map(([cx, cy]) => node(cx, cy, h, idx.filter(i => {
        const p = pts[i];
        return p !== undefined && p[0] >= cx && p[0] < cx + h && p[1] >= cy && p[1] < cy + h;
      }), d + 1)),
    };
  };
  return node(0, 0, SIZE, pts.map((_, i) => i), 0);
};

export const leaves = (n: QNode): readonly Extract<QNode, { kind: 'leaf' }>[] =>
  n.kind === 'leaf' ? [n] : n.kids.flatMap(leaves);

export interface Box { readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number }
export const boxAt = ([x, y]: Point): Box => ({ x1: x - HALF_BOX, y1: y - HALF_BOX, x2: x + HALF_BOX, y2: y + HALF_BOX });
const inBox = (q: Box, [x, y]: Point) => x >= q.x1 && x <= q.x2 && y >= q.y1 && y <= q.y2;

export interface SearchResult {
  readonly cells: readonly Extract<QNode, { kind: 'leaf' }>[];
  readonly box: Box | null;
  /** Point indices the quadtree had to look at. */
  readonly checked: readonly number[];
  /** Point indices inside the box. */
  readonly found: readonly number[];
  /** checked / total, or null before any search. */
  readonly ratio: number | null;
}

export const search = (pts: readonly Point[], cap: number, query: Point | null): SearchResult => {
  const cells = leaves(build(pts, cap));
  if (query === null) return { cells, box: null, checked: [], found: [], ratio: null };
  const q = boxAt(query);
  const checked = cells
    .filter(n => !(n.x > q.x2 || n.x + n.w < q.x1 || n.y > q.y2 || n.y + n.w < q.y1))
    .flatMap(n => n.pts)
    .sort((a, b) => a - b);
  const found = pts.flatMap((p, i) => (inBox(q, p) ? [i] : []));
  return { cells, box: q, checked, found, ratio: checked.length / pts.length };
};

export type Dir = 'left' | 'right' | 'up' | 'down';
const DELTA: Readonly<Record<Dir, Point>> = { left: [-KEY_STEP, 0], right: [KEY_STEP, 0], up: [0, -KEY_STEP], down: [0, KEY_STEP] };
const lo = HALF_BOX, hi = SIZE - HALF_BOX;

/** Keyboard: move the box by 20 within [40, 360], starting from the center if there is no query yet. */
export const move = (query: Point | null, dir: Dir): Point => {
  const [x, y] = query ?? CENTER, [dx, dy] = DELTA[dir];
  return [clamp(lo, hi, x + dx), clamp(lo, hi, y + dy)];
};
/** Keyboard: search at the current position (or the center). */
export const place = (query: Point | null): Point => query ?? CENTER;

export const clampCap = (cap: number): number => clamp(MIN_CAP, MAX_CAP, Math.round(cap));
