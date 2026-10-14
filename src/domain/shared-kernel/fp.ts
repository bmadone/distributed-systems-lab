// Small, pure helpers. Nothing here touches the DOM or mutates its inputs.

export const range = (n: number, from = 0): readonly number[] => Array.from({ length: Math.max(0, n) }, (_, i) => from + i);
export const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);
export const clamp = (lo: number, hi: number, x: number): number => Math.min(hi, Math.max(lo, x));
export const round = (x: number, digits = 0): number => { const f = 10 ** digits; return Math.round(x * f) / f; };
export const pct = (x: number, digits = 1): string => `${(x * 100).toFixed(digits)}%`;

/** Immutable record update: returns a new object with `key` set. */
export const assoc = <T extends object, K extends keyof T>(obj: T, key: K, value: T[K]): T => ({ ...obj, [key]: value });

/** Exhaustiveness guard for discriminated unions. */
export const absurd = (x: never): never => { throw new Error(`Unexpected value: ${JSON.stringify(x)}`); };

/** Seeded PRNG (mulberry32). Returns the next value and the next state, so callers stay pure. */
export const nextRandom = (state: number): readonly [value: number, state: number] => {
  const s = (state + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
};

/** `n` deterministic random numbers in [0, 1) from `seed`. */
export const randoms = (seed: number, n: number): readonly number[] => {
  const out: number[] = [];
  let s = seed >>> 0;
  for (let i = 0; i < n; i++) { const [v, s2] = nextRandom(s); out.push(v); s = s2; }
  return out;
};

/** FNV-1a 32-bit string hash. */
export const fnv1a = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** Deterministic Fisher–Yates shuffle keyed by a string seed. */
export const seededShuffle = <T,>(seed: string, xs: readonly T[]): readonly T[] => {
  const out = [...xs];
  const rs = randoms(fnv1a(seed), out.length);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor((rs[i] ?? 0) * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
};

export const groupBy = <T, K extends PropertyKey>(xs: readonly T[], key: (x: T) => K): Readonly<Partial<Record<K, readonly T[]>>> =>
  xs.reduce<Partial<Record<K, T[]>>>((acc, x) => { const k = key(x); (acc[k] ??= []).push(x); return acc; }, {});
