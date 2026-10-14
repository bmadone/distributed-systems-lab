import { range } from '../../shared-kernel/fp';

// Pure model of sharding 120 keys across N nodes with range, hash mod N, or a consistent-hash ring.

export type Strategy = 'range' | 'mod' | 'ring';
export const STRATEGY_NAMES: Readonly<Record<Strategy, string>> = { mod: 'hash mod N', range: 'range', ring: 'consistent hashing' };
export const MIN_NODES = 1;
export const MAX_NODES = 8;
export const VNODES = 200;
export const PALETTE: readonly string[] = ['#3F70DA', '#E07A3F', '#2A9D8F', '#B5539C', '#8A9A2B', '#D04848', '#7A68E0', '#C9A227'];
export const color = (i: number): string => PALETTE[i % PALETTE.length] ?? 'currentColor';

/** FNV-1a with a murmur-style finalizer (the legacy hash), so keys spread well around the ring. */
export const hash = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return h >>> 0;
};
export const HASH_SPACE = 4294967296;

const FIRST = ['aaron', 'adam', 'alice', 'amy', 'anna', 'ben', 'carlos', 'chloe', 'daniel', 'david', 'emma', 'eric', 'grace', 'hannah', 'jack', 'james', 'jason', 'john', 'jose', 'julia', 'kate', 'kevin', 'laura', 'leo', 'lisa', 'maria', 'mark', 'mary', 'matt', 'mia', 'michael', 'nina', 'olivia', 'paul', 'ryan', 'sam', 'sara', 'sophia', 'steve', 'tom'];
export const KEYS: readonly string[] = FIRST.flatMap(f => [`${f}.k`, `${f}.r`, `${f}.w`]).sort();
export const HASHES: readonly number[] = KEYS.map(hash);

export interface RingPoint { readonly pos: number; readonly node: number }
export const ringPoints = (n: number, vn: boolean): readonly RingPoint[] =>
  range(n).flatMap(node => range(vn ? VNODES : 1).map(j => ({ pos: hash(`node${node}#${j}`), node })));

const rangeOwner = (key: string, n: number): number => {
  const L = key.charCodeAt(0) - 97;
  const i = range(n).find(i => L < Math.floor(26 * (i + 1) / n));
  return i ?? n - 1;
};

/** Owner node index for every key. */
export const assign = (strategy: Strategy, n: number, vn: boolean): readonly number[] => {
  if (strategy === 'mod') return HASHES.map(h => h % n);
  if (strategy === 'range') return KEYS.map(k => rangeOwner(k, n));
  const pts = [...ringPoints(n, vn)].sort((a, b) => a.pos - b.pos);
  // Each key belongs to the next node clockwise, wrapping to the first point.
  return HASHES.map(h => (pts.find(p => p.pos >= h) ?? pts[0])?.node ?? 0);
};

export const counts = (own: readonly number[], n: number): readonly number[] =>
  range(n).map(i => own.filter(o => o === i).length);

export const maxShare = (own: readonly number[], n: number): number => Math.max(...counts(own, n)) / own.length;

/** Key range label for a node under range partitioning, e.g. "A–F". */
export const rangeLabel = (i: number, n: number): string =>
  `${String.fromCharCode(65 + Math.floor(26 * i / n))}–${String.fromCharCode(64 + Math.floor(26 * (i + 1) / n))}`;

export interface Config { readonly strategy: Strategy; readonly n: number; readonly vn: boolean }
export const initialConfig: Config = { strategy: 'mod', n: 4, vn: false };

export interface Move { readonly strategy: Strategy; readonly from: number; readonly to: number; readonly moved: number; readonly total: number }

/** Change the node count by `d`, reporting how many keys changed owner. `null` if out of range. */
export const resize = (c: Config, d: number): { readonly config: Config; readonly move: Move } | null => {
  const to = c.n + d;
  if (to < MIN_NODES || to > MAX_NODES) return null;
  const a = assign(c.strategy, c.n, c.vn), b = assign(c.strategy, to, c.vn);
  return {
    config: { ...c, n: to },
    move: { strategy: c.strategy, from: c.n, to, moved: a.filter((x, i) => x !== b[i]).length, total: a.length },
  };
};

/** The minimum share of keys that must move when going from `from` to `to` nodes. */
export const idealMove = (m: Move): number => Math.abs(m.to - m.from) / Math.max(m.to, m.from);
