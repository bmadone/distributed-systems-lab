import { type SagaFail } from './model';

export interface SagaSignal { readonly ranFail: SagaFail | null; readonly ran: readonly SagaFail[] }

declare module '../../curriculum/signals' {
  interface LabSignals { readonly saga: SagaSignal }
}
