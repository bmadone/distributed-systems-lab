import { AvailabilityLab } from '../labs/availability/AvailabilityLab';
import { Prose } from '../ui/primitives';

const SdAvailabilityBody = () => (
  <>
    <Prose>
      <p><b>Availability</b> is the share of time a system does its job, usually written in &quot;nines&quot;. It depends on how often things break (<b>MTBF</b>, mean time between failures) and how quickly you recover (<b>MTTR</b>, mean time to repair): availability = MTBF / (MTBF + MTTR). Halving recovery time helps as much as halving how often things break.</p>
      <div className="table-wrap"><table>
        <thead><tr><th>Availability</th><th>Downtime per year</th><th>Per 30-day month</th></tr></thead>
        <tbody><tr><td>99% (two nines)</td><td>3.65 days</td><td>7.2 hours</td></tr><tr><td>99.9%</td><td>8.76 hours</td><td>43.2 minutes</td></tr><tr><td>99.99%</td><td>52.6 minutes</td><td>4.3 minutes</td></tr><tr><td>99.999%</td><td>5.26 minutes</td><td>26 seconds</td></tr></tbody>
      </table></div>
      <ul>
        <li><b>In series</b> (A calls B, and both must work): multiply. 99.9% × 99.9% = 99.8%. Every extra dependency lowers availability.</li>
        <li><b>In parallel</b> (any one of n copies is enough): 1 − (1 − A)<sup>n</sup>. Two 99% servers give 99.99%, assuming they fail independently. Shared power, shared configuration or shared deploys break that assumption.</li>
      </ul>
      <p><b>Fault tolerance</b> techniques: redundancy (active-active or active-passive), health checks with automatic failover, <b>graceful degradation</b> (show cached or partial results instead of an error), and limiting the <b>blast radius</b> with cells, availability zones and regions. In June 2019, a routine network configuration change at Google Cloud spread across regions and disrupted YouTube, Gmail and Google Cloud services for about four hours. Containing changes like that is part of the design.</p>
    </Prose>
    <AvailabilityLab />
  </>
);

export default SdAvailabilityBody;
