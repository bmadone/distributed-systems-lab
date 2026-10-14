import { AmdahlLab } from '../labs/amdahl/AmdahlLab';
import { TailLatencyLab } from '../labs/tail/TailLatencyLab';
import { Prose } from '../ui/primitives';

const SdObservabilityBody = () => (
  <>
    <Prose>
      <h3>Observability: metrics, logs, traces</h3>
      <ul>
        <li><b>Metrics</b> are numbers over time. They&apos;re cheap to store and good for dashboards and alerts. Track <b>RED</b> for services (Rate, Errors, Duration) and <b>USE</b> for resources (Utilization, Saturation, Errors).</li>
        <li><b>Logs</b> are detailed records of individual events. Make them structured, as JSON with request IDs. They get expensive at high volume.</li>
        <li><b>Traces</b> follow one request across services using trace and span IDs (OpenTelemetry), so you can see which hop was slow.</li>
      </ul>
      <p>An <b>SLI</b> is what you measure, such as the share of requests under 300 ms. An <b>SLO</b> is your target, such as 99.9% over 30 days. An <b>SLA</b> is a contract with penalties. The gap between 100% and your SLO is your <b>error budget</b>: while you have budget left, ship features. When it runs out, focus on reliability.</p>
      <p className="callout warn"><b>Track percentiles, not averages.</b> An average of 50 ms can hide a p99 of 2 seconds. Tail latency also gets worse as requests fan out: if a page waits for 100 backends, the slowest one sets the page&apos;s speed.</p>
      <h3>Processes, threads, concurrency</h3>
      <p>A <b>process</b> has its own memory, which isolates it but makes it costly to create and to communicate with. <b>Threads</b> share their process&apos;s memory, which makes them cheap and fast to communicate between, but open to race conditions. <b>Concurrency</b> is handling many tasks over the same period by interleaving them. An event loop can do this on one core. <b>Parallelism</b> is running tasks at the same instant on several cores. <b>Amdahl&apos;s law</b> caps the speedup from parallelism: the part that must run serially limits you no matter how many cores you add. The OS scheduler and memory management (paging, the cost of context switches) set the per-machine limits you build on.</p>
    </Prose>
    <TailLatencyLab />
    <AmdahlLab />
  </>
);

export default SdObservabilityBody;
