import { ReplicationLab } from '../labs/replication/ReplicationLab';
import { Prose } from '../ui/primitives';

const ReplicationBody = () => (
  <>
    <Prose>
      <p><b>Replication</b> keeps copies of the same data on several nodes. You get availability (others take over), durability (data survives disk loss), read scaling, and lower latency for distant users. The hard part is keeping the copies in agreement.</p>
      <ul>
        <li><b>Primary-backup (single leader):</b> all writes go to one primary, which ships them to backups. With <b>synchronous</b> replication the primary waits for backups before confirming: safe, but slow, and one slow backup stalls everyone. With <b>asynchronous</b> replication it confirms immediately: fast, but backups lag, and a failover can lose confirmed writes. PostgreSQL, MySQL and MongoDB work this way.</li>
        <li><b>Multi-primary:</b> several nodes accept writes, which is useful across regions or offline. Concurrent writes conflict and need a resolution rule: last-write-wins, a custom merge, or CRDTs.</li>
        <li><b>Leaderless:</b> the client writes to several replicas directly and reads from several. Quorums decide what counts as success. This is the design from Amazon&apos;s 2007 Dynamo paper, covered in the next lesson.</li>
      </ul>
      <p>Below is a classic illustration of why replication makes even &quot;read the latest value&quot; tricky. Client 1 writes <code>x = 1</code> to primary A. Client 2 then reads <code>x</code> from replica C.</p>
    </Prose>
    <ReplicationLab />
    <div className="table-wrap"><table>
      <thead><tr><th>Approach</th><th>Writes go to</th><th>Conflicts</th><th>Typical use</th></tr></thead>
      <tbody>
        <tr><td><b>Primary-backup</b></td><td>One leader</td><td>None while one leader exists</td><td>Relational databases, MongoDB, Kafka partitions</td></tr>
        <tr><td><b>Multi-primary</b></td><td>Any of several leaders</td><td>Yes, need a merge or last-write-wins</td><td>Multi-region databases, offline apps, CouchDB</td></tr>
        <tr><td><b>Leaderless</b></td><td>Any W of N replicas</td><td>Yes, versioned with vector clocks or LWW</td><td>Cassandra, Riak, the Dynamo paper (2007)</td></tr>
      </tbody>
    </table></div>
  </>
);

export default ReplicationBody;
