import { adjust, analyze, fmtDur, initialAvail, normalize, parallel } from './model';

describe('availability model', () => {
  it('parallel replicas: 1 − (1 − A)^n', () => {
    expect(parallel(0.99, 2)).toBeCloseTo(0.9999, 10);
  });
  it('series tiers multiply', () => {
    expect(analyze(initialAvail).total).toBeCloseTo(0.9999 * 0.999 * 0.999 * 0.9995, 12);
  });
  it('clamps instance counts to 1..4', () => {
    expect(adjust(initialAvail, 0, -1).counts[0]).toBe(1);
    expect(normalize({ counts: [9, 1, 1, 1], degrade: false }).counts[0]).toBe(4);
  });
  it('graceful degradation drops the cache from the critical path and from weakest-link', () => {
    const a = analyze({ counts: [1, 1, 1, 1], degrade: true });
    expect(a.optional).toEqual([false, false, true, false]);
    expect(a.weakest).toBe(1);
  });
  it('task 1: 99.99% is reachable', () => {
    expect(analyze({ counts: [2, 2, 2, 2], degrade: false }).total).toBeGreaterThanOrEqual(0.9999);
  });
  it('task 2: 99.99% with ≤ 7 instances needs degradation', () => {
    const d = analyze({ counts: [2, 2, 1, 2], degrade: true });
    expect(d.total).toBeGreaterThanOrEqual(0.9999);
    expect(d.instances).toBeLessThanOrEqual(7);
    expect(analyze({ counts: [2, 2, 1, 2], degrade: false }).total).toBeLessThan(0.9999);
  });
  it('formats durations', () => {
    expect(fmtDur(43.2 * 60)).toBe('43.2 min');
    expect(fmtDur(2 * 86400)).toBe('2.0 days');
  });
  it('the default does not solve any practice task', () => {
    expect(analyze(initialAvail).total).toBeLessThan(0.9999);
  });
});

describe('availability: extra practice tasks', () => {
  const all = [false, true].flatMap(degrade => [1, 2, 3, 4].flatMap(a => [1, 2, 3, 4].flatMap(b => [1, 2, 3, 4].flatMap(c => [1, 2, 3, 4].map(d => ({ counts: [a, b, c, d], degrade }))))));
  const results = all.map(cfg => ({ cfg, r: analyze(cfg) }));
  const cheapest = (ok: (x: (typeof results)[number]) => boolean) => Math.min(...results.filter(ok).map(x => x.r.instances));

  it('99.95% with at most 6 instances is reachable, and needs degradation', () => {
    expect(analyze({ counts: [1, 2, 1, 2], degrade: true }).total).toBeGreaterThanOrEqual(0.9995);
    expect(cheapest(x => x.r.total >= 0.9995)).toBe(6);
    expect(cheapest(x => x.r.total >= 0.9995 && !x.cfg.degrade)).toBeGreaterThan(6);
  });
  it('99.98% with a single load balancer is reachable', () => {
    const r = analyze({ counts: [1, 2, 1, 2], degrade: true });
    expect(r.total).toBeGreaterThanOrEqual(0.9998);
    expect(initialAvail.counts[0]).toBe(1);
  });
  it('the load balancer can be made the weakest link while total >= 99.95%', () => {
    const r = analyze({ counts: [1, 2, 2, 2], degrade: false });
    expect(r.weakest).toBe(0);
    expect(r.total).toBeGreaterThanOrEqual(0.9995);
  });
  it('six nines needs 8 instances at best, and only with degradation', () => {
    expect(cheapest(x => x.r.total >= 0.999999)).toBe(8);
    expect(analyze({ counts: [2, 3, 1, 2], degrade: true }).total).toBeGreaterThanOrEqual(0.999999);
    expect(cheapest(x => x.r.total >= 0.999999 && !x.cfg.degrade)).toBeGreaterThan(8);
  });
  it('the default has weakest = app servers and solves none', () => {
    const r = analyze(initialAvail);
    expect(r.weakest).not.toBe(0);
    expect(r.total).toBeLessThan(0.9995);
  });
});
