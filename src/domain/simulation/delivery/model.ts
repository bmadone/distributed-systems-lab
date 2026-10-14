import { nextRandom, range } from '../../shared-kernel/fp';

// Pure simulation of sending payments over a lossy link with three delivery strategies.

export type Strategy = 'once' | 'retry' | 'idem';
export const STRATEGIES: readonly Strategy[] = ['once', 'retry', 'idem'];
export const DESCRIPTIONS: Readonly<Record<Strategy, string>> = {
  once: 'Send once, never retry.',
  retry: 'Retry up to 8 times until a reply arrives.',
  idem: 'Retry up to 8 times, with a unique key the server deduplicates.',
};
export const MAX_TRIES = 8;

export interface Settings { readonly strategy: Strategy; readonly loss: number; readonly n: number }
export const initialSettings: Settings = { strategy: 'once', loss: 20, n: 50 };

export type Outcome = 'ok' | 'lost' | 'dup';
export interface StoryLine { readonly k: number; readonly outcome: Outcome; readonly story: string }
export interface Batch {
  readonly strategy: Strategy; readonly loss: number; readonly n: number;
  readonly ok: number; readonly lost: number; readonly dup: number; readonly unk: number;
  /** Up to 6 interesting payments (retried or not charged exactly once). */
  readonly logs: readonly StoryLine[];
}

interface Payment { readonly processed: number; readonly acked: boolean; readonly tries: number; readonly story: readonly string[]; readonly seed: number }

/** One payment: send, maybe retry, until acked or out of tries. `p` is the loss probability per direction. */
export const sendPayment = (strategy: Strategy, p: number, seed: number): Payment => {
  const attempt = (s: Payment): Payment => {
    const tries = s.tries + 1;
    const [r1, seed1] = nextRandom(s.seed);
    if (r1 < p) return { ...s, tries, seed: seed1, story: [...s.story, `try ${tries}: request lost`] };
    const dedup = strategy === 'idem' && s.processed > 0;
    const processed = dedup ? s.processed : s.processed + 1;
    const note = dedup ? 'duplicate key ignored' : processed > 1 ? 'charged AGAIN' : 'charged';
    const [r2, seed2] = nextRandom(seed1);
    const acked = r2 >= p;
    return { processed, acked, tries, seed: seed2, story: [...s.story, `try ${tries}: ${note}, ${acked ? 'reply received' : 'reply lost'}`] };
  };
  const loop = (s: Payment): Payment => {
    const next = attempt(s);
    return strategy === 'once' || next.acked || next.tries >= MAX_TRIES ? next : loop(next);
  };
  return loop({ processed: 0, acked: false, tries: 0, story: [], seed });
};

const outcomeOf = (processed: number): Outcome => (processed === 1 ? 'ok' : processed === 0 ? 'lost' : 'dup');

export const runBatch = ({ strategy, loss, n }: Settings, seed: number): Batch => {
  const p = loss / 100;
  const init: Batch = { strategy, loss, n, ok: 0, lost: 0, dup: 0, unk: 0, logs: [] };
  return range(n, 1).reduce<{ readonly b: Batch; readonly seed: number }>(({ b, seed: s }, k) => {
    const pay = sendPayment(strategy, p, s);
    const outcome = outcomeOf(pay.processed);
    const interesting = (pay.processed !== 1 || pay.tries > 1) && b.logs.length < 6;
    return {
      seed: pay.seed,
      b: {
        ...b,
        [outcome]: b[outcome] + 1,
        unk: b.unk + (pay.acked ? 0 : 1),
        logs: interesting ? [...b.logs, { k, outcome, story: pay.story.join(' → ') }] : b.logs,
      },
    };
  }, { b: init, seed }).b;
};

export interface State { readonly batch: Batch | null; readonly everDup: boolean }
export const initialState: State = { batch: null, everDup: false };
export type Action = { readonly type: 'run'; readonly settings: Settings; readonly seed: number };

export const step = (s: State, a: Action): State => {
  switch (a.type) {
    case 'run': {
      const batch = runBatch(a.settings, a.seed);
      return { batch, everDup: s.everDup || batch.dup > 0 };
    }
  }
};

/** Probability that one try fully succeeds (request and reply both arrive) when each direction loses with probability `p`. */
export const roundTripSuccess = (p: number): number => (1 - p) ** 2;
/** Probability that all `tries` attempts fail to produce a reply, leaving the client unsure. */
export const neverAcked = (p: number, tries: number = MAX_TRIES): number => (1 - roundTripSuccess(p)) ** tries;
/** Probability that plain retry (no key) processes a payment at least twice, by exact enumeration of the retry loop. */
export const dupProbability = (p: number, tries: number = MAX_TRIES): number => {
  const g = (left: number, c: number): number => {
    if (left === 0) return c >= 2 ? 1 : 0;
    const c2 = Math.min(2, c + 1);
    return p * g(left - 1, c) + (1 - p) * ((1 - p) * (c2 >= 2 ? 1 : 0) + p * g(left - 1, c2));
  };
  return g(tries, 0);
};
