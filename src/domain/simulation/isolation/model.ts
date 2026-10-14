// Isolation levels vs. anomalies (Berenson et al. 1995; Repeatable Read means lock-based).

export const LEVEL_IDS = ['RU', 'RC', 'RR', 'SI', 'SER'] as const;
export type LevelId = typeof LEVEL_IDS[number];
export const LEVELS: readonly (readonly [LevelId, string])[] = [
  ['RU', 'Read Uncommitted'], ['RC', 'Read Committed'], ['RR', 'Repeatable Read'], ['SI', 'Snapshot Isolation'], ['SER', 'Serializable'],
];

export const ANOM_IDS = ['dirtywrite', 'dirtyread', 'fuzzy', 'lostupdate', 'readskew', 'phantom', 'writeskew'] as const;
export type AnomId = typeof ANOM_IDS[number];
export interface Anomaly {
  readonly id: AnomId;
  /** Levels that prevent this anomaly. */
  readonly prev: readonly LevelId[];
  readonly name: string;
  readonly steps: readonly (readonly [1 | 2, string])[];
  readonly bad: string;
  readonly how: string;
}

export const ANOMS: readonly Anomaly[] = [
  { id: 'dirtywrite', prev: ['RU', 'RC', 'RR', 'SI', 'SER'], name: 'Dirty write', steps: [[1, 'write x = 1'], [2, 'write x = 2'], [2, 'write y = 2'], [1, 'write y = 1'], [1, 'commit'], [2, 'commit']], bad: 'Final state x = 2, y = 1, a mix of both transactions.', how: 'All levels hold write locks until commit, so T2 waits for T1.' },
  { id: 'dirtyread', prev: ['RC', 'RR', 'SI', 'SER'], name: 'Dirty read', steps: [[1, 'write balance = 0 (was 100)'], [2, 'read balance → 0'], [1, 'abort']], bad: 'T2 acted on a balance that never really existed.', how: 'T2 only sees committed data, so it reads 100.' },
  { id: 'fuzzy', prev: ['RR', 'SI', 'SER'], name: 'Non-repeatable read', steps: [[1, 'read x → 10'], [2, 'write x = 20'], [2, 'commit'], [1, 'read x → 20']], bad: 'The same read gave two different answers inside one transaction.', how: 'A read lock (RR) or a snapshot (SI) makes T1 see 10 both times.' },
  { id: 'lostupdate', prev: ['RR', 'SI', 'SER'], name: 'Lost update', steps: [[1, 'read counter → 10'], [2, 'read counter → 10'], [1, 'write counter = 11'], [1, 'commit'], [2, 'write counter = 11'], [2, 'commit']], bad: 'Two increments, but the final value is 11.', how: 'RR: T2’s write conflicts with T1’s lock and one aborts. SI: first committer wins, so T2 aborts, retries, and gets 12. Careful: MySQL InnoDB’s RR allows this lost update.' },
  { id: 'readskew', prev: ['RR', 'SI', 'SER'], name: 'Read skew', steps: [[1, 'read A → 50'], [2, 'move 50 from B to A: A = 100, B = 0'], [2, 'commit'], [1, 'read B → 0']], bad: 'T1 sees a total of 50 instead of 100. The money looks like it vanished.', how: 'T1 reads everything from one consistent point in time.' },
  { id: 'phantom', prev: ['SI', 'SER'], name: 'Phantom read', steps: [[1, 'count bookings for room 5 → 2'], [2, 'insert booking for room 5'], [2, 'commit'], [1, 'count bookings for room 5 → 3']], bad: 'A new row appeared in the middle of T1.', how: 'A snapshot (SI) or predicate locks (serializable) keep the result stable. ANSI RR allows phantoms, though many real RR implementations prevent them.' },
  { id: 'writeskew', prev: ['RR', 'SER'], name: 'Write skew', steps: [[1, 'read on-call doctors → Alice, Bob'], [2, 'read on-call doctors → Alice, Bob'], [1, 'set Alice off-call'], [2, 'set Bob off-call'], [1, 'commit'], [2, 'commit']], bad: 'Nobody is on call, even though each transaction alone kept the rule "at least one on call".', how: 'Serializable (2PL with predicate locks, or SSI) detects the read-write conflict and aborts one transaction. Lock-based Repeatable Read also blocks this exact interleaving: each write waits on the other’s read lock, and the deadlock aborts one. Snapshot isolation takes no read locks, so it allows write skew.' },
];

export const FOOTNOTE = 'Based on Berenson et al. (1995), with Repeatable Read meaning lock-based. RR and SI are incomparable: each prevents something the other allows. Real databases differ: PostgreSQL’s “Repeatable Read” is actually SI, and MySQL’s RR allows lost updates.';
export const PREVENTED_PREFIX = 'This exact interleaving can’t happen: ';

export interface IxSelection { readonly level: LevelId; readonly anom: AnomId }
export const initialIx: IxSelection = { level: 'RC', anom: 'lostupdate' };

export const prevents = (anom: Anomaly, level: LevelId): boolean => anom.prev.includes(level);
export const levelName = (level: LevelId): string => LEVELS.find(([id]) => id === level)?.[1] ?? level;

export interface IxVerdict { readonly prevented: boolean; readonly title: string; readonly text: string }
export const verdict = (sel: IxSelection): IxVerdict | null => {
  const a = ANOMS.find(x => x.id === sel.anom);
  if (!a) return null;
  const prevented = prevents(a, sel.level), name = levelName(sel.level);
  return prevented
    ? { prevented, title: `Prevented at ${name}`, text: PREVENTED_PREFIX + a.how }
    : { prevented, title: `Happens at ${name}`, text: a.bad };
};

/** The weakest level (in LEVELS order) that prevents an anomaly. */
export const weakestPreventing = (id: AnomId): LevelId | undefined => {
  const a = ANOMS.find(x => x.id === id);
  return a && LEVEL_IDS.find(l => prevents(a, l));
};

/** How many anomalies a level still allows (cells marked "possible" in its column). */
export const allowedCount = (level: LevelId): number => ANOMS.filter(a => !prevents(a, level)).length;
/** How many anomalies a level prevents. */
export const preventedCount = (level: LevelId): number => ANOMS.length - allowedCount(level);
/** Total "possible" cells in the whole table. */
export const possibleCells = (): number => LEVEL_IDS.reduce((n, l) => n + allowedCount(l), 0);

/** Increments lost when `n` transactions all read the same counter value before any writes (no conflict detection). */
export const lostIncrements = (n: number): number => Math.max(0, n - 1);

/**
 * Snapshot isolation, first-committer-wins: `n` transactions update the same row concurrently.
 * Each round exactly one commits and the rest abort and retry. Returns the total number of attempts.
 */
export const siAttempts = (n: number): number => (n <= 0 ? 0 : n + siAttempts(n - 1));

/** Write skew under SI: every concurrent transaction checks the on-call rule against the same snapshot and leaves. */
export const writeSkewRemaining = (onCall: number, minRequired: number, concurrent: number): number =>
  onCall - (onCall - 1 >= minRequired ? Math.min(concurrent, onCall) : 0);
