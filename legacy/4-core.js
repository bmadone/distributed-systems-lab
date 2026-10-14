// ================= CORE: state, navigation, learning loop =================
const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LKEY = 'ds-lab-course-v1';
const DAY = 86400000;
const BOX_DAYS = [0, 1, 3, 7, 14];

function loadState() {
  const base = { predict: {}, quiz: {}, practice: {}, notes: {}, cards: {}, visited: {}, last: null, scen: {} };
  try { const raw = localStorage.getItem(LKEY); if (raw) return Object.assign(base, JSON.parse(raw)); } catch (e) {}
  return base;
}
const ST = loadState();
function save() { try { localStorage.setItem(LKEY, JSON.stringify(ST)); } catch (e) {} }

const REGULAR = LESSONS.filter(l => !l.special);
const byId = Object.fromEntries(LESSONS.map(l => [l.id, l]));
let current = null;

function lessonDone(l) {
  if (l.special) return false;
  const p = ST.practice[l.id] || {}, q = ST.quiz[l.id] || {};
  return ST.predict[l.id] !== undefined && l.practice.every((_, i) => p[i]) && l.quiz.every((_, i) => q[i] !== undefined);
}
function lessonStarted(l) {
  return ST.predict[l.id] !== undefined || Object.keys(ST.practice[l.id] || {}).length || Object.keys(ST.quiz[l.id] || {}).length;
}

// ---------- cards / spaced repetition ----------
function allCards() {
  const out = [];
  REGULAR.forEach(l => (l.cards || []).forEach((c, i) => out.push({ id: l.id + ':' + i, lesson: l, front: c[0], back: c[1] })));
  return out;
}
function unlockedCards() { return allCards().filter(c => ST.visited[c.lesson.id]); }
function dueCards() {
  const now = Date.now();
  return unlockedCards().filter(c => { const s = ST.cards[c.id]; return !s || s.due <= now; });
}

// ---------- sidebar ----------
function renderNav() {
  $('nav').innerHTML = PARTS.map(p => {
    const ls = LESSONS.filter(l => l.part === p.id);
    return `<div class="part"><span>${p.title}</span>${ls.map(l => {
      const done = lessonDone(l), started = !done && lessonStarted(l);
      const n = REGULAR.indexOf(l) + 1;
      const due = l.id === 'review' ? dueCards().length : 0;
      return `<a class="navlink ${done ? 'done' : started ? 'started' : ''}" href="#${l.id}" ${l.id === current ? 'aria-current="page"' : ''}>
        <span class="st">${done ? '✓' : l.special ? '★' : n}</span><span>${l.title}</span>${due ? `<span class="badge">${due}</span>` : '<span></span>'}</a>`;
    }).join('')}</div>`;
  }).join('');
  const d = REGULAR.filter(lessonDone).length;
  $('prog-bar').style.width = (100 * d / REGULAR.length) + '%';
  $('prog-text').textContent = `${d} of ${REGULAR.length} lessons complete`;
  $('navtoggle-cur').textContent = current ? byId[current].title : '';
}
$('navtoggle').addEventListener('click', () => {
  const side = $('side'); const open = side.classList.toggle('open');
  $('navtoggle').setAttribute('aria-expanded', open);
});

// ---------- lesson loop blocks ----------
const LETTERS = 'ABCDEFG';
function optBtn(attrs, i, text, cls, disabled) {
  return `<button class="opt ${cls}" ${attrs} ${disabled ? 'disabled' : ''}><span class="k">${LETTERS[i]}</span><span>${text}</span></button>`;
}
// Display order for options: a stable shuffle per question, so the right answer isn't always in the same slot.
function optOrder(seed, opts) {
  const idx = opts.map((_, i) => i);
  if (opts.every(o => /\d/.test(o))) return idx;
  const pinned = idx.filter(i => /^(none|all|both|neither)\b/i.test(opts[i])), free = idx.filter(i => !pinned.includes(i));
  let h = 2166136261; for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  for (let i = free.length - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; const j = h % (i + 1); [free[i], free[j]] = [free[j], free[i]]; }
  return [...free, ...pinned];
}
const optsHtml = (seed, opts, attrs, pick, a) => optOrder(seed, opts).map((i, pos) => optBtn(attrs(i), pos, opts[i],
  pick === undefined ? '' : i === a ? 'right' : i === pick ? 'wrong' : '', pick !== undefined)).join('');

