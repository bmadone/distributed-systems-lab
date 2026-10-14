import lesson from './sd-intro';

const nums = lesson.practice.flatMap(t => (t.kind === 'num' ? [t] : []));
const within = (x: number, t: { answer: number; tol: number }) => Math.abs(x - t.answer) <= t.tol;

describe('sd-intro numeric tasks', () => {
  it('match plain-math values', () => {
    const peak = (10e6 * 20) / 86400 * 3;
    const servers = Math.ceil(50000 / (800 * 0.7));
    const petabytes = (1e6 * 4 * 365) / 1e9;
    const tbps = (65e6 * 5e6) / 1e12;
    const slow = 5000 * 60 * 0.01;
    const expected = [peak, servers, petabytes, tbps, slow];
    expect(nums).toHaveLength(expected.length);
    nums.forEach((t, i) => expect(within(expected[i] ?? NaN, t)).toBe(true));
  });
  it('has the required amount of content', () => {
    expect(lesson.quiz.length).toBeGreaterThanOrEqual(10);
    expect(lesson.practice.length).toBeGreaterThanOrEqual(8);
  });
});
