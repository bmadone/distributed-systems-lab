export interface FailureDetectorSignal { readonly T: number; readonly falseCount: number }

declare module '../../curriculum/signals' {
  interface LabSignals { readonly failureDetector: FailureDetectorSignal }
}
