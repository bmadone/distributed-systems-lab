import { simulate, type CacheConfig } from '../../simulation/cache/model';
import lesson from './sd-scaling';
import type { Signals } from '../signals';

const sig = (c: CacheConfig): Signals => {
  const a = simulate(c);
  return { cache: { size: a.size, skew: a.skew, hit: a.hit, ideal: a.ideal, latencyMs: a.latencyMs, dbPer1000: a.dbPer1000 } };
};
const task = (needle: string) => {
  const t = lesson.practice.find(p => p.kind === 'task' && p.text.includes(needle));
  if (t?.kind !== 'task') throw new Error(`no task: ${needle}`);
  return t.check;
};

describe('sd-scaling practice', () => {
  it('new cache tasks are reachable with slider values', () => {
    expect(task('below <b>4 ms</b>')(sig({ size: 200, skew: 1.3 }))).toBe(true);
    expect(task('below <b>100 queries')(sig({ size: 500, skew: 1.2 }))).toBe(true);
    expect(task('largest cache')(sig({ size: 600, skew: 0.4 }))).toBe(true);
    expect(task('no more than 30</b>')(sig({ size: 30, skew: 1.4 }))).toBe(true);
    expect(task('short</b> of the best')(sig({ size: 100, skew: 0.4 }))).toBe(true);
  });
  it('the default solves no lab task', () => {
    const s = sig({ size: 50, skew: 1 });
    lesson.practice.forEach(t => { if (t.kind === 'task') expect(t.check(s)).toBe(false); });
  });
  it('numeric answers match plain math', () => {
    const hit = 0.85, mulMiss = 1 * hit + 21 * (1 - hit);
    const expected = [mulMiss, 36000 * (1 - 0.92), Math.ceil(45 / 8) * 3, 500 / (320 - 120), 3000 * 4];
    const nums = lesson.practice.flatMap(p => (p.kind === 'num' ? [p] : []));
    expect(nums).toHaveLength(expected.length);
    nums.forEach((n, i) => expect(Math.abs(n.answer - (expected[i] ?? NaN))).toBeLessThanOrEqual(n.tol));
  });
});
