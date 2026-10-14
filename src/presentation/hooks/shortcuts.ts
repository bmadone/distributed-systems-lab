import { useEffect } from 'react';
import type { PageId } from '../../domain/curriculum/ids';
import { neighbour } from '../layout/nav';
import { nextTheme } from '../../domain/preferences/theme';
import { useTheme } from './theme';

const typing = (t: EventTarget | null): boolean => {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
};

/** `[` previous page, `]` next page, `t` cycles the theme. Ignored while typing or with modifier keys. */
export const useShortcuts = (page: PageId): void => {
  const { theme, setTheme } = useTheme();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return;
      const go = (to: PageId | undefined) => { if (to) { e.preventDefault(); window.location.hash = to; } };
      if (e.key === '[') go(neighbour(page, -1));
      else if (e.key === ']') go(neighbour(page, 1));
      else if (e.key === 't') { e.preventDefault(); setTheme(nextTheme(theme)); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [page, theme, setTheme]);
};
