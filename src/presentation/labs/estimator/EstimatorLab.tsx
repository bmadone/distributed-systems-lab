import { z } from 'zod';
import { usePersistedState, useSignal } from '../../hooks/app';
import { Panel, Slider, Stat, Verdict } from '../../ui/primitives';
import { estimate, fmtB, fmtN, fmtSize, initialConfig, RANGES, dauOf, type EstimatorConfig } from '../../../domain/simulation/estimator/model';

const int = (r: { readonly min: number; readonly max: number }) => z.number().int().min(r.min).max(r.max);
const schema = z.object({
  dauStep: int(RANGES.dauStep), writesPerUser: int(RANGES.writesPerUser), readsPerWrite: int(RANGES.readsPerWrite),
  kbPerWrite: int(RANGES.kbPerWrite), peakFactor: int(RANGES.peakFactor), years: int(RANGES.years),
});

const SLIDERS: readonly { readonly key: keyof EstimatorConfig; readonly label: string; readonly sub?: string; readonly format: (v: number) => string }[] = [
  { key: 'dauStep', label: 'Daily active users', format: v => fmtN(dauOf(v)) },
  { key: 'writesPerUser', label: 'Writes per user per day', format: String },
  { key: 'readsPerWrite', label: 'Reads per write', format: v => `${v}:1` },
  { key: 'kbPerWrite', label: 'Size per write', sub: 'KB', format: fmtSize },
  { key: 'peakFactor', label: 'Peak ÷ average', format: v => `${v}×` },
  { key: 'years', label: 'Retention', sub: 'years', format: String },
];

export const EstimatorLab = () => {
  const [c, setConfig] = usePersistedState('estimator', schema, initialConfig);
  const e = estimate(c);
  useSignal('estimator', {
    peak: e.peakQps, writeQps: e.writeQps, readQps: e.readQps, bytesPerYear: e.bytesPerYear, bytesTotal: e.bytesTotal,
    egressBps: e.egressBps, readsPerWrite: c.readsPerWrite, kbPerWrite: c.kbPerWrite, years: c.years,
  });

  return (
    <Panel title="Back-of-envelope estimator">
      <div className="grid2">
        {SLIDERS.map(s => (
          <Slider key={s.key} label={s.label} sub={s.sub} value={c[s.key]} min={RANGES[s.key].min} max={RANGES[s.key].max} format={s.format}
            onChange={v => setConfig(prev => ({ ...prev, [s.key]: v }))} />
        ))}
      </div>
      <div className="stats">
        <Stat value={fmtN(e.writeQps)} label="Write QPS (average)" />
        <Stat value={fmtN(e.readQps)} label="Read QPS (average)" />
        <Stat tone={e.peakQps > 100000 ? 'bad' : e.peakQps > 10000 ? 'warn' : 'ok'} value={fmtN(e.peakQps)} label="Peak QPS" />
        <Stat value={fmtB(e.bytesTotal)} label={`Storage over ${c.years} yr (${fmtB(e.bytesPerYear)}/yr)`} />
      </div>
      <div>
        <Verdict tone="info" title="What this implies">{e.advice.join(' ')}</Verdict>
      </div>
    </Panel>
  );
};

export type { EstimatorSignal } from '../../../domain/simulation/estimator/signal';
