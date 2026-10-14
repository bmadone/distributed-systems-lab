import { FailureDetectorLab } from '../labs/failure-detector/FailureDetectorLab';
import { Sorter } from '../ui/Exercises';
import { Prose } from '../ui/primitives';

const FailuresBody = () => (
  <>
    <Prose>
      <p>To reason about an algorithm you need to state what can go wrong. That statement is the <b>system model</b>. It has two parts: how nodes fail and how timing behaves.</p>
      <h3>How nodes fail</h3>
      <ul>
        <li><b>Crash-stop:</b> the node halts and never comes back. This is the simplest case to reason about.</li>
        <li><b>Crash-recovery:</b> the node halts, then restarts, possibly having lost whatever was only in memory. Most real servers behave like this.</li>
        <li><b>Omission:</b> the node keeps running, but some messages it sends or receives are dropped.</li>
        <li><b>Byzantine:</b> the node does anything at all, including lying, because of bugs, corrupted hardware or an attacker. Blockchains and aircraft controls design for this. Most datacenter systems don&apos;t.</li>
      </ul>
      <h3>How timing behaves</h3>
      <ul>
        <li><b>Synchronous:</b> messages and processing finish within known time bounds. This is easy to reason about, and it&apos;s rarely true.</li>
        <li><b>Asynchronous:</b> there are no time bounds at all. A slow node and a dead node look exactly the same.</li>
        <li><b>Partially synchronous:</b> the bounds hold most of the time but can be broken for a while. Nearly all practical algorithms, including Raft and Paxos, assume this.</li>
      </ul>
      <p className="callout">The core problem: <b>you can&apos;t tell a crashed node from a slow one.</b> All you have is a timeout, and every timeout value is a guess.</p>
    </Prose>
    <FailureDetectorLab />
    <Sorter id="dx" title="Diagnose the failure" />
  </>
);

export default FailuresBody;
