import { CacheLab } from '../labs/cache/CacheLab';
import { Matcher } from '../ui/Exercises';
import { Prose } from '../ui/primitives';

const SdScalingBody = () => (
  <>
    <Prose>
      <p><b>Vertical scaling</b> means a bigger machine: simple, but there&apos;s a ceiling. <b>Horizontal scaling</b> means more machines. It&apos;s easy for <b>stateless</b> services behind a load balancer. A layer-4 balancer routes TCP connections and a layer-7 balancer routes HTTP requests. Common algorithms are round robin, least connections, or consistent hashing when you need sticky routing.</p>
      <p>When something is slow or overloaded, four main tools apply. Each fixes one problem and brings a new one:</p>
      <div className="table-wrap"><table>
        <thead><tr><th>Tool</th><th>Use it when</th><th>New problem</th></tr></thead>
        <tbody>
          <tr><td><b>Cache</b></td><td>The same data is read much more often than it changes</td><td>Stale data, invalidation, stampedes when a popular entry expires</td></tr>
          <tr><td><b>Queue</b></td><td>Work is slow, spiky or can happen later</td><td>Lag, ordering, duplicates, monitoring queue depth</td></tr>
          <tr><td><b>Replicate</b></td><td>Reads overload one node, or you need failover</td><td>Replica lag, failover correctness</td></tr>
          <tr><td><b>Shard</b></td><td>Writes or data size exceed one node</td><td>Cross-shard queries and transactions, rebalancing, hot keys</td></tr>
        </tbody>
      </table></div>
      <h3>Caching strategies</h3>
      <ul>
        <li><b>Cache-aside:</b> the app checks the cache, and on a miss reads the database and fills the cache. This is the most common approach.</li>
        <li><b>Write-through:</b> each write goes to the cache and the database together. Reads are fresh, but writes are slower.</li>
        <li><b>Write-back:</b> writes go to the cache and reach the database later. Writes are fast, but you risk losing them.</li>
        <li><b>Eviction:</b> LRU (least recently used), LFU (least frequently used), or TTL expiry. A <b>CDN</b> is a cache at the network edge, close to users.</li>
      </ul>
      <p>Related patterns: <b>rate limiting</b> (token bucket), <b>CQRS</b> (separate models for reads and writes), <b>event sourcing</b> (store the events and derive state from them), and <b>change data capture</b> (stream database changes to other systems).</p>
    </Prose>
    <CacheLab />
    <Matcher id="sc" title="Cache, queue, replicate or shard?" />
  </>
);

export default SdScalingBody;
