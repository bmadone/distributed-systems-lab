import { absurd, nextRandom, range } from '../../shared-kernel/fp';

// Pure model of a 5-node Raft cluster: terms, randomized elections, log replication, majority
// commit (counted only for entries from the leader's current term), crashes and network splits.

export const SIZE = 5;
export const MAJORITY = Math.floor(SIZE / 2) + 1;

export type Role = 'leader' | 'follower' | 'candidate';
export interface Entry {
  readonly term: number;
  readonly v: string;
  /** Written by a leader that could not reach a majority at the time. */
  readonly minority: boolean;
}
export interface RaftNode {
  readonly id: number;
  readonly name: string;
  readonly role: Role;
  readonly term: number;
  readonly alive: boolean;
  readonly log: readonly Entry[];
  /** Number of log entries known to be committed. */
  readonly commit: number;
}
export type RaftTag = 'info' | 'ok' | 'warn' | 'bad' | 'lost' | 'net';
export interface RaftEvent { readonly id: number; readonly tag: RaftTag; readonly text: string }
export interface RaftSeen {
  readonly electedAfterCrash: boolean;
  readonly committedWithDown: boolean;
  readonly minorityDiscarded: boolean;
  /** Highest term any node has reached. */
  readonly maxTerm: number;
  /** A client write was attempted while a majority of nodes were crashed. */
  readonly blockedWithoutMajority: boolean;
  /** A leader stepped down after seeing a higher term. */
  readonly steppedDown: boolean;
  /** A side of a partition without a majority tried and failed to elect a leader. */
  readonly minorityStuck: boolean;
  /** A leader held back an older-term entry even though a majority already stored it. */
  readonly heldOldTerm: boolean;
  /** A restarted node caught up on entries it had missed. */
  readonly caughtUp: boolean;
  /** A write was sent to a follower and redirected. */
  readonly redirected: boolean;
}
export interface RaftState {
  readonly nodes: readonly RaftNode[];
  /** Network partition: nodes can talk only within their group. `null` = fully connected. */
  readonly groups: readonly (readonly number[])[] | null;
  readonly nextVal: number;
  readonly crashedLeader: boolean;
  /** PRNG state for picking which node times out first. */
  readonly rng: number;
  readonly events: readonly RaftEvent[];
  readonly nextEventId: number;
  /** Historical facts for practice tasks. Survive resets. */
  readonly seen: RaftSeen;
}

export type RaftAction =
  | { readonly type: 'write'; readonly target: number | null }
  | { readonly type: 'tick' }
  | { readonly type: 'crash' }
  | { readonly type: 'restart' }
  | { readonly type: 'split' }
  | { readonly type: 'heal' }
  | { readonly type: 'reset' };

const MAX_EVENTS = 40;
const noSeen: RaftSeen = {
  electedAfterCrash: false, committedWithDown: false, minorityDiscarded: false, maxTerm: 1,
  blockedWithoutMajority: false, steppedDown: false, minorityStuck: false, heldOldTerm: false, caughtUp: false, redirected: false,
};

const freshCluster = (rng: number, seen: RaftSeen): RaftState => ({
  nodes: range(SIZE).map(i => ({
    id: i, name: `S${i + 1}`, role: i === 0 ? 'leader' : 'follower', term: 1, alive: true,
    log: [{ term: 1, v: 'a', minority: false }, { term: 1, v: 'b', minority: false }], commit: 2,
  })),
  groups: null, nextVal: 2, crashedLeader: false, rng, seen,
  events: [{ id: 0, tag: 'info', text: 'S1 is leader for term 1. Two entries are committed on every node.' }],
  nextEventId: 1,
});

export const initialRaft = (seed = 7): RaftState => freshCluster(seed, noSeen);

// ---------- helpers ----------

export const nodeAt = (s: RaftState, i: number): RaftNode => {
  const n = s.nodes[i];
  if (n === undefined) throw new Error(`No Raft node ${i}`);
  return n;
};
const setNode = (s: RaftState, id: number, patch: Partial<Omit<RaftNode, 'id' | 'name'>>): RaftState =>
  ({ ...s, nodes: s.nodes.map(n => (n.id === id ? { ...n, ...patch } : n)) });
const emit = (s: RaftState, tag: RaftTag, text: string): RaftState =>
  ({ ...s, events: [{ id: s.nextEventId, tag, text }, ...s.events].slice(0, MAX_EVENTS), nextEventId: s.nextEventId + 1 });
const see = (s: RaftState, patch: Partial<RaftSeen>): RaftState => ({ ...s, seen: { ...s.seen, ...patch } });

const sameSide = (s: RaftState, a: number, b: number): boolean => s.groups === null || s.groups.some(g => g.includes(a) && g.includes(b));
export const reachable = (s: RaftState, a: number, b: number): boolean => nodeAt(s, a).alive && nodeAt(s, b).alive && sameSide(s, a, b);

