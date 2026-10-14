import { type Mode } from './model';

export interface ReplicationSignal {
  readonly mode: Mode; readonly stale: boolean; readonly crash: boolean; readonly lost: boolean;
  /** Replication lag to C (ms). */ readonly lag: number;
  /** When Client 1 receives OK (ms), or null if never confirmed. */ readonly ack: number | null;
  /** What Client 2's read returned. */ readonly value: 0 | 1;
}

declare module '../../curriculum/signals' {
  interface LabSignals { readonly replication: ReplicationSignal }
}
