import { CapLab } from '../labs/cap/CapLab';
import { Prose } from '../ui/primitives';

const CapBody = () => (
  <>
    <Prose>
      <p>The <b>CAP theorem</b>, proved by Gilbert and Lynch in 2002 after Eric Brewer&apos;s conjecture, involves three properties:</p>
      <ul>
        <li><b>Consistency (C):</b> every read returns the most recent completed write, or an error. Formally this is linearizability, which is stricter than the C in ACID.</li>
        <li><b>Availability (A):</b> every request to a non-failed node gets a non-error response.</li>
        <li><b>Partition tolerance (P):</b> the system keeps working even if the network drops messages between nodes.</li>
      </ul>
      <p>The theorem says that <b>during a network partition you can&apos;t have both C and A</b>. A node cut off from the others must either refuse the request (losing A) or answer from its own possibly stale copy (losing C).</p>
      <p>The popular &quot;pick two&quot; phrasing is misleading. Partitions aren&apos;t optional, so &quot;CA&quot; just describes a single-node system. When the network is healthy you can have both. PACELC extends the idea: <b>if Partition, choose A or C; Else, choose Latency or Consistency.</b></p>
    </Prose>
    <CapLab />
  </>
);

export default CapBody;
