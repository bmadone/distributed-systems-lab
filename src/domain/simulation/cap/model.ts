import { absurd } from '../../shared-kernel/fp';

// Pure model of the CAP partition lab: three replicas A, B, C joined by three cuttable links.
// Reachability is decided by connected components, so a single cut link still leaves a detour.

export const NAMES = ['A', 'B', 'C'] as const;
export type NodeName = typeof NAMES[number];
export type LinkId = 'AB' | 'AC' | 'BC';
export const LINK_IDS: readonly LinkId[] = ['AB', 'AC', 'BC'];
export const LINKS: Readonly<Record<LinkId, readonly [NodeName, NodeName]>> = { AB: ['A', 'B'], AC: ['A', 'C'], BC: ['B', 'C'] };
export const POS: Readonly<Record<NodeName, { readonly x: number; readonly y: number }>> = { A: { x: 200, y: 72 }, B: { x: 78, y: 272 }, C: { x: 322, y: 272 } };

export interface Value { readonly name: string; readonly color: string }
export const VALUES: readonly Value[] = [
  { name: 'Teal', color: '#2A9D8F' }, { name: 'Coral', color: '#E76F51' }, { name: 'Plum', color: '#8E5BA8' },
  { name: 'Amber', color: '#E0A030' }, { name: 'Cobalt', color: '#3F70DA' }, { name: 'Olive', color: '#7F913A' },
];
const FALLBACK: Value = { name: 'Teal', color: '#2A9D8F' };
export const valueAt = (i: number): Value => VALUES[i % VALUES.length] ?? FALLBACK;

export type Links = Readonly<Record<LinkId, boolean>>;
export type CapMode = 'CP' | 'AP';
export interface NodeState { readonly v: number; readonly ts: number; readonly seen: readonly number[] }
export type Nodes = Readonly<Record<NodeName, NodeState>>;
export interface Ack { readonly v: number; readonly ts: number; readonly node: NodeName }
export interface Stats { readonly acked: number; readonly rejected: number; readonly stale: number; readonly lost: number }
export type CapLogTag = 'ok' | 'reject' | 'stale' | 'lost' | 'net' | 'mode';
export interface CapLogEntry { readonly id: number; readonly tag: CapLogTag; readonly text: string }
export type FlashKind = 'ok' | 'bad' | 'warn';
export interface Packet { readonly path: readonly NodeName[]; readonly color: string }
/** Cosmetic effects of the last action (node flash, packets in flight). `seq` changes on every action. */
export interface Fx { readonly seq: number; readonly flash: { readonly node: NodeName; readonly kind: FlashKind } | null; readonly packets: readonly Packet[] }

export interface CapState {
  readonly mode: CapMode;
  readonly clock: number;
  readonly next: number;
  readonly step: number;
  readonly nodes: Nodes;
  readonly links: Links;
  readonly acked: readonly Ack[];
  readonly lost: readonly number[];
  readonly cpMajorityWrite: boolean;
  readonly stats: Stats;
  readonly log: readonly CapLogEntry[];
  readonly logSeq: number;
  readonly fx: Fx;
}

export const HEALTHY: Links = { AB: true, AC: true, BC: true };
export type Preset = 'healthy' | 'isoC' | 'isoA' | 'split';
export const PRESETS: Readonly<Record<Preset, Links>> = {
  healthy: HEALTHY,
  isoC: { AB: true, AC: false, BC: false },
  isoA: { AB: false, AC: false, BC: true },
  split: { AB: false, AC: false, BC: false },
};

export const initialCap = (seq = 0): CapState => {
  const mk = (): NodeState => ({ v: 0, ts: 1, seen: [1] });
  return {
    mode: 'CP', clock: 1, next: 1, step: 0, nodes: { A: mk(), B: mk(), C: mk() }, links: HEALTHY,
    acked: [{ v: 0, ts: 1, node: 'A' }], lost: [], cpMajorityWrite: false,
    stats: { acked: 1, rejected: 0, stale: 0, lost: 0 },
    log: [{ id: 0, tag: 'ok', text: 'Starting value Teal (t=1) is stored on A, B and C.' }], logSeq: 1,
    fx: { seq, flash: null, packets: [] },
  };
};

// ---------- Graph helpers ----------

export const linkBetween = (a: NodeName, b: NodeName): LinkId =>
  a === 'A' || b === 'A' ? (a === 'B' || b === 'B' ? 'AB' : 'AC') : 'BC';
