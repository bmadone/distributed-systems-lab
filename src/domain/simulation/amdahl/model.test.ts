import { analyze, initialConfig, speedup } from './model';

describe('amdahl model', () => {
  it('90% parallel on 10 cores is about 5.3× (the numeric practice answer)', () => {
    expect(speedup(0.9, 10)).toBeCloseTo(5.26, 2);
    expect(analyze({ parallelPct: 90, cores: 10 }).speedup.toFixed(1)).toBe('5.3');
  });
  it('the serial part caps the speedup', () => {
    expect(analyze({ parallelPct: 90, cores: 128 }).ceiling).toBeCloseTo(10, 10);
    expect(analyze({ parallelPct: 100, cores: 4 }).ceiling).toBe(Infinity);
    expect(analyze({ parallelPct: 0, cores: 64 }).speedup).toBe(1);
  });
  it('default is 90% on 8 cores', () => {
    const a = analyze(initialConfig);
    expect(a.speedup).toBeCloseTo(4.71, 2);
    expect(a.serialPct).toBe(10);
  });
});
