import { type AnomId, type LevelId } from './model';

export interface IsolationSignal { readonly level: LevelId; readonly anom: AnomId; readonly anomsSeen: readonly AnomId[] }

declare module '../../curriculum/signals' {
  interface LabSignals { readonly ix: IsolationSignal }
}
