import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { z } from 'zod';
import { pct } from '../../../domain/shared-kernel/fp';
import { usePersistedState, useSignal } from '../../hooks/app';
import { Panel, Slider, Verdict } from '../../ui/primitives';
import { clampCap, DEFAULT_CAP, HALF_BOX, MAX_CAP, MIN_CAP, move, place, POINTS, search, SIZE, type Dir, type Point } from '../../../domain/simulation/quadtree/model';

const schema = z.object({ cap: z.number().int() });
const KEYS: Readonly<Partial<Record<string, Dir>>> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

/** Imperative shell: convert a mouse position to SVG user coordinates. */
const toSvgPoint = (e: MouseEvent<SVGSVGElement>): Point | null => {
  const ctm = e.currentTarget.getScreenCTM();
  if (ctm === null) return null;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
  return [p.x, p.y];
};

export const QuadtreeLab = () => {
  const [settings, setSettings] = usePersistedState('quadtree', schema, { cap: DEFAULT_CAP });
  const cap = clampCap(settings.cap);
  const [query, setQuery] = useState<Point | null>(null);
  const r = search(POINTS, cap, query);
  useSignal('quadtree', { ratio: r.ratio, cap, cells: r.cells.length, checked: r.checked.length, found: r.found.length });

  const checked = new Set(r.checked), found = new Set(r.found);
  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    const dir = KEYS[e.key];
    if (dir === undefined && e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    setQuery(q => (dir === undefined ? place(q) : move(q, dir)));
  };

  return (
    <Panel title="Quadtree search" hint="300 drivers, clustered in two neighborhoods. Click the map to search the box around that spot. The quadtree only checks points in cells that overlap the box.">
      <Slider label="Max points per cell before splitting" value={cap} min={MIN_CAP} max={MAX_CAP} onChange={v => setSettings({ cap: clampCap(v) })} />
      <div className="svgbox" style={{ maxWidth: 520, justifySelf: 'center' }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" tabIndex={0} aria-label="Quadtree map. Click to search, or use arrow keys to move the search box" style={{ cursor: 'crosshair' }}
          onClick={e => { const p = toSvgPoint(e); if (p !== null) setQuery(p); }} onKeyDown={onKeyDown}>
          <rect x={0} y={0} width={SIZE} height={SIZE} fill="var(--bg)" />
          {r.cells.map(n => <rect key={`${n.x},${n.y},${n.w}`} x={n.x} y={n.y} width={n.w} height={n.w} fill="none" stroke="var(--line)" strokeWidth={1} />)}
          {POINTS.map((p, i) => {
            const inQ = found.has(i), isC = checked.has(i);
            return <circle key={i} cx={p[0]} cy={p[1]} r={inQ ? 3.5 : 2.5} fill={inQ ? 'var(--ok)' : isC ? 'var(--warn)' : 'var(--muted)'} opacity={isC || inQ ? 1 : 0.5} />;
          })}
          {r.box && <rect x={r.box.x1} y={r.box.y1} width={2 * HALF_BOX} height={2 * HALF_BOX} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="6 4" />}
        </svg>
      </div>
      <div className="grid2" aria-live="polite">
        {r.ratio === null
          ? <Verdict tone="info" title={`${r.cells.length} cells`}>Click the map to search an 80×80 box.</Verdict>
          : <>
            <Verdict tone={r.ratio < 0.15 ? 'good' : 'warn'} title={`Checked ${r.checked.length} of ${POINTS.length} points (${pct(r.ratio, 0)})`}>
              A full scan would check all {POINTS.length}. Orange points were checked but outside the box.
            </Verdict>
            <Verdict tone="info" title={`Found ${r.found.length} drivers · ${r.cells.length} cells`}>Smaller capacity means more, finer cells: fewer wasted checks, more tree to walk.</Verdict>
          </>}
      </div>
    </Panel>
  );
};

export type { QuadtreeSignal } from '../../../domain/simulation/quadtree/signal';
