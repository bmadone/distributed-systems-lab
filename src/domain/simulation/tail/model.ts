// Pure model of fan-out tail latency: each backend is slow with probability `slowP`,
// and a user request is slow if any of the `n` backends it waits for is slow.

export const SLOW_P = 0.01;
export const FAST_MS = 10;
export const SLOW_MS = 1000;
export const FANOUT = { min: 1, max: 200 } as const;
export const initialFanout = 10;
/** Selectable per-backend slowness, in percent. 1% is the default (and the lesson's baseline). */
export const SLOW_PCTS = [0.1, 0.5, 1, 2] as const;
export const initialSlowPct = 1;
export const slowPOf = (pct: number): number => pct / 100;

/** Probability that at least one of `n` backends is slow: 1 − (1 − p)^n. */
export const slowShare = (n: number, p = SLOW_P): number => 1 - (1 - p) ** n;

export type TailTone = 'good' | 'warn' | 'bad';
export const tone = (share: number): TailTone => (share < 0.1 ? 'good' : share < 0.5 ? 'warn' : 'bad');

/** Smallest fan-out whose slow share exceeds `threshold`, within the slider range. */
export const smallestFanoutAbove = (threshold: number, p = SLOW_P): number | undefined =>
  Array.from({ length: FANOUT.max - FANOUT.min + 1 }, (_, i) => FANOUT.min + i).find(n => slowShare(n, p) > threshold);