function headHtml(l) {
  const partIdx = PARTS.findIndex(p => p.id === l.part);
  const n = REGULAR.indexOf(l) + 1;
  return `<div class="lhead">
    <span class="eyebrow">${PARTS[partIdx].title}${l.special ? '' : ` · Lesson ${n} of ${REGULAR.length}`}</span>
    <h2>${l.title}</h2>
    <div class="meta"><span>About ${l.min} min</span>${l.special ? '' : `<span>${l.practice.length} practice tasks</span><span>${l.quiz.length}-question quiz</span>`}</div>
    ${l.objectives ? `<div class="objectives"><span class="eyebrow">By the end you can</span><ul>${l.objectives.map(o => `<li>${o}</li>`).join('')}</ul></div>` : ''}
    <div class="complete-banner" data-banner hidden>Lesson complete <span>· its flashcards are in your spaced review deck.</span></div>
  </div>`;
}

function predictHtml(l) {
  const p = l.predict, pick = ST.predict[l.id];
  return `<div class="block-label"><span class="eyebrow">1 · Predict first</span></div>
  <div class="predict"><p class="hint">Make a quick guess before reading. Committing to an answer, even a wrong one, helps you remember the explanation.</p>
    <p><b>${p.q}</b></p>
    <div class="opts">${optsHtml('p' + l.id, p.opts, i => `data-pred="${l.id}" data-i="${i}"`, pick, p.a)}</div>
    ${pick !== undefined ? `<p class="fb"><b>${pick === p.a ? 'Good instinct.' : 'Common guess, but not quite.'}</b> ${p.reveal}</p>` : ''}
  </div>
  <div class="block-label"><span class="eyebrow">2 · Learn and explore</span></div>`;
}

function practiceHtml(l) {
  const done = ST.practice[l.id] || {};
  return `<div class="block-label"><span class="eyebrow">3 · Practice</span></div>
  <div class="practice"><p class="hint">Hands-on tasks. They check off automatically when you do them in the labs above.</p>
  <ul class="tasks">${l.practice.map((t, i) => `<li class="task ${done[i] ? 'done' : ''}"><span class="box">${done[i] ? '✓' : ''}</span>
    <div class="tt">${t.text}${t.type === 'num' && !done[i] ? `<div class="num"><input type="number" step="any" inputmode="decimal" id="num-${l.id}-${i}" aria-label="Your answer"> <span class="hint">${t.unit || ''}</span><button class="btn" data-num="${l.id}" data-i="${i}">Check</button><span class="numfb" id="numfb-${l.id}-${i}"></span></div>` : ''}${t.type === 'num' && done[i] ? ` <span class="hint">Answer: ${t.answer} ${t.unit || ''}</span>` : ''}</div></li>`).join('')}</ul></div>`;
}

function quizHtml(l) {
  const a = ST.quiz[l.id] || {};
  const n = Object.keys(a).length, right = l.quiz.filter((q, i) => a[i] === q.a).length;
  return `<div class="block-label"><span class="eyebrow">4 · Quiz</span></div>
  <div class="quiz"><div class="row"><p class="hint">Recall it without scrolling up. Retrieving an answer strengthens memory more than rereading.</p><span class="hint mono">${n ? `${right}/${n} correct` : ''}</span></div>
  ${l.quiz.map((q, qi) => { const pick = a[qi]; return `<div class="qitem"><p class="qq">${qi + 1}. ${q.q}</p>
    <div class="opts">${optsHtml('q' + l.id + qi, q.opts, i => `data-quiz="${l.id}" data-q="${qi}" data-i="${i}"`, pick, q.a)}</div>
    ${pick !== undefined ? `<p class="fb"><b>${pick === q.a ? 'Correct.' : 'Not quite.'}</b> ${q.why}</p>` : ''}</div>`; }).join('')}
  ${n === l.quiz.length ? `<div class="row"><span class="hint">${right === l.quiz.length ? 'Perfect score.' : 'Missed some? Your flashcards will bring this topic back in the spaced review.'}</span><button class="linkbtn" data-retry="${l.id}">Retake quiz</button></div>` : ''}
  </div>`;
}

