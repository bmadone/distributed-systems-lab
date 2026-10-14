import { useState } from 'react';
import { LESSONS } from '../../domain/curriculum/catalog';
import { SCENARIOS } from '../../domain/curriculum/exercises';
import type { QuizItem } from '../../domain/curriculum/types';
import { seededShuffle } from '../../domain/shared-kernel/fp';
import { useApi, useProgress, useRandom } from '../hooks/app';
import { Options } from '../ui/Options';
import { Rich } from '../ui/primitives';

interface MixedQ extends QuizItem { readonly lesson: string }
const POOL: readonly MixedQ[] = LESSONS.flatMap(l => l.quiz.map(q => ({ ...q, lesson: l.title })));
const roll = (seed: number): readonly MixedQ[] => seededShuffle(String(seed), POOL).slice(0, 10);
const CATS = ['All', ...new Set(SCENARIOS.map(s => s.cat))];

export const ExamPage = () => {
  const scen = useProgress(p => p.scen);
  const exams = useProgress(p => p.exams);
  const api = useApi();
  const random = useRandom();
  const [cat, setCat] = useState('All');
  const [mixed, setMixed] = useState(() => roll(random.next()));
  const [answers, setAnswers] = useState<Readonly<Record<number, number>>>({});

  const sn = Object.keys(scen).length;
  const sr = SCENARIOS.filter((s, i) => scen[i] === s.a).length;
  const mn = Object.keys(answers).length;
  const mr = mixed.filter((q, i) => answers[i] === q.a).length;
  const bestExam = exams.reduce((b, e) => Math.max(b, e.right), 0);

  const answer = (qi: number, choice: number) => {
    const next = { ...answers, [qi]: choice };
    setAnswers(next);
    if (Object.keys(next).length === mixed.length) api.finishExam(mixed.filter((q, i) => next[i] === q.a).length, mixed.length);
  };

  return (
    <section className="lesson" aria-labelledby="h-exam">
      <div className="lhead">
        <span className="eyebrow">Consolidate</span>
        <h2 tabIndex={-1} id="h-exam">Final exam</h2>
        <p className="hint">Two parts: CAP calls on realistic scenarios, then ten questions drawn at random from every lesson. Mixing topics (interleaving) is harder than one topic at a time, and it sticks better.</p>
      </div>
      <div className="panel">
        <div className="row"><h4>Part 1 · CP or AP?</h4>
          <span className="hint">{sr}/{sn} correct · {SCENARIOS.length - sn} left {sn > 0 && <button type="button" className="linkbtn" onClick={() => api.resetScenarios()}>Reset</button>}</span></div>
        <div className="chips">{CATS.map(c => <button key={c} type="button" className="chip" aria-pressed={c === cat} onClick={() => setCat(c)}>{c}</button>)}</div>
        {SCENARIOS.map((s, i) => {
          if (cat !== 'All' && s.cat !== cat) return null;
          const p = scen[i];
          const btn = (v: 'CP' | 'AP', label: string) => (
            <button type="button" className={`opt ${p ? (v === s.a ? 'right' : p === v ? 'wrong' : '') : ''}`} aria-disabled={p !== undefined} style={{ gridTemplateColumns: '1fr' }}
              onClick={() => { if (!p) api.answerScenario(i, v); }}><span>{label}</span></button>
          );
          return (
            <div className="qitem" key={i}>
              <span className="eyebrow">{s.cat}</span><Rich as="p" html={s.q} />
              <div className="grid2">{btn('CP', 'Protect consistency (CP)')}{btn('AP', 'Protect availability (AP)')}</div>
              {p && <p className="fb"><b>{p === s.a ? 'Correct.' : `Better choice: ${s.a}.`}</b> <Rich html={s.why} /></p>}
            </div>
          );
        })}
      </div>
      <div className="panel">
        <div className="row"><h4>Part 2 · Mixed questions</h4>
          <span className="hint">{mr}/{mn} correct{exams.length ? ` · ${exams.length} attempts, best ${bestExam}/10` : ''} <button type="button" className="linkbtn" onClick={() => { setMixed(roll(random.next())); setAnswers({}); }}>New set</button></span></div>
        {mixed.map((q, qi) => (
          <div className="qitem" key={`${q.q}-${qi}`}>
            <span className="eyebrow">{q.lesson}</span><Rich as="p" className="qq" html={q.q} />
            <Options seed={`x${q.q}`} opts={q.opts} answer={q.a} pick={answers[qi]} onPick={c => answer(qi, c)} />
            {answers[qi] !== undefined && <p className="fb"><b>{answers[qi] === q.a ? 'Correct.' : 'Not quite.'}</b> <Rich html={q.why} /></p>}
          </div>
        ))}
      </div>
    </section>
  );
};
