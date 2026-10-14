import { FallaciesLab, LatencyLadder } from '../labs/fallacies/FallaciesLab';
import { Prose } from '../ui/primitives';

const FallaciesBody = () => (
  <>
    <Prose>
      <p>In the 1990s, engineers at Sun Microsystems wrote down eight assumptions that programmers new to distributed systems tend to make. Every one of them is false, and every one has caused real outages. They&apos;re known as the <b>fallacies of distributed computing</b>.</p>
      <p>Code written on one machine quietly relies on them. A function call always returns, takes nanoseconds, and nobody can intercept it. Swap the function call for a network call and all of that breaks.</p>
    </Prose>
    <FallaciesLab />
    <Prose>
      <h3>How big is &quot;latency&quot;?</h3>
      <p>Nanoseconds are hard to picture. Scale the numbers so that one nanosecond becomes one second, and a round trip across the Atlantic takes years. This is why <b>the number of network round trips</b> is often the most important performance metric in a distributed design.</p>
    </Prose>
    <LatencyLadder />
  </>
);

export default FallaciesBody;