function reflectHtml(l) {
  const note = ST.notes[l.id] || '';
  return `<div class="block-label"><span class="eyebrow">5 · Reflect</span></div>
  <div class="reflect">
    <h4>Explain it back</h4>
    <p class="hint">${l.explain.prompt} Writing it in your own words shows you what you've really understood.</p>
    <textarea id="note-${l.id}" data-note="${l.id}" placeholder="Type your explanation…">${esc(note)}</textarea>
    <div class="row"><span class="hint">Saved in this browser only.</span><button class="btn" data-model="${l.id}" ${note.trim().length < 30 ? 'disabled' : ''}>Compare with a model answer</button></div>
    <div class="model" id="model-${l.id}" hidden><b>Model answer:</b> ${l.explain.model}</div>
    <h4>Key takeaways</h4>
    <ul class="takeaways">${l.takeaways.map(t => `<li>${t}</li>`).join('')}</ul>
    <h4>Flashcards from this lesson</h4>
    <div class="cards">${l.cards.map(c => `<button class="fcard" data-flip><small>Click to flip</small><b>${c[0]}</b><p hidden>${c[1]}</p></button>`).join('')}</div>
  </div>`;
}

function navHtml(l) {
  const i = LESSONS.indexOf(l), prev = LESSONS[i - 1], next = LESSONS[i + 1];
  return `<div class="lnav">${prev ? `<a href="#${prev.id}"><small>← Previous</small>${prev.title}</a>` : ''}${next ? `<a class="next" href="#${next.id}"><small>Next →</small>${next.title}</a>` : ''}</div>`;
}

function slot(l, name, html) {
  const sec = $('L-' + l.id);
  let el = sec.querySelector(`[data-slot="${name}"]`);
  if (!el) {
    el = document.createElement('div'); el.dataset.slot = name; el.style.display = 'grid'; el.style.gap = '14px';
    const core = sec.querySelector('.core');
    if (name === 'head' || name === 'predict') sec.insertBefore(el, name === 'head' ? sec.firstChild : core);
    else sec.appendChild(el);
  }
  el.innerHTML = html;
}

