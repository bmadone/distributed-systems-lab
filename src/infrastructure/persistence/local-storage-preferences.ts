import { z } from 'zod';
import type { PreferencesRepository } from '../../application/ports';
import { defaultPreferences, isTheme } from '../../domain/preferences/theme';
import { readJson, writeJson } from '../storage/json-storage';
import { STORAGE_PREFIX } from './local-storage-progress';

/** Also read by the inline script in index.html, which applies the theme before first paint. Keep both in sync. */
export const PREFERENCES_KEY = `${STORAGE_PREFIX}prefs:v1`;

const stored = z.object({ theme: z.unknown() });

export const localStoragePreferences: PreferencesRepository = {
  load: () => {
    const raw = readJson(PREFERENCES_KEY, stored);
    return raw && isTheme(raw.theme) ? { theme: raw.theme } : defaultPreferences;
  },
  save: p => { writeJson(PREFERENCES_KEY, p); },
};
