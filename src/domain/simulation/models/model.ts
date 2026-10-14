// Pure data and logic for the "same story, different models" explorer.

export const OUTCOMES: readonly string[] = [
  'Carol sees the post and the reply.', 'Carol sees the post, but not the reply yet.', 'Carol sees an empty thread.',
  'Carol sees "Welcome home!" with no post above it.', 'Carol sees both, refreshes, and the reply disappears.',
  'Alice refreshes and her own post is missing.', 'Dave sees his post first, then Erin’s. Erin sees hers first, then Dave’s.',
];

export interface ConsistencyModel {
  readonly name: string; readonly sub: string; readonly allow: readonly number[];
  readonly rule: string; readonly cap: string; readonly sys: string;
}
export const MODELS: readonly ConsistencyModel[] = [
  { name: 'Linearizable', sub: 'one copy, real time', allow: [0], rule: 'Every operation appears to happen at one instant between its start and its confirmation. Once a write is confirmed, everyone sees it.', cap: 'CAP’s "C". It can’t stay available during a partition.', sys: 'etcd, ZooKeeper writes, Spanner, DynamoDB strongly consistent reads.' },
  { name: 'Sequential', sub: 'one global order, may lag', allow: [0, 1, 2], rule: 'Everyone sees operations in the same order, and each client’s own operations stay in program order. That order may lag real time.', cap: 'Needs coordination, so it isn’t available during a partition.', sys: 'ZooKeeper reads (without sync), classic multiprocessor memory models.' },
  { name: 'Causal', sub: 'causes before effects', allow: [0, 1, 2, 6], rule: 'Causally related writes (Bob read the post, then replied) are seen in order by everyone. Concurrent writes may appear in different orders.', cap: 'The strongest model that can stay available during a partition, with sticky clients.', sys: 'MongoDB causal sessions, COPS, CRDT-based apps.' },
  { name: 'Session', sub: 'read-your-writes, monotonic reads', allow: [0, 1, 2, 3, 6], rule: 'Guarantees only about your own session: you see your own writes and never go back in time.', cap: 'Available if each client sticks to one replica.', sys: 'Session guarantees from Bayou (Terry et al.), e.g. sticky routing to one replica. sticky sessions.' },
  { name: 'Eventual', sub: 'converges if writes stop', allow: [0, 1, 2, 3, 4, 5, 6], rule: 'If writes stop, all replicas eventually agree. Until then, almost anything can be observed.', cap: 'Always available. The AP mode in the CAP lab.', sys: 'Cassandra at ONE, DynamoDB default reads, DNS, CDN caches.' },
];

export const INITIAL_MODEL = 2;

export type OutcomeStatus = 'expected' | 'possible' | 'ruled-out';
export const outcomeStatus = (model: number, outcome: number): OutcomeStatus =>
  outcome === 0 ? 'expected' : MODELS[model]?.allow.includes(outcome) ? 'possible' : 'ruled-out';

export const eyebrow = (i: number): string => (i === 0 ? 'strongest' : i === MODELS.length - 1 ? 'weakest' : `level ${i + 1}`);

/** Record a visit; returns a sorted, duplicate-free list. */
export const visit = (visited: readonly number[], i: number): readonly number[] =>
  visited.includes(i) ? visited : [...visited, i].sort((a, b) => a - b);
