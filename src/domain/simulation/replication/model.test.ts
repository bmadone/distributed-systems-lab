import { initialConfig, LAG, READ, timeline, type Config } from './model';

// Practice-task predicates, from the lesson wording.
const staleTask = (c: Config) => c.mode === 'async' && timeline(c).stale;
const lostTask = (c: Config) => c.mode === 'async' && c.crash && timeline(c).lost;
const syncCrashTask = (c: Config) => c.mode === 'sync' && c.crash;

describe('replication model', () => {
  it('default: async, read at 140 ms returns the new value', () => {
    const t = timeline(initialConfig);
    expect(initialConfig.read).toBe(140);
    expect(t.tC).toBe(125);
    expect(t.value).toBe(1);
    expect(t.stale).toBe(false);
  });
  it('the default solves no task', () => {
    expect(staleTask(initialConfig)).toBe(false);
    expect(lostTask(initialConfig)).toBe(false);
    expect(syncCrashTask(initialConfig)).toBe(false);
  });
  it('async read before C catches up but after the ack is stale (task 1)', () => {
    const c = { ...initialConfig, read: 100 };
    expect(staleTask(c)).toBe(true);
    expect(timeline(c).verdicts[1]?.title).toBe('Stale read: not linearizable');
  });
  it('a read before the ack returning 0 is allowed, not stale', () => {
    const t = timeline({ ...initialConfig, read: 5 });
    expect(t.value).toBe(0);
    expect(t.stale).toBe(false);
    expect(t.verdicts[1]?.tone).toBe('info');
  });
  it('async + crash loses a confirmed write (task 2)', () => {
    const c = { ...initialConfig, crash: true };
    const t = timeline(c);
    expect(lostTask(c)).toBe(true);
    expect(t.okLabel).toBe('OK sent at 6 ms, received at 10 ms');
    expect(t.verdicts[1]?.detail).toBe('A sent OK at 6 ms (the client got it at 10 ms), then crashed at 8 ms before shipping x=1. B was promoted without it.');
  });
  it('sync + crash never confirms (task 3)', () => {
    const c: Config = { ...initialConfig, mode: 'sync', crash: true };
    const t = timeline(c);
    expect(syncCrashTask(c)).toBe(true);
    expect(t.ack).toBeNull();
    expect(t.lost).toBe(false);
    expect(t.stale).toBe(false);
    expect(t.verdicts[0]?.title).toBe('Write never confirmed');
  });
  it('sync without crash confirms after C', () => {
    const t = timeline({ ...initialConfig, mode: 'sync' });
    expect(t.ack).toBe(130);
    expect(t.okLabel).toBe('OK at 130 ms');
  });
  // New practice tasks, from the lesson wording.
  const readAllowed = (c: Config) => { const t = timeline(c); return c.mode === 'sync' && !c.crash && t.value === 0 && !t.stale; };
  const slowSync = (c: Config) => { const t = timeline(c); return c.mode === 'sync' && !c.crash && t.ack !== null && t.ack >= 150; };
  const minLagStale = (c: Config) => c.mode === 'async' && c.lag === 20 && timeline(c).stale;
  const slider = (r: { readonly min: number; readonly max: number; readonly step: number }) => Array.from({ length: (r.max - r.min) / r.step + 1 }, (_, i) => r.min + i * r.step);
  it('new lab tasks are reachable via the sliders and not solved by the default', () => {
    [readAllowed, slowSync, minLagStale].forEach(t => expect(t(initialConfig)).toBe(false));
    expect(slider(READ).some(read => readAllowed({ ...initialConfig, mode: 'sync', read }))).toBe(true);
    expect(slider(LAG).some(lag => slowSync({ ...initialConfig, mode: 'sync', lag }))).toBe(true);
    expect(slider(READ).some(read => minLagStale({ ...initialConfig, lag: 20, read }))).toBe(true);
  });
  it('sync ack is lag + 10 ms', () => {
    expect(timeline({ ...initialConfig, mode: 'sync', lag: 140 }).ack).toBe(150);
    expect(timeline({ ...initialConfig, mode: 'sync', lag: 135 }).ack).toBe(145);
  });
  it('numeric tasks', () => {
    expect(5 + ([30, 70, 180].sort((a, b) => a - b)[1] ?? 0)).toBe(75);
    expect((20 - 18) * 600 / 18).toBeCloseTo(66.7, 1);
    expect(0.22 * 1800).toBeCloseTo(396, 5);
    expect(((200 - 50) / 200) * 100).toBe(75);
    expect(0.15 * 4000).toBeCloseTo(600, 5);
  });
});
