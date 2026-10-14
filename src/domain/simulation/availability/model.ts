import { clamp, sum } from '../../shared-kernel/fp';

// Pure model of the availability builder: tiers in series, each with 1..4 redundant instances.

export interface Tier { readonly n: string; readonly a: number }
export const TIERS: readonly Tier[] = [
  { n: 'Load balancer', a: 0.9999 }, { n: 'App servers', a: 0.999 }, { n: 'Cache', a: 0.999 }, { n: 'Database', a: 0.9995 },
];
export const CACHE_TIER = 2;
export const MIN_INSTANCES = 1, MAX_INSTANCES = 4;

export interface AvailConfig { readonly counts: readonly number[]; readonly degrade: boolean }
export const initialAvail: AvailConfig = { counts: [1, 1, 1, 1], degrade: false };

/** Clamp counts to 1..4 and make sure there is one per tier. */
export const normalize = (c: AvailConfig): AvailConfig =>
  ({ counts: TIERS.map((_, i) => clamp(MIN_INSTANCES, MAX_INSTANCES, Math.round(c.counts[i] ?? 1))), degrade: c.degrade });

export const adjust = (c: AvailConfig, tier: number, delta: number): AvailConfig =>
  normalize({ ...c, counts: c.counts.map((n, i) => (i === tier ? n + delta : n)) });

/** n independent replicas in parallel. */
export const parallel = (a: number, n: number): number => 1 - (1 - a) ** n;

export interface AvailAnalysis {
  readonly tierA: readonly number[];
  /** Tiers on the critical path (the cache drops out under graceful degradation). */
  readonly optional: readonly boolean[];
  readonly total: number;
  readonly instances: number;
  readonly weakest: number;
  /** Expected downtime per year, in seconds. */
  readonly downPerYear: number;
}

export const analyze = (raw: AvailConfig): AvailAnalysis => {
  const c = normalize(raw);
  const tierA = TIERS.map((t, i) => parallel(t.a, c.counts[i] ?? 1));
  const optional = TIERS.map((_, i) => c.degrade && i === CACHE_TIER);
  const total = tierA.reduce((p, a, i) => p * (optional[i] ? 1 : a), 1);
  const weakest = tierA
    .map((a, i) => ({ a, i }))
    .filter(({ i }) => !optional[i])
    .reduce((best, x) => (x.a < best.a ? x : best)).i;
  return { tierA, optional, total, instances: sum(c.counts), weakest, downPerYear: (1 - total) * 365 * 86400 };
};

export const fmtDur = (s: number): string =>
  s >= 86400 ? `${(s / 86400).toFixed(1)} days` : s >= 3600 ? `${(s / 3600).toFixed(1)} hours` : s >= 60 ? `${(s / 60).toFixed(1)} min` : `${s.toFixed(0)} s`;
