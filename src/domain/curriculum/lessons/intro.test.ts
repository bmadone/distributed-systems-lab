import { SORTERS } from '../exercises';
import intro from './intro';

describe('intro practice numerics', () => {
  it('series availability, fleet-down odds, expected attempts, MTBF and clock drift', () => {
    expect(0.999 ** 5 * 100).toBeCloseTo(99.5, 1);
    expect((1 - 0.98 ** 20) * 100).toBeCloseTo(33.2, 1);
    expect(1 / (0.8 * 0.8)).toBeCloseTo(1.56, 2);
    expect((3 * 365 * 24) / 5000).toBeCloseTo(5.26, 2);
    expect(0.010 / 100e-6).toBe(100);
    expect(86400 * 100e-6).toBeCloseTo(8.64, 2);
  });
  it('every numeric task answer matches the maths above', () => {
    const answers = intro.practice.flatMap(t => (t.kind === 'num' ? [t.answer] : []));
    expect(answers).toEqual([63, 99.5, 33.2, 1.56, 5.26, 100, 8.64]);
  });
  it('the safety/liveness sorter has 12 items, 6 of each', () => {
    const items = SORTERS.sl.items;
    expect(items).toHaveLength(12);
    expect(items.filter(i => i.answer === 0)).toHaveLength(6);
  });
});
