import { useReducer } from 'react';
import { Log, Panel, SvgButton } from '../../ui/primitives';
import { useSignal } from '../../hooks/app';
import { initialRaft, newestLeader, step, type RaftNode } from '../../../domain/simulation/raft/model';

const POS: readonly (readonly [number, number])[] = [[260, 62], [420, 160], [362, 318], [158, 318], [100, 160]];
const VISIBLE = 8, BOX = 16;

const color = (n: RaftNode) => !n.alive ? 'var(--bad)' : n.role === 'leader' ? 'var(--accent)' : n.role === 'candidate' ? 'var(--warn)' : 'var(--muted)';
const status = (n: RaftNode) => (n.alive ? n.role : 'crashed');

const NodeView = ({ n, x, y, onWrite }: { readonly n: RaftNode; readonly x: number; readonly y: number; readonly onWrite: () => void }) => {
  const col = color(n);
  const shown = Math.min(n.log.length, VISIBLE), first = n.log.length - shown, start = x - (shown * BOX) / 2;
  return (
    <SvgButton label={`${n.name}, ${status(n)}, term ${n.term}, ${n.commit} of ${n.log.length} log entries committed. Send a client write to ${n.name}`} onActivate={onWrite}>
      <circle cx={x} cy={y} r={30} fill="var(--surface)" stroke={col} strokeWidth={n.role === 'leader' ? 6 : 3} strokeDasharray={n.alive ? undefined : '5 4'} />
      <text x={x} y={y + 2} textAnchor="middle" className="letter" style={{ fontSize: 18 }}>{n.name}</text>
      <text x={x} y={y + 18} textAnchor="middle" className="sv-muted">term {n.term}</text>
      <text x={x} y={y - 38} textAnchor="middle" className="badge-t" fill={col}>{status(n)}</text>
      {n.log.slice(first).map((e, k) => {
        const committed = first + k < n.commit, ex = start + k * BOX;
        return (
          <g key={first + k}>
            <rect x={ex} y={y + 38} width={13} height={15} rx={2} fill={committed ? 'var(--accent)' : 'var(--surface)'} stroke="var(--accent)" strokeWidth={1.5} />
            <text x={ex + 6.5} y={y + 49} textAnchor="middle" style={{ font: '600 9px var(--f-mono)' }} fill={committed ? 'var(--surface)' : 'var(--accent)'}>{e.term}</text>
          </g>
        );
      })}
    </SvgButton>
  );
};

export const RaftLab = () => {
  const [s, dispatch] = useReducer(step, undefined, () => initialRaft());
  useSignal('raft', s.seen);
  const L = newestLeader(s);
  return (
    <Panel title="Raft cluster" aside={<span className="hint mono" aria-live="polite">{L ? `Leader ${L.name} · term ${L.term}` : 'No leader'}</span>}>
      <div className="chips">
        <button type="button" className="btn primary" onClick={() => dispatch({ type: 'write', target: null })}>Client write</button>
        <button type="button" className="btn" onClick={() => dispatch({ type: 'tick' })}>Let election timeouts fire</button>
        <button type="button" className="btn" onClick={() => dispatch({ type: 'crash' })}>Crash leader</button>
        <button type="button" className="btn" onClick={() => dispatch({ type: 'restart' })}>Restart crashed nodes</button>
      </div>
      <div className="chips">
        <span className="lbl">Network:</span>
        <button type="button" className="chip" aria-pressed={s.groups !== null} onClick={() => dispatch({ type: 'split' })}>Split leader + 1 from the other 3</button>
        <button type="button" className="chip" onClick={() => dispatch({ type: 'heal' })}>Heal</button>
        <button type="button" className="linkbtn" onClick={() => dispatch({ type: 'reset' })}>Reset</button>
      </div>
      <div className="svgbox" style={{ maxWidth: 560, justifySelf: 'center' }}>
        <svg viewBox="0 0 520 400" role="group" aria-label="Five Raft nodes with logs. Activate a node to send it a client write.">
          {s.groups !== null && <line x1={40} y1={250} x2={480} y2={100} stroke="var(--bad)" strokeWidth={2} strokeDasharray="8 6" />}
          {s.nodes.map((n, i) => {
            const [x, y] = POS[i] ?? [0, 0];
            return <NodeView key={n.id} n={n} x={x} y={y} onWrite={() => dispatch({ type: 'write', target: n.id })} />;
          })}
        </svg>
      </div>
      <p className="hint">Filled squares are committed log entries, outlined squares are not committed yet. The number on each square is the term it was written in.</p>
      <Log entries={s.events} label="Raft event log" />
    </Panel>
  );
};

export type { RaftSignal } from '../../../domain/simulation/raft/signal';
