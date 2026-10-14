// Pure model of the checkout call chain: four downstream services, each called synchronously or via a queue.

export interface Service { readonly n: string; readonly note: string }
export const SERVICES: readonly Service[] = [
  { n: 'Payment', note: 'Charge the card' }, { n: 'Inventory', note: 'Reserve stock' },
  { n: 'Email', note: 'Send the receipt' }, { n: 'Analytics', note: 'Record the event' },
];

export const CHECKOUT_A = 0.9999, CHECKOUT_MS = 20;
export const SERVICE_A = 0.995, SERVICE_MS = 80;
export const QUEUE_A = 0.9999, QUEUE_MS = 5;

/** sync[i] = true when service i is called synchronously. */
export interface ChainConfig {
  readonly sync: readonly boolean[];
  /** Retry each failed synchronous call once (two attempts in total, assuming independent failures). */
  readonly retry: boolean;
}
export const initialChain: ChainConfig = { sync: [true, true, true, true], retry: false };

export const normalize = (c: ChainConfig): ChainConfig => ({ sync: SERVICES.map((_, i) => c.sync[i] ?? true), retry: c.retry });

export const setMode = (c: ChainConfig, i: number, sync: boolean): ChainConfig =>
  normalize({ ...c, sync: normalize(c).sync.map((v, j) => (j === i ? sync : v)) });

export const setRetry = (c: ChainConfig, retry: boolean): ChainConfig => normalize({ ...c, retry });

/** Availability of one synchronous call: one attempt, or two independent attempts with a retry. */
export const callAvail = (retry: boolean): number => (retry ? 1 - (1 - SERVICE_A) ** 2 : SERVICE_A);

export interface ChainAnalysis {
  readonly syncN: number;
  readonly anyAsync: boolean;
  readonly paymentSync: boolean;
  readonly avail: number;
  readonly latency: number;
  /** Latency when every synchronous call needs its retry too (equals `latency` without retries). */
  readonly worstLatency: number;
}

export const analyze = (raw: ChainConfig): ChainAnalysis => {
  const { sync, retry } = normalize(raw);
  const syncN = sync.filter(Boolean).length, anyAsync = sync.some(s => !s);
  return {
    syncN, anyAsync, paymentSync: sync[0] === true,
    avail: CHECKOUT_A * callAvail(retry) ** syncN * (anyAsync ? QUEUE_A : 1),
    latency: CHECKOUT_MS + SERVICE_MS * syncN + (anyAsync ? QUEUE_MS : 0),
    worstLatency: CHECKOUT_MS + SERVICE_MS * (retry ? 2 : 1) * syncN + (anyAsync ? QUEUE_MS : 0),
  };
};
