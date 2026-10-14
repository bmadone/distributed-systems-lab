export interface AmdahlSignal {
  readonly parallelPct: number;
  readonly cores: number;
  readonly speedup: number;
  /** speedup / cores */
  readonly efficiency: number;
  readonly serialPct: number;
}

declare module '../../curriculum/signals' {
  interface LabSignals { readonly amdahl: AmdahlSignal }
}
