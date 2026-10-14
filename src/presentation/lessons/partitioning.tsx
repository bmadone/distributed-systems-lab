import { PartitioningLab } from '../labs/partitioning/PartitioningLab';
import { Prose } from '../ui/primitives';

const PartitioningBody = () => (
  <>
    <Prose>
      <p>When data outgrows one machine, you split it. <b>Horizontal partitioning</b>, also called sharding, puts different rows on different nodes. Each node owns a slice of the keys. (Vertical partitioning, which splits by column, is a separate technique.) The hard part is deciding which key goes where so that load stays even and resizing the cluster stays cheap.</p>
      <ul>
        <li><b>Range partitioning:</b> each node owns a key range, such as A–F. Range scans are fast. Hot spots are common, because many names start with &quot;S&quot; and every new timestamp lands on the last node.</li>
        <li><b>Hash partitioning (hash mod N):</b> node = hash(key) mod N. Load spreads evenly, but you lose range scans, and changing N moves almost every key.</li>
        <li><b>Consistent hashing:</b> nodes and keys sit on a ring, and each key belongs to the next node clockwise. Adding a node moves only its fair share of the keys, about 1/(N+1). <b>Virtual nodes</b> (many ring positions per node) smooth out the imbalance. Cassandra, Riak and the original Dynamo design use this.</li>
      </ul>
    </Prose>
    <PartitioningLab />
  </>
);

export default PartitioningBody;
