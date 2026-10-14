import { FANOUT, initialFanout, slowShare, smallestFanoutAbove, tone } from './model';

const task = (n: number) => n === 69;

describe('tail latency model', () => {
  it('matches 1 − 0.99^n', () => {
    expect(slowShare(1)).toBeCloseTo(0.01, 10);
    expect(slowShare(100)).toBeCloseTo(0.634, 3);
  });
  it('69 is the smallest fan-out where more than half of requests are slow (the practice answer)', () => {
    expect(smallestFanoutAbove(0.5)).toBe(69);
    expect(slowShare(68)).toBeLessThan(0.5);
    expect(slowShare(69)).toBeGreaterThan(0.5);
    expect(69).toBeGreaterThanOrEqual(FANOUT.min);
    expect(69).toBeLessThanOrEqual(FANOUT.max);
  });
  it('tones follow the legacy thresholds', () => {
    expect([tone(0.05), tone(0.3), tone(0.6)]).toEqual(['good', 'warn', 'bad']);
  });
  it('the default does not solve the practice task', () => {
    expect(task(initialFanout)).toBe(false);
  });
});
