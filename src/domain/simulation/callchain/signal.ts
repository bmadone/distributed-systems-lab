export interface CallChainSignal {
  readonly paymentSync: boolean;
  readonly avail: number;
  readonly latency: number;
  readonly worstLatency: number;
  readonly syncN: number;
  readonly retry: boolean;
}

declare module '../../curriculum/signals' {
  interface LabSignals { readonly callChain: CallChainSignal }
}
