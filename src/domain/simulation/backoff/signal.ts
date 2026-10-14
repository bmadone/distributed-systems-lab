import { type BackoffFacts } from './model';

export type BackoffSignal = BackoffFacts;

declare module '../../curriculum/signals' {
  interface LabSignals { readonly backoff: BackoffSignal }
}
