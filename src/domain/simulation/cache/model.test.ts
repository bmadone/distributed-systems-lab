import { initialConfig, lruHits, pick, roundSkew, simulate, SIZE, SKEW, zipfCumulative } from './model';

// Practice-task predicates, written from the lesson's task wording.
const task1 = (a: { skew: number; size: number; hit: number }) => Math.abs(a.skew - 1) < 0.01 && a.size <= 300 && a.hit >= 0.75;
const task2 = (a: { skew: number; size: number; hit: number }) => a.skew <= 0.51 && a.size >= 200 && a.hit < 0.4;

describe('cache model', () => {
  it('is deterministic', () => {
    expect(simulate({ size: 120, skew: 0.8 })).toEqual(simulate({ size: 120, skew: 0.8 }));
  });
  it('matches legacy targets: skew 1 with 300 items ≈ 77%, skew 0.5 with 200 items ≈ 30%', () => {
    const a = simulate({ size: 300, skew: 1 });
    expect(a.hit).toBeGreaterThan(0.75);
    expect(a.hit).toBeCloseTo(0.77, 1);
    const b = simulate({ size: 200, skew: 0.5 });
    expect(b.hit).toBeLessThan(0.4);
    expect(b.hit).toBeCloseTo(0.3, 1);
  });
  it('reproduces the legacy simulation bit-for-bit (same seed, same LRU)', () => {
    expect([simulate({ size: 300, skew: 1 }).hit, simulate({ size: 200, skew: 0.5 }).hit, simulate({ size: 50, skew: 1 }).hit, simulate({ size: 120, skew: 0.8 }).hit])
      .toEqual([0.76675, 0.29785, 0.4569, 0.4093]);
  });
  it('both cache tasks are reachable with slider values', () => {
    const onGrid = (x: number, lo: number, step: number) => Math.abs(Math.round((x - lo) / step) * step + lo - x) < 1e-9;
    expect(onGrid(300, SIZE.min, SIZE.step) && onGrid(200, SIZE.min, SIZE.step)).toBe(true);
    expect(onGrid(0.5, SKEW.min, SKEW.step) && onGrid(1, SKEW.min, SKEW.step)).toBe(true);
    expect(task1(simulate({ size: 300, skew: 1 }))).toBe(true);
    expect(task2(simulate({ size: 200, skew: 0.5 }))).toBe(true);
  });
  it('the default does not solve any practice task', () => {
    const a = simulate(initialConfig);
    expect(task1(a)).toBe(false);
    expect(task2(a)).toBe(false);
  });
  it('LRU never beats the ideal top-k cache by much, and size 0 never hits', () => {
    const a = simulate({ size: 100, skew: 1.2 });
    expect(a.hit).toBeLessThanOrEqual(a.ideal + 0.02);
    expect(simulate({ size: 0, skew: 1 }).hit).toBe(0);
  });
  it('pick and lruHits behave', () => {
    const cum = zipfCumulative(3, 0); // [1, 2, 3]
    expect(cum).toEqual([1, 2, 3]);
    expect([pick(cum, 0.5), pick(cum, 1.5), pick(cum, 2.9)]).toEqual([0, 1, 2]);
    expect(lruHits([1, 2, 1, 3, 2, 1], 2)).toBe(1);
    expect(roundSkew(0.5000001)).toBe(0.5);
  });
});
