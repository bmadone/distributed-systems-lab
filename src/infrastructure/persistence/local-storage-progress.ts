import type { Clock, ProgressRepository } from '../../application/ports';
import { emptyProgress } from '../../domain/learning/progress';
import { readJson, removeKey, writeJson } from '../storage/json-storage';
import { fromLegacy, fromParsed, legacySchema, progressSchema } from './progress-schema';

export const STORAGE_PREFIX = 'dsl:';
export const PROGRESS_KEY = `${STORAGE_PREFIX}progress:v2`;
/** The single-file vanilla build stored its state here. */
export const LEGACY_KEY = 'ds-lab-course-v1';

/** `ProgressRepository` over localStorage, migrating the vanilla build's data on first load. */
export const localStorageProgressRepository = (clock: Clock): ProgressRepository => ({
  load: () => {
    const v2 = readJson(PROGRESS_KEY, progressSchema);
    if (v2) return fromParsed(v2);
    const v1 = readJson(LEGACY_KEY, legacySchema);
    return v1 ? fromLegacy(v1, clock.now()) : emptyProgress;
  },
  save: p => { writeJson(PROGRESS_KEY, p); },
  clear: () => { removeKey(PROGRESS_KEY); removeKey(LEGACY_KEY); },
});
