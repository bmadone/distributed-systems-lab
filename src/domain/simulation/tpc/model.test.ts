import { abortMessages, abortTotalMessages, commitMessages, initialTpc, LAST_STEP, lockedCount, lockHoldMs, outcome, PNAMES, tpcReducer, type TpcState } from './model';

const runAll = (no: boolean, crash: boolean, s: TpcState = initialTpc()) => tpcReducer(s, { type: 'runAll', opts: { no, crash } });

describe('2PC model', () => {
  it('all YES commits everywhere', () => {
    const s = runAll(false, false);
    expect(s.step).toBe(LAST_STEP);
    expect(s.parts).toEqual(['committed', 'committed', 'committed']);
    expect(s.seen.commit).toBe(true);
  });
  it('one NO vote aborts, even if the coordinator would crash', () => {
    const s = runAll(true, true);
    expect(s.parts).toEqual(['aborted', 'aborted', 'aborted']);
    expect(s.seen).toEqual({ commit: false, abort: true, blocked: false, recovered: false });
  });
  it('a crash leaves participants in doubt until recovery aborts', () => {
    const blocked = runAll(false, true);
    expect(blocked.coord).toBe('crashed');
    expect(blocked.parts).toEqual(['in doubt', 'in doubt', 'in doubt']);
    const rec = tpcReducer(blocked, { type: 'recover' });
    expect(rec.parts).toEqual(['aborted', 'aborted', 'aborted']);
    expect(rec.seen.blocked && rec.seen.recovered).toBe(true);
    expect(tpcReducer(rec, { type: 'recover' })).toBe(rec);
  });
  it('stepping one at a time and reset keeps what was seen', () => {
    const opts = { no: false, crash: false };
    const s = [0, 1, 2, 3].reduce<TpcState>(acc => tpcReducer(acc, { type: 'step', opts }), initialTpc());
    expect(s.log).toHaveLength(3);
    const r = tpcReducer(s, { type: 'reset' });
    expect(r.step).toBe(0);
    expect(r.seen.commit).toBe(true);
  });
  it('the default does not solve any practice task', () => {
    expect(Object.values(initialTpc().seen).some(Boolean)).toBe(false);
  });

  it('message counts match the closed-form formulas', () => {
    const n = PNAMES.length;
    expect(runAll(false, false).msgs).toBe(commitMessages(n));
    expect(runAll(true, false).msgs).toBe(abortTotalMessages(n, 1));
    expect(runAll(true, false).msgs).toBe(10);
    expect(runAll(false, true).msgs).toBe(2 * n);
    const rec = tpcReducer(runAll(false, true), { type: 'recover' });
    expect(rec.msgs).toBe(12);
    expect(outcome(rec)).toBe('abort');
    expect(commitMessages(7)).toBe(28);
    expect(abortTotalMessages(6, 2)).toBe(20);
    expect(abortMessages(6, 2)).toBe(8);
    expect(2 * 8).toBe(16);
  });
  it('new lab tasks are reachable and the default solves none', () => {
    const d = initialTpc();
    expect(d.msgs).toBe(0);
    expect(outcome(d)).toBeNull();
    // both failures on: the NO vote wins, so the coordinator decides abort before it could crash
    const both = runAll(true, true);
    expect(outcome(both)).toBe('abort');
    // frozen after the votes: all three prepared and holding locks
    const opts = { no: false, crash: false };
    const mid = [0, 1].reduce<TpcState>(acc => tpcReducer(acc, { type: 'step', opts }), d);
    expect(mid.step).toBe(2);
    expect(lockedCount(mid)).toBe(3);
    expect(lockedCount(d)).toBe(0);
    expect(lockedCount(runAll(false, true))).toBe(3);
  });
  it('lock hold time equals twice the slowest one-way delay for everyone', () => {
    expect(lockHoldMs([10, 30, 50], 0)).toBe(100);
    expect(lockHoldMs([10, 30, 50], 2)).toBe(100);
  });
});
