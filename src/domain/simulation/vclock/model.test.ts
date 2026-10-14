import { chainThroughThird, concurrentPairs, initialVc, noSeen, relation, step, type VcAction, type VcState } from './model';

const run = (s: VcState, ...actions: readonly VcAction[]) => actions.reduce(step, s);
const ev = (s: VcState, id: number) => { const e = s.events[id]; if (!e) throw new Error(`no event ${id}`); return e; };

describe('vector clock model', () => {
  it('builds the legacy sample diagram with one message in flight', () => {
    const s = initialVc();
    expect(s.events.map(e => e.V)).toEqual([
      [1, 0, 0], [2, 0, 0], [0, 0, 1], [0, 1, 0], [2, 2, 0], [2, 3, 0], [3, 0, 0], [0, 0, 2], [4, 0, 2], [2, 4, 0],
    ]);
    expect(s.events.map(e => e.L)).toEqual([1, 2, 1, 1, 3, 4, 3, 2, 4, 5]);
    expect(s.flight).toEqual([expect.objectContaining({ n: 2, from: 1, to: 2 })]);
  });

  it('receive takes the element-wise max and Lamport max + 1', () => {
    const s = run(initialVc(), { type: 'deliver', index: 0 });
    const r = s.events.at(-1);
    expect(r?.V).toEqual([2, 3, 3]);
    expect(r?.L).toBe(5);
    expect(s.flight).toEqual([]);
    expect(s.seen.delivered).toBe(true);
  });

  it('compares events by vectors', () => {
    const s = initialVc();
    expect(relation(ev(s, 0), ev(s, 4))).toBe('ab');
    expect(relation(ev(s, 4), ev(s, 0))).toBe('ba');
    expect(relation(ev(s, 0), ev(s, 2))).toBe('conc');
  });

  it('selecting concurrent events with equal Lamport times finds concurrency but not a misleading pair', () => {
    const s = run(initialVc(), { type: 'select', id: 0 }, { type: 'select', id: 2 });
    expect(s.seen).toMatchObject({ foundConcurrent: true, foundMislead: false });
  });

  it('selecting concurrent events with different Lamport times finds a misleading pair', () => {
    const s = run(initialVc(), { type: 'select', id: 1 }, { type: 'select', id: 2 });
    expect(s.seen).toMatchObject({ foundConcurrent: true, foundMislead: true });
  });

  it('keeps at most two selected events and toggles off', () => {
    const s = run(initialVc(), { type: 'select', id: 0 }, { type: 'select', id: 1 }, { type: 'select', id: 4 });
    expect(s.sel).toEqual([1, 4]);
    expect(run(s, { type: 'select', id: 4 }).sel).toEqual([1]);
  });

  it('a new send then deliver is reachable', () => {
    const s = run(initialVc(), { type: 'send', p: 2, to: 1 }, { type: 'deliver', index: 1 });
    expect(s.events.at(-1)).toMatchObject({ kind: 'recv', p: 1, from: 2 });
    expect(s.seen.delivered).toBe(true);
  });

  it('reset restores the sample but keeps practice facts', () => {
    const s = run(initialVc(), { type: 'local', p: 0 }, { type: 'deliver', index: 0 }, { type: 'reset' });
    expect(s.events).toEqual(initialVc().events);
    expect(s.seen.delivered).toBe(true);
  });

  it('the default does not solve any practice task', () => {
    expect(initialVc().seen).toEqual(noSeen);
    expect(Object.values(noSeen).every(v => v === false)).toBe(true);
    expect(initialVc().sel).toEqual([]);
  });

  describe('extra practice tasks are reachable', () => {
    it('comparing an ordered pair is a happened-before find', () => {
      const s = run(initialVc(), { type: 'select', id: 0 }, { type: 'select', id: 1 });
      expect(s.seen.foundBefore).toBe(true);
      expect(s.seen.foundConcurrent).toBe(false);
    });

    it('no three-process chain exists in the default sample, but delivering the in-flight message creates one', () => {
      const s0 = initialVc();
      expect(s0.events.some(a => s0.events.some(b => chainThroughThird(s0, a, b)))).toBe(false);
      const s = run(s0, { type: 'deliver', index: 0 }, { type: 'select', id: 1 }, { type: 'select', id: 10 });
      expect(s.events.at(10)?.p).toBe(2);
      expect(s.seen.foundChain3).toBe(true);
    });

    it('same-process ordered pairs do not count as a three-process chain', () => {
      const s = run(initialVc(), { type: 'select', id: 0 }, { type: 'select', id: 1 });
      expect(s.seen.foundChain3).toBe(false);
    });

    it('two events with the same Lamport time are concurrent', () => {
      const s = run(initialVc(), { type: 'select', id: 0 }, { type: 'select', id: 2 });
      expect(s.seen.foundTie).toBe(true);
      expect(relation(ev(s, 0), ev(s, 2))).toBe('conc');
      expect(run(initialVc(), { type: 'select', id: 1 }, { type: 'select', id: 2 }).seen.foundTie).toBe(false);
    });

    it('a process can learn of at least 3 events from every process', () => {
      const s = run(initialVc(), { type: 'deliver', index: 0 }, { type: 'send', p: 2, to: 0 }, { type: 'deliver', index: 0 });
      expect(s.events.at(-1)?.V).toEqual([5, 3, 4]);
      expect(s.seen.wellInformed).toBe(true);
    });
  });

  describe('numeric practice answers', () => {
    it('counts concurrent pairs in the sample diagram', () => {
      expect(concurrentPairs(initialVc().events)).toBe(24);
    });
    it('Lamport and vector arithmetic', () => {
      // P1 at L=5 receives a message stamped 9, then does a local event and a send: 10, 11, 12.
      expect(Math.max(5, 9) + 1 + 1 + 1).toBe(12);
      // [3,1,0] receives [2,4,1] on P1: [max(3,2)+1, 4, 1] sums to 9.
      expect([Math.max(3, 2) + 1, Math.max(1, 4), Math.max(0, 1)].reduce((a, b) => a + b, 0)).toBe(9);
      // 50 ppm drift for one hour, in ms.
      expect(3600 * 50e-6 * 1000).toBeCloseTo(180, 9);
      // 64 processes, 4-byte counters.
      expect(64 * 4).toBe(256);
    });
  });
});
