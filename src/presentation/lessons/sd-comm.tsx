import { CallChainLab } from '../labs/callchain/CallChainLab';
import { Matcher } from '../ui/Exercises';
import { Prose } from '../ui/primitives';

const SdCommBody = () => (
  <>
    <Prose>
      <h3>Synchronous or asynchronous</h3>
      <p>In a <b>synchronous</b> call the caller waits for the answer. It&apos;s simple and gives immediate results, but the caller inherits the callee&apos;s latency and failures. In <b>asynchronous</b> communication the caller drops a message on a queue or log and moves on. Services are decoupled, spikes get absorbed and failures are contained. The cost is eventual results, harder debugging, and duplicates to handle.</p>
      <p>Common patterns: <b>request-response</b>, <b>fire-and-forget</b>, <b>publish-subscribe</b> (one event, many consumers), <b>event streaming</b> (a durable, replayable log like Kafka), and for multi-step workflows, <b>choreography</b> (services react to each other&apos;s events) or <b>orchestration</b> (a central coordinator, as in sagas).</p>
      <h3>API styles</h3>
      <ul>
        <li><b>REST:</b> resources and HTTP verbs. It&apos;s cacheable and universally understood, which makes it the default for public APIs.</li>
        <li><b>GraphQL:</b> a single endpoint where the client asks for exactly the fields it needs. It&apos;s great for many different clients. Caching and protecting against expensive queries are harder.</li>
        <li><b>gRPC and RPC:</b> typed contracts in Protocol Buffers over HTTP/2, which makes it fast, supports streaming and generates client code. It&apos;s common between internal services.</li>
      </ul>
      <h3>Serialization and protocols</h3>
      <p><b>JSON</b> is readable but verbose. <b>Protobuf, Avro and Thrift</b> are compact binary formats with schemas. Evolve those schemas safely: add optional fields and never reuse field numbers. Underneath, <b>TCP</b> gives reliable, ordered streams and <b>UDP</b> gives fast, lossy packets, which suit voice, video and DNS. <b>HTTP/2</b> sends many requests over one connection, <b>HTTP/3</b> runs over QUIC on UDP, and <b>WebSockets</b> let the server push to the browser.</p>
    </Prose>
    <CallChainLab />
    <Matcher id="api" title="Choose the protocol or API style" />
  </>
);

export default SdCommBody;
