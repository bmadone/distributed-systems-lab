export interface EstimatorSignal {
  readonly peak: number;
  readonly writeQps: number;
  readonly readQps: number;
  readonly bytesPerYear: number;
  readonly bytesTotal: number;
  readonly egressBps: number;
  readonly readsPerWrite: number;
  readonly kbPerWrite: number;
  readonly years: number;
}

declare module '../../curriculum/signals' {
  interface LabSignals { readonly estimator: EstimatorSignal }
}
