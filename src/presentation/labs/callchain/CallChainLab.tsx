import { z } from 'zod';
import { pct } from '../../../domain/shared-kernel/fp';
import { usePersistedState, useSignal } from '../../hooks/app';
import { Panel, Seg, Toggle, Verdict } from '../../ui/primitives';
import { analyze, initialChain, normalize, SERVICES, setMode, setRetry } from '../../../domain/simulation/callchain/model';

const schema = z.object({ sync: z.array(z.boolean()), retry: z.boolean().default(false) });
type Mode = 'sync' | 'async';
const MODES = [{ value: 'sync', label: 'Sync' }, { value: 'async', label: 'Async (queue)' }] as const;

export const CallChainLab = () => {
  const [raw, setConfig] = usePersistedState('callChain', schema, initialChain);
  const c = normalize(raw);
  const a = analyze(c);
  useSignal('callChain', { paymentSync: a.paymentSync, avail: a.avail, latency: a.latency, worstLatency: a.worstLatency, syncN: a.syncN, retry: c.retry });

  return (
    <Panel title="Checkout call chain" hint="Checkout calls four services. Each is 99.5% available and takes 80 ms. Synchronous calls run one after another and must all succeed. Asynchronous calls go through a queue (99.99%, 5 ms to enqueue) and are processed later.">
      <div style={{ display: 'grid', gap: 8 }}>
        {SERVICES.map((s, i) => (
          <div key={s.n} className="row" style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px' }}>
            <span><b>{s.n}</b> <span className="hint">· {s.note}</span></span>
            <Seg<Mode> label={`${s.n} call mode`} options={MODES} value={c.sync[i] === false ? 'async' : 'sync'}
              onChange={m => setConfig(prev => setMode(prev, i, m === 'sync'))} />
          </div>
        ))}
      </div>
      <Toggle label="Retry each failed synchronous call once (each call then has two chances, but a bad attempt costs extra time)" checked={c.retry} onChange={r => setConfig(prev => setRetry(prev, r))} />
      <div className="grid2">
        <Verdict tone={a.avail >= 0.994 ? 'good' : a.avail >= 0.985 ? 'warn' : 'bad'} title={`Checkout availability ${pct(a.avail, 2)}`}>
          {a.syncN} synchronous dependenc{a.syncN === 1 ? 'y' : 'ies'} multiplied together{a.anyAsync ? ', plus the queue' : ''}.
        </Verdict>
        <Verdict tone={a.latency < 150 ? 'good' : a.latency < 300 ? 'warn' : 'bad'} title={`Response time ~${a.latency} ms`}>
          {a.anyAsync ? 'Async work happens after the response. If Email is down, messages wait in the queue.' : 'Every call adds 80 ms in sequence.'}{c.retry ? ` Worst case, with every retry used: ~${a.worstLatency} ms.` : ''}
        </Verdict>
      </div>
    </Panel>
  );
};

export type { CallChainSignal } from '../../../domain/simulation/callchain/signal';
