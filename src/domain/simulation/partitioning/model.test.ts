import { assign, counts, initialConfig, KEYS, maxShare, rangeLabel, resize, type Config } from './model';

const frac = (strategy: 'mod' | 'ring' | 'range', vn: boolean) => {
  const r = resize({ strategy, n: 4, vn }, 1);
  if (!r) throw new Error('resize failed');
  return r.move.moved / r.move.total;
};

describe('partitioning model', () => {
  it('shards 120 keys and every key gets an owner in range', () => {
    expect(KEYS).toHaveLength(120);
    (['range', 'mod', 'ring'] as const).forEach(s => [1, 4, 8].forEach(n => {
      expect(assign(s, n, true).every(o => o >= 0 && o < n)).toBe(true);
    }));
  });
  it('ring with virtual nodes: busiest node ≈ 31% at N = 4', () => {
    const share = maxShare(assign('ring', 4, true), 4);
    expect(share).toBeGreaterThan(0.28);
    expect(share).toBeLessThan(0.33);
  });
  it('a single ring position per node is badly unbalanced', () => {
    expect(maxShare(assign('ring', 4, false), 4)).toBeGreaterThan(0.33);
  });
  it('4 → 5 nodes: ring moves a small fraction, mod N moves most keys', () => {
    const ring = frac('ring', true);
    expect(ring).toBeGreaterThanOrEqual(0.13);
    expect(ring).toBeLessThanOrEqual(0.2);
    expect(frac('mod', false)).toBeGreaterThan(0.75);
  });
  it('resize stays within 1..8 nodes', () => {
    expect(resize({ ...initialConfig, n: 8 }, 1)).toBeNull();
    expect(resize({ ...initialConfig, n: 1 }, -1)).toBeNull();
  });
  it('range labels', () => {
    expect(rangeLabel(0, 4)).toBe('A–F');
    expect(rangeLabel(3, 4)).toBe('T–Z');
  });
  it('the default solves no task: mod N, 4 nodes, no move yet', () => {
    expect(initialConfig).toEqual({ strategy: 'mod', n: 4, vn: false });
  });
  it('every task is reachable', () => {
    const mod = resize({ strategy: 'mod', n: 4, vn: false }, 1);
    expect(mod?.move).toMatchObject({ strategy: 'mod', from: 4, to: 5 });
    const ring = resize({ strategy: 'ring', n: 4, vn: true }, 1);
    expect(ring && ring.move.to > ring.move.from && ring.move.moved / ring.move.total < 0.3).toBe(true);
    expect(maxShare(assign('ring', 4, true), 4)).toBeLessThan(0.33);
  });
  // New practice tasks, from the lesson wording.
  const all: readonly Config[] = (['range', 'mod', 'ring'] as const).flatMap(strategy => [false, true].flatMap(vn => [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ strategy, n, vn }))));
  const share = (c: Config) => maxShare(assign(c.strategy, c.n, c.vn), c.n);
  const hot = (c: Config) => c.strategy === 'range' && c.n >= 4 && share(c) > 0.45;
  const idle = (c: Config) => c.strategy === 'range' && counts(assign(c.strategy, c.n, c.vn), c.n).some(x => x === 0);
  const smooth8 = (c: Config) => c.strategy === 'ring' && c.vn && c.n === 8 && share(c) < 0.19;
  it('new lab tasks are reachable and not solved by the default', () => {
    [hot, idle, smooth8].forEach(t => { expect(t(initialConfig)).toBe(false); expect(all.some(t)).toBe(true); });
  });
  it('mod N shrink moving over 85% is reachable', () => {
    const r = resize({ strategy: 'mod', n: 6, vn: false }, -1);
    expect(r && r.move.moved / r.move.total).toBeGreaterThan(0.85);
  });
  it('numeric tasks', () => {
    const r = resize({ strategy: 'ring', n: 6, vn: true }, 1);
    expect(r?.move.moved).toBe(18);
    // uniform hash: mod 19 -> 20 moves 19/20, ideal ring moves 1/20
    expect(Math.round(1e6 * (19 / 20 - 1 / 20))).toBe(900000);
    expect(4000 + 6000 / 8).toBe(4750);
    expect(Math.ceil(3200 / (500 * 0.6))).toBe(11);
  });
  it('mod N stays-put fraction is 1/(N+1) for a uniform hash', () => {
    const stay = (n: number) => Array.from({ length: n * (n + 1) }, (_, h) => h).filter(h => h % n === h % (n + 1)).length / (n * (n + 1));
    expect(stay(19)).toBeCloseTo(1 / 20, 10);
    expect(stay(10)).toBeCloseTo(1 / 11, 10);
  });
});
