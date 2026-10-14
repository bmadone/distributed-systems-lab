import type { LessonId, PageId } from '../curriculum/ids';
import type { CapChoice } from '../curriculum/exercises';
import type { Signals } from '../curriculum/signals';
import type { Lesson } from '../curriculum/types';
import { grade, type CardState } from '../review/srs';

// ---------- the Progress aggregate ----------
// Everything the learner produces. Pure data; persistence is an adapter's concern.

export interface ExamAttempt { readonly at: number; readonly right: number; readonly total: number }

export interface Progress {
  readonly version: 2;
  readonly predict: Partial<Record<LessonId, number>>;
  /** Quiz answers per lesson: question index → chosen option index. */
  readonly quiz: Partial<Record<LessonId, Readonly<Record<number, number>>>>;
  /** Best quiz score ever reached per lesson (survives "Retake quiz"). */
  readonly quizBest: Partial<Record<LessonId, number>>;
  readonly practice: Partial<Record<LessonId, Readonly<Record<number, true>>>>;
  readonly notes: Partial<Record<LessonId, string>>;
  readonly cards: Readonly<Record<string, CardState>>;
  /** First time each page was opened. */
  readonly visited: Partial<Record<PageId, number>>;
  /** When each lesson was first completed. */
  readonly completed: Partial<Record<LessonId, number>>;
  /** Active reading time per page, in ms. */
  readonly timeMs: Partial<Record<PageId, number>>;
  /** Learning actions per local day, "YYYY-MM-DD" → count. */
  readonly activity: Readonly<Record<string, number>>;
  readonly last: PageId | null;
  readonly scen: Readonly<Record<number, CapChoice>>;
  readonly exams: readonly ExamAttempt[];
}

export const emptyProgress: Progress = {
  version: 2, predict: {}, quiz: {}, quizBest: {}, practice: {}, notes: {}, cards: {},
  visited: {}, completed: {}, timeMs: {}, activity: {}, last: null, scen: {}, exams: [],
};

// ---------- actions ----------

export type Action =
  | { readonly type: 'visit'; readonly page: PageId; readonly now: number }
  | { readonly type: 'predict'; readonly lesson: LessonId; readonly choice: number; readonly now: number }
  | { readonly type: 'quiz'; readonly lesson: LessonId; readonly q: number; readonly choice: number; readonly now: number }
  | { readonly type: 'retryQuiz'; readonly lesson: LessonId }
  | { readonly type: 'numSolved'; readonly lesson: LessonId; readonly task: number; readonly now: number }
  | { readonly type: 'note'; readonly lesson: LessonId; readonly text: string }
  | { readonly type: 'grade'; readonly card: string; readonly ok: boolean; readonly now: number }
  | { readonly type: 'cram' }
  | { readonly type: 'scenario'; readonly index: number; readonly choice: CapChoice; readonly now: number }
  | { readonly type: 'resetScenarios' }
  | { readonly type: 'examFinished'; readonly right: number; readonly total: number; readonly now: number }
  | { readonly type: 'time'; readonly page: PageId; readonly ms: number }
  | { readonly type: 'signal'; readonly key: keyof Signals; readonly value: unknown; readonly now: number }
  | { readonly type: 'import'; readonly progress: Progress }
  | { readonly type: 'reset' };

export interface AppState { readonly progress: Progress; readonly signals: Signals }

// ---------- selectors ----------

export interface LessonStatus {
  readonly predicted: boolean;
  readonly tasksDone: number;
  readonly tasksTotal: number;
  readonly quizAnswered: number;
  readonly quizRight: number;
  readonly quizTotal: number;
  readonly started: boolean;
  readonly done: boolean;
}

export const quizRight = (l: Lesson, answers: Readonly<Record<number, number>> = {}): number =>
  l.quiz.filter((q, i) => answers[i] === q.a).length;

export const lessonStatus = (l: Lesson, p: Progress): LessonStatus => {
  const tasks = p.practice[l.id] ?? {}, answers = p.quiz[l.id] ?? {};
  const predicted = p.predict[l.id] !== undefined;
  const tasksDone = l.practice.filter((_, i) => tasks[i]).length;
  const quizAnswered = l.quiz.filter((_, i) => answers[i] !== undefined).length;
  const done = predicted && tasksDone === l.practice.length && quizAnswered === l.quiz.length;
  return {
    predicted, tasksDone, tasksTotal: l.practice.length, quizAnswered, quizRight: quizRight(l, answers), quizTotal: l.quiz.length,
    started: predicted || tasksDone > 0 || quizAnswered > 0, done: done || p.completed[l.id] !== undefined,
  };
};

