import { z } from 'zod';
import { Chips } from '../../ui/primitives';
import { usePersistedState, useSignal } from '../../hooks/app';
import { FILTERS, filterLabel, filterSystems, togglePin } from '../../../domain/simulation/systems/model';
import type { SystemsSignal } from '../../../domain/simulation/systems/signal';

const schema = z.object({ filter: z.enum(['All', 'CP', 'AP', 'Tunable', 'Other']), pinned: z.array(z.string()) });
const options = FILTERS.map(f => ({ value: f, label: filterLabel(f) }));
const initial: SystemsSignal = { filter: 'All', pinned: [] };

export const SystemsTable = () => {
  const [{ filter, pinned }, setState] = usePersistedState<SystemsSignal>('systems', schema, initial);
  useSignal('systems', { filter, pinned });
  return (
    <>
      <Chips options={options} value={filter} onChange={f => setState(p => ({ ...p, filter: f }))} />
      <p className="hint">Use the pin buttons to mark systems. Pins stay when you change the filter.</p>
      <div className="table-wrap">
        <table style={{ minWidth: 760 }}>
          <thead><tr><th>Pin</th><th>System</th><th>Kind</th><th>Partition</th><th>PACELC</th><th>How it behaves</th></tr></thead>
          <tbody>
            {filterSystems(filter).map(s => (
              <tr key={s.name}>
                <td>
                  <button type="button" className="chip" aria-pressed={pinned.includes(s.name)} aria-label={`Pin ${s.name}`}
                    onClick={() => setState(p => ({ ...p, pinned: togglePin(p.pinned, s.name) }))}>{pinned.includes(s.name) ? '★' : '☆'}</button>
                </td>
                <td><b>{s.name}</b></td>
                <td>{s.kind}</td>
                <td><span className={`cls ${s.cap}`}>{filterLabel(s.cap)}</span></td>
                <td className="mono">{s.pacelc}</td>
                <td className="hint" style={{ fontSize: '0.88rem' }}>{s.how}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export type { SystemsSignal } from '../../../domain/simulation/systems/signal';
