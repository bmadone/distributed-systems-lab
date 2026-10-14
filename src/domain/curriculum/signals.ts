import type { MatcherId, SorterId } from './ids';

// Labs publish what the learner has done as typed "signals"; practice tasks are pure predicates
// over them. Each lab declares its own signal by augmenting `LabSignals` from its own module:
//
//   declare module '../../course/signals' {
//     interface LabSignals { quorum: { N: number; W: number; R: number; overlap: boolean } }
//   }
//
// so labs stay decoupled and every check is type-checked against the lab that feeds it.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LabSignals {}

export interface SorterResult { readonly right: number; readonly total: number; readonly allRight: boolean }
export interface MatcherResult { readonly right: number; readonly total: number; readonly allRight: boolean }

type ExerciseSignals =
  & { readonly [K in SorterId as `sorter:${K}`]: SorterResult }
  & { readonly [K in MatcherId as `matcher:${K}`]: MatcherResult };

/** Everything a practice task can look at. Any signal may be absent until its lab reports. */
export type Signals = Partial<{ readonly [K in keyof LabSignals]: LabSignals[K] } & ExerciseSignals>;
export type SignalKey = keyof Signals;

export const sorterDone = (s: Signals, id: SorterId): boolean => s[`sorter:${id}`]?.allRight === true;
export const matcherDone = (s: Signals, id: MatcherId): boolean => s[`matcher:${id}`]?.allRight === true;
