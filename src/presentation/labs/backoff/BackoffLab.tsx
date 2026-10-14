import { z } from 'zod';
import { Panel, Seg } from '../../ui/primitives';
import { usePersistedState, useSignal } from '../../hooks/app';
import { CAP_OPTIONS, CAP_VALUES, CLIENTS, facts, histogram, RETRY_OPTIONS, RETRY_VALUES, STRATEGIES,  type CapValue, type RetryValue, type Strategy } from '../../../domain/simulation/backoff/model';

interface State { readonly strategy: Strategy; readonly retries: RetryValue; readonly cap: CapValue; readonly visited: readonly Strategy[] }
const strategySchema = z.enum(['fixed', 'exp', 'jitter']);
const schema = z.object({
  strategy: strategySchema,
  retries: z.enum(RETRY_VALUES),
  cap: z.enum(CAP_VALUES),
  visited: z.array(strategySchema),
});
const initial: State = { strategy: 'fixed', retries: '4', cap: '0', visited: ['fixed'] };

export const BackoffLab = () => {
  const [state, setState] = usePersistedState<State>('backoff', schema, initial);
  const { strategy, retries, cap, visited } = state;
  const f = facts(strategy, Number(retries), Number(cap), visited);
  const buckets = histogram(strategy, undefined, { retries: Number(retries), cap: Number(cap) });
  useSignal('backoff', f);
  const pick = (s: Strategy) => setState(p => ({ ...p, strategy: s, visited: p.visited.includes(s) ? p.visited : [...p.visited, s] }));
  return (
    <Panel title="Retry storm" hint="A dependency blips, and 1,000 clients fail at the same moment and retry. The chart shows when their retries arrive over the next 8 seconds.">
      <Seg label="Retry strategy" options={STRATEGIES} value={strategy} onChange={pick} />
      <Seg label="Retries per client" options={RETRY_OPTIONS} value={retries} onChange={r => setState(p => ({ ...p, retries: r }))} />
      <Seg label="Backoff cap" options={CAP_OPTIONS} value={cap} onChange={c => setState(p => ({ ...p, cap: c }))} />
      <div className="histo" role="img" aria-label={`Retries per 100 ms. Busiest 100 ms: ${f.peak} retries`}>
        {buckets.map((v, i) => <i key={i} style={{ height: `${Math.max(0.5, (100 * v) / CLIENTS)}%` }} title={String(v)} />)}
      </div>
      <div className="row hint"><span>0 s</span><span aria-live="polite">Busiest 100 ms: {f.peak} retries · {f.total} of {CLIENTS * f.retries} land in the window</span><span>8 s</span></div>
    </Panel>
  );
};

export type { BackoffSignal } from '../../../domain/simulation/backoff/signal';
