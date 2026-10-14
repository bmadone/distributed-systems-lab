import { z } from 'zod';
import { usePersistedState, useSignal } from '../../hooks/app';
import { Panel, Slider, Verdict } from '../../ui/primitives';
import { DEFAULT_T, DELAYS, detectionSeconds, detectionTone, falseSuspicions, suspicionTone, T_MAX, T_MIN, T_STEP, yOf } from '../../../domain/simulation/failure-detector/model';

const schema = z.number().int().min(T_MIN).max(T_MAX);

export const FailureDetectorLab = () => {
  const [T, setT] = usePersistedState('failureDetector', schema, DEFAULT_T);
  const f = falseSuspicions(T);
  useSignal('failureDetector', { T, falseCount: f });
  const yT = yOf(T);
  return (
    <Panel title="Tune a failure detector" hint="A node sends a heartbeat every second. Below are 200 measured heartbeat delays, including a few garbage-collection pauses. Any delay longer than the timeout makes the monitor wrongly declare the node dead. When the node really crashes, the monitor needs the whole timeout to notice.">
      <Slider label="Timeout" sub="declare dead after" value={T} min={T_MIN} max={T_MAX} step={T_STEP} format={v => `${v} ms`} onChange={setT} />
      <div className="svgbox">
        <svg viewBox="0 0 640 170" role="img" aria-label="Heartbeat delays with timeout line">
          {DELAYS.map((v, i) => (
            <rect key={i} x={20 + i * 3} y={yOf(v)} width={2.2} height={150 - yOf(v)} className={v > T ? 'fill-bad' : 'fill-muted'} opacity={v > T ? 1 : 0.55} />
          ))}
          <line x1={15} x2={625} y1={yT} y2={yT} stroke="var(--accent)" strokeWidth={2} strokeDasharray="6 4" />
          <text x={625} y={yT - 6} textAnchor="end" className="sv-text" fill="var(--accent)">timeout {T} ms</text>
          <text x={20} y={166} className="sv-muted">200 heartbeats →</text>
        </svg>
      </div>
      <div className="grid2">
        <Verdict tone={suspicionTone(f)} title={`${f} false suspicion${f === 1 ? '' : 's'}`}>
          {f ? 'The node was healthy, just slow, but would have been declared dead and possibly failed over.' : 'No healthy node would be declared dead.'}
        </Verdict>
        <Verdict tone={detectionTone(T)} title={`Crash detected after ~${detectionSeconds(T).toFixed(2)} s`}>
          After a real crash, clients wait this long before the system reacts.
        </Verdict>
      </div>
    </Panel>
  );
};

export type { FailureDetectorSignal } from '../../../domain/simulation/failure-detector/signal';