// Re-rendering replaces buttons and inputs, so carry typed numbers and keyboard focus across.
const cssEsc = s => (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&');
function focusKey(el) {
  if (!el || el === document.body) return null;
  if (el.id) return '#' + cssEsc(el.id);
  const attrs = [...el.attributes].filter(a => a.name.startsWith('data-'));
  return attrs.length ? el.tagName.toLowerCase() + attrs.map(a => `[${a.name}="${cssEsc(a.value)}"]`).join('') : null;
}
function keepFocus(fn) {
  const key = focusKey(document.activeElement); fn();
  if (!key) return;
  const el = document.querySelector(key);
  if (el && !el.disabled) el.focus({ preventScroll: true });
  else if (el) { const box = el.closest('.opts, .tasks'); const alt = box && box.parentElement.querySelector('.fb, button:not([disabled]), input'); if (alt) { if (!alt.hasAttribute('tabindex') && alt.tagName === 'P') alt.tabIndex = -1; alt.focus({ preventScroll: true }); } }
}
function renderLesson(l) { keepFocus(() => renderLessonNow(l)); }
function renderLessonNow(l) {
  const sec = $('L-' + l.id), typed = {};
  sec.querySelectorAll('input[id^="num-"]').forEach(inp => { if (inp.value !== '') typed[inp.id] = inp.value; });
  slot(l, 'head', headHtml(l));
  if (!l.special) {
    slot(l, 'predict', predictHtml(l));
    slot(l, 'practice', practiceHtml(l));
    slot(l, 'quiz', quizHtml(l));
    if (!$('L-' + l.id).querySelector('[data-slot="reflect"]')) slot(l, 'reflect', reflectHtml(l));
  }
  slot(l, 'nav', navHtml(l));
  Object.entries(typed).forEach(([id, v]) => { const inp = $(id); if (inp) inp.value = v; });
  const banner = $('L-' + l.id).querySelector('[data-banner]');
  if (banner) banner.hidden = !lessonDone(l);
}

// ---------- practice evaluation ----------
let ready = false;
function tick() {
  if (!ready) return;
  let changed = false;
  REGULAR.forEach(l => l.practice.forEach((t, i) => {
    if (t.type !== 'task') return;
    const p = ST.practice[l.id] = ST.practice[l.id] || {};
    if (!p[i]) { let ok = false; try { ok = t.check(); } catch (e) {} if (ok) { p[i] = true; changed = true; } }
  }));
  if (changed) { save(); if (current && !byId[current].special) { renderLesson(byId[current]); } renderNav(); }
}

// ---------- events (delegated) ----------
document.addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.pred) { ST.predict[t.dataset.pred] = +t.dataset.i; save(); renderLesson(byId[t.dataset.pred]); renderNav(); return; }
  if (t.dataset.quiz) {
    const id = t.dataset.quiz; (ST.quiz[id] = ST.quiz[id] || {})[t.dataset.q] = +t.dataset.i;
    save(); renderLesson(byId[id]); renderNav(); return;
  }
  if (t.dataset.retry) { ST.quiz[t.dataset.retry] = {}; save(); renderLesson(byId[t.dataset.retry]); renderNav(); return; }
  if (t.dataset.num) {
    const id = t.dataset.num, i = +t.dataset.i, task = byId[id].practice[i];
    const v = parseFloat($(`num-${id}-${i}`).value), fb = $(`numfb-${id}-${i}`);
    if (isNaN(v)) { fb.className = 'numfb bad'; fb.textContent = 'Enter a number.'; return; }
    if (Math.abs(v - task.answer) <= task.tol) { (ST.practice[id] = ST.practice[id] || {})[i] = true; save(); renderLesson(byId[id]); renderNav(); }
    else { fb.className = 'numfb bad'; fb.textContent = v < task.answer ? 'Too low. Try again.' : 'Too high. Try again.'; }
    return;
  }
  if (t.dataset.model) { $('model-' + t.dataset.model).hidden = false; return; }
  if (t.hasAttribute('data-flip')) { const p = t.querySelector('p'); p.hidden = !p.hidden; t.classList.toggle('open', !p.hidden); return; }
});
document.addEventListener('input', e => {
  const id = e.target.dataset && e.target.dataset.note; if (!id) return;
  ST.notes[id] = e.target.value; save();
  const b = document.querySelector(`[data-model="${id}"]`); if (b) b.disabled = e.target.value.trim().length < 30;
});

