import { useState } from 'react';
import { z } from 'zod';
import { pct } from '../../../domain/shared-kernel/fp';
import { usePersistedState, useSignal } from '../../hooks/app';
import { Panel, Seg, Verdict } from '../../ui/primitives';
import {
  assign, color, counts, HASH_SPACE, HASHES, idealMove, initialConfig, KEYS, MAX_NODES, MIN_NODES, rangeLabel, resize, ringPoints,
  STRATEGY_NAMES, type Config, type Move,
} from '../../../domain/simulation/partitioning/model';

const schema = z.object({ strategy: z.enum(['range', 'mod', 'ring']), n: z.number().int().min(MIN_NODES).max(MAX_NODES), vn: z.boolean() });
const CENTER = 150, R = 112;
const onCircle = (angle: number, r: number) => ({ x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) });

export const PartitioningLab = () => {
  const [config, setConfig] = usePersistedState('partitioning', schema, initialConfig);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const { strategy, n, vn } = config;
  const own = assign(strategy, n, vn);
  const cs = counts(own, n);
  const share = Math.max(...cs) / KEYS.length;
  useSignal('partitioning', { strategy, n, vn, lastMove, maxShare: share, counts: cs });

  const reconfigure = (patch: Partial<Config>) => { setConfig(c => ({ ...c, ...patch })); setLastMove(null); };
  const step = (d: number) => {
    const r = resize(config, d);
    if (r) { setConfig(r.config); setLastMove(r.move); }
  };
  const angle = (i: number) => (strategy === 'range' ? i / KEYS.length : (HASHES[i] ?? 0) / HASH_SPACE) * 2 * Math.PI - Math.PI / 2;

  return (
    <Panel title="Shard 120 user keys" aside={
      <Seg label="Partitioning strategy" value={strategy} onChange={s => reconfigure({ strategy: s })}
        options={[{ value: 'range', label: 'Range' }, { value: 'mod', label: 'Hash mod N' }, { value: 'ring', label: 'Consistent hashing' }]} />
    }>
      <div className="row">
        <div className="chips"><span className="lbl">Nodes:</span>
          <button type="button" className="btn" aria-label="Remove node" disabled={n <= MIN_NODES} onClick={() => step(-1)}>−</button>
          <b className="mono" aria-live="polite">{n}</b>
          <button type="button" className="btn" aria-label="Add node" disabled={n >= MAX_NODES} onClick={() => step(1)}>+</button>
        </div>
        <label className="chips" style={{ visibility: strategy === 'ring' ? 'visible' : 'hidden' }}>
          <input type="checkbox" checked={vn} onChange={e => reconfigure({ vn: e.target.checked })} /> <span>Virtual nodes (200 per node)</span>
        </label>
      </div>
      <div className="grid2">
        <div className="svgbox">
          <svg viewBox="0 0 300 300" role="img" aria-label="Key placement">
            <circle cx={CENTER} cy={CENTER} r={R} fill="none" stroke="var(--line)" strokeWidth={2} />
            {KEYS.map((k, i) => { const p = onCircle(angle(i), R); return <circle key={k} cx={p.x} cy={p.y} r={4} fill={color(own[i] ?? 0)} />; })}
            {strategy === 'ring' && ringPoints(n, vn).map(pt => {
              const a = (pt.pos / HASH_SPACE) * 2 * Math.PI - Math.PI / 2;
              const p1 = onCircle(a, 96), p2 = onCircle(a, vn ? 104 : 128);
              return <line key={`${pt.node}-${pt.pos}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color(pt.node)} strokeWidth={vn ? 1.5 : 5} />;
            })}
            <text x={150} y={146} textAnchor="middle" className="sv-text">{strategy === 'range' ? 'keys in A→Z order' : strategy === 'ring' ? 'hash ring' : 'keys at hash position'}</text>
            <text x={150} y={162} textAnchor="middle" className="sv-muted">{KEYS.length} keys · {n} nodes</text>
          </svg>
        </div>
        <div style={{ display: 'grid', gap: 12, alignContent: 'start', minWidth: 0 }}>
          <div className="bars">
            {cs.map((c, i) => (
              <div className="barrow" key={i}>
                <span className="mono">node {i + 1}{strategy === 'range' ? ` ${rangeLabel(i, n)}` : ''}</span>
                <span className="track"><i style={{ width: `${100 * c / KEYS.length * Math.min(n, 4) / 1.5}%`, background: color(i) }} /></span>
                <span className="v">{c} · {pct(c / KEYS.length, 0)}</span>
              </div>
            ))}
          </div>
          <div>
            <Verdict tone={share > 1.5 / n ? 'warn' : 'good'} title={`Busiest node: ${pct(share, 0)}`}>A perfect split would be {pct(1 / n, 0)} each.</Verdict>
            {lastMove
              ? <div style={{ marginTop: 8 }}>
                  <Verdict tone={lastMove.moved / lastMove.total > 0.5 ? 'bad' : 'good'} title={`${lastMove.from} → ${lastMove.to} nodes moved ${lastMove.moved} of ${lastMove.total} keys (${pct(lastMove.moved / lastMove.total, 0)})`}>
                    {STRATEGY_NAMES[lastMove.strategy]}. The ideal minimum is about {pct(idealMove(lastMove), 0)}.
                  </Verdict>
                </div>
              : <p className="hint" style={{ marginTop: 8 }}>Add or remove a node to see how many keys have to move.</p>}
          </div>
        </div>
      </div>
    </Panel>
  );
};

export type { PartitioningSignal } from '../../../domain/simulation/partitioning/signal';
