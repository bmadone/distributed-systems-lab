import type { CapChoice } from '../domain/curriculum/exercises';
import type { LessonId, PageId } from '../domain/curriculum/ids';
import type { Signals } from '../domain/curriculum/signals';
import type { Lesson } from '../domain/curriculum/types';
import { makeReducer, type Action, type AppState, type Progress } from '../domain/learning/progress';
import type { Clock, ProgressRepository } from './ports';

// The driving port: one object exposing every use case. The UI, tests and any future CLI call this;
// none of them touch the reducer, the clock or storage directly.

export interface LearningApi {
  readonly getState: () => AppState;
  readonly subscribe: (listener: () => void) => () => void;
  readonly visit: (page: PageId) => void;
  readonly predict: (lesson: LessonId, choice: number) => void;
  readonly answerQuiz: (lesson: LessonId, q: number, choice: number) => void;
  readonly retakeQuiz: (lesson: LessonId) => void;
  readonly solveNumeric: (lesson: LessonId, task: number) => void;
  readonly saveNote: (lesson: LessonId, text: string) => void;
  readonly gradeCard: (card: string, ok: boolean) => void;
  readonly cramCards: () => void;
  readonly answerScenario: (index: number, choice: CapChoice) => void;
  readonly resetScenarios: () => void;
  readonly finishExam: (right: number, total: number) => void;
  readonly trackTime: (page: PageId, ms: number) => void;
  readonly reportSignal: <K extends keyof Signals>(key: K, value: NonNullable<Signals[K]>) => void;
  readonly importProgress: (progress: Progress) => void;
  /** Wipes progress. Lab settings are cleared by the caller's `LabSettingsRepository`. */
  readonly resetProgress: () => void;
}

export interface LearningDeps {
  readonly lessons: readonly Lesson[];
  readonly progress: ProgressRepository;
  readonly clock: Clock;
}

/** Wires the pure domain reducer to a repository and a clock. State changes are saved only when progress changed. */
export const createLearningApi = ({ lessons, progress, clock }: LearningDeps): LearningApi => {
  const reducer = makeReducer(lessons);
  const listeners = new Set<() => void>();
  let state: AppState = { progress: progress.load(), signals: {} };

  const dispatch = (a: Action): void => {
    const next = reducer(state, a);
    if (next === state) return;
    const changed = next.progress !== state.progress;
    state = next;
    if (changed) progress.save(next.progress);
    listeners.forEach(fn => fn());
  };
  const at = () => clock.now();

  return {
    getState: () => state,
    subscribe: fn => { listeners.add(fn); return () => { listeners.delete(fn); }; },
    visit: page => dispatch({ type: 'visit', page, now: at() }),
    predict: (lesson, choice) => dispatch({ type: 'predict', lesson, choice, now: at() }),
    answerQuiz: (lesson, q, choice) => dispatch({ type: 'quiz', lesson, q, choice, now: at() }),
    retakeQuiz: lesson => dispatch({ type: 'retryQuiz', lesson }),
    solveNumeric: (lesson, task) => dispatch({ type: 'numSolved', lesson, task, now: at() }),
    saveNote: (lesson, text) => dispatch({ type: 'note', lesson, text }),
    gradeCard: (card, ok) => dispatch({ type: 'grade', card, ok, now: at() }),
    cramCards: () => dispatch({ type: 'cram' }),
    answerScenario: (index, choice) => dispatch({ type: 'scenario', index, choice, now: at() }),
    resetScenarios: () => dispatch({ type: 'resetScenarios' }),
    finishExam: (right, total) => dispatch({ type: 'examFinished', right, total, now: at() }),
    trackTime: (page, ms) => dispatch({ type: 'time', page, ms }),
    reportSignal: (key, value) => dispatch({ type: 'signal', key, value, now: at() }),
    importProgress: p => dispatch({ type: 'import', progress: p }),
    resetProgress: () => { progress.clear(); dispatch({ type: 'reset' }); },
  };
};
