import { z } from 'zod';
import { pct } from '../../../domain/shared-kernel/fp';
import { usePersistedState, useSignal } from '../../hooks/app';
import { Panel, Slider, Verdict } from '../../ui/primitives';
import { analyze, CORES, initialConfig, PARALLEL_PCT } from '../../../domain/simulation/amdahl/model';

const schema = z.object({
  parallelPct: z.number().int().min(PARALLEL_PCT.min).max(PARALLEL_PCT.max),
  cores: z.number().int().min(CORES.min).max(CORES.max),
});

export const AmdahlLab = () => {
  const [c, setConfig] = usePersistedState('amdahl', schema, initialConfig);
  const a = analyze(c);
  useSignal('amdahl', { parallelPct: c.parallelPct, cores: c.cores, speedup: a.speedup, efficiency: a.efficiency, serialPct: a.serialPct });
  return (
    <Panel title="Amdahl's law">
      <div className="grid2">
        <Slider label="Parallel share of the work" value={c.parallelPct} min={PARALLEL_PCT.min} max={PARALLEL_PCT.max} format={v => `${v}%`} onChange={parallelPct => setConfig(prev => ({ ...prev, parallelPct }))} />
        <Slider label="Cores" value={c.cores} min={CORES.min} max={CORES.max} onChange={cores => setConfig(prev => ({ ...prev, cores }))} />
      </div>
      <div className="grid2">
        <Verdict tone="info" title={`Speedup ${a.speedup.toFixed(2)}×`}>On {c.cores} cores, {pct(a.efficiency, 0)} parallel efficiency.</Verdict>
        <Verdict tone={a.ceiling < 20 ? 'warn' : 'good'} title={`Ceiling ${Number.isFinite(a.ceiling) ? `${a.ceiling.toFixed(1)}×` : '∞'}`}>Even with unlimited cores, the {a.serialPct}% serial part caps the gain.</Verdict>
      </div>
    </Panel>
  );
};

export type { AmdahlSignal } from '../../../domain/simulation/amdahl/signal';
