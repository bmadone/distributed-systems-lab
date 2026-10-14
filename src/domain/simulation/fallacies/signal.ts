export interface FallaciesSignal { readonly revealed: number; /** Indices of the cards currently open. */ readonly open: readonly number[] }

export interface LatencyLadderSignal { readonly human: boolean }

declare module '../../curriculum/signals' {
  interface LabSignals { readonly fallacies: FallaciesSignal; readonly latencyLadder: LatencyLadderSignal }
}
