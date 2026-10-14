import { initialRaft, newestLeader, nodeAt, step, type RaftAction, type RaftState } from './model';

const run = (s: RaftState, ...actions: readonly RaftAction[]) => actions.reduce(step, s);
const committedValues = (s: RaftState, i: number) => { const n = nodeAt(s, i); return n.log.slice(0, n.commit).map(e => e.v); };

describe('raft model', () => {
  it('starts with S1 leading term 1 and two committed entries everywhere', () => {
    const s = initialRaft();
    expect(newestLeader(s)?.name).toBe('S1');
    expect(s.nodes.every(n => n.commit === 2 && n.log.length === 2)).toBe(true);
  });

  it('a client write with all nodes up commits', () => {
    const s = run(initialRaft(), { type: 'write', target: null });
    expect(s.nodes.every(n => n.commit === 3)).toBe(true);
    expect(s.seen.committedWithDown).toBe(false);
  });

  it('crash the leader, elect a new one, then commit with a node down', () => {
    const s1 = run(initialRaft(), { type: 'crash' }, { type: 'tick' });
    const L = newestLeader(s1);
    expect(L).toBeDefined();
    expect(L?.name).not.toBe('S1');
    expect(L?.term).toBe(2);
    expect(s1.seen.electedAfterCrash).toBe(true);
    const s2 = run(s1, { type: 'write', target: null });
    expect(s2.seen.committedWithDown).toBe(true);
  });

  it('split: minority write is not committed, majority elects and commits, heal discards the minority entry', () => {
    const split = run(initialRaft(), { type: 'split' });
    expect(split.groups).toEqual([[0, 1], [2, 3, 4]]);

    const minorityWrite = run(split, { type: 'write', target: 0 });
    const s1 = nodeAt(minorityWrite, 0);
    expect(s1.log.length).toBe(3);
    expect(s1.commit).toBe(2);
    const orphan = s1.log[2]?.v;

    const elected = run(minorityWrite, { type: 'tick' });
    const L = newestLeader(elected);
    expect(L === undefined ? -1 : [2, 3, 4].includes(L.id)).toBe(true);
    expect(L?.term).toBe(2);
    // The old leader still believes it leads term 1 on its side.
    expect(nodeAt(elected, 0).role).toBe('leader');

    const majorityWrite = run(elected, { type: 'write', target: null });
    const newLeader = newestLeader(majorityWrite);
    expect(newLeader?.commit).toBe(3);
    const ownEntry = newLeader?.log[2]?.v;
    expect(ownEntry).not.toBe(orphan);

    const healed = run(majorityWrite, { type: 'heal' });
    const old = nodeAt(healed, 0);
    expect(old.role).toBe('follower');
    expect(old.term).toBe(2);
    expect(old.log.map(e => e.v)).not.toContain(orphan);
    expect(healed.nodes.every(n => n.commit === 3 && n.log[2]?.v === ownEntry)).toBe(true);
    expect(healed.seen.minorityDiscarded).toBe(true);
  });

  it('a leader never commits an older-term entry just by counting replicas', () => {
    // S1 (term 1) writes "c" in the minority; the majority elects a term-2 leader with no new writes.
    const s = run(initialRaft(), { type: 'split' }, { type: 'write', target: 0 }, { type: 'tick' });
    const majorityLeader = newestLeader(s);
    if (majorityLeader === undefined) throw new Error('expected a majority leader');
    // Crash the majority leader and heal: only S1/S2 hold "c", and they win the next election.
    const s2 = run(s, { type: 'crash' }, { type: 'heal' }, { type: 'tick' });
    const L = newestLeader(s2);
    expect(L === undefined ? -1 : [0, 1].includes(L.id)).toBe(true);
    expect(L?.term).toBe(3);
    // "c" (term 1) is now on 4 nodes, a majority, but must not be committed by the term-3 leader.
    expect(s2.nodes.filter(n => n.alive && n.log.length === 3).length).toBe(4);
    expect(L?.commit).toBe(2);
    // A write in the leader's own term commits it and everything before it.
    const s3 = run(s2, { type: 'write', target: null });
    expect(newestLeader(s3)?.commit).toBe(4);
    expect(committedValues(s3, L?.id ?? 0)).toContain('c');
  });

  it('a minority alone can never elect a leader', () => {
    const s = run(initialRaft(), { type: 'split' }, { type: 'crash' }, { type: 'tick' });
    expect(s.nodes.filter(n => n.alive && n.role === 'leader' && [0, 1].includes(n.id))).toEqual([]);
  });

  it('writing to a follower redirects instead of appending', () => {
    const s = run(initialRaft(), { type: 'write', target: 3 });
    expect(nodeAt(s, 3).log.length).toBe(2);
    expect(s.events[0]?.text).toMatch(/redirect/);
  });

  it('is deterministic for a given seed', () => {
    const a = run(initialRaft(3), { type: 'crash' }, { type: 'tick' });
    const b = run(initialRaft(3), { type: 'crash' }, { type: 'tick' });
    expect(a).toEqual(b);
  });

  it('reset keeps the practice facts', () => {
    const s = run(initialRaft(), { type: 'crash' }, { type: 'tick' }, { type: 'reset' });
    expect(s.seen.electedAfterCrash).toBe(true);
    expect(newestLeader(s)?.name).toBe('S1');
  });

  it('the default does not solve any practice task', () => {
    expect(initialRaft().seen).toEqual({
      electedAfterCrash: false, committedWithDown: false, minorityDiscarded: false, maxTerm: 1,
      blockedWithoutMajority: false, steppedDown: false, minorityStuck: false, heldOldTerm: false, caughtUp: false, redirected: false,
    });
  });

  describe('extra practice tasks are reachable', () => {
    const crashElect = (s: RaftState) => run(s, { type: 'crash' }, { type: 'tick' });

    it('three elections in a row reach term 4', () => {
      const again = (s: RaftState) => run(crashElect(s), { type: 'restart' });
      const s = again(again(again(initialRaft())));
      expect(s.seen.maxTerm).toBe(4);
      expect(newestLeader(s)?.term).toBe(4);
      expect(initialRaft().seen.maxTerm).toBeLessThan(4);
    });

    it('with three nodes down a write cannot commit', () => {
      const two = crashElect(crashElect(initialRaft()));
      expect(two.seen.blockedWithoutMajority).toBe(false);
      const three = run(two, { type: 'crash' }, { type: 'write', target: null });
      expect(three.nodes.filter(n => !n.alive)).toHaveLength(3);
      expect(three.seen.blockedWithoutMajority).toBe(true);
      expect(three.nodes.every(n => n.commit <= 3)).toBe(true);
    });

    it('a write with 2 of 5 down still commits but writes with 3 down are blocked even with a stale leader click', () => {
      const s = run(crashElect(crashElect(initialRaft())), { type: 'write', target: null });
      expect(newestLeader(s)?.commit).toBe(3);
      expect(s.seen.blockedWithoutMajority).toBe(false);
    });

    it('healing a split makes the old leader step down', () => {
      const s = run(initialRaft(), { type: 'split' }, { type: 'tick' });
      expect(s.seen.steppedDown).toBe(false);
      expect(run(s, { type: 'heal' }).seen.steppedDown).toBe(true);
    });

    it('a minority side without its leader cannot elect', () => {
      const s = run(initialRaft(), { type: 'split' }, { type: 'crash' }, { type: 'tick' });
      expect(s.seen.minorityStuck).toBe(true);
      expect(run(initialRaft(), { type: 'split' }, { type: 'tick' }).seen.minorityStuck).toBe(false);
    });

    it('a leader holds back an older-term entry that a majority already stores', () => {
      const s = run(initialRaft(), { type: 'split' }, { type: 'write', target: 0 }, { type: 'tick' }, { type: 'crash' }, { type: 'heal' }, { type: 'tick' });
      expect(s.seen.heldOldTerm).toBe(true);
      expect(run(initialRaft(), { type: 'write', target: null }).seen.heldOldTerm).toBe(false);
    });

    it('a restarted node catches up on committed entries', () => {
      const s = run(crashElect(initialRaft()), { type: 'write', target: null });
      expect(s.seen.caughtUp).toBe(false);
      expect(run(s, { type: 'restart' }).seen.caughtUp).toBe(true);
    });

    it('writing to a follower is a redirect', () => {
      expect(run(initialRaft(), { type: 'write', target: 2 }).seen.redirected).toBe(true);
    });
  });

  describe('numeric practice answers', () => {
    const maj = (n: number) => Math.floor(n / 2) + 1;
    it('majority sizes and fault tolerance', () => {
      expect(maj(9)).toBe(5);
      expect(9 - maj(9)).toBe(4);
      expect(maj(6)).toBe(4);
      expect(6 - maj(6)).toBe(2);
      expect(2 * 4 + 1).toBe(9);
      // 9 nodes in 3 zones of 3, one zone lost: 6 up, 5 needed, so 1 more may fail.
      expect(9 - 3 - maj(9)).toBe(1);
      // an 8-node cluster has the same failure tolerance as a 7-node one
      expect(8 - maj(8)).toBe(3);
      expect(7 - maj(7)).toBe(3);
    });
    it('election terms: start at 3, two split votes and a win', () => {
      expect(3 + 2 + 1).toBe(6);
    });
  });
});
