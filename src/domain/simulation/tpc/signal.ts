import {  type TpcSeen } from './model';

export interface TpcSignal {
  readonly seen: TpcSeen
  readonly step: number; readonly msgs: number; readonly locked: number
  readonly outcome: 'commit' | 'abort' | 'blocked' | null
  readonly no: boolean; readonly crash: boolean
}

declare module '../../curriculum/signals' {
  interface LabSignals { readonly tpc: TpcSignal }
}
