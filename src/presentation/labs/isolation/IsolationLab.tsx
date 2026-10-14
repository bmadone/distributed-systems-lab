import { useState } from 'react';
import { z } from 'zod';
import { Panel, Verdict } from '../../ui/primitives';
import { usePersistedState, useSignal } from '../../hooks/app';
import { ANOM_IDS, ANOMS, FOOTNOTE, initialIx, LEVEL_IDS, LEVELS, prevents, verdict, type AnomId } from '../../../domain/simulation/isolation/model';

const schema = z.object({ level: z.enum(LEVEL_IDS), anom: z.enum(ANOM_IDS) });

export const IsolationLab = () => {
  const [sel, setSel] = usePersistedState('isolation', schema, initialIx);
  const [seen, setSeen] = useState<readonly AnomId[]>(() => [sel.anom]);
  useSignal('ix', { level: sel.level, anom: sel.anom, anomsSeen: seen });
  const a = ANOMS.find(x => x.id === sel.anom);
  const v = verdict(sel);

  return (
    <Panel title="Run an anomaly at an isolation level">
      <div className="chips"><span className="lbl">Level:</span>
        {LEVELS.map(([id, n]) => <button key={id} type="button" className="chip" aria-pressed={sel.level === id} onClick={() => setSel(p => ({ ...p, level: id }))}>{n}</button>)}
      </div>
      <div className="chips"><span className="lbl">Anomaly:</span>
        {ANOMS.map(x => <button key={x.id} type="button" className="chip" aria-pressed={sel.anom === x.id} onClick={() => { setSel(p => ({ ...p, anom: x.id })); setSeen(v => (v.includes(x.id) ? v : [...v, x.id])); }}>{x.name}</button>)}
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {a && (
          <div className="txn">
            <div className="h">#</div><div className="h">Transaction T1</div><div className="h">Transaction T2</div>
            {a.steps.flatMap(([t, text], i) => [
              <div key={`n${i}`} className="n">{i + 1}</div>,
              <div key={`a${i}`}>{t === 1 ? text : ''}</div>,
              <div key={`b${i}`}>{t === 2 ? text : ''}</div>,
            ])}
          </div>
        )}
        {v && <Verdict tone={v.prevented ? 'good' : 'bad'} title={v.title}>{v.text}</Verdict>}
      </div>
      <div className="table-wrap">
        <table className="ixtable">
          <thead><tr><th>Anomaly</th>{LEVELS.map(([id, n]) => <th key={id} className={id === sel.level ? 'sel' : ''}>{n}</th>)}</tr></thead>
          <tbody>
            {ANOMS.map(x => (
              <tr key={x.id} className={x.id === sel.anom ? 'sel' : ''}>
                <td><b>{x.name}</b></td>
                {LEVELS.map(([id]) => <td key={id} className={prevents(x, id) ? 'pass' : 'fail'}>{prevents(x, id) ? 'prevented' : 'possible'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint">{FOOTNOTE}</p>
      </div>
    </Panel>
  );
};

export type { IsolationSignal } from '../../../domain/simulation/isolation/signal';
