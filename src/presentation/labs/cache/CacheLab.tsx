import { useMemo } from 'react';
import { z } from 'zod';
import { pct } from '../../../domain/shared-kernel/fp';
import { usePersistedState, useSignal } from '../../hooks/app';
import { Panel, Slider, Stat } from '../../ui/primitives';
import { initialConfig, roundSkew, simulate, SIZE, SKEW } from '../../../domain/simulation/cache/model';

const schema = z.object({ size: z.number().int().min(SIZE.min).max(SIZE.max), skew: z.number().min(SKEW.min).max(SKEW.max) });

export const CacheLab = () => {
  const [c, setConfig] = usePersistedState('cache', schema, initialConfig);
  const a = useMemo(() => simulate(c), [c]);
  useSignal('cache', { size: a.size, skew: a.skew, hit: a.hit, ideal: a.ideal, latencyMs: a.latencyMs, dbPer1000: a.dbPer1000 });

  return (
    <Panel title="LRU cache in front of a database" hint="1,000 products. Popularity follows a Zipf distribution: a few items get most of the traffic. Cache hits take 1 ms, and misses go to the database and take 21 ms.">
      <div className="grid2">
        <Slider label="Cache size" sub="items" value={c.size} min={SIZE.min} max={SIZE.max} step={SIZE.step} onChange={size => setConfig(prev => ({ ...prev, size }))} />
        <Slider label="Popularity skew" sub="Zipf s" value={a.skew} min={SKEW.min} max={SKEW.max} step={SKEW.step} format={v => v.toFixed(1)} onChange={skew => setConfig(prev => ({ ...prev, skew: roundSkew(skew) }))} />
      </div>
      <div className="stats">
        <Stat tone="ok" value={pct(a.hit, 0)} label="Hit ratio (LRU)" />
        <Stat value={pct(a.ideal, 0)} label={`Best possible: top ${a.size} items`} />
        <Stat tone={a.latencyMs < 6 ? 'ok' : 'warn'} value={`${a.latencyMs.toFixed(1)} ms`} label="Average latency" />
        <Stat tone={a.hit > 0.8 ? 'ok' : 'bad'} value={a.dbPer1000} label="DB queries per 1,000 requests" />
      </div>
    </Panel>
  );
};

export type { CacheSignal } from '../../../domain/simulation/cache/signal';
