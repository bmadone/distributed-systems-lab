import { absurd } from '../../shared-kernel/fp';

// Pure two-phase commit walkthrough: a coordinator and three participants, with optional NO vote and crash.

export const PNAMES = ['Orders', 'Payments', 'Inventory'] as const;
export type PartState = 'idle' | 'preparing' | 'prepared' | 'committed' | 'aborted' | 'in doubt';
export type CoordState = 'idle' | 'waiting' | 'crashed' | 'decided';
export type TpcLogTag = 'info' | 'ok' | 'bad';
export interface TpcLogEntry { readonly id: number; readonly tag: TpcLogTag; readonly text: string }
export interface TpcSeen { readonly commit: boolean; readonly abort: boolean; readonly blocked: boolean; readonly recovered: boolean }

export interface TpcState {
  readonly step: number;
  readonly parts: readonly PartState[];
  readonly coord: CoordState;
  readonly log: readonly TpcLogEntry[];
  readonly logSeq: number;
  readonly recover: boolean;
  /** Protocol messages exchanged in the current run (PREPARE, votes, decisions, acks). */
  readonly msgs: number;
  /** Outcomes reached at some point; survives resets. */
  readonly seen: TpcSeen;
}
export interface TpcOptions { readonly no: boolean; readonly crash: boolean }

export const NO_SEEN: TpcSeen = { commit: false, abort: false, blocked: false, recovered: false };
export const initialTpc = (seen: TpcSeen = NO_SEEN, logSeq = 0): TpcState =>
  ({ step: 0, parts: PNAMES.map(() => 'idle'), coord: 'idle', log: [], logSeq, recover: false, msgs: 0, seen });

export const STATE_COLOR: Readonly<Record<PartState | CoordState, string>> = {
  idle: 'muted', preparing: 'accent', prepared: 'warn', committed: 'ok', aborted: 'bad', 'in doubt': 'bad', waiting: 'accent', crashed: 'bad', decided: 'ok',
};
export const PHASES = ['Ready', 'Phase 1: prepare', 'Votes collected', 'Done'] as const;
export const phaseLabel = (step: number): string => PHASES[step] ?? 'Done';
export const LAST_STEP = 3;

const all = (p: PartState): readonly PartState[] => PNAMES.map(() => p);
const log = (s: TpcState, tag: TpcLogTag, text: string): TpcState => ({ ...s, log: [{ id: s.logSeq, tag, text }, ...s.log], logSeq: s.logSeq + 1 });

/** Messages in a happy-path commit with n participants: PREPARE, vote, COMMIT, ack. */
export const commitMessages = (n: number): number => 4 * n;
/** Messages when `no` of n participants vote NO: PREPARE and votes go to all, ABORT and its ack only to the YES voters. */
export const abortMessages = (n: number, no: number): number => 2 * (n - no);
export const abortTotalMessages = (n: number, no: number): number => 2 * n + abortMessages(n, no);

export type Outcome = 'commit' | 'abort' | 'blocked';
export const outcome = (s: TpcState): Outcome | null =>
  s.step < LAST_STEP ? null : s.parts.every(p => p === 'committed') ? 'commit' : s.parts.every(p => p === 'aborted') ? 'abort' : s.parts.every(p => p === 'in doubt') ? 'blocked' : null;
/** Participants currently holding locks (voted YES and waiting for the decision). */
export const lockedCount = (s: TpcState): number => s.parts.filter(p => p === 'prepared' || p === 'in doubt').length;

/** Lock time of participant i in ms: it locks on receiving PREPARE (delay d_i) and unlocks on receiving the decision, sent once the slowest vote (2 * max delay) is in. */
export const lockHoldMs = (delays: readonly number[], i: number): number => {
  const d = delays[i] ?? 0;
  const lockedAt = d;
  const decisionAt = 2 * Math.max(...delays);
  return decisionAt + d - lockedAt;
};

export const tpcStep = (s: TpcState, { no, crash }: TpcOptions): TpcState => {
  switch (s.step) {
    case 0:
      return log({ ...s, step: 1, coord: 'waiting', parts: all('preparing'), msgs: s.msgs + PNAMES.length }, 'info', 'Phase 1: coordinator sends PREPARE to Orders, Payments and Inventory.');
    case 1:
      return log({ ...s, step: 2, msgs: s.msgs + PNAMES.length, parts: PNAMES.map((_, i) => (i === 2 && no ? 'aborted' : 'prepared')) }, 'info',
        `Votes: Orders YES, Payments YES, Inventory ${no ? 'NO (out of stock, so it aborts locally)' : 'YES'}. YES voters have written their changes durably and hold locks.`);
    case 2:
      if (no) return log({ ...s, step: 3, coord: 'decided', parts: all('aborted'), msgs: s.msgs + abortMessages(PNAMES.length, 1), seen: { ...s.seen, abort: true } }, 'bad', 'Phase 2: one NO vote, so the coordinator logs ABORT and tells everyone. Locks are released.');
      if (crash) return log({ ...s, step: 3, coord: 'crashed', parts: all('in doubt'), recover: true, seen: { ...s.seen, blocked: true } }, 'bad', 'Coordinator crashed before sending its decision. Every participant voted YES, so none can decide alone. They are blocked, holding locks.');
      return log({ ...s, step: 3, coord: 'decided', parts: all('committed'), msgs: s.msgs + 2 * PNAMES.length, seen: { ...s.seen, commit: true } }, 'ok', 'Phase 2: all YES, so the coordinator logs COMMIT and tells everyone. The transaction is committed on every node.');
    default:
      return s;
  }
};

export const tpcRecover = (s: TpcState): TpcState => (!s.recover ? s
  : log({ ...s, recover: false, coord: 'decided', parts: all('aborted'), msgs: s.msgs + 2 * PNAMES.length, seen: { ...s.seen, recovered: true } }, 'info',
    'Coordinator recovers. Its log has no COMMIT record, so it sends ABORT. Participants finally release their locks.'));

export type TpcAction =
  | { readonly type: 'step'; readonly opts: TpcOptions }
  | { readonly type: 'runAll'; readonly opts: TpcOptions }
  | { readonly type: 'recover' }
  | { readonly type: 'reset' };

export const tpcReducer = (s: TpcState, a: TpcAction): TpcState => {
  switch (a.type) {
    case 'step': return tpcStep(s, a.opts);
    case 'runAll': return s.step >= LAST_STEP ? s : tpcReducer(tpcStep(s, a.opts), a);
    case 'recover': return tpcRecover(s);
    case 'reset': return initialTpc(s.seen, s.logSeq);
    default: return absurd(a);
  }
};
