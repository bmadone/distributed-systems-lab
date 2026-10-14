// Pure back-of-envelope estimator: QPS, peak, storage and egress from a few workload knobs.

export const SECONDS_PER_DAY = 86400;

/** Slider ranges. `dauStep` is a log-scale position: DAU = 10^(4 + step × 0.05), so 10k … 1B. */
export const RANGES = {
  dauStep: { min: 0, max: 100 },
  writesPerUser: { min: 1, max: 50 },
  readsPerWrite: { min: 1, max: 200 },
  kbPerWrite: { min: 1, max: 5000 },
  peakFactor: { min: 1, max: 10 },
  years: { min: 1, max: 10 },
} as const;

export interface EstimatorConfig {
  readonly dauStep: number;
  readonly writesPerUser: number;
  readonly readsPerWrite: number;
  readonly kbPerWrite: number;
  readonly peakFactor: number;
  readonly years: number;
}
export const initialConfig: EstimatorConfig = { dauStep: 60, writesPerUser: 2, readsPerWrite: 20, kbPerWrite: 10, peakFactor: 3, years: 5 };

export const dauOf = (step: number): number => Math.round(10 ** (4 + step * 0.05));

export interface Estimate {
  readonly dau: number;
  readonly writeQps: number;
  readonly readQps: number;
  readonly peakQps: number;
  /** Bytes per year and in total over the retention period. */
  readonly bytesPerYear: number;
  readonly bytesTotal: number;
  /** Average read egress, bytes per second. */
  readonly egressBps: number;
  readonly advice: readonly string[];
}

export const fmtN = (n: number): string => {
  const short = (x: number, unit: string) => `${x.toFixed(1).replace(/\.0$/, '')}${unit}`;
  return n >= 1e9 ? short(n / 1e9, 'B') : n >= 1e6 ? short(n / 1e6, 'M') : n >= 1e3 ? short(n / 1e3, 'k') : Math.round(n).toString();
};

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'] as const;
/** Scale down by 1000 while ≥ 1000, exactly like the legacy loop, so rounding matches. */
const scale = (b: number, i: number): readonly [number, number] => (b >= 1000 && i < UNITS.length - 1 ? scale(b / 1000, i + 1) : [b, i]);
export const fmtB = (bytes: number): string => {
  const [b, i] = scale(bytes, 0);
  return `${b >= 100 ? b.toFixed(0) : b.toFixed(1)} ${UNITS[i] ?? 'B'}`;
};

export const fmtSize = (kb: number): string => (kb >= 1000 ? `${(kb / 1000).toFixed(1)} MB` : `${kb} KB`);

const adviceFor = (peak: number, total: number, egress: number): readonly string[] => [
  peak > 100000 ? 'Peak traffic needs many stateless servers, heavy caching or a CDN, and probably sharded storage.'
    : peak > 10000 ? 'A few app servers plus a cache handle this. Consider read replicas.'
      : 'One well-tuned database with a replica for failover is probably enough.',
  ...(total > 1e14 ? ['Over 100 TB: put blobs in object storage and shard the metadata.'] : total > 1e12 ? ['Terabytes: plan partitioning and retention policies early.'] : []),
  ...(egress > 1e9 ? [`About ${fmtB(egress)}/s read egress, so a CDN is essential.`] : []),
];

export const estimate = (c: EstimatorConfig): Estimate => {
  const dau = dauOf(c.dauStep);
  const writeQps = dau * c.writesPerUser / SECONDS_PER_DAY;
  const readQps = writeQps * c.readsPerWrite;
  const peakQps = (writeQps + readQps) * c.peakFactor;
  const bytesPerYear = dau * c.writesPerUser * c.kbPerWrite * 1000 * 365;
  const bytesTotal = bytesPerYear * c.years;
  const egressBps = readQps * c.kbPerWrite * 1000;
  return { dau, writeQps, readQps, peakQps, bytesPerYear, bytesTotal, egressBps, advice: adviceFor(peakQps, bytesTotal, egressBps) };
};
