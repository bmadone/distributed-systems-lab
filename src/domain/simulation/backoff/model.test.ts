import { sum } from '../../shared-kernel/fp';
import { CLIENTS, facts, histogram, peak, RETRIES, STRATEGIES } from './model';

describe('backoff model', () => {
  it('fixed and plain exponential retries arrive in synchronized spikes of every client', () => {
    expect(peak(histogram('fixed'))).toBe(CLIENTS);
    expect(peak(histogram('exp'))).toBe(CLIENTS);
    expect(histogram('fixed')[10]).toBe(CLIENTS);
  });

  it('full jitter has the lowest peak of all strategies (matches legacy ~291)', () => {
    const jitter = peak(histogram('jitter'));
    expect(jitter).toBe(291);
    STRATEGIES.filter(s => s.value !== 'jitter').forEach(s => expect(peak(histogram(s.value))).toBeGreaterThan(jitter));
  });

  it('is deterministic and counts every retry inside the window', () => {
    expect(histogram('jitter')).toEqual(histogram('jitter'));
    expect(sum(histogram('fixed'))).toBe(CLIENTS * RETRIES);
  });

  it('the default strategy does not solve the practice task', () => {
    const lowest = STRATEGIES.reduce((a, b) => (peak(histogram(b.value)) < peak(histogram(a.value)) ? b : a));
    expect(lowest.value).toBe('jitter');
    expect(STRATEGIES[0]?.value).not.toBe('jitter');
  });

  describe('extra practice tasks are reachable', () => {
    const none = ['fixed'] as const;
    it('the default facts satisfy none of them', () => {
      const f = facts('fixed', 4, 0, none);
      expect(f.visited.length).toBeLessThan(3);
      expect(f.total).toBe(f.retries * CLIENTS);
      expect(f.peak).toBe(CLIENTS);
    });
    it('jitter with a single retry per client keeps the peak under 250', () => {
      expect(facts('jitter', 1, 0, none).peak).toBeLessThan(250);
      expect(facts('jitter', 2, 0, none).peak).toBeGreaterThanOrEqual(250);
      expect(facts('jitter', 4, 0, none).peak).toBeGreaterThanOrEqual(250);
    });
    it('6 uncapped exponential retries: some never land inside the 8 s window', () => {
      const f = facts('exp', 6, 0, none);
      expect(f.total).toBeLessThan(6 * CLIENTS);
      expect(f.total).toBe(5000);
    });
    it('a 1 s cap keeps all 6 exponential retries inside the window', () => {
      const f = facts('exp', 6, 1, none);
      expect(f.total).toBe(6 * CLIENTS);
    });
  });

  describe('numeric practice answers', () => {
    const delay = (baseMs: number, k: number, capMs: number) => Math.min(capMs, baseMs * 2 ** (k - 1));
    it('capped exponential delays', () => {
      expect(delay(200, 9, 5000)).toBe(5000);
      expect(delay(200, 5, 5000)).toBe(3200);
      expect([1, 2, 3, 4, 5, 6].reduce((a, k) => a + delay(100, k, 1000), 0)).toBe(3500);
    });
    it('expected total wait with full jitter', () => {
      // each wait is uniform in [0, base * 2^k], mean half of it
      expect([0, 1, 2, 3].reduce((a, k) => a + (250 * 2 ** k) / 2, 0)).toBe(1875);
    });
    it('retry amplification and availability', () => {
      expect((1 + 3) ** 3).toBe(64);
      expect(0.999 ** 3 * 100).toBeCloseTo(99.7003, 4);
      expect(-Math.log10(1 - (1 - (1 - 0.999) ** 2))).toBeCloseTo(6, 9);
      expect(365 * 24 * 60 * 0.0005).toBeCloseTo(262.8, 6);
      expect(500 * 0.1).toBe(50);
    });
  });
});
