// Real systems placed on the CAP / PACELC map. Labels describe default behavior.

export type CapClass = 'CP' | 'AP' | 'Tunable' | 'Other';
export type SystemFilter = 'All' | CapClass;
export const FILTERS: readonly SystemFilter[] = ['All', 'CP', 'AP', 'Tunable', 'Other'];
export const filterLabel = (f: SystemFilter): string => (f === 'Other' ? 'Neither' : f);

export interface SystemRow {
  readonly name: string;
  readonly kind: string;
  readonly cap: CapClass;
  readonly pacelc: string;
  readonly how: string;
}

const row = (name: string, kind: string, cap: CapClass, pacelc: string, how: string): SystemRow => ({ name, kind, cap, pacelc, how });

export const SYSTEMS: readonly SystemRow[] = [
  row('etcd', 'Coordination', 'CP', 'PC/EC', 'Raft. The minority side stops accepting writes. Holds all Kubernetes state.'),
  row('ZooKeeper', 'Coordination', 'CP', 'PC/EC', 'ZAB through a leader. Reads may lag unless the client calls sync(). Building blocks: ephemeral and sequential znodes, watches.'),
  row('Consul', 'Service discovery', 'CP', 'PC/EC', 'Raft key-value store. Optional "stale" reads stay available without a leader.'),
  row('Google Spanner', 'Global SQL', 'CP', 'PC/EC', 'Paxos per shard, 2PC across shards, TrueTime commit wait. Strictly serializable.'),
  row('CockroachDB', 'Distributed SQL', 'CP', 'PC/EC', 'A Raft group per range. Ranges without a majority become unavailable.'),
  row('FoundationDB', 'Ordered key-value', 'CP', 'PC/EC', 'Strictly serializable transactions with optimistic concurrency. Used under Apple CloudKit and Snowflake metadata.'),
  row('MongoDB', 'Document', 'CP', 'PC/EC', 'One primary per replica set, and the minority primary steps down. CP only with majority write and read concerns; secondary or "local" reads can return data that is later rolled back.'),
  row('HBase / BigTable', 'Wide-column', 'CP', 'PC/EC', 'Each region is served by one server, so rows are strongly consistent. WAL plus memtable, flushed to SSTables.'),
  row('Cassandra', 'Wide-column', 'Tunable', 'PA/EL', 'Leaderless ring with gossip. Consistency level per query, LWW timestamps, Paxos for lightweight transactions.'),
  row('Amazon DynamoDB', 'Key-value', 'Tunable', 'PA/EL', 'Managed service: each partition is a leader-based Multi-Paxos group (not the 2007 Dynamo ring). Eventual reads by default; strongly consistent reads and transactions are optional.'),
  row('Riak', 'Key-value', 'AP', 'PA/EL', 'Dynamo-style. Siblings with dotted version vectors, built-in CRDT types.'),
  row('CouchDB', 'Document', 'AP', 'PA/EL', 'Multi-master and offline replication. Conflicts are kept as revisions.'),
  row('Redis (replicated)', 'Cache', 'Other', 'PA/EL', 'Async replication, so a failover can drop confirmed writes. Use it as a cache, not a ledger.'),
  row('Apache Kafka', 'Event log', 'Tunable', 'PC/EC', 'acks=all with min.insync.replicas=2 behaves like CP. Unclean leader election behaves like AP and can lose data.'),
  row('HDFS / GFS', 'File system', 'CP', 'PC/EC', 'A single metadata master and 3× chunk replication. GFS record appends were "at least once" and could duplicate.'),
  row('Elasticsearch', 'Search', 'CP', 'PC/EL', 'Only the cluster state uses a quorum (7.x+). Documents use primary-backup replication, and Jepsen has found lost and dirty writes in the past. Search is near real-time.'),
  row('PostgreSQL + replicas', 'Relational', 'Other', '—', 'One node is "CA". Sync replicas make it CP. Async replicas can lose writes on failover.'),
  row('DNS', 'Name lookup', 'AP', 'PA/EL', 'Always answers from cache. Changes spread as TTLs expire.'),
  row('Git', 'Version control', 'AP', 'PA/EL', 'Every clone accepts commits offline, and humans merge conflicts later.'),
];

export const filterSystems = (f: SystemFilter, rows: readonly SystemRow[] = SYSTEMS): readonly SystemRow[] =>
  f === 'All' ? rows : rows.filter(s => s.cap === f);

// ---------- practice-task helpers ----------

/** Names of the rows matching a predicate. */
export const namesWhere = (pred: (s: SystemRow) => boolean, rows: readonly SystemRow[] = SYSTEMS): readonly string[] =>
  rows.filter(pred).map(s => s.name);

/** True when `pinned` is exactly the set `want` (order and duplicates ignored). */
export const samePins = (pinned: readonly string[], want: readonly string[]): boolean =>
  want.length > 0 && new Set(pinned).size === want.length && want.every(n => pinned.includes(n));

export const togglePin = (pinned: readonly string[], name: string): readonly string[] =>
  pinned.includes(name) ? pinned.filter(n => n !== name) : [...pinned, name];

/** Systems whose "how it behaves" text mentions Raft. */
export const RAFT_BASED = (): readonly string[] => namesWhere(s => /\bRaft\b/.test(s.how));
/** The one system classed "Tunable" that is PC/EC rather than PA/EL. */
export const TUNABLE_PCEC = (): readonly string[] => namesWhere(s => s.cap === 'Tunable' && s.pacelc === 'PC/EC');
/** PA/EL systems that are not classed AP. */
export const PAEL_NOT_AP = (): readonly string[] => namesWhere(s => s.pacelc === 'PA/EL' && s.cap !== 'AP');
