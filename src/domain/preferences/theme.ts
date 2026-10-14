// Display preferences. Pure: the DOM and storage are adapters' concerns.

export const THEMES = ['system', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];
export type ResolvedTheme = 'light' | 'dark';

export interface Preferences { readonly theme: Theme }
export const defaultPreferences: Preferences = { theme: 'system' };

export const isTheme = (x: unknown): x is Theme => (THEMES as readonly unknown[]).includes(x);

/** system → light → dark → system */
export const nextTheme = (t: Theme): Theme => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length] ?? 'system';

export const resolveTheme = (t: Theme, systemPrefersDark: boolean): ResolvedTheme =>
  t === 'system' ? (systemPrefersDark ? 'dark' : 'light') : t;

export const THEME_LABELS: Readonly<Record<Theme, string>> = { system: 'Auto', light: 'Light', dark: 'Dark' };
