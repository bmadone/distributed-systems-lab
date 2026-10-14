import { nextRandom, range } from '../../shared-kernel/fp';

// Pure model of a timeout-based failure detector over a fixed trace of heartbeat delays.

export const T_MIN = 50;
export const T_MAX = 3000;
export const T_STEP = 10;
export const DEFAULT_T = 300;

/** GC pauses injected at fixed positions: [index, delay ms]. */
const PAUSES: readonly (readonly [number, number])[] = [[23, 320], [61, 450], [88, 610], [120, 880], [151, 1650], [182, 2400]];

/**
 * 200 heartbeat delays from a seeded PRNG: 20–120 ms of jitter, a 10% chance of up to 120 ms
 * extra, plus the injected pauses.
 */
export const makeDelays = (seed: number, n: number): readonly number[] => {
  const { out } = range(n).reduce<{ readonly s: number; readonly out: readonly number[] }>(({ s, out }) => {
    const [r1, s1] = nextRandom(s);
    const [r2, s2] = nextRandom(s1);
    const [extra, s3] = r2 < 0.1 ? (([r3, s]) => [r3 * 120, s] as const)(nextRandom(s2)) : [0, s2] as const;
    return { s: s3, out: [...out, Math.round(20 + r1 * 100 + extra)] };
  }, { s: seed, out: [] });
  return out.map((v, i) => PAUSES.find(([j]) => j === i)?.[1] ?? v);
};

export const DELAYS: readonly number[] = makeDelays(7, 200);

/** Heartbeats slower than the timeout: a healthy node wrongly declared dead. */
export const falseSuspicions = (t: number, delays: readonly number[] = DELAYS): number => delays.filter(v => v > t).length;

/** After a real crash the monitor needs the whole timeout to notice. */
export const detectionSeconds = (t: number): number => t / 1000;

export type Tone = 'good' | 'warn' | 'bad';
export const suspicionTone = (f: number): Tone => (f === 0 ? 'good' : f <= 2 ? 'warn' : 'bad');
export const detectionTone = (t: number): Tone => (t <= 1000 ? 'good' : t <= 2000 ? 'warn' : 'bad');

/** SVG y for a delay (sqrt scale, capped at T_MAX). */
export const yOf = (v: number): number => 150 - Math.sqrt(Math.min(v, T_MAX) / T_MAX) * 135;
