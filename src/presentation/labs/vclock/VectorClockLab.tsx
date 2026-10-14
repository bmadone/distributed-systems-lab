import { useReducer } from 'react';
import { range } from '../../../domain/shared-kernel/fp';
import { Panel, SvgButton, Verdict } from '../../ui/primitives';
import { useSignal } from '../../hooks/app';
import { initialVc, PROCS, relation, selectedPair, step, type VcEvent } from '../../../domain/simulation/vclock/model';

const Y: readonly number[] = [55, 125, 195];
const STEP = 64, BASE_W = 640;
const X = (e: VcEvent) => 70 + e.id * STEP;
const yOf = (p: number) => Y[p] ?? 0;
const name = (e: VcEvent) => `P${e.p + 1}·L${e.L}`;
const kindText = (e: VcEvent) => e.kind === 'local' ? 'local event' : e.kind === 'send' ? `send to P${e.to + 1}` : `receive m${e.msg} from P${e.from + 1}`;

const Compare = ({ a, b }: { readonly a: VcEvent; readonly b: VcEvent }) => {
  const rel = relation(a, b);
  if (rel !== 'conc') {
    const [x, y] = rel === 'ab' ? [a, b] : [b, a];
    return <Verdict tone="info" title={`${name(x)} → ${name(y)} (happened before)`}>[{a.V.join(',')}] vs [{b.V.join(',')}]. Every entry of the earlier vector is ≤ the later one.</Verdict>;
  }
  return (
    <Verdict tone="warn" title="Concurrent: neither could have influenced the other">
      [{a.V.join(',')}] vs [{b.V.join(',')}]. {a.L !== b.L
        ? `Lamport says ${Math.min(a.L, b.L)} < ${Math.max(a.L, b.L)}, which suggests an order that doesn’t exist. Only the vectors reveal they’re concurrent.`
        : 'They also have equal Lamport times.'}
    </Verdict>
  );
};

export const VectorClockLab = () => {
  const [s, dispatch] = useReducer(step, undefined, initialVc);
  useSignal('vclock', s.seen);
  const width = Math.max(BASE_W, 80 + s.events.length * STEP);
  const pair = selectedPair(s);
  const byId = (id: number) => s.events[id];

  return (
    <Panel title="Space-time diagram" aside={<button type="button" className="linkbtn" onClick={() => dispatch({ type: 'reset' })}>Reset to sample</button>}>
      <div className="grid3">
        {range(PROCS).map(p => (
          <div className="client" key={p}>
            <b>P{p + 1}</b>
            <div className="chips">
              <button type="button" className="btn" onClick={() => dispatch({ type: 'local', p })}>Local event</button>
              {range(PROCS).filter(q => q !== p).map(q => (
                <button key={q} type="button" className="btn" aria-label={`Send from P${p + 1} to P${q + 1}`} onClick={() => dispatch({ type: 'send', p, to: q })}>Send → P{q + 1}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="chips">
        {s.flight.length > 0
          ? <><span className="lbl">In flight:</span>{s.flight.map((m, i) => (
            <button key={m.n} type="button" className="chip" onClick={() => dispatch({ type: 'deliver', index: i })}>Deliver m{m.n} (P{m.from + 1} → P{m.to + 1})</button>
          ))}</>
          : <span className="hint">No messages in flight. Send one above.</span>}
      </div>
      <div className="svgbox">
        <svg viewBox={`0 0 ${width} 230`} style={{ minWidth: width > BASE_W ? width : 0 }} role="group" aria-label="Three process timelines with events and messages. Activate two events to compare them.">
          {Y.map((y, p) => (
            <g key={p}>
              <text x={8} y={y + 4} className="sv-text">P{p + 1}</text>
              <line x1={40} x2={width - 10} y1={y} y2={y} stroke="var(--line)" strokeWidth={2} />
            </g>
          ))}
          {s.events.map(r => {
            if (r.kind !== 'recv') return null;
            const snd = byId(r.sendId);
            return snd && <line key={`m${r.id}`} x1={X(snd)} y1={yOf(snd.p)} x2={X(r)} y2={yOf(r.p)} stroke="var(--muted)" strokeWidth={1.5} />;
          })}
          {s.flight.map(m => {
            const snd = byId(m.sendId);
            return snd && <line key={`f${m.n}`} x1={X(snd)} y1={yOf(snd.p)} x2={X(snd) + 30} y2={(yOf(snd.p) + yOf(m.to)) / 2} stroke="var(--warn)" strokeWidth={1.5} strokeDasharray="4 3" />;
          })}
          {s.events.map(e => {
            const on = s.sel.includes(e.id);
            return (
              <SvgButton key={e.id} pressed={on} label={`P${e.p + 1} ${kindText(e)}, Lamport ${e.L}, vector ${e.V.join(' ')}`} onActivate={() => dispatch({ type: 'select', id: e.id })}>
                <circle cx={X(e)} cy={yOf(e.p)} r={on ? 11 : 8} fill={on ? 'var(--accent)' : e.kind === 'local' ? 'var(--surface)' : 'var(--muted)'} stroke="var(--accent)" strokeWidth={2} />
                <text x={X(e)} y={yOf(e.p) - 16} textAnchor="middle" className="sv-muted" style={{ fontSize: 10 }}>[{e.V.join(',')}]</text>
                <text x={X(e)} y={yOf(e.p) + 24} textAnchor="middle" className="sv-text" style={{ fontSize: 10 }}>L{e.L}</text>
              </SvgButton>
            );
          })}
        </svg>
      </div>
      <p className="hint">Click two events to compare them.</p>
      <div aria-live="polite">
        {pair ? <Compare a={pair[0]} b={pair[1]} /> : <p className="hint">{s.sel.length ? 'Select one more event.' : 'No events selected.'}</p>}
      </div>
    </Panel>
  );
};

export type { VcSignal } from '../../../domain/simulation/vclock/signal';
