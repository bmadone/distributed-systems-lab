import { useEffect, useReducer, useRef } from 'react';
import { Log, Seg, Stat, SvgButton } from '../../ui/primitives';
import { useSignal } from '../../hooks/app';
import {
  capReducer, component, diverged, initialCap, LINK_IDS, LINKS, NAMES, POS, STEPS, latestAcked, valueAt,
  type CapMode, type NodeName, type Packet, type Preset,
} from '../../../domain/simulation/cap/model';

const MODES = [{ value: 'CP', label: 'CP · consistent' }, { value: 'AP', label: 'AP · available' }] as const satisfies readonly { value: CapMode; label: string }[];
const PRESET_BUTTONS: readonly { readonly preset: Preset; readonly label: string }[] = [
  { preset: 'healthy', label: 'Healthy' }, { preset: 'isoC', label: 'Isolate C' }, { preset: 'isoA', label: 'Isolate A' }, { preset: 'split', label: 'Cut everything' },
];

const reducedMotion = (): boolean => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Cosmetic: a dot travelling along a path of nodes. Animated imperatively; invisible when done or unsupported. */
const PacketDot = ({ packet }: { readonly packet: Packet }) => {
  const ref = useRef<SVGCircleElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.animate !== 'function' || reducedMotion() || packet.path.length < 2) return;
    const anim = el.animate(packet.path.map(n => ({ opacity: 1, transform: `translate(${POS[n].x}px, ${POS[n].y}px)` })), { duration: 550 * (packet.path.length - 1), easing: 'ease-in-out' });
    return () => anim.cancel();
  }, [packet]);
  return <circle ref={ref} r={7} fill={packet.color} stroke="var(--surface)" strokeWidth={2} style={{ opacity: 0 }} />;
};

export const CapLab = () => {
  const [s, dispatch] = useReducer(capReducer, undefined, () => initialCap());
  useSignal('cap', { step: s.step, lost: s.stats.lost, cpMajorityWrite: s.cpMajorityWrite, mode: s.mode, rejected: s.stats.rejected, stale: s.stats.stale, diverged: diverged(s) });
  const latest = latestAcked(s), lv = valueAt(latest.v), nv = valueAt(s.next);

  return (
    <div className="panel">
      <div className="row">
        <Seg label="Consistency mode" options={MODES} value={s.mode} onChange={mode => dispatch({ type: 'mode', mode })} />
        <span className="hint mono">Latest confirmed: <span className="swatch" style={{ background: lv.color }} /> {lv.name} t={latest.ts}</span>
      </div>
      <p className="hint">{s.mode === 'CP'
        ? <><b>CP:</b> a node serves requests only if it can reach a majority (2 of 3). Cut-off nodes refuse.</>
        : <><b>AP:</b> every node always answers from its own copy. Conflicts are resolved later.</>}</p>
      <div className="grid2">
        <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
          <div className="svgbox" style={{ maxWidth: 440, justifySelf: 'center' }}>
            <svg viewBox="0 0 400 350" role="img" aria-label="Three nodes A, B and C">
              <g>
                {LINK_IDS.map(k => {
                  const [a, b] = LINKS[k], p = POS[a], q = POS[b], mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2, upNow = s.links[k];
                  return (
                    <SvgButton key={k} className={`link ${upNow ? '' : 'down'}`} label={`Link ${a}–${b}, ${upNow ? 'connected' : 'cut'}`} onActivate={() => dispatch({ type: 'toggleLink', link: k })}>
                      <line className="hit" x1={p.x} y1={p.y} x2={q.x} y2={q.y} />
                      <line className="wire" x1={p.x} y1={p.y} x2={q.x} y2={q.y} />
                      <g className="cut"><circle cx={mx} cy={my} r={12} /><text x={mx} y={my + 5} textAnchor="middle">✕</text></g>
                    </SvgButton>
                  );
                })}
              </g>
              <g>
                {NAMES.map(n => {
                  const nd = s.nodes[n], v = valueAt(nd.v), alone = component(s.links, n).length === 1;
                  const flash = s.fx.flash?.node === n ? `flash-${s.fx.flash.kind}` : '';
                  return (
                    // Keyed by the effect sequence so the flash animation replays on every action.
                    <g key={`${n}-${flash ? s.fx.seq : 0}`} className={`node ${flash}`} transform={`translate(${POS[n].x} ${POS[n].y})`}>
                      <circle className="ring" r={38} style={{ stroke: v.color }} />
                      <text className="letter" textAnchor="middle" y={11}>{n}</text>
                      <text className="val" textAnchor="middle" y={62}>{v.name} · t={nd.ts}</text>
                      <text className={`badge-t ${s.mode === 'CP' ? 'fill-bad' : 'fill-warn'}`} textAnchor="middle" y={-52}>{alone ? (s.mode === 'CP' ? 'no quorum' : 'isolated') : ''}</text>
                    </g>
                  );
                })}
              </g>
              <g aria-hidden="true">
                {s.fx.packets.map((p, i) => <PacketDot key={`${s.fx.seq}-${i}`} packet={p} />)}
              </g>
            </svg>
          </div>
          <p className="hint" style={{ textAlign: 'center' }}>Click a link to cut or repair it.</p>
          <div className="chips"><span className="lbl">Network:</span>
            {PRESET_BUTTONS.map(b => <button key={b.preset} type="button" className="chip" onClick={() => dispatch({ type: 'preset', preset: b.preset })}>{b.label}</button>)}
          </div>
          <div className="clients">
            {NAMES.map((n: NodeName) => (
              <div className="client" key={n}><b>Node {n}</b>
                <div className="btns">
                  <button type="button" className="btn primary" aria-label={`Write on node ${n}`} onClick={() => dispatch({ type: 'write', node: n })}>Write</button>
                  <button type="button" className="btn" aria-label={`Read on node ${n}`} onClick={() => dispatch({ type: 'read', node: n })}>Read</button>
                </div>
              </div>
            ))}
          </div>
          <p className="hint">Next write sets the value to <span className="swatch" style={{ background: nv.color }} /> <b>{nv.name}</b></p>
        </div>
        <div style={{ display: 'grid', gap: 10, alignContent: 'start', minWidth: 0 }}>
          <div className="row"><h4>Guided experiment</h4><button type="button" className="linkbtn" onClick={() => dispatch({ type: 'reset' })}>Reset lab</button></div>
          <ol className="steps">
            {STEPS.map((st, i) => {
              const cls = i < s.step ? 'done' : i === s.step ? 'current' : '';
              const body = i < s.step ? st.done : i === s.step ? st.hint : '';
              return (
                <li key={st.title} className={`step ${cls}`}>
                  <span className="mark">{i < s.step ? '✓' : i + 1}</span><span className="title">{st.title}</span>
                  {body && <span className="body">{body}</span>}
                </li>
              );
            })}
            {s.step >= STEPS.length && <li className="complete-banner">Experiment complete. Try isolating A instead, or switch modes mid-partition.</li>}
          </ol>
        </div>
      </div>
      <div className="stats">
        <Stat tone="ok" value={s.stats.acked} label="Writes confirmed" />
        <Stat tone="bad" value={s.stats.rejected} label="Refused · availability lost" />
        <Stat tone="warn" value={s.stats.stale} label="Stale reads · consistency lost" />
        <Stat tone="bad" value={s.stats.lost} label="Confirmed writes lost" />
      </div>
      <Log entries={s.log} label="Network log" />
    </div>
  );
};

export type { CapSignal } from '../../../domain/simulation/cap/signal';
