import { useMemo, useState } from 'react';
import { BOX_DAYS } from '../../domain/review/srs';
import { useApi, useClock, useProgress, useRandom } from '../hooks/app';
import { Rich } from '../ui/primitives';
import { dueCards, unlockedCards } from '../../domain/learning/deck';

export const ReviewPage = () => {
  const progress = useProgress(p => p);
  const api = useApi();
  const clock = useClock();
  const random = useRandom();
  const [now, setNow] = useState(() => clock.now());
  const [shown, setShown] = useState(false);
  const unlocked = unlockedCards(progress);
  const due = dueCards(progress, now);
  // Pick a random due card; stable until it is graded.
  const [seed, setSeed] = useState(() => random.next());
  const card = useMemo(() => due[Math.floor(seed * due.length)], [due, seed]);
  const boxes = [0, 1, 2, 3, 4].map(b => unlocked.filter(c => (progress.cards[c.id]?.box ?? 0) === b).length);

  const gradeCard = (ok: boolean) => {
    if (!card) return;
    api.gradeCard(card.id, ok);
    setShown(false); setSeed(random.next()); setNow(clock.now());
  };

  return (
    <section className="lesson" aria-labelledby="h-review">
      <div className="lhead">
        <span className="eyebrow">Consolidate</span>
        <h2 tabIndex={-1} id="h-review">Spaced review</h2>
        <p className="hint">Cards from every lesson you&apos;ve opened. A card you get right moves up a box and comes back after {BOX_DAYS.slice(1).join(', ')} days; a miss sends it back to box 1.</p>
      </div>
      <div className="boxes">
        <span>{unlocked.length} cards unlocked</span><span>{due.length} due now</span>
        {boxes.map((n, i) => <span key={i}>Box {i + 1}: {n}</span>)}
      </div>
      {unlocked.length === 0 ? (
        <div className="review-card"><p className="front">No cards yet</p><p className="hint">Open any lesson and its flashcards unlock here.</p></div>
      ) : !card ? (
        <div className="review-card">
          <p className="front">All caught up</p>
          <p className="hint">Next card due {new Date(Math.min(...unlocked.map(c => progress.cards[c.id]?.due ?? 0))).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}. Unlock more by opening new lessons.</p>
          <div className="row"><button type="button" className="btn" onClick={() => { api.cramCards(); setNow(clock.now()); }}>Review all anyway</button></div>
        </div>
      ) : (
        <div className="review-card">
          <span className="eyebrow">{card.lessonTitle} · box {(progress.cards[card.id]?.box ?? 0) + 1}</span>
          <Rich as="p" className="front" html={card.front} />
          {shown ? (
            <>
              <Rich as="p" className="back" html={card.back} />
              <div className="row">
                <span className="hint">Be honest. It&apos;s only for you.</span>
                <div className="chips">
                  <button type="button" className="btn" onClick={() => gradeCard(false)}>I missed it</button>
                  <button type="button" className="btn primary" onClick={() => gradeCard(true)}>I got it</button>
                </div>
              </div>
            </>
          ) : (
            <div className="row"><span className="hint">Say the answer out loud or in your head first.</span><button type="button" className="btn primary" onClick={() => setShown(true)}>Show answer</button></div>
          )}
        </div>
      )}
    </section>
  );
};
