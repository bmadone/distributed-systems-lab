import { SystemsTable } from '../labs/systems/SystemsTable';
import { Matcher } from '../ui/Exercises';
import { Prose } from '../ui/primitives';

const SystemsBody = () => (
  <>
    <Prose>
      <p>Real systems combine everything in this course. The labels below describe <b>default</b> behavior, and most systems can be configured to lean the other way. PACELC: during a <b>P</b>artition choose <b>A</b> or <b>C</b>; <b>E</b>lse choose <b>L</b>atency or <b>C</b>onsistency.</p>
      <ul>
        <li><b>GFS and HDFS</b> split files into large chunks of 64–128 MB, replicated three times. A single master holds the metadata. They&apos;re optimized for appends and big sequential reads, and GFS&apos;s relaxed consistency let concurrent appends produce duplicates.</li>
        <li><b>ZooKeeper</b> runs the ZAB consensus protocol to give linearizable writes and ordered reads. Locks, leader election and configuration are built from its small primitives: ephemeral and sequential znodes plus watches.</li>
        <li><b>BigTable and HBase</b> divide a sorted key space into regions, each served by one server, which gives strong consistency per row. Data lands in a write-ahead log and memtable, then is flushed to immutable SSTables.</li>
        <li><b>Cassandra</b> is leaderless with consistent hashing and gossip, and you choose a consistency level per query. Its lightweight transactions use Paxos for compare-and-set.</li>
        <li><b>Spanner</b> combines Paxos groups per shard, 2PC across shards and TrueTime timestamps to provide externally consistent (strictly serializable) global transactions.</li>
        <li><b>Kafka</b> stores partitioned, replicated logs. Producers choose <code>acks</code>, and idempotent producers plus transactions give exactly-once effect within Kafka.</li>
        <li><b>MapReduce, Spark and Flink</b> recover from failure by re-running deterministic tasks. Spark recomputes from lineage, and Flink restores from Chandy-Lamport-style checkpoints and uses watermarks to handle events that arrive late.</li>
      </ul>
    </Prose>
    <SystemsTable />
    <Matcher id="mt" title="Pick the right store" />
  </>
);

export default SystemsBody;
