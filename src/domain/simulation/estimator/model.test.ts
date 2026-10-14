import { dauOf, estimate, fmtB, fmtN, initialConfig, RANGES } from './model';

const task = (peak: number) => peak > 100000;

describe('estimator model', () => {
  it('maps the log slider to DAU', () => {
    expect([dauOf(0), dauOf(40), dauOf(60), dauOf(100)]).toEqual([1e4, 1e6, 1e7, 1e9]);
  });
  it('100M DAU × 10 requests a day ≈ 11.6k average QPS', () => {
    const e = estimate({ dauStep: 80, writesPerUser: 10, readsPerWrite: 1, kbPerWrite: 1, peakFactor: 1, years: 1 });
    expect(e.writeQps).toBeCloseTo(11574, 0);
  });
  it('1M uploads a day at 2 MB is 730 TB a year', () => {
    const e = estimate({ dauStep: 40, writesPerUser: 1, readsPerWrite: 1, kbPerWrite: 2000, peakFactor: 1, years: 1 });
    expect(fmtB(e.bytesPerYear)).toBe('730 TB');
  });
  it('the peak-QPS task is reachable', () => {
    const e = estimate({ ...initialConfig, dauStep: RANGES.dauStep.max });
    expect(task(e.peakQps)).toBe(true);
    expect(e.advice[0]).toMatch(/many stateless servers/);
  });
  it('the default does not solve the practice task', () => {
    const e = estimate(initialConfig);
    expect(task(e.peakQps)).toBe(false);
    expect(fmtN(e.peakQps)).toBe('14.6k');
  });
  it('formats like the legacy helpers', () => {
    expect([fmtN(999.6), fmtN(1000), fmtN(1250000), fmtN(3e9)]).toEqual(['1000', '1k', '1.3M', '3B']);
    expect([fmtB(999), fmtB(1000), fmtB(123456789), fmtB(1e21)]).toEqual(['999 B', '1.0 KB', '123 MB', '1000 EB']);
  });
});
