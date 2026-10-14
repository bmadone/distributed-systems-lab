export interface QuorumSignal { readonly N: number; readonly W: number; readonly R: number; readonly canW: boolean; readonly canR: boolean; readonly overlap: boolean
  readonly writesIntersect: boolean; readonly writeMs: number | null; readonly readMs: number | null; readonly downCount: number }

declare module '../../curriculum/signals' {
  interface LabSignals { readonly quorum: QuorumSignal }
}
