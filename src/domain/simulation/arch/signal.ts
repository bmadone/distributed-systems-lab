export interface ArchSignal {
  readonly visited: readonly string[];
  readonly down: readonly string[];
  readonly reads: boolean;
  readonly writes: boolean;
  readonly media: boolean;
  readonly jobs: boolean;
}

declare module '../../curriculum/signals' {
  interface LabSignals { readonly arch: ArchSignal }
}
