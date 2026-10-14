import { z } from 'zod';
import { pct } from '../../../domain/shared-kernel/fp';
import { usePersistedState, useSignal } from '../../hooks/app';
import { Panel, Toggle, Verdict } from '../../ui/primitives';
import { adjust, analyze, fmtDur, initialAvail, normalize, TIERS } from '../../../domain/simulation/availability/model';

const schema = z.object({ counts: z.array(z.number().int()), degrade: z.boolean() });

export const AvailabilityLab = () => {
  const [raw, setConfig] = usePersistedState('availability', schema, initialAvail);
  const c = normalize(raw);
  const a = analyze(c);
  useSignal('availability', { total: a.total, instances: a.instances, weakest: a.weakest, counts: c.counts, degrade: c.degrade });
  const weakest = TIERS[a.weakest];

  return (
    <Panel title="Availability builder" hint="Requests pass through every tier in series. Add instances to a tier to make it redundant.">
      <div style={{ display: 'grid', gap: 8 }}>
        {TIERS.map((t, i) => {
          const n = c.counts[i] ?? 1, opt = a.optional[i] === true;
          return (
            <div key={t.n} className="row" style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px', opacity: opt ? 0.6 : undefined }}>
              <span style={{ minWidth: 130 }}><b>{t.n}</b><br /><span className="hint">{pct(t.a, 2)} each</span></span>
              <span className="chips">
                <button type="button" className="btn" aria-label={`Remove ${t.n} instance`} onClick={() => setConfig(prev => adjust(normalize(prev), i, -1))}>−</button>
                <b className="mono">×{n}</b>
                <button type="button" className="btn" aria-label={`Add ${t.n} instance`} onClick={() => setConfig(prev => adjust(normalize(prev), i, 1))}>+</button>
              </span>
              <span className="mono">{opt ? 'optional' : pct(a.tierA[i] ?? 0, 4)}</span>
            </div>
          );
        })}
      </div>
      <Toggle label="App falls back to the database when the cache is down (graceful degradation)" checked={c.degrade} onChange={degrade => setConfig(prev => ({ ...normalize(prev), degrade }))} />
      <div className="grid2">
        <Verdict tone={a.total >= 0.9999 ? 'good' : a.total >= 0.999 ? 'warn' : 'bad'} title={`Overall ${pct(a.total, 4)}`}>
          About {fmtDur(a.downPerYear)} of downtime per year, {fmtDur(a.downPerYear / 12)} per month. {a.instances} instances.
        </Verdict>
        <Verdict tone="info" title={`Weakest link: ${weakest?.n ?? ''}`}>Adding redundancy there helps most.</Verdict>
      </div>
    </Panel>
  );
};

export type { AvailabilitySignal } from '../../../domain/simulation/availability/signal';
