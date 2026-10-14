export interface QuadtreeSignal {
  readonly ratio: number | null;
  readonly cap: number;
  readonly cells: number;
  /** Points the search had to look at (0 before any search). */
  readonly checked: number;
  /** Drivers actually inside the box (0 before any search). */
  readonly found: number;
}

declare module '../../curriculum/signals' {
  interface LabSignals { readonly quadtree: QuadtreeSignal }
}
