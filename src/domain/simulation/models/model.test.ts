import { INITIAL_MODEL, MODELS, OUTCOMES, outcomeStatus, visit } from './model';

describe('consistency models explorer', () => {
  it('stronger models allow a subset of what weaker ones allow', () => {
    MODELS.slice(1).forEach((m, i) => {
      const stronger = MODELS[i];
      expect(stronger?.allow.every(o => m.allow.includes(o))).toBe(true);
    });
  });
  it('classifies outcomes', () => {
    expect(outcomeStatus(0, 0)).toBe('expected');
    expect(outcomeStatus(0, 1)).toBe('ruled-out');
    expect(outcomeStatus(2, 6)).toBe('possible');
    expect(OUTCOMES.every((_, o) => outcomeStatus(4, o) !== 'ruled-out')).toBe(true);
  });
  it('visiting every model reaches five', () => {
    const v = MODELS.reduce<readonly number[]>((acc, _, i) => visit(acc, i), [INITIAL_MODEL]);
    expect(v).toEqual([0, 1, 2, 3, 4]);
    expect(visit(v, 2)).toBe(v);
  });
  it('the default does not solve any practice task', () => {
    expect([INITIAL_MODEL].length).toBeLessThan(5);
  });

  it('new lab tasks are reachable, and none is the default selection', () => {
    const weakestRuling = (o: number) => MODELS.map((_, i) => i).reverse().find(i => outcomeStatus(i, o) === 'ruled-out');
    // the weakest model that rules out each outcome
    expect(weakestRuling(6)).toBe(1);
    expect(weakestRuling(4)).toBe(3);
    expect(weakestRuling(5)).toBe(3);
    expect(weakestRuling(1)).toBe(0);
    expect([1, 3, 0]).not.toContain(INITIAL_MODEL);
  });
  it('numeric practice answers', () => {
    const ruledOut = (m: number) => OUTCOMES.filter((_, o) => outcomeStatus(m, o) === 'ruled-out').length;
    expect(ruledOut(1)).toBe(4);
    expect(MODELS.reduce((n, _, m) => n + ruledOut(m), 0)).toBe(15);
    expect(OUTCOMES.length - ruledOut(3)).toBe(5);
    // interleavings of 3 clients with 2 ops each (program order kept), and of 3 + 2 ops
    const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
    expect(fact(6) / (fact(2) * fact(2) * fact(2))).toBe(90);
    expect(fact(5) / (fact(3) * fact(2))).toBe(10);
  });
});
