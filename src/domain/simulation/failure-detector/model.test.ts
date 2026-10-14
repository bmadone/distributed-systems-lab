import { range } from '../../shared-kernel/fp';
import { DEFAULT_T, DELAYS, falseSuspicions, T_MAX, T_MIN, T_STEP } from './model';

const slider = range(Math.floor((T_MAX - T_MIN) / T_STEP) + 1).map(i => T_MIN + i * T_STEP);
// Practice-task predicates, from the lesson wording.
const zeroFalse = (t: number) => falseSuspicions(t) === 0;
const fastAndFew = (t: number) => falseSuspicions(t) <= 2 && t <= 1000;

describe('failure detector model', () => {
  it('has 200 delays with the injected GC pauses', () => {
    expect(DELAYS).toHaveLength(200);
    expect(DELAYS[23]).toBe(320);
    expect(DELAYS[182]).toBe(2400);
    // natural jitter stays below 240 ms
    expect(DELAYS.filter((_, i) => ![23, 61, 88, 120, 151, 182].includes(i)).every(v => v >= 20 && v <= 240)).toBe(true);
  });
  it('counts false suspicions purely from the threshold', () => {
    expect(falseSuspicions(DEFAULT_T)).toBe(6);
    expect(falseSuspicions(900)).toBe(2);
    expect(falseSuspicions(2400)).toBe(0);
  });
  it('the default timeout does not solve any practice task', () => {
    expect(zeroFalse(DEFAULT_T)).toBe(false);
    expect(fastAndFew(DEFAULT_T)).toBe(false);
  });
  it('both tasks are reachable on the slider', () => {
    expect(slider.some(zeroFalse)).toBe(true);
    expect(slider.some(fastAndFew)).toBe(true);
  });
  it('new tasks are reachable and not solved by the default', () => {
    const quick = (t: number) => t <= 500 && falseSuspicions(t) <= 4;
    expect(quick(DEFAULT_T)).toBe(false);
    expect(slider.some(quick)).toBe(true);
    expect(falseSuspicions(DEFAULT_T)).not.toBe(3);
    expect(falseSuspicions(DEFAULT_T)).not.toBe(1);
    expect(slider.some(t => falseSuspicions(t) === 3)).toBe(true);
    expect(slider.some(t => falseSuspicions(t) === 1)).toBe(true);
  });
  it('numeric tasks', () => {
    expect(falseSuspicions(700)).toBe(3);
    expect((falseSuspicions(700) / DELAYS.length) * 3600).toBe(54);
    expect(500 * 360 * 0.002).toBe(360);
    expect((1.5 + 0.8 + 0.3) * 4).toBeCloseTo(10.4, 10);
  });
});
