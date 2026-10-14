// Pure model of the architecture explorer: a fixed diagram of components and the set the learner visited.

export const ARCH_IDS = ['dns', 'clients', 'cdn', 'lb', 'app', 'cache', 'db', 'replica', 'queue', 'workers', 'blob'] as const;
export type ArchId = (typeof ARCH_IDS)[number];

export interface ArchComponent { readonly x: number; readonly y: number; readonly n: string; readonly role: string; readonly fail: string }

export const ARCH: Readonly<Record<ArchId, ArchComponent>> = {
  dns: { x: 20, y: 30, n: 'DNS', role: 'Turns app.example.com into IP addresses, often returning the nearest region or edge.', fail: 'Nobody can find your service, even if everything behind it is healthy. Use multiple providers and sensible TTLs.' },
  clients: { x: 20, y: 143, n: 'Clients', role: 'Browsers and mobile apps. They retry, cache and render, and their behavior shapes backend load.', fail: 'Bad client retry logic can cause a retry storm. Clients need backoff and jitter.' },
  cdn: { x: 150, y: 30, n: 'CDN', role: 'Edge caches near users serve static files and video segments, so traffic never reaches your servers.', fail: 'Every request falls back to the origin, which usually can’t handle the full load. Plan origin shielding.' },
  lb: { x: 150, y: 143, n: 'Load balancer', role: 'Spreads requests across healthy app servers and terminates TLS. Layer 4 or layer 7.', fail: 'A single load balancer is a single point of failure. Run redundant pairs or a managed, multi-zone balancer.' },
  app: { x: 290, y: 143, n: 'App servers', role: 'Stateless business logic. Scale out by adding instances behind the load balancer.', fail: 'Lose one and the load balancer routes around it. Lose capacity and latency climbs, so autoscale with headroom.' },
  cache: { x: 430, y: 40, n: 'Cache', role: 'In-memory store like Redis or Memcached for hot reads. Takes most of the read load off the database.', fail: 'The database suddenly takes 10–100× more reads, which can cascade. Warm caches, limit load, and degrade gracefully.' },
  db: { x: 430, y: 143, n: 'DB primary', role: 'The source of truth for writes. ACID transactions live here.', fail: 'Writes stop until failover. With async replicas, recent writes may be lost.' },
  replica: { x: 570, y: 143, n: 'Read replica', role: 'Copies of the primary for read scaling and failover.', fail: 'Read capacity drops, and replication lag means reads can be stale.' },
  queue: { x: 430, y: 250, n: 'Queue', role: 'A durable buffer (Kafka, SQS) for async work such as emails, transcoding and analytics.', fail: 'Producers back up or drop work. Monitor lag, and make consumers idempotent.' },
  workers: { x: 570, y: 250, n: 'Workers', role: 'Background consumers that process queued jobs at their own pace.', fail: 'The queue grows, but users aren’t blocked. That’s the point of going async.' },
  blob: { x: 290, y: 250, n: 'Object storage', role: 'S3 or GCS for images, video and backups. Very durable and cheap per GB.', fail: 'Uploads and media fail. Rare, but use cross-region replication for critical data.' },
};

export const EDGES: readonly (readonly [ArchId, ArchId])[] = [
  ['clients', 'dns'], ['clients', 'cdn'], ['clients', 'lb'], ['cdn', 'blob'], ['lb', 'app'], ['app', 'cache'],
  ['app', 'db'], ['db', 'replica'], ['app', 'queue'], ['queue', 'workers'], ['workers', 'blob'], ['app', 'blob'],
];

export const BOX_W = 100, BOX_H = 44;
export const center = (k: ArchId): readonly [number, number] => [ARCH[k].x + BOX_W / 2, ARCH[k].y + BOX_H / 2];

export interface ArchState { readonly selected: ArchId | null; readonly visited: readonly ArchId[]; readonly down: readonly ArchId[] }
export const initialArch: ArchState = { selected: null, visited: [], down: [] };

/** Select a component and remember that it was explored (in diagram order). */
export const pick = (s: ArchState, k: ArchId): ArchState =>
  ({ ...s, selected: k, visited: s.visited.includes(k) ? s.visited : ARCH_IDS.filter(id => id === k || s.visited.includes(id)) });

/** Clients are not infrastructure you operate, so only the other components can be failed. */
export const canFail = (k: ArchId): boolean => k !== 'clients';

/** Fail a component, or bring it back if it is already down (in diagram order). */
export const toggleDown = (s: ArchState, k: ArchId): ArchState => {
  if (!canFail(k)) return s;
  const wasDown = s.down.includes(k);
  return { ...s, down: ARCH_IDS.filter(id => (id === k ? !wasDown : s.down.includes(id))) };
};

export const restoreAll = (s: ArchState): ArchState => ({ ...s, down: [] });

export interface Capabilities {
  /** Pages load: DNS, LB and an app server, plus one of cache, replica or primary to read from. */
  readonly reads: boolean;
  /** Writes commit: DNS, LB, app server and the primary. */
  readonly writes: boolean;
  /** Media plays: the CDN (serving cached segments), or the app path to object storage as a fallback. */
  readonly media: boolean;
  /** Background jobs complete: a request reaches the app, which enqueues, and workers drain the queue. */
  readonly jobs: boolean;
}

export const capabilities = (down: readonly ArchId[]): Capabilities => {
  const up = (k: ArchId): boolean => !down.includes(k);
  const front = up('dns') && up('lb') && up('app');
  return {
    reads: front && (up('cache') || up('replica') || up('db')),
    writes: front && up('db'),
    media: up('dns') && (up('cdn') || (up('blob') && up('lb') && up('app'))),
    jobs: front && up('queue') && up('workers'),
  };
};
