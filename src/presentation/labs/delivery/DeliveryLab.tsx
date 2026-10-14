import { useReducer } from 'react';
import { z } from 'zod';
import { usePersistedState, useSignal, useRandom } from '../../hooks/app';
import { Log, Panel, Seg, Slider, Stat, type LogEntry } from '../../ui/primitives';
import { DESCRIPTIONS, initialSettings, initialState, step, type Outcome } from '../../../domain/simulation/delivery/model';

const schema = z.object({ strategy: z.enum(['once', 'retry', 'idem']), loss: z.number().min(0).max(60), n: z.number().int().min(10).max(200) });
const TAG: Readonly<Record<Outcome, LogEntry['tag']>> = { ok: 'ok', lost: 'lost', dup: 'bad' };

export const DeliveryLab = () => {
  const [settings, setSettings] = usePersistedState('delivery', schema, initialSettings);
  const [state, dispatch] = useReducer(step, initialState);
  const random = useRandom();
  const b = state.batch;
  useSignal('delivery', { last: b && { strategy: b.strategy, loss: b.loss, n: b.n, ok: b.ok, lost: b.lost, dup: b.dup, unk: b.unk }, everDup: state.everDup });
  // The shell picks the seed; the model stays deterministic.
  const run = () => dispatch({ type: 'run', settings, seed: Math.floor(random.next() * 2 ** 32) });
  const entries: readonly LogEntry[] = b === null ? []
    : b.logs.length ? b.logs.map(l => ({ id: l.k, tag: TAG[l.outcome], text: `Payment #${l.k}: ${l.story}` }))
    : [{ id: 0, tag: 'ok', text: 'Every payment went through on the first try.' }];
  return (
    <Panel title="Send payments over a lossy network">
      <div className="row">
        <Seg label="Strategy" value={settings.strategy} onChange={strategy => setSettings(s => ({ ...s, strategy }))}
          options={[{ value: 'once', label: 'At-most-once' }, { value: 'retry', label: 'Retry' }, { value: 'idem', label: 'Retry + idempotency key' }]} />
      </div>
      <div className="grid2">
        <Slider label="Message loss" sub="each direction" value={settings.loss} min={0} max={60} step={5} format={v => `${v}%`} onChange={loss => setSettings(s => ({ ...s, loss }))} />
        <Slider label="Payments to send" value={settings.n} min={10} max={200} step={10} onChange={n => setSettings(s => ({ ...s, n }))} />
      </div>
      <div className="row"><button type="button" className="btn primary" onClick={run}>Send payments</button><span className="hint">{DESCRIPTIONS[settings.strategy]}</span></div>
      <div className="stats">
        <Stat tone="ok" value={b?.ok ?? '–'} label="Charged exactly once" />
        <Stat tone="bad" value={b?.lost ?? '–'} label="Never charged (lost)" />
        <Stat tone="bad" value={b?.dup ?? '–'} label="Charged more than once" />
        <Stat tone="warn" value={b?.unk ?? '–'} label="Client unsure of outcome" />
      </div>
      <Log entries={entries} />
    </Panel>
  );
};

export type { DeliveryRun, DeliverySignal } from '../../../domain/simulation/delivery/signal';
