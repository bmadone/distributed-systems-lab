import {  type CapMode } from './model';

export interface CapSignal {
  readonly step: number; readonly lost: number; readonly cpMajorityWrite: boolean
  readonly mode: CapMode; readonly rejected: number; readonly stale: number; readonly diverged: boolean
}

declare module '../../curriculum/signals' {
  interface LabSignals { readonly cap: CapSignal }
}
