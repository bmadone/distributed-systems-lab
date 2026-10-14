// Pure model of Amdahl's law: speedup = 1 / ((1 − p) + p / n).

export const PARALLEL_PCT = { min: 0, max: 100 } as const;
export const CORES = { min: 1, max: 128 } as const;

/** `parallelPct` is the parallel share in whole percent (0–100), as the slider shows it. */
export interface AmdahlConfig { readonly parallelPct: number; readonly cores: number }
export const initialConfig: AmdahlConfig = { parallelPct: 90, cores: 8 };

export interface AmdahlAnalysis {
  readonly speedup: number;
  /** speedup / cores */
  readonly efficiency: number;
  /** Speedup with unlimited cores: 1 / (1 − p), or Infinity when everything is parallel. */
  readonly ceiling: number;
  readonly serialPct: number;
}

export const speedup = (p: number, n: number): number => 1 / ((1 - p) + p / n);

export const analyze = (c: AmdahlConfig): AmdahlAnalysis => {
  const p = c.parallelPct / 100;
  const sp = speedup(p, c.cores);
  return { speedup: sp, efficiency: sp / c.cores, ceiling: p < 1 ? 1 / (1 - p) : Infinity, serialPct: Math.round((1 - p) * 100) };
};
