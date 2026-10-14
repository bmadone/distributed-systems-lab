import { progressRepositoryContract } from '../../application/testing/progress-repository.contract';
import { fixedClock, FIXED_NOW } from '../../application/testing/in-memory';
import { emptyProgress } from '../../domain/learning/progress';
import { readJson } from '../storage/json-storage';
import { localStorageLabSettings } from './local-storage-lab-settings';
import { LEGACY_KEY, localStorageProgressRepository, PROGRESS_KEY } from './local-storage-progress';
import { fromLegacy, legacySchema, progressSchema } from './progress-schema';

beforeEach(() => localStorage.clear());

progressRepositoryContract('localStorage', () => { localStorage.clear(); return localStorageProgressRepository(fixedClock(FIXED_NOW)); });

describe('localStorage progress repository', () => {
  const repo = () => localStorageProgressRepository(fixedClock(FIXED_NOW));

  it('writes validated JSON under the versioned key', () => {
    repo().save({ ...emptyProgress, predict: { cap: 1 } });
    expect(readJson(PROGRESS_KEY, progressSchema)?.predict).toEqual({ cap: 1 });
  });
  it('falls back to empty progress on corrupt data', () => {
    localStorage.setItem(PROGRESS_KEY, '{not json');
    expect(repo().load()).toEqual(emptyProgress);
  });
  it('migrates the vanilla build key, stamping visits with the clock', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ predict: { quorums: 1 }, visited: { quorums: true }, scen: { 0: 'CP' } }));
    const p = repo().load();
    expect(p.predict.quorums).toBe(1);
    expect(p.visited.quorums).toBe(FIXED_NOW);
    expect(p.scen[0]).toBe('CP');
  });
  it('clear removes progress and the legacy key only', () => {
    localStorage.setItem(PROGRESS_KEY, '{}'); localStorage.setItem(LEGACY_KEY, '{}'); localStorage.setItem('unrelated', 'keep');
    repo().clear();
    expect(localStorage.length).toBe(1);
  });
});

describe('localStorage lab settings', () => {
  const num = { safeParse: (x: unknown) => (typeof x === 'number' ? { success: true as const, data: x } : { success: false as const }) };
  it('round-trips values and ignores invalid ones', () => {
    localStorageLabSettings.write('q', 7);
    expect(localStorageLabSettings.read('q', num)).toBe(7);
    localStorage.setItem('dsl:lab:bad', '"nope"');
    expect(localStorageLabSettings.read('bad', num)).toBeUndefined();
  });
  it('clearAll removes only lab keys', () => {
    localStorageLabSettings.write('q', 1); localStorage.setItem(PROGRESS_KEY, '{}');
    localStorageLabSettings.clearAll();
    expect(localStorage.getItem('dsl:lab:q')).toBeNull();
    expect(localStorage.getItem(PROGRESS_KEY)).toBe('{}');
  });
});

describe('legacy migration', () => {
  it('keeps answers and survives garbage', () => {
    const p = fromLegacy(legacySchema.parse({ predict: { cap: 1, bogus: 2 }, quiz: { cap: { 0: 1 } }, practice: { cap: { 1: true } }, visited: { cap: true } }), FIXED_NOW);
    expect(p.predict).toEqual({ cap: 1 });
    expect(p.quiz.cap).toEqual({ 0: 1 });
    expect(() => fromLegacy(legacySchema.parse({ predict: 'nope', quiz: [1] }), FIXED_NOW)).not.toThrow();
  });
});

describe('localStorage preferences', () => {
  it('defaults to the system theme, round-trips, and ignores invalid values', async () => {
    const { localStoragePreferences, PREFERENCES_KEY } = await import('./local-storage-preferences');
    expect(localStoragePreferences.load()).toEqual({ theme: 'system' });
    localStoragePreferences.save({ theme: 'dark' });
    expect(localStoragePreferences.load()).toEqual({ theme: 'dark' });
    localStorage.setItem(PREFERENCES_KEY, '{"theme":"sepia"}');
    expect(localStoragePreferences.load()).toEqual({ theme: 'system' });
  });
  it('survives progress reset', async () => {
    const { localStoragePreferences } = await import('./local-storage-preferences');
    localStoragePreferences.save({ theme: 'light' });
    localStorageProgressRepository(fixedClock(FIXED_NOW)).clear();
    localStorageLabSettings.clearAll();
    expect(localStoragePreferences.load()).toEqual({ theme: 'light' });
  });
});
