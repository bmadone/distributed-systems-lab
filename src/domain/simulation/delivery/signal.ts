import { type Strategy } from './model';

export interface DeliveryRun { readonly strategy: Strategy; readonly loss: number; readonly n: number; readonly ok: number; readonly lost: number; readonly dup: number; /** Payments whose final outcome the client never learned. */ readonly unk: number }

export interface DeliverySignal { readonly last: DeliveryRun | null; readonly everDup: boolean }

declare module '../../curriculum/signals' {
  interface LabSignals { readonly delivery: DeliverySignal }
}
