export interface ModelsSignal { readonly visited: readonly number[]; readonly sel: number }

declare module '../../curriculum/signals' {
  interface LabSignals { readonly models: ModelsSignal }
}
