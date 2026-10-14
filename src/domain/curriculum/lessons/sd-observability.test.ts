import { analyze } from '../../simulation/amdahl/model';
import { slowShare, smallestFanoutAbove } from '../../simulation/tail/model';
import lesson from './sd-observability';
import type { Signals } from '../signals';

const tail = (n: number, slowP: number): Signals => ({ tailLatency: { n, slowP, p: slowShare(n, slowP) } });
const am = (parallelPct: number, cores: number): Signals => {
  const a = analyze({ parallelPct, cores });
  return { amdahl: { parallelPct, cores, speedup: a.speedup, efficiency: a.efficiency, serialPct: a.serialPct } };
};
const checks = lesson.practice.flatMap(p => (p.kind === 'task' ? [p.check] : []));
const task = (needle: string) => {
  const t = lesson.practice.find(p => p.kind === 'task' && p.text.includes(needle));
  if (t?.kind !== 'task') throw new Error(`no task: ${needle}`);
  return t.check;
};

describe('sd-observability practice', () => {
  it('tail tasks are reachable and match the model', () => {
    expect(smallestFanoutAbove(0.5, 0.02)).toBe(35);
    expect(smallestFanoutAbove(0.5, 0.01)).toBe(69);
    expect(task('Find the smallest fan-out')(tail(69, 0.01))).toBe(true);
    expect(task('0.1% slow')(tail(100, 0.001))).toBe(true);
    expect(slowShare(28, 0.01)).toBeLessThan(0.25);
    expect(slowShare(29, 0.01)).toBeGreaterThan(0.25);
    expect(task('largest</b> fan-out')(tail(28, 0.01))).toBe(true);
    expect(task('2% of the time')(tail(35, 0.02))).toBe(true);
    expect(task('0.5% slow')(tail(139, 0.005))).toBe(true);
    expect(slowShare(138, 0.005)).toBeLessThan(0.5);
  });
  it('amdahl tasks are reachable', () => {
    expect(task('exactly <b>5%</b>')(am(95, 8))).toBe(true);
    expect(task('no more than 5 cores')(am(95, 5))).toBe(true);
    expect(task('above 90%')(am(99, 8))).toBe(true);
    expect(task('128 cores')(am(90, 128))).toBe(true);
  });
  it('defaults solve nothing', () => {
    const s: Signals = { ...tail(10, 0.01), ...am(90, 8) };
    checks.forEach(c => expect(c(s)).toBe(false));
  });
  it('numeric answers match plain math', () => {
    const p = (16 / 15) * (1 - 1 / 8) * 100;
    const computed = [(1 - 0.99 ** 50) * 100, analyze({ parallelPct: 95, cores: 32 }).speedup, p, 43200 * 0.0005, (0.001 / 0.005) * 30];
    const added = lesson.practice.flatMap(t => (t.kind === 'num' ? [t] : [])).slice(2);
    expect(added).toHaveLength(computed.length);
    added.forEach((n, i) => expect(Math.abs(n.answer - (computed[i] ?? NaN))).toBeLessThanOrEqual(n.tol));
    expect(analyze({ parallelPct: 93.3, cores: 16 }).speedup).toBeCloseTo(8, 1);
  });
});
