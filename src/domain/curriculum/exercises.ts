import type { MatcherId, SorterId } from './ids';
import type { Rich } from './types';

// Classification (sorter) and matching exercises, plus the CAP scenarios for the final exam.

export interface SorterItem { readonly text: Rich; readonly answer: number; readonly why?: Rich }
export interface SorterConfig { readonly cats: readonly string[]; readonly items: readonly SorterItem[]; readonly mono?: boolean }
export interface MatcherItem { readonly text: Rich; readonly answer: string }
export interface MatcherConfig { readonly opts: readonly string[]; readonly items: readonly MatcherItem[] }
export type CapChoice = 'CP' | 'AP';
export interface Scenario { readonly cat: string; readonly q: Rich; readonly a: CapChoice; readonly why: Rich }

export const SORTERS: Readonly<Record<SorterId, SorterConfig>> = {
  "sl": {
    "cats": [
      "Safety",
      "Liveness"
    ],
    "items": [
      {
        "text": "Two nodes never both believe they are the leader.",
        "answer": 0
      },
      {
        "text": "Every request eventually receives a response.",
        "answer": 1
      },
      {
        "text": "A committed write is never lost.",
        "answer": 0
      },
      {
        "text": "If the network heals, a new leader is eventually elected.",
        "answer": 1
      },
      {
        "text": "A read never returns a value that was never written.",
        "answer": 0
      },
      {
        "text": "Every message sent is eventually delivered.",
        "answer": 1
      },
      {
        "text": "A bank balance never goes below zero.",
        "answer": 0
      },
      {
        "text": "A crashed node eventually rejoins the cluster.",
        "answer": 1
      },
      {
        "text": "Two replicas never apply the same committed writes in a different order.",
        "answer": 0
      },
      {
        "text": "A transaction that has started eventually commits or aborts.",
        "answer": 1
      },
      {
        "text": "A payment is never debited twice for the same request.",
        "answer": 0
      },
      {
        "text": "A failed node is eventually suspected by every healthy node.",
        "answer": 1
      }
    ]
  },
  "dx": {
    "cats": [
      "Crash-stop",
      "Crash-recovery",
      "Omission",
      "Byzantine"
    ],
    "items": [
      {
        "text": "A VM is permanently deleted by the cloud provider.",
        "answer": 0
      },
      {
        "text": "A server reboots after a kernel panic and replays its write-ahead log.",
        "answer": 1
      },
      {
        "text": "A faulty switch silently drops 5% of packets.",
        "answer": 2
      },
      {
        "text": "A disk returns corrupted data that passes as valid.",
        "answer": 3
      },
      {
        "text": "A process is OOM-killed, then restarted by systemd with empty memory.",
        "answer": 1
      },
      {
        "text": "A compromised node sends different votes to different peers.",
        "answer": 3
      },
      {
        "text": "A switch port flaps for three seconds. Packets sent then never arrive, though both servers keep running.",
        "answer": 2,
        "why": "Both machines are alive. Only some messages are lost."
      },
      {
        "text": "A node reboots, but the last two seconds of acknowledged writes were only in its disk cache and are gone.",
        "answer": 1,
        "why": "The node comes back after a crash, and it lost state that was never made durable."
      },
      {
        "text": "A flipped memory bit makes a node vote for a term number that never existed.",
        "answer": 3,
        "why": "The node keeps running but sends arbitrary, wrong data."
      },
      {
        "text": "A failed server is never repaired. The operator removes it from the cluster for good.",
        "answer": 0,
        "why": "It halted and never returned."
      }
    ]
  },
  "rq": {
    "cats": [
      "Functional",
      "Non-functional"
    ],
    "items": [
      {
        "text": "Users can upload a profile photo.",
        "answer": 0
      },
      {
        "text": "The feed loads in under 200 ms at p99.",
        "answer": 1
      },
      {
        "text": "Admins can ban accounts.",
        "answer": 0
      },
      {
        "text": "The service is available 99.95% of the time.",
        "answer": 1
      },
      {
        "text": "Users get an email receipt after purchase.",
        "answer": 0
      },
      {
        "text": "Confirmed payments are never lost.",
        "answer": 1
      },
      {
        "text": "The system handles 50,000 requests per second at peak.",
        "answer": 1
      },
      {
        "text": "Users can search products by name.",
        "answer": 0
      },
      {
        "text": "Users can reset their password by email.",
        "answer": 0
      },
      {
        "text": "A confirmed upload survives the loss of a whole datacenter.",
        "answer": 1
      },
      {
        "text": "Pages become interactive within 2 seconds on a mobile connection.",
        "answer": 1
      },
      {
        "text": "Users can follow other accounts.",
        "answer": 0
      }
    ]
  },
  "cia": {
    "cats": [
      "Confidentiality",
      "Integrity",
      "Availability"
    ],
    "items": [
      {
        "text": "Encrypting the database at rest",
        "answer": 0
      },
      {
        "text": "Signing software releases",
        "answer": 1
      },
      {
        "text": "DDoS protection at the CDN",
        "answer": 2
      },
      {
        "text": "Masking card numbers in logs",
        "answer": 0
      },
      {
        "text": "Checksums on stored files",
        "answer": 1
      },
      {
        "text": "Multi-region failover",
        "answer": 2
      },
      {
        "text": "TLS for traffic between services",
        "answer": 0
      },
      {
        "text": "An append-only audit log",
        "answer": 1
      },
      {
        "text": "Hashing downloaded files and comparing to a published digest",
        "answer": 1
      },
      {
        "text": "Per-client rate limits that stop one caller from exhausting the service",
        "answer": 2
      },
      {
        "text": "Field-level encryption of national ID numbers",
        "answer": 0
      },
      {
        "text": "Read replicas in a second availability zone",
        "answer": 2
      },
      {
        "text": "Message authentication codes (HMAC) on webhook payloads",
        "answer": 1
      },
      {
        "text": "Least-privilege roles for analysts querying production",
        "answer": 0
      }
    ]
  },
  "hj": {
    "cats": [
      "Linearizable",
      "Not linearizable"
    ],
    "items": [
      {
        "text": "C1: write x=1  [0 ─── 10]\nC2:                    read x → 0  [20 ─ 25]",
        "answer": 1,
        "why": "The write finished at 10 and the read started at 20, so the read must see 1."
      },
      {
        "text": "C1: write x=1  [0 ──────────── 30]\nC2:        read x → 1  [10 ─ 15]",
        "answer": 0,
        "why": "The read overlaps the write, so the write can take effect at 10 ms, before the read."
      },
      {
        "text": "C1: write x=1  [0 ──────────── 30]\nC2:      read x → 1  [8 ─ 12]\nC3:            read x → 0  [18 ─ 22]",
        "answer": 1,
        "why": "Once C2 saw 1, any read that starts later must also see 1. C3 went back in time."
      },
      {
        "text": "C1: write x=1  [0 ──────────── 30]\nC2:      read x → 0  [8 ─ 12]\nC3:            read x → 1  [18 ─ 22]",
        "answer": 0,
        "why": "The write can take effect between 12 and 18 ms, so both reads make sense."
      },
      {
        "text": "C1: write x=1  [0 ─ 10]\nC2: write x=2           [20 ─ 30]\nC3: read x → 1                       [40 ─ 45]",
        "answer": 1,
        "why": "Write x=2 was confirmed at 30 ms, before the read started at 40 ms, and it was the last write. The read must return 2."
      },
      {
        "text": "C1: write x=1  [0 ─────────── 30]\nC2: write x=2  [5 ─────────── 35]\nC3: read x → 1                       [40 ─ 45]",
        "answer": 0,
        "why": "The two writes overlap, so either order is allowed. Order write 2 first and write 1 second, and the later read correctly sees 1."
      },
      {
        "text": "C1: write x=1  [0 ─────────── 30]\nC2: write x=2  [5 ─────────── 35]\nC3: read x → 2          [40 ─ 45]\nC4: read x → 1                       [50 ─ 55]",
        "answer": 1,
        "why": "Reading 2 and then, later, reading 1 needs write 2 to come before write 1, but then the first read would see 1. Both writes are done before 40 ms, so the value can't flip back."
      },
      {
        "text": "C1: write x=1  [0 ─────────────── 40]\nC2: read x → 1  [5 ──── 20]\nC3: read x → 0      [10 ──── 25]",
        "answer": 0,
        "why": "The reads overlap each other and the write. Put C3 at 10 ms (before the write), the write at 12 ms, and C2 at 15 ms (after it)."
      },
      {
        "text": "C1: write x=1  [0 ─ 10]\nC2: read x → 2            [20 ─ 25]",
        "answer": 1,
        "why": "No operation ever wrote 2, so no single-copy history can explain this read. Linearizability allows only values that were written."
      },
      {
        "text": "C2: read x → 0  [0 ─ 5]\nC1: write x=1           [10 ─ 20]\nC3: read x → 1                     [30 ─ 35]",
        "answer": 0,
        "why": "The first read ends before the write starts, so it sees the initial 0. The last read starts after the write is confirmed, so it sees 1."
      }
    ],
    "mono": true
  }
};

