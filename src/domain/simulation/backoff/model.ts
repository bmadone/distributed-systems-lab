import { randoms, range } from '../../shared-kernel/fp';

// Pure model of a retry storm: CLIENTS fail at t = 0 and each retries RETRIES times. We bucket the
// retry arrival times into 100 ms slots over the next 8 seconds.

export type Strategy = 'fixed' | 'exp' | 'jitter';
export const STRATEGIES: readonly { readonly value: Strategy; readonly label: string }[] = [
  { value: 'fixed', label: 'Fixed 1 s' }, { value: 'exp', label: 'Exponential' }, { value: 'jitter', label: 'Exponential + full jitter' },
];

export const CLIENTS = 1000, RETRIES = 4, BUCKETS = 80, PER_S = 10, BASE_S = 0.25, SEED = 42;

/** Retries per client and an optional cap (in seconds, 0 = none) on the exponential backoff. */
export interface BackoffConfig { readonly retries: number; readonly cap: number }
export const DEFAULT_CONFIG: BackoffConfig = { retries: RETRIES, cap: 0 };
export const RETRY_VALUES = ['1', '2', '4', '6'] as const;
export const CAP_VALUES = ['0', '1', '2'] as const;
export type RetryValue = (typeof RETRY_VALUES)[number];
export type CapValue = (typeof CAP_VALUES)[number];
export const RETRY_OPTIONS: readonly { readonly value: RetryValue; readonly label: string }[] = RETRY_VALUES.map(v => ({ value: v, label: v }));
export const CAP_OPTIONS: readonly { readonly value: CapValue; readonly label: string }[] = CAP_VALUES.map(v => ({ value: v, label: v === '0' ? 'No cap' : `${v} s` }));

/** Signal facts shared by the view and the practice checks. */
export interface BackoffFacts {
  readonly strategy: Strategy;
  readonly peak: number;
  readonly retries: number;
  /** Cap on the backoff in seconds, 0 = none. */
  readonly cap: number;
  /** Retries that land inside the 8-second window. */
  readonly total: number;
  readonly visited: readonly Strategy[];
}
export const facts = (strategy: Strategy, retries: number, cap: number, visited: readonly Strategy[]): BackoffFacts => {
  const h = histogram(strategy, SEED, { retries, cap });
  return { strategy, peak: peak(h), retries, cap, total: total(h), visited };
};

/** Wait before retry k (0-based), given a uniform random number r in [0, 1). */
export const waitFor = (strategy: Strategy, k: number, r: number, cap = 0): number => {
  const raw = BASE_S * 2 ** k;
  const base = cap > 0 ? Math.min(cap, raw) : raw;
  return strategy === 'fixed' ? 1 : strategy === 'exp' ? base : r * base * 2;
};

/** Retries per 100 ms bucket. Deterministic for a given seed. */
export const histogram = (strategy: Strategy, seed = SEED, cfg: BackoffConfig = DEFAULT_CONFIG): readonly number[] => {
  const { retries, cap } = cfg;
  const rs = randoms(seed, CLIENTS * retries);
  const slots = range(CLIENTS).flatMap(c =>
    range(retries).reduce<{ readonly t: number; readonly out: readonly number[] }>((acc, k) => {
      const t = acc.t + waitFor(strategy, k, rs[c * retries + k] ?? 0, cap);
      return { t, out: [...acc.out, Math.floor(t * PER_S)] };
    }, { t: 0, out: [] }).out);
  return slots.reduce((counts, b) => (b < BUCKETS ? counts.map((v, i) => (i === b ? v + 1 : v)) : counts), range(BUCKETS).map(() => 0));
};

export const peak = (buckets: readonly number[]): number => Math.max(0, ...buckets);

/** Retries that land inside the 8-second window. */
export const total = (buckets: readonly number[]): number => buckets.reduce((a, b) => a + b, 0);
