import { allowedCount, ANOM_IDS, ANOMS, initialIx, lostIncrements, possibleCells, preventedCount, prevents, siAttempts, verdict, weakestPreventing, writeSkewRemaining } from './model';

describe('isolation model', () => {
  it('ANOM_IDS matches the anomaly table', () => {
    expect(ANOMS.map(a => a.id)).toEqual([...ANOM_IDS]);
  });
  it('weakest preventing levels match the practice tasks', () => {
    expect(weakestPreventing('dirtyread')).toBe('RC');
    expect(weakestPreventing('lostupdate')).toBe('RR');
    expect(weakestPreventing('phantom')).toBe('SI');
  });
  it('snapshot isolation allows write skew; lock-based RR prevents it', () => {
    expect(verdict({ level: 'SI', anom: 'writeskew' })?.prevented).toBe(false);
    expect(verdict({ level: 'RR', anom: 'writeskew' })?.prevented).toBe(true);
  });
  it('prevented verdicts carry the interleaving prefix', () => {
    expect(verdict({ level: 'RC', anom: 'dirtyread' })).toEqual({
      prevented: true, title: 'Prevented at Read Committed', text: 'This exact interleaving can’t happen: T2 only sees committed data, so it reads 100.',
    });
    expect(verdict({ level: 'RU', anom: 'dirtyread' })?.title).toBe('Happens at Read Uncommitted');
  });
  it('the default does not solve any practice task', () => {
    const solves = [['RC', 'dirtyread'], ['RR', 'lostupdate'], ['SI', 'writeskew']].some(([l, a]) => initialIx.level === l && initialIx.anom === a);
    expect(solves).toBe(false);
  });

  it('new lab tasks are reachable', () => {
    const anom = (id: string) => ANOMS.find(a => a.id === id);
    expect(weakestPreventing('phantom')).toBe('SI');
    const phantom = anom('phantom');
    expect(phantom && prevents(phantom, 'RR')).toBe(false);
    expect(phantom && prevents(phantom, 'SI')).toBe(true);
    expect(ANOMS.filter(a => prevents(a, 'RU')).map(a => a.id)).toEqual(['dirtywrite']);
    expect(ANOMS).toHaveLength(7);
    expect(initialIx.anom).not.toBe('phantom');
  });
  it('numeric practice answers', () => {
    expect(possibleCells()).toBe(13);
    expect(allowedCount('RC')).toBe(5);
    expect(preventedCount('SI')).toBe(6);
    expect(lostIncrements(5)).toBe(4);
    expect(siAttempts(6)).toBe(21);
    expect(writeSkewRemaining(5, 2, 5)).toBe(0);
    expect(writeSkewRemaining(2, 2, 2)).toBe(2);
  });
});
