import { z } from 'zod';
import { isLessonId, isPageId } from '../../domain/curriculum/ids';
import { type Progress } from '../../domain/learning/progress';
import { type CardState } from '../../domain/review/srs';

// Persistence DTOs: lenient zod schemas that read stored JSON into the domain's Progress.
// Unknown keys are dropped and broken fields fall back to empty, never throw.

const num = z.number().finite();
const rec = <T extends z.ZodTypeAny>(v: T) => z.record(z.string(), v).catch({});
const card = z.object({ box: z.number().int().min(0).max(4), due: num });

export const progressSchema = z.object({
  predict: rec(num), quiz: rec(rec(num)), quizBest: rec(num), practice: rec(rec(z.literal(true))),
  notes: rec(z.string()), cards: rec(card), visited: rec(num), completed: rec(num), timeMs: rec(num),
  activity: rec(num), last: z.string().nullable().catch(null), scen: rec(z.enum(['CP', 'AP'])),
  exams: z.array(z.object({ at: num, right: num, total: num })).catch([]),
}).partial();

/** Version 1 (the single-file vanilla build) stored `visited` as booleans and had no timestamps. */
export const legacySchema = z.object({
  predict: rec(num), quiz: rec(rec(num)), practice: rec(rec(z.literal(true))), notes: rec(z.string()),
  cards: rec(card), visited: rec(z.boolean()), last: z.string().nullable().catch(null), scen: rec(z.enum(['CP', 'AP'])),
}).partial();

const pick = <V,>(r: Readonly<Record<string, V>> | undefined, ok: (k: string) => boolean): Record<string, V> =>
  Object.fromEntries(Object.entries(r ?? {}).filter(([k]) => ok(k)));
const numKeys = <V,>(r: Readonly<Record<string, V>>): Record<number, V> =>
  Object.fromEntries(Object.entries(r).filter(([k]) => /^\d+$/.test(k)).map(([k, v]) => [Number(k), v]));
const mapVals = <A, B>(r: Readonly<Record<string, A>>, f: (a: A) => B): Record<string, B> =>
  Object.fromEntries(Object.entries(r).map(([k, v]) => [k, f(v)]));

export const fromParsed = (p: z.infer<typeof progressSchema>): Progress => ({
  version: 2,
  predict: pick(p.predict, isLessonId),
  quiz: mapVals(pick(p.quiz, isLessonId), numKeys),
  quizBest: pick(p.quizBest, isLessonId),
  practice: mapVals(pick(p.practice, isLessonId), numKeys),
  notes: pick(p.notes, isLessonId),
  cards: mapVals(p.cards ?? {}, c => ({ box: c.box as CardState['box'], due: c.due })),
  visited: pick(p.visited, isPageId),
  completed: pick(p.completed, isLessonId),
  timeMs: pick(p.timeMs, isPageId),
  activity: pick(p.activity, k => /^\d{4}-\d{2}-\d{2}$/.test(k)),
  last: p.last != null && isPageId(p.last) ? p.last : null,
  scen: numKeys(p.scen ?? {}),
  exams: p.exams ?? [],
});

export const fromLegacy = (p: z.infer<typeof legacySchema>, now: number): Progress =>
  fromParsed({ ...p, visited: mapVals(Object.fromEntries(Object.entries(p.visited ?? {}).filter(([, v]) => v)), () => now) });

