import lesson from './sd-comm';

const nums = lesson.practice.flatMap(t => (t.kind === 'num' ? [t] : []));
const within = (x: number, t: { answer: number; tol: number }) => Math.abs(x - t.answer) <= t.tol;

describe('sd-comm numeric tasks', () => {
  it('match plain-math values', () => {
    const parallelMs = 25 + Math.max(80, 60) + 120;
    const backoff = [100, 200, 400, 800, 1600].reduce((a, b) => a + b, 0);
    const stillFail = 0.05 ** 3 * 100;
    const consumers = Math.ceil(1200 / (150 * 0.75));
    const savedMBs = (5000 * 2000 * (1 - 0.4)) / 1e6;
    const backlog = (3000 - 1800) * 20;
    const drain = backlog / (1800 - 1000);
    const expected = [parallelMs, backoff, stillFail, consumers, savedMBs, drain];
    expect(nums).toHaveLength(expected.length);
    nums.forEach((t, i) => expect(within(expected[i] ?? NaN, t)).toBe(true));
  });
  it('has the required amount of content', () => {
    expect(lesson.quiz.length).toBeGreaterThanOrEqual(10);
    expect(lesson.practice.length).toBeGreaterThanOrEqual(8);
  });
});
