import { ARCH_IDS, initialArch, pick } from './model';

describe('architecture explorer model', () => {
  it('records each component once', () => {
    const s = pick(pick(pick(initialArch, 'db'), 'dns'), 'db');
    expect(s.selected).toBe('db');
    expect(s.visited).toEqual(['dns', 'db']);
  });
  it('the task (8+ explored) is reachable by clicking components', () => {
    const s = ARCH_IDS.reduce(pick, initialArch);
    expect(s.visited.length).toBe(11);
    expect(s.visited.length >= 8).toBe(true);
  });
  it('the default does not solve any practice task', () => {
    expect(initialArch.visited.length).toBeLessThan(8);
  });
});

import { canFail, capabilities, restoreAll, toggleDown, type ArchId } from './model';

const downSet = (ids: readonly ArchId[]) => ids.reduce(toggleDown, initialArch).down;

describe('architecture failure simulation', () => {
  it('toggling fails then restores, clients cannot fail', () => {
    expect(downSet(['db', 'cache'])).toEqual(['cache', 'db']);
    expect(downSet(['db', 'db'])).toEqual([]);
    expect(canFail('clients')).toBe(false);
    expect(downSet(['clients'])).toEqual([]);
    expect(restoreAll(ARCH_IDS.reduce(toggleDown, initialArch)).down).toEqual([]);
  });
  it('with nothing down everything works', () => {
    expect(capabilities([])).toEqual({ reads: true, writes: true, media: true, jobs: true });
  });
  it('task: reads survive but writes fail (primary down)', () => {
    const c = capabilities(downSet(['db']));
    expect(c.reads && !c.writes).toBe(true);
  });
  it('task: a single failure takes out both reads and writes (DNS, LB or app)', () => {
    const single = ARCH_IDS.filter(canFail).filter(k => { const c = capabilities([k]); return !c.reads && !c.writes; });
    expect(single).toEqual(['dns', 'lb', 'app']);
  });
  it('task: reads and writes survive with 5 components down', () => {
    const d = downSet(['cdn', 'cache', 'replica', 'queue', 'workers']);
    const c = capabilities(d);
    expect(d.length).toBe(5);
    expect(c.reads && c.writes).toBe(true);
  });
  it('task: alive but degraded: reads and writes work, media and jobs do not', () => {
    const c = capabilities(downSet(['cdn', 'blob', 'queue']));
    expect(c.reads && c.writes && !c.media && !c.jobs).toBe(true);
    expect(capabilities(downSet(['cdn'])).media).toBe(true);
  });
  it('the default solves none of the failure tasks', () => {
    const c = capabilities(initialArch.down);
    expect(initialArch.down.length).toBe(0);
    expect(c.writes).toBe(true);
  });
});
