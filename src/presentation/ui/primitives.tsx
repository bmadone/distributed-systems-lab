import { useId, type ReactNode } from 'react';
import type { Rich as RichText } from '../../domain/curriculum/types';

// Shared, stateless building blocks for lessons and labs. They map 1:1 to classes in styles.css.

/** Renders trusted, author-written inline HTML from course data. Never pass user input. */
export const Rich = ({ html, as: Tag = 'span', className }: { readonly html: RichText; readonly as?: 'span' | 'p' | 'div' | 'b' | 'li'; readonly className?: string }) =>
  <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;

export const Panel = ({ title, aside, hint, children }: { readonly title: string; readonly aside?: ReactNode; readonly hint?: ReactNode; readonly children: ReactNode }) => (
  <div className="panel">
    <div className="row"><h4>Lab · {title}</h4>{aside}</div>
    {hint !== undefined && <p className="hint">{hint}</p>}
    {children}
  </div>
);

export const Prose = ({ children }: { readonly children: ReactNode }) => <div className="prose">{children}</div>;

export interface SegOption<T extends string> { readonly value: T; readonly label: ReactNode }
export const Seg = <T extends string>({ label, options, value, onChange }: { readonly label: string; readonly options: readonly SegOption<T>[]; readonly value: T; readonly onChange: (v: T) => void }) => (
  <div className="seg" role="group" aria-label={label}>
    {options.map(o => <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>)}
  </div>
);

export const Chips = <T extends string>({ label, options, value, onChange }: { readonly label?: string; readonly options: readonly SegOption<T>[]; readonly value: T; readonly onChange: (v: T) => void }) => (
  <div className="chips">
    {label && <span className="lbl">{label}</span>}
    {options.map(o => <button key={o.value} type="button" className="chip" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>)}
  </div>
);

export const Slider = ({ label, sub, value, min, max, step = 1, format = String, onChange }: {
  readonly label: string; readonly sub?: string; readonly value: number; readonly min: number; readonly max: number; readonly step?: number;
  readonly format?: (v: number) => string; readonly onChange: (v: number) => void;
}) => {
  const id = useId();
  return (
    <div className="slider">
      <label htmlFor={id}>{label}{sub && <small> · {sub}</small>}</label>
      <output htmlFor={id}>{format(value)}</output>
      <input type="range" id={id} min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </div>
  );
};

export const Toggle = ({ label, checked, onChange }: { readonly label: ReactNode; readonly checked: boolean; readonly onChange: (v: boolean) => void }) => (
  <label className="chips"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /> <span>{label}</span></label>
);

export type Tone = 'good' | 'bad' | 'warn' | 'info';
export const Verdict = ({ tone, title, children }: { readonly tone: Tone; readonly title: ReactNode; readonly children?: ReactNode }) => (
  <div className={`verdict ${tone}`}><b>{title}</b>{children !== undefined && <span>{children}</span>}</div>
);

export const Stat = ({ value, label, tone }: { readonly value: ReactNode; readonly label: ReactNode; readonly tone?: 'ok' | 'bad' | 'warn' }) => (
  <div className={`stat ${tone ?? ''}`}><span className="n">{value}</span><span className="k">{label}</span></div>
);

export type LogTag = 'ok' | 'bad' | 'warn' | 'info' | 'net' | 'reject' | 'lost' | 'stale' | 'mode';
export interface LogEntry { readonly id: number; readonly tag: LogTag; readonly text: ReactNode }
export const Log = ({ entries, label = 'Event log' }: { readonly entries: readonly LogEntry[]; readonly label?: string }) => (
  <div className="log" role="log" aria-label={label} aria-live="polite">
    {entries.map(e => <div className="e" key={e.id}><span className={`tag ${e.tag}`}>{e.tag.toUpperCase()}</span><span>{e.text}</span></div>)}
  </div>
);

/** Keyboard-accessible clickable SVG group (Enter/Space activate). */
export const SvgButton = ({ label, pressed, onActivate, children, className }: { readonly label: string; readonly pressed?: boolean; readonly onActivate: () => void; readonly children: ReactNode; readonly className?: string }) => (
  <g role="button" tabIndex={0} aria-label={label} aria-pressed={pressed} className={className} style={{ cursor: 'pointer' }}
    onClick={onActivate} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate(); } }}>
    {children}
  </g>
);
