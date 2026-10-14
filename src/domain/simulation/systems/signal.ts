import { type SystemFilter } from './model';

export interface SystemsSignal { readonly filter: SystemFilter; readonly pinned: readonly string[] }

declare module '../../curriculum/signals' {
  interface LabSignals { readonly systems: SystemsSignal }
}
