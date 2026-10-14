import { Sorter } from '../ui/Exercises';
import { Prose } from '../ui/primitives';

const IntroBody = () => (
  <>
    <Prose>
      <p>A <b>distributed system</b> is a group of computers that work together over a network and look like one system to the people using it. Your bank, your favorite streaming service and the DNS lookup behind this page all work this way.</p>
      <p>We distribute for three reasons. <b>Scale:</b> one machine can&apos;t hold all the data or serve all the traffic. <b>Fault tolerance:</b> if one machine dies, others carry on. <b>Latency:</b> putting copies near users in Tokyo and São Paulo makes requests faster for both.</p>
      <p>The price is that three things you took for granted on one machine stop being true:</p>
      <ul>
        <li><b>Partial failure.</b> Some parts break while others keep running, and you often can&apos;t tell which is which.</li>
        <li><b>An unreliable network.</b> Messages get lost, delayed, duplicated or reordered.</li>
        <li><b>No shared clock.</b> Each machine has its own clock, and they drift apart. &quot;What happened first?&quot; becomes a hard question.</li>
      </ul>
      <h3>How we judge correctness: safety and liveness</h3>
      <p>Every guarantee in this course is one of two kinds. A <b>safety</b> property says something bad never happens, like &quot;two nodes never both believe they are the leader&quot;. If it&apos;s broken, you can point to the exact moment it went wrong. A <b>liveness</b> property says something good eventually happens, like &quot;every request eventually gets a reply&quot;. You can never catch it failing at one moment, because &quot;eventually&quot; might still be coming.</p>
      <p className="callout">Most distributed algorithms protect safety at all times and give liveness only when the network behaves. Keep that pattern in mind. You&apos;ll see it again in CAP, Paxos and Raft.</p>
    </Prose>
    <Sorter id="sl" title="Safety or liveness?" hint="Sort each guarantee. You'll see right away whether you were correct." />
  </>
);

export default IntroBody;
