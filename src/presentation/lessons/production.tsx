import { BackoffLab } from '../labs/backoff/BackoffLab';
import { Prose } from '../ui/primitives';

interface FailMode { readonly name: string; readonly what: string; readonly handle: string; readonly real: string }

const FAILS: readonly FailMode[] = [
  { name: 'Split brain', what: 'A partition leaves two groups, each electing its own leader. Both accept writes and the data forks.', handle: 'Require a strict majority to elect or commit. With an even node count, add a witness.', real: 'Elasticsearch before 7.0 could split brain when minimum_master_nodes was misconfigured.' },
  { name: 'Zombie leader', what: 'A leader stalls in a long GC pause, a new leader is elected, and the old one wakes up still writing.', handle: 'Fencing tokens: storage rejects writes with an older epoch number. Leases with bounded clocks.', real: 'Kleppmann’s Redlock analysis showed that a lock without fencing can be held by two clients.' },
  { name: 'Lost writes on failover', what: 'The primary confirms a write, then dies before replicating it. The promoted replica doesn’t have it.', handle: 'Sync or quorum replication before confirming, or a documented loss window.', real: 'GitHub, Oct 2018: a 43-second network break led to a cross-coast MySQL failover and about 24 hours of degraded service.' },
  { name: 'Clock skew with last-write-wins', what: 'A node whose clock runs 5 s fast wins every conflict, even against newer writes.', handle: 'Logical, vector or hybrid logical clocks, or bounded uncertainty like TrueTime.', real: 'In Cassandra, NTP drift on one node can silently override newer data.' },
  { name: 'Stale read after an update', what: 'A user saves, the page reloads from a lagging replica, and the old data reappears.', handle: 'Read-your-writes: route the user to the leader for a while, or pass version tokens.', real: 'Many apps read from the primary for a few seconds after a write.' },
  { name: 'Gray (asymmetric) partition', what: 'A reaches B, but B can’t reach A. Leadership flaps back and forth.', handle: 'Raft pre-vote and check-quorum, plus health checks from several vantage points.', real: 'Cloudflare, Nov 2020: a partially failed switch caused repeated etcd leader elections.' },
  { name: 'Timeout means unknown', what: 'A request times out. Did it happen? A blind retry may double-charge.', handle: 'Idempotency keys, plus reconciling the outcome later.', real: 'Two Generals: certainty over a lossy link is impossible.' },
  { name: 'Cascading failure', what: 'One slow dependency ties up threads upstream, which slows their callers, until everything is down.', handle: 'Timeouts, circuit breakers, bulkheads, load shedding, backpressure.', real: 'Retry storms often turn small blips into full outages.' },
];

const FailCards = () => (
  <div className="fails">
    {FAILS.map(f => (
      <article className="fail" key={f.name}>
        <h4>{f.name}</h4>
        <dl>
          <div><dt>What happens</dt><dd>{f.what}</dd></div>
          <div><dt>How systems handle it</dt><dd>{f.handle}</dd></div>
        </dl>
        <p className="real">{f.real}</p>
      </article>
    ))}
  </div>
);

const ProductionBody = () => (
  <>
    <Prose>
      <p>Theory tells you what&apos;s possible. Production adds gray failures, overload, deploys and humans. These patterns show up in almost every reliable system:</p>
      <ul>
        <li><b>Timeouts everywhere.</b> A call without a timeout can wait forever. Set the timeout from measured latency percentiles, such as p99.9.</li>
        <li><b>Retries with exponential backoff and jitter.</b> Retry transient errors, wait longer each time, and randomize the wait so thousands of clients don&apos;t retry at the same moment.</li>
        <li><b>Idempotency keys.</b> Make retries safe, as in the delivery lesson.</li>
        <li><b>Circuit breakers.</b> After repeated failures, stop calling a dependency for a while. Failing fast protects both sides.</li>
        <li><b>Bulkheads.</b> Give each dependency its own thread pools and connection limits, so one slow service can&apos;t use up every resource.</li>
        <li><b>Backpressure and load shedding.</b> When overloaded, push back on producers or reject low-priority work early. Queues that never fill up hide problems until memory runs out.</li>
        <li><b>Leases and fencing tokens.</b> Grant time-limited ownership, and have storage reject writes that carry an outdated token.</li>
        <li><b>Backward-compatible changes.</b> Old and new versions run side by side during every deploy. Change schemas and APIs in steps: add, migrate, then remove.</li>
      </ul>
    </Prose>
    <BackoffLab />
    <Prose><h3>Failure modes to design for</h3></Prose>
    <FailCards />
  </>
);

export default ProductionBody;