/** Raft's voting rule: is `a`'s log at least as up to date as `b`'s? */
export const upToDate = (a: RaftNode, b: RaftNode): boolean => {
  const ta = a.log.at(-1)?.term ?? 0, tb = b.log.at(-1)?.term ?? 0;
  return ta !== tb ? ta > tb : a.log.length >= b.log.length;
};

/** The live leader with the highest term (what a client would find). */
export const newestLeader = (s: RaftState): RaftNode | undefined =>
  s.nodes.filter(n => n.alive && n.role === 'leader').reduce<RaftNode | undefined>((best, n) => (best === undefined || n.term > best.term ? n : best), undefined);

const peersOf = (s: RaftState, L: RaftNode): readonly RaftNode[] =>
  s.nodes.filter(F => F.id !== L.id && reachable(s, L.id, F.id) && F.term <= L.term);

const names = (ids: readonly number[]) => ids.map(i => `S${i + 1}`).join(', ');
const sameEntry = (a: Entry | undefined, b: Entry) => a !== undefined && a.term === b.term && a.v === b.v;

// ---------- heartbeat: step-down, replication, commit ----------

const stepDown = (s: RaftState, id: number): RaftState => {
  const L = nodeAt(s, id);
  if (!L.alive || L.role !== 'leader') return s;
  const higher = s.nodes.filter(F => F.id !== id && reachable(s, id, F.id) && F.term > L.term);
  if (higher.length === 0) return s;
  const t = Math.max(...higher.map(F => F.term));
  return emit(see(setNode(s, id, { role: 'follower', term: t }), { steppedDown: true }), 'info', `${L.name} sees the higher term ${t} and steps down.`);
};

const replicateFrom = (s: RaftState, id: number): RaftState => {
  const L = nodeAt(s, id);
  if (!L.alive || L.role !== 'leader') return s;
  const peers = peersOf(s, L);
  const copied = peers.reduce((acc, F) => {
    const lost = F.log.filter((e, i) => !sameEntry(L.log[i], e));
    const logged = lost.length === 0 ? acc : emit(
      lost.some(e => e.minority) ? see(acc, { minorityDiscarded: true }) : acc, 'lost',
      `${F.name}’s uncommitted entr${lost.length > 1 ? 'ies' : 'y'} ${lost.map(e => e.v).join(', ')} discarded and replaced by leader ${L.name}’s log.`);
    return setNode(logged, F.id, { log: L.log, term: L.term, role: 'follower', commit: Math.min(L.log.length, Math.max(F.commit, L.commit)) });
  }, s);
  // Commit rule: count replicas only for entries from the leader's current term. Every reachable
  // peer now holds the whole log, so the newest current-term entry is on peers + 1 nodes.
  const upTo = L.log.findLastIndex(e => e.term === L.term) + 1;
  if (peers.length + 1 < MAJORITY) return copied;
  if (upTo <= L.commit) return L.log.length > L.commit ? see(copied, { heldOldTerm: true }) : copied;
  const log = L.log.map((e, i) => (i < upTo && e.minority ? { ...e, minority: false } : e));
  return [L, ...peers].reduce((acc, n) => setNode(acc, n.id, { log, commit: upTo }), copied);
};

const leaderIds = (s: RaftState) => s.nodes.filter(n => n.alive && n.role === 'leader').map(n => n.id);

export const heartbeat = (s: RaftState): RaftState => {
  const afterStepDown = leaderIds(s).reduce(stepDown, s);
  return leaderIds(afterStepDown).reduce(replicateFrom, afterStepDown);
};

// ---------- actions ----------

const write = (s: RaftState, target: number | null): RaftState => {
  const L = target !== null ? nodeAt(s, target) : newestLeader(s);
  const lost = s.nodes.filter(n => !n.alive).length >= MAJORITY;
  if (L === undefined || !L.alive) return emit(lost ? see(s, { blockedWithoutMajority: true }) : s, 'bad', 'No reachable leader. Let election timeouts fire first.');
  if (L.role !== 'leader') return emit(see(s, { redirected: true }), 'info', `${L.name} is a ${L.role} and would redirect the client to the leader.`);
  const v = String.fromCharCode(97 + (s.nextVal % 26));
  const reach = peersOf(s, L).length + 1;
  const appended = setNode({ ...s, nextVal: s.nextVal + 1 }, L.id, { log: [...L.log, { term: L.term, v, minority: reach < MAJORITY }] });
  const after = heartbeat(appended);
  const L2 = nodeAt(after, L.id);
  const committed = L2.commit === L2.log.length;
  const down = after.nodes.some(n => !n.alive);
  const marked0 = committed && down ? see(after, { committedWithDown: true }) : after;
  const marked = !committed && lost ? see(marked0, { blockedWithoutMajority: true }) : marked0;
  return committed
    ? emit(marked, 'ok', `${L.name} replicated "${v}" to a majority (${reach}/${SIZE}). Committed.`)
    : emit(marked, 'warn', `${L.name} stored "${v}" but only ${reach} of ${SIZE} nodes have it. NOT committed, and the client waits.`);
};

