import { build, CENTER, DEFAULT_CAP, leaves, move, place, POINTS, search } from './model';
import { range } from '../../shared-kernel/fp';

const positions = range(17).flatMap(i => range(17).map(j => [40 + 20 * i, 40 + 20 * j] as const));

describe('quadtree model', () => {
  it('generates 300 points inside the map, deterministically', () => {
    expect(POINTS).toHaveLength(300);
    expect(POINTS.every(([x, y]) => x >= 2 && x <= 398 && y >= 2 && y <= 398)).toBe(true);
  });
  it('every point lands in exactly one leaf', () => {
    for (const cap of [1, 4, 16, 64]) {
      const all = leaves(build(POINTS, cap)).flatMap(l => l.pts).sort((a, b) => a - b);
      expect(all).toEqual(range(300));
    }
  });
  it('a smaller capacity means more cells', () => {
    expect(leaves(build(POINTS, 4)).length).toBeGreaterThan(leaves(build(POINTS, 64)).length);
  });
  it('checked points include every found point', () => {
    const r = search(POINTS, 8, [110, 120]);
    expect(r.found.every(i => r.checked.includes(i))).toBe(true);
    expect(r.found.length).toBeGreaterThan(0);
  });
  it('no query means no ratio', () => {
    expect(search(POINTS, DEFAULT_CAP, null).ratio).toBeNull();
  });
  it('keyboard moves by 20 and clamps to [40, 360]', () => {
    expect(move(null, 'right')).toEqual([220, 200]);
    expect(place(null)).toEqual(CENTER);
    expect(move([360, 40], 'right')).toEqual([360, 40]);
    expect(move([360, 40], 'up')).toEqual([360, 40]);
  });
  it('task: checking < 15% is reachable from the keyboard with a lower capacity', () => {
    expect(positions.some(p => (search(POINTS, 8, p).ratio ?? 1) < 0.15)).toBe(true);
    expect((search(POINTS, 8, place(null)).ratio ?? 1)).toBeLessThan(0.15);
  });
  it('the default does not solve any practice task (no query; and capacity 64 is too coarse at the center)', () => {
    expect(search(POINTS, DEFAULT_CAP, null).ratio).toBeNull();
    expect(search(POINTS, DEFAULT_CAP, place(null)).ratio ?? 1).toBeGreaterThanOrEqual(0.15);
  });
});

describe('quadtree: extra practice tasks', () => {
  const run = (cap: number) => positions.map(p => ({ p, r: search(POINTS, cap, p) }));
  const searched = (r: ReturnType<typeof search>) => r.ratio !== null;
  const t1 = (r: ReturnType<typeof search>) => r.cells.length >= 100;
  const t2 = (r: ReturnType<typeof search>) => searched(r) && r.found.length === 0 && r.checked.length <= 5;
  const t3 = (r: ReturnType<typeof search>) => r.found.length >= 10 && r.found.length / r.checked.length >= 0.6;
  const t4 = (r: ReturnType<typeof search>) => r.found.length >= 10 && r.checked.length <= 20;

  it('task 1: 100+ cells needs a small capacity, and the default has few', () => {
    expect(t1(search(POINTS, 4, null))).toBe(true);
    expect(t1(search(POINTS, DEFAULT_CAP, null))).toBe(false);
  });
  it('task 2: an empty box that checks at most 5 points exists at a small capacity (keyboard grid)', () => {
    expect(run(4).some(x => t2(x.r))).toBe(true);
    expect(run(DEFAULT_CAP).some(x => t2(x.r))).toBe(false);
  });
  it('task 3: a precise search (>= 60% of checked points are hits, >= 10 hits) is reachable', () => {
    expect(run(16).some(x => t3(x.r))).toBe(true);
    expect(run(DEFAULT_CAP).some(x => t3(x.r))).toBe(false);
  });
  it('task 4: 10+ drivers found while checking at most 20 points needs a fine tree', () => {
    expect(run(2).some(x => t4(x.r))).toBe(true);
    expect(run(DEFAULT_CAP).some(x => t4(x.r))).toBe(false);
  });
  it('the default (no query, capacity 64) solves none of them', () => {
    const r = search(POINTS, DEFAULT_CAP, null);
    expect([t1, t2, t3, t4].some(t => t(r))).toBe(false);
  });
});
