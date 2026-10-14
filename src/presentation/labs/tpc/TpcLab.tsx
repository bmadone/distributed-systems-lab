import { useReducer } from 'react';
import { z } from 'zod';
import { Log, Panel } from '../../ui/primitives';
import { usePersistedState, useSignal } from '../../hooks/app';
import { initialTpc, LAST_STEP, lockedCount, outcome, phaseLabel, PNAMES, STATE_COLOR, tpcReducer, type TpcOptions } from '../../../domain/simulation/tpc/model';

const schema = z.object({ no: z.boolean(), crash: z.boolean() });
const PLACEHOLDER = [{ id: -1, tag: 'info', text: 'Choose failures above, then step through the protocol.' }] as const;

export const TpcLab = () => {
  const [opts, setOpts] = usePersistedState<TpcOptions>('tpc', schema, { no: false, crash: false });
  const [s, dispatch] = useReducer(tpcReducer, undefined, () => initialTpc());
  useSignal('tpc', { seen: s.seen, step: s.step, msgs: s.msgs, locked: lockedCount(s), outcome: outcome(s), no: opts.no, crash: opts.crash });
  const change = (patch: Partial<TpcOptions>) => { setOpts(p => ({ ...p, ...patch })); dispatch({ type: 'reset' }); };
  const cards = [['Coordinator', s.coord], ...PNAMES.map((n, i) => [n, s.parts[i] ?? 'idle'] as const)] as const;
  const done = s.step >= LAST_STEP;

  return (
    <Panel title="Two-phase commit">
      <div className="chips">
        <label className="chips"><input type="checkbox" checked={opts.no} onChange={e => change({ no: e.target.checked })} /> Inventory votes NO (out of stock)</label>
        <label className="chips"><input type="checkbox" checked={opts.crash} onChange={e => change({ crash: e.target.checked })} /> Coordinator crashes after collecting votes</label>
      </div>
      <div className="row">
        <div className="chips">
          <button type="button" className="btn primary" disabled={done} onClick={() => dispatch({ type: 'step', opts })}>Next step</button>
          <button type="button" className="btn" disabled={done} onClick={() => dispatch({ type: 'runAll', opts })}>Run to end</button>
          <button type="button" className="btn" disabled={!s.recover} onClick={() => dispatch({ type: 'recover' })}>Recover coordinator</button>
          <button type="button" className="linkbtn" onClick={() => dispatch({ type: 'reset' })}>Reset</button>
        </div>
        <span className="hint mono">{phaseLabel(s.step)} · {s.msgs} messages</span>
      </div>
      <div className="ptrow">
        {cards.map(([n, st]) => (
          <div className="pt" key={n}>
            <b>{n}</b><span className="state" style={{ color: `var(--${STATE_COLOR[st]})` }}>{st}</span>
            {(st === 'prepared' || st === 'in doubt') && <span className="hint">holding locks</span>}
          </div>
        ))}
      </div>
      <Log entries={s.log.length ? s.log : PLACEHOLDER} label="Two-phase commit log" />
    </Panel>
  );
};

export type { TpcSignal } from '../../../domain/simulation/tpc/signal';
