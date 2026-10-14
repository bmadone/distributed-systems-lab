import {  type Move, type Strategy } from './model';

export interface PartitioningSignal { readonly strategy: Strategy; readonly n: number; readonly vn: boolean; readonly lastMove: Move | null; readonly maxShare: number; /** Keys held by each node. */ readonly counts: readonly number[] }

declare module '../../curriculum/signals' {
  interface LabSignals { readonly partitioning: PartitioningSignal }
}
