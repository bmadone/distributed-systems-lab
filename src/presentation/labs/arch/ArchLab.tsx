import { useState } from 'react';
import { useSignal } from '../../hooks/app';
import { Panel, SvgButton, Verdict } from '../../ui/primitives';
import { ARCH, ARCH_IDS, BOX_H, BOX_W, canFail, capabilities, center, EDGES, initialArch, pick, restoreAll, toggleDown } from '../../../domain/simulation/arch/model';

export const ArchLab = () => {
  const [s, setS] = useState(initialArch);
  const cap = capabilities(s.down);
  useSignal('arch', { visited: s.visited, down: s.down, ...cap });
  const a = s.selected === null ? null : ARCH[s.selected];

  return (
    <Panel title="Architecture explorer" hint="A typical scalable web application. Click any component to see what it does and what happens if it fails. Then mark components as failed and watch which user-facing functions survive.">
      <div className="svgbox">
        <svg viewBox="0 0 680 330" role="group" aria-label="Web architecture diagram">
          {EDGES.map(([p, q]) => {
            const [x1, y1] = center(p), [x2, y2] = center(q);
            return <line key={`${p}-${q}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--line)" strokeWidth={2} />;
          })}
          {ARCH_IDS.map(k => {
            const c = ARCH[k], sel = s.selected === k;
            return (
              <SvgButton key={k} label={c.n} pressed={sel} onActivate={() => setS(prev => pick(prev, k))}>
                <rect x={c.x} y={c.y} width={BOX_W} height={BOX_H} rx={8}
                  fill={s.down.includes(k) ? 'var(--bad-soft)' : sel ? 'var(--accent-soft)' : 'var(--surface)'}
                  stroke={s.down.includes(k) ? 'var(--bad)' : sel ? 'var(--accent)' : s.visited.includes(k) ? 'var(--ok)' : 'var(--muted)'}
                  strokeWidth={sel ? 3 : 1.5} />
                <text x={c.x + BOX_W / 2} y={c.y + 27} textAnchor="middle" className="sv-text">{c.n}</text>
              </SvgButton>
            );
          })}
        </svg>
      </div>
      <div className="row">
        <button type="button" className="btn" disabled={s.selected === null || !canFail(s.selected)}
          onClick={() => { const sel = s.selected; if (sel !== null) setS(prev => toggleDown(prev, sel)); }}>
          {s.selected !== null && s.down.includes(s.selected) ? 'Restore selected component' : 'Mark selected component as failed'}
        </button>
        <button type="button" className="btn" disabled={s.down.length === 0} onClick={() => setS(restoreAll)}>Restore all</button>
        <span className="chips">
          {([['reads', 'Pages load'], ['writes', 'Writes commit'], ['media', 'Media plays'], ['jobs', 'Background jobs']] as const).map(([k, label]) => (
            <span key={k} className="mono">{cap[k] ? 'OK' : 'DOWN'} {label}</span>
          ))}
        </span>
      </div>
      <div aria-live="polite">
        {a
          ? <div className="grid2"><Verdict tone="info" title={`${a.n}: what it does`}>{a.role}</Verdict><Verdict tone="warn" title="If it fails">{a.fail}</Verdict></div>
          : <p className="hint">{s.visited.length} of {ARCH_IDS.length} explored.</p>}
      </div>
    </Panel>
  );
};

export type { ArchSignal } from '../../../domain/simulation/arch/signal';
