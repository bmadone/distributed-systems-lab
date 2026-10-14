import { useState } from 'react';
import { LESSONS } from '../../domain/curriculum/catalog';
import { PARTS } from '../../domain/curriculum/ids';
import type { Lesson, Task } from '../../domain/curriculum/types';
import { lessonStatus } from '../../domain/learning/progress';
import { LESSON_BODIES } from '../lessons';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { useApi, useProgress } from '../hooks/app';
import { Options } from '../ui/Options';
import { Rich } from '../ui/primitives';

// The fixed learning loop around each lesson body:
// objectives → predict → learn & explore → practice → quiz → reflect → flashcards.

const BlockLabel = ({ children }: { readonly children: string }) => <div className="block-label"><span className="eyebrow">{children}</span></div>;

const Head = ({ lesson }: { readonly lesson: Lesson }) => {
  const st = useProgress(p => lessonStatus(lesson, p));
  const part = PARTS.find(p => p.id === lesson.part);
  return (
    <div className="lhead">
      <span className="eyebrow">{part?.title} · Lesson {LESSONS.indexOf(lesson) + 1} of {LESSONS.length}</span>
      <h2 tabIndex={-1} id={`h-${lesson.id}`}>{lesson.title}</h2>
      <div className="meta">
        <span>About {lesson.minutes} min</span>
        <span>{st.tasksDone}/{st.tasksTotal} practice tasks</span>
        <span>{st.quizAnswered ? `${st.quizRight}/${st.quizTotal} quiz` : `${st.quizTotal}-question quiz`}</span>
      </div>
      <div className="objectives"><span className="eyebrow">By the end you can</span><ul>{lesson.objectives.map(o => <li key={o}>{o}</li>)}</ul></div>
      {st.done && (
        <div className="complete-banner" role="status">
          Lesson complete <span>· its flashcards are in your spaced review deck.</span>
          {LESSONS[LESSONS.indexOf(lesson) + 1] && <a className="btn primary" href={`#${LESSONS[LESSONS.indexOf(lesson) + 1]?.id}`}>Next lesson →</a>}
        </div>
      )}
    </div>
  );
};

const PredictBlock = ({ lesson }: { readonly lesson: Lesson }) => {
  const pick = useProgress(p => p.predict[lesson.id]);
  const api = useApi();
  const p = lesson.predict;
  return (
    <>
      <BlockLabel>1 · Predict first</BlockLabel>
      <div className="predict">
        <p className="hint">Make a quick guess before reading. Committing to an answer, even a wrong one, helps you remember the explanation.</p>
        <Rich as="p" html={`<b>${p.q}</b>`} />
        <Options seed={`p${lesson.id}`} opts={p.opts} answer={p.a} pick={pick} onPick={choice => api.predict(lesson.id, choice)} />
        {pick !== undefined && <p className="fb" aria-live="polite"><b>{pick === p.a ? 'Good instinct.' : 'Common guess, but not quite.'}</b> <Rich html={p.reveal} /></p>}
      </div>
      <BlockLabel>2 · Learn and explore</BlockLabel>
    </>
  );
};

const NumTask = ({ lesson, index, task }: { readonly lesson: Lesson; readonly index: number; readonly task: Extract<Task, { kind: 'num' }> }) => {
  const api = useApi();
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState('');
  const check = () => {
    const v = Number.parseFloat(value);
    if (Number.isNaN(v)) return setFeedback('Enter a number.');
    if (Math.abs(v - task.answer) <= task.tol) return api.solveNumeric(lesson.id, index);
    return setFeedback(v < task.answer ? 'Too low. Try again.' : 'Too high. Try again.');
  };
  return (
    <form className="num" onSubmit={e => { e.preventDefault(); check(); }}>
      <input type="number" step="any" inputMode="decimal" aria-label="Your answer" value={value} onChange={e => setValue(e.target.value)} />
      <span className="hint">{task.unit ?? ''}</span>
      <button type="submit" className="btn">Check</button>
      <span className="numfb bad" aria-live="polite">{feedback}</span>
    </form>
  );
};

