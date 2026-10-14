import { analyze, callAvail, initialChain, setMode, setRetry, type ChainAnalysis } from './model';

const task = (a: ReturnType<typeof analyze>) => a.paymentSync && a.avail >= 0.994 && a.latency < 150;

describe('call chain model', () => {
  it('all synchronous: availability multiplies, latency adds', () => {
    const a = analyze(initialChain);
    expect(a.avail).toBeCloseTo(0.9999 * 0.995 ** 4, 12);
    expect(a.latency).toBe(340);
  });
  it('async calls add the queue once', () => {
    const a = analyze(setMode(setMode(initialChain, 2, false), 3, false));
    expect(a.syncN).toBe(2);
    expect(a.latency).toBe(20 + 160 + 5);
  });
  it('task is reachable: only Payment synchronous', () => {
    const c = [1, 2, 3].reduce((acc, i) => setMode(acc, i, false), initialChain);
    expect(task(analyze(c))).toBe(true);
  });
  it('making Payment async does not count', () => {
    const c = [0, 1, 2, 3].reduce((acc, i) => setMode(acc, i, false), initialChain);
    expect(task(analyze(c))).toBe(false);
  });
  it('the default does not solve any practice task', () => {
    expect(task(analyze(initialChain))).toBe(false);
  });
});

const withModes = (modes: readonly boolean[], retry: boolean) => setRetry(modes.reduce((acc, m, i) => setMode(acc, i, m), initialChain), retry);

const t1 = (a: ChainAnalysis) => a.syncN === 2 && a.paymentSync && a.avail >= 0.989;
const t2 = (a: ChainAnalysis) => a.syncN === 0 && a.latency < 30;
const t3 = (a: ChainAnalysis) => a.syncN === 4 && a.avail >= 0.999 && a.worstLatency > a.latency;
const t4 = (a: ChainAnalysis) => a.paymentSync && a.syncN === 1 && a.avail >= 0.9995 && a.worstLatency < 200;
const t5 = (a: ChainAnalysis) => a.paymentSync && a.syncN === 2 && a.avail >= 0.9995 && a.worstLatency < 350;

describe('call chain: retries and extra tasks', () => {
  it('a retry gives a call two chances', () => {
    expect(callAvail(false)).toBe(0.995);
    expect(callAvail(true)).toBeCloseTo(1 - 0.005 ** 2, 12);
  });
  it('worst-case latency doubles the synchronous part when retrying', () => {
    const a = analyze(withModes([true, true, true, true], true));
    expect(a.latency).toBe(340);
    expect(a.worstLatency).toBe(20 + 640);
    expect(analyze(initialChain).worstLatency).toBe(340);
  });
  it('task 1: exactly two sync (Payment among them) with availability >= 98.9%', () => {
    expect(t1(analyze(withModes([true, true, false, false], false)))).toBe(true);
    expect(t1(analyze(withModes([true, false, false, false], false)))).toBe(false);
  });
  it('task 2: everything async answers in under 30 ms', () => {
    expect(t2(analyze(withModes([false, false, false, false], false)))).toBe(true);
  });
  it('task 3: all four sync plus retries reaches 99.9%, and it is impossible without retries', () => {
    expect(t3(analyze(withModes([true, true, true, true], true)))).toBe(true);
    expect(t3(analyze(withModes([true, true, true, true], false)))).toBe(false);
  });
  it('task 4: Payment-only sync with retries is the only way to hit 99.95% under 200 ms worst case', () => {
    expect(t4(analyze(withModes([true, false, false, false], true)))).toBe(true);
    expect(t4(analyze(withModes([true, false, false, false], false)))).toBe(false);
    expect(t4(analyze(withModes([true, true, false, false], true)))).toBe(false);
  });
  it('task 5: Payment + one more sync with retries fits 350 ms worst case at 99.95%', () => {
    const ok = [1, 2, 3].filter(i => t5(analyze(withModes([true, ...[1, 2, 3].map(j => j === i)], true))));
    expect(ok).toEqual([1, 2, 3]);
    expect(t5(analyze(withModes([true, true, false, false], false)))).toBe(false);
  });
  it('the default solves none of the new tasks', () => {
    const a = analyze(initialChain);
    expect([t1, t2, t3, t4, t5].some(t => t(a))).toBe(false);
  });
});
