import { type VcSeen } from './model';

export type VcSignal = VcSeen;

declare module '../../curriculum/signals' {
  interface LabSignals { readonly vclock: VcSignal }
}
