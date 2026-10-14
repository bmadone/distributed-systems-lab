export interface TailLatencySignal {
  readonly n: number;
  /** Share of user requests that are slow. */
  readonly p: number;
  /** Probability that a single backend is slow (0.01 = 1%). */
  readonly slowP: number;
}

declare module '../../curriculum/signals' {
  interface LabSignals { readonly tailLatency: TailLatencySignal }
}
