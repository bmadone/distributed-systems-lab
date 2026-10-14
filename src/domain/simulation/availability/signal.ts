export interface AvailabilitySignal {
  readonly total: number;
  readonly instances: number;
  /** Index of the weakest tier on the critical path (0 = load balancer). */
  readonly weakest: number;
  readonly counts: readonly number[];
  readonly degrade: boolean;
}

declare module '../../curriculum/signals' {
  interface LabSignals { readonly availability: AvailabilitySignal }
}
