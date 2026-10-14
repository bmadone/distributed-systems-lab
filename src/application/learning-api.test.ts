import { LESSONS } from '../domain/curriculum/catalog';
import { progressRepositoryContract } from './testing/progress-repository.contract';
import { FIXED_NOW, createTestServices, inMemoryProgressRepository } from './testing/in-memory';
import { createLearningApi } from './learning-api';

progressRepositoryContract('in-memory', () => inMemoryProgressRepository());

describe('LearningApi', () => {
  it('stamps actions with the injected clock and saves after each change', () => {
    const s = createTestServices();
    s.api.visit('cap');
    s.api.predict('cap', 1);
    expect(s.api.getState().progress.visited.cap).toBe(FIXED_NOW);
    expect(s.progress.load().predict.cap).toBe(1);
    expect(s.progress.saves()).toBe(2);
  });

  it('does not save or notify when nothing changed', () => {
    const s = createTestServices();
    let notified = 0;
    s.api.subscribe(() => { notified++; });
    s.api.predict('cap', 1);
    s.api.predict('cap', 2);
    expect(notified).toBe(1);
    expect(s.progress.saves()).toBe(1);
  });

  it('completes tasks from reported signals and records completion time', () => {
    const s = createTestServices();
    s.api.reportSignal('quorum', { N: 3, W: 2, R: 2, canW: true, canR: true, overlap: true, writesIntersect: true, writeMs: 3, readMs: 3, downCount: 0 });
    const done = s.api.getState().progress.practice.quorums ?? {};
    expect(done[0]).toBe(true);
  });

  it('loads existing progress from the repository on creation', () => {
    const s = createTestServices();
    s.api.saveNote('cap', 'remember');
    const again = createLearningApi({ lessons: LESSONS, progress: s.progress, clock: s.clock });
    expect(again.getState().progress.notes.cap).toBe('remember');
  });

  it('resetProgress clears the repository and state', () => {
    const s = createTestServices();
    s.api.saveNote('cap', 'x');
    s.api.resetProgress();
    expect(s.api.getState().progress.notes).toEqual({});
    expect(s.progress.load().notes).toEqual({});
  });
});
