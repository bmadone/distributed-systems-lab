import { LESSONS } from '../curriculum/catalog';
import { dayKey, emptyProgress } from './progress';
import { summarize } from './summary';

const NOW = new Date(2026, 9, 14, 12).getTime();

describe('progress summary', () => {
  it('is all zeros for a fresh learner', () => {
    const s = summarize(emptyProgress, NOW);
    expect(s.lessonsDone).toBe(0);
    expect(s.tasksDone).toBe(0);
    expect(s.accuracy).toBeNull();
    expect(s.streak).toBe(0);
    expect(s.heat).toHaveLength(84);
    expect(s.parts.reduce((n, p) => n + p.total, 0)).toBe(LESSONS.length);
  });

  it('computes accuracy, time and the heatmap from progress', () => {
    const cap = LESSONS.find(l => l.id === 'cap')!;
    const s = summarize({
      ...emptyProgress,
      quiz: { cap: { 0: cap.quiz[0]!.a, 1: (cap.quiz[1]!.a + 1) % cap.quiz[1]!.opts.length } },
      timeMs: { cap: 90_000, review: 30_000 },
      activity: { [dayKey(NOW)]: 4 },
    }, NOW);
    expect(s.accuracy).toBe(0.5);
    expect(s.timeMs).toBe(120_000);
    expect(s.heat.at(-1)).toBe(4);
    expect(s.streak).toBe(1);
  });
});

describe('what is left', () => {
  it('sums minutes of incomplete lessons and finds the next one', async () => {
    const { minutesLeft, nextLesson } = await import('./summary');
    expect(minutesLeft(emptyProgress)).toBe(LESSONS.reduce((n, l) => n + l.minutes, 0));
    expect(nextLesson(emptyProgress)?.id).toBe(LESSONS[0]?.id);
    const first = LESSONS[0]!;
    const done = { ...emptyProgress, completed: { [first.id]: 1 } };
    expect(minutesLeft(done)).toBe(minutesLeft(emptyProgress) - first.minutes);
    expect(nextLesson(done)?.id).toBe(LESSONS[1]?.id);
  });
});
