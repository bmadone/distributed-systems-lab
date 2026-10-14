// Pure model of the replication timeline: Client 1 writes x=1 to primary A, Client 2 reads x from replica C.

export type Mode = 'async' | 'sync';
export interface Config { readonly mode: Mode; readonly lag: number; readonly read: number; readonly crash: boolean }
export const LAG = { min: 20, max: 200, step: 5 } as const;
export const READ = { min: 0, max: 300, step: 5 } as const;
/** Default read at 140 ms lands after C has the write, so no stale read until the learner moves it. */
export const initialConfig: Config = { mode: 'async', lag: 120, read: 140, crash: false };

export const CRASH_AT = 8;
export const ASYNC_OK_SENT = 6;
export const ASYNC_OK_RECEIVED = 10;

export type Tone = 'good' | 'bad' | 'warn' | 'info';
export interface VerdictText { readonly tone: Tone; readonly title: string; readonly detail: string }

export interface Timeline {
  /** When B and C receive x=1 (ms). */
  readonly tB: number;
  readonly tC: number;
  /** Async mode + crash: A confirmed the write but never shipped it. */
  readonly lost: boolean;
  /** When Client 1 receives OK, or null if the write is never confirmed. */
  readonly ack: number | null;
  /** When A sends OK (null if never). */
  readonly okSent: number | null;
  readonly okLabel: string | null;
  /** What Client 2's read returns. */
  readonly value: 0 | 1;
  /** Read returned 0 after the write was confirmed: not linearizable. */
  readonly stale: boolean;
  readonly verdicts: readonly VerdictText[];
}

export const timeline = ({ mode, lag, read, crash }: Config): Timeline => {
  const tB = 5 + Math.max(10, Math.round(lag * 0.4)), tC = 5 + lag;
  const lost = crash && mode === 'async';
  const ack = mode === 'async' ? ASYNC_OK_RECEIVED : crash ? null : tC + 5;
  const okSent = ack === null ? null : mode === 'async' ? ASYNC_OK_SENT : tC;
  const value: 0 | 1 = lost ? 0 : read + 2 >= tC ? 1 : 0;
  // A lost write isn't a stale read: that case is its own task.
  const stale = value === 0 && ack !== null && read >= ack && !lost;
  const okLabel = ack === null ? null : mode === 'async' ? `OK sent at ${ASYNC_OK_SENT} ms, received at ${ack} ms` : `OK at ${ack} ms`;

  const confirm: VerdictText = ack !== null
    ? mode === 'async'
      ? { tone: 'good', title: `Write confirmed after ${ack} ms`, detail: 'Fast, because A doesn’t wait for replicas.' }
      : { tone: 'warn', title: `Write confirmed after ${ack} ms`, detail: 'A waited for B and C before confirming.' }
    : { tone: 'warn', title: 'Write never confirmed', detail: 'A crashed before replying. The client gets a timeout and an unknown outcome, but it was never told "success" for data that could be lost.' };
  const outcome: VerdictText = lost
    ? { tone: 'bad', title: 'Confirmed write lost', detail: `A sent OK at ${ASYNC_OK_SENT} ms (the client got it at ${ASYNC_OK_RECEIVED} ms), then crashed at ${CRASH_AT} ms before shipping x=1. B was promoted without it.` }
    : stale
      ? { tone: 'bad', title: 'Stale read: not linearizable', detail: `The write was confirmed at ${ack ?? 0} ms, but C didn’t have it until ${tC} ms. A read at ${read} ms returned 0.` }
      : value === 0
        ? { tone: 'info', title: 'Read returned 0, which is allowed', detail: 'The read started before the write was confirmed, so either value is valid.' }
        : { tone: 'good', title: 'Read returned 1', detail: 'C already had the write.' };

  return { tB, tC, lost, ack, okSent, okLabel, value, stale, verdicts: [confirm, outcome] };
};

/** SVG x for a time in ms (timeline capped at 300 ms). */
export const xOf = (t: number): number => 80 + Math.min(t, 300) * 1.8;
