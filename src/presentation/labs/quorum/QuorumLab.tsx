import { z } from 'zod';
import { Panel, Slider, Verdict } from '../../ui/primitives';
import { usePersistedState, useSignal } from '../../hooks/app';
import { analyze, initialConfig, MAX_N, normalize, ordinal, PRESETS, REPLICAS, toggleDown, type QuorumConfig } from '../../../domain/simulation/quorum/model';

const schema = z.object({ N: z.number().int().min(1).max(MAX_N), W: z.number().int().min(1), R: z.number().int().min(1), down: z.array(z.number().int()) });
const plural = (n: number) => (n === 1 ? '' : 's');

export const QuorumLab = () => {
  const [raw, setConfig] = usePersistedState('quorum', schema, initialConfig);
  const c = normalize(raw);
  const a = analyze(c);
  const set = (patch: Partial<QuorumConfig>) => setConfig(prev => normalize({ ...prev, ...patch }));
  useSignal('quorum', { N: c.N, W: c.W, R: c.R, canW: a.canW, canR: a.canR, overlap: a.overlap, writesIntersect: a.writesIntersect, writeMs: a.writeMs, readMs: a.readMs, downCount: c.down.length });

  return (
    <Panel title="Quorum calculator">
      <div className="grid2">
        <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
          <Slider label="N" sub="copies of each value" value={c.N} min={1} max={MAX_N} onChange={N => set({ N })} />
          <Slider label="W" sub="confirmations per write" value={c.W} min={1} max={c.N} onChange={W => set({ W })} />
          <Slider label="R" sub="replicas asked per read" value={c.R} min={1} max={c.N} onChange={R => set({ R })} />
          <div className="chips"><span className="lbl">Presets:</span>
            {PRESETS.map(p => <button key={p.label} type="button" className="chip" onClick={() => setConfig({ N: p.N, W: p.W, R: p.R, down: [] })}>{p.label}</button>)}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 12, minWidth: 0, alignContent: 'start' }}>
          <p className="mono">R + W = {c.R + c.W} {a.overlap ? '>' : '≤'} N = {c.N} → {a.overlap ? `at least ${c.R + c.W - c.N} replica in common` : 'read and write groups can miss each other'}</p>
          <div className="replicas">
            {REPLICAS.slice(0, c.N).map((r, i) => {
              const down = c.down.includes(i), inW = a.writeSet.includes(i), inR = a.readSet.includes(i);
              return (
                <button key={r.name} type="button" className={`rep ${down ? 'down' : ''}`} aria-pressed={down} aria-label={`Replica ${r.name} in ${r.where}, ${down ? 'down' : 'up'}`} onClick={() => setConfig(prev => toggleDown(normalize(prev), i))}>
                  <span className="nm">{r.name}</span><span className="wh">{r.where}</span><span className="ms">{r.ms} ms</span>
                  <span className="tags">
                    {down ? <span className="t" style={{ color: 'var(--bad)' }}>DOWN</span>
                      : inW && inR ? <span className="t x">W+R</span> : inW ? <span className="t w">W</span> : inR ? <span className="t r">R</span> : null}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="hint">Worst case shown: the write lands on the fastest W replicas, and the read hits replicas the write skipped whenever it can. Click a replica to fail it.</p>
        </div>
      </div>
      <div className="grid2">
        {a.overlap
          ? <Verdict tone="good" title="Reads see the latest write">Every read touches a replica that took the newest write. This leans CP.</Verdict>
          : <Verdict tone="warn" title="Reads can be stale">A read can land only on replicas the write skipped. This is eventual consistency.</Verdict>}
        {a.writesIntersect
          ? <Verdict tone="good" title="Conflicting writes overlap">2W = {2 * c.W} &gt; N, so two sides of a split can’t both commit.</Verdict>
          : <Verdict tone="warn" title="Both sides of a split can write">2W = {2 * c.W} ≤ N, so disjoint groups can accept conflicting writes.</Verdict>}
        {a.canW
          ? <Verdict tone="good" title={`Writes OK · ~${a.writeMs} ms`}>Survives {c.N - c.W} failure{plural(c.N - c.W)}. Waits for the {ordinal(c.W)} fastest live replica.</Verdict>
          : <Verdict tone="bad" title="Writes unavailable">Only {a.alive.length} up, but each write needs {c.W}.</Verdict>}
        {a.canR
          ? <Verdict tone="good" title={`Reads OK · ~${a.readMs} ms`}>Survives {c.N - c.R} failure{plural(c.N - c.R)}. Waits for the {ordinal(c.R)} fastest live replica.</Verdict>
          : <Verdict tone="bad" title="Reads unavailable">Only {a.alive.length} up, but each read needs {c.R}.</Verdict>}
      </div>
    </Panel>
  );
};

export type { QuorumSignal } from '../../../domain/simulation/quorum/signal';