/** Connected groups of live nodes. */
const components = (s: RaftState): readonly (readonly number[])[] =>
  s.nodes.filter(n => n.alive).reduce<readonly (readonly number[])[]>((comps, n) =>
    comps.some(c => c.includes(n.id)) ? comps : [...comps, s.nodes.filter(m => m.alive && sameSide(s, n.id, m.id)).map(m => m.id)], []);

const tryElect = (s: RaftState, candId: number, maxTerm: number, comp: readonly number[]): readonly [RaftState, boolean] => {
  const term = maxTerm + 1;
  const s1 = setNode(s, candId, { term, role: 'candidate' });
  const cand = nodeAt(s1, candId);
  const votes = 1 + comp.filter(i => i !== candId && upToDate(cand, nodeAt(s1, i))).length;
  if (votes >= MAJORITY) {
    const won = comp.reduce((acc, i) => setNode(acc, i, i === candId ? { role: 'leader' } : { term, role: 'follower' }), s1);
    const marked = s.crashedLeader ? see(won, { electedAfterCrash: true }) : won;
    return [emit(marked, 'ok', `${cand.name} timed out first, started term ${term} and won ${votes} votes. It’s the new leader.`), true];
  }
  const why = comp.length < MAJORITY ? '. This side has no majority, so it can never elect a leader.' : ' because its log is behind. Another node will time out.';
  const stuck = comp.length < MAJORITY ? see(s1, { minorityStuck: true }) : s1;
  return [emit(stuck, 'warn', `${cand.name} started term ${term} but got only ${votes} vote${votes > 1 ? 's' : ''}${why}`), false];
};

const electIn = (s: RaftState, comp: readonly number[]): RaftState => {
  const maxTerm = Math.max(...comp.map(i => nodeAt(s, i).term));
  const [r, rng] = nextRandom(s.rng);
  const pick = comp[Math.floor(r * comp.length)] ?? comp[0];
  if (pick === undefined) return s;
  const [s1, won] = tryElect({ ...s, rng }, pick, maxTerm, comp);
  if (won || comp.length < MAJORITY) return s1;
  const best = comp.map(i => nodeAt(s1, i)).reduce((a, b) => (upToDate(a, b) ? a : b));
  return tryElect(s1, best.id, maxTerm, comp)[0];
};

const tick = (s: RaftState): RaftState => {
  const needElection = components(s).filter(c => {
    const maxTerm = Math.max(...c.map(i => nodeAt(s, i).term));
    return !c.some(i => { const n = nodeAt(s, i); return n.role === 'leader' && n.term === maxTerm; });
  });
  const after = needElection.length === 0
    ? emit(s, 'info', 'Every group already has a current leader sending heartbeats, so no timeouts fire.')
    : needElection.reduce(electIn, s);
  return heartbeat(after);
};

const crash = (s: RaftState): RaftState => {
  const L = newestLeader(s);
  if (L === undefined) return emit(s, 'info', 'There is no live leader to crash.');
  return emit({ ...setNode(s, L.id, { alive: false }), crashedLeader: true }, 'bad', `${L.name} crashed. Followers stop receiving heartbeats.`);
};

const restart = (s: RaftState): RaftState => {
  const down = s.nodes.filter(n => !n.alive);
  if (down.length === 0) return emit(s, 'info', 'No nodes are crashed.');
  const revived = heartbeat(down.reduce((acc, n) => emit(setNode(acc, n.id, { alive: true, role: 'follower' }), 'info', `${n.name} restarts as a follower.`), s));
  const behind = down.some(n => nodeAt(revived, n.id).commit > n.commit);
  return behind ? see(revived, { caughtUp: true }) : revived;
};

const split = (s: RaftState): RaftState => {
  const L = newestLeader(s);
  if (L === undefined) return emit(s, 'info', 'There is no live leader to split off. Let election timeouts fire first.');
  const buddy = (L.id + 1) % SIZE;
  const minority = [L.id, buddy], majority = range(SIZE).filter(i => !minority.includes(i));
  return emit({ ...s, groups: [minority, majority] }, 'net', `Network split: {${names(minority)}} | {${names(majority)}}. Click the old leader to write to it.`);
};

const heal = (s: RaftState): RaftState => heartbeat(emit({ ...s, groups: null }, 'net', 'Network healed.'));

const stepRaw = (s: RaftState, a: RaftAction): RaftState => {
  switch (a.type) {
    case 'write': return write(s, a.target);
    case 'tick': return tick(s);
    case 'crash': return crash(s);
    case 'restart': return restart(s);
    case 'split': return split(s);
    case 'heal': return heal(s);
    case 'reset': return freshCluster(s.rng, s.seen);
    default: return absurd(a);
  }
};

const bumpMaxTerm = (s: RaftState): RaftState => {
  const top = Math.max(...s.nodes.map(n => n.term));
  return top > s.seen.maxTerm ? see(s, { maxTerm: top }) : s;
};
export const step = (s: RaftState, a: RaftAction): RaftState => bumpMaxTerm(stepRaw(s, a));

