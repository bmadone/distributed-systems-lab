import { z } from 'zod';
import { usePersistedState, useSignal } from '../../hooks/app';
import { Panel, Seg } from '../../ui/primitives';
import { barWidth, FALLACIES, fmtHuman, fmtReal, LATENCY, revealedCount, toggleCard } from '../../../domain/simulation/fallacies/model';

const openSchema = z.array(z.number().int());

export const FallaciesLab = () => {
  const [open, setOpen] = usePersistedState<readonly number[]>('fallacies', openSchema, []);
  const revealed = revealedCount(open);
  useSignal('fallacies', { revealed, open: [...new Set(open)].sort((a, b) => a - b) });
  return (
    <Panel title="The eight fallacies" aside={<span className="hint">{revealed} of 8 revealed</span>} hint="Click a card to see what actually happens and how good designs respond.">
      <div className="cards">
        {FALLACIES.map((f, i) => {
          const isOpen = open.includes(i);
          return (
            <button key={f.name} type="button" className={`fcard ${isOpen ? 'open' : ''}`} aria-expanded={isOpen} onClick={() => setOpen(prev => toggleCard(prev, i))}>
              <small>Fallacy {i + 1}</small><b>{f.name}</b>
              {isOpen
                ? <><p><b>Reality:</b> {f.reality}</p><p><b>Design response:</b> {f.response}</p></>
                : <small>Click to reveal</small>}
            </button>
          );
        })}
      </div>
    </Panel>
  );
};

type Scale = 'real' | 'human';
const scaleSchema = z.enum(['real', 'human']);

export const LatencyLadder = () => {
  const [scale, setScale] = usePersistedState<Scale>('latency', scaleSchema, 'real');
  useSignal('latencyLadder', { human: scale === 'human' });
  return (
    <Panel title="Latency ladder" aside={<Seg label="Scale" value={scale} onChange={setScale} options={[{ value: 'real', label: 'Real time' }, { value: 'human', label: 'If 1 ns = 1 second' }]} />}>
      <div className="ladder">
        {LATENCY.map(r => (
          <div className="lad" key={r.name}>
            <span>{r.name}</span>
            <span className="barwrap"><i style={{ width: `${barWidth(r.ns)}%` }} /></span>
            <span className="v">{scale === 'human' ? fmtHuman(r.ns) : fmtReal(r.ns)}</span>
          </div>
        ))}
      </div>
      <p className="hint">Bars use a log scale. Values are typical orders of magnitude, not benchmarks.</p>
    </Panel>
  );
};

export type { FallaciesSignal, LatencyLadderSignal } from '../../../domain/simulation/fallacies/signal';
