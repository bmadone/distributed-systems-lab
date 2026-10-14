import { range } from '../../shared-kernel/fp';

// Pure model of a leaderless quorum system: N replicas, W write acks, R read replies.

export interface Replica { readonly name: string; readonly where: string; readonly ms: number }
export const REPLICAS: readonly Replica[] = [
  { name: 'r1', where: 'same zone', ms: 2 }, { name: 'r2', where: 'same zone', ms: 3 }, { name: 'r3', where: 'other zone', ms: 9 },
  { name: 'r4', where: 'us-west', ms: 64 }, { name: 'r5', where: 'eu-west', ms: 82 }, { name: 'r6', where: 'sa-east', ms: 128 }, { name: 'r7', where: 'ap-south', ms: 196 },
];
export const MAX_N = REPLICAS.length;

export interface QuorumConfig { readonly N: number; readonly W: number; readonly R: number; readonly down: readonly number[] }
export const initialConfig: QuorumConfig = { N: 3, W: 1, R: 1, down: [] };

export const PRESETS: readonly (Omit<QuorumConfig, 'down'> & { readonly label: string })[] = [
  { label: 'Cassandra QUORUM', N: 3, W: 2, R: 2 }, { label: 'ONE / ONE', N: 3, W: 1, R: 1 }, { label: 'Fast reads', N: 3, W: 3, R: 1 },
  { label: 'Fast writes', N: 3, W: 1, R: 3 }, { label: 'Five-node majority', N: 5, W: 3, R: 3 },
];

/** Keep W, R and failed replicas inside 1..N. */
export const normalize = (c: QuorumConfig): QuorumConfig => ({
  N: c.N, W: Math.min(c.W, c.N), R: Math.min(c.R, c.N), down: c.down.filter(i => i < c.N),
});

export const toggleDown = (c: QuorumConfig, i: number): QuorumConfig =>
  ({ ...c, down: c.down.includes(i) ? c.down.filter(x => x !== i) : [...c.down, i].sort((a, b) => a - b) });

export interface QuorumAnalysis {
  readonly alive: readonly number[];
  readonly writeSet: readonly number[];
  readonly readSet: readonly number[];
  readonly canW: boolean;
  readonly canR: boolean;
  /** R + W > N: every read group meets every write group. */
  readonly overlap: boolean;
  /** 2W > N: two sides of a partition can't both gather W replicas. */
  readonly writesIntersect: boolean;
  readonly writeMs: number | null;
  readonly readMs: number | null;
}

/**
 * Worst case: the write lands on the fastest W live replicas, and the read prefers replicas the
 * write skipped. Latency is the k-th fastest live replica for a quorum of size k.
 */
export const analyze = (raw: QuorumConfig): QuorumAnalysis => {
  const c = normalize(raw);
  const ms = (i: number) => REPLICAS[i]?.ms ?? Infinity;
  const alive = range(c.N).filter(i => !c.down.includes(i));
  const byMs = [...alive].sort((a, b) => ms(a) - ms(b));
  const canW = alive.length >= c.W, canR = alive.length >= c.R;
  const writeSet = canW ? byMs.slice(0, c.W) : [];
  const readSet = canR ? [...alive.filter(i => !writeSet.includes(i)), ...writeSet].slice(0, c.R) : [];
  const kth = (k: number) => { const i = byMs[k - 1]; return i === undefined ? null : ms(i); };
  return {
    alive, writeSet, readSet, canW, canR,
    overlap: c.R + c.W > c.N, writesIntersect: 2 * c.W > c.N,
    writeMs: canW ? kth(c.W) : null, readMs: canR ? kth(c.R) : null,
  };
};

export const ordinal = (k: number): string => `${k}${['st', 'nd', 'rd'][k - 1] ?? 'th'}`;
