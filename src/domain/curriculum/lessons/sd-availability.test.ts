import lesson from './sd-availability';

const nums = lesson.practice.flatMap(t => (t.kind === 'num' ? [t] : []));
const within = (x: number, t: { answer: number; tol: number }) => Math.abs(x - t.answer) <= t.tol;

describe('sd-availability numeric tasks', () => {
  it('match plain-math values (in order after the two original ones)', () => {
    const budgetLeft = 0.0005 * 30 * 24 * 60 - 15;
    const three = (1 - 0.05 ** 3) * 100;
    const downHours = (4 / (720 + 4)) * 8760;
    const eleven = 0.9999 ** 11 * 100;
    const minCopies = [1, 2, 3, 4, 5, 6, 7].find(n => 1 - 0.1 ** n >= 0.99995 - 1e-12);
    const expected = [99.8, 43.2, budgetLeft, three, downHours, eleven, minCopies ?? NaN];
    expect(nums).toHaveLength(expected.length);
    nums.forEach((t, i) => expect(within(expected[i] ?? NaN, t)).toBe(true));
  });
  it('original numerics: 99.9% x 99.9% and 43.2 minutes', () => {
    expect(0.999 * 0.999 * 100).toBeCloseTo(99.8, 1);
    expect(0.001 * 30 * 24 * 60).toBeCloseTo(43.2, 5);
  });
  it('has the required amount of content', () => {
    expect(lesson.quiz.length).toBeGreaterThanOrEqual(10);
    expect(lesson.practice.length).toBeGreaterThanOrEqual(8);
  });
});
