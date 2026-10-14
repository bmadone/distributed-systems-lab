import type { LabSettingsRepository } from '../../application/ports';
import { keysWithPrefix, readJson, removeKey, writeJson } from '../storage/json-storage';
import { STORAGE_PREFIX } from './local-storage-progress';

const LAB_PREFIX = `${STORAGE_PREFIX}lab:`;

/** Lab control settings (sliders, modes, selections) in `dsl:lab:<key>`. */
export const localStorageLabSettings: LabSettingsRepository = {
  read: (key, decoder) => readJson(`${LAB_PREFIX}${key}`, decoder),
  write: (key, value) => { writeJson(`${LAB_PREFIX}${key}`, value); },
  clearAll: () => { keysWithPrefix(LAB_PREFIX).forEach(removeKey); },
};
