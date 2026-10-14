import { estimate, type EstimatorConfig } from '../../simulation/estimator/model';
import lesson from './sd-interview';
import type { Signals } from '../signals';

const sig = (c: EstimatorConfig): Signals => {
  const e = estimate(c);
  return { estimator: { peak: e.peakQps, writeQps: e.writeQps, readQps: e.readQps, bytesPerYear: e.bytesPerYear, bytesTotal: e.bytesTotal, egressBps: e.egressBps, readsPerWrite: c.readsPerWrite, kbPerWrite: c.kbPerWrite, years: c.years } };
};
const task = (needle: string) => {
  const t = lesson.practice.find(p => p.kind === 'task' && p.text.includes(needle));
  if (t?.kind !== 'task') throw new Error(`no task: ${needle}`);
  return t.check;
};
const base: EstimatorConfig = { dauStep: 60, writesPerUser: 2, readsPerWrite: 20, kbPerWrite: 10, peakFactor: 3, years: 5 };

describe('sd-interview practice', () => {
  it('new estimator tasks are reachable', () => {
    expect(task('at least 100 reads per write')(sig({ ...base, dauStep: 0, readsPerWrite: 100, peakFactor: 1 }))).toBe(true);
    expect(task('1 GB/s')(sig({ ...base, dauStep: 80, kbPerWrite: 100 }))).toBe(true);
    expect(task('over 1 PB')(sig({ dauStep: 70, writesPerUser: 1, readsPerWrite: 1, kbPerWrite: 5000, peakFactor: 1, years: 10 }))).toBe(true);
    expect(task('high-QPS')(sig({ dauStep: 46, writesPerUser: 1, readsPerWrite: 200, kbPerWrite: 1, peakFactor: 3, years: 1 }))).toBe(true);
  });
  it('defaults solve no lab task', () => {
    const s = sig(base);
    lesson.practice.forEach(t => { if (t.kind === 'task') expect(t.check(s)).toBe(false); });
  });
  it('numeric answers match plain math', () => {
    const day = 86400;
    const computed = [
      (1e8 * 10) / day,
      (1e6 * 2e6 * 365) / 1e12,
      (20e6 * 5 / day) * 4,
      (50e6 * 2 * 1000 * 365 * 3) / 1e12,
      3500 * 300e3 * 8 / 1e9,
      Math.ceil(60000 / (2500 * 0.6)),
      0.2 * 50e6 * 2000 / 1e9,
    ];
    const nums = lesson.practice.flatMap(p => (p.kind === 'num' ? [p] : []));
    expect(nums).toHaveLength(computed.length);
    nums.forEach((n, i) => expect(Math.abs(n.answer - (computed[i] ?? NaN))).toBeLessThanOrEqual(n.tol));
  });
});
