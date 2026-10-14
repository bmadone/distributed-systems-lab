import { z } from 'zod';
import { usePersistedState, useSignal } from '../../hooks/app';
import { Panel, Seg, Slider, Verdict } from '../../ui/primitives';
import { CRASH_AT, initialConfig, LAG, READ, timeline, xOf, type Config } from '../../../domain/simulation/replication/model';

const schema = z.object({
  mode: z.enum(['async', 'sync']),
  lag: z.number().min(LAG.min).max(LAG.max),
  read: z.number().min(READ.min).max(READ.max),
  crash: z.boolean(),
});

type Lane = 'c1' | 'A' | 'B' | 'C' | 'c2';
const LY: Readonly<Record<Lane, number>> = { c1: 30, A: 80, B: 125, C: 170, c2: 220 };
const LANES: readonly (readonly [Lane, string])[] = [['c1', 'Client 1'], ['A', 'A primary'], ['B', 'B replica'], ['C', 'C replica'], ['c2', 'Client 2']];

const Arrow = ({ t1, l1, t2, l2, color, dash }: { readonly t1: number; readonly l1: Lane; readonly t2: number; readonly l2: Lane; readonly color: string; readonly dash?: string }) => (
  <>
    <line x1={xOf(t1)} y1={LY[l1]} x2={xOf(t2)} y2={LY[l2]} stroke={color} strokeWidth={2} strokeDasharray={dash} />
    <circle cx={xOf(t2)} cy={LY[l2]} r={4} fill={color} />
  </>
);

export const ReplicationLab = () => {
  const [c, setC] = usePersistedState('replication', schema, initialConfig);
  const set = (patch: Partial<Config>) => setC(prev => ({ ...prev, ...patch }));
  const t = timeline(c);
  useSignal('replication', { mode: c.mode, stale: t.stale, crash: c.crash, lost: t.lost, lag: c.lag, ack: t.ack, value: t.value });
  const tr = c.read;
  return (
    <Panel title="Replication timeline" aside={
      <Seg label="Replication mode" value={c.mode} onChange={mode => set({ mode })} options={[{ value: 'async', label: 'Asynchronous' }, { value: 'sync', label: 'Synchronous' }]} />
    }>
      <div className="grid2">
        <Slider label="Replication lag to C" value={c.lag} min={LAG.min} max={LAG.max} step={LAG.step} format={v => `${v} ms`} onChange={lag => set({ lag })} />
        <Slider label="Client 2 reads C at" value={c.read} min={READ.min} max={READ.max} step={READ.step} format={v => `${v} ms`} onChange={read => set({ read })} />
      </div>
      <label className="chips"><input type="checkbox" checked={c.crash} onChange={e => set({ crash: e.target.checked })} /> <span>Primary A crashes at 8 ms, and B is promoted</span></label>
      <div className="svgbox">
        <svg viewBox="0 0 640 250" role="img" aria-label="Timeline of write replication and read">
          {LANES.map(([k, name]) => (
            <g key={k}>
              <text x={6} y={LY[k] + 4} className="sv-text">{name}</text>
              <line x1={80} x2={625} y1={LY[k]} y2={LY[k]} stroke="var(--line)" strokeWidth={1.5} />
            </g>
          ))}
          {[0, 50, 100, 150, 200, 250, 300].map(ms => <text key={ms} x={xOf(ms)} y={246} textAnchor="middle" className="sv-muted">{ms} ms</text>)}
          <Arrow t1={0} l1="c1" t2={5} l2="A" color="var(--accent)" />
          <text x={xOf(0) + 4} y={LY.c1 - 8} className="sv-text">write x=1</text>
          {t.lost
            ? <Arrow t1={5} l1="A" t2={CRASH_AT} l2="B" color="var(--bad)" dash="3 3" />
            : <>
                <Arrow t1={5} l1="A" t2={t.tB} l2="B" color="var(--accent)" />
                <Arrow t1={5} l1="A" t2={t.tC} l2="C" color="var(--accent)" />
                <text x={xOf(t.tC) + 6} y={LY.C - 8} className="sv-muted">C has x=1 at {t.tC} ms</text>
              </>}
          {t.ack !== null && t.okSent !== null && <>
            <Arrow t1={t.okSent} l1="A" t2={t.ack} l2="c1" color="var(--ok)" />
            <text x={xOf(t.ack) + 6} y={LY.c1 + 14} className="sv-text" fill="var(--ok)">{t.okLabel}</text>
          </>}
          {c.crash && <>
            <text x={xOf(CRASH_AT)} y={LY.A + 6} textAnchor="middle" className="sv-text" fill="var(--bad)" style={{ fontSize: 18 }}>✕</text>
            <line x1={xOf(CRASH_AT)} x2={625} y1={LY.A} y2={LY.A} stroke="var(--bad)" strokeWidth={2} strokeDasharray="4 4" />
            <text x={xOf(60)} y={LY.B - 8} className="sv-text" fill="var(--warn)">B promoted, has x={t.lost ? 0 : 1}</text>
          </>}
          <Arrow t1={tr} l1="c2" t2={tr + 2} l2="C" color="var(--warn)" />
          <Arrow t1={tr + 2} l1="C" t2={tr + 4} l2="c2" color={t.value ? 'var(--ok)' : 'var(--warn)'} />
          <text x={xOf(tr) + 6} y={LY.c2 + 16} className="sv-text">read → {t.value}</text>
        </svg>
      </div>
      <div className="grid2">
        {t.verdicts.map(v => <Verdict key={v.title} tone={v.tone} title={v.title}>{v.detail}</Verdict>)}
      </div>
    </Panel>
  );
};

export type { ReplicationSignal } from '../../../domain/simulation/replication/signal';
