import { capReducer, component, diverged, groups, initialCap, networkMessage, path, STEPS, type CapAction, type CapState } from './model';

const run = (actions: readonly CapAction[], s: CapState = initialCap()): CapState => actions.reduce(capReducer, s);

describe('cap model', () => {
  it('reachability follows connected components', () => {
    const oneCut = { AB: false, AC: true, BC: true };
    expect(component(oneCut, 'A')).toEqual(['A', 'B', 'C']);
    expect(path(oneCut, 'A', 'B')).toEqual(['A', 'C', 'B']);
    expect(groups({ AB: true, AC: false, BC: false })).toEqual([['A', 'B'], ['C']]);
    expect(networkMessage(oneCut)).toBe('One link is cut, but every node can still reach the others through a detour.');
    expect(networkMessage({ AB: true, AC: false, BC: false })).toBe('Partition: {A, B} | {C} can’t reach each other.');
    expect(networkMessage({ AB: false, AC: false, BC: false })).toBe('Every link is cut. Each node is alone.');
  });

  it('a CP write with one link cut (a detour exists) is not a partitioned write', () => {
    const s = run([{ type: 'toggleLink', link: 'AB' }, { type: 'write', node: 'A' }]);
    expect(s.cpMajorityWrite).toBe(false);
    expect(s.nodes.B.ts).toBe(2);
  });

  it('CP refuses on the minority side and accepts on the majority', () => {
    const s = run([{ type: 'preset', preset: 'isoC' }, { type: 'write', node: 'C' }, { type: 'write', node: 'A' }, { type: 'read', node: 'C' }]);
    expect(s.stats.rejected).toBe(2);
    expect(s.cpMajorityWrite).toBe(true);
    expect(s.nodes.C.ts).toBe(1);
    expect(s.nodes.B.ts).toBe(2);
  });

  it('the guided experiment reaches step 7 and AP loses a confirmed write', () => {
    const steps: number[] = [];
    const actions: readonly CapAction[] = [
      { type: 'write', node: 'A' }, { type: 'preset', preset: 'isoC' }, { type: 'write', node: 'C' },
      { type: 'write', node: 'A' }, { type: 'read', node: 'C' }, { type: 'mode', mode: 'AP' },
      { type: 'write', node: 'C' }, { type: 'read', node: 'A' }, { type: 'preset', preset: 'healthy' },
    ];
    const s = actions.reduce((acc, a) => { const n = capReducer(acc, a); steps.push(n.step); return n; }, initialCap());
    expect(steps).toEqual([1, 2, 3, 3, 4, 4, 5, 6, 7]);
    expect(s.step).toBe(STEPS.length);
    expect(s.stats.lost).toBe(1);
    expect(s.log[1]?.tag).toBe('lost');
    expect(new Set([s.nodes.A.ts, s.nodes.B.ts, s.nodes.C.ts])).toEqual(new Set([4]));
  });

  it('step 4 needs a partitioned majority write, not just the refused read on C', () => {
    const s = run([{ type: 'write', node: 'A' }, { type: 'preset', preset: 'isoC' }, { type: 'write', node: 'C' }, { type: 'read', node: 'C' }]);
    expect(s.step).toBe(3);
  });

  it('reset returns to the initial state', () => {
    const s = run([{ type: 'mode', mode: 'AP' }, { type: 'write', node: 'B' }, { type: 'reset' }]);
    expect({ ...s, fx: null }).toEqual({ ...initialCap(), fx: null });
  });

  it('the default does not solve any practice task', () => {
    const s = initialCap();
    expect(s.step).toBe(0);
    expect(s.cpMajorityWrite).toBe(false);
    expect(s.stats.lost).toBe(0);
  });

  it('new lab tasks are reachable', () => {
    // stale read in AP
    const stale = run([{ type: 'mode', mode: 'AP' }, { type: 'preset', preset: 'isoC' }, { type: 'write', node: 'A' }, { type: 'read', node: 'C' }]);
    expect(stale.stats.stale).toBe(1);
    // diverged right now
    const div = run([{ type: 'mode', mode: 'AP' }, { type: 'preset', preset: 'isoC' }, { type: 'write', node: 'C' }, { type: 'write', node: 'A' }]);
    expect(diverged(div)).toBe(true);
    expect(diverged(initialCap())).toBe(false);
    // three refusals in CP with every link cut
    const refused = run([{ type: 'preset', preset: 'split' }, { type: 'write', node: 'A' }, { type: 'write', node: 'B' }, { type: 'write', node: 'C' }]);
    expect(refused.stats.rejected).toBe(3);
    expect(refused.mode).toBe('CP');
    // two confirmed writes lost: one write per node while fully cut, then heal
    const lost2 = run([
      { type: 'mode', mode: 'AP' }, { type: 'preset', preset: 'split' },
      { type: 'write', node: 'A' }, { type: 'write', node: 'B' }, { type: 'write', node: 'C' }, { type: 'preset', preset: 'healthy' },
    ]);
    expect(lost2.stats.lost).toBe(2);
  });
  it('numeric practice answers', () => {
    // of the 8 link combinations, those that split the three nodes
    const combos = [true, false].flatMap(ab => [true, false].flatMap(ac => [true, false].map(bc => ({ AB: ab, AC: ac, BC: bc }))));
    expect(combos.filter(l => groups(l).length > 1)).toHaveLength(4);
    // n nodes, each accepting one write while fully cut: LWW keeps one, so n - 1 lost (checked for n = 3 above)
    expect(7 - 1).toBe(6);
    // majority of 5 with RTTs 0, 10, 40, 90, 150 is the 3rd fastest
    expect([0, 10, 40, 90, 150].sort((a, b) => a - b)[Math.floor(5 / 2)]).toBe(40);
    // 9-node majority is 5, so 4 failures are tolerated
    expect(9 - (Math.floor(9 / 2) + 1)).toBe(4);
    // 9 nodes split 4 | 3 | 2: no group reaches 5
    expect([4, 3, 2].filter(g => g >= 5).length).toBe(0);
  });
});
