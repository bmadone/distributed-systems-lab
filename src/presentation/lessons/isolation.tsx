import { IsolationLab } from '../labs/isolation/IsolationLab';
import { Prose } from '../ui/primitives';

const IsolationBody = () => (
  <>
    <Prose>
      <p>Consistency models describe single operations on replicated data. <b>Isolation levels</b> describe what concurrent <b>transactions</b> can see of each other. They&apos;re the I in <b>ACID</b>:</p>
      <ul>
        <li><b>Atomicity:</b> all of a transaction&apos;s writes happen, or none do.</li>
        <li><b>Consistency:</b> application rules, like &quot;balances never go negative&quot;, hold before and after. This is mostly the application&apos;s job.</li>
        <li><b>Isolation:</b> concurrent transactions don&apos;t interfere. At the strongest level, <b>serializable</b>, the result matches some one-at-a-time order.</li>
        <li><b>Durability:</b> once committed, the data survives crashes.</li>
      </ul>
      <p>Weaker isolation levels are faster but allow <b>anomalies</b>. Defaults differ: PostgreSQL uses Read Committed, MySQL&apos;s InnoDB uses Repeatable Read, and Oracle&apos;s &quot;serializable&quot; is actually snapshot isolation.</p>
      <h3>How databases enforce isolation</h3>
      <ul>
        <li><b>Pessimistic (two-phase locking):</b> take locks and hold them until commit. Correct, but readers and writers block each other, and deadlocks happen.</li>
        <li><b>Optimistic (OCC):</b> run without locks, check for conflicts at commit, and abort if any are found. Works well when conflicts are rare.</li>
        <li><b>MVCC snapshots:</b> each transaction reads a consistent snapshot, so readers never block writers. This gives snapshot isolation. <b>Serializable Snapshot Isolation</b> (PostgreSQL&apos;s SERIALIZABLE) adds detection of dangerous read-write patterns on top.</li>
      </ul>
      <p className="callout">The overall picture: in distributed databases, <b>strict serializability</b> means serializable plus linearizable. Spanner and FoundationDB provide it, and it&apos;s the strongest guarantee you can get.</p>
    </Prose>
    <IsolationLab />
  </>
);

export default IsolationBody;
