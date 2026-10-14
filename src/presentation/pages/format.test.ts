import { fmtDuration } from './format';

it('formats durations', () => {
  expect(fmtDuration(120_000)).toBe('2 min');
  expect(fmtDuration(3_900_000)).toBe('1 h 5 min');
});
