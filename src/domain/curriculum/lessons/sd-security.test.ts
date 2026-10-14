import lesson from './sd-security';

describe('sd-security numeric practice', () => {
  it('answers match plain math', () => {
    const computed = [
      62 ** 8 / 1e10 / 3600,
      6 * Math.log2(7776),
      1e6 / 20 / 3600,
      1e6 / 5,
      200 / 40,
      5000 * 2e6,
      2 ** (13 - 10),
    ];
    const nums = lesson.practice.flatMap(p => (p.kind === 'num' ? [p] : []));
    expect(nums).toHaveLength(computed.length);
    nums.forEach((n, i) => expect(Math.abs(n.answer - (computed[i] ?? NaN))).toBeLessThanOrEqual(n.tol + 0.1));
    expect(nums.map(n => n.answer)).toEqual([6.1, 77.6, 13.9, 200000, 5, 1e10, 8]);
  });
});
