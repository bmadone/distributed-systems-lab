import { QuadtreeLab } from '../labs/quadtree/QuadtreeLab';
import { Matcher } from '../ui/Exercises';
import { Prose } from '../ui/primitives';

const SdStorageBody = () => (
  <>
    <Prose>
      <h3>Storage types</h3>
      <ul>
        <li><b>Block storage</b> provides raw volumes, like Amazon EBS or a local SSD. It&apos;s low latency, and databases run on it.</li>
        <li><b>File storage</b> is a shared hierarchical filesystem, like NFS or EFS, for workloads that expect files and folders.</li>
        <li><b>Object storage</b> holds immutable objects under flat keys behind an HTTP API, like S3 or GCS. It scales almost without limit and is designed for 99.999999999% durability. Use it for media, backups and data lakes.</li>
      </ul>
      <h3>SQL, NoSQL and NewSQL</h3>
      <p><b>Relational (SQL)</b> databases offer schemas, joins and ACID transactions, like PostgreSQL and MySQL. <b>NoSQL</b> comes in families tuned for specific access patterns: key-value (Redis, DynamoDB), document (MongoDB), wide-column (Cassandra) and graph (Neo4j). Many favor <b>BASE</b> (Basically Available, Soft state, Eventually consistent) over ACID. <b>NewSQL</b> databases (Spanner, CockroachDB, TiDB) keep SQL and ACID while scaling horizontally with consensus.</p>
      <h3>Indexes</h3>
      <p>An index trades write speed and space for read speed. <b>B-trees</b> update pages in place, are read-optimized and handle range queries well. They&apos;re the default in relational databases. <b>LSM trees</b> buffer writes in memory, flush sorted files and merge them in the background, which makes them write-optimized (Cassandra, RocksDB). A composite index on (a, b) helps queries that filter on a, or on a and b, but not on b alone. Use <code>EXPLAIN</code> to check whether the query plan actually uses your index.</p>
      <h3>Spatial indexes</h3>
      <p>&quot;Find drivers near me&quot; needs 2D lookups. A <b>quadtree</b> splits a region into four cells whenever a cell holds too many points, so dense areas get fine cells and empty areas stay coarse. <b>R-trees</b> group nearby objects into bounding rectangles (PostGIS). <b>Geohashes</b> encode locations as strings, so nearby places share a prefix.</p>
    </Prose>
    <QuadtreeLab />
    <Matcher id="db" title="Pick the database" />
  </>
);

export default SdStorageBody;
