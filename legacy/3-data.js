// ================= COURSE DATA =================
const W = { sorters: {}, matchers: {} };
const sortOk = k => !!(W.sorters[k] && W.sorters[k].allRight);
const matchOk = k => !!(W.matchers[k] && W.matchers[k].allRight);

const PARTS = [
  { id: 'sd', title: 'System design fundamentals' },
  { id: 'found', title: 'Distributed foundations' },
  { id: 'data', title: 'Distributing data' },
  { id: 'guar', title: 'Guarantees' },
  { id: 'agree', title: 'Agreement' },
  { id: 'time', title: 'Time & order' },
  { id: 'prac', title: 'In practice' },
  { id: 'consol', title: 'Consolidate' }
];

const LESSONS = [
  // ---------- SYSTEM DESIGN ----------
  { id: 'sd-intro', part: 'sd', title: 'What is system design?', min: 12,
    objectives: ['Explain what system design covers that coding doesn’t', 'Weigh a monolith against microservices', 'Tell functional from non-functional requirements'],
    predict: { q: 'A live stream with tens of millions of viewers starts buffering. Where is the root cause most likely to be?', opts: ['A bug in the video player code', 'Capacity and architecture under a sudden traffic spike', 'Viewers’ home Wi-Fi', 'The video codec itself'], a: 1,
      reveal: 'Large-scale incidents are usually design problems: overloaded servers, congested delivery networks and failures that cascade. That layer is what system design is about.' },
    practice: [
      { type: 'task', text: 'Click every component in the architecture explorer to learn what it does.', check: () => W.ax && W.ax.visited.size >= 8 },
      { type: 'task', text: 'Sort all requirements correctly as functional or non-functional.', check: () => sortOk('rq') }
    ],
    quiz: [
      { q: 'Which task is mainly a system design decision rather than coding?', opts: ['Writing a function that sorts users by name', 'Debugging a null pointer exception', 'Choosing between SQL and NoSQL for user data', 'Refactoring a class to be shorter'], a: 2, why: 'Choosing a database shapes scalability, consistency and operations for the whole system. The others are implementation details.' },
      { q: '"The search page must respond in under 300 ms at p99." This is a…', opts: ['Functional requirement', 'Non-functional requirement', 'API contract', 'Data model'], a: 1, why: 'It describes how well the system performs (latency), not what it does.' },
      { q: 'The best reason to move from a monolith to microservices is usually…', opts: ['Microservices are always faster', 'Teams need to deploy and scale parts independently', 'It removes network calls', 'It simplifies debugging'], a: 1, why: 'Microservices add network hops and operational work. You split when independent ownership, deployment and scaling are worth that cost.' }
    ],
    explain: { prompt: 'Explain to a junior engineer how system design differs from coding.', model: 'Coding makes one component correct. System design decides which components exist, how they talk, and how the whole thing behaves under load and failure. It is about trade-offs like cost, latency and consistency, and its failures are outages, not exceptions.' },
    takeaways: ['System design turns requirements into a structure that survives real load and failure.', 'Non-functional requirements (latency, availability, durability) drive most decisions.', 'Start simple, like a modular monolith, and split when team or scale needs justify it.'],
    cards: [['Functional vs non-functional requirement', 'Functional: what the system does. Non-functional: how well it does it (latency, availability, durability, cost).'], ['Monolith vs microservices', 'One deployable unit with in-process calls, or many independently deployable services with network calls and more to operate.'], ['System design vs architecture', 'Architecture is the long-lived structure and principles across an organization. System design is the concrete design of one system.']] },

  { id: 'sd-availability', part: 'sd', title: 'Availability & fault tolerance', min: 12,
    objectives: ['Convert nines into downtime', 'Calculate availability for components in series and in parallel', 'Name the main fault-tolerance techniques'],
    predict: { q: 'Your app needs a load balancer, an app server and a database, each 99.9% available. What’s the overall availability?', opts: ['99.9%', 'About 99.7%', '99.99%', 'About 97%'], a: 1,
      reveal: 'Dependencies in series multiply: 0.999³ ≈ 0.997. Every hard dependency lowers availability, which is why redundancy and graceful degradation matter.' },
    practice: [
      { type: 'task', text: 'Reach at least <b>99.99%</b> overall availability in the builder.', check: () => W.av && W.av.total >= 0.9999 },
      { type: 'task', text: 'Reach 99.99% using <b>7 or fewer instances</b> in total. Hint: graceful degradation removes a tier from the critical path.', check: () => W.av && W.av.total >= 0.9999 && W.av.instances <= 7 },
      { type: 'num', text: 'Two services in series, each 99.9% available. What’s the combined availability, in %?', answer: 99.8, tol: 0.011, unit: '%' },
      { type: 'num', text: 'How many minutes of downtime does 99.9% allow in a 30-day month?', answer: 43.2, tol: 0.6, unit: 'min' }
    ],
    quiz: [
      { q: 'Two independent servers, each 99% available, behind a perfect load balancer. Combined availability?', opts: ['99%', '99.5%', '99.99%', '98%'], a: 2, why: 'In parallel: 1 − (0.01 × 0.01) = 0.9999.' },
      { q: 'Which change improves availability without making failures rarer?', opts: ['Buying better hardware', 'Cutting time to recover with automatic failover', 'Adding more dependencies', 'Running fewer health checks'], a: 1, why: 'Availability = MTBF / (MTBF + MTTR). Cutting recovery time (MTTR) raises it directly.' },
      { q: 'Why might two "redundant" servers fail together?', opts: ['They share a power supply, configuration or deploy', 'Redundancy never works', 'Load balancers always fail first', 'Parallel math is wrong'], a: 0, why: 'The parallel formula assumes independent failures. Shared dependencies, such as a bad config pushed everywhere, cause correlated failures.' }
    ],
    explain: { prompt: 'Why can adding a microservice make your product less available?', model: 'Each hard dependency in the request path multiplies in. If checkout calls one more 99.9% service synchronously, total availability drops by about 0.1%. You can avoid that with redundancy, async calls or graceful degradation.' },
    takeaways: ['Series: multiply availabilities. Parallel: 1 − (1 − A)ⁿ.', 'Shorter recovery helps as much as fewer failures.', 'Graceful degradation removes dependencies from the critical path.', 'Contain the blast radius: cells, zones, regions, staged rollouts.'],
    cards: [['Availability formula with MTBF and MTTR', 'A = MTBF / (MTBF + MTTR).'], ['99.99% downtime per year', 'About 52.6 minutes (4.3 minutes per month).'], ['Availability of n parallel replicas', '1 − (1 − A)ⁿ, if failures are independent.']] },

  { id: 'sd-comm', part: 'sd', title: 'Communication & APIs', min: 14,
    objectives: ['Choose between synchronous and asynchronous calls', 'Compare REST, GraphQL and gRPC', 'Pick protocols and serialization formats for a job'],
    predict: { q: 'Checkout calls Payment, Inventory, Email and Analytics synchronously. Email goes down. What happens?', opts: ['Only the emails are delayed', 'Checkout fails or hangs', 'Analytics picks up the slack', 'Nothing'], a: 1,
      reveal: 'A synchronous chain inherits every dependency’s failures and latency. Moving non-critical work like email to a queue isolates checkout from it.' },
    practice: [
      { type: 'task', text: 'Payment must stay synchronous, because you need to know if the charge worked. Get checkout to <b>≥ 99.4%</b> availability and <b>under 150 ms</b>.', check: () => W.cc && W.cc.paymentSync && W.cc.avail >= 0.994 && W.cc.latency < 150 },
      { type: 'task', text: 'Match every use case to the best protocol or API style.', check: () => matchOk('api') }
    ],
    quiz: [
      { q: 'Which API style lets a mobile client request exactly the fields it needs in one round trip?', opts: ['REST', 'GraphQL', 'SOAP', 'FTP'], a: 1, why: 'In GraphQL the client specifies the shape of the response, which avoids fetching too much or making many calls.' },
      { q: 'Why is UDP often used for real-time voice?', opts: ['It encrypts by default', 'A late packet is useless, and TCP’s retransmission adds delay', 'It guarantees ordering', 'It’s required by browsers'], a: 1, why: 'For live audio it’s better to skip a lost packet than wait for a retransmission.' },
      { q: 'A safe way to evolve a Protobuf schema:', opts: ['Reuse old field numbers', 'Change a field’s type', 'Add new optional fields with new numbers', 'Rename the message and delete the old one'], a: 2, why: 'Old readers ignore unknown fields, so adding fields keeps compatibility. Reusing numbers corrupts old data.' }
    ],
    explain: { prompt: 'When would you choose a queue over a direct synchronous call?', model: 'When the caller doesn’t need the result immediately, the work is slow or spiky, or the downstream service is less reliable. A queue decouples availability and absorbs bursts. You pay with eventual results, monitoring lag, and handling duplicates.' },
    takeaways: ['Synchronous calls share fate: latency adds up and availability multiplies.', 'Queues decouple services and absorb spikes, so design for duplicates and lag.', 'REST for public APIs, GraphQL for varied clients, gRPC between internal services.', 'Evolve schemas compatibly: add fields, never reuse numbers.'],
    cards: [['REST vs GraphQL vs gRPC', 'Resources over HTTP and cacheable / client-shaped queries on one endpoint / typed binary RPC over HTTP/2 with streaming.'], ['TCP vs UDP', 'Reliable, ordered streams / fast datagrams with no delivery guarantee.'], ['Choreography vs orchestration', 'Services react to each other’s events / a central coordinator drives the steps.']] },

  { id: 'sd-storage', part: 'sd', title: 'Storage, databases & indexes', min: 15,
    objectives: ['Tell block, file and object storage apart', 'Choose between SQL, NoSQL and NewSQL for an access pattern', 'Explain B-trees, LSM trees and spatial indexes'],
    predict: { q: 'Where would you store 50 PB of user-uploaded videos?', opts: ['A relational database', 'Block volumes attached to app servers', 'Object storage like S3', 'Redis'], a: 2,
      reveal: 'Object storage is built for huge, durable, immutable blobs behind an HTTP API, and it’s cheap per GB. Keep only the metadata in a database.' },
    practice: [
      { type: 'task', text: 'Run a quadtree search that checks <b>fewer than 15%</b> of all points.', check: () => W.qt && W.qt.ratio !== null && W.qt.ratio < 0.15 },
      { type: 'task', text: 'Match each workload to the right kind of database.', check: () => matchOk('db') }
    ],
    quiz: [
      { q: 'Which index structure is optimized for heavy write throughput?', opts: ['B-tree', 'LSM tree', 'Bitmap index', 'No index'], a: 1, why: 'LSM trees buffer writes in memory and write sorted files sequentially, trading some read cost for fast writes.' },
      { q: 'An index on (country, city) helps which query?', opts: ["WHERE city = 'Paris'", "WHERE country = 'FR' AND city = 'Paris'", "WHERE zip = '75001'", 'None of these'], a: 1, why: 'Composite indexes work on a leftmost prefix. A filter on city alone can’t use it.' },
      { q: 'BASE stands for…', opts: ['Basic Atomic Serial Execution', 'Basically Available, Soft state, Eventually consistent', 'Balanced And Secure Encryption', 'Backup And Snapshot Engine'], a: 1, why: 'BASE describes many NoSQL systems that favor availability over immediate consistency.' }
    ],
    explain: { prompt: 'Why do indexes speed up reads but slow down writes?', model: 'An index is an extra sorted structure that lets a query jump straight to matching rows instead of scanning them all. Every insert or update must also update each index, which costs extra writes and storage.' },
    takeaways: ['Object storage for blobs, block storage for databases, file storage for shared filesystems.', 'Pick the database family from the access pattern, not from what’s fashionable.', 'B-trees favor reads, LSM trees favor writes.', 'Spatial indexes (quadtree, R-tree, geohash) make "near me" queries fast.'],
    cards: [['B-tree vs LSM tree', 'In-place pages, read-optimized / buffered sorted files plus compaction, write-optimized.'], ['NewSQL', 'Distributed SQL databases with ACID transactions, like Spanner, CockroachDB and TiDB.'], ['Quadtree', 'Recursively splits 2D space into 4 cells when a cell exceeds its capacity.']] },

  { id: 'sd-scaling', part: 'sd', title: 'Scaling: cache, queue, replicate, shard', min: 14,
    objectives: ['Choose between caching, queuing, replication and sharding', 'Compare caching strategies and eviction policies', 'Explain why skewed workloads cache well'],
    predict: { q: 'A cache holds 5% of your products. Roughly what share of requests can it serve, with typical skewed popularity?', opts: ['About 5%', 'About 25%', 'Often over 50%', 'Nearly 0%'], a: 2,
      reveal: 'Real traffic is skewed, and a small set of hot items gets most requests. A small cache can absorb a large share of reads.' },
    practice: [
      { type: 'task', text: 'At skew 1.0, get a hit ratio of <b>at least 75%</b> while caching <b>no more than 300</b> items.', check: () => W.ch && Math.abs(W.ch.skew - 1) < 0.01 && W.ch.size <= 300 && W.ch.hit >= 0.75 },
      { type: 'task', text: 'Set skew to 0.5 and see how uniform traffic hurts caching: hit ratio below 40% with 200 items cached.', check: () => W.ch && W.ch.skew <= 0.51 && W.ch.size >= 200 && W.ch.hit < 0.4 },
      { type: 'task', text: 'Pick the right scaling tool for every scenario.', check: () => matchOk('sc') }
    ],
    quiz: [
      { q: 'Which caching strategy risks losing data if the cache node dies?', opts: ['Cache-aside', 'Write-through', 'Write-back', 'Read-through'], a: 2, why: 'Write-back confirms writes once they’re in the cache. Anything not yet flushed to the database is lost if the cache dies.' },
      { q: 'A popular cache entry expires and 10,000 requests hit the database at once. This is a…', opts: ['Cache stampede', 'Split brain', 'Hot partition', 'Phantom read'], a: 0, why: 'Fixes include request coalescing, refreshing early, and adding jitter to TTLs.' },
      { q: 'Your data no longer fits on the largest machine and writes are saturated. The tool to reach for is…', opts: ['Add read replicas', 'Add a cache', 'Shard', 'Use a bigger load balancer'], a: 2, why: 'Replicas and caches scale reads. Sharding splits data and writes across nodes.' }
    ],
    explain: { prompt: 'Explain the main difference between replication and sharding.', model: 'Replication copies the same data to several nodes, for read scaling and failover. Sharding splits different data across nodes, for write throughput and size. Big systems usually do both: each shard is replicated.' },
    takeaways: ['Cache for read-heavy repeats, queue for slow or spiky work, replicate for reads and failover, shard for writes and size.', 'Each tool brings a new problem: staleness, lag, failover, cross-shard queries.', 'Skewed popularity is why small caches work so well.'],
    cards: [['Cache-aside', 'The app reads the cache and on a miss reads the database, then fills the cache.'], ['Write-through vs write-back', 'Writes go to cache and DB together (safe, slower) / cache first, DB later (fast, can lose data).'], ['When to shard', 'When data size or write throughput exceeds what one node can handle.']] },

  { id: 'sd-observability', part: 'sd', title: 'Observability & concurrency', min: 12,
    objectives: ['Use metrics, logs and traces for the right questions', 'Define SLI, SLO, SLA and error budgets', 'Reason about tail latency and Amdahl’s law'],
    predict: { q: 'Each backend is slow 1% of the time. A page calls 100 backends in parallel. How often is the page slow?', opts: ['About 1%', 'About 10%', 'About 63%', '100%'], a: 2,
      reveal: '1 − 0.99¹⁰⁰ ≈ 63%. With wide fan-out, rare slowness in each backend becomes common slowness for users. This is "the tail at scale".' },
    practice: [
      { type: 'task', text: 'Find the smallest fan-out where <b>more than half</b> of user requests are slow.', check: () => W.tl && W.tl.n === 69 },
      { type: 'num', text: 'Amdahl: 90% of the work is parallel and runs on 10 cores. What’s the speedup? (one decimal)', answer: 5.3, tol: 0.06, unit: '×' },
      { type: 'num', text: 'Your SLO is 99.9% of requests succeed. In a month with 10 million requests, how many failures can you afford?', answer: 10000, tol: 1, unit: 'requests' }
    ],
    quiz: [
      { q: 'Which signal best shows which service in a request path added 800 ms?', opts: ['A CPU metric', 'A distributed trace', 'An uptime check', 'A log line counter'], a: 1, why: 'Traces record a span for each hop, so the slow hop stands out.' },
      { q: 'An SLO is…', opts: ['A legal contract with refunds', 'An internal reliability target, like 99.9% under 300 ms', 'A type of log', 'A load-balancing algorithm'], a: 1, why: 'An SLI is the measurement, an SLO is the target, and an SLA is the contract.' },
      { q: 'Concurrency vs parallelism:', opts: ['They’re the same', 'Concurrency interleaves many tasks, parallelism runs them at the same instant', 'Parallelism needs a single core', 'Concurrency needs GPUs'], a: 1, why: 'An event loop is concurrent on one core. Parallelism needs several cores.' }
    ],
    explain: { prompt: 'Why should you alert on p99 latency rather than the average?', model: 'Averages hide the tail. A few very slow requests barely move the mean, but they’re the ones users notice, and with fan-out they hit most pages. Percentiles show what the slowest users actually get.' },
    takeaways: ['Metrics for trends and alerts, logs for detail, traces for following one request.', 'SLOs plus error budgets balance shipping speed against reliability.', 'Fan-out turns rare slowness into common slowness.', 'Amdahl: the serial part caps your speedup.'],
    cards: [['RED metrics', 'Rate, Errors, Duration, for every service.'], ['Error budget', '100% minus the SLO. The amount of unreliability you can spend on shipping changes.'], ['Amdahl’s law', 'Speedup = 1 / ((1 − p) + p / n).']] },

  { id: 'sd-security', part: 'sd', title: 'Security fundamentals', min: 12,
    objectives: ['Map controls to confidentiality, integrity and availability', 'Explain authentication vs authorization, and how TLS and OAuth work', 'Match common threats to their mitigations'],
    predict: { q: 'During a TLS handshake, which kind of encryption protects the bulk of the data afterward?', opts: ['Asymmetric (RSA) for every packet', 'Symmetric session keys (such as AES)', 'Hashing only', 'None'], a: 1,
      reveal: 'Asymmetric cryptography is slow, so TLS uses it only to authenticate the server and agree on keys. Then it switches to fast symmetric encryption.' },
    practice: [
      { type: 'task', text: 'Classify every control by the part of CIA it protects.', check: () => sortOk('cia') },
      { type: 'task', text: 'Match every threat to its main mitigation.', check: () => matchOk('th') }
    ],
    quiz: [
      { q: 'A logged-in user changes the URL /invoices/123 to /invoices/124 and sees someone else’s invoice. What failed?', opts: ['Authentication', 'Authorization', 'Encryption at rest', 'Rate limiting'], a: 1, why: 'The system knew who the user was but didn’t check whether they could access that invoice.' },
      { q: 'How should passwords be stored?', opts: ['Encrypted with AES', 'Hashed with SHA-256', 'Hashed with a slow, salted algorithm like bcrypt or Argon2', 'In plain text behind a firewall'], a: 2, why: 'Slow, salted hashes make brute-forcing a stolen database very expensive.' },
      { q: 'OAuth 2.0 mainly provides…', opts: ['Password storage', 'Delegated authorization through access tokens', 'Disk encryption', 'Load balancing'], a: 1, why: 'Apps get scoped, revocable tokens instead of your password. OpenID Connect adds identity.' }
    ],
    explain: { prompt: 'Explain the difference between authentication and authorization with an example.', model: 'Authentication proves who you are, like logging in with a password and MFA. Authorization decides what you can do, like whether you may view invoice 124. You can be authenticated and still not authorized.' },
    takeaways: ['CIA: confidentiality, integrity, availability.', 'Authentication is identity, authorization is permission. Check permission on every request.', 'TLS uses asymmetric crypto to agree on fast symmetric keys.', 'Parameterized queries, output encoding and rate limiting stop the most common attacks.'],
    cards: [['Authentication vs authorization', 'Who you are / what you’re allowed to do.'], ['Symmetric vs asymmetric encryption', 'One shared key, fast / public-private key pair, used for key exchange and signatures.'], ['SQL injection fix', 'Parameterized queries or prepared statements. Never concatenate user input into SQL.']] },

  // ---------- DISTRIBUTED FOUNDATIONS ----------
  { id: 'intro', part: 'found', title: 'Why distributed systems are hard', min: 8,
    objectives: ['Name the three things that make distributed systems hard', 'Tell safety properties from liveness properties'],
    predict: { q: 'A server sent a request to another server 5 seconds ago and has no reply. What can it conclude?', opts: ['The other server crashed', 'The network dropped the request', 'Nothing for certain', 'The request succeeded'], a: 2,
      reveal: 'Any of these could be true: the request was lost, the server is slow or crashed, or it succeeded and the reply was lost. That uncertainty is the main theme of this course.' },
    practice: [
      { type: 'task', text: 'Sort all 8 guarantees correctly as safety or liveness.', check: () => sortOk('sl') },
      { type: 'num', text: 'You run 100 servers, and each is independently down 1% of the time. What’s the chance at least one is down right now, in %? (nearest whole number)', answer: 63, tol: 1, unit: '%' }
    ],
    quiz: [
      { q: '"No two nodes ever hold the same lock at the same time" is a…', opts: ['Safety property', 'Liveness property', 'Performance property', 'Availability property'], a: 0, why: 'It forbids something bad, and a violation happens at a specific moment.' },
      { q: 'Which is NOT one of the core difficulties of distributed systems?', opts: ['Partial failure', 'Unreliable network', 'No global clock', 'Programming languages are too slow'], a: 3, why: 'The hard parts come from failure, the network and time, not from language speed.' },
      { q: 'Why distribute a system at all?', opts: ['Scale, fault tolerance and latency', 'It’s always simpler', 'It removes the need for testing', 'It guarantees consistency'], a: 0, why: 'Distribution buys scale, resilience and proximity to users, at the cost of complexity.' }
    ],
    explain: { prompt: 'In your own words: what makes a distributed system harder than a program on one machine?', model: 'Parts fail independently and you often can’t tell which ones. Messages can be lost, delayed or duplicated. There’s no shared clock to say what happened first. A single machine hides all three.' },
    takeaways: ['Partial failure, unreliable networks and no shared clock are the root difficulties.', 'Safety means nothing bad ever happens. Liveness means something good eventually happens.', 'Good algorithms always keep safety and give liveness when the network behaves.'],
    cards: [['Safety property', 'Something bad never happens. A violation can be pinned to a moment.'], ['Liveness property', 'Something good eventually happens.'], ['Partial failure', 'Some components fail while others keep working, often without anyone knowing which.']] },

  { id: 'fallacies', part: 'found', title: 'Fallacies & latency', min: 10,
    objectives: ['List the eight fallacies of distributed computing', 'Estimate the cost of network round trips'],
    predict: { q: 'If 1 nanosecond took 1 second, about how long would a round trip from California to Europe take?', opts: ['About a minute', 'About a day', 'About a month', 'About 5 years'], a: 3,
      reveal: 'At about 150 ms, scaled up a billion times, it’s close to 5 years. Network round trips are huge compared to computation.' },
    practice: [
      { type: 'task', text: 'Reveal all eight fallacy cards.', check: () => W.fal && W.fal.revealed >= 8 },
      { type: 'num', text: 'A page makes 6 sequential calls between us-east and eu-west, about 80 ms per round trip. What’s the minimum network time in ms?', answer: 480, tol: 1, unit: 'ms' },
      { type: 'num', text: 'Same 6 calls, but made in parallel. Minimum network time in ms?', answer: 80, tol: 1, unit: 'ms' }
    ],
    quiz: [
      { q: 'Which design choice responds to "the network is reliable" being false?', opts: ['Retries with idempotency', 'Larger CPUs', 'More logging', 'Monorepos'], a: 0, why: 'Messages will be lost, so you retry, and you make retries safe with idempotency.' },
      { q: '"Topology doesn’t change" is false because…', opts: ['Servers are added, removed and moved, and IPs change all the time', 'Networks are wireless', 'DNS is broken', 'TCP forbids it'], a: 0, why: 'Autoscaling, failover and deploys constantly reshape the network. Use service discovery, not hard-coded addresses.' },
      { q: 'Batching 100 small requests into one mainly fights which fallacy?', opts: ['Latency is zero', 'The network is secure', 'There is one administrator', 'The network is homogeneous'], a: 0, why: 'You pay round-trip latency once instead of 100 times.' }
    ],
    explain: { prompt: 'Pick one fallacy and explain how it could cause an outage.', model: 'Example: "latency is zero". A service makes 50 sequential calls to a database in another region. Each costs 70 ms, so the page takes 3.5 seconds, connections pile up, and the service falls over under normal load.' },
    takeaways: ['All eight fallacies are false in every real network.', 'Count network round trips, and batch or parallelize them.', 'A network call is never "just a function call".'],
    cards: [['The 8 fallacies', 'Reliable network, zero latency, infinite bandwidth, secure network, unchanging topology, one administrator, zero transport cost, homogeneous network.'], ['Typical same-datacenter round trip', 'About 0.5 ms.'], ['Typical transatlantic round trip', 'About 70–150 ms.']] },

  { id: 'failures', part: 'found', title: 'Failures & system models', min: 12,
    objectives: ['Classify failures as crash-stop, crash-recovery, omission or Byzantine', 'Explain the synchronous, asynchronous and partially synchronous timing models', 'Reason about failure detector timeouts'],
    predict: { q: 'You shorten a failure detector’s timeout from 5 s to 200 ms. What’s the main risk?', opts: ['Slower detection', 'Healthy-but-slow nodes get declared dead', 'More memory use', 'No risk'], a: 1,
      reveal: 'Short timeouts catch crashes quickly but also flag nodes that are only paused, for example by garbage collection, which can trigger needless failovers.' },
    practice: [
      { type: 'task', text: 'Set a timeout with <b>zero</b> false suspicions.', check: () => W.fd && W.fd.falseCount === 0 },
      { type: 'task', text: 'Find a timeout with <b>at most 2</b> false suspicions that still detects a crash <b>within 1 second</b>.', check: () => W.fd && W.fd.falseCount <= 2 && W.fd.T <= 1000 },
      { type: 'task', text: 'Diagnose all six incidents correctly.', check: () => sortOk('dx') }
    ],
    quiz: [
      { q: 'A server restarts after a power loss and has lost everything that was only in memory. Which failure model is this?', opts: ['Crash-stop', 'Crash-recovery', 'Byzantine', 'Omission'], a: 1, why: 'It comes back, so it isn’t crash-stop, and it loses state that wasn’t saved to disk.' },
      { q: 'Most practical consensus algorithms assume which timing model?', opts: ['Synchronous', 'Asynchronous', 'Partially synchronous', 'None'], a: 2, why: 'They stay safe at all times and make progress once the network settles down.' },
      { q: 'Why can’t a perfect failure detector exist in an asynchronous system?', opts: ['Clocks are too slow', 'You can’t tell a slow node from a crashed one', 'Networks are encrypted', 'Nodes are Byzantine'], a: 1, why: 'Without time bounds, any timeout can be wrong.' }
    ],
    explain: { prompt: 'Explain why choosing a timeout is always a trade-off.', model: 'A short timeout detects real crashes quickly but wrongly declares slow nodes dead. A long timeout avoids false alarms but leaves clients waiting on a dead node. There’s no value that’s always right, because delays have no fixed upper bound.' },
    takeaways: ['Crash-recovery is the realistic default, and Byzantine is for untrusted settings.', 'Partial synchrony: always safe, makes progress when things are calm.', 'Timeouts trade detection speed against false alarms.'],
    cards: [['Crash-recovery failure', 'The node halts, restarts later, and may lose in-memory state.'], ['Byzantine failure', 'A node behaves arbitrarily, even maliciously.'], ['Partially synchronous model', 'Timing bounds exist but may be broken for a while. Algorithms stay safe and make progress once bounds hold.']] },

  { id: 'delivery', part: 'found', title: 'The tale of exactly-once', min: 10,
    objectives: ['Compare at-most-once, at-least-once and exactly-once', 'Build exactly-once effect with idempotency'],
    predict: { q: 'A payment request times out. The client retries. What could go wrong?', opts: ['Nothing', 'The customer is charged twice', 'The server crashes', 'The payment is refunded'], a: 1,
      reveal: 'The first attempt may have succeeded and only the reply was lost. Retrying without deduplication charges twice.' },
    practice: [
      { type: 'task', text: 'Demonstrate the danger: run a batch that produces <b>at least one duplicate charge</b>.', check: () => W.dl && W.dl.everDup },
      { type: 'task', text: 'With <b>≥ 30% loss</b> and <b>≥ 50 payments</b>, get <b>zero lost and zero duplicates</b>.', check: () => { const r = W.dl && W.dl.last; return !!r && r.loss >= 30 && r.n >= 50 && r.lost === 0 && r.dup === 0; } }
    ],
    quiz: [
      { q: 'Exactly-once processing in practice is built from…', opts: ['Faster networks', 'At-least-once delivery plus idempotent or deduplicated processing', 'At-most-once delivery', 'Bigger timeouts'], a: 1, why: 'Retry until acknowledged, and make repeated processing harmless.' },
      { q: 'Which operation is naturally idempotent?', opts: ['balance = balance + 10', 'Set email = "a@b.com"', 'Append a row to a log', 'Send an SMS'], a: 1, why: 'Setting a value twice has the same effect as setting it once.' },
      { q: 'The Two Generals problem shows that…', opts: ['Consensus is fast', 'Over a lossy link, no protocol can make both sides certain', 'TCP is unnecessary', 'Clocks must be synchronized'], a: 1, why: 'The last message can always be lost, so certainty is impossible.' }
    ],
    explain: { prompt: 'How would you make a "charge card" API safe to retry?', model: 'The client generates a unique idempotency key per payment and sends it with every retry. The server stores processed keys with their result. If a key repeats, it returns the stored result instead of charging again.' },
    takeaways: ['You can’t tell a lost request from a lost reply.', 'At-least-once plus idempotency gives exactly-once effect.', 'Idempotency keys turn retries from dangerous into safe.'],
    cards: [['At-least-once delivery', 'Retry until acknowledged. Nothing is lost, but duplicates are possible.'], ['Idempotent operation', 'Running it several times has the same effect as running it once.'], ['Idempotency key', 'A unique ID per logical request so the server can deduplicate retries.']] },

  // ---------- DATA ----------
  { id: 'partitioning', part: 'data', title: 'Partitioning & consistent hashing', min: 12,
    objectives: ['Compare range, hash and consistent-hash partitioning', 'Predict how many keys move when the cluster resizes', 'Explain why virtual nodes help'],
    predict: { q: 'You shard keys with hash(key) mod 4 and add a fifth node. Roughly what share of keys move?', opts: ['About 20%', 'About 50%', 'About 80%', 'None'], a: 2,
      reveal: 'With mod N, a key stays put only if hash mod 4 equals hash mod 5, which happens for about 1 in 5 keys. So about 80% move. Consistent hashing moves only about 1/(N+1), here about 20%.' },
    practice: [
      { type: 'task', text: 'With <b>hash mod N</b>, go from 4 to 5 nodes and see how many keys move.', check: () => { const m = W.ps && W.ps.lastMove; return !!m && m.strategy === 'mod' && m.from === 4 && m.to === 5; } },
      { type: 'task', text: 'With <b>consistent hashing</b>, add a node and move <b>under 30%</b> of the keys.', check: () => { const m = W.ps && W.ps.lastMove; return !!m && m.strategy === 'ring' && m.to > m.from && m.moved / m.total < 0.3; } },
      { type: 'task', text: 'With consistent hashing and 4 nodes, turn on virtual nodes so the busiest node holds <b>under 33%</b> of the keys.', check: () => W.ps && W.ps.strategy === 'ring' && W.ps.vn && W.ps.n === 4 && W.ps.maxShare < 0.33 }
    ],
    quiz: [
      { q: 'Which strategy keeps range scans such as "all orders from March" efficient?', opts: ['Hash partitioning', 'Range partitioning', 'Random placement', 'Consistent hashing'], a: 1, why: 'Adjacent keys live on the same node, so a range scan touches few nodes.' },
      { q: 'Virtual nodes in consistent hashing exist mainly to…', opts: ['Encrypt keys', 'Spread load evenly and share the work when nodes join or leave', 'Speed up hashing', 'Allow range scans'], a: 1, why: 'Many small ring segments per node average out the imbalance.' },
      { q: 'A "hot spot" in range partitioning is often caused by…', opts: ['Monotonic keys like timestamps', 'Too many nodes', 'Hash collisions', 'Replication'], a: 0, why: 'Every new key lands in the newest range, on one node.' }
    ],
    explain: { prompt: 'Explain why consistent hashing beats hash mod N when you add nodes.', model: 'With mod N, changing N changes the remainder for most keys, so almost everything moves. With a ring, a new node takes over only the segment between itself and its neighbor, so only about 1/(N+1) of the keys move.' },
    takeaways: ['Range: good scans, risk of hot spots. Hash: even spread, no scans.', 'Hash mod N reshuffles almost everything on resize.', 'Consistent hashing moves about 1/(N+1) of keys, and virtual nodes even out the load.'],
    cards: [['Consistent hashing', 'Keys and nodes on a ring. Each key belongs to the next node clockwise, so adding a node moves only about 1/(N+1) of keys.'], ['Virtual nodes', 'Many ring positions per physical node, for even load.'], ['Hot spot', 'One partition gets a disproportionate share of traffic.']] },

  { id: 'replication', part: 'data', title: 'Replication: sync vs async', min: 12,
    objectives: ['Compare primary-backup, multi-primary and leaderless replication', 'Explain why async replication breaks linearizability', 'Show how async failover loses confirmed writes'],
    predict: { q: 'With asynchronous replication, Client 1’s write is confirmed. A moment later Client 2 reads from a replica. What does it see?', opts: ['Always the new value', 'Possibly the old value', 'An error', 'Both values'], a: 1,
      reveal: 'The replica may not have received the write yet. The system confirmed the write before the replica had it.' },
    practice: [
      { type: 'task', text: 'In <b>async</b> mode, set the read time so Client 2 gets a <b>stale</b> value after the write was confirmed.', check: () => W.rp && W.rp.mode === 'async' && W.rp.stale },
      { type: 'task', text: 'Crash the primary in async mode and <b>lose a confirmed write</b>.', check: () => W.rp && W.rp.mode === 'async' && W.rp.crash && W.rp.lost },
      { type: 'task', text: 'Switch to <b>sync</b> with the crash on and check that the client is never told "success" for a lost write.', check: () => W.rp && W.rp.mode === 'sync' && W.rp.crash },
      { type: 'num', text: 'Sync replication waits for the slowest replica. The local write takes 5 ms and lag to the farthest replica is 120 ms. When is the write confirmed, in ms? (ignore the return trip)', answer: 125, tol: 1, unit: 'ms' }
    ],
    quiz: [
      { q: 'Main downside of synchronous replication?', opts: ['Possible data loss', 'Higher write latency, and one slow replica stalls writes', 'Stale reads', 'Write conflicts'], a: 1, why: 'Each write waits for the slowest replica it must reach.' },
      { q: 'Multi-primary replication must deal with…', opts: ['Write conflicts', 'Having no replicas', 'Running out of disk', 'TLS'], a: 0, why: 'Concurrent writes at different leaders conflict and need a resolution rule.' },
      { q: 'Async replication followed by failover can…', opts: ['Lose writes that were confirmed', 'Never lose data', 'Double the throughput', 'Prevent split brain'], a: 0, why: 'Writes the old primary confirmed but hadn’t shipped are missing on the new primary.' }
    ],
    explain: { prompt: 'Explain the latency vs consistency trade-off in replication.', model: 'Waiting for replicas before confirming (sync) keeps copies identical, so no read is stale and no confirmed write is lost on failover, but every write pays the slowest replica’s latency. Confirming right away (async) is fast but exposes stale reads and loss. This is the "Else" half of PACELC.' },
    takeaways: ['Sync replication is safe and slow. Async is fast and risky.', 'Async replication is why a replica read can be stale.', 'Multi-primary and leaderless designs trade conflicts for availability.'],
    cards: [['Synchronous replication', 'The primary waits for replicas before confirming. No loss on failover, higher latency.'], ['Asynchronous replication', 'The primary confirms immediately. Fast, but stale replicas and possible loss on failover.'], ['Replication lag', 'How far a replica is behind the primary.']] },

  { id: 'quorums', part: 'data', title: 'Quorums', min: 10,
    objectives: ['Use R + W > N to reason about read freshness', 'Trade latency against fault tolerance with W and R'],
    predict: { q: 'N = 3. With W = 1 and R = 1, can a read miss the latest write?', opts: ['No, never', 'Yes', 'Only if a node is down', 'Only if W = R'], a: 1,
      reveal: 'The write may land on replica 1 and the read on replica 3. Their groups don’t overlap, because R + W = 2 is not greater than 3.' },
    practice: [
      { type: 'task', text: 'With N = 3, make reads always see the latest write while <b>both</b> reads and writes survive one failed replica.', check: () => W.q && W.q.N === 3 && W.q.overlap && W.q.N - W.q.W >= 1 && W.q.N - W.q.R >= 1 },
      { type: 'task', text: 'With N = 5, give the <b>fastest consistent reads</b> (smallest R) while writes still survive one failure.', check: () => W.q && W.q.N === 5 && W.q.W === 4 && W.q.R === 2 },
      { type: 'task', text: 'Fail replicas until <b>writes are unavailable but reads still work</b>.', check: () => W.q && !W.q.canW && W.q.canR }
    ],
    quiz: [
      { q: 'N = 5, W = 3. What’s the minimum R for reads to overlap writes?', opts: ['1', '2', '3', '5'], a: 2, why: 'R + W > N means R > 2, so R = 3.' },
      { q: 'Lowering W from 3 to 1, with N = 3, mainly…', opts: ['Makes writes faster and more failure-tolerant but risks stale reads', 'Makes reads consistent', 'Increases durability', 'Has no effect'], a: 0, why: 'Fewer confirmations means faster writes, but the read groups may no longer overlap.' },
      { q: 'Why does 2W > N matter?', opts: ['It speeds up reads', 'Two disjoint groups can’t both accept conflicting writes', 'It encrypts data', 'It’s required for range scans'], a: 1, why: 'Write groups must overlap, so both sides of a split can’t succeed.' }
    ],
    explain: { prompt: 'Explain why R + W > N guarantees a read sees the latest write.', model: 'Pigeonhole: the write reached W replicas and the read asks R. If R + W is more than N, the two groups must share at least one replica, and that replica has the newest version.' },
    takeaways: ['R + W > N means read and write groups overlap.', 'W and R trade latency against fault tolerance against consistency.', 'Overlap is necessary but not enough for full linearizability.'],
    cards: [['Quorum overlap rule', 'R + W > N, so every read group overlaps every write group.'], ['Cassandra QUORUM', 'A majority of replicas, ⌊N/2⌋ + 1, for reads and writes.'], ['Sloppy quorum', 'Writes go to any reachable nodes when home replicas are down. More available, weaker overlap.']] },

  // ---------- GUARANTEES ----------
  { id: 'cap', part: 'guar', title: 'The CAP theorem', min: 15,
    objectives: ['State CAP precisely', 'Show what CP and AP systems do during a partition', 'Explain PACELC'],
    predict: { q: 'A node can’t reach the rest of its cluster and gets a read request. To keep the data strictly consistent, it must…', opts: ['Answer from its local copy', 'Refuse or wait', 'Forward to a cache', 'Guess'], a: 1,
      reveal: 'It can’t confirm it has the latest value, so it has to refuse. That’s giving up availability, the CP choice.' },
    practice: [
      { type: 'task', text: 'Complete the 7-step guided experiment.', check: () => W.cap && W.cap.step >= 7 },
      { type: 'task', text: 'In CP mode, complete a write <b>while the network is partitioned</b>. Hint: use the majority side.', check: () => W.cap && W.cap.cpMajorityWrite },
      { type: 'task', text: 'Lose a confirmed write in AP mode.', check: () => W.cap && W.cap.lost >= 1 }
    ],
    quiz: [
      { q: 'In CAP, "availability" means…', opts: ['99.99% uptime', 'Every request to a non-failed node gets a non-error response', 'The majority side works', 'Low latency'], a: 1, why: 'CAP’s definition is strict and formal, not an uptime percentage.' },
      { q: 'A "CA" distributed system is…', opts: ['The best choice', 'Not meaningful, since partitions happen. It really means one node', 'What Cassandra is', 'Always faster'], a: 1, why: 'You can’t opt out of partitions once there’s a network.' },
      { q: 'PACELC adds which trade-off when there is no partition?', opts: ['Cost vs features', 'Latency vs consistency', 'Security vs speed', 'Disk vs memory'], a: 1, why: 'Even on a healthy network, coordinating for consistency costs latency.' }
    ],
    explain: { prompt: 'Explain CAP to a colleague without using the phrase "pick two".', model: 'When the network splits, a node that can’t reach the others has two options: refuse requests (stay consistent, lose availability) or answer from its own copy (stay available, risk stale or conflicting data). When the network is healthy you get both, and the trade-off becomes latency against consistency.' },
    takeaways: ['CAP only forces a choice during a partition.', 'CP refuses on the minority side. AP answers and resolves conflicts later.', 'PACELC: otherwise, latency vs consistency.'],
    cards: [['CAP theorem', 'During a network partition, a system can’t be both linearizable and fully available.'], ['PACELC', 'If Partition: A or C. Else: Latency or Consistency.'], ['CP behavior during a partition', 'The minority side refuses requests and the majority side keeps serving.']] },

  { id: 'models', part: 'guar', title: 'Consistency models', min: 15,
    objectives: ['Define a consistency model as a set of allowed histories', 'Distinguish linearizable, sequential, causal and eventual consistency', 'Judge whether a history is linearizable'],
    predict: { q: 'Bob replies to Alice’s post. Which model is the weakest that guarantees nobody ever sees the reply without the post?', opts: ['Eventual', 'Causal', 'Sequential', 'Linearizable'], a: 1,
      reveal: 'Causal consistency orders causally related operations: a reply is caused by reading the post. It’s the weakest of these models with that guarantee, and unlike the stronger ones it can stay available during partitions (with sticky clients).' },
    practice: [
      { type: 'task', text: 'Explore all five models in the story lab.', check: () => W.models && W.models.visited.size >= 5 },
      { type: 'task', text: 'Judge all four histories correctly.', check: () => sortOk('hj') }
    ],
    quiz: [
      { q: 'Model A is "stronger" than model B when A…', opts: ['Is faster', 'Allows fewer histories', 'Uses more replicas', 'Is newer'], a: 1, why: 'Stronger models rule out more behaviors.' },
      { q: 'Sequential consistency differs from linearizability because it…', opts: ['Allows any order', 'Doesn’t require matching real time', 'Ignores program order', 'Is stronger'], a: 1, why: 'There’s still one global order, but it can lag behind wall-clock time.' },
      { q: 'Which can be implemented while staying available during a partition?', opts: ['Linearizability', 'Sequential', 'Causal', 'None'], a: 2, why: 'Causal consistency (with sticky clients) can stay available. Linearizable and sequential consistency can\u2019t.' }
    ],
    explain: { prompt: 'Describe a user-visible bug that causal consistency prevents but eventual consistency allows.', model: 'In a comment thread, a reader sees "Congrats!" before the post announcing the news, or a reply before the question it answers. Causal consistency makes sure effects never appear before their causes.' },
    takeaways: ['A consistency model is the set of histories a system may produce.', 'Linearizable, then sequential, then causal, then eventual, from strongest to weakest.', 'Causal is among the strongest models that can stay available.'],
    cards: [['Linearizability', 'Each operation takes effect at one instant between its start and its confirmation. Matches real time.'], ['Sequential consistency', 'One global order respecting each client’s program order. Doesn’t have to match real time.'], ['Causal consistency', 'Causally related operations are seen in the same order by everyone. Concurrent ones may differ.']] },

  { id: 'isolation', part: 'guar', title: 'ACID & isolation levels', min: 15,
    objectives: ['Explain each letter of ACID', 'Name the anomalies each isolation level allows', 'Compare locking, optimistic and MVCC enforcement'],
    predict: { q: 'Two transactions each read counter = 10, add 1 and write 11. What’s the final value under Read Committed?', opts: ['12', '11', 'An error', '10'], a: 1,
      reveal: 'That’s a lost update. Read Committed doesn’t prevent it. You need Repeatable Read or snapshot isolation (which aborts one writer), or an atomic increment. Beware: MySQL’s Repeatable Read still allows it.' },
    practice: [
      { type: 'task', text: 'Find the <b>weakest</b> isolation level that prevents a <b>dirty read</b>.', check: () => W.ix && W.ix.level === 'RC' && W.ix.anom === 'dirtyread' },
      { type: 'task', text: 'Find the weakest level that prevents a <b>lost update</b> (in the textbook model; MySQL differs).', check: () => W.ix && W.ix.level === 'RR' && W.ix.anom === 'lostupdate' },
      { type: 'task', text: 'Find an anomaly that <b>snapshot isolation still allows</b>.', check: () => W.ix && W.ix.level === 'SI' && W.ix.anom === 'writeskew' }
    ],
    quiz: [
      { q: 'Write skew is…', opts: ['Two transactions overwrite the same row', 'Two transactions read overlapping data, then update different rows, breaking a rule together', 'Reading uncommitted data', 'A disk failure'], a: 1, why: 'Example: two on-call doctors each see that someone else is on call and both go off duty.' },
      { q: 'PostgreSQL’s default isolation level is…', opts: ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'], a: 1, why: 'MySQL InnoDB defaults to Repeatable Read.' },
      { q: 'MVCC’s main benefit:', opts: ['Readers don’t block writers', 'No disk usage', 'Prevents every anomaly', 'No transactions needed'], a: 0, why: 'Each transaction reads its own snapshot, so readers and writers don’t wait for each other.' }
    ],
    explain: { prompt: 'Explain write skew with your own example, and how to prevent it.', model: 'A meeting room is free. Two people each check, see it free, and each insert a booking for 3 pm, because they wrote different rows. Snapshot isolation allows this. Prevent it with SERIALIZABLE (SSI), a lock on the room row (SELECT … FOR UPDATE), or a unique constraint.' },
    takeaways: ['ACID: atomic, consistent (your rules), isolated, durable.', 'Weaker levels allow dirty reads, non-repeatable reads, lost updates, phantoms and write skew.', 'Snapshot isolation still allows write skew. SSI prevents it.'],
    cards: [['Lost update', 'Two read-modify-write cycles overlap and one write overwrites the other.'], ['Phantom read', 'Re-running a query returns new rows inserted by another transaction.'], ['Strict serializability', 'Serializable plus linearizable, the strongest guarantee (Spanner, FoundationDB).']] },

  // ---------- AGREEMENT ----------
  { id: 'commit', part: 'agree', title: 'Distributed transactions: 2PC, 3PC, sagas', min: 14,
    objectives: ['Walk through two-phase commit', 'Explain why 2PC blocks', 'Use sagas with compensating actions'],
    predict: { q: 'In 2PC, every participant voted YES and then the coordinator crashed. What can the participants do?', opts: ['Commit on their own', 'Abort on their own', 'Wait, holding locks, until the coordinator returns', 'Elect a new coordinator immediately'], a: 2,
      reveal: 'Having voted yes, a participant can’t decide alone, because others might have been told to commit or to abort. It’s "in doubt" and blocked.' },
    practice: [
      { type: 'task', text: 'Run a 2PC where everyone <b>commits</b>.', check: () => W.tpc && W.tpc.seen.commit },
      { type: 'task', text: 'Make the transaction <b>abort</b> because one participant votes no.', check: () => W.tpc && W.tpc.seen.abort },
      { type: 'task', text: 'Leave participants <b>blocked in doubt</b>, then recover the coordinator.', check: () => W.tpc && W.tpc.seen.blocked && W.tpc.seen.recovered },
      { type: 'task', text: 'Run a saga where the <b>car rental</b> step fails and watch the compensations.', check: () => W.sg && W.sg.ranFail === 'car' }
    ],
    quiz: [
      { q: 'What does a participant promise when it votes YES in 2PC?', opts: ['To commit if told, even after a crash', 'To abort', 'To become the coordinator', 'Nothing'], a: 0, why: 'It writes its changes durably so it can still commit after recovering.' },
      { q: 'Sagas give up which property compared to 2PC?', opts: ['Durability', 'Isolation, since intermediate states are visible', 'Availability', 'Partition tolerance'], a: 1, why: 'Other transactions can see the partial progress, and compensation happens later.' },
      { q: 'How do Spanner and CockroachDB avoid 2PC blocking?', opts: ['They don’t use transactions', 'They replicate the coordinator’s state with Paxos or Raft', 'They use 3PC', 'They retry forever'], a: 1, why: 'The decision survives the loss of one machine.' }
    ],
    explain: { prompt: 'When would you choose a saga over 2PC?', model: 'For long-running, cross-service workflows like booking a trip, where holding locks across services for minutes is unacceptable and services are owned by different teams. You accept visible intermediate states and write a compensation for each step.' },
    takeaways: ['2PC: prepare (vote), then commit or abort.', '2PC blocks if the coordinator dies after the votes are in.', 'Consensus-based commit or sagas avoid long blocking.'],
    cards: [['Two-phase commit', 'Phase 1: the coordinator collects votes. Phase 2: it broadcasts commit if all said yes, otherwise abort.'], ['In-doubt participant', 'Voted yes, doesn’t know the outcome, and must wait holding locks.'], ['Saga', 'A sequence of local transactions, each with a compensating action to undo it.']] },

  { id: 'consensus', part: 'agree', title: 'Consensus: FLP, Paxos, Raft', min: 18,
    objectives: ['State the properties of consensus', 'Explain FLP impossibility', 'Run Raft leader election and log replication'],
    predict: { q: 'A 5-node Raft cluster. How many nodes can crash with the cluster still accepting writes?', opts: ['1', '2', '3', '4'], a: 1,
      reveal: 'Writes need a majority, which is 3 of 5. So up to 2 nodes can fail. In general, 2f + 1 nodes tolerate f failures.' },
    practice: [
      { type: 'task', text: 'Crash the leader, then elect a new one.', check: () => W.rf && W.rf.electedAfterCrash },
      { type: 'task', text: 'Commit a write while at least one node is crashed.', check: () => W.rf && W.rf.committedWithDown },
      { type: 'task', text: 'Split the cluster, write to the old leader in the minority, then heal and watch that entry get <b>discarded</b>.', check: () => W.rf && W.rf.minorityDiscarded }
    ],
    quiz: [
      { q: 'FLP says that in a fully asynchronous system with one possible crash…', opts: ['Consensus is easy', 'No deterministic algorithm guarantees consensus will finish', 'Paxos is unsafe', 'You need 3 nodes'], a: 1, why: 'Safety can be kept. Termination can’t be guaranteed.' },
      { q: 'In Raft, an entry is committed when…', opts: ['The leader writes it', 'A majority of nodes have stored it', 'Every node has it', 'The client confirms it'], a: 1, why: 'Majority replication makes sure any future leader has it. Strictly, the leader counts replicas only for entries from its current term.' },
      { q: 'Why does Raft use randomized election timeouts?', opts: ['Security', 'To make split votes unlikely', 'To save power', 'For log compaction'], a: 1, why: 'Usually one node times out first and wins before the others start.' }
    ],
    explain: { prompt: 'Explain how Raft makes sure a new leader never loses committed entries.', model: 'An entry is committed only after a majority store it (the leader counts this for entries from its current term). A candidate needs votes from a majority, and nodes refuse to vote for a candidate whose log is less up to date than theirs. Any two majorities overlap, so at least one voter has every committed entry and blocks candidates that lack them.' },
    takeaways: ['Consensus: agreement, validity, termination.', 'FLP: you can’t guarantee termination with full asynchrony, so use timeouts.', 'Raft: terms, randomized elections, majority commit, log up-to-date check.'],
    cards: [['FLP impossibility', 'In an asynchronous system with even one crash, no deterministic consensus algorithm always terminates.'], ['Raft commit rule', 'An entry is committed once stored on a majority (in the leader’s current term).'], ['Nodes needed to tolerate f crashes', '2f + 1.']] },

  // ---------- TIME ----------
  { id: 'clocks', part: 'time', title: 'Clocks, causality & vector clocks', min: 15,
    objectives: ['Explain why physical clocks can’t order events', 'Compute Lamport and vector timestamps', 'Decide whether two events are causal or concurrent'],
    predict: { q: 'Event A has Lamport time 3 and event B has Lamport time 5. What can you conclude?', opts: ['A happened before B', 'B happened before A', 'Not B → A, but A may or may not have happened before B', 'They’re concurrent'], a: 2,
      reveal: 'Lamport clocks only guarantee that if a → b then L(a) < L(b). A smaller number doesn’t prove causality. Vector clocks fix that.' },
    practice: [
      { type: 'task', text: 'Find a pair of <b>concurrent</b> events in the diagram.', check: () => W.vc && W.vc.foundConcurrent },
      { type: 'task', text: 'Find two concurrent events whose <b>Lamport times differ</b>, so Lamport would suggest an order that doesn’t exist.', check: () => W.vc && W.vc.foundMislead },
      { type: 'task', text: 'Add a new message: send from one process and deliver it to another.', check: () => W.vc && W.vc.delivered },
      { type: 'num', text: 'A process’s Lamport clock is 3. It receives a message stamped 7. What’s its new Lamport time?', answer: 8, tol: 0, unit: '' }
    ],
    quiz: [
      { q: 'V(a) = [2,1,0] and V(b) = [1,2,0]. The events are…', opts: ['a → b', 'b → a', 'Concurrent', 'Identical'], a: 2, why: 'Neither vector is ≤ the other in every position.' },
      { q: 'Why is last-write-wins with wall clocks risky?', opts: ['Clocks drift and jump, so a "later" write may lose', 'It’s slow', 'It needs consensus', 'It’s unsafe for reads'], a: 0, why: 'A node with a fast clock wins every conflict.' },
      { q: 'Chandy-Lamport snapshots are used by…', opts: ['DNS', 'Flink checkpoints', 'TLS', 'B-trees'], a: 1, why: 'Marker messages record a consistent global state without pausing the system.' }
    ],
    explain: { prompt: 'Explain the difference between Lamport clocks and vector clocks.', model: 'A Lamport clock is a single counter. It respects causality (a → b means L(a) < L(b)) but can’t detect concurrency. A vector clock keeps a counter per process, so comparing vectors tells you exactly whether one event caused another or they were concurrent.' },
    takeaways: ['Physical clocks drift. Never assume they order events across machines.', 'Happened-before comes from process order plus messages.', 'Vector clocks detect concurrency, Lamport clocks don’t.'],
    cards: [['Happened-before (→)', 'Same process in order, or a send → its receive, or chained by transitivity.'], ['Lamport clock update on receive', 'L = max(L, msg) + 1.'], ['Vector clock comparison', 'a → b if V(a) ≤ V(b) everywhere and they differ. Otherwise, if neither holds, they’re concurrent.']] },

  // ---------- PRACTICE ----------
  { id: 'production', part: 'prac', title: 'Resilience patterns & failure modes', min: 14,
    objectives: ['Apply retries with backoff and jitter, circuit breakers and backpressure', 'Recognize split brain, zombie leaders and gray failures', 'Use leases with fencing tokens'],
    predict: { q: '1,000 clients fail at once and all retry after exactly 1 second. What happens at t = 1 s?', opts: ['A smooth recovery', 'A new spike of 1,000 requests that may knock the service over again', 'Nothing', 'The requests are cached'], a: 1,
      reveal: 'Synchronized retries create a "thundering herd". Exponential backoff with jitter spreads them out.' },
    practice: [
      { type: 'task', text: 'Pick the retry strategy with the <b>lowest peak</b> in the retry storm lab.', check: () => W.bo && W.bo.strategy === 'jitter' },
      { type: 'num', text: 'Exponential backoff starts at 100 ms and doubles each time. How long is the wait before the 5th retry, in ms?', answer: 1600, tol: 0, unit: 'ms' }
    ],
    quiz: [
      { q: 'A circuit breaker in the "open" state…', opts: ['Sends all traffic', 'Fails fast without calling the dependency', 'Restarts the service', 'Encrypts traffic'], a: 1, why: 'It lets the dependency recover, and after a cool-down it tries a few test requests.' },
      { q: 'Fencing tokens protect against…', opts: ['SQL injection', 'A paused old leader writing after its lease expired', 'Slow disks', 'DNS caching'], a: 1, why: 'Storage rejects writes with a lower token than the newest it has seen.' },
      { q: 'Backpressure means…', opts: ['Queuing everything forever', 'Signaling producers to slow down when consumers are overloaded', 'Compressing data', 'Retrying faster'], a: 1, why: 'Unbounded queues only hide overload until memory runs out.' }
    ],
    explain: { prompt: 'Describe how a retry storm happens and two ways to prevent it.', model: 'A blip makes many clients fail at once. If they retry on the same schedule, the retries arrive together and overload the recovering service, which fails again. Prevent it with exponential backoff plus jitter, retry budgets or circuit breakers, and load shedding on the server.' },
    takeaways: ['Retry with exponential backoff, jitter and a retry cap.', 'Circuit breakers, bulkheads and load shedding contain failures.', 'Leases need fencing tokens to be safe.'],
    cards: [['Full jitter', 'Wait a random time between 0 and the exponential backoff value.'], ['Circuit breaker states', 'Closed (normal), open (fail fast), half-open (testing recovery).'], ['Fencing token', 'A number that increases with each lease. Storage rejects writes with an older token.']] },

  { id: 'systems', part: 'prac', title: 'Case studies: real systems', min: 14,
    objectives: ['Place real systems on the CAP and PACELC map', 'Connect each system to the techniques in this course', 'Choose a store for a requirement'],
    predict: { q: 'Kubernetes stores all cluster state in etcd. What does that tell you about etcd during a partition?', opts: ['It’s AP', 'It’s CP, and the minority side stops accepting writes', 'It has no replicas', 'It uses last-write-wins'], a: 1,
      reveal: 'etcd uses Raft. Cluster state must never fork, so it gives up availability on the minority side.' },
    practice: [
      { type: 'task', text: 'Filter the table to systems that are <b>tunable</b>.', check: () => W.sys && W.sys.filter === 'Tunable' },
      { type: 'task', text: 'Pick the right store for every requirement.', check: () => matchOk('mt') }
    ],
    quiz: [
      { q: 'Kafka with acks=all and min.insync.replicas=2 behaves most like…', opts: ['AP', 'CP', 'No guarantees', 'A cache'], a: 1, why: 'Writes fail rather than land on too few replicas.' },
      { q: 'Spanner’s TrueTime lets it…', opts: ['Skip replication', 'Assign globally meaningful commit timestamps by waiting out clock uncertainty', 'Avoid Paxos', 'Use LWW safely everywhere'], a: 1, why: 'Waiting out the uncertainty gives external consistency.' },
      { q: 'How do Spark and Flink recover from task failures?', opts: ['Manual restarts', 'Re-running deterministic work from lineage or checkpoints', 'They don’t', 'Two-phase commit'], a: 1, why: 'Determinism plus lineage or checkpoints makes recomputing safe.' }
    ],
    explain: { prompt: 'Pick one system from the table and explain its CAP and PACELC choice in your own words.', model: 'Cassandra is PA/EL by default. It answers from any reachable replica during a partition and favors low latency otherwise, with LWW resolving conflicts. You can push it toward consistency per query with QUORUM reads and writes, at the cost of latency and availability.' },
    takeaways: ['Real systems mix techniques: consensus, quorums, sharding, logs.', 'Defaults are a starting point. Most systems can be tuned.', 'Choose by requirement: coordination, global SQL, offline sync, write throughput.'],
    cards: [['etcd / ZooKeeper', 'CP coordination stores built on Raft or ZAB consensus.'], ['Cassandra', 'Leaderless, PA/EL, consistency level chosen per query.'], ['Spanner', 'Paxos plus 2PC plus TrueTime, giving strictly serializable global transactions.']] },

  { id: 'sd-interview', part: 'prac', title: 'Design framework & estimation', min: 12,
    objectives: ['Follow a 7-step design process', 'Do back-of-envelope estimates quickly', 'Choose technology through explicit trade-offs'],
    predict: { q: '100 million daily users each make 10 requests a day. Roughly what’s the average QPS?', opts: ['About 1,000', 'About 12,000', 'About 100,000', 'About 1 million'], a: 1,
      reveal: '10⁹ requests ÷ ~10⁵ seconds ≈ 10⁴, or 11,574 exactly. Peak may be 2–5× that.' },
    practice: [
      { type: 'task', text: 'Configure a workload that needs <b>over 100,000 peak QPS</b> (reads and writes).', check: () => W.es && W.es.peak > 100000 },
      { type: 'num', text: '100M DAU × 10 requests a day. What’s the average QPS? (nearest thousand)', answer: 12000, tol: 600, unit: 'QPS' },
      { type: 'num', text: '1 million uploads a day, 2 MB each. How much storage per year, in TB?', answer: 730, tol: 40, unit: 'TB' }
    ],
    quiz: [
      { q: 'What should you do first in a design interview?', opts: ['Draw the database schema', 'Clarify requirements and scale', 'Pick Kubernetes', 'Write code'], a: 1, why: 'Requirements decide everything that follows.' },
      { q: 'A read-heavy system at 100:1 reads to writes most benefits from…', opts: ['Caching and read replicas', 'Write-back caches only', 'Two-phase commit', 'Fewer indexes'], a: 0, why: 'Scale the reads where the traffic actually is.' },
      { q: 'When choosing a technology, a strong argument is…', opts: ['It’s trending', 'It fits the access pattern and the team can operate it', 'It’s the newest', 'A famous company uses it'], a: 1, why: 'Fitting the access pattern and being able to run it matter more than popularity.' }
    ],
    explain: { prompt: 'Walk through how you’d begin designing a URL shortener.', model: 'Clarify: create and redirect, custom aliases?, scale of about 100M new URLs a month, reads 100× writes, low-latency redirects. Estimate: about 40 writes/s and 4k reads/s, roughly 500 bytes × 1.2B a year ≈ 600 GB. API: POST /urls, GET /{code}. Data: a key-value store from code to URL. Design: stateless app servers, a cache for hot codes, a CDN. Deep dives: ID generation, abuse, analytics through a queue.' },
    takeaways: ['Requirements, estimates, API, data, high-level design, deep dives, trade-offs.', '1M requests a day ≈ 12 QPS, and peak is several times the average.', 'Name what you gave up and why.'],
    cards: [['Seconds per day', '86,400, roughly 10⁵.'], ['1 million requests per day', 'About 12 requests per second.'], ['Design steps', 'Requirements, estimates, API, data model, high-level design, deep dives, trade-offs.']] },

  // ---------- CONSOLIDATE ----------
  { id: 'review', part: 'consol', title: 'Spaced review', min: 5, special: 'review' },
  { id: 'exam', part: 'consol', title: 'Final exam', min: 20, special: 'exam' }
];

// ---------- generic sorters (classification labs) ----------
const SORTERS = {
  sl: { cats: ['Safety', 'Liveness'], items: [
    ['Two nodes never both believe they are the leader.', 0],
    ['Every request eventually receives a response.', 1],
    ['A committed write is never lost.', 0],
    ['If the network heals, a new leader is eventually elected.', 1],
    ['A read never returns a value that was never written.', 0],
    ['Every message sent is eventually delivered.', 1],
    ['A bank balance never goes below zero.', 0],
    ['A crashed node eventually rejoins the cluster.', 1]] },
  dx: { cats: ['Crash-stop', 'Crash-recovery', 'Omission', 'Byzantine'], items: [
    ['A VM is permanently deleted by the cloud provider.', 0],
    ['A server reboots after a kernel panic and replays its write-ahead log.', 1],
    ['A faulty switch silently drops 5% of packets.', 2],
    ['A disk returns corrupted data that passes as valid.', 3],
    ['A process is OOM-killed, then restarted by systemd with empty memory.', 1],
    ['A compromised node sends different votes to different peers.', 3]] },
  rq: { cats: ['Functional', 'Non-functional'], items: [
    ['Users can upload a profile photo.', 0],
    ['The feed loads in under 200 ms at p99.', 1],
    ['Admins can ban accounts.', 0],
    ['The service is available 99.95% of the time.', 1],
    ['Users get an email receipt after purchase.', 0],
    ['Confirmed payments are never lost.', 1],
    ['The system handles 50,000 requests per second at peak.', 1],
    ['Users can search products by name.', 0]] },
  cia: { cats: ['Confidentiality', 'Integrity', 'Availability'], items: [
    ['Encrypting the database at rest', 0],
    ['Signing software releases', 1],
    ['DDoS protection at the CDN', 2],
    ['Masking card numbers in logs', 0],
    ['Checksums on stored files', 1],
    ['Multi-region failover', 2],
    ['TLS for traffic between services', 0],
    ['An append-only audit log', 1]] },
  hj: { cats: ['Linearizable', 'Not linearizable'], items: [
    ['C1: write x=1  [0 ─── 10]\nC2:                    read x → 0  [20 ─ 25]', 1],
    ['C1: write x=1  [0 ──────────── 30]\nC2:        read x → 1  [10 ─ 15]', 0],
    ['C1: write x=1  [0 ──────────── 30]\nC2:      read x → 1  [8 ─ 12]\nC3:            read x → 0  [18 ─ 22]', 1],
    ['C1: write x=1  [0 ──────────── 30]\nC2:      read x → 0  [8 ─ 12]\nC3:            read x → 1  [18 ─ 22]', 0]],
    why: ['The write finished at 10 and the read started at 20, so the read must see 1.', 'The read overlaps the write, so the write can take effect at 10 ms, before the read.', 'Once C2 saw 1, any read that starts later must also see 1. C3 went back in time.', 'The write can take effect between 12 and 18 ms, so both reads make sense.'], mono: true }
};

// ---------- generic matchers ----------
const MATCHERS = {
  api: { opts: ['REST', 'GraphQL', 'gRPC', 'WebSockets', 'UDP'], items: [
    ['A public API for third-party developers, with cacheable resources', 'REST'],
    ['A mobile app needs different fields on every screen', 'GraphQL'],
    ['High-throughput internal service calls with streaming', 'gRPC'],
    ['Browser live chat where the server pushes new messages', 'WebSockets'],
    ['Voice call audio, where a late packet is useless', 'UDP']] },
  db: { opts: ['Relational (PostgreSQL)', 'Key-value (Redis)', 'Document (MongoDB)', 'Wide-column (Cassandra)', 'Graph (Neo4j)', 'NewSQL (Spanner)', 'Object storage (S3)'], items: [
    ['A bank ledger with multi-row transactions', 'Relational (PostgreSQL)'],
    ['Session lookup by ID in under a millisecond', 'Key-value (Redis)'],
    ['A product catalog where each item has different attributes', 'Document (MongoDB)'],
    ['Billions of sensor writes per day', 'Wide-column (Cassandra)'],
    ['"Friends of friends" recommendations', 'Graph (Neo4j)'],
    ['Relational data with ACID transactions across continents', 'NewSQL (Spanner)'],
    ['User-uploaded videos', 'Object storage (S3)']] },
  sc: { opts: ['Cache', 'Queue', 'Replicate', 'Shard'], items: [
    ['Product pages are read 1,000× more often than they change', 'Cache'],
    ['Video uploads need minutes of transcoding', 'Queue'],
    ['Reads overload the primary, and data must survive a machine loss', 'Replicate'],
    ['Write volume exceeds the largest machine you can buy', 'Shard'],
    ['A flash sale brings 50× normal order traffic for 10 minutes', 'Queue'],
    ['Users worldwide wait 300 ms for the same static images', 'Cache']] },
  th: { opts: ['Parameterized queries', 'Output encoding + CSP', 'SameSite cookies + CSRF tokens', 'Rate limiting + CDN', 'MFA + login rate limits', 'Authorization check per object', 'Secrets manager'], items: [
    ['SQL injection', 'Parameterized queries'],
    ['Cross-site scripting (XSS)', 'Output encoding + CSP'],
    ['Cross-site request forgery (CSRF)', 'SameSite cookies + CSRF tokens'],
    ['DDoS flood', 'Rate limiting + CDN'],
    ['Credential stuffing', 'MFA + login rate limits'],
    ['Changing /invoices/123 to /124 reveals another user’s data', 'Authorization check per object'],
    ['An API key committed to a public repo', 'Secrets manager']] },
  mt: { opts: ['etcd', 'CouchDB', 'Spanner', 'Cassandra', 'Kafka', 'Redis'], items: [
    ['Kubernetes cluster state that must never fork', 'etcd'],
    ['Offline-first sync between phones and a server', 'CouchDB'],
    ['Global SQL with externally consistent transactions', 'Spanner'],
    ['Huge write throughput, tunable consistency per query', 'Cassandra'],
    ['A durable, replayable event log between services', 'Kafka'],
    ['A low-latency cache where losing a few writes is acceptable', 'Redis']] }
};

// ---------- exam scenarios (CAP) ----------
const SCENARIOS = [
  { cat: 'Money', q: 'A bank’s core ledger must never let an account go below zero. Its two data centers lose contact and a customer submits a large transfer.', a: 'CP', why: 'If both sides keep accepting transfers, the same money can be spent twice. (ATMs often choose bounded-risk AP instead: small offline withdrawals up to a limit, reconciled later.)' },
  { cat: 'Commerce', q: 'An online store keeps each shopper’s cart on several replicas. A partition hits during a sale.', a: 'AP', why: 'Dynamo’s choice: never reject "add to cart", and merge diverged carts later.' },
  { cat: 'Coordination', q: 'A distributed lock makes sure only one worker runs the nightly billing job.', a: 'CP', why: 'Two lock holders means double billing. That’s why lock services are CP.' },
  { cat: 'Social', q: 'A social network counts likes on a viral post across regions.', a: 'AP', why: 'A briefly inaccurate count harms no one. CRDT counters merge cleanly.' },
  { cat: 'Commerce', q: 'A ticketing site sells assigned concert seats.', a: 'CP', why: 'Selling seat 14F twice creates a real-world conflict at the door.' },
  { cat: 'Infrastructure', q: 'DNS resolvers answer "what IP is example.com?"', a: 'AP', why: 'Answers come from cache. Freshness is governed by TTL.' },
  { cat: 'Identity', q: 'Sign-up must guarantee that usernames are unique across regions.', a: 'CP', why: 'Uniqueness is a global constraint with no clean merge.' },
  { cat: 'Collaboration', q: 'A notes app must work in airplane mode and sync later.', a: 'AP', why: 'For offline-first apps a partition is normal. Merge with CRDTs.' },
  { cat: 'Coordination', q: 'A database cluster elects its primary.', a: 'CP', why: 'Two primaries is split brain. Use majority quorums.' },
  { cat: 'Telemetry', q: 'Millions of IoT sensors send readings every few seconds.', a: 'AP', why: 'A refused reading is lost forever. Late or out-of-order data is fine.' },
  { cat: 'Social', q: 'A group chat shows messages across regions.', a: 'AP', why: 'Stay available and keep causal order so replies follow their messages.' },
  { cat: 'Infrastructure', q: 'Kubernetes stores which pods should run where.', a: 'CP', why: 'Conflicting views could double-schedule or delete workloads, so it uses etcd.' },
  { cat: 'Commerce', q: 'A product page shows descriptions and reviews.', a: 'AP', why: 'Slightly stale content is harmless, and an error page loses the sale.' },
  { cat: 'Money', q: 'Invoice numbers must be gapless and strictly increasing, by law.', a: 'CP', why: 'A single sequence needs coordination, so it pauses rather than diverges.' },
  { cat: 'Commerce', q: 'A warehouse has 3 units left and orders come from every region.', a: 'CP', why: 'Overselling cancels paid orders, unless you deliberately choose to apologize instead.' },
  { cat: 'Identity', q: 'Login session data is looked up on every page.', a: 'AP', why: 'Refusing the lookup logs everyone out. Handle revocation with short-lived tokens.' }
];
