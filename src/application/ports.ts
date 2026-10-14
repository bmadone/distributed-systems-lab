import type { Progress } from '../domain/learning/progress';
import type { Preferences } from '../domain/preferences/theme';

// Driven ports: everything the application core needs from the outside world.
// Plain function records, so adapters are values rather than classes.

/** Anything with a `safeParse`, e.g. a zod schema. Typed by the value we want out. */
export interface Decoder<T> { readonly safeParse: (x: unknown) => { readonly success: boolean; readonly data?: T } }

export interface ProgressRepository {
  /** Never throws: unreadable or missing data yields empty progress. */
  readonly load: () => Progress;
  readonly save: (p: Progress) => void;
  readonly clear: () => void;
}

export interface LabSettingsRepository {
  readonly read: <T>(key: string, decoder: Decoder<T>) => T | undefined;
  readonly write: (key: string, value: unknown) => void;
  readonly clearAll: () => void;
}

/** Display preferences (theme). Survive "reset progress". */
export interface PreferencesRepository {
  readonly load: () => Preferences;
  readonly save: (p: Preferences) => void;
}

/** Serialises progress for export/import between browsers. `decode` returns null for anything that isn't a progress file. */
export interface ProgressCodec {
  readonly encode: (p: Progress) => string;
  readonly decode: (text: string) => Progress | null;
}

export interface Clock { readonly now: () => number }
/** Uniform random in [0, 1). */
export interface Random { readonly next: () => number }
