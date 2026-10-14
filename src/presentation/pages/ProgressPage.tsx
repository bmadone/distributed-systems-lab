import { useState } from 'react';
import { LESSONS } from '../../domain/curriculum/catalog';

import {  sum } from '../../domain/shared-kernel/fp';
import { dayKey } from '../../domain/learning/progress';
import { useApi, useClock, useProgress, useServices } from '../hooks/app';
import { Stat } from '../ui/primitives';
import { fmtDate, fmtDuration } from './format';
import { ALL_CARDS } from '../../domain/learning/deck';
import { HEAT_DAYS, summarize } from '../../domain/learning/summary';

const DAY = 86_400_000;
const DataControls = () => {
  const progress = useProgress(p => p);
  const api = useApi();
  const clock = useClock();
  const { codec, settings } = useServices();
  const [mode, setMode] = useState<'idle' | 'export' | 'import' | 'reset'>('idle');
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const json = codec.encode(progress);

  const copy = async () => {
    try { await navigator.clipboard.writeText(json); setMsg('Copied to clipboard.'); } catch { setMsg('Copy failed: select the text and copy it manually.'); }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `ds-lab-progress-${dayKey(clock.now())}.json` });
    a.click(); URL.revokeObjectURL(url);
  };
  const doImport = () => {
    const imported = codec.decode(text);
    if (!imported) return setMsg('That doesn’t look like a progress file.');
    api.importProgress(imported);
    setMode('idle'); setText('');
    return setMsg('Progress imported.');
  };

  return (
    <div className="panel dataio">
      <div className="row"><h4>Your data</h4><span className="hint">Stored only in this browser (localStorage), saved after every action.</span></div>
      <div className="chips">
        <button type="button" className="btn" onClick={() => { setMode('export'); setMsg(''); }}>Export</button>
        <button type="button" className="btn" onClick={() => { setMode('import'); setMsg(''); }}>Import</button>
        <button type="button" className="btn" onClick={() => { setMode('reset'); setMsg(''); }}>Reset all progress…</button>
      </div>
      {mode === 'export' && <>
        <textarea readOnly value={json} aria-label="Progress JSON" onFocus={e => e.target.select()} />
        <div className="chips"><button type="button" className="btn primary" onClick={() => void copy()}>Copy</button><button type="button" className="btn" onClick={download}>Download .json</button></div>
      </>}
      {mode === 'import' && <>
        <textarea value={text} onChange={e => setText(e.target.value)} aria-label="Paste progress JSON" placeholder="Paste an exported progress file…" />
        <div className="chips"><button type="button" className="btn primary" disabled={!text.trim()} onClick={doImport}>Replace my progress with this</button></div>
      </>}
      {mode === 'reset' && (
        <div className="confirm" role="alertdialog" aria-label="Confirm reset">
          <span>This deletes every answer, note, flashcard schedule and lab setting in this browser. It can’t be undone.</span>
          <button type="button" className="btn" onClick={() => setMode('idle')}>Cancel</button>
          <button type="button" className="btn primary" onClick={() => { settings.clearAll(); api.resetProgress(); setMode('idle'); setMsg('Progress reset.'); window.location.reload(); }}>Delete everything</button>
        </div>
      )}
      {msg && <p className="hint" aria-live="polite">{msg}</p>}
    </div>
  );
};

export const ProgressPage = () => {
  const progress = useProgress(p => p);
  const clock = useClock();
  const s = summarize(progress, clock.now());
  const maxHeat = Math.max(1, ...s.heat);
  const nextUp = s.statuses.find(x => !x.st.done)?.lesson;
  return (
    <section className="lesson" aria-labelledby="h-progress">
      <div className="lhead">
        <span className="eyebrow">Consolidate</span>
        <h2 tabIndex={-1} id="h-progress">My progress</h2>
        {nextUp && <p>Next up: <a href={`#${nextUp.id}`}>{nextUp.title}</a></p>}
      </div>
      <div className="stats">
        <Stat value={`${s.lessonsDone}/${LESSONS.length}`} label="lessons complete" tone={s.lessonsDone === LESSONS.length ? 'ok' : undefined} />
        <Stat value={`${s.tasksDone}/${s.tasksTotal}`} label="practice tasks" />
        <Stat value={s.accuracy === null ? '—' : `${Math.round(s.accuracy * 100)}%`} label="quiz accuracy" />
        <Stat value={`${s.streak} ${s.streak === 1 ? 'day' : 'days'}`} label="current streak" tone={s.streak > 0 ? 'ok' : undefined} />
        <Stat value={fmtDuration(s.timeMs)} label="active time" />
        <Stat value={`${s.mastered}/${ALL_CARDS.length}`} label="flashcards in box 4+" />
        <Stat value={progress.exams.length} label="exam attempts" />
        <Stat value={Object.keys(progress.scen).length} label="CAP scenarios answered" />
      </div>
      <div className="panel dash">
        <h4>By part</h4>
        {s.parts.map(({ part, done, total }) => (
          <div className="partrow" key={part.id}><span>{part.title}</span><span className="track"><i style={{ width: `${(100 * done) / total}%` }} /></span><span className="v">{done}/{total}</span></div>
        ))}
      </div>
      <div className="panel dash">
        <div className="row"><h4>Activity, last 12 weeks</h4><span className="hint">{sum(s.heat)} learning actions</span></div>
        <div className="heat" role="img" aria-label={`Activity heatmap: ${s.heat.filter(Boolean).length} active days in the last ${HEAT_DAYS}`}>
          {s.heat.map((n, i) => <i key={i} className={n === 0 ? '' : n <= maxHeat / 3 ? 'l1' : n <= (2 * maxHeat) / 3 ? 'l2' : 'l3'} title={`${dayKey(clock.now() - (HEAT_DAYS - 1 - i) * DAY)}: ${n}`} />)}
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Lesson</th><th>Predict</th><th>Practice</th><th>Quiz (best)</th><th>Time</th><th>Completed</th></tr></thead>
          <tbody>
            {s.statuses.map(({ lesson, st }) => (
              <tr key={lesson.id}>
                <td><a href={`#${lesson.id}`}>{lesson.title}</a></td>
                <td>{st.predicted ? '✓' : '—'}</td>
                <td className="mono">{st.tasksDone}/{st.tasksTotal}</td>
                <td className="mono">{st.quizAnswered ? `${st.quizRight}/${st.quizTotal}` : '—'}{progress.quizBest[lesson.id] !== undefined ? ` (${progress.quizBest[lesson.id]})` : ''}</td>
                <td className="mono">{progress.timeMs[lesson.id] ? fmtDuration(progress.timeMs[lesson.id] ?? 0) : '—'}</td>
                <td>{fmtDate(progress.completed[lesson.id])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DataControls />
    </section>
  );
};
