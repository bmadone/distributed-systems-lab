import { EstimatorLab } from '../labs/estimator/EstimatorLab';
import { Prose } from '../ui/primitives';

const SdInterviewBody = () => (
  <>
    <Prose>
      <p>Whether it&apos;s an interview or a real design review, a repeatable process keeps you from missing the requirements that matter.</p>
      <ol>
        <li><b>Clarify requirements.</b> Functional scope, non-functional targets, scale, and what&apos;s out of scope.</li>
        <li><b>Estimate.</b> Back-of-envelope QPS, storage and bandwidth. They decide whether you need sharding or caching at all.</li>
        <li><b>Define the API.</b> The main endpoints or events, with their inputs and outputs.</li>
        <li><b>Model the data.</b> Entities, access patterns, and the choice of store.</li>
        <li><b>Sketch the high-level design.</b> Clients, load balancers, services, storage, caches, queues.</li>
        <li><b>Deep dive.</b> Bottlenecks, hot keys, failure modes, consistency choices.</li>
        <li><b>Discuss trade-offs.</b> What you gave up and why, and what you&apos;d change at 10× scale.</li>
      </ol>
      <p><b>Choosing technology:</b> match the access pattern first, then weigh how well your team knows it, how mature it is, what it costs to run, and whether a managed service fits. Boring technology you can operate usually beats exciting technology you can&apos;t.</p>
      <p className="callout">Useful numbers: a day has 86,400 seconds, roughly 10⁵. One million requests a day is about 12 per second. Peak traffic is often 2–5× the average. Reads often outnumber writes 10:1 to 100:1.</p>
    </Prose>
    <EstimatorLab />
  </>
);

export default SdInterviewBody;
