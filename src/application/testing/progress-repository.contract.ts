import { emptyProgress, type Progress } from '../../domain/learning/progress';
import type { ProgressRepository } from '../ports';

/** Behaviour every `ProgressRepository` adapter must share. Call from each adapter's own test file. */
export const progressRepositoryContract = (name: string, make: () => ProgressRepository): void => {
  describe(`ProgressRepository contract: ${name}`, () => {
    const sample: Progress = { ...emptyProgress, predict: { cap: 2 }, notes: { cap: 'hello' }, activity: { '2026-10-14': 3 } };

    it('loads empty progress when nothing is stored', () => {
      expect(make().load()).toEqual(emptyProgress);
    });
    it('round-trips saved progress', () => {
      const repo = make();
      repo.save(sample);
      expect(repo.load()).toEqual(sample);
    });
    it('clear forgets everything', () => {
      const repo = make();
      repo.save(sample);
      repo.clear();
      expect(repo.load()).toEqual(emptyProgress);
    });
  });
};
