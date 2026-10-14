export interface CacheSignal {
  readonly size: number; readonly skew: number; readonly hit: number;
  /** Best possible hit ratio for this size (top-k items). */
  readonly ideal: number;
  readonly latencyMs: number;
  readonly dbPer1000: number;
}

declare module '../../curriculum/signals' {
  interface LabSignals { readonly cache: CacheSignal }
}
