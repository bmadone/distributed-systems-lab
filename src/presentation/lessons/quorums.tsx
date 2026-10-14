import { QuorumLab } from '../labs/quorum/QuorumLab';
import { Prose } from '../ui/primitives';

const QuorumsBody = () => (
  <>
    <Prose>
      <p>In leaderless replication, each value lives on <b>N</b> replicas. A write succeeds when <b>W</b> of them confirm, and a read asks <b>R</b> of them, keeping the value with the newest version.</p>
      <p>If <b>R + W &gt; N</b>, every group of replicas you read from overlaps with every group that accepted the latest write, by the pigeonhole principle. At least one replica in your read has the newest value. If <b>2W &gt; N</b>, the two sides of a partition can&apos;t both accept writes, because only one side can gather W replicas. Concurrent writes that reach overlapping replicas can still both succeed and have to be resolved by version.</p>
      <p>Lowering W or R makes requests faster and more failure-tolerant but allows stale reads. This is the PACELC trade-off you can tune per query: in Cassandra, <code>ONE</code> is fast and AP, while <code>QUORUM</code> is slower and consistent.</p>
      <p className="callout warn">One caveat: quorum overlap alone doesn&apos;t give full linearizability. Read repair, sloppy quorums and clock-based conflict resolution all open gaps. The overlap is necessary but not sufficient.</p>
    </Prose>
    <QuorumLab />
  </>
);

export default QuorumsBody;
