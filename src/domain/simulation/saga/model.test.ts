import { committedLocalTxns, compensationCount, currentFrame, failedRunMs, skippedCount, initialSaga, isRunning, resultText, sagaFrames, sagaReducer, type SagaFail, type SagaState } from './model';

const runToEnd = (fail: SagaFail): SagaState => {
  const go = (s: SagaState): SagaState => (isRunning(s) ? go(sagaReducer(s, { type: 'tick' })) : s);
  return go(sagaReducer(sagaReducer(initialSaga(), { type: 'select', fail }), { type: 'run' }));
};

describe('saga model', () => {
  it('a car failure compensates hotel then flight, and skips the card', () => {
    const frames = sagaFrames('car');
    expect(frames.at(-1)?.states).toEqual(['compensated', 'compensated', 'failed', 'skipped']);
    expect(frames.at(-1)?.log.map(e => e.text)).toEqual([
      'Cancel flight: undoes "Book flight".', 'Cancel hotel: undoes "Reserve hotel".',
      'Rent car failed. Running compensations in reverse order.',
      'Reserve hotel committed locally. Other services can already see it.', 'Book flight committed locally. Other services can already see it.',
    ]);
  });
  it('running to the end records the failed step', () => {
    const s = runToEnd('car');
    expect(s.ranFail).toBe('car');
    expect(resultText(s)).toBe('Trip cancelled cleanly, and the earlier steps were undone.');
    expect(runToEnd('none').ranFail).toBe('none');
    expect(currentFrame(runToEnd('none')).states).toEqual(['done', 'done', 'done', 'done']);
  });
  it('selection is locked while running and keeps the last ranFail afterwards', () => {
    const running = sagaReducer(initialSaga('hotel'), { type: 'run' });
    expect(sagaReducer(running, { type: 'select', fail: 'card' })).toBe(running);
    const after = sagaReducer(runToEnd('car'), { type: 'select', fail: 'none' });
    expect(after.ranFail).toBe('car');
    expect(currentFrame(after).states).toEqual(['pending', 'pending', 'pending', 'pending']);
  });
  it('the default does not solve any practice task', () => {
    expect(initialSaga().ranFail).toBeNull();
  });

  it('ran records every completed scenario once', () => {
    const go = (s: SagaState, fail: SagaFail): SagaState => {
      const run = (x: SagaState): SagaState => (isRunning(x) ? run(sagaReducer(x, { type: 'tick' })) : x);
      return run(sagaReducer(sagaReducer(s, { type: 'select', fail }), { type: 'run' }));
    };
    const s = (['hotel', 'card', 'none', 'car', 'hotel'] as const).reduce(go, initialSaga());
    expect(s.ran).toEqual(['hotel', 'card', 'none', 'car']);
    expect(initialSaga().ran).toEqual([]);
  });
  it('compensation counts match the frames', () => {
    const count = (fail: SagaFail) => sagaFrames(fail).at(-1)?.states ?? [];
    expect(count('hotel').filter(x => x === 'compensated')).toHaveLength(1);
    expect(count('card').filter(x => x === 'compensated')).toHaveLength(3);
    expect(count('none').filter(x => x === 'compensated')).toHaveLength(0);
    expect(compensationCount(2)).toBe(1);
    expect(compensationCount(4)).toBe(3);
    expect(count('car').filter(x => x === 'skipped')).toHaveLength(skippedCount(4, 3));
    const committed = (fail: SagaFail) => (sagaFrames(fail).at(-1)?.log ?? []).filter(e => e.tag !== 'bad').length;
    expect(committed('card')).toBe(committedLocalTxns(4));
    expect(committed('car')).toBe(committedLocalTxns(3));
    expect(committedLocalTxns(8)).toBe(14);
    expect(skippedCount(10, 8)).toBe(2);
    expect(failedRunMs(6, 40, 30)).toBe(390);
  });
});
