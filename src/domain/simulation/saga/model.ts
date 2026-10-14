import { absurd } from '../../shared-kernel/fp';

// Pure saga run: forward local transactions, and on failure the compensations in reverse order.

export const SAGA = [
  { name: 'Book flight', undo: 'Cancel flight', id: 'flight' },
  { name: 'Reserve hotel', undo: 'Cancel hotel', id: 'hotel' },
  { name: 'Rent car', undo: 'Cancel car', id: 'car' },
  { name: 'Charge card', undo: 'Refund card', id: 'card' },
] as const;
export const FAIL_IDS = ['none', 'hotel', 'car', 'card'] as const;
export type SagaFail = typeof FAIL_IDS[number];
export const FAIL_OPTIONS: readonly { readonly value: SagaFail; readonly label: string }[] = [
  { value: 'none', label: 'Nothing' }, { value: 'hotel', label: 'Reserve hotel' }, { value: 'car', label: 'Rent car' }, { value: 'card', label: 'Charge card' },
];

export type StepState = 'pending' | 'running' | 'done' | 'failed' | 'compensated' | 'skipped';
export const STEP_COLOR: Readonly<Record<StepState, string>> = { pending: 'muted', running: 'accent', done: 'ok', failed: 'bad', compensated: 'warn', skipped: 'muted' };
export type SagaLogTag = 'ok' | 'bad' | 'warn';
export interface SagaLogEntry { readonly id: number; readonly tag: SagaLogTag; readonly text: string }
export interface SagaFrame { readonly states: readonly StepState[]; readonly log: readonly SagaLogEntry[] }

const PENDING: readonly StepState[] = SAGA.map(() => 'pending');
export const EMPTY_FRAME: SagaFrame = { states: PENDING, log: [] };

type Event = { readonly i: number; readonly state: StepState; readonly entry?: { readonly tag: SagaLogTag; readonly text: string } };

/** The ordered events of a run where step `fail` fails. */
const events = (fail: SagaFail): readonly Event[] => {
  const failIdx = SAGA.findIndex(s => s.id === fail);
  const end = failIdx < 0 ? SAGA.length : failIdx;
  const forward = SAGA.slice(0, end).map((s, i): Event => ({ i, state: 'done', entry: { tag: 'ok', text: `${s.name} committed locally. Other services can already see it.` } }));
  const failed = SAGA[failIdx];
  if (failed === undefined) return forward;
  const comps = SAGA.slice(0, failIdx).map((s, i): Event => ({ i, state: 'compensated', entry: { tag: 'warn', text: `${s.undo}: undoes "${s.name}".` } })).reverse();
  const skipped = SAGA.slice(failIdx + 1).map((_, k): Event => ({ i: failIdx + 1 + k, state: 'skipped' }));
  return [...forward, { i: failIdx, state: 'failed', entry: { tag: 'bad', text: `${failed.name} failed. Running compensations in reverse order.` } }, ...comps, ...skipped];
};

/** frames[k] is what the learner sees after k + 1 events (newest log entry first). */
export const sagaFrames = (fail: SagaFail): readonly SagaFrame[] =>
  events(fail).reduce<readonly SagaFrame[]>((acc, e, k) => {
    const prev = acc[acc.length - 1] ?? EMPTY_FRAME;
    return [...acc, {
      states: prev.states.map((st, i) => (i === e.i ? e.state : st)),
      log: e.entry ? [{ id: k, ...e.entry }, ...prev.log] : prev.log,
    }];
  }, []);

export interface SagaState {
  readonly fail: SagaFail;
  /** The failure the current (or last) run used; null when nothing has run since the last selection. */
  readonly runFail: SagaFail | null;
  readonly shown: number;
  readonly done: boolean;
  /** Failure of the last completed run. */
  readonly ranFail: SagaFail | null;
  /** Every failure scenario that has been run to completion, in first-run order. */
  readonly ran: readonly SagaFail[];
}
export const initialSaga = (fail: SagaFail = 'car'): SagaState => ({ fail, runFail: null, shown: 0, done: false, ranFail: null, ran: [] });

export const isRunning = (s: SagaState): boolean => s.runFail !== null && !s.done;
export const currentFrame = (s: SagaState): SagaFrame =>
  s.runFail === null ? EMPTY_FRAME : sagaFrames(s.runFail)[s.shown - 1] ?? EMPTY_FRAME;
export const resultText = (s: SagaState): string =>
  !s.done || s.runFail === null ? '' : s.runFail === 'none' ? 'Trip booked.' : 'Trip cancelled cleanly, and the earlier steps were undone.';

export type SagaAction = { readonly type: 'select'; readonly fail: SagaFail } | { readonly type: 'run' } | { readonly type: 'tick' };

export const sagaReducer = (s: SagaState, a: SagaAction): SagaState => {
  switch (a.type) {
    case 'select': return isRunning(s) ? s : { ...s, fail: a.fail, runFail: null, shown: 0, done: false };
    case 'run': return isRunning(s) ? s : { ...s, runFail: s.fail, shown: 1, done: false };
    case 'tick': {
      if (!isRunning(s) || s.runFail === null) return s;
      return s.shown < sagaFrames(s.runFail).length ? { ...s, shown: s.shown + 1 } : { ...s, done: true, ranFail: s.runFail, ran: s.ran.includes(s.runFail) ? s.ran : [...s.ran, s.runFail] };
    }
    default: return absurd(a);
  }
};

/** Compensations that run when step `failStep` (1-based) of a saga fails: every earlier step is undone. */
export const compensationCount = (failStep: number): number => Math.max(0, failStep - 1);
/** Steps never attempted after the failure. */
export const skippedCount = (totalSteps: number, failStep: number): number => Math.max(0, totalSteps - failStep);
/** Local transactions that commit in a failed run: the forward steps before the failure plus their compensations. */
export const committedLocalTxns = (failStep: number): number => 2 * compensationCount(failStep);
/** Wall-clock time of a failed run; the failing step also takes `forwardMs` before it reports failure. */
export const failedRunMs = (failStep: number, forwardMs: number, compMs: number): number =>
  failStep * forwardMs + compensationCount(failStep) * compMs;
