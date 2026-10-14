import type { LessonId, PartId } from './ids';
import type { Signals } from './signals';

/** Trusted, author-written inline HTML (only <b>, <i>, <code>, <small>, <br>). Rendered with <Rich>. */
export type Rich = string;

export interface Choice {
  readonly q: Rich;
  readonly opts: readonly Rich[];
  /** Index into `opts` of the correct answer. Validated by course.test.ts. */
  readonly a: number;
}
export interface Predict extends Choice { readonly reveal: Rich }
export interface QuizItem extends Choice { readonly why: Rich }

export type Task =
  | { readonly kind: 'task'; readonly text: Rich; readonly check: (s: Signals) => boolean }
  | { readonly kind: 'num'; readonly text: Rich; readonly answer: number; readonly tol: number; readonly unit?: string };

export type Card = readonly [front: Rich, back: Rich];

export interface Lesson {
  readonly id: LessonId;
  readonly part: PartId;
  readonly title: string;
  readonly minutes: number;
  readonly objectives: readonly string[];
  readonly predict: Predict;
  readonly practice: readonly Task[];
  readonly quiz: readonly QuizItem[];
  readonly explain: { readonly prompt: Rich; readonly model: Rich };
  readonly takeaways: readonly Rich[];
  readonly cards: readonly Card[];
}

export const defineLesson = <const L extends Lesson>(l: L): L => l;
