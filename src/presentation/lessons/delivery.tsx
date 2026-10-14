import { DeliveryLab } from '../labs/delivery/DeliveryLab';
import { Prose } from '../ui/primitives';

const DeliveryBody = () => (
  <>
    <Prose>
      <p>A client sends &quot;charge $20&quot; and hears nothing back. Maybe the request was lost. Maybe the server charged the card and the reply was lost. The client <b>can&apos;t know which</b>. This is the Two Generals problem: over an unreliable link, no amount of messaging gives both sides certainty.</p>
      <p>That leaves three delivery guarantees:</p>
      <ul>
        <li><b>At-most-once:</b> send once and never retry. You get no duplicates, but some messages are lost.</li>
        <li><b>At-least-once:</b> retry until you get an acknowledgment. Nothing is lost, but some messages are processed twice.</li>
        <li><b>Exactly-once:</b> impossible as pure delivery. It&apos;s built as <b>at-least-once delivery plus idempotent processing</b>. The client attaches a unique ID to each request, and the server remembers which IDs it has already handled.</li>
      </ul>
      <p>When Kafka or Flink advertise &quot;exactly-once&quot;, they mean exactly-once <b>effect</b>, achieved through deduplication or transactions on top of retries.</p>
    </Prose>
    <DeliveryLab />
  </>
);

export default DeliveryBody;
