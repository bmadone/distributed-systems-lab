import { SagaLab } from '../labs/saga/SagaLab';
import { TpcLab } from '../labs/tpc/TpcLab';
import { Prose } from '../ui/primitives';

const CommitBody = () => (
  <>
    <Prose>
      <p>A transaction that touches several nodes, say Orders, Payments and Inventory, must commit everywhere or nowhere. This is <b>atomic commitment</b>.</p>
      <h3>Two-phase commit (2PC)</h3>
      <ol>
        <li><b>Prepare:</b> the coordinator asks every participant &quot;can you commit?&quot;. A participant that votes <b>yes</b> writes everything durably and promises to commit if told to. From then on it can&apos;t decide by itself.</li>
        <li><b>Commit or abort:</b> if every vote is yes, the coordinator logs COMMIT and tells everyone. If any vote is no or a participant times out, it tells everyone to abort.</li>
      </ol>
      <p>The weak point: if the coordinator crashes after participants voted yes, they&apos;re <b>in doubt</b>. They can&apos;t commit or abort, and they keep holding locks until the coordinator returns. <b>2PC is blocking.</b></p>
      <ul>
        <li><b>Three-phase commit (3PC)</b> adds a &quot;pre-commit&quot; round so participants can finish without the coordinator. It works only with bounded network delays, and a partition can still make it inconsistent, so it&apos;s rarely used.</li>
        <li><b>Consensus-based commit</b> replicates the coordinator&apos;s decision with Paxos or Raft, so the crash of one machine can&apos;t block the transaction. Spanner and CockroachDB do this.</li>
        <li><b>Sagas</b> handle long-running workflows across services. They&apos;re a chain of local transactions, each with a <b>compensating action</b> that undoes it. A saga gives up isolation, and other services can see the intermediate states.</li>
      </ul>
    </Prose>
    <TpcLab />
    <SagaLab />
  </>
);

export default CommitBody;