const up = (links: Links, a: NodeName, b: NodeName): boolean => a !== b && links[linkBetween(a, b)];
export const neighbors = (links: Links, n: NodeName): readonly NodeName[] => NAMES.filter(m => up(links, n, m));

/** Nodes reachable from `n` (including `n`), in A, B, C order. */
export const component = (links: Links, n: NodeName): readonly NodeName[] => {
  const grow = (set: readonly NodeName[]): readonly NodeName[] => {
    const next = NAMES.filter(m => set.includes(m) || set.some(s => up(links, s, m)));
    return next.length === set.length ? next : grow(next);
  };
  return grow([n]);
};

/** Distinct connected components, in order of their first node. */
export const groups = (links: Links): readonly (readonly NodeName[])[] =>
  NAMES.reduce<readonly (readonly NodeName[])[]>((acc, n) => (acc.some(g => g.includes(n)) ? acc : [...acc, component(links, n)]), []);

/** Shortest path from a to b over live links, or [] if unreachable. */
export const path = (links: Links, a: NodeName, b: NodeName): readonly NodeName[] => {
  if (a === b) return [a];
  if (up(links, a, b)) return [a, b];
  const via = NAMES.find(c => c !== a && c !== b && up(links, a, c) && up(links, c, b));
  return via === undefined ? [] : [a, via, b];
};

export const allUp = (links: Links): boolean => LINK_IDS.every(k => links[k]);
export const isolated = (links: Links, n: NodeName): boolean =>
  component(links, n).length === 1 && NAMES.filter(m => m !== n).every(m => component(links, m).length === 2);

export const latestAcked = (s: CapState): Ack =>
  s.acked.reduce<Ack>((a, b) => (b.ts > a.ts ? b : a), { v: 0, ts: 1, node: 'A' });

/** In AP mode, two nodes that can't reach each other hold writes neither has seen. */
export const diverged = (s: CapState): boolean =>
  s.mode === 'AP' && NAMES.some(a => NAMES.some(b => {
    if (a >= b || component(s.links, a).includes(b)) return false;
    const na = s.nodes[a], nb = s.nodes[b];
    return !nb.seen.includes(na.ts) && !na.seen.includes(nb.ts);
  }));

