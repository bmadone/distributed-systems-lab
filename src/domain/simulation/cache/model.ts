import { randoms } from '../../shared-kernel/fp';

// Pure model of an LRU cache in front of a database, fed by Zipf-distributed requests.

export const ITEMS = 1000;
export const REQUESTS = 20000;
export const SEED = 5;
export const HIT_MS = 1;
export const MISS_MS = 21;
export const SIZE = { min: 0, max: 600, step: 10 } as const;
export const SKEW = { min: 0.4, max: 1.4, step: 0.1 } as const;

export interface CacheConfig { readonly size: number; readonly skew: number }
export const initialConfig: CacheConfig = { size: 50, skew: 1 };

/** Skew is snapped to one decimal, as the slider shows it. */
export const roundSkew = (s: number): number => Math.round(s * 10) / 10;

/** Cumulative Zipf weights: item i (0-based) has weight 1 / (i + 1)^s. */
export const zipfCumulative = (k: number, s: number): readonly number[] => {
  let acc = 0; // running prefix sum, local to this call
  return Array.from({ length: k }, (_, i) => (acc += 1 / (i + 1) ** s));
};

/** Smallest index whose cumulative weight is ≥ u (binary search). */
export const pick = (cum: readonly number[], u: number): number => {
  let lo = 0, hi = cum.length - 1;
  while (lo < hi) { const m = (lo + hi) >> 1; if ((cum[m] ?? Infinity) < u) lo = m + 1; else hi = m; }
  return lo;
};

/** The deterministic request stream: item ids drawn from the Zipf distribution with a fixed seed. */
export const requestStream = (cum: readonly number[], n = REQUESTS, seed = SEED): readonly number[] => {
  const total = cum[cum.length - 1] ?? 0;
  return randoms(seed, n).map(r => pick(cum, r * total));
};

/**
 * Count LRU hits over a request stream. The Map is a local, private accumulator (a JS Map keeps
 * insertion order, so re-inserting on hit makes the first key the least recently used).
 */
export const lruHits = (stream: readonly number[], size: number): number => {
  if (size <= 0) return 0;
  const lru = new Map<number, true>();
  return stream.reduce((hits, id) => {
    if (lru.has(id)) { lru.delete(id); lru.set(id, true); return hits + 1; }
    lru.set(id, true);
    if (lru.size > size) { const oldest = lru.keys().next(); if (!oldest.done) lru.delete(oldest.value); }
    return hits;
  }, 0);
};

export interface CacheAnalysis {
  readonly size: number;
  readonly skew: number;
  /** LRU hit ratio in [0, 1]. */
  readonly hit: number;
  /** Share of traffic going to the top `size` items: the best any cache of that size can do. */
  readonly ideal: number;
  readonly latencyMs: number;
  readonly dbPer1000: number;
}

export const simulate = (c: CacheConfig): CacheAnalysis => {
  const skew = roundSkew(c.skew);
  const cum = zipfCumulative(ITEMS, skew);
  const total = cum[cum.length - 1] ?? 1;
  const hit = lruHits(requestStream(cum), c.size) / REQUESTS;
  const ideal = c.size > 0 ? (cum[Math.min(c.size, ITEMS) - 1] ?? 0) / total : 0;
  return { size: c.size, skew, hit, ideal, latencyMs: hit * HIT_MS + (1 - hit) * MISS_MS, dbPer1000: Math.round((1 - hit) * 1000) };
};
