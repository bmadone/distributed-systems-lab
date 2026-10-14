import { VectorClockLab } from '../labs/vclock/VectorClockLab';
import { Prose } from '../ui/primitives';

const ClocksBody = () => (
  <>
    <Prose>
      <p>Physical clocks drift. A typical quartz crystal is off by about 20 parts per million, close to 2 seconds a day. NTP corrects them to within a few milliseconds over the internet, but clocks can still jump backward after a sync or a leap second. <b>Sorting events by wall-clock time across machines is unreliable.</b> Spanner gets around this with GPS and atomic clocks plus explicit uncertainty intervals (TrueTime), and it waits out the uncertainty before committing.</p>
      <h3>Happened-before</h3>
      <p>Lamport (1978) defined order without clocks. Event <b>a happened before b</b> (a → b) if a and b are on the same process and a came first, or if a sends a message and b receives it, or if this follows by chaining (transitivity). If neither a → b nor b → a, the events are <b>concurrent</b>. That doesn&apos;t mean they happened at the same instant, only that neither could have influenced the other.</p>
      <ul>
        <li><b>Lamport clock:</b> one counter per process. Add 1 on every event. On receiving a message, set the counter to max(local, received) + 1. If a → b then L(a) &lt; L(b), but the converse doesn&apos;t hold: a smaller number doesn&apos;t prove a happened first.</li>
        <li><b>Vector clock:</b> one counter per process, kept as a vector. On receiving a message, take the element-wise maximum, then add 1 to your own entry. Now a → b <b>if and only if</b> V(a) &lt; V(b). If neither vector is less than the other, the events are concurrent.</li>
        <li><b>Version vectors</b> apply the same idea to versions of a data item, so replicas can tell &quot;newer&quot; from &quot;conflicting&quot;. Riak and the original Dynamo use them. <b>Dotted version vectors</b> fix the problem of siblings piling up when many clients write.</li>
        <li><b>Distributed snapshots</b> (Chandy-Lamport) use marker messages to record a consistent global state without stopping the system. Flink builds its checkpoints this way.</li>
      </ul>
    </Prose>
    <VectorClockLab />
  </>
);

export default ClocksBody;
