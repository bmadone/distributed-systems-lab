import lesson from './sd-storage';

const nums = lesson.practice.flatMap(t => (t.kind === 'num' ? [t] : []));
const within = (x: number, t: { answer: number; tol: number }) => Math.abs(x - t.answer) <= t.tol;

describe('sd-storage numeric tasks', () => {
  it('match plain-math values', () => {
    const years = 1 / (1e7 * 1e-11);
    const levels = Math.ceil(Math.log(1e9) / Math.log(500));
    const writes = 2000 * (1 + 6);
    const depth = [...Array(20).keys()].find(d => 1e6 / 4 ** d <= 100) ?? NaN;
    const cost = 3e6 * 0.021;
    const expected = [years, levels, writes, depth, cost];
    expect(nums).toHaveLength(expected.length);
    nums.forEach((t, i) => expect(within(expected[i] ?? NaN, t)).toBe(true));
  });
  it('has the required amount of content', () => {
    expect(lesson.quiz.length).toBeGreaterThanOrEqual(10);
    expect(lesson.practice.length).toBeGreaterThanOrEqual(8);
  });
});
