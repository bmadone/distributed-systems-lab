import { useEffect, useSyncExternalStore } from 'react';
import { isPageId, type PageId } from '../../domain/curriculum/ids';
import { useApi, useClock } from './app';

const subscribe = (fn: () => void) => { window.addEventListener('hashchange', fn); return () => window.removeEventListener('hashchange', fn); };
const readHash = () => window.location.hash.slice(1);

/** Current page from the URL hash (plain tokens only, e.g. #quorums), falling back to `fallback`. */
export const useRoute = (fallback: PageId): PageId => {
  const hash = useSyncExternalStore(subscribe, readHash, () => '');
  return isPageId(hash) ? hash : fallback;
};

/** Accumulates active reading time per page while the tab is visible, flushed every 15 s and on leave. */
export const useActiveTime = (page: PageId): void => {
  const api = useApi();
  const clock = useClock();
  useEffect(() => {
    let since = document.visibilityState === 'visible' ? clock.now() : null;
    const flush = () => {
      if (since === null) return;
      const ms = clock.now() - since;
      since = clock.now();
      if (ms > 0) api.trackTime(page, Math.min(ms, 60_000));
    };
    const onVis = () => { if (document.visibilityState === 'visible') since = clock.now(); else { flush(); since = null; } };
    const t = window.setInterval(flush, 15_000);
    document.addEventListener('visibilitychange', onVis);
    return () => { flush(); window.clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, [api, clock, page]);
};
