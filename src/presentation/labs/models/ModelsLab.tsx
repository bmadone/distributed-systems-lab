import { useState } from 'react';
import { z } from 'zod';
import { Panel } from '../../ui/primitives';
import { usePersistedState, useSignal } from '../../hooks/app';
import { eyebrow, INITIAL_MODEL, MODELS, OUTCOMES, outcomeStatus, visit } from '../../../domain/simulation/models/model';

const schema = z.number().int().min(0).max(MODELS.length - 1);

export const ModelsLab = () => {
  const [sel, setSel] = usePersistedState('models', schema, INITIAL_MODEL);
  const [visited, setVisited] = useState<readonly number[]>(() => [sel]);
  useSignal('models', { visited, sel });
  const m = MODELS[sel] ?? MODELS[INITIAL_MODEL];
  const choose = (i: number) => { setSel(i); setVisited(v => visit(v, i)); };

  return (
    <Panel title="Same story, different models">
      <div className="grid2" style={{ gridTemplateColumns: 'minmax(0,220px) minmax(0,1fr)' }}>
        <div style={{ display: 'grid', gap: 6, alignContent: 'start' }}>
          {MODELS.map((x, i) => (
            <button key={x.name} type="button" className="mbtn" aria-pressed={i === sel} onClick={() => choose(i)}>
              <span className="eyebrow">{eyebrow(i)}</span><b>{x.name}</b><small>{x.sub}</small>
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>
          <p className="callout"><b>The story.</b> Alice posts <i>&quot;Our flight landed.&quot;</i> Bob sees it and replies <i>&quot;Welcome home!&quot;</i> Both writes are confirmed. Then Carol opens the thread from a replica on another continent. Separately, Dave and Erin post at the same moment from different regions.</p>
          <ul className="outcomes">
            {OUTCOMES.map((o, i) => {
              const st = outcomeStatus(sel, i);
              return (
                <li key={o}>
                  {st === 'expected' ? <span className="pill ok">EXPECTED</span> : st === 'possible' ? <span className="pill yes">POSSIBLE</span> : <span className="pill no">RULED OUT</span>}
                  <span>{o}</span>
                </li>
              );
            })}
          </ul>
          {m && (
            <div className="prose">
              <p><b>Rule:</b> {m.rule}</p><p><b>CAP:</b> {m.cap}</p><p><b>Found in:</b> {m.sys}</p>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
};

export type { ModelsSignal } from '../../../domain/simulation/models/signal';
