import { range } from '../../shared-kernel/fp';
import { analyze, initialConfig, normalize, toggleDown } from './model';

describe('quorum model', () => {
  it('detects overlap via R + W > N', () => {
    expect(analyze({ N: 3, W: 2, R: 2, down: [] }).overlap).toBe(true);
    expect(analyze({ N: 3, W: 1, R: 1, down: [] }).overlap).toBe(false);
    expect(analyze({ N: 5, W: 4, R: 2, down: [] }).overlap).toBe(true);
  });
  it('worst-case read avoids the write set when it can', () => {
    const a = analyze({ N: 3, W: 1, R: 1, down: [] });
    expect(a.writeSet).toEqual([0]);
    expect(a.readSet).not.toContain(0);
  });
  it('writes fail before reads when W > R and replicas fail', () => {
    const c = toggleDown(toggleDown({ N: 3, W: 3, R: 1, down: [] }, 2), 1);
    const a = analyze(c);
    expect(a.canW).toBe(false);
    expect(a.canR).toBe(true);
  });
  it('latency is the k-th fastest live replica', () => {
    expect(analyze({ N: 5, W: 3, R: 3, down: [] }).writeMs).toBe(9);
    expect(analyze({ N: 5, W: 3, R: 3, down: [0] }).writeMs).toBe(64);
  });
  it('normalize clamps W, R and drops failed replicas beyond N', () => {
    expect(normalize({ N: 2, W: 5, R: 3, down: [1, 4] })).toEqual({ N: 2, W: 2, R: 2, down: [1] });
  });
  it('the default does not solve any practice task', () => {
    const a = analyze(initialConfig);
    expect(a.overlap).toBe(false);
    expect(a.canW && a.canR).toBe(true);
  });

  it('new lab tasks are reachable', () => {
    // N = 7: consistent reads, writes and reads each survive 3 failures
    const a = analyze({ N: 7, W: 4, R: 4, down: [] });
    expect(a.overlap && 7 - 4 >= 3).toBe(true);
    // N = 5: write latency under 10 ms while 2W > N
    const b = analyze({ N: 5, W: 3, R: 3, down: [] });
    expect(b.writesIntersect).toBe(true);
    expect(b.writeMs).toBe(9);
    // N = 5, W = 3: fail r1 and r2, writes still work but slow
    const c = analyze({ N: 5, W: 3, R: 3, down: [0, 1] });
    expect(c.canW).toBe(true);
    expect(c.writeMs).toBe(82);
    // N = 5, W = 1, R = 5 is consistent
    expect(analyze({ N: 5, W: 1, R: 5, down: [] }).overlap).toBe(true);
    // none of these is the default
    expect(initialConfig).toEqual({ N: 3, W: 1, R: 1, down: [] });
  });
  it('numeric practice answers', () => {
    // N = 7, R = 3: smallest overlapping W is 5, tolerating 2 write failures
    const w = range(7).map(i => i + 1).find(W => analyze({ N: 7, W, R: 3, down: [] }).overlap);
    expect(w).toBe(5);
    expect(7 - 5).toBe(2);
    // N = 7, W = 5, r1 down: write latency is the 5th fastest live replica
    expect(analyze({ N: 7, W: 5, R: 1, down: [0] }).writeMs).toBe(128);
    // N = 6, W = 4, R = 3, r2 and r3 down: read latency is the 3rd fastest live replica
    const r = analyze({ N: 6, W: 4, R: 3, down: [1, 2] });
    expect(r.readMs).toBe(82);
    expect(r.canW).toBe(true);
    // pairs (W, R) with R + W > N for N = 5
    const pairs = range(5).flatMap(i => range(5).map(j => analyze({ N: 5, W: i + 1, R: j + 1, down: [] }).overlap)).filter(Boolean);
    expect(pairs).toHaveLength(15);
    // N = 9, W = 6, R = 5 share at least 2 replicas
    expect(5 + 6 - 9).toBe(2);
  });
});
