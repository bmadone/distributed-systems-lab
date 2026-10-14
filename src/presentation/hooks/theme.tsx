import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { resolveTheme, type Theme } from '../../domain/preferences/theme';
import { useServices } from './app';

interface ThemeApi { readonly theme: Theme; readonly setTheme: (t: Theme) => void }
const ThemeContext = createContext<ThemeApi | null>(null);

const THEME_COLOR: Readonly<Record<'light' | 'dark', string>> = { light: '#EDF0F3', dark: '#0E141B' };
const prefersDark = (): boolean => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

/** Applies the theme to <html>: an explicit choice sets data-theme, "system" removes it so the CSS media query decides. */
const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme; else root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[resolveTheme(theme, prefersDark())]);
};

export const ThemeProvider = ({ children }: { readonly children: ReactNode }) => {
  const { preferences } = useServices();
  const [theme, setThemeState] = useState<Theme>(() => preferences.load().theme);
  const setTheme = useCallback((t: Theme) => { setThemeState(t); preferences.save({ theme: t }); }, [preferences]);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return undefined;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq?.addEventListener?.('change', onChange);
    return () => mq?.removeEventListener?.('change', onChange);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeApi => {
  const t = useContext(ThemeContext);
  if (!t) throw new Error('ThemeProvider missing');
  return t;
};
