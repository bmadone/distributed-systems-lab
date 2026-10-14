import type { Decoder } from '../../application/ports';

export const readJson = <T,>(key: string, schema: Decoder<T>): T | undefined => {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (raw == null) return undefined;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
};

export const writeJson = (key: string, value: unknown): boolean => {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

export const removeKey = (key: string): void => {
  try { globalThis.localStorage?.removeItem(key); } catch { /* ignore */ }
};

export const keysWithPrefix = (prefix: string): readonly string[] => {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return [];
    return Array.from({ length: ls.length }, (_, i) => ls.key(i)).filter((k): k is string => k !== null && k.startsWith(prefix));
  } catch {
    return [];
  }
};
