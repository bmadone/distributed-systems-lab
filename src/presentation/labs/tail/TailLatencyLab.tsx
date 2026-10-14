import { z } from 'zod';
import { pct } from '../../../domain/shared-kernel/fp';
import { usePersistedState, useSignal } from '../../hooks/app';
import { Chips, Panel, Slider, Verdict } from '../../ui/primitives';
import { FANOUT, initialFanout, initialSlowPct, SLOW_PCTS, slowPOf, slowShare, tone } from '../../../domain/simulation/tail/model';

const schema = z.object({ n: z.number().int().min(FANOUT.min).max(FANOUT.max), slowPct: z.number().refine(v => SLOW_PCTS.some(o => o === v)) });

export const TailLatencyLab = () => {
  const [{ n, slowPct }, setState] = usePersistedState('tailLatency', schema, { n: initialFanout, slowPct: initialSlowPct });
  const slowP = slowPOf(slowPct);
  const p = slowShare(n, slowP);
  useSignal('tailLatency', { n, p, slowP });

  return (
    <Panel title="Tail latency at scale" hint="Each backend answers in 10 ms, except for a small share of the time (1% by default) when it takes 1 second. A user request waits for every backend it fans out to.">
      <Slider label="Fan-out" sub="backends per request" value={n} min={FANOUT.min} max={FANOUT.max} onChange={v => setState(prev => ({ ...prev, n: v }))} />
      <Chips label="Share of the time a backend is slow" options={SLOW_PCTS.map(v => ({ value: String(v), label: `${v}%` }))} value={String(slowPct)} onChange={v => setState(prev => ({ ...prev, slowPct: Number(v) }))} />
      <div className="grid2">
        <Verdict tone={tone(p)} title={`${pct(p, 1)} of user requests are slow`}>1 − {1 - slowP}<sup>{n}</sup>. Each backend is slow only {slowPct}% of the time.</Verdict>
        <Verdict tone="info" title="Fixes">Hedged requests (send a backup after the p95), tighter timeouts with partial results, and cutting variance at the source, such as GC pauses and noisy neighbors.</Verdict>
      </div>
    </Panel>
  );
};

export type { TailLatencySignal } from '../../../domain/simulation/tail/signal';