// ---------- generic sorter & matcher ----------
const sorterPicks = {};
function renderSorter(key) {
  const cfg = SORTERS[key], list = $(key + '-list'); if (!list) return;
  const picks = sorterPicks[key] = sorterPicks[key] || {};
  list.innerHTML = cfg.items.map(([text, ans], i) => {
    const p = picks[i];
    const cls = p === undefined ? '' : p === ans ? 'right' : 'wrong';
    const why = cfg.why && p !== undefined ? `<span class="hint" style="grid-column:1/-1">${p === ans ? '✓' : '✗'} ${cfg.why[i]}</span>` : '';
    return `<div class="sortitem ${cls}">${cfg.mono ? `<div class="history">${esc(text)}</div>` : `<span>${text}</span>`}
      <div class="seg" role="group" aria-label="Category">${cfg.cats.map((c, ci) => `<button data-sort="${key}" data-i="${i}" data-c="${ci}" aria-pressed="${p === ci}">${c}</button>`).join('')}</div>${why}</div>`;
  }).join('');
  const right = cfg.items.filter(([, a], i) => picks[i] === a).length, n = Object.keys(picks).length;
  W.sorters[key] = { right, total: cfg.items.length, allRight: right === cfg.items.length };
  const sc = $(key + '-score'); if (sc) sc.textContent = n ? `${right} of ${cfg.items.length} correct` : `${cfg.items.length} to sort`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-sort]'); if (!b) return;
  sorterPicks[b.dataset.sort][b.dataset.i] = +b.dataset.c; keepFocus(() => renderSorter(b.dataset.sort)); tick();
});
const matchPicks = {};
function renderMatcher(key) {
  const cfg = MATCHERS[key], list = $(key + '-list'); if (!list) return;
  const picks = matchPicks[key] = matchPicks[key] || {};
  list.innerHTML = cfg.items.map(([text, ans], i) => {
    const p = picks[i];
    return `<label><span>${text} <span id="mk-${key}-${i}">${matchMark(p, ans)}</span></span>
      <select data-match="${key}" data-i="${i}" id="m-${key}-${i}"><option value="">Choose…</option>${cfg.opts.map(o => `<option ${p === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`;
  }).join('');
  matchScore(key);
}
const matchMark = (p, ans) => p ? (p === ans ? '<b class="ok">✓</b>' : '<b class="no">✗</b>') : '';
function matchScore(key) {
  const cfg = MATCHERS[key], picks = matchPicks[key];
  const right = cfg.items.filter(([, a], i) => picks[i] === a).length;
  W.matchers[key] = { right, allRight: right === cfg.items.length };
  const sc = $(key + '-score'); if (sc) sc.textContent = `${right} of ${cfg.items.length} correct`;
}
document.addEventListener('change', e => {
  const s = e.target.closest('[data-match]'); if (!s) return;
  const key = s.dataset.match, i = +s.dataset.i; matchPicks[key][i] = s.value;
  $(`mk-${key}-${i}`).innerHTML = matchMark(s.value, MATCHERS[key].items[i][1]); matchScore(key); tick();
});

// ---------- review (spaced repetition) ----------
let rvCard = null, rvShown = false;
function renderReview() {
  const un = unlockedCards(), due = dueCards();
  const boxes = [0, 0, 0, 0, 0]; un.forEach(c => { const s = ST.cards[c.id]; boxes[s ? s.box : 0]++; });
  $('rv-boxes').innerHTML = `<span>${un.length} cards unlocked</span><span>${due.length} due now</span>` + boxes.map((n, i) => `<span>Box ${i + 1}: ${n}</span>`).join('');
  if (!un.length) { $('rv-area').innerHTML = `<div class="review-card"><p class="front">No cards yet</p><p class="hint">Open any lesson and its flashcards unlock here.</p></div>`; return; }
  if (!due.length) {
    const next = Math.min(...un.map(c => (ST.cards[c.id] || { due: 0 }).due));
    $('rv-area').innerHTML = `<div class="review-card"><p class="front">All caught up</p><p class="hint">Next card due ${new Date(next).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}. Unlock more by opening new lessons.</p><div class="row"><button class="btn" id="rv-cram">Review all anyway</button></div></div>`;
    $('rv-cram').onclick = () => { un.forEach(c => { if (ST.cards[c.id]) ST.cards[c.id].due = 0; }); save(); renderReview(); renderNav(); };
    return;
  }
  if (!rvCard || !due.find(c => c.id === rvCard.id)) { rvCard = due[Math.floor(Math.random() * due.length)]; rvShown = false; }
  const s = ST.cards[rvCard.id];
  $('rv-area').innerHTML = `<div class="review-card"><span class="eyebrow">${rvCard.lesson.title} · box ${(s ? s.box : 0) + 1}</span>
    <p class="front">${rvCard.front}</p>
    ${rvShown ? `<p class="back">${rvCard.back}</p><div class="row"><span class="hint">Be honest. It's only for you.</span><div class="chips"><button class="btn" id="rv-miss">I missed it</button><button class="btn primary" id="rv-got">I got it</button></div></div>`
      : `<div class="row"><span class="hint">Say the answer out loud or in your head first.</span><button class="btn primary" id="rv-show">Show answer</button></div>`}</div>`;
  if (!rvShown) $('rv-show').onclick = () => { rvShown = true; renderReview(); };
  else {
    const grade = ok => {
      const box = ok ? Math.min(4, (s ? s.box : 0) + 1) : 0;
      ST.cards[rvCard.id] = { box, due: Date.now() + BOX_DAYS[box] * DAY - (ok ? 0 : 0) };
      if (!ok) ST.cards[rvCard.id].due = Date.now() + 60000;
      save(); rvCard = null; renderReview(); renderNav();
    };
    $('rv-got').onclick = () => grade(true); $('rv-miss').onclick = () => grade(false);
  }
}

// ---------- exam ----------
let exCat = 'All', mixed = [], mixedAns = {};
function rollMixed() {
  const pool = [];
  REGULAR.forEach(l => l.quiz.forEach(q => pool.push({ ...q, lesson: l.title })));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  mixed = pool.slice(0, 10); mixedAns = {};
}
function renderExam() {
  const cats = ['All', ...new Set(SCENARIOS.map(s => s.cat))];
  $('ex-filters').innerHTML = cats.map(c => `<button class="chip" data-excat="${c}" aria-pressed="${c === exCat}">${c}</button>`).join('');
  $('ex-scen').innerHTML = SCENARIOS.map((s, i) => {
    if (exCat !== 'All' && s.cat !== exCat) return '';
    const p = ST.scen[i];
    const b = (v, label) => `<button class="opt ${p ? (v === s.a ? 'right' : p === v ? 'wrong' : '') : ''}" data-scen="${i}" data-v="${v}" ${p ? 'disabled' : ''} style="grid-template-columns:1fr"><span>${label}</span></button>`;
    return `<div class="qitem"><span class="eyebrow">${s.cat}</span><p>${s.q}</p><div class="grid2">${b('CP', 'Protect consistency (CP)')}${b('AP', 'Protect availability (AP)')}</div>${p ? `<p class="fb"><b>${p === s.a ? 'Correct.' : `Better choice: ${s.a}.`}</b> ${s.why}</p>` : ''}</div>`;
  }).join('');
  const n = Object.keys(ST.scen).length, r = Object.entries(ST.scen).filter(([i, v]) => SCENARIOS[i].a === v).length;
  $('ex-score1').innerHTML = `${r}/${n} correct · ${SCENARIOS.length - n} left ${n ? '<button class="linkbtn" id="ex-reset1">Reset</button>' : ''}`;
  const rb = $('ex-reset1'); if (rb) rb.onclick = () => { ST.scen = {}; save(); renderExam(); };
  $('ex-mixed').innerHTML = mixed.map((q, qi) => { const pick = mixedAns[qi]; return `<div class="qitem"><span class="eyebrow">${q.lesson}</span><p class="qq">${q.q}</p>
    <div class="opts">${optsHtml('x' + q.q, q.opts, i => `data-mx="${qi}" data-i="${i}"`, pick, q.a)}</div>
    ${pick !== undefined ? `<p class="fb"><b>${pick === q.a ? 'Correct.' : 'Not quite.'}</b> ${q.why}</p>` : ''}</div>`; }).join('');
  const mn = Object.keys(mixedAns).length, mr = mixed.filter((q, i) => mixedAns[i] === q.a).length;
  $('ex-score2').textContent = `${mr}/${mn} correct`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-excat],[data-scen],[data-mx]'); if (!b) return;
  if (b.dataset.excat) exCat = b.dataset.excat;
  else if (b.dataset.scen) { ST.scen[b.dataset.scen] = b.dataset.v; save(); }
  else mixedAns[b.dataset.mx] = +b.dataset.i;
  renderExam();
});
$('ex-reroll').addEventListener('click', () => { rollMixed(); renderExam(); });

// ---------- router ----------
const onShow = {};
function show(id) {
  if (!byId[id]) id = ST.last && byId[ST.last] ? ST.last : LESSONS[0].id;
  current = id; ST.last = id; ST.visited[id] = true; save();
  document.querySelectorAll('.lesson').forEach(s => { s.hidden = s.id !== 'L-' + id; });
  renderLesson(byId[id]);
  if (onShow[id]) onShow[id]();
  if (id === 'review') renderReview();
  if (id === 'exam') renderExam();
  renderNav();
  $('side').classList.remove('open'); $('navtoggle').setAttribute('aria-expanded', 'false');
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => show(location.hash.slice(1)));
