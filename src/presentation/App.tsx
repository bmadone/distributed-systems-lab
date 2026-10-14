import { useEffect, useRef, useState } from 'react';
import { LESSONS } from '../domain/curriculum/catalog';
import { isLessonId, type PageId } from '../domain/curriculum/ids';
import { useApi, useProgress } from './hooks/app';
import { ExamPage } from './pages/ExamPage';
import { LessonPage } from './pages/LessonPage';
import { ProgressPage } from './pages/ProgressPage';
import { ReviewPage } from './pages/ReviewPage';
import { useActiveTime, useRoute } from './hooks/route';
import { useShortcuts } from './hooks/shortcuts';
import { ThemeProvider } from './hooks/theme';
import { pageTitle } from './layout/nav';
import { Sidebar } from './layout/Sidebar';

const Shell = () => {
  const last = useProgress(p => p.last);
  const page: PageId = useRoute(last ?? 'sd-intro');
  const api = useApi();
  const first = useRef(true);
  const main = useRef<HTMLElement>(null);
  // Lessons mount on first visit and then stay mounted (hidden), so lab state survives navigation.
  const [mounted, setMounted] = useState<ReadonlySet<PageId>>(() => new Set([page]));

  useEffect(() => {
    api.visit(page);
    setMounted(m => (m.has(page) ? m : new Set([...m, page])));
    window.scrollTo(0, 0);
    document.title = `${pageTitle(page)} · Distributed Systems Lab`;
    // Move focus to the new page's heading so keyboard and screen-reader users land at the top of the content.
    if (!first.current) requestAnimationFrame(() => document.querySelector<HTMLElement>('main section:not([hidden]) h2')?.focus({ preventScroll: true }));
    first.current = false;
  }, [api, page]);
  useActiveTime(page);
  useShortcuts(page);

  return (
    <div className="app">
      <a href="#" className="skip" onClick={e => { e.preventDefault(); main.current?.focus(); }}>Skip to content</a>
      <Sidebar current={page} />
      <main id="main" ref={main} tabIndex={-1}>
        {LESSONS.filter(l => mounted.has(l.id)).map(l => <LessonPage key={l.id} lesson={l} hidden={l.id !== page} />)}
        {!isLessonId(page) && (page === 'progress' ? <ProgressPage /> : page === 'review' ? <ReviewPage /> : <ExamPage />)}
      </main>
    </div>
  );
};

export const App = () => <ThemeProvider><Shell /></ThemeProvider>;
