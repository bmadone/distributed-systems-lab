import { LESSONS } from '../curriculum/catalog';
import { emptyProgress, lessonStatus, makeReducer, streak, dayKey, type AppState } from './progress';
import { grade } from '../review/srs';

const reduce = makeReducer(LESSONS);
const s0: AppState = { progress: emptyProgress, signals: {} };
const NOW = new Date(2026, 9, 14, 12).getTime();
const DAY = 86_400_000;

describe('progress reducer', () => {
  it('returns the same state for no-op actions', () => {
    const s1 = reduce(s0, { type: 'predict', lesson: 'cap', choice: 1, now: NOW });
    expect(reduce(s1, { type: 'predict', lesson: 'cap', choice: 2, now: NOW })).toBe(s1);
  });

  it('records quiz answers, keeps best score through a retake', () => {
    const cap = LESSONS.find(l => l.id === 'cap')!;
    let s = s0;
    cap.quiz.forEach((q, i) => { s = reduce(s, { type: 'quiz', lesson: 'cap', q: i, choice: q.a, now: NOW }); });
    expect(s.progress.quizBest.cap).toBe(cap.quiz.length);
    s = reduce(s, { type: 'retryQuiz', lesson: 'cap' });
    expect(s.progress.quiz.cap).toEqual({});
    expect(s.progress.quizBest.cap).toBe(cap.quiz.length);
  });

  it('stamps completion once and keeps it after a retake', () => {
    const l = LESSONS[0]!;
    let s = reduce(s0, { type: 'predict', lesson: l.id, choice: 0, now: NOW });
    l.practice.forEach((_, i) => { s = reduce(s, { type: 'numSolved', lesson: l.id, task: i, now: NOW }); });
    l.quiz.forEach((_, i) => { s = reduce(s, { type: 'quiz', lesson: l.id, q: i, choice: 0, now: NOW + 1 }); });
    expect(s.progress.completed[l.id]).toBe(NOW + 1);
    s = reduce(s, { type: 'retryQuiz', lesson: l.id });
    expect(lessonStatus(l, s.progress).done).toBe(true);
  });

  it('counts activity per day and computes streaks', () => {
    let s = s0;
    [0, 1, 2].forEach(d => { s = reduce(s, { type: 'predict', lesson: LESSONS[d]!.id, choice: 0, now: NOW - d * DAY }); });
    expect(s.progress.activity[dayKey(NOW)]).toBe(1);
    expect(streak(s.progress.activity, NOW)).toBe(3);
    expect(streak(s.progress.activity, NOW + DAY)).toBe(3);
    expect(streak(s.progress.activity, NOW + 2 * DAY)).toBe(0);
  });

  it('reset clears progress and signals', () => {
    const s = reduce(reduce(s0, { type: 'note', lesson: 'cap', text: 'x' }), { type: 'reset' });
    expect(s.progress).toEqual(emptyProgress);
    expect(s.signals).toEqual({});
  });
});

describe('spaced repetition', () => {
  it('moves up on success and back to box 1 on a miss', () => {
    const a = grade(undefined, true, NOW);
    expect(a).toEqual({ box: 1, due: NOW + DAY });
    expect(grade(a, false, NOW)).toEqual({ box: 0, due: NOW + 60_000 });
    expect(grade({ box: 4, due: 0 }, true, NOW).box).toBe(4);
  });
});