export const dayKey = (now: number): string => {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Consecutive days with activity, ending today (or yesterday, so a streak isn't lost before you study today). */
export const streak = (activity: Readonly<Record<string, number>>, now: number): number => {
  const DAY = 86_400_000;
  const start = activity[dayKey(now)] ? now : now - DAY;
  let n = 0;
  while (activity[dayKey(start - n * DAY)]) n++;
  return n;
};

// ---------- reducer ----------

const bump = (p: Progress, now: number): Progress => {
  const k = dayKey(now);
  return { ...p, activity: { ...p.activity, [k]: (p.activity[k] ?? 0) + 1 } };
};

const markTask = (p: Progress, lesson: LessonId, task: number): Progress =>
  ({ ...p, practice: { ...p.practice, [lesson]: { ...p.practice[lesson], [task]: true } } });

/** Mark every unfinished task whose check now passes. Checks are pure, but guard against throws. */
const completeTasks = (lessons: readonly Lesson[], p: Progress, s: Signals, now: number): Progress =>
  lessons.reduce((acc, l) => l.practice.reduce((acc2, t, i) => {
    if (t.kind !== 'task' || acc2.practice[l.id]?.[i]) return acc2;
    let ok = false;
    try { ok = t.check(s); } catch { ok = false; }
    return ok ? bump(markTask(acc2, l.id, i), now) : acc2;
  }, acc), p);

/** Stamp lessons the first time they become complete. */
const stampCompleted = (lessons: readonly Lesson[], p: Progress, now: number): Progress => {
  const fresh = lessons.filter(l => p.completed[l.id] === undefined && lessonStatus(l, p).done);
  return fresh.length ? { ...p, completed: { ...p.completed, ...Object.fromEntries(fresh.map(l => [l.id, now])) } } : p;
};

const updateProgress = (lessons: readonly Lesson[], p: Progress, a: Action, signals: Signals): Progress => {
  switch (a.type) {
    case 'visit':
      return { ...p, last: a.page, visited: p.visited[a.page] ? p.visited : { ...p.visited, [a.page]: a.now } };
    case 'predict':
      return p.predict[a.lesson] !== undefined ? p : bump({ ...p, predict: { ...p.predict, [a.lesson]: a.choice } }, a.now);
    case 'quiz': {
      if (p.quiz[a.lesson]?.[a.q] !== undefined) return p;
      const answers = { ...p.quiz[a.lesson], [a.q]: a.choice };
      const lesson = lessons.find(l => l.id === a.lesson);
      const best = Math.max(p.quizBest[a.lesson] ?? 0, lesson ? quizRight(lesson, answers) : 0);
      return bump({ ...p, quiz: { ...p.quiz, [a.lesson]: answers }, quizBest: { ...p.quizBest, [a.lesson]: best } }, a.now);
    }
    case 'retryQuiz':
      return { ...p, quiz: { ...p.quiz, [a.lesson]: {} } };
    case 'numSolved':
      return bump(markTask(p, a.lesson, a.task), a.now);
    case 'note':
      return { ...p, notes: { ...p.notes, [a.lesson]: a.text } };
    case 'grade':
      return bump({ ...p, cards: { ...p.cards, [a.card]: grade(p.cards[a.card], a.ok, a.now) } }, a.now);
    case 'cram':
      return { ...p, cards: Object.fromEntries(Object.entries(p.cards).map(([k, c]) => [k, { ...c, due: 0 }])) };
    case 'scenario':
      return p.scen[a.index] !== undefined ? p : bump({ ...p, scen: { ...p.scen, [a.index]: a.choice } }, a.now);
    case 'resetScenarios':
      return { ...p, scen: {} };
    case 'examFinished':
      return bump({ ...p, exams: [...p.exams, { at: a.now, right: a.right, total: a.total }].slice(-50) }, a.now);
    case 'time':
      return { ...p, timeMs: { ...p.timeMs, [a.page]: (p.timeMs[a.page] ?? 0) + a.ms } };
    case 'signal':
      return completeTasks(lessons, p, signals, a.now);
    case 'import':
      return a.progress;
    case 'reset':
      return emptyProgress;
  }
};

export const makeReducer = (lessons: readonly Lesson[]) => (s: AppState, a: Action): AppState => {
  const signals = a.type === 'signal' ? { ...s.signals, [a.key]: a.value } : a.type === 'reset' ? {} : s.signals;
  const progress = updateProgress(lessons, s.progress, a, signals);
  // Only actions that carry a timestamp can complete a lesson, which keeps the reducer pure.
  const stamped = progress === s.progress || !('now' in a) ? progress : stampCompleted(lessons, progress, a.now);
  return stamped === s.progress && signals === s.signals ? s : { progress: stamped, signals };
};
