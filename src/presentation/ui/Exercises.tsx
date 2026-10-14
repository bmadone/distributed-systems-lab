import type { ReactNode } from 'react';
import { z } from 'zod';
import { MATCHERS, SORTERS, type MatcherConfig, type SorterConfig } from '../../domain/curriculum/exercises';
import type { MatcherId, SorterId } from '../../domain/curriculum/ids';
import { usePersistedState, useSignal } from '../hooks/app';
import { Rich } from './primitives';

// Pure scoring, shared by the components and tests.
export const scoreSorter = (cfg: SorterConfig, picks: Readonly<Record<number, number>>) => {
  const right = cfg.items.filter((it, i) => picks[i] === it.answer).length;
  return { right, total: cfg.items.length, allRight: right === cfg.items.length };
};
export const scoreMatcher = (cfg: MatcherConfig, picks: Readonly<Record<number, string>>) => {
  const right = cfg.items.filter((it, i) => picks[i] === it.answer).length;
  return { right, total: cfg.items.length, allRight: right === cfg.items.length };
};

const sorterPicks = z.record(z.string(), z.number().int());
const matcherPicks = z.record(z.string(), z.string());

/** Sort each item into a category; feedback is immediate. Publishes `sorter:<id>`. */
export const Sorter = ({ id, title, hint }: { readonly id: SorterId; readonly title: string; readonly hint?: ReactNode }) => {
  const cfg = SORTERS[id];
  const [picks, setPicks] = usePersistedState(`sorter:${id}`, sorterPicks, {});
  const score = scoreSorter(cfg, picks);
  useSignal(`sorter:${id}`, score);
  const answered = Object.keys(picks).length;
  return (
    <div className="panel">
      <div className="row"><h4>Lab · {title}</h4><span className="hint">{answered ? `${score.right} of ${score.total} correct` : `${score.total} to sort`}</span></div>
      {hint && <p className="hint">{hint}</p>}
      <div>
        {cfg.items.map((it, i) => {
          const p = picks[i];
          const cls = p === undefined ? '' : p === it.answer ? 'right' : 'wrong';
          return (
            <div key={i} className={`sortitem ${cls}`}>
              {cfg.mono ? <div className="history">{it.text}</div> : <Rich html={it.text} />}
              <div className="seg" role="group" aria-label="Category">
                {cfg.cats.map((c, ci) => <button key={c} type="button" aria-pressed={p === ci} onClick={() => setPicks(prev => ({ ...prev, [i]: ci }))}>{c}</button>)}
              </div>
              {it.why && p !== undefined && <span className="hint" style={{ gridColumn: '1 / -1' }}>{p === it.answer ? '✓' : '✗'} <Rich html={it.why} /></span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Match each item to an option from a dropdown. Publishes `matcher:<id>`. */
export const Matcher = ({ id, title, hint }: { readonly id: MatcherId; readonly title: string; readonly hint?: ReactNode }) => {
  const cfg = MATCHERS[id];
  const [picks, setPicks] = usePersistedState(`matcher:${id}`, matcherPicks, {});
  const score = scoreMatcher(cfg, picks);
  useSignal(`matcher:${id}`, score);
  return (
    <div className="panel">
      <div className="row"><h4>Lab · {title}</h4><span className="hint">{score.right} of {score.total} correct</span></div>
      {hint && <p className="hint">{hint}</p>}
      <div className="match">
        {cfg.items.map((it, i) => {
          const p = picks[i];
          return (
            <label key={i}>
              <span><Rich html={it.text} /> {p ? (p === it.answer ? <b className="ok">✓</b> : <b className="no">✗</b>) : null}</span>
              <select value={p ?? ''} onChange={e => { const v = e.target.value; setPicks(prev => ({ ...prev, [i]: v })); }}>
                <option value="">Choose…</option>
                {cfg.opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
          );
        })}
      </div>
    </div>
  );
};
