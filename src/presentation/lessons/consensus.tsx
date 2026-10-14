import { RaftLab } from '../labs/raft/RaftLab';
import { Prose } from '../ui/primitives';

const ConsensusBody = () => (
  <>
    <Prose>
      <p><b>Consensus</b> is getting several nodes to agree on one value, despite failures. A correct algorithm guarantees:</p>
      <ul>
        <li><b>Agreement:</b> no two nodes decide different values. (Safety.)</li>
        <li><b>Validity:</b> the decided value was proposed by some node. (Safety.)</li>
        <li><b>Termination:</b> every node that doesn&apos;t crash eventually decides. (Liveness.)</li>
      </ul>
      <p>Agree on a sequence of values, one log entry at a time, and you get a <b>replicated state machine</b>. Every node applies the same commands in the same order, so they all end up in the same state. That&apos;s how etcd, ZooKeeper, Consul and CockroachDB keep their replicas identical.</p>
      <h3>FLP impossibility</h3>
      <p>In 1985, Fischer, Lynch and Paterson proved that in a <b>fully asynchronous</b> system, no deterministic algorithm can guarantee consensus if even <b>one</b> node may crash. The reason is the same problem as before: you can&apos;t tell slow from dead. Real algorithms keep safety at all times and give up termination only while the network misbehaves, relying on timeouts and randomness to get unstuck.</p>
      <h3>Paxos and Raft</h3>
      <p><b>Paxos</b> (Lamport) uses numbered proposals. A proposer first gets <b>promises</b> from a majority to ignore older proposals, then asks that majority to <b>accept</b> a value, adopting any value that might already have been chosen. Any two majorities overlap, so two different values can never both be chosen. Multi-Paxos runs the protocol with a stable leader for efficiency.</p>
      <p><b>Raft</b> (Ongaro and Ousterhout, 2014) was designed to be easier to understand and splits the problem into parts:</p>
      <ul>
        <li><b>Leader election:</b> time is divided into <b>terms</b>. A follower that hears nothing from a leader before its <b>randomized timeout</b> becomes a candidate, starts a new term and asks for votes. A majority makes it leader.</li>
        <li><b>Log replication:</b> the leader appends client commands to its log and sends them to followers. An entry is <b>committed</b> once a majority store it. (Subtlety: a leader only commits this way for entries from its <i>current term</i>; older entries become committed along with them.)</li>
        <li><b>Safety:</b> a node only votes for a candidate whose log is at least as up to date as its own, so a new leader always has every committed entry.</li>
      </ul>
    </Prose>
    <RaftLab />
  </>
);

export default ConsensusBody;
