import { absurd, range } from '../../shared-kernel/fp';

// Pure model of a space-time diagram: 3 processes with Lamport and vector clocks, messages in
// flight, and comparison of two selected events.

export const PROCS = 3;

export type EventKind =
  | { readonly kind: 'local' }
  | { readonly kind: 'send'; readonly to: number }
  | { readonly kind: 'recv'; readonly from: number; readonly sendId: number; readonly msg: number };
export type VcEvent = EventKind & { readonly id: number; readonly p: number; readonly L: number; readonly V: readonly number[] };
export interface Message { readonly n: number; readonly from: number; readonly to: number; readonly L: number; readonly V: readonly number[]; readonly sendId: number }
export interface VcSeen {
  readonly foundConcurrent: boolean;
  readonly foundMislead: boolean;
  readonly delivered: boolean;
  /** Compared two events where one happened before the other. */
  readonly foundBefore: boolean;
  /** Compared a → c → b where the three events sit on three different processes. */
  readonly foundChain3: boolean;
  /** Compared two different events that share a Lamport time. */
  readonly foundTie: boolean;
  /** Some event's vector clock has every entry at least 3. */
  readonly wellInformed: boolean;
}
export interface VcState {
  readonly events: readonly VcEvent[];
  readonly flight: readonly Message[];
  /** Selected event ids, at most two. */
  readonly sel: readonly number[];
  readonly msgN: number;
  /** Historical facts for practice tasks. Survive resets. */
  readonly seen: VcSeen;
}

export type VcAction =
  | { readonly type: 'local'; readonly p: number }
  | { readonly type: 'send'; readonly p: number; readonly to: number }
  | { readonly type: 'deliver'; readonly index: number }
  | { readonly type: 'select'; readonly id: number }
  | { readonly type: 'reset' };

const clockOf = (s: VcState, p: number): { readonly L: number; readonly V: readonly number[] } =>
  s.events.findLast(e => e.p === p) ?? { L: 0, V: range(PROCS).map(() => 0) };

const add = (s: VcState, p: number, kind: EventKind, received?: { readonly L: number; readonly V: readonly number[] }): VcState => {
  const last = clockOf(s, p);
  const merged = received ? last.V.map((v, i) => Math.max(v, received.V[i] ?? 0)) : last.V;
  const V = merged.map((v, i) => (i === p ? v + 1 : v));
  const L = (received ? Math.max(last.L, received.L) : last.L) + 1;
  const informed = V.every(v => v >= 3);
  const seen = informed && !s.seen.wellInformed ? { ...s.seen, wellInformed: true } : s.seen;
  return { ...s, seen, events: [...s.events, { ...kind, id: s.events.length, p, L, V }] };
};

const local = (s: VcState, p: number) => add(s, p, { kind: 'local' });
const send = (s: VcState, p: number, to: number): VcState => {
  if (p === to) return s;
  const s1 = add(s, p, { kind: 'send', to });
  const e = s1.events.at(-1);
  if (e === undefined) return s;
  const n = s.msgN + 1;
  return { ...s1, msgN: n, flight: [...s1.flight, { n, from: p, to, L: e.L, V: e.V, sendId: e.id }] };
};
const deliver = (s: VcState, index: number, byUser: boolean): VcState => {
  const m = s.flight[index];
  if (m === undefined) return s;
  const s1 = add({ ...s, flight: s.flight.filter((_, i) => i !== index) }, m.to, { kind: 'recv', from: m.from, sendId: m.sendId, msg: m.n }, m);
  return byUser ? { ...s1, seen: { ...s1.seen, delivered: true } } : s1;
};

export type Relation = 'ab' | 'ba' | 'conc';
const le = (x: readonly number[], y: readonly number[]) => x.every((v, i) => v <= (y[i] ?? 0));
/** Happened-before from vector clocks: a → b iff V(a) ≤ V(b) everywhere (events are distinct). */
export const relation = (a: VcEvent, b: VcEvent): Relation => (le(a.V, b.V) ? 'ab' : le(b.V, a.V) ? 'ba' : 'conc');

export const selectedPair = (s: VcState): readonly [VcEvent, VcEvent] | null => {
  const [i, j] = s.sel;
  const a = i === undefined ? undefined : s.events[i], b = j === undefined ? undefined : s.events[j];
  return a && b ? [a, b] : null;
};

/** Is there an event on the third process that sits causally between a and b (a → c → b)? */
export const chainThroughThird = (s: VcState, a: VcEvent, b: VcEvent): boolean =>
  relation(a, b) !== 'conc' && s.events.some(c => {
    if (c.p === a.p || c.p === b.p || a.p === b.p) return false;
    return (relation(a, c) === 'ab' && relation(c, b) === 'ab') || (relation(b, c) === 'ab' && relation(c, a) === 'ab');
  });

/** Number of unordered pairs of concurrent events. */
export const concurrentPairs = (events: readonly VcEvent[]): number =>
  events.reduce((n, a, i) => n + events.slice(i + 1).filter(b => relation(a, b) === 'conc').length, 0);

const select = (s: VcState, id: number): VcState => {
  if (s.events[id] === undefined) return s;
  const sel = s.sel.includes(id) ? s.sel.filter(x => x !== id) : [...s.sel, id].slice(-2);
  const next = { ...s, sel };
  const pair = selectedPair(next);
  if (!pair) return next;
  const [a, b] = pair;
  const tie = a.L === b.L;
  if (relation(a, b) !== 'conc') {
    const chain = chainThroughThird(next, a, b);
    return { ...next, seen: { ...next.seen, foundBefore: true, foundChain3: next.seen.foundChain3 || chain } };
  }
  return { ...next, seen: { ...next.seen, foundConcurrent: true, foundMislead: next.seen.foundMislead || !tie, foundTie: next.seen.foundTie || tie } };
};

const empty = (seen: VcSeen): VcState => ({ events: [], flight: [], sel: [], msgN: 0, seen });

/** The sample diagram from the legacy course (one message, P2 → P3, is left in flight). */
const sample = (seen: VcSeen): VcState => {
  const s0 = empty(seen);
  const s1 = send(local(s0, 0), 0, 1);
  const s2 = deliver(local(local(s1, 2), 1), 0, false);
  const s3 = send(local(send(s2, 1, 2), 0), 2, 0);
  return local(deliver(s3, 1, false), 1);
};

export const noSeen: VcSeen = { foundConcurrent: false, foundMislead: false, delivered: false, foundBefore: false, foundChain3: false, foundTie: false, wellInformed: false };
export const initialVc = (): VcState => sample(noSeen);

export const step = (s: VcState, a: VcAction): VcState => {
  switch (a.type) {
    case 'local': return local(s, a.p);
    case 'send': return send(s, a.p, a.to);
    case 'deliver': return deliver(s, a.index, true);
    case 'select': return select(s, a.id);
    case 'reset': return sample(s.seen);
    default: return absurd(a);
  }
};