export const MATCHERS: Readonly<Record<MatcherId, MatcherConfig>> = {
  "api": {
    "opts": [
      "REST",
      "GraphQL",
      "gRPC",
      "WebSockets",
      "UDP"
    ],
    "items": [
      {
        "text": "A public API for third-party developers, with cacheable resources",
        "answer": "REST"
      },
      {
        "text": "A mobile app needs different fields on every screen",
        "answer": "GraphQL"
      },
      {
        "text": "High-throughput internal service calls with streaming",
        "answer": "gRPC"
      },
      {
        "text": "Browser live chat where the server pushes new messages",
        "answer": "WebSockets"
      },
      {
        "text": "Voice call audio, where a late packet is useless",
        "answer": "UDP"
      },
      {
        "text": "Live price ticks pushed from the server to an open browser dashboard",
        "answer": "WebSockets"
      },
      {
        "text": "Real-time game position updates, where only the newest one matters",
        "answer": "UDP"
      },
      {
        "text": "Internal services that want generated, strongly typed clients over HTTP/2",
        "answer": "gRPC"
      },
      {
        "text": "Several different clients, each needing a different slice of the same data, from one endpoint",
        "answer": "GraphQL"
      }
    ]
  },
  "db": {
    "opts": [
      "Relational (PostgreSQL)",
      "Key-value (Redis)",
      "Document (MongoDB)",
      "Wide-column (Cassandra)",
      "Graph (Neo4j)",
      "NewSQL (Spanner)",
      "Object storage (S3)"
    ],
    "items": [
      {
        "text": "A bank ledger with multi-row transactions",
        "answer": "Relational (PostgreSQL)"
      },
      {
        "text": "Session lookup by ID in under a millisecond",
        "answer": "Key-value (Redis)"
      },
      {
        "text": "A product catalog where each item has different attributes",
        "answer": "Document (MongoDB)"
      },
      {
        "text": "Billions of sensor writes per day",
        "answer": "Wide-column (Cassandra)"
      },
      {
        "text": "\"Friends of friends\" recommendations",
        "answer": "Graph (Neo4j)"
      },
      {
        "text": "Relational data with ACID transactions across continents",
        "answer": "NewSQL (Spanner)"
      },
      {
        "text": "User-uploaded videos",
        "answer": "Object storage (S3)"
      },
      {
        "text": "Nightly database backups, kept for years",
        "answer": "Object storage (S3)"
      },
      {
        "text": "Customers, orders and invoices linked by foreign keys, with ad hoc joins",
        "answer": "Relational (PostgreSQL)"
      },
      {
        "text": "A real-time leaderboard of the top scores",
        "answer": "Key-value (Redis)"
      },
      {
        "text": "Shortest connection path between two people in a social network",
        "answer": "Graph (Neo4j)"
      }
    ]
  },
  "sc": {
    "opts": [
      "Cache",
      "Queue",
      "Replicate",
      "Shard"
    ],
    "items": [
      {
        "text": "Product pages are read 1,000× more often than they change",
        "answer": "Cache"
      },
      {
        "text": "Video uploads need minutes of transcoding",
        "answer": "Queue"
      },
      {
        "text": "Reads overload the primary, and data must survive a machine loss",
        "answer": "Replicate"
      },
      {
        "text": "Write volume exceeds the largest machine you can buy",
        "answer": "Shard"
      },
      {
        "text": "A flash sale brings 50× normal order traffic for 10 minutes",
        "answer": "Queue"
      },
      {
        "text": "Users worldwide wait 300 ms for the same static images",
        "answer": "Cache"
      },
      {
        "text": "Traffic is read-heavy and a hot item is requested by millions of users, so recompute is wasteful",
        "answer": "Cache"
      },
      {
        "text": "Emails must be sent after checkout without slowing the response",
        "answer": "Queue"
      },
      {
        "text": "A single table of 20 TB must be spread over many machines, split by user id",
        "answer": "Shard"
      },
      {
        "text": "The primary is fine for writes, but dashboards on it slow user queries",
        "answer": "Replicate"
      },
      {
        "text": "Downstream service handles 100 jobs/s, while bursts reach 5,000 jobs/s",
        "answer": "Queue"
      }
    ]
  },
  "th": {
    "opts": [
      "Parameterized queries",
      "Output encoding + CSP",
      "SameSite cookies + CSRF tokens",
      "Rate limiting + CDN",
      "MFA + login rate limits",
      "Authorization check per object",
      "Secrets manager"
    ],
    "items": [
      {
        "text": "SQL injection",
        "answer": "Parameterized queries"
      },
      {
        "text": "Cross-site scripting (XSS)",
        "answer": "Output encoding + CSP"
      },
      {
        "text": "Cross-site request forgery (CSRF)",
        "answer": "SameSite cookies + CSRF tokens"
      },
      {
        "text": "DDoS flood",
        "answer": "Rate limiting + CDN"
      },
      {
        "text": "Credential stuffing",
        "answer": "MFA + login rate limits"
      },
      {
        "text": "Changing /invoices/123 to /124 reveals another user’s data",
        "answer": "Authorization check per object"
      },
      {
        "text": "An API key committed to a public repo",
        "answer": "Secrets manager"
      },
      {
        "text": "Brute-forcing a six-digit one-time code",
        "answer": "MFA + login rate limits"
      },
      {
        "text": "A forum comment containing a script tag runs in other users’ browsers",
        "answer": "Output encoding + CSP"
      },
      {
        "text": "A malicious site makes the victim’s browser submit a transfer form to the bank",
        "answer": "SameSite cookies + CSRF tokens"
      },
      {
        "text": "A search box builds SQL by string concatenation",
        "answer": "Parameterized queries"
      },
      {
        "text": "A botnet sends millions of requests per second at the login page",
        "answer": "Rate limiting + CDN"
      }
    ]
  },
  "mt": {
    "opts": [
      "etcd",
      "CouchDB",
      "Spanner",
      "Cassandra",
      "Kafka",
      "Redis"
    ],
    "items": [
      {
        "text": "Kubernetes cluster state that must never fork",
        "answer": "etcd"
      },
      {
        "text": "Offline-first sync between phones and a server",
        "answer": "CouchDB"
      },
      {
        "text": "Global SQL with externally consistent transactions",
        "answer": "Spanner"
      },
      {
        "text": "Huge write throughput, tunable consistency per query",
        "answer": "Cassandra"
      },
      {
        "text": "A durable, replayable event log between services",
        "answer": "Kafka"
      },
      {
        "text": "A low-latency cache where losing a few writes is acceptable",
        "answer": "Redis"
      },
      {
        "text": "Leader election and distributed locks for a fleet of microservices",
        "answer": "etcd"
      },
      {
        "text": "A mobile notes app whose devices stay offline for days, then merge their edits",
        "answer": "CouchDB"
      },
      {
        "text": "A worldwide ledger that needs strictly serializable transactions across continents",
        "answer": "Spanner"
      },
      {
        "text": "Sensor ingest at millions of writes per second that must stay writable in every region",
        "answer": "Cassandra"
      },
      {
        "text": "A stream retained for a week so a new consumer can replay it from the start",
        "answer": "Kafka"
      },
      {
        "text": "A leaderboard or session store that can be rebuilt from the primary database",
        "answer": "Redis"
      }
    ]
  }
};

