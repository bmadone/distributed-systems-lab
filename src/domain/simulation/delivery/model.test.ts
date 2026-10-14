import { range } from '../../shared-kernel/fp';
import { dupProbability, initialState, neverAcked, roundTripSuccess, runBatch, sendPayment, step } from './model';

describe('delivery model', () => {
  it('is deterministic for a seed and counts every payment once', () => {
    const a = runBatch({ strategy: 'retry', loss: 30, n: 100 }, 42);
    expect(runBatch({ strategy: 'retry', loss: 30, n: 100 }, 42)).toEqual(a);
    expect(a.ok + a.lost + a.dup).toBe(100);
    expect(a.logs.length).toBeLessThanOrEqual(6);
  });
  it('at-most-once never duplicates and never retries', () => {
    const b = runBatch({ strategy: 'once', loss: 40, n: 200 }, 1);
    expect(b.dup).toBe(0);
    expect(b.lost).toBeGreaterThan(0);
  });
  it('idempotency keys never charge twice', () => {
    range(20).forEach(seed => expect(runBatch({ strategy: 'idem', loss: 60, n: 200 }, seed).dup).toBe(0));
  });
  it('without loss everything goes through first time', () => {
    const pay = sendPayment('retry', 0, 9);
    expect(pay).toMatchObject({ processed: 1, acked: true, tries: 1 });
  });
  it('the default state solves no task', () => {
    expect(initialState.batch).toBeNull();
    expect(initialState.everDup).toBe(false);
  });
  it('task 1 is reachable: plain retry produces a duplicate and everDup sticks', () => {
    const s1 = step(initialState, { type: 'run', settings: { strategy: 'retry', loss: 20, n: 50 }, seed: 3 });
    expect(s1.everDup).toBe(true);
    const s2 = step(s1, { type: 'run', settings: { strategy: 'once', loss: 0, n: 10 }, seed: 3 });
    expect(s2.everDup).toBe(true);
  });
  it('task 2 is reachable: ≥30% loss, ≥50 payments, idempotent retries give 0 lost and 0 dup', () => {
    const b = runBatch({ strategy: 'idem', loss: 30, n: 50 }, 5);
    expect(b.loss >= 30 && b.n >= 50 && b.lost === 0 && b.dup === 0).toBe(true);
  });
  // New practice tasks, from the lesson wording. Thresholds are loose enough that they hold for every seed tried.
  const seeds = range(60);
  it('new lab tasks are reachable and robust across seeds', () => {
    expect(seeds.every(s => runBatch({ strategy: 'once', loss: 50, n: 100 }, s).lost >= 30)).toBe(true);
    expect(seeds.every(s => { const b = runBatch({ strategy: 'retry', loss: 20, n: 100 }, s); return b.lost === 0 && b.dup >= 5; })).toBe(true);
    expect(seeds.every(s => { const b = runBatch({ strategy: 'idem', loss: 60, n: 100 }, s); return b.dup === 0 && b.unk >= 10; })).toBe(true);
  });
  it('the defaults satisfy none of the new tasks (no batch yet)', () => {
    expect(initialState.batch).toBeNull();
  });
  it('numeric tasks', () => {
    expect(1 / roundTripSuccess(0.3)).toBeCloseTo(2.04, 2);
    expect(neverAcked(0.3) * 100).toBeCloseTo(0.46, 2);
    expect((5000 * 86400 * 40) / 1e9).toBeCloseTo(17.28, 2);
    expect(dupProbability(0.25) * 10000).toBeCloseTo(2499, 0);
  });
  it('dupProbability matches the simulation', () => {
    const b = runBatch({ strategy: 'retry', loss: 25, n: 20000 }, 1);
    expect(Math.abs(b.dup / 20000 - dupProbability(0.25))).toBeLessThan(0.01);
  });
});
