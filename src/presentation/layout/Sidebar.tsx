import { useState } from 'react';
import { LESSONS } from '../../domain/curriculum/catalog';
import { PARTS, type PageId } from '../../domain/curriculum/ids';
import { lessonStatus } from '../../domain/learning/progress';
import { useProgress } from '../hooks/app';
import { completedCount, minutesLeft, nextLesson } from '../../domain/learning/summary';
import { pageTitle, SPECIAL, type SpecialKey } from './nav';
import { ThemeToggle } from './ThemeToggle';

export const Sidebar = ({ current }: { readonly current: PageId }) => {
  const progress = useProgress(p => p);
  const [open, setOpen] = useState(() => window.matchMedia?.('(min-width: 961px)').matches ?? true);
  const done = completedCount(progress);
  const currentTitle = pageTitle(current);
  const next = nextLesson(progress);
  const left = minutesLeft(progress);
  return (
    <aside className={`side ${open ? 'open' : ''}`}>
      <div className="brand"><span className="eyebrow">Interactive course</span><b>Distributed Systems Lab</b></div>
      <div className="prog">
        <div className="bar" role="progressbar" aria-label="Lessons completed" aria-valuemin={0} aria-valuemax={LESSONS.length} aria-valuenow={done}><i style={{ width: `${(100 * done) / LESSONS.length}%` }} /></div>
        <span>{done} of {LESSONS.length} lessons complete{left > 0 ? ` · about ${left >= 90 ? `${Math.round(left / 60)} h` : `${left} min`} left` : ''}</span>
      </div>
      {next && next.id !== current && <a className="btn primary continue" href={`#${next.id}`}>{done === 0 && !progress.visited[next.id] ? 'Start' : 'Continue'}: {next.title}</a>}
      <ThemeToggle />
      <button type="button" className="navtoggle" aria-expanded={open} aria-controls="nav" onClick={() => setOpen(o => !o)}>
        <span>Lessons</span><span className="hint">{currentTitle}</span>
      </button>
      <nav className="nav" id="nav" aria-label="Lessons" onClick={e => { if ((e.target as HTMLElement).closest('a') && !window.matchMedia?.('(min-width: 961px)').matches) setOpen(false); }}>
        {PARTS.map(part => {
          const lessons = LESSONS.filter(l => l.part === part.id);
          const specials = (Object.keys(SPECIAL) as SpecialKey[]).filter(k => SPECIAL[k].part === part.id);
          return (
            <div className="part" key={part.id}>
              <span>{part.title}</span>
              {lessons.map(l => {
                const st = lessonStatus(l, progress);
                return (
                  <a key={l.id} className={`navlink ${st.done ? 'done' : st.started ? 'started' : ''}`} href={`#${l.id}`} aria-current={l.id === current ? 'page' : undefined}>
                    <span className="st">{st.done ? '✓' : LESSONS.indexOf(l) + 1}</span><span>{l.title}</span><span />
                  </a>
                );
              })}
              {specials.map(k => (
                <a key={k} className="navlink" href={`#${k}`} aria-current={k === current ? 'page' : undefined}>
                  <span className="st">★</span><span>{SPECIAL[k].title}</span><span />
                </a>
              ))}
            </div>
          );
        })}
      </nav>
      <p className="hint shortcuts"><kbd>[</kbd> <kbd>]</kbd> previous / next · <kbd>t</kbd> theme</p>
    </aside>
  );
};
