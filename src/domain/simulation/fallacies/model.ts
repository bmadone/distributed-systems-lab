// Pure data and formatting for the eight fallacies cards and the latency ladder.

export interface Fallacy { readonly name: string; readonly reality: string; readonly response: string }
export const FALLACIES: readonly Fallacy[] = [
  { name: 'The network is reliable', reality: 'Switches fail, cables get cut and packets get dropped every day at scale.', response: 'Timeouts, retries with idempotency, redundant paths.' },
  { name: 'Latency is zero', reality: 'A cross-region round trip costs about 100 ms, roughly a million memory reads.', response: 'Fewer round trips, batching, caching, data placed near users.' },
  { name: 'Bandwidth is infinite', reality: 'Large payloads saturate links and cost money. One chatty service can starve others.', response: 'Compression, pagination, compact binary formats.' },
  { name: 'The network is secure', reality: 'Traffic can be sniffed, spoofed or tampered with, even inside a datacenter.', response: 'TLS everywhere, mutual authentication, zero-trust networking.' },
  { name: 'Topology doesn’t change', reality: 'Instances autoscale, fail over and move. IP addresses change constantly.', response: 'Service discovery, health checks, no hard-coded addresses.' },
  { name: 'There is one administrator', reality: 'Many teams, vendors and policies control parts of every request path.', response: 'Clear ownership, defensive configuration, observability across boundaries.' },
  { name: 'Transport cost is zero', reality: 'Serialization costs CPU, and cross-zone or egress traffic costs real money.', response: 'Measure transfer costs and keep chatty services close together.' },
  { name: 'The network is homogeneous', reality: 'Mixed hardware, operating systems, protocols, packet sizes and software versions.', response: 'Standard protocols, version-tolerant formats, interoperability tests.' },
];

/** Toggle a card open/closed. Keeps indices sorted and unique. */
export const toggleCard = (open: readonly number[], i: number): readonly number[] =>
  open.includes(i) ? open.filter(x => x !== i) : [...open, i].sort((a, b) => a - b);

export const revealedCount = (open: readonly number[]): number =>
  new Set(open.filter(i => i >= 0 && i < FALLACIES.length)).size;

export interface LatencyRow { readonly name: string; readonly ns: number }
export const LATENCY: readonly LatencyRow[] = [
  { name: 'L1 cache reference', ns: 0.5 }, { name: 'Branch mispredict', ns: 5 }, { name: 'Main memory reference', ns: 100 },
  { name: 'Compress 1 KB', ns: 2000 }, { name: 'SSD random read', ns: 100000 }, { name: 'Round trip in the same datacenter', ns: 500000 },
  { name: 'Read 1 MB sequentially from SSD', ns: 1000000 }, { name: 'Hard disk seek', ns: 10000000 },
  { name: 'Round trip US East ↔ Europe', ns: 80000000 }, { name: 'Round trip California ↔ Netherlands', ns: 150000000 },
];

export const fmtReal = (ns: number): string =>
  ns < 1000 ? `${ns} ns` : ns < 1e6 ? `${ns / 1000} µs` : `${ns / 1e6} ms`;

/** Format `ns` nanoseconds as if 1 ns were 1 second. */
export const fmtHuman = (s: number): string => {
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${(s / 60).toFixed(1)} min`;
  if (s < 86400) return `${(s / 3600).toFixed(1)} hours`;
  if (s < 86400 * 30) return `${(s / 86400).toFixed(1)} days`;
  if (s < 86400 * 365) return `${(s / 86400 / 30).toFixed(1)} months`;
  return `${(s / 86400 / 365).toFixed(1)} years`;
};

const maxLog = Math.log10((LATENCY[LATENCY.length - 1]?.ns ?? 1) * 10);
/** Log-scale bar width in percent. */
export const barWidth = (ns: number): number => Math.max(1, 100 * (Math.log10(ns * 10) / maxLog));

const idxOf = (name: string): number => FALLACIES.findIndex(f => f.name === name);
/** Practice task: exactly the "secure" and "transport cost" cards are open, and nothing else. */
export const onlySecurityAndCost = (open: readonly number[]): boolean => {
  const set = new Set(open);
  return set.size === 2 && set.has(idxOf('The network is secure')) && set.has(idxOf('Transport cost is zero'));
};

/** Round trips on the critical path: `parallel` independent calls collapse into one round, dependent ones stack. */
export const criticalPathMs = (rttMs: number, parallel: number, dependent: number): number => (parallel > 0 ? 1 : 0) * rttMs + dependent * rttMs;
/** Probability that every one of `n` sequential calls succeeds, each with success probability `p`. */
export const allSucceed = (p: number, n: number): number => p ** n;
/** How many events of `unitNs` fit in one `spanNs`. */
export const fitsIn = (spanNs: number, unitNs: number): number => spanNs / unitNs;
