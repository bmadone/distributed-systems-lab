import { LESSONS } from '../curriculum/catalog';
import { PARTS } from '../curriculum/ids';
import { unlockedCards } from './deck';
import { range, sum } from '../shared-kernel/fp';
import { dayKey, lessonStatus, streak, type Progress } from './progress';

const DAY = 86_400_000;
export const HEAT_DAYS = 84;

/** Estimated minutes left: the sum of `minutes` over lessons not yet complete. */
export const minutesLeft = (p: Progress): number =>
  sum(LESSONS.filter(l => !lessonStatus(l, p).done).map(l => l.minutes));

/** The first lesson not yet complete, if any. */
export const nextLesson = (p: Progress) => LESSONS.find(l => !lessonStatus(l, p).done);

export const completedCount = (p: Progress): number => LESSONS.filter(l => lessonStatus(l, p).done).length;

/** Pure summary of everything on the dashboard, so it can be unit-tested. */
export const summarize = (p: Progress, now: number) => {
  const statuses = LESSONS.map(l => ({ lesson: l, st: lessonStatus(l, p) }));
  const answered = sum(statuses.map(s => s.st.quizAnswered));
  const right = sum(statuses.map(s => s.st.quizRight));
  return {
    statuses,
    lessonsDone: statuses.filter(s => s.st.done).length,
    tasksDone: sum(statuses.map(s => s.st.tasksDone)),
    tasksTotal: sum(statuses.map(s => s.st.tasksTotal)),
    accuracy: answered ? right / answered : null,
    timeMs: sum(Object.values(p.timeMs).map(v => v ?? 0)),
    streak: streak(p.activity, now),
    mastered: unlockedCards(p).filter(c => (p.cards[c.id]?.box ?? 0) >= 3).length,
    parts: PARTS.map(part => {
      const ls = statuses.filter(s => s.lesson.part === part.id);
      return { part, done: ls.filter(s => s.st.done).length, total: ls.length };
    }).filter(x => x.total > 0),
    heat: range(HEAT_DAYS).map(i => p.activity[dayKey(now - (HEAT_DAYS - 1 - i) * DAY)] ?? 0),
  };
};

