import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { LearningApi } from '../../application/learning-api';
import type { Decoder } from '../../application/ports';
import type { Services } from '../../application/services';
import type { Signals } from '../../domain/curriculum/signals';
import type { AppState, Progress } from '../../domain/learning/progress';

// The React shell around the application core: services arrive through context
// (injected by the composition root), and components talk to the `LearningApi`.

const ServicesContext = createContext<Services | null>(null);
export const AppProvider = ({ services, children }: { readonly services: Services; readonly children: ReactNode }) =>
  <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;

export const useServices = (): Services => {
  const s = useContext(ServicesContext);
  if (!s) throw new Error('AppProvider missing');
  return s;
};
export const useApi = (): LearningApi => useServices().api;
export const useClock = () => useServices().clock;
export const useRandom = () => useServices().random;

const shallowEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every(k => Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
};

/**
 * Subscribe to a derived slice. The selection is recomputed only when the state changes, and a
 * shallow-equal result is reused, so selectors may freely build small objects.
 */
export const useAppState = <T,>(select: (s: AppState) => T): T => {
  const api = useApi();
  const cache = useRef<{ state: AppState; value: T } | null>(null);
  const getSnapshot = (): T => {
    const state = api.getState(), c = cache.current;
    if (c && c.state === state) return c.value;
    const value = select(state);
    const keep = c && shallowEqual(c.value, value) ? c.value : value;
    cache.current = { state, value: keep };
    return keep;
  };
  return useSyncExternalStore(api.subscribe, getSnapshot, getSnapshot);
};
export const useProgress = <T,>(select: (p: Progress) => T): T => useAppState(s => select(s.progress));

/**
 * Publish a lab's current state as a typed signal; re-reports only when the value changes
 * structurally. Labs must choose initial states that do NOT satisfy their own practice tasks
 * (enforced by the "fresh course" test).
 */
export const useSignal = <K extends keyof Signals>(key: K, value: NonNullable<Signals[K]>): void => {
  const api = useApi();
  const json = JSON.stringify(value);
  const latest = useRef(value);
  latest.current = value;
  useEffect(() => { api.reportSignal(key, latest.current); }, [api, key, json]);
};

/**
 * useState that survives reloads, through the injected `LabSettingsRepository`. Values are validated
 * by `schema` on read. Use it for lab controls, not for practice progress.
 */
export const usePersistedState = <T,>(key: string, schema: Decoder<T>, initial: T): readonly [T, (next: T | ((prev: T) => T)) => void] => {
  const { settings } = useServices();
  const [value, setValue] = useState<T>(() => settings.read(key, schema) ?? initial);
  useEffect(() => { settings.write(key, value); }, [settings, key, value]);
  const set = useCallback((next: T | ((prev: T) => T)) => setValue(next), []);
  return [value, set] as const;
};
