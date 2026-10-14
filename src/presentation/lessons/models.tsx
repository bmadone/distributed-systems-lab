import { ModelsLab } from '../labs/models/ModelsLab';
import { Sorter } from '../ui/Exercises';
import { Prose } from '../ui/primitives';

const ModelsBody = () => (
  <>
    <Prose>
      <p>&quot;Consistent&quot; isn&apos;t a yes-or-no property. A <b>consistency model</b> defines which <b>histories</b>, meaning sequences of operations and the results clients observed, a system is allowed to produce. Model A is <b>stronger</b> than model B if it allows fewer histories. Stronger models are easier to build applications on, but they need more coordination, which costs latency and availability.</p>
      <ul>
        <li><b>Linearizability:</b> each operation appears to take effect at one instant between when it was sent and when it was confirmed. After a write is confirmed, every later read sees it. You can treat the system as a single copy, which is what makes locks, counters and compare-and-swap possible.</li>
        <li><b>Sequential consistency:</b> everyone sees all operations in the <b>same order</b>, and each client&apos;s own operations stay in program order. That order doesn&apos;t have to match real time, so a read can lag behind.</li>
        <li><b>Causal consistency:</b> only operations that are <b>causally related</b> must be seen in the same order, such as a reply and the comment it answers. Unrelated operations may appear in different orders to different clients. It&apos;s among the strongest models that can stay available during a partition, provided clients keep talking to the same replica.</li>
        <li><b>Eventual consistency:</b> if writes stop, all replicas eventually converge. Until then, almost any order or stale value is possible.</li>
      </ul>
    </Prose>
    <ModelsLab />
    <Sorter id="hj" title="Judge the history" hint={<>Each history shows when an operation started and finished, measured in ms. Is it linearizable? Ask yourself whether you can pick one instant inside each operation's interval so that the results make sense for a single copy of <code>x</code>, which starts at 0.</>} />
  </>
);

export default ModelsBody;