const PracticeBlock = ({ lesson }: { readonly lesson: Lesson }) => {
  const done = useProgress(p => p.practice[lesson.id]);
  return (
    <>
      <BlockLabel>3 · Practice</BlockLabel>
      <div className="practice">
        <p className="hint">Hands-on tasks. They check off automatically when you do them in the labs above.</p>
        <ul className="tasks">
          {lesson.practice.map((t, i) => {
            const ok = done?.[i] === true;
            return (
              <li key={i} className={`task ${ok ? 'done' : ''}`}>
                <span className="box" aria-label={ok ? 'Done' : 'Not done'}>{ok ? '✓' : ''}</span>
                <div className="tt">
                  <Rich html={t.text} />
                  {t.kind === 'num' && (ok ? <span className="hint"> Answer: {t.answer} {t.unit ?? ''}</span> : <NumTask lesson={lesson} index={i} task={t} />)}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

const QuizBlock = ({ lesson }: { readonly lesson: Lesson }) => {
  const answers = useProgress(p => p.quiz[lesson.id]);
  const best = useProgress(p => p.quizBest[lesson.id]);
  const api = useApi();
  const a = answers ?? {};
  const n = lesson.quiz.filter((_, i) => a[i] !== undefined).length;
  const right = lesson.quiz.filter((q, i) => a[i] === q.a).length;
  return (
    <>
      <BlockLabel>4 · Quiz</BlockLabel>
      <div className="quiz">
        <div className="row">
          <p className="hint">Recall it without scrolling up. Retrieving an answer strengthens memory more than rereading.</p>
          <span className="hint mono">{n ? `${right}/${n} correct` : ''}{best !== undefined ? ` · best ${best}/${lesson.quiz.length}` : ''}</span>
        </div>
        {lesson.quiz.map((q, qi) => {
          const pick = a[qi];
          return (
            <div className="qitem" key={qi}>
              <Rich as="p" className="qq" html={`${qi + 1}. ${q.q}`} />
              <Options seed={`q${lesson.id}${qi}`} opts={q.opts} answer={q.a} pick={pick} onPick={choice => api.answerQuiz(lesson.id, qi, choice)} />
              {pick !== undefined && <p className="fb" aria-live="polite"><b>{pick === q.a ? 'Correct.' : 'Not quite.'}</b> <Rich html={q.why} /></p>}
            </div>
          );
        })}
        {n === lesson.quiz.length && (
          <div className="row">
            <span className="hint">{right === lesson.quiz.length ? 'Perfect score.' : 'Missed some? Your flashcards will bring this topic back in the spaced review.'}</span>
            <button type="button" className="linkbtn" onClick={() => api.retakeQuiz(lesson.id)}>Retake quiz</button>
          </div>
        )}
      </div>
    </>
  );
};

const Flashcard = ({ front, back }: { readonly front: string; readonly back: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <button type="button" className={`fcard ${open ? 'open' : ''}`} aria-expanded={open} onClick={() => setOpen(o => !o)}>
      <small>Click to flip</small><Rich as="b" html={front} />{open && <Rich as="p" html={back} />}
    </button>
  );
};

const ReflectBlock = ({ lesson }: { readonly lesson: Lesson }) => {
  const note = useProgress(p => p.notes[lesson.id] ?? '');
  const api = useApi();
  const [showModel, setShowModel] = useState(false);
  return (
    <>
      <BlockLabel>5 · Reflect</BlockLabel>
      <div className="reflect">
        <h4>Explain it back</h4>
        <p className="hint"><Rich html={lesson.explain.prompt} /> Writing it in your own words shows you what you&apos;ve really understood.</p>
        <textarea aria-label="Your explanation" placeholder="Type your explanation…" value={note} onChange={e => api.saveNote(lesson.id, e.target.value)} />
        <div className="row">
          <span className="hint">Saved automatically in this browser.</span>
          <button type="button" className="btn" disabled={note.trim().length < 30} onClick={() => setShowModel(true)}>Compare with a model answer</button>
        </div>
        {showModel && <div className="model"><b>Model answer:</b> <Rich html={lesson.explain.model} /></div>}
        <h4>Key takeaways</h4>
        <ul className="takeaways">{lesson.takeaways.map(t => <Rich as="li" key={t} html={t} />)}</ul>
        <h4>Flashcards from this lesson</h4>
        <div className="cards">{lesson.cards.map(([f, b]) => <Flashcard key={f} front={f} back={b} />)}</div>
      </div>
    </>
  );
};

const LessonNav = ({ lesson }: { readonly lesson: Lesson }) => {
  const i = LESSONS.indexOf(lesson), prev = LESSONS[i - 1], next = LESSONS[i + 1];
  return (
    <div className="lnav">
      {prev && <a href={`#${prev.id}`}><small>← Previous</small>{prev.title}</a>}
      {next ? <a className="next" href={`#${next.id}`}><small>Next →</small>{next.title}</a> : <a className="next" href="#review"><small>Next →</small>Spaced review</a>}
    </div>
  );
};

export const LessonPage = ({ lesson, hidden }: { readonly lesson: Lesson; readonly hidden: boolean }) => {
  const Body = LESSON_BODIES[lesson.id];
  return (
  <section className="lesson" hidden={hidden} aria-labelledby={`h-${lesson.id}`}>
    <Head lesson={lesson} />
    <PredictBlock lesson={lesson} />
    <div className="core" style={{ display: 'grid', gap: 28 }}><ErrorBoundary label={lesson.title}><Body /></ErrorBoundary></div>
    <PracticeBlock lesson={lesson} />
    <QuizBlock lesson={lesson} />
    <ReflectBlock lesson={lesson} />
    <LessonNav lesson={lesson} />
  </section>
  );
};