const list = (xs: readonly string[]): string => (xs.length === 1 ? xs[0] ?? '' : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1] ?? ''}`);

// ---------- State helpers ----------

const addLog = (s: CapState, tag: CapLogTag, text: string): CapState =>
  ({ ...s, log: [{ id: s.logSeq, tag, text }, ...s.log].slice(0, 60), logSeq: s.logSeq + 1 });

const mapNodes = (nodes: Nodes, f: (n: NodeName, nd: NodeState) => NodeState): Nodes =>
  ({ A: f('A', nodes.A), B: f('B', nodes.B), C: f('C', nodes.C) });

/** Every node in `comp` learns every timestamp any of them has seen. */
const unionSeen = (nodes: Nodes, comp: readonly NodeName[]): Nodes => {
  const all = [...new Set(comp.flatMap(m => nodes[m].seen))].sort((a, b) => a - b);
  return mapNodes(nodes, (n, nd) => (comp.includes(n) ? { ...nd, seen: all } : nd));
};

const newestIn = (nodes: Nodes, comp: readonly NodeName[]): NodeName =>
  comp.reduce((a, b) => (nodes[b].ts > nodes[a].ts ? b : a));

const withFx = (s: CapState, flash: Fx['flash'], packets: readonly Packet[] = []): CapState =>
  ({ ...s, fx: { seq: s.fx.seq + 1, flash, packets } });

// ---------- Guided experiment ----------

export type CapEvent =
  | { readonly type: 'write'; readonly node: NodeName; readonly ok: boolean }
  | { readonly type: 'read'; readonly node: NodeName; readonly ok: boolean; readonly stale: boolean }
  | { readonly type: 'heal' } | { readonly type: 'net' } | { readonly type: 'mode' } | { readonly type: 'state' };

export interface GuidedStep { readonly title: string; readonly hint: string; readonly done: string; readonly check: (e: CapEvent, s: CapState) => boolean }
export const STEPS: readonly GuidedStep[] = [
  { title: 'Write on A while the network is healthy', hint: 'Press Write under node A.', done: 'A copied the value to B and C before confirming. With no partition you get C and A together.',
    check: (e, s) => e.type === 'write' && e.ok && e.node === 'A' && allUp(s.links) },
  { title: 'Isolate node C', hint: 'Click the A–C and B–C links, or press "Isolate C".', done: 'C is still running but can’t exchange messages with A or B. That’s a partition.',
    check: (_, s) => isolated(s.links, 'C') },
  { title: 'In CP mode, write on C', hint: 'Make sure CP is selected, then press Write under C.', done: 'C refused, because a write needs 2 of 3 nodes. That keeps the data consistent at the cost of availability.',
    check: (e, s) => e.type === 'write' && !e.ok && e.node === 'C' && s.mode === 'CP' },
  { title: 'Write on A, then read on C', hint: 'A and B still form a majority. Then press Read under C.', done: 'The majority kept working, and C refused rather than return possibly stale data.',
    check: (e, s) => e.type === 'read' && !e.ok && e.node === 'C' && s.cpMajorityWrite },
  { title: 'Switch to AP and write on both sides', hint: 'Choose AP, then write on C and on A.', done: 'Both sides accepted conflicting writes. Every node stayed available, and consistency is gone.',
    check: (_, s) => diverged(s) },
  { title: 'Read from the side that missed the newest write', hint: 'If A wrote last, read on C, and the other way round.', done: 'A stale read: an old value even though a newer write was confirmed.',
    check: e => e.type === 'read' && e.stale },
  { title: 'Heal the partition', hint: 'Repair the links or press "Healthy".', done: 'Last-write-wins settled the conflict and silently dropped a confirmed write. CRDTs or app-level merges can avoid that.',
    check: e => e.type === 'heal' },
];

/** Advance the guided experiment as far as the event (then the resulting state) allows. */
export const advance = (s: CapState, e: CapEvent): CapState => {
  const cur = STEPS[s.step];
  return cur !== undefined && cur.check(e, s) ? advance({ ...s, step: s.step + 1 }, { type: 'state' }) : s;
};

// ---------- Operations ----------

const write = (s: CapState, n: NodeName): CapState => {
  const val = valueAt(s.next), comp = component(s.links, n);
  if (s.mode === 'CP' && comp.length < 2) {
    const r = addLog({ ...s, stats: { ...s.stats, rejected: s.stats.rejected + 1 } }, 'reject', `Write ${val.name} on ${n} refused. ${n} can’t reach a majority (2 of 3).`);
    return advance(withFx(r, { node: n, kind: 'bad' }), { type: 'write', node: n, ok: false });
  }
  const ts = s.clock + 1, v = s.next % VALUES.length;
  const written = mapNodes(s.nodes, (m, nd) => (comp.includes(m) ? { v, ts, seen: [...nd.seen, ts] } : nd));
  const cutOff = NAMES.some(m => component(s.links, m).length < NAMES.length);
  const others = comp.filter(m => m !== n);
  const next: CapState = {
    ...s, next: s.next + 1, clock: ts, nodes: unionSeen(written, comp),
    acked: [...s.acked, { v, ts, node: n }], stats: { ...s.stats, acked: s.stats.acked + 1 },
    cpMajorityWrite: s.cpMajorityWrite || (s.mode === 'CP' && cutOff),
  };
  const logged = addLog(next, 'ok', others.length
    ? `${n} stored ${val.name} (t=${ts}), copied it to ${list(others)}, then confirmed.`
    : `${n} stored ${val.name} (t=${ts}) and confirmed right away. No other node has it.`);
  return advance(withFx(logged, { node: n, kind: 'ok' }, others.map(m => ({ path: path(s.links, n, m), color: val.color }))), { type: 'write', node: n, ok: true });
};

const read = (s: CapState, n: NodeName): CapState => {
  const comp = component(s.links, n);
  if (s.mode === 'CP' && comp.length < 2) {
    const r = addLog({ ...s, stats: { ...s.stats, rejected: s.stats.rejected + 1 } }, 'reject', `Read on ${n} refused. Without a majority, ${n} can’t be sure its copy is current.`);
    return advance(withFx(r, { node: n, kind: 'bad' }), { type: 'read', node: n, ok: false, stale: false });
  }
  const res = s.mode === 'CP' ? s.nodes[newestIn(s.nodes, comp)] : s.nodes[n];
  const latest = latestAcked(s), rv = valueAt(res.v), lv = valueAt(latest.v);
  const packets = s.mode === 'CP' ? comp.filter(m => m !== n).map(m => ({ path: path(s.links, m, n), color: rv.color })) : [];
  if (res.ts < latest.ts) {
    const r = addLog({ ...s, stats: { ...s.stats, stale: s.stats.stale + 1 } }, 'stale', `${n} returned ${rv.name} (t=${res.ts}), but ${lv.name} (t=${latest.ts}) was already confirmed on ${latest.node}.`);
    return advance(withFx(r, { node: n, kind: 'warn' }, packets), { type: 'read', node: n, ok: true, stale: true });
  }
  const r = addLog(s, 'ok', `${n} returned ${rv.name} (t=${res.ts}), the latest confirmed value.`);
  return advance(withFx(r, { node: n, kind: 'ok' }, packets), { type: 'read', node: n, ok: true, stale: false });
};

/** After a heal: inside each component, last-write-wins overwrites older copies, dropping unseen confirmed writes. */
const reconcile = (s: CapState): { readonly state: CapState; readonly packets: readonly Packet[] } =>
  groups(s.links).reduce<{ readonly state: CapState; readonly packets: readonly Packet[] }>(({ state, packets }, comp) => {
    const wName = newestIn(state.nodes, comp), w = state.nodes[wName], wv = valueAt(w.v);
    const losers = comp.filter(m => state.nodes[m].ts < w.ts);
    const afterLoss = losers.reduce<CapState>((acc, m) => {
      const nd = state.nodes[m];
      if (w.seen.includes(nd.ts) || acc.lost.includes(nd.ts)) return acc;
      const who = acc.acked.find(a => a.ts === nd.ts), nv = valueAt(nd.v);
      return addLog({ ...acc, lost: [...acc.lost, nd.ts], stats: { ...acc.stats, lost: acc.stats.lost + 1 } }, 'lost',
        `Conflict: ${nv.name} (t=${nd.ts}, confirmed on ${who ? who.node : m}) vs ${wv.name} (t=${w.ts}). Last-write-wins kept ${wv.name}. The ${nv.name} write is gone.`);
    }, state);
    const overwritten = mapNodes(afterLoss.nodes, (m, nd) => (losers.includes(m) ? { ...nd, v: w.v, ts: w.ts } : nd));
    return {
      state: { ...afterLoss, nodes: unionSeen(overwritten, comp) },
      packets: [...packets, ...losers.map(m => ({ path: path(s.links, wName, m), color: wv.color }))],
    };
  }, { state: s, packets: [] });

export const networkMessage = (links: Links): string => {
  const gs = groups(links);
  if (allUp(links)) return 'Network healthy. All nodes can talk.';
  if (gs.length === 1) return 'One link is cut, but every node can still reach the others through a detour.';
  if (gs.length === 3) return 'Every link is cut. Each node is alone.';
  return `Partition: ${gs.map(g => `{${g.join(', ')}}`).join(' | ')} can’t reach each other.`;
};

const setLinks = (s: CapState, patch: Partial<Links>): CapState => {
  const links: Links = { ...s.links, ...patch };
  const healed = LINK_IDS.some(k => links[k] && !s.links[k]);
  const { state, packets } = healed ? reconcile({ ...s, links }) : { state: { ...s, links }, packets: [] };
  const logged = addLog(state, 'net', networkMessage(links));
  return advance(withFx(logged, null, packets), { type: allUp(links) && healed ? 'heal' : 'net' });
};

const setMode = (s: CapState, mode: CapMode): CapState => {
  if (s.mode === mode) return s;
  const logged = addLog({ ...s, mode }, 'mode', mode === 'CP'
    ? 'Switched to CP. Nodes without a majority now refuse requests.'
    : 'Switched to AP. Every node now answers using its own copy.');
  return advance(withFx(logged, null), { type: 'mode' });
};

export type CapAction =
  | { readonly type: 'write'; readonly node: NodeName }
  | { readonly type: 'read'; readonly node: NodeName }
  | { readonly type: 'toggleLink'; readonly link: LinkId }
  | { readonly type: 'preset'; readonly preset: Preset }
  | { readonly type: 'mode'; readonly mode: CapMode }
  | { readonly type: 'reset' };

export const capReducer = (s: CapState, a: CapAction): CapState => {
  switch (a.type) {
    case 'write': return write(s, a.node);
    case 'read': return read(s, a.node);
    case 'toggleLink': return setLinks(s, { [a.link]: !s.links[a.link] });
    case 'preset': return setLinks(s, PRESETS[a.preset]);
    case 'mode': return setMode(s, a.mode);
    case 'reset': return initialCap(s.fx.seq + 1);
    default: return absurd(a);
  }
};
