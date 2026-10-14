import { LESSONS } from '../../domain/curriculum/catalog';
import { emptyProgress, type Progress } from '../../domain/learning/progress';
import { nextRandom } from '../../domain/shared-kernel/fp';
import { createLearningApi } from '../learning-api';
import { defaultPreferences, type Preferences } from '../../domain/preferences/theme';
import type { Clock, LabSettingsRepository, PreferencesRepository, ProgressCodec, ProgressRepository, Random } from '../ports';
import type { Services } from '../services';

// Test doubles for the driven ports. They are real adapters, just backed by memory.

export const inMemoryProgressRepository = (initial: Progress = emptyProgress): ProgressRepository & { readonly saves: () => number } => {
  let stored: Progress | null = null;
  let saves = 0;
  return {
    load: () => stored ?? initial,
    save: p => { stored = p; saves++; },
    clear: () => { stored = null; },
    saves: () => saves,
  };
};

export const inMemoryLabSettings = (): LabSettingsRepository => {
  const store = new Map<string, unknown>();
  return {
    read: (key, decoder) => { if (!store.has(key)) return undefined; const r = decoder.safeParse(store.get(key)); return r.success ? r.data : undefined; },
    write: (key, value) => { store.set(key, JSON.parse(JSON.stringify(value))); },
    clearAll: () => { store.clear(); },
  };
};

export const jsonCodecStub: ProgressCodec = {
  encode: p => JSON.stringify(p),
  decode: text => { try { return { ...emptyProgress, ...(JSON.parse(text) as Partial<Progress>) }; } catch { return null; } },
};

export const inMemoryPreferences = (initial: Preferences = defaultPreferences): PreferencesRepository => {
  let stored = initial;
  return { load: () => stored, save: p => { stored = p; } };
};

export const fixedClock = (start: number): Clock & { readonly advance: (ms: number) => void } => {
  let t = start;
  return { now: () => t, advance: ms => { t += ms; } };
};

export const seededRandom = (seed: number): Random => {
  let s = seed >>> 0;
  return { next: () => { const [v, s2] = nextRandom(s); s = s2; return v; } };
};

export const FIXED_NOW = new Date(2026, 9, 14, 12).getTime();

/** A complete service set for tests: empty progress, in-memory storage, fixed time, seeded randomness. */
export const createTestServices = (initial: Progress = emptyProgress): Services & { readonly progress: ReturnType<typeof inMemoryProgressRepository> } => {
  const progress = inMemoryProgressRepository(initial);
  const clock = fixedClock(FIXED_NOW);
  return { api: createLearningApi({ lessons: LESSONS, progress, clock }), settings: inMemoryLabSettings(), codec: jsonCodecStub, preferences: inMemoryPreferences(), clock, random: seededRandom(1), progress };
};
