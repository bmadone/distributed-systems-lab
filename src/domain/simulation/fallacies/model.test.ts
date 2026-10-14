import { allSucceed, barWidth, criticalPathMs, FALLACIES, fitsIn, fmtHuman, fmtReal, LATENCY, onlySecurityAndCost, revealedCount, toggleCard } from './model';

describe('fallacies model', () => {
  it('has eight fallacies and toggles cards', () => {
    expect(FALLACIES).toHaveLength(8);
    expect(toggleCard([], 3)).toEqual([3]);
    expect(toggleCard([1, 3], 3)).toEqual([1]);
  });
  it('all eight can be revealed (task reachable)', () => {
    const all = FALLACIES.reduce<readonly number[]>((open, _, i) => toggleCard(open, i), []);
    expect(revealedCount(all)).toBe(8);
  });
  it('the default does not solve the task', () => {
    expect(revealedCount([])).toBe(0);
  });
  it('formats latencies', () => {
    expect(fmtReal(0.5)).toBe('0.5 ns');
    expect(fmtReal(2000)).toBe('2 µs');
    expect(fmtReal(150000000)).toBe('150 ms');
    expect(fmtHuman(150000000)).toBe('4.8 years');
    expect(fmtHuman(500000)).toBe('5.8 days');
    expect(barWidth(150000000)).toBe(100);
  });
  it('practice: only the security and cost cards open (reachable, default fails)', () => {
    expect(onlySecurityAndCost([])).toBe(false);
    expect(onlySecurityAndCost(toggleCard(toggleCard([], 3), 6))).toBe(true);
    expect(onlySecurityAndCost(toggleCard(toggleCard(toggleCard([], 3), 6), 0))).toBe(false);
  });
  it('practice numerics', () => {
    expect(allSucceed(0.99, 50) * 100).toBeCloseTo(60.5, 1);
    // 4 parallel independent calls, then 8 dependent ones, 80 ms each
    expect(criticalPathMs(80, 4, 8)).toBe(720);
    const ns = (name: string) => LATENCY.find(r => r.name === name)?.ns ?? NaN;
    expect(fitsIn(ns('Round trip California ↔ Netherlands'), ns('Main memory reference')) / 1e6).toBe(1.5);
    // 40 MB over 200 Mbps plus one 80 ms round trip
    expect((40 * 8 / 200) * 1000 + 80).toBe(1680);
  });
});
