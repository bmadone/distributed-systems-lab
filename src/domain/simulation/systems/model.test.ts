import { FILTERS, filterSystems, namesWhere, PAEL_NOT_AP, RAFT_BASED, samePins, SYSTEMS, togglePin, TUNABLE_PCEC } from './model';

const find = (name: string) => SYSTEMS.find(s => s.name === name);

describe('systems table', () => {
  it('keeps the corrected rows', () => {
    expect(find('FaunaDB')).toBeUndefined();
    expect(find('FoundationDB')).toMatchObject({ cap: 'CP', pacelc: 'PC/EC' });
    expect(find('Amazon DynamoDB')?.how).toMatch(/leader-based Multi-Paxos group/);
    expect(find('MongoDB')?.how).toMatch(/CP only with majority write and read concerns/);
    expect(find('Elasticsearch')?.how).toMatch(/Only the cluster state uses a quorum/);
    expect(find('Elasticsearch')?.how).toMatch(/Jepsen/);
    expect(SYSTEMS).toHaveLength(19);
  });

  it('filters by CAP class', () => {
    expect(filterSystems('All')).toHaveLength(SYSTEMS.length);
    expect(filterSystems('Tunable').map(s => s.name)).toEqual(['Cassandra', 'Amazon DynamoDB', 'Apache Kafka']);
    expect(FILTERS.slice(1).reduce((n, f) => n + filterSystems(f).length, 0)).toBe(SYSTEMS.length);
  });

  it('the default filter does not solve the practice task', () => {
    expect(FILTERS[0]).toBe('All');
  });

  describe('extra practice tasks are reachable', () => {
    it('the default has no pins, so no pin task passes', () => {
      [RAFT_BASED(), TUNABLE_PCEC(), PAEL_NOT_AP()].forEach(want => expect(samePins([], want)).toBe(false));
    });
    it('Raft-based systems are etcd, Consul and CockroachDB', () => {
      expect([...RAFT_BASED()].sort()).toEqual(['CockroachDB', 'Consul', 'etcd']);
      expect(samePins(['etcd', 'Consul', 'CockroachDB'], RAFT_BASED())).toBe(true);
      expect(samePins(['etcd', 'Consul'], RAFT_BASED())).toBe(false);
      expect(samePins(['etcd', 'Consul', 'CockroachDB', 'DNS'], RAFT_BASED())).toBe(false);
    });
    it('the only Tunable PC/EC system is Kafka', () => {
      expect(TUNABLE_PCEC()).toEqual(['Apache Kafka']);
    });
    it('PA/EL systems that are not AP', () => {
      expect([...PAEL_NOT_AP()].sort()).toEqual(['Amazon DynamoDB', 'Cassandra', 'Redis (replicated)']);
    });
    it('pins toggle on and off, across filters', () => {
      const once = togglePin([], 'etcd');
      expect(once).toEqual(['etcd']);
      expect(togglePin(once, 'etcd')).toEqual([]);
    });
  });

  describe('numeric practice answers', () => {
    it('CP rows', () => {
      expect(namesWhere(s => s.cap === 'CP')).toHaveLength(10);
      expect(Math.round((10 / SYSTEMS.length) * 100)).toBe(53);
      expect(namesWhere(s => s.pacelc === 'PA/EL')).toHaveLength(7);
    });
    it('Kafka and Spanner arithmetic', () => {
      expect(5 - 3).toBe(2); // RF 5, min.insync.replicas 3
      expect(2 * 4).toBe(8); // commit wait about 2 x epsilon
      expect(5 - (Math.floor(5 / 2) + 1)).toBe(2); // RF 5 QUORUM tolerance
    });
  });
});
