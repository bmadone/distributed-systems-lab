import { type RaftSeen } from './model';

export type RaftSignal = RaftSeen;

declare module '../../curriculum/signals' {
  interface LabSignals { readonly raft: RaftSignal }
}