export const SCENARIOS: readonly Scenario[] = [
  {
    "cat": "Money",
    "q": "A bank’s core ledger must never let an account go below zero. Its two data centers lose contact and a customer submits a large transfer.",
    "a": "CP",
    "why": "If both sides keep accepting transfers, the same money can be spent twice. (ATMs often choose bounded-risk AP instead: small offline withdrawals up to a limit, reconciled later.)"
  },
  {
    "cat": "Commerce",
    "q": "An online store keeps each shopper’s cart on several replicas. A partition hits during a sale.",
    "a": "AP",
    "why": "Dynamo’s choice: never reject \"add to cart\", and merge diverged carts later."
  },
  {
    "cat": "Coordination",
    "q": "A distributed lock makes sure only one worker runs the nightly billing job.",
    "a": "CP",
    "why": "Two lock holders means double billing. That’s why lock services are CP."
  },
  {
    "cat": "Social",
    "q": "A social network counts likes on a viral post across regions.",
    "a": "AP",
    "why": "A briefly inaccurate count harms no one. CRDT counters merge cleanly."
  },
  {
    "cat": "Commerce",
    "q": "A ticketing site sells assigned concert seats.",
    "a": "CP",
    "why": "Selling seat 14F twice creates a real-world conflict at the door."
  },
  {
    "cat": "Infrastructure",
    "q": "DNS resolvers answer \"what IP is example.com?\"",
    "a": "AP",
    "why": "Answers come from cache. Freshness is governed by TTL."
  },
  {
    "cat": "Identity",
    "q": "Sign-up must guarantee that usernames are unique across regions.",
    "a": "CP",
    "why": "Uniqueness is a global constraint with no clean merge."
  },
  {
    "cat": "Collaboration",
    "q": "A notes app must work in airplane mode and sync later.",
    "a": "AP",
    "why": "For offline-first apps a partition is normal. Merge with CRDTs."
  },
  {
    "cat": "Coordination",
    "q": "A database cluster elects its primary.",
    "a": "CP",
    "why": "Two primaries is split brain. Use majority quorums."
  },
  {
    "cat": "Telemetry",
    "q": "Millions of IoT sensors send readings every few seconds.",
    "a": "AP",
    "why": "A refused reading is lost forever. Late or out-of-order data is fine."
  },
  {
    "cat": "Social",
    "q": "A group chat shows messages across regions.",
    "a": "AP",
    "why": "Stay available and keep causal order so replies follow their messages."
  },
  {
    "cat": "Infrastructure",
    "q": "Kubernetes stores which pods should run where.",
    "a": "CP",
    "why": "Conflicting views could double-schedule or delete workloads, so it uses etcd."
  },
  {
    "cat": "Commerce",
    "q": "A product page shows descriptions and reviews.",
    "a": "AP",
    "why": "Slightly stale content is harmless, and an error page loses the sale."
  },
  {
    "cat": "Money",
    "q": "Invoice numbers must be gapless and strictly increasing, by law.",
    "a": "CP",
    "why": "A single sequence needs coordination, so it pauses rather than diverges."
  },
  {
    "cat": "Commerce",
    "q": "A warehouse has 3 units left and orders come from every region.",
    "a": "CP",
    "why": "Overselling cancels paid orders, unless you deliberately choose to apologize instead."
  },
  {
    "cat": "Identity",
    "q": "Login session data is looked up on every page.",
    "a": "AP",
    "why": "Refusing the lookup logs everyone out. Handle revocation with short-lived tokens."
  }
];
