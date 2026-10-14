import { useEffect, useReducer } from 'react';
import { z } from 'zod';
import { Log, Panel } from '../../ui/primitives';
import { usePersistedState, useSignal } from '../../hooks/app';
import { currentFrame, FAIL_IDS, FAIL_OPTIONS, initialSaga, isRunning, resultText, SAGA, sagaReducer, STEP_COLOR, type SagaFail } from '../../../domain/simulation/saga/model';

const reducedMotion = (): boolean => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const SagaLab = () => {
  const [fail, setFail] = usePersistedState('saga', z.enum(FAIL_IDS), 'car');
  const [s, dispatch] = useReducer(sagaReducer, fail, initialSaga);
  useSignal('saga', { ranFail: s.ranFail, ran: s.ran });
  const running = isRunning(s);
  // Imperative shell: advance the pure run one frame at a time.
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => dispatch({ type: 'tick' }), reducedMotion() ? 0 : 450);
    return () => clearTimeout(t);
  }, [running, s.shown]);
  const frame = currentFrame(s);
  const select = (f: SagaFail) => { if (running) return; setFail(f); dispatch({ type: 'select', fail: f }); };

  return (
    <Panel title="Saga with compensations">
      <div className="chips"><span className="lbl">Make this step fail:</span>
        {FAIL_OPTIONS.map(o => <button key={o.value} type="button" className="chip" aria-pressed={s.fail === o.value} onClick={() => select(o.value)}>{o.label}</button>)}
      </div>
      <div className="row"><button type="button" className="btn primary" disabled={running} onClick={() => dispatch({ type: 'run' })}>Run saga</button><span className="hint">{resultText(s)}</span></div>
      <div className="ptrow">
        {SAGA.map((st, i) => {
          const state = frame.states[i] ?? 'pending';
          return <div className="pt" key={st.id}><b>{st.name}</b><span className="state" style={{ color: `var(--${STEP_COLOR[state]})` }}>{state}</span><span className="hint">Undo: {st.undo}</span></div>;
        })}
      </div>
      <Log entries={frame.log} label="Saga log" />
    </Panel>
  );
};

export type { SagaSignal } from '../../../domain/simulation/saga/signal';
