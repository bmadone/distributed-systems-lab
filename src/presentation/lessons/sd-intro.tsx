import { ArchLab } from '../labs/arch/ArchLab';
import { Sorter } from '../ui/Exercises';
import { Prose } from '../ui/primitives';

const SdIntroBody = () => (
  <>
    <Prose>
      <p>When Netflix streamed the Paul vs. Tyson fight in November 2024, it reported 65 million concurrent streams, and many viewers saw buffering and freezes. The code that plays a video wasn&apos;t the problem. The hard part was everything around it: traffic spiking all at once, encoding pipelines, and delivery networks under a load nobody had tested at that size. <b>System design</b> is the discipline that deals with that layer.</p>
      <p>System design is planning how a product works end to end under real conditions. You decide:</p>
      <ul>
        <li><b>The building blocks:</b> clients, load balancers, services, databases, caches, queues, CDNs.</li>
        <li><b>How they interact:</b> APIs, sync or async calls, data flow.</li>
        <li><b>How it behaves at scale:</b> traffic spikes, slow networks, failed machines, regional outages.</li>
        <li><b>Which trade-offs to accept:</b> cost or reliability, latency or consistency, simplicity or flexibility.</li>
      </ul>
      <h3>Design, coding and architecture</h3>
      <p>Coding asks <i>&quot;how do I implement this correctly?&quot;</i> System design asks <i>&quot;how does the whole system stay correct, fast and available when reality hits?&quot;</i> Coding failures are null pointers and logic bugs. Design failures are outages, cascading failures and data loss. <b>Software architecture</b> is the wider, longer-lived layer: the structure and principles shared across many systems in an organization. A specific system design works within that architecture.</p>
      <h3>Monolith or microservices</h3>
      <p>A <b>monolith</b> is one deployable unit. It&apos;s simple to build, test and debug, calls between parts are fast in-process function calls, and you scale it as one piece. <b>Microservices</b> split the product into independently deployable services, each owned by a team and scaled separately. You pay for that with network calls, data spread across services, and much more to operate. A common approach is to start with a well-structured monolith and split out services when team size or scale demands it.</p>
      <h3>Requirements come first</h3>
      <p><b>Functional requirements</b> say what the system does: &quot;users can upload a video&quot;. <b>Non-functional requirements</b> say how well it must do it: &quot;p99 latency under 200 ms&quot;, &quot;99.95% availability&quot;, &quot;no data loss once an upload is confirmed&quot;. Non-functional requirements drive most design decisions.</p>
    </Prose>
    <ArchLab />
    <Sorter id="rq" title="Functional or non-functional?" />
  </>
);

export default SdIntroBody;
