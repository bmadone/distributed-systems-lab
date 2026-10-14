import { RAFT_BASED, PAEL_NOT_AP, samePins, TUNABLE_PCEC } from '../../simulation/systems/model';
import { matcherDone } from '../signals';
import { defineLesson } from '../types';

export default defineLesson({
  id: "systems",
  part: "prac",
  title: "Case studies: real systems",
  minutes: 14,
  objectives: ["Place real systems on the CAP and PACELC map","Connect each system to the techniques in this course","Choose a store for a requirement"],
  predict: { q: "Kubernetes stores all cluster state in etcd. What does that tell you about etcd during a partition?", opts: ["It’s AP","It’s CP, and the minority side stops accepting writes","It has no replicas","It uses last-write-wins"], a: 1, reveal: "etcd uses Raft. Cluster state must never fork, so it gives up availability on the minority side." },
  practice: [
    { kind: 'task', text: "Filter the table to systems that are <b>tunable</b>.", check: ({ systems: t }) => t?.filter === 'Tunable' },
    { kind: 'task', text: "Pick the right store for every requirement.", check: s => matcherDone(s, 'mt') },
    { kind: 'task', text: "Filter the table to the <b>CP</b> systems.", check: ({ systems: t }) => t?.filter === 'CP' },
    { kind: 'num', text: "Use the table: how many of the systems are classed <b>CP</b>?", answer: 10, tol: 0 },
    { kind: 'task', text: "Pin the systems whose description mentions <b>Raft</b>, and nothing else.", check: ({ systems: t }) => t !== undefined && samePins(t.pinned, RAFT_BASED()) },
    { kind: 'num', text: "Of the 19 systems in the table, what percentage are classed CP? Round to the nearest whole number.", answer: 53, tol: 1, unit: "%" },
    { kind: 'task', text: "Pin the only system classed <b>Tunable</b> that is <b>PC/EC</b> rather than PA/EL.", check: ({ systems: t }) => t !== undefined && samePins(t.pinned, TUNABLE_PCEC()) },
    { kind: 'num', text: "A Kafka topic has replication factor 5, min.insync.replicas=3 and producers use acks=all. How many replicas can be offline before producers start getting errors?", answer: 2, tol: 0 },
    { kind: 'task', text: "Pin every system that is <b>PA/EL</b> but is <b>not</b> classed AP. Use the PACELC column and the Partition column.", check: ({ systems: t }) => t !== undefined && samePins(t.pinned, PAEL_NOT_AP()) },
    { kind: 'num', text: "Spanner’s commit wait is roughly twice the TrueTime uncertainty bound. With an average bound of 4 ms, about how long is the wait, in ms?", answer: 8, tol: 0, unit: "ms" },
    { kind: 'num', text: "Count the systems in the table whose PACELC label is <b>PA/EL</b>.", answer: 7, tol: 0 },
  ],
  quiz: [
    { q: "Kafka with acks=all and min.insync.replicas=2 behaves most like…", opts: ["AP","CP","No guarantees","A cache"], a: 1, why: "Writes fail rather than land on too few replicas." },
    { q: "Spanner’s TrueTime lets it…", opts: ["Skip replication","Assign globally meaningful commit timestamps by waiting out clock uncertainty","Avoid Paxos","Use LWW safely everywhere"], a: 1, why: "Waiting out the uncertainty gives external consistency." },
    { q: "How do Spark and Flink recover from task failures?", opts: ["Manual restarts","Re-running deterministic work from lineage or checkpoints","They don’t","Two-phase commit"], a: 1, why: "Determinism plus lineage or checkpoints makes recomputing safe." },
    { q: "Which description of Amazon DynamoDB matches the table?", opts: ["A Raft key-value store with strictly serializable reads only", "A leaderless ring using the 2007 Dynamo design with vector clocks", "A managed service where each partition is a leader-based Multi-Paxos group, with eventually consistent reads by default", "A single-master relational database with synchronous replicas"], a: 2, why: "The 2007 Dynamo paper described a different, leaderless system. The managed DynamoDB service replicates each partition with a leader and Multi-Paxos, and lets you ask for strongly consistent reads when you need them." },
    { q: "When does MongoDB behave as a CP system?", opts: ["Only with majority write and majority read concerns", "Only when the replica set has exactly 3 members", "Never, because it uses asynchronous replication", "Always, because it has a single primary"], a: 0, why: "A write acknowledged by only the primary can be rolled back after a failover, and local reads may see such data. Majority concerns make acknowledged writes survive an election and keep reads from returning rolled-back data." },
    { q: "What does Elasticsearch use a quorum for?", opts: ["Only search queries", "Nothing; it is fully leaderless", "Every document write and read", "The cluster state, such as master election and metadata"], a: 3, why: "Since 7.x the master election and cluster state use a quorum. Documents are replicated primary-backup, which is why Jepsen has found lost writes in past versions." },
    { q: "Cassandra with replication factor 3. Which pair of consistency levels for writes and reads guarantees a read sees the latest acknowledged write?", opts: ["ONE and QUORUM", "QUORUM and QUORUM", "ANY and ONE", "ONE and ONE"], a: 1, why: "Quorum is 2 of 3, so W + R = 4 > 3 and the read and write sets must overlap. With ONE on either side the sets can miss each other." },
    { q: "Why does Spanner use both Paxos and two-phase commit?", opts: ["2PC replaces Paxos for slow links", "They are redundant; one is only a fallback", "Paxos replicates each shard, and 2PC makes a transaction atomic across shards", "Paxos handles reads and 2PC handles writes"], a: 2, why: "Within a shard, Paxos keeps replicas in agreement. A transaction touching several shards still needs all-or-nothing behavior, which is 2PC’s job, and the 2PC participants are themselves replicated groups." },
    { q: "A Kafka topic has replication factor 3, min.insync.replicas=2, and producers use acks=all. Two brokers holding its replicas go down. What happens to producers?", opts: ["Writes fail, because only 1 replica is in sync and 2 are required", "Writes continue but are marked unsafe", "Kafka elects a new leader on another topic", "Writes continue on the last broker"], a: 0, why: "With one in-sync replica left the requirement of two can’t be met, so the broker rejects acks=all writes. That is the CP behavior: refuse rather than risk losing data." },
    { q: "A replicated Redis primary acknowledges a write, then crashes before the replica receives it. The replica is promoted. What happened to the write?", opts: ["It is replayed when the old primary rejoins", "Redis blocked the client until replication finished", "It is recovered from the client", "It is lost, because replication is asynchronous"], a: 3, why: "Asynchronous replication acknowledges before copying. After failover the new primary never had the write, and the old primary’s extra data is discarded on rejoin. That is why the table says to use it as a cache, not a ledger." },
    { q: "Which workload is the best fit for a CouchDB-style multi-master store?", opts: ["A global bank ledger with strict balance rules", "A note-taking app whose devices work offline for days and sync later, with conflicts kept as revisions", "A lock service for a job scheduler", "A cluster-wide leader election"], a: 1, why: "CouchDB accepts writes anywhere and reconciles later, so it suits offline-first sync. Ledgers and locks need the opposite: refusing writes on the minority side." },
    { q: "A PostgreSQL primary requires acknowledgment from one synchronous replica for every commit, and that replica becomes unreachable. What happens to writes?", opts: ["Reads stop but writes continue", "They continue, just slower", "They block until the replica returns or the configuration changes, favoring consistency", "They are written to a random other node"], a: 2, why: "A synchronous commit waits for the replica by definition. The system trades availability for not losing acknowledged writes, which is why the table calls sync replicas CP-like." },
    { q: "GFS record appends were described as \"at least once\". What does that mean for readers of the file?", opts: ["A record may appear more than once, so readers must tolerate or filter duplicates", "A record may be silently dropped", "Only one client can append at a time", "Each record appears exactly once, in order"], a: 0, why: "If an append fails on one replica the client retries, and the earlier partial copies can remain. Applications therefore add record IDs or checksums to detect duplicates." },
  ],
  explain: { prompt: "Pick one system from the table and explain its CAP and PACELC choice in your own words.", model: "Cassandra is PA/EL by default. It answers from any reachable replica during a partition and favors low latency otherwise, with LWW resolving conflicts. You can push it toward consistency per query with QUORUM reads and writes, at the cost of latency and availability." },
  takeaways: ["Real systems mix techniques: consensus, quorums, sharding, logs.","Defaults are a starting point. Most systems can be tuned.","Choose by requirement: coordination, global SQL, offline sync, write throughput."],
  cards: [
    ["etcd / ZooKeeper", "CP coordination stores built on Raft or ZAB consensus."],
    ["Cassandra", "Leaderless, PA/EL, consistency level chosen per query."],
    ["Spanner", "Paxos plus 2PC plus TrueTime, giving strictly serializable global transactions."],
  ],
});
