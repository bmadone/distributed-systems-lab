import { LESSONS } from './catalog';
import { MATCHERS, SORTERS } from './exercises';
import { LESSON_IDS } from './ids';

// Data invariants the type system can't express.
describe('course data', () => {
  it('has every lesson exactly once, in order', () => {
    expect(LESSONS.map(l => l.id)).toEqual([...LESSON_IDS]);
  });

  it.each(LESSONS.map(l => [l.id, l] as const))('%s: answers point at real options', (_, l) => {
    expect(l.predict.a).toBeGreaterThanOrEqual(0);
    expect(l.predict.a).toBeLessThan(l.predict.opts.length);
    l.quiz.forEach(q => { expect(q.a).toBeGreaterThanOrEqual(0); expect(q.a).toBeLessThan(q.opts.length); });
    expect(new Set(l.quiz.map(q => q.q)).size).toBe(l.quiz.length);
  });

  it.each(LESSONS.map(l => [l.id, l] as const))('%s: has a complete learning loop', (_, l) => {
    expect(l.objectives.length).toBeGreaterThan(0);
    expect(l.practice.length).toBeGreaterThanOrEqual(8);
    expect(l.quiz.length).toBeGreaterThanOrEqual(10);
    expect(l.cards.length).toBeGreaterThan(0);
    expect(l.takeaways.length).toBeGreaterThan(0);
    l.practice.forEach(t => { if (t.kind === 'num') expect(t.tol).toBeGreaterThanOrEqual(0); });
  });

  it('sorter and matcher answers are valid', () => {
    Object.values(SORTERS).forEach(s => s.items.forEach(it => expect(it.answer).toBeLessThan(s.cats.length)));
    Object.values(MATCHERS).forEach(m => m.items.forEach(it => expect(m.opts).toContain(it.answer)));
  });
});
