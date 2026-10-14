// ================= WIDGETS: distributed systems =================
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function fnv(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return h >>> 0; }
const PALETTE = ['#3F70DA', '#E07A3F', '#2A9D8F', '#B5539C', '#8A9A2B', '#D04848', '#7A68E0', '#C9A227'];
const pct = (x, d = 1) => (x * 100).toFixed(d) + '%';
function svgEl(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function logRow(kind, text) { return `<div class="e"><span class="tag ${kind}">${kind.toUpperCase()}</span><span>${text}</span></div>`; }

// ---------- Fallacies ----------
const FALLACIES = [
  ['The network is reliable', 'Switches fail, cables get cut and packets get dropped every day at scale.', 'Timeouts, retries with idempotency, redundant paths.'],
  ['Latency is zero', 'A cross-region round trip costs about 100 ms, roughly a million memory reads.', 'Fewer round trips, batching, caching, data placed near users.'],
  ['Bandwidth is infinite', 'Large payloads saturate links and cost money. One chatty service can starve others.', 'Compression, pagination, compact binary formats.'],
  ['The network is secure', 'Traffic can be sniffed, spoofed or tampered with, even inside a datacenter.', 'TLS everywhere, mutual authentication, zero-trust networking.'],
  ['Topology doesn’t change', 'Instances autoscale, fail over and move. IP addresses change constantly.', 'Service discovery, health checks, no hard-coded addresses.'],
  ['There is one administrator', 'Many teams, vendors and policies control parts of every request path.', 'Clear ownership, defensive configuration, observability across boundaries.'],
  ['Transport cost is zero', 'Serialization costs CPU, and cross-zone or egress traffic costs real money.', 'Measure transfer costs and keep chatty services close together.'],
  ['The network is homogeneous', 'Mixed hardware, operating systems, protocols, packet sizes and software versions.', 'Standard protocols, version-tolerant formats, interoperability tests.']
];
W.fal = { revealed: 0 };
const falOpen = new Set();
function renderFallacies() {
  $('fal-cards').innerHTML = FALLACIES.map((f, i) => `<button class="fcard ${falOpen.has(i) ? 'open' : ''}" data-fal="${i}"><small>Fallacy ${i + 1}</small><b>${f[0]}</b>${falOpen.has(i) ? `<p><b>Reality:</b> ${f[1]}</p><p><b>Design response:</b> ${f[2]}</p>` : '<small>Click to reveal</small>'}</button>`).join('');
  W.fal.revealed = falOpen.size; $('fal-count').textContent = `${falOpen.size} of 8 revealed`;
}
$('fal-cards').addEventListener('click', e => { const b = e.target.closest('[data-fal]'); if (!b) return; const i = +b.dataset.fal; falOpen.has(i) ? falOpen.delete(i) : falOpen.add(i); renderFallacies(); tick(); });

const LATENCY = [['L1 cache reference', 0.5], ['Branch mispredict', 5], ['Main memory reference', 100], ['Compress 1 KB', 2000], ['SSD random read', 100000], ['Round trip in the same datacenter', 500000], ['Read 1 MB sequentially from SSD', 1000000], ['Hard disk seek', 10000000], ['Round trip US East ↔ Europe', 80000000], ['Round trip California ↔ Netherlands', 150000000]];
let latHuman = false;
function fmtReal(ns) { return ns < 1000 ? ns + ' ns' : ns < 1e6 ? (ns / 1000) + ' µs' : (ns / 1e6) + ' ms'; }
function fmtHuman(ns) { const s = ns; if (s < 60) return s + ' s'; if (s < 3600) return (s / 60).toFixed(1) + ' min'; if (s < 86400) return (s / 3600).toFixed(1) + ' hours'; if (s < 86400 * 30) return (s / 86400).toFixed(1) + ' days'; if (s < 86400 * 365) return (s / 86400 / 30).toFixed(1) + ' months'; return (s / 86400 / 365).toFixed(1) + ' years'; }
function renderLatency() {
  const max = Math.log10(LATENCY[LATENCY.length - 1][1] * 10);
  $('lat-list').innerHTML = LATENCY.map(([n, ns]) => `<div class="lad"><span>${n}</span><span class="barwrap"><i style="width:${Math.max(1, 100 * (Math.log10(ns * 10) / max))}%"></i></span><span class="v">${latHuman ? fmtHuman(ns) : fmtReal(ns)}</span></div>`).join('');
  $('lat-real').setAttribute('aria-pressed', !latHuman); $('lat-human').setAttribute('aria-pressed', latHuman);
}
$('lat-real').onclick = () => { latHuman = false; renderLatency(); };
$('lat-human').onclick = () => { latHuman = true; renderLatency(); };

// ---------- Failure detector ----------
const FD = (() => { const r = mulberry32(7), d = []; for (let i = 0; i < 200; i++) d.push(Math.round(20 + r() * 100 + (r() < 0.1 ? r() * 120 : 0)));
  [[23, 320], [61, 450], [88, 610], [120, 880], [151, 1650], [182, 2400]].forEach(([i, v]) => { d[i] = v; }); return d; })();
W.fd = {};
function renderFD() {
  const T = +$('fd-t').value; $('fd-t-out').textContent = T + ' ms';
  const svg = $('fd-svg'); svg.innerHTML = '';
  const y = v => 150 - Math.sqrt(Math.min(v, 3000) / 3000) * 135;
  FD.forEach((v, i) => svgEl('rect', { x: 20 + i * 3, y: y(v), width: 2.2, height: 150 - y(v), class: v > T ? 'fill-bad' : 'fill-muted', opacity: v > T ? 1 : 0.55 }, svg));
  svgEl('line', { x1: 15, x2: 625, y1: y(T), y2: y(T), stroke: 'var(--accent)', 'stroke-width': 2, 'stroke-dasharray': '6 4' }, svg);
  svgEl('text', { x: 625, y: y(T) - 6, 'text-anchor': 'end', class: 'sv-text', fill: 'var(--accent)' }, svg).textContent = `timeout ${T} ms`;
  svgEl('text', { x: 20, y: 166, class: 'sv-muted' }, svg).textContent = '200 heartbeats →';
  const f = FD.filter(v => v > T).length;
  W.fd = { T, falseCount: f };
  $('fd-verdicts').innerHTML = `<div class="verdict ${f === 0 ? 'good' : f <= 2 ? 'warn' : 'bad'}"><b>${f} false suspicion${f === 1 ? '' : 's'}</b><span>${f ? 'The node was healthy, just slow, but would have been declared dead and possibly failed over.' : 'No healthy node would be declared dead.'}</span></div>
    <div class="verdict ${T <= 1000 ? 'good' : T <= 2000 ? 'warn' : 'bad'}"><b>Crash detected after ~${(T / 1000).toFixed(2)} s</b><span>After a real crash, clients wait this long before the system reacts.</span></div>`;
  tick();
}
$('fd-t').addEventListener('input', renderFD);

// ---------- Delivery ----------
let dlStrat = 'once'; W.dl = { last: null, everDup: false };
const DLDESC = { once: 'Send once, never retry.', retry: 'Retry up to 8 times until a reply arrives.', idem: 'Retry up to 8 times, with a unique key the server deduplicates.' };
function renderDLControls() {
  document.querySelectorAll('[data-dl]').forEach(b => b.setAttribute('aria-pressed', b.dataset.dl === dlStrat));
  $('dl-loss-out').textContent = $('dl-loss').value + '%'; $('dl-n-out').textContent = $('dl-n').value; $('dl-desc').textContent = DLDESC[dlStrat];
}
function runDL() {
  const p = +$('dl-loss').value / 100, n = +$('dl-n').value; let ok = 0, lost = 0, dup = 0, unk = 0; const logs = [];
  for (let k = 1; k <= n; k++) {
    let processed = 0, acked = false, tries = 0; const story = [];
    while (true) {
      tries++; const reqOk = Math.random() >= p; let note;
      if (!reqOk) note = 'request lost';
      else {
        if (dlStrat === 'idem' && processed > 0) note = 'duplicate key ignored';
        else { processed++; note = processed > 1 ? 'charged AGAIN' : 'charged'; }
        if (Math.random() >= p) { acked = true; note += ', reply received'; } else note += ', reply lost';
      }
      story.push(`try ${tries}: ${note}`);
      if (dlStrat === 'once' || acked || tries >= 8) break;
    }
    if (processed === 1) ok++; else if (processed === 0) lost++; else dup++;
    if (!acked) unk++;
    if ((processed !== 1 || tries > 1) && logs.length < 6) logs.push(logRow(processed === 1 ? 'ok' : processed === 0 ? 'lost' : 'bad', `Payment #${k}: ${story.join(' → ')}`));
  }
  $('dl-ok').textContent = ok; $('dl-lost').textContent = lost; $('dl-dup').textContent = dup; $('dl-unk').textContent = unk;
  $('dl-log').innerHTML = logs.join('') || logRow('ok', 'Every payment went through on the first try.');
  W.dl.last = { strategy: dlStrat, loss: p * 100, n, lost, dup }; if (dup) W.dl.everDup = true;
  tick();
}
document.querySelectorAll('[data-dl]').forEach(b => b.addEventListener('click', () => { dlStrat = b.dataset.dl; renderDLControls(); }));
$('dl-loss').addEventListener('input', renderDLControls); $('dl-n').addEventListener('input', renderDLControls);
$('dl-run').addEventListener('click', runDL);

// ---------- Partitioning ----------
const FIRST = ['aaron', 'adam', 'alice', 'amy', 'anna', 'ben', 'carlos', 'chloe', 'daniel', 'david', 'emma', 'eric', 'grace', 'hannah', 'jack', 'james', 'jason', 'john', 'jose', 'julia', 'kate', 'kevin', 'laura', 'leo', 'lisa', 'maria', 'mark', 'mary', 'matt', 'mia', 'michael', 'nina', 'olivia', 'paul', 'ryan', 'sam', 'sara', 'sophia', 'steve', 'tom'];
const PKEYS = FIRST.flatMap(f => [f + '.k', f + '.r', f + '.w']).sort();
const PH = PKEYS.map(fnv);
let PS = { strategy: 'mod', n: 4, vn: false, lastMove: null };
function assign(strategy, n, vn) {
  if (strategy === 'mod') return PH.map(h => h % n);
  if (strategy === 'range') return PKEYS.map(k => { const L = k.charCodeAt(0) - 97; for (let i = 0; i < n; i++) if (L < Math.floor(26 * (i + 1) / n)) return i; return n - 1; });
  const pts = []; const v = vn ? 200 : 1;
  for (let i = 0; i < n; i++) for (let j = 0; j < v; j++) pts.push([fnv(`node${i}#${j}`), i]);
  pts.sort((a, b) => a[0] - b[0]);
  return PH.map(h => { for (const [p, i] of pts) if (p >= h) return i; return pts[0][1]; });
}
function ringPoints(n, vn) { const out = []; const v = vn ? 200 : 1; for (let i = 0; i < n; i++) for (let j = 0; j < v; j++) out.push([fnv(`node${i}#${j}`), i]); return out; }
function renderPS() {
  document.querySelectorAll('[data-ps]').forEach(b => b.setAttribute('aria-pressed', b.dataset.ps === PS.strategy));
  $('ps-n').textContent = PS.n; $('ps-vn-wrap').style.visibility = PS.strategy === 'ring' ? 'visible' : 'hidden'; $('ps-vn').checked = PS.vn;
  const own = assign(PS.strategy, PS.n, PS.vn);
  const svg = $('ps-svg'); svg.innerHTML = '';
  svgEl('circle', { cx: 150, cy: 150, r: 112, fill: 'none', stroke: 'var(--line)', 'stroke-width': 2 }, svg);
  const ang = i => PS.strategy === 'range' ? (i / PKEYS.length) * 2 * Math.PI : (PH[i] / 4294967296) * 2 * Math.PI;
  PKEYS.forEach((k, i) => { const a = ang(i) - Math.PI / 2; svgEl('circle', { cx: 150 + 112 * Math.cos(a), cy: 150 + 112 * Math.sin(a), r: 4, fill: PALETTE[own[i]] }, svg); });
  if (PS.strategy === 'ring') ringPoints(PS.n, PS.vn).forEach(([p, i]) => { const a = (p / 4294967296) * 2 * Math.PI - Math.PI / 2;
    svgEl('line', { x1: 150 + 96 * Math.cos(a), y1: 150 + 96 * Math.sin(a), x2: 150 + (PS.vn ? 104 : 128) * Math.cos(a), y2: 150 + (PS.vn ? 104 : 128) * Math.sin(a), stroke: PALETTE[i], 'stroke-width': PS.vn ? 1.5 : 5 }, svg); });
  svgEl('text', { x: 150, y: 146, 'text-anchor': 'middle', class: 'sv-text' }, svg).textContent = PS.strategy === 'range' ? 'keys in A→Z order' : PS.strategy === 'ring' ? 'hash ring' : 'keys at hash position';
  svgEl('text', { x: 150, y: 162, 'text-anchor': 'middle', class: 'sv-muted' }, svg).textContent = `${PKEYS.length} keys · ${PS.n} nodes`;
  const counts = Array(PS.n).fill(0); own.forEach(o => counts[o]++);
  const maxShare = Math.max(...counts) / PKEYS.length;
  const ranges = PS.strategy === 'range' ? Array.from({ length: PS.n }, (_, i) => String.fromCharCode(65 + Math.floor(26 * i / PS.n)) + '–' + String.fromCharCode(64 + Math.floor(26 * (i + 1) / PS.n))) : null;
  $('ps-bars').innerHTML = counts.map((c, i) => `<div class="barrow"><span class="mono">node ${i + 1}${ranges ? ' ' + ranges[i] : ''}</span><span class="track"><i style="width:${100 * c / PKEYS.length * Math.min(PS.n, 4) / 1.5}%;background:${PALETTE[i]}"></i></span><span class="v">${c} · ${pct(c / PKEYS.length, 0)}</span></div>`).join('');
  const m = PS.lastMove;
  $('ps-verdict').innerHTML = `<div class="verdict ${maxShare > 1.5 / PS.n ? 'warn' : 'good'}"><b>Busiest node: ${pct(maxShare, 0)}</b><span>A perfect split would be ${pct(1 / PS.n, 0)} each.</span></div>` +
    (m ? `<div class="verdict ${m.moved / m.total > 0.5 ? 'bad' : 'good'}" style="margin-top:8px"><b>${m.from} → ${m.to} nodes moved ${m.moved} of ${m.total} keys (${pct(m.moved / m.total, 0)})</b><span>${{ mod: 'hash mod N', range: 'range', ring: 'consistent hashing' }[m.strategy]}. The ideal minimum is about ${pct(Math.abs(m.to - m.from) / Math.max(m.to, m.from), 0)}.</span></div>` : '<p class="hint" style="margin-top:8px">Add or remove a node to see how many keys have to move.</p>');
  W.ps = { strategy: PS.strategy, n: PS.n, vn: PS.vn, lastMove: PS.lastMove, maxShare };
  tick();
}
function resize(d) {
  const to = PS.n + d; if (to < 1 || to > 8) return;
  const a = assign(PS.strategy, PS.n, PS.vn), b = assign(PS.strategy, to, PS.vn);
  PS.lastMove = { strategy: PS.strategy, from: PS.n, to, moved: a.filter((x, i) => x !== b[i]).length, total: a.length };
  PS.n = to; renderPS();
}
document.querySelectorAll('[data-ps]').forEach(b => b.addEventListener('click', () => { PS.strategy = b.dataset.ps; PS.lastMove = null; renderPS(); }));
$('ps-plus').onclick = () => resize(1); $('ps-minus').onclick = () => resize(-1);
$('ps-vn').onchange = e => { PS.vn = e.target.checked; PS.lastMove = null; renderPS(); };

// ---------- Replication timeline ----------
let rpMode = 'async'; W.rp = {};
function renderRP() {
  document.querySelectorAll('[data-rm]').forEach(b => b.setAttribute('aria-pressed', b.dataset.rm === rpMode));
  const lag = +$('rp-lag').value, tr = +$('rp-read').value, crash = $('rp-crash').checked;
  $('rp-lag-out').textContent = lag + ' ms'; $('rp-read-out').textContent = tr + ' ms';
  const tB = 5 + Math.max(10, Math.round(lag * 0.4)), tC = 5 + lag;
  const asyncLoss = crash && rpMode === 'async';
  const ack = rpMode === 'async' ? 10 : (crash ? Infinity : tC + 5);
  const val = asyncLoss ? 0 : (tr + 2 >= tC ? 1 : 0);
  const stale = val === 0 && tr >= ack;
  const svg = $('rp-svg'); svg.innerHTML = '';
  const X = t => 80 + Math.min(t, 300) * 1.8, LY = { c1: 30, A: 80, B: 125, C: 170, c2: 220 };
  [['c1', 'Client 1'], ['A', 'A primary'], ['B', 'B replica'], ['C', 'C replica'], ['c2', 'Client 2']].forEach(([k, n]) => {
    svgEl('text', { x: 6, y: LY[k] + 4, class: 'sv-text' }, svg).textContent = n;
    svgEl('line', { x1: 80, x2: 625, y1: LY[k], y2: LY[k], stroke: 'var(--line)', 'stroke-width': 1.5, 'stroke-dasharray': k === 'A' && crash ? '0' : '0' }, svg);
  });
  for (let t = 0; t <= 300; t += 50) svgEl('text', { x: X(t), y: 246, 'text-anchor': 'middle', class: 'sv-muted' }, svg).textContent = t + ' ms';
  const arrow = (t1, l1, t2, l2, color, dash) => { svgEl('line', { x1: X(t1), y1: LY[l1], x2: X(t2), y2: LY[l2], stroke: color, 'stroke-width': 2, 'stroke-dasharray': dash || '' }, svg); svgEl('circle', { cx: X(t2), cy: LY[l2], r: 4, fill: color }, svg); };
  arrow(0, 'c1', 5, 'A', 'var(--accent)');
  svgEl('text', { x: X(0) + 4, y: LY.c1 - 8, class: 'sv-text' }, svg).textContent = 'write x=1';
  if (!asyncLoss) { arrow(5, 'A', tB, 'B', 'var(--accent)'); arrow(5, 'A', tC, 'C', 'var(--accent)');
    svgEl('text', { x: X(tC) + 6, y: LY.C - 8, class: 'sv-muted' }, svg).textContent = `C has x=1 at ${tC} ms`; }
  else { arrow(5, 'A', 8, 'B', 'var(--bad)', '3 3'); }
  if (isFinite(ack)) { arrow(rpMode === 'async' ? 6 : tC, 'A', ack, 'c1', 'var(--ok)'); svgEl('text', { x: X(ack) + 6, y: LY.c1 + 14, class: 'sv-text', fill: 'var(--ok)' }, svg).textContent = rpMode === 'async' ? `OK sent at 6 ms, received at ${ack} ms` : `OK at ${ack} ms`; }
  if (crash) { svgEl('text', { x: X(8), y: LY.A + 6, 'text-anchor': 'middle', class: 'sv-text', fill: 'var(--bad)', style: 'font-size:18px' }, svg).textContent = '✕';
    svgEl('line', { x1: X(8), x2: 625, y1: LY.A, y2: LY.A, stroke: 'var(--bad)', 'stroke-width': 2, 'stroke-dasharray': '4 4' }, svg);
    svgEl('text', { x: X(60), y: LY.B - 8, class: 'sv-text', fill: 'var(--warn)' }, svg).textContent = `B promoted, has x=${asyncLoss ? 0 : 1}`; }
  arrow(tr, 'c2', tr + 2, 'C', 'var(--warn)'); arrow(tr + 2, 'C', tr + 4, 'c2', val ? 'var(--ok)' : 'var(--warn)');
  svgEl('text', { x: X(tr) + 6, y: LY.c2 + 16, class: 'sv-text' }, svg).textContent = `read → ${val}`;
  const v = [];
  v.push(isFinite(ack) ? { c: rpMode === 'async' ? 'good' : 'warn', t: `Write confirmed after ${ack} ms`, d: rpMode === 'async' ? 'Fast, because A doesn’t wait for replicas.' : 'A waited for B and C before confirming.' }
    : { c: 'warn', t: 'Write never confirmed', d: 'A crashed before replying. The client gets a timeout and an unknown outcome, but it was never told "success" for data that could be lost.' });
  if (asyncLoss) v.push({ c: 'bad', t: 'Confirmed write lost', d: 'A sent OK at 6 ms (the client got it at 10 ms), then crashed at 8 ms before shipping x=1. B was promoted without it.' });
  else if (stale) v.push({ c: 'bad', t: 'Stale read: not linearizable', d: `The write was confirmed at ${ack} ms, but C didn’t have it until ${tC} ms. A read at ${tr} ms returned 0.` });
  else if (val === 0) v.push({ c: 'info', t: 'Read returned 0, which is allowed', d: 'The read started before the write was confirmed, so either value is valid.' });
  else v.push({ c: 'good', t: 'Read returned 1', d: 'C already had the write.' });
  $('rp-verdicts').innerHTML = v.map(x => `<div class="verdict ${x.c}"><b>${x.t}</b><span>${x.d}</span></div>`).join('');
  W.rp = { mode: rpMode, stale, crash, lost: asyncLoss };
  tick();
}
document.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => { rpMode = b.dataset.rm; renderRP(); }));
['rp-lag', 'rp-read'].forEach(id => $(id).addEventListener('input', renderRP)); $('rp-crash').addEventListener('change', renderRP);

// ---------- Quorum calculator ----------
const REPLICAS = [{ nm: 'r1', wh: 'same zone', ms: 2 }, { nm: 'r2', wh: 'same zone', ms: 3 }, { nm: 'r3', wh: 'other zone', ms: 9 }, { nm: 'r4', wh: 'us-west', ms: 64 }, { nm: 'r5', wh: 'eu-west', ms: 82 }, { nm: 'r6', wh: 'sa-east', ms: 128 }, { nm: 'r7', wh: 'ap-south', ms: 196 }];
const QPRESETS = [{ label: 'Cassandra QUORUM', N: 3, W: 2, R: 2 }, { label: 'ONE / ONE', N: 3, W: 1, R: 1 }, { label: 'Fast reads', N: 3, W: 3, R: 1 }, { label: 'Fast writes', N: 3, W: 1, R: 3 }, { label: 'Five-node majority', N: 5, W: 3, R: 3 }];
const Q = { N: 3, W: 1, R: 1, down: new Set() };
const ord = k => k + (['st', 'nd', 'rd'][k - 1] || 'th');
function renderQuorum() {
  Q.W = Math.min(Q.W, Q.N); Q.R = Math.min(Q.R, Q.N);
  ['n', 'w', 'r'].forEach(k => { const el = $('q-' + k), v = Q[k.toUpperCase()]; if (k !== 'n') el.max = Q.N; el.value = v; $('q-' + k + '-out').textContent = v; });
  const idx = REPLICAS.slice(0, Q.N).map((_, i) => i), alive = idx.filter(i => !Q.down.has(i));
  const byMs = [...alive].sort((a, b) => REPLICAS[a].ms - REPLICAS[b].ms);
  const canW = alive.length >= Q.W, canR = alive.length >= Q.R;
  const wSet = canW ? byMs.slice(0, Q.W) : [], rSet = canR ? [...alive.filter(i => !wSet.includes(i)), ...wSet].slice(0, Q.R) : [];
  const overlap = Q.R + Q.W > Q.N;
  $('q-formula').innerHTML = `R + W = ${Q.R + Q.W} ${overlap ? '&gt;' : '≤'} N = ${Q.N} → ${overlap ? `at least ${Q.R + Q.W - Q.N} replica in common` : 'read and write groups can miss each other'}`;
  $('q-reps').innerHTML = idx.map(i => { const r = REPLICAS[i], inW = wSet.includes(i), inR = rSet.includes(i), dn = Q.down.has(i);
    const tags = dn ? '<span class="t" style="color:var(--bad)">DOWN</span>' : (inW && inR ? '<span class="t x">W+R</span>' : '') + (inW && !inR ? '<span class="t w">W</span>' : '') + (inR && !inW ? '<span class="t r">R</span>' : '');
    return `<button class="rep ${dn ? 'down' : ''}" data-rep="${i}" aria-pressed="${dn}" aria-label="Replica ${r.nm} in ${r.wh}, ${dn ? 'down' : 'up'}"><span class="nm">${r.nm}</span><span class="wh">${r.wh}</span><span class="ms">${r.ms} ms</span><span class="tags">${tags}</span></button>`; }).join('');
  const lat = k => REPLICAS[byMs[k - 1]].ms, v = [];
  v.push(overlap ? { c: 'good', t: 'Reads see the latest write', d: 'Every read touches a replica that took the newest write. This leans CP.' } : { c: 'warn', t: 'Reads can be stale', d: 'A read can land only on replicas the write skipped. This is eventual consistency.' });
  v.push(2 * Q.W > Q.N ? { c: 'good', t: 'Conflicting writes overlap', d: `2W = ${2 * Q.W} > N, so two sides of a split can’t both commit.` } : { c: 'warn', t: 'Both sides of a split can write', d: `2W = ${2 * Q.W} ≤ N, so disjoint groups can accept conflicting writes.` });
  v.push(canW ? { c: 'good', t: `Writes OK · ~${lat(Q.W)} ms`, d: `Survives ${Q.N - Q.W} failure${Q.N - Q.W === 1 ? '' : 's'}. Waits for the ${ord(Q.W)} fastest live replica.` } : { c: 'bad', t: 'Writes unavailable', d: `Only ${alive.length} up, but each write needs ${Q.W}.` });
  v.push(canR ? { c: 'good', t: `Reads OK · ~${lat(Q.R)} ms`, d: `Survives ${Q.N - Q.R} failure${Q.N - Q.R === 1 ? '' : 's'}. Waits for the ${ord(Q.R)} fastest live replica.` } : { c: 'bad', t: 'Reads unavailable', d: `Only ${alive.length} up, but each read needs ${Q.R}.` });
  $('q-verdicts').innerHTML = v.map(x => `<div class="verdict ${x.c}"><b>${x.t}</b><span>${x.d}</span></div>`).join('');
  W.q = { N: Q.N, W: Q.W, R: Q.R, canW, canR, overlap };
  tick();
}
['n', 'w', 'r'].forEach(k => $('q-' + k).addEventListener('input', e => { Q[k.toUpperCase()] = +e.target.value; if (k === 'n') [...Q.down].forEach(i => { if (i >= Q.N) Q.down.delete(i); }); renderQuorum(); }));
$('q-reps').addEventListener('click', e => { const b = e.target.closest('[data-rep]'); if (!b) return; const i = +b.dataset.rep; Q.down.has(i) ? Q.down.delete(i) : Q.down.add(i); renderQuorum(); });
$('q-presets').insertAdjacentHTML('beforeend', QPRESETS.map((p, i) => `<button class="chip" data-qp="${i}">${p.label}</button>`).join(''));
$('q-presets').addEventListener('click', e => { const b = e.target.closest('[data-qp]'); if (!b) return; const p = QPRESETS[b.dataset.qp]; Object.assign(Q, { N: p.N, W: p.W, R: p.R, down: new Set() }); renderQuorum(); });

// ---------- CAP partition lab ----------
const CAP = (() => {
  const POS = { A: { x: 200, y: 72 }, B: { x: 78, y: 272 }, C: { x: 322, y: 272 } };
  const LINKS = { AB: ['A', 'B'], AC: ['A', 'C'], BC: ['B', 'C'] }, NAMES = ['A', 'B', 'C'];
  const VALUES = [{ name: 'Teal', c: '#2A9D8F' }, { name: 'Coral', c: '#E76F51' }, { name: 'Plum', c: '#8E5BA8' }, { name: 'Amber', c: '#E0A030' }, { name: 'Cobalt', c: '#3F70DA' }, { name: 'Olive', c: '#7F913A' }];
  let S;
  function fresh() { const v = VALUES[0], mk = () => ({ v, ts: 1, seen: new Set([1]) });
    return { mode: 'CP', clock: 1, next: 1, step: 0, nodes: { A: mk(), B: mk(), C: mk() }, links: { AB: true, AC: true, BC: true }, acked: [{ v, ts: 1, node: 'A' }], lost: new Set(), cpMajorityWrite: false,
      stats: { acked: 1, rejected: 0, stale: 0, lost: 0 }, log: [{ kind: 'ok', text: 'Starting value Teal (t=1) is stored on A, B and C.' }] }; }
  const up = (a, b) => S.links[[a, b].sort().join('')];
  const neighbors = n => NAMES.filter(m => m !== n && up(n, m));
  function component(n) { const seen = new Set([n]), q = [n]; while (q.length) for (const m of neighbors(q.shift())) if (!seen.has(m)) { seen.add(m); q.push(m); } return NAMES.filter(m => seen.has(m)); }
  function path(a, b) { const prev = { [a]: null }, q = [a]; while (q.length) { const x = q.shift(); if (x === b) break; for (const m of neighbors(x)) if (!(m in prev)) { prev[m] = x; q.push(m); } } const p = []; for (let x = b; x; x = prev[x]) p.unshift(x); return p; }
  const allUp = () => Object.values(S.links).every(Boolean);
  const isolated = n => component(n).length === 1 && NAMES.filter(m => m !== n).every(m => component(m).length === 2);
  const latestAcked = () => S.acked.reduce((a, b) => (b.ts > a.ts ? b : a));
  function unionSeen(comp) { const all = new Set(); comp.forEach(m => S.nodes[m].seen.forEach(t => all.add(t))); comp.forEach(m => { S.nodes[m].seen = new Set(all); }); }
  function diverged() { if (S.mode !== 'AP') return false; for (const a of NAMES) for (const b of NAMES) { if (a >= b || component(a).includes(b)) continue; const na = S.nodes[a], nb = S.nodes[b]; if (!nb.seen.has(na.ts) && !na.seen.has(nb.ts)) return true; } return false; }
  const list = arr => arr.length === 1 ? arr[0] : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  function log(kind, text) { S.log.unshift({ kind, text }); if (S.log.length > 60) S.log.pop(); }
  function write(n) {
    const val = VALUES[S.next % VALUES.length], comp = component(n);
    if (S.mode === 'CP' && comp.length < 2) { S.stats.rejected++; log('reject', `Write ${val.name} on ${n} refused. ${n} can’t reach a majority (2 of 3).`); flash(n, 'bad'); emit({ type: 'write', node: n, ok: false }); return; }
    S.next++; const ts = ++S.clock;
    comp.forEach(m => { const nd = S.nodes[m]; nd.v = val; nd.ts = ts; nd.seen.add(ts); }); unionSeen(comp);
    S.acked.push({ v: val, ts, node: n }); S.stats.acked++;
    if (S.mode === 'CP' && NAMES.some(m => component(m).length < NAMES.length)) S.cpMajorityWrite = true;
    const others = comp.filter(m => m !== n);
    log('ok', others.length ? `${n} stored ${val.name} (t=${ts}), copied it to ${list(others)}, then confirmed.` : `${n} stored ${val.name} (t=${ts}) and confirmed right away. No other node has it.`);
    others.forEach(m => sendPacket(path(n, m), val.c)); flash(n, 'ok'); emit({ type: 'write', node: n, ok: true });
  }
  function read(n) {
    const comp = component(n);
    if (S.mode === 'CP' && comp.length < 2) { S.stats.rejected++; log('reject', `Read on ${n} refused. Without a majority, ${n} can’t be sure its copy is current.`); flash(n, 'bad'); emit({ type: 'read', node: n, ok: false }); return; }
    const res = S.mode === 'CP' ? comp.map(m => S.nodes[m]).reduce((a, b) => (b.ts > a.ts ? b : a)) : S.nodes[n], latest = latestAcked();
    if (S.mode === 'CP') comp.filter(m => m !== n).forEach(m => sendPacket(path(m, n), res.v.c));
    if (res.ts < latest.ts) { S.stats.stale++; log('stale', `${n} returned ${res.v.name} (t=${res.ts}), but ${latest.v.name} (t=${latest.ts}) was already confirmed on ${latest.node}.`); flash(n, 'warn'); emit({ type: 'read', node: n, ok: true, stale: true }); }
    else { log('ok', `${n} returned ${res.v.name} (t=${res.ts}), the latest confirmed value.`); flash(n, 'ok'); emit({ type: 'read', node: n, ok: true, stale: false }); }
  }
  function reconcile() {
    const done = new Set();
    for (const n of NAMES) { if (done.has(n)) continue; const comp = component(n); comp.forEach(m => done.add(m));
      const wName = comp.reduce((a, b) => (S.nodes[b].ts > S.nodes[a].ts ? b : a)), w = S.nodes[wName], wSeen = new Set(w.seen);
      for (const m of comp) { const nd = S.nodes[m]; if (nd.ts >= w.ts) continue;
        if (!wSeen.has(nd.ts) && !S.lost.has(nd.ts)) { S.lost.add(nd.ts); S.stats.lost++; const who = S.acked.find(a => a.ts === nd.ts);
          log('lost', `Conflict: ${nd.v.name} (t=${nd.ts}, confirmed on ${who ? who.node : m}) vs ${w.v.name} (t=${w.ts}). Last-write-wins kept ${w.v.name}. The ${nd.v.name} write is gone.`); }
        nd.v = w.v; nd.ts = w.ts; sendPacket(path(wName, m), w.v.c); }
      unionSeen(comp); }
  }
  function setLinks(next) {
    const healed = Object.keys(next).some(k => next[k] && !S.links[k]); Object.assign(S.links, next); if (healed) reconcile();
    const groups = []; NAMES.forEach(n => { if (!groups.some(g => g.includes(n))) groups.push(component(n)); });
    log('net', allUp() ? 'Network healthy. All nodes can talk.' : groups.length === 1 ? 'One link is cut, but every node can still reach the others through a detour.' : groups.length === 3 ? 'Every link is cut. Each node is alone.' : `Partition: ${groups.map(g => '{' + g.join(', ') + '}').join(' | ')} can’t reach each other.`);
    emit({ type: allUp() && healed ? 'heal' : 'net' });
  }
  function setMode(m) { if (S.mode === m) return; S.mode = m; log('mode', m === 'CP' ? 'Switched to CP. Nodes without a majority now refuse requests.' : 'Switched to AP. Every node now answers using its own copy.'); emit({ type: 'mode' }); }
  const STEPS = [
    { title: 'Write on A while the network is healthy', hint: 'Press Write under node A.', done: 'A copied the value to B and C before confirming. With no partition you get C and A together.', check: e => e.type === 'write' && e.ok && e.node === 'A' && allUp() },
    { title: 'Isolate node C', hint: 'Click the A–C and B–C links, or press "Isolate C".', done: 'C is still running but can’t exchange messages with A or B. That’s a partition.', check: () => isolated('C') },
    { title: 'In CP mode, write on C', hint: 'Make sure CP is selected, then press Write under C.', done: 'C refused, because a write needs 2 of 3 nodes. That keeps the data consistent at the cost of availability.', check: e => e.type === 'write' && !e.ok && e.node === 'C' && S.mode === 'CP' },
    { title: 'Write on A, then read on C', hint: 'A and B still form a majority. Then press Read under C.', done: 'The majority kept working, and C refused rather than return possibly stale data.', check: e => e.type === 'read' && !e.ok && e.node === 'C' && S.cpMajorityWrite },
    { title: 'Switch to AP and write on both sides', hint: 'Choose AP, then write on C and on A.', done: 'Both sides accepted conflicting writes. Every node stayed available, and consistency is gone.', check: () => diverged() },
    { title: 'Read from the side that missed the newest write', hint: 'If A wrote last, read on C, and the other way round.', done: 'A stale read: an old value even though a newer write was confirmed.', check: e => e.type === 'read' && e.stale },
    { title: 'Heal the partition', hint: 'Repair the links or press "Healthy".', done: 'Last-write-wins settled the conflict and silently dropped a confirmed write. CRDTs or app-level merges can avoid that.', check: e => e.type === 'heal' }
  ];
  function emit(e) { while (S.step < STEPS.length && STEPS[S.step].check(e)) { S.step++; e = { type: 'state' }; } render(); }
  function build() {
    const lg = $('links'), ng = $('nodes');
    for (const [k, [a, b]] of Object.entries(LINKS)) { const p = POS[a], q = POS[b], mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
      const g = svgEl('g', { class: 'link', id: 'l-' + k, tabindex: 0, role: 'button' }, lg);
      g.innerHTML = `<line class="hit" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/><line class="wire" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/><g class="cut"><circle cx="${mx}" cy="${my}" r="12"/><text x="${mx}" y="${my + 5}" text-anchor="middle">✕</text></g>`;
      const toggle = () => setLinks({ [k]: !S.links[k] }); g.addEventListener('click', toggle); g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(); } }); }
    for (const n of NAMES) { const { x, y } = POS[n]; const g = svgEl('g', { class: 'node', id: 'n-' + n, transform: `translate(${x} ${y})` }, ng);
      g.innerHTML = `<circle class="ring" r="38"/><text class="letter" text-anchor="middle" y="11">${n}</text><text class="val" text-anchor="middle" y="62"></text><text class="badge-t" text-anchor="middle" y="-52"></text>`; }
    $('clients').innerHTML = NAMES.map(n => `<div class="client"><b>Node ${n}</b><div class="btns"><button class="btn primary" data-act="write" data-node="${n}">Write</button><button class="btn" data-act="read" data-node="${n}">Read</button></div></div>`).join('');
  }
  function render() {
    $('mode-cp').setAttribute('aria-pressed', S.mode === 'CP'); $('mode-ap').setAttribute('aria-pressed', S.mode === 'AP');
    $('mode-desc').innerHTML = S.mode === 'CP' ? '<b>CP:</b> a node serves requests only if it can reach a majority (2 of 3). Cut-off nodes refuse.' : '<b>AP:</b> every node always answers from its own copy. Conflicts are resolved later.';
    const L = latestAcked(); $('latest').innerHTML = `Latest confirmed: <span class="swatch" style="background:${L.v.c}"></span> ${L.v.name} t=${L.ts}`;
    for (const k of Object.keys(LINKS)) { const el = $('l-' + k), [a, b] = LINKS[k]; el.classList.toggle('down', !S.links[k]); el.setAttribute('aria-label', `Link ${a}–${b}, ${S.links[k] ? 'connected' : 'cut'}`); }
    for (const n of NAMES) { const g = $('n-' + n), nd = S.nodes[n], comp = component(n);
      g.querySelector('.ring').style.stroke = nd.v.c; g.querySelector('.val').textContent = `${nd.v.name} · t=${nd.ts}`;
      const badge = g.querySelector('.badge-t'); if (comp.length === 1) { badge.textContent = S.mode === 'CP' ? 'no quorum' : 'isolated'; badge.setAttribute('class', 'badge-t ' + (S.mode === 'CP' ? 'fill-bad' : 'fill-warn')); } else badge.textContent = ''; }
    const nv = VALUES[S.next % VALUES.length]; $('next-sw').style.background = nv.c; $('next-name').textContent = nv.name;
    for (const k of Object.keys(S.stats)) $('s-' + k).textContent = S.stats[k];
    $('steps').innerHTML = STEPS.map((s, i) => { const st = i < S.step ? 'done' : i === S.step ? 'current' : ''; const body = i < S.step ? s.done : i === S.step ? s.hint : '';
      return `<li class="step ${st}"><span class="mark">${i < S.step ? '✓' : i + 1}</span><span class="title">${s.title}</span>${body ? `<span class="body">${body}</span>` : ''}</li>`; }).join('')
      + (S.step >= STEPS.length ? '<li class="complete-banner">Experiment complete. Try isolating A instead, or switch modes mid-partition.</li>' : '');
    $('log').innerHTML = S.log.map(e => logRow(e.kind, e.text)).join('');
    W.cap = { step: S.step, lost: S.stats.lost, cpMajorityWrite: S.cpMajorityWrite };
    tick();
  }
  function flash(n, kind) { const g = $('n-' + n); g.classList.remove('flash-bad', 'flash-warn', 'flash-ok'); void g.getBoundingClientRect(); g.classList.add('flash-' + kind); setTimeout(() => g.classList.remove('flash-' + kind), 750); }
  function sendPacket(p, color) { if (reduceMotion || p.length < 2) return; const c = svgEl('circle', { r: 7, fill: color, stroke: 'var(--surface)', 'stroke-width': 2 }, $('packets'));
    const anim = c.animate(p.map(n => ({ transform: `translate(${POS[n].x}px, ${POS[n].y}px)` })), { duration: 550 * (p.length - 1), easing: 'ease-in-out' }); anim.onfinish = () => c.remove(); }
  $('clients').addEventListener('click', e => { const b = e.target.closest('button[data-act]'); if (b) (b.dataset.act === 'write' ? write : read)(b.dataset.node); });
  $('mode-cp').onclick = () => setMode('CP'); $('mode-ap').onclick = () => setMode('AP');
  const PRE = { healthy: { AB: true, AC: true, BC: true }, isoC: { AB: true, AC: false, BC: false }, isoA: { AB: false, AC: false, BC: true }, split: { AB: false, AC: false, BC: false } };
  document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => setLinks({ ...PRE[b.dataset.preset] })));
  $('reset').onclick = () => { S = fresh(); render(); };
  S = fresh(); build();
  return { render };
})();

// ---------- Consistency models ----------
const OUTCOMES = ['Carol sees the post and the reply.', 'Carol sees the post, but not the reply yet.', 'Carol sees an empty thread.', 'Carol sees "Welcome home!" with no post above it.', 'Carol sees both, refreshes, and the reply disappears.', 'Alice refreshes and her own post is missing.', 'Dave sees his post first, then Erin’s. Erin sees hers first, then Dave’s.'];
const MODELS = [
  { name: 'Linearizable', sub: 'one copy, real time', allow: [0], rule: 'Every operation appears to happen at one instant between its start and its confirmation. Once a write is confirmed, everyone sees it.', cap: 'CAP’s "C". It can’t stay available during a partition.', sys: 'etcd, ZooKeeper writes, Spanner, DynamoDB strongly consistent reads.' },
  { name: 'Sequential', sub: 'one global order, may lag', allow: [0, 1, 2], rule: 'Everyone sees operations in the same order, and each client’s own operations stay in program order. That order may lag real time.', cap: 'Needs coordination, so it isn’t available during a partition.', sys: 'ZooKeeper reads (without sync), classic multiprocessor memory models.' },
  { name: 'Causal', sub: 'causes before effects', allow: [0, 1, 2, 6], rule: 'Causally related writes (Bob read the post, then replied) are seen in order by everyone. Concurrent writes may appear in different orders.', cap: 'The strongest model that can stay available during a partition, with sticky clients.', sys: 'MongoDB causal sessions, COPS, CRDT-based apps.' },
  { name: 'Session', sub: 'read-your-writes, monotonic reads', allow: [0, 1, 2, 3, 6], rule: 'Guarantees only about your own session: you see your own writes and never go back in time.', cap: 'Available if each client sticks to one replica.', sys: 'Session guarantees from Bayou (Terry et al.), e.g. sticky routing to one replica. sticky sessions.' },
  { name: 'Eventual', sub: 'converges if writes stop', allow: [0, 1, 2, 3, 4, 5, 6], rule: 'If writes stop, all replicas eventually agree. Until then, almost anything can be observed.', cap: 'Always available. The AP mode in the CAP lab.', sys: 'Cassandra at ONE, DynamoDB default reads, DNS, CDN caches.' }
];
let modelSel = 2; W.models = { visited: new Set([2]) };
function renderModels() {
  $('m-list').innerHTML = MODELS.map((m, i) => `<button class="mbtn" data-m="${i}" aria-pressed="${i === modelSel}"><span class="eyebrow">${i === 0 ? 'strongest' : i === MODELS.length - 1 ? 'weakest' : 'level ' + (i + 1)}</span><b>${m.name}</b><small>${m.sub}</small></button>`).join('');
  const m = MODELS[modelSel];
  $('m-outcomes').innerHTML = OUTCOMES.map((o, i) => `<li>${i === 0 ? '<span class="pill ok">EXPECTED</span>' : m.allow.includes(i) ? '<span class="pill yes">POSSIBLE</span>' : '<span class="pill no">RULED OUT</span>'}<span>${o}</span></li>`).join('');
  $('m-facts').innerHTML = `<p><b>Rule:</b> ${m.rule}</p><p><b>CAP:</b> ${m.cap}</p><p><b>Found in:</b> ${m.sys}</p>`;
  W.models.visited.add(modelSel); tick();
}
$('m-list').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (b) { modelSel = +b.dataset.m; renderModels(); } });

// ---------- Isolation levels ----------
const LEVELS = [['RU', 'Read Uncommitted'], ['RC', 'Read Committed'], ['RR', 'Repeatable Read'], ['SI', 'Snapshot Isolation'], ['SER', 'Serializable']];
const ANOMS = [
  { id: 'dirtywrite', prev: ['RU', 'RC', 'RR', 'SI', 'SER'], name: 'Dirty write', steps: [[1, 'write x = 1'], [2, 'write x = 2'], [2, 'write y = 2'], [1, 'write y = 1'], [1, 'commit'], [2, 'commit']], bad: 'Final state x = 2, y = 1, a mix of both transactions.', how: 'All levels hold write locks until commit, so T2 waits for T1.' },
  { id: 'dirtyread', prev: ['RC', 'RR', 'SI', 'SER'], name: 'Dirty read', steps: [[1, 'write balance = 0 (was 100)'], [2, 'read balance → 0'], [1, 'abort']], bad: 'T2 acted on a balance that never really existed.', how: 'T2 only sees committed data, so it reads 100.' },
  { id: 'fuzzy', prev: ['RR', 'SI', 'SER'], name: 'Non-repeatable read', steps: [[1, 'read x → 10'], [2, 'write x = 20'], [2, 'commit'], [1, 'read x → 20']], bad: 'The same read gave two different answers inside one transaction.', how: 'A read lock (RR) or a snapshot (SI) makes T1 see 10 both times.' },
  { id: 'lostupdate', prev: ['RR', 'SI', 'SER'], name: 'Lost update', steps: [[1, 'read counter → 10'], [2, 'read counter → 10'], [1, 'write counter = 11'], [1, 'commit'], [2, 'write counter = 11'], [2, 'commit']], bad: 'Two increments, but the final value is 11.', how: 'RR: T2’s write conflicts with T1’s lock and one aborts. SI: first committer wins, so T2 aborts, retries, and gets 12. Careful: MySQL InnoDB’s RR allows this lost update.' },
  { id: 'readskew', prev: ['RR', 'SI', 'SER'], name: 'Read skew', steps: [[1, 'read A → 50'], [2, 'move 50 from B to A: A = 100, B = 0'], [2, 'commit'], [1, 'read B → 0']], bad: 'T1 sees a total of 50 instead of 100. The money looks like it vanished.', how: 'T1 reads everything from one consistent point in time.' },
  { id: 'phantom', prev: ['SI', 'SER'], name: 'Phantom read', steps: [[1, 'count bookings for room 5 → 2'], [2, 'insert booking for room 5'], [2, 'commit'], [1, 'count bookings for room 5 → 3']], bad: 'A new row appeared in the middle of T1.', how: 'A snapshot (SI) or predicate locks (serializable) keep the result stable. ANSI RR allows phantoms, though many real RR implementations prevent them.' },
  { id: 'writeskew', prev: ['RR', 'SER'], name: 'Write skew', steps: [[1, 'read on-call doctors → Alice, Bob'], [2, 'read on-call doctors → Alice, Bob'], [1, 'set Alice off-call'], [2, 'set Bob off-call'], [1, 'commit'], [2, 'commit']], bad: 'Nobody is on call, even though each transaction alone kept the rule "at least one on call".', how: 'Serializable (2PL with predicate locks, or SSI) detects the read-write conflict and aborts one transaction. Lock-based Repeatable Read also blocks this exact interleaving: each write waits on the other’s read lock, and the deadlock aborts one. Snapshot isolation takes no read locks, so it allows write skew.' }
];
let IX = { level: 'RC', anom: 'lostupdate' };
function renderIX() {
  $('ix-levels').innerHTML = '<span class="lbl">Level:</span>' + LEVELS.map(([id, n]) => `<button class="chip" data-ixl="${id}" aria-pressed="${IX.level === id}">${n}</button>`).join('');
  $('ix-anoms').innerHTML = '<span class="lbl">Anomaly:</span>' + ANOMS.map(a => `<button class="chip" data-ixa="${a.id}" aria-pressed="${IX.anom === a.id}">${a.name}</button>`).join('');
  const a = ANOMS.find(x => x.id === IX.anom), li = LEVELS.findIndex(l => l[0] === IX.level), prevented = a.prev.includes(IX.level);
  $('ix-run').innerHTML = `<div class="txn"><div class="h">#</div><div class="h">Transaction T1</div><div class="h">Transaction T2</div>${a.steps.map((s, i) => `<div class="n">${i + 1}</div><div>${s[0] === 1 ? s[1] : ''}</div><div>${s[0] === 2 ? s[1] : ''}</div>`).join('')}</div>
    <div class="verdict ${prevented ? 'good' : 'bad'}"><b>${prevented ? `Prevented at ${LEVELS[li][1]}` : `Happens at ${LEVELS[li][1]}`}</b><span>${prevented ? 'This exact interleaving can’t happen: ' + a.how : a.bad}</span></div>`;
  $('ix-table').innerHTML = `<thead><tr><th>Anomaly</th>${LEVELS.map(([id, n]) => `<th class="${id === IX.level ? 'sel' : ''}">${n}</th>`).join('')}</tr></thead><tbody>` +
    ANOMS.map(x => `<tr class="${x.id === IX.anom ? 'sel' : ''}"><td><b>${x.name}</b></td>${LEVELS.map(l => `<td class="${x.prev.includes(l[0]) ? 'pass' : 'fail'}">${x.prev.includes(l[0]) ? 'prevented' : 'possible'}</td>`).join('')}</tr>`).join('') + '</tbody>';
  const fn = $('ix-note'); if (fn) fn.innerHTML = 'Based on Berenson et al. (1995), with Repeatable Read meaning lock-based. RR and SI are incomparable: each prevents something the other allows. Real databases differ: PostgreSQL’s “Repeatable Read” is actually SI, and MySQL’s RR allows lost updates.';
  W.ix = { ...IX }; tick();
}
document.addEventListener('click', e => { const b = e.target.closest('[data-ixl],[data-ixa]'); if (!b) return; if (b.dataset.ixl) IX.level = b.dataset.ixl; else IX.anom = b.dataset.ixa; renderIX(); });

// ---------- 2PC ----------
const TPC = { step: 0, parts: [], coord: '', log: [], recover: false };
W.tpc = { seen: {} };
const PNAMES = ['Orders', 'Payments', 'Inventory'];
const SCOL = { idle: 'muted', preparing: 'accent', prepared: 'warn', committed: 'ok', aborted: 'bad', 'in doubt': 'bad', waiting: 'accent', crashed: 'bad', decided: 'ok' };
function tpcReset() { TPC.step = 0; TPC.parts = PNAMES.map(() => 'idle'); TPC.coord = 'idle'; TPC.log = []; TPC.recover = false; renderTPC(); }
function tpcStep() {
  const no = $('tpc-no').checked, crash = $('tpc-crash').checked;
  if (TPC.step === 0) { TPC.coord = 'waiting'; TPC.parts = PNAMES.map(() => 'preparing'); TPC.log.unshift(logRow('info', 'Phase 1: coordinator sends PREPARE to Orders, Payments and Inventory.')); }
  else if (TPC.step === 1) {
    TPC.parts = PNAMES.map((n, i) => (i === 2 && no) ? 'aborted' : 'prepared');
    TPC.log.unshift(logRow('info', `Votes: Orders YES, Payments YES, Inventory ${no ? 'NO (out of stock, so it aborts locally)' : 'YES'}. YES voters have written their changes durably and hold locks.`));
  } else if (TPC.step === 2) {
    if (no) { TPC.coord = 'decided'; TPC.parts = PNAMES.map(() => 'aborted'); TPC.log.unshift(logRow('bad', 'Phase 2: one NO vote, so the coordinator logs ABORT and tells everyone. Locks are released.')); W.tpc.seen.abort = true; }
    else if (crash) { TPC.coord = 'crashed'; TPC.parts = PNAMES.map(() => 'in doubt'); TPC.recover = true; TPC.log.unshift(logRow('bad', 'Coordinator crashed before sending its decision. Every participant voted YES, so none can decide alone. They are blocked, holding locks.')); W.tpc.seen.blocked = true; }
    else { TPC.coord = 'decided'; TPC.parts = PNAMES.map(() => 'committed'); TPC.log.unshift(logRow('ok', 'Phase 2: all YES, so the coordinator logs COMMIT and tells everyone. The transaction is committed on every node.')); W.tpc.seen.commit = true; }
  } else return;
  TPC.step++; renderTPC();
}
function renderTPC() {
  const cards = [['Coordinator', TPC.coord], ...PNAMES.map((n, i) => [n, TPC.parts[i]])];
  $('tpc-nodes').innerHTML = cards.map(([n, s]) => `<div class="pt"><b>${n}</b><span class="state" style="color:var(--${SCOL[s] || 'muted'})">${s}</span>${s === 'prepared' || s === 'in doubt' ? '<span class="hint">holding locks</span>' : ''}</div>`).join('');
  $('tpc-phase').textContent = ['Ready', 'Phase 1: prepare', 'Votes collected', 'Done'][TPC.step] || 'Done';
  $('tpc-log').innerHTML = TPC.log.join('') || logRow('info', 'Choose failures above, then step through the protocol.');
  $('tpc-step').disabled = TPC.step >= 3; $('tpc-all').disabled = TPC.step >= 3; $('tpc-recover').disabled = !TPC.recover;
  tick();
}
$('tpc-step').onclick = tpcStep; $('tpc-all').onclick = () => { while (TPC.step < 3) tpcStep(); };
$('tpc-reset').onclick = tpcReset; ['tpc-no', 'tpc-crash'].forEach(id => $(id).addEventListener('change', tpcReset));
$('tpc-recover').onclick = () => { TPC.recover = false; TPC.coord = 'decided'; TPC.parts = PNAMES.map(() => 'aborted'); W.tpc.seen.recovered = true;
  TPC.log.unshift(logRow('info', 'Coordinator recovers. Its log has no COMMIT record, so it sends ABORT. Participants finally release their locks.')); renderTPC(); };

const SAGA = [['Book flight', 'Cancel flight', 'flight'], ['Reserve hotel', 'Cancel hotel', 'hotel'], ['Rent car', 'Cancel car', 'car'], ['Charge card', 'Refund card', 'card']];
let sgFail = 'car', sgState = SAGA.map(() => 'pending'), sgRunning = false; W.sg = { ranFail: null };
function renderSaga() {
  $('sg-fail').innerHTML = '<span class="lbl">Make this step fail:</span>' + [['none', 'Nothing'], ...SAGA.slice(1).map(s => [s[2], s[0]])].map(([id, n]) => `<button class="chip" data-sgf="${id}" aria-pressed="${sgFail === id}">${n}</button>`).join('');
  const col = { pending: 'muted', running: 'accent', done: 'ok', failed: 'bad', compensated: 'warn', skipped: 'muted' };
  $('sg-steps').innerHTML = SAGA.map((s, i) => `<div class="pt"><b>${s[0]}</b><span class="state" style="color:var(--${col[sgState[i]]})">${sgState[i]}</span><span class="hint">Undo: ${s[1]}</span></div>`).join('');
  $('sg-run').disabled = sgRunning;
}
document.addEventListener('click', e => { const b = e.target.closest('[data-sgf]'); if (b && !sgRunning) { sgFail = b.dataset.sgf; sgState = SAGA.map(() => 'pending'); $('sg-log').innerHTML = ''; $('sg-result').textContent = ''; renderSaga(); } });
$('sg-run').onclick = () => {
  sgRunning = true; sgState = SAGA.map(() => 'pending'); const logs = []; const seq = [];
  const failIdx = SAGA.findIndex(s => s[2] === sgFail);
  for (let i = 0; i < SAGA.length; i++) { if (i === failIdx) { seq.push(() => { sgState[i] = 'failed'; logs.unshift(logRow('bad', `${SAGA[i][0]} failed. Running compensations in reverse order.`)); }); for (let j = i - 1; j >= 0; j--) seq.push(() => { sgState[j] = 'compensated'; logs.unshift(logRow('warn', `${SAGA[j][1]}: undoes "${SAGA[j][0]}".`)); }); for (let k = i + 1; k < SAGA.length; k++) seq.push(() => { sgState[k] = 'skipped'; }); break; }
    seq.push(() => { sgState[i] = 'done'; logs.unshift(logRow('ok', `${SAGA[i][0]} committed locally. Other services can already see it.`)); }); }
  let k = 0; const stepF = () => { if (k < seq.length) { seq[k++](); $('sg-log').innerHTML = logs.join(''); renderSaga(); setTimeout(stepF, reduceMotion ? 0 : 450); }
    else { sgRunning = false; $('sg-result').textContent = failIdx < 0 ? 'Trip booked.' : 'Trip cancelled cleanly, and the earlier steps were undone.'; W.sg.ranFail = failIdx < 0 ? 'none' : sgFail; renderSaga(); tick(); } };
  stepF();
};

// ---------- Raft ----------
const RF = (() => {
  const POS = [[260, 62], [420, 160], [362, 318], [158, 318], [100, 160]];
  let N, groups, nextVal, logs, crashedLeader;
  function reset() { N = POS.map((_, i) => ({ id: i, name: 'S' + (i + 1), role: i === 0 ? 'leader' : 'follower', term: 1, alive: true, log: [{ term: 1, v: 'a' }, { term: 1, v: 'b' }], commit: 2 }));
    groups = null; nextVal = 2; logs = [logRow('info', 'S1 is leader for term 1. Two entries are committed on every node.')]; crashedLeader = false; W.rf = W.rf || {}; render(); }
  const same = (a, b) => !groups || groups.some(g => g.includes(a) && g.includes(b));
  const reach = (a, b) => N[a].alive && N[b].alive && same(a, b);
  const upToDate = (a, b) => { const la = a.log[a.log.length - 1], lb = b.log[b.log.length - 1]; const ta = la ? la.term : 0, tb = lb ? lb.term : 0; return ta !== tb ? ta > tb : a.log.length >= b.log.length; };
  function newestLeader() { return N.filter(n => n.alive && n.role === 'leader').sort((a, b) => b.term - a.term)[0]; }
  function heartbeat() {
    N.filter(n => n.alive && n.role === 'leader').forEach(L => {
      N.forEach(F => { if (F === L || !reach(L.id, F.id)) return;
        if (F.term > L.term) { L.role = 'follower'; L.term = F.term; logs.unshift(logRow('info', `${L.name} sees the higher term ${F.term} and steps down.`)); } });
    });
    N.filter(n => n.alive && n.role === 'leader').forEach(L => {
      const peers = N.filter(F => F !== L && reach(L.id, F.id) && F.term <= L.term);
      peers.forEach(F => {
        const lost = F.log.filter((e, i) => !L.log[i] || L.log[i].v !== e.v);
        if (lost.length) { lost.forEach(e => { if (e.minority) W.rf.minorityDiscarded = true; });
          logs.unshift(logRow('lost', `${F.name}’s uncommitted entr${lost.length > 1 ? 'ies' : 'y'} ${lost.map(e => e.v).join(', ')} discarded and replaced by leader ${L.name}’s log.`)); }
        F.log = L.log.map(e => ({ ...e })); F.term = L.term; F.role = 'follower';
      });
      if (peers.length + 1 >= 3) { L.commit = L.log.length; L.log.forEach(e => { delete e.minority; }); peers.forEach(F => { F.commit = L.commit; F.log.forEach(e => { delete e.minority; }); }); }
    });
  }
  function write(target) {
    const L = target != null ? N[target] : newestLeader();
    if (!L || !L.alive) { logs.unshift(logRow('bad', 'No reachable leader. Let election timeouts fire first.')); render(); return; }
    if (L.role !== 'leader') { logs.unshift(logRow('info', `${L.name} is a follower and would redirect the client to the leader.`)); render(); return; }
    const v = String.fromCharCode(97 + nextVal++ % 26); const peers = N.filter(F => F !== L && reach(L.id, F.id) && F.term <= L.term);
    L.log.push({ term: L.term, v, minority: peers.length + 1 < 3 });
    heartbeat();
    const committed = L.commit === L.log.length;
    if (committed && N.some(n => !n.alive)) W.rf.committedWithDown = true;
    logs.unshift(logRow(committed ? 'ok' : 'warn', committed ? `${L.name} replicated "${v}" to a majority (${peers.length + 1}/5). Committed.` : `${L.name} stored "${v}" but only ${peers.length + 1} of 5 nodes have it. NOT committed, and the client waits.`));
    render();
  }
  function tick2() {
    const comps = []; N.filter(n => n.alive).forEach(n => { if (!comps.some(c => c.includes(n.id))) comps.push(N.filter(m => m.alive && same(n.id, m.id)).map(m => m.id)); });
    let any = false;
    comps.forEach(c => {
      const maxTerm = Math.max(...c.map(i => N[i].term));
      if (c.some(i => N[i].role === 'leader' && N[i].term === maxTerm)) return;
      any = true;
      const tryElect = (cand, note) => {
        cand.term = maxTerm + 1; cand.role = 'candidate';
        const voters = c.filter(i => i !== cand.id && upToDate(cand, N[i]));
        const votes = 1 + voters.length;
        if (votes >= 3) { cand.role = 'leader'; c.forEach(i => { if (i !== cand.id) { N[i].term = cand.term; N[i].role = 'follower'; } });
          logs.unshift(logRow('ok', `${note}${cand.name} timed out first, started term ${cand.term} and won ${votes} votes. It’s the new leader.`)); if (crashedLeader) W.rf.electedAfterCrash = true; return true; }
        logs.unshift(logRow('warn', `${note}${cand.name} started term ${cand.term} but got only ${votes} vote${votes > 1 ? 's' : ''}${c.length < 3 ? '. This side has no majority, so it can never elect a leader.' : ' because its log is behind. Another node will time out.'}`));
        return false;
      };
      const pick = N[c[Math.floor(Math.random() * c.length)]];
      if (!tryElect(pick, '') && c.length >= 3) { const best = c.map(i => N[i]).sort((a, b) => upToDate(a, b) ? -1 : 1)[0]; tryElect(best, ''); }
    });
    if (!any) logs.unshift(logRow('info', 'Every group already has a current leader sending heartbeats, so no timeouts fire.'));
    heartbeat(); render();
  }
  function render() {
    const svg = $('rf-svg'); svg.innerHTML = '';
    if (groups) { svgEl('line', { x1: 40, y1: 250, x2: 480, y2: 100, stroke: 'var(--bad)', 'stroke-width': 2, 'stroke-dasharray': '8 6' }, svg); }
    N.forEach((n, i) => { const [x, y] = POS[i];
      const col = !n.alive ? 'var(--bad)' : n.role === 'leader' ? 'var(--accent)' : n.role === 'candidate' ? 'var(--warn)' : 'var(--muted)';
      const g = svgEl('g', { style: 'cursor:pointer', 'data-rfn': i, tabindex: 0, role: 'button', 'aria-label': `Send a client write to node ${i + 1}` }, svg);
      svgEl('circle', { cx: x, cy: y, r: 30, fill: 'var(--surface)', stroke: col, 'stroke-width': n.role === 'leader' ? 6 : 3, 'stroke-dasharray': n.alive ? '' : '5 4' }, g);
      svgEl('text', { x, y: y + 2, 'text-anchor': 'middle', class: 'letter', style: 'font-size:18px' }, g).textContent = n.name;
      svgEl('text', { x, y: y + 18, 'text-anchor': 'middle', class: 'sv-muted' }, g).textContent = `term ${n.term}`;
      svgEl('text', { x, y: y - 38, 'text-anchor': 'middle', class: 'badge-t', fill: col }, g).textContent = !n.alive ? 'crashed' : n.role;
      const w = 16, start = x - (Math.min(n.log.length, 8) * w) / 2;
      n.log.slice(-8).forEach((e, k) => { const idx = n.log.length - Math.min(n.log.length, 8) + k, committed = idx < n.commit;
        svgEl('rect', { x: start + k * w, y: y + 38, width: 13, height: 15, rx: 2, fill: committed ? 'var(--accent)' : 'var(--surface)', stroke: 'var(--accent)', 'stroke-width': 1.5 }, g);
        svgEl('text', { x: start + k * w + 6.5, y: y + 49, 'text-anchor': 'middle', style: 'font:600 9px var(--f-mono)', fill: committed ? 'var(--surface)' : 'var(--accent)' }, g).textContent = e.term; });
    });
    const L = newestLeader(); $('rf-term').textContent = L ? `Leader ${L.name} · term ${L.term}` : 'No leader';
    $('rf-log').innerHTML = logs.slice(0, 40).join('');
    tick();
  }
  $('rf-svg').addEventListener('click', e => { const g = e.target.closest('[data-rfn]'); if (g) write(+g.dataset.rfn); });
  $('rf-svg').addEventListener('keydown', e => { const g = e.target.closest('[data-rfn]'); if (!g || (e.key !== 'Enter' && e.key !== ' ')) return; e.preventDefault(); const i = g.dataset.rfn; write(+i); const n = $('rf-svg').querySelector(`[data-rfn="${i}"]`); if (n) n.focus(); });
  $('rf-write').onclick = () => write(null);
  $('rf-tick').onclick = tick2;
  $('rf-crash').onclick = () => { const L = newestLeader(); if (!L) { logs.unshift(logRow('info', 'There is no live leader to crash.')); render(); return; } L.alive = false; crashedLeader = true; logs.unshift(logRow('bad', `${L.name} crashed. Followers stop receiving heartbeats.`)); render(); };
  $('rf-restart').onclick = () => { N.forEach(n => { if (!n.alive) { n.alive = true; n.role = 'follower'; logs.unshift(logRow('info', `${n.name} restarts as a follower.`)); } }); heartbeat(); render(); };
  $('rf-split').onclick = () => { const L = newestLeader(); if (!L) return; const buddy = (L.id + 1) % 5; groups = [[L.id, buddy], [0, 1, 2, 3, 4].filter(i => i !== L.id && i !== buddy)]; logs.unshift(logRow('net', `Network split: {${groups[0].map(i => 'S' + (i + 1)).join(', ')}} | {${groups[1].map(i => 'S' + (i + 1)).join(', ')}}. Click the old leader to write to it.`)); render(); };
  $('rf-heal').onclick = () => { groups = null; logs.unshift(logRow('net', 'Network healed.')); heartbeat(); render(); };
  $('rf-reset').onclick = reset;
  reset();
  return { render };
})();

// ---------- Vector clocks ----------
const VC = (() => {
  let ev, flight, sel, msgN, userDelivered = false;
  W.vc = { foundConcurrent: false, foundMislead: false, delivered: false };
  const clocks = () => [0, 1, 2].map(p => { const mine = ev.filter(e => e.p === p); return mine.length ? mine[mine.length - 1] : { L: 0, V: [0, 0, 0] }; });
  function add(p, kind, extra) { const last = clocks()[p]; const V = [...last.V]; let L = last.L;
    if (kind === 'recv') { for (let i = 0; i < 3; i++) V[i] = Math.max(V[i], extra.V[i]); L = Math.max(L, extra.L); }
    V[p]++; L++; const e = { id: ev.length, p, kind, L, V, ...extra.meta }; ev.push(e); return e; }
  const local = p => add(p, 'local', { meta: {} });
  const send = (p, q) => { const e = add(p, 'send', { meta: { to: q } }); flight.push({ n: ++msgN, from: p, to: q, L: e.L, V: e.V, sendId: e.id }); };
  const deliver = (i, byUser) => { const m = flight.splice(i, 1)[0]; add(m.to, 'recv', { L: m.L, V: m.V, meta: { from: m.from, sendId: m.sendId, msg: m.n } }); if (byUser) W.vc.delivered = true; };
  function reset() { ev = []; flight = []; sel = []; msgN = 0;
    local(0); send(0, 1); local(2); local(1); deliver(0); send(1, 2); local(0); send(2, 0); deliver(1); local(1); render(); }
  function render() {
    $('vc-ctrl').innerHTML = [0, 1, 2].map(p => `<div class="client"><b>P${p + 1}</b><div class="chips"><button class="btn" data-vcl="${p}">Local event</button>${[0, 1, 2].filter(q => q !== p).map(q => `<button class="btn" data-vcs="${p}" data-to="${q}">Send → P${q + 1}</button>`).join('')}</div></div>`).join('');
    $('vc-flight').innerHTML = flight.length ? '<span class="lbl">In flight:</span>' + flight.map((m, i) => `<button class="chip" data-vcd="${i}">Deliver m${m.n} (P${m.from + 1} → P${m.to + 1})</button>`).join('') : '<span class="hint">No messages in flight. Send one above.</span>';
    const step = 64, width = Math.max(640, 80 + ev.length * step), svg = $('vc-svg');
    svg.setAttribute('viewBox', `0 0 ${width} 230`); svg.style.minWidth = width > 640 ? width + 'px' : '0';
    svg.innerHTML = ''; const Y = [55, 125, 195], X = e => 70 + e.id * step;
    Y.forEach((y, p) => { svgEl('text', { x: 8, y: y + 4, class: 'sv-text' }, svg).textContent = 'P' + (p + 1); svgEl('line', { x1: 40, x2: width - 10, y1: y, y2: y, stroke: 'var(--line)', 'stroke-width': 2 }, svg); });
    ev.filter(e => e.kind === 'recv').forEach(r => { const s = ev[r.sendId]; svgEl('line', { x1: X(s), y1: Y[s.p], x2: X(r), y2: Y[r.p], stroke: 'var(--muted)', 'stroke-width': 1.5 }, svg); });
    flight.forEach(m => { const s = ev[m.sendId]; svgEl('line', { x1: X(s), y1: Y[s.p], x2: X(s) + 30, y2: (Y[s.p] + Y[m.to]) / 2, stroke: 'var(--warn)', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, svg); });
    ev.forEach(e => { const g = svgEl('g', { 'data-vce': e.id, style: 'cursor:pointer', tabindex: 0, role: 'button', 'aria-pressed': sel.includes(e.id), 'aria-label': `P${e.p + 1} event, Lamport ${e.L}, vector ${e.V.join(' ')}` }, svg); const on = sel.includes(e.id);
      svgEl('circle', { cx: X(e), cy: Y[e.p], r: on ? 11 : 8, fill: on ? 'var(--accent)' : e.kind === 'local' ? 'var(--surface)' : 'var(--muted)', stroke: 'var(--accent)', 'stroke-width': 2 }, g);
      svgEl('text', { x: X(e), y: Y[e.p] - 16, 'text-anchor': 'middle', class: 'sv-muted', style: 'font-size:10px' }, g).textContent = `[${e.V.join(',')}]`;
      svgEl('text', { x: X(e), y: Y[e.p] + 24, 'text-anchor': 'middle', class: 'sv-text', style: 'font-size:10px' }, g).textContent = `L${e.L}`; });
    if (sel.length === 2) { const [a, b] = sel.map(i => ev[i]); const le = (x, y) => x.V.every((v, i) => v <= y.V[i]);
      const rel = le(a, b) ? 'ab' : le(b, a) ? 'ba' : 'conc'; const name = e => `P${e.p + 1}·L${e.L}`;
      if (rel === 'conc') { W.vc.foundConcurrent = true; if (a.L !== b.L) W.vc.foundMislead = true; }
      $('vc-cmp').innerHTML = `<div class="verdict ${rel === 'conc' ? 'warn' : 'info'}"><b>${rel === 'ab' ? `${name(a)} → ${name(b)} (happened before)` : rel === 'ba' ? `${name(b)} → ${name(a)} (happened before)` : 'Concurrent: neither could have influenced the other'}</b>
        <span>[${a.V}] vs [${b.V}]. ${rel === 'conc' ? (a.L !== b.L ? `Lamport says ${Math.min(a.L, b.L)} < ${Math.max(a.L, b.L)}, which suggests an order that doesn’t exist. Only the vectors reveal they’re concurrent.` : 'They also have equal Lamport times.') : 'Every entry of the earlier vector is ≤ the later one.'}</span></div>`;
    } else $('vc-cmp').innerHTML = `<p class="hint">${sel.length ? 'Select one more event.' : 'No events selected.'}</p>`;
    tick();
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-vcl],[data-vcs],[data-vcd]'); if (!b) return;
    if (b.dataset.vcl) local(+b.dataset.vcl); else if (b.dataset.vcs) send(+b.dataset.vcs, +b.dataset.to); else deliver(+b.dataset.vcd, true); render(); });
  const pickEv = g => { const id = +g.dataset.vce; sel = sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id].slice(-2); render(); };
  $('vc-svg').addEventListener('click', e => { const g = e.target.closest('[data-vce]'); if (g) pickEv(g); });
  $('vc-svg').addEventListener('keydown', e => { const g = e.target.closest('[data-vce]'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); const id = g.dataset.vce; pickEv(g); const n = $('vc-svg').querySelector(`[data-vce="${id}"]`); if (n) n.focus(); } });
  $('vc-reset').onclick = reset;
  reset(); return { render };
})();

// ---------- Backoff ----------
let boStrat = 'fixed'; W.bo = { strategy: 'fixed' };
function renderBO() {
  document.querySelectorAll('[data-bo]').forEach(b => b.setAttribute('aria-pressed', b.dataset.bo === boStrat));
  const buckets = Array(80).fill(0), r = mulberry32(42);
  for (let c = 0; c < 1000; c++) { let t = 0; for (let k = 0; k < 4; k++) {
    const base = 0.25 * Math.pow(2, k); const wait = boStrat === 'fixed' ? 1 : boStrat === 'exp' ? base : r() * base * 2; t += wait; const bi = Math.floor(t * 10); if (bi < 80) buckets[bi]++; } }
  const peak = Math.max(...buckets);
  $('bo-histo').innerHTML = buckets.map(v => `<i style="height:${Math.max(0.5, 100 * v / 1000)}%" title="${v}"></i>`).join('');
  $('bo-peak').textContent = `Busiest 100 ms: ${peak} retries`;
  W.bo = { strategy: boStrat }; tick();
}
document.querySelectorAll('[data-bo]').forEach(b => b.addEventListener('click', () => { boStrat = b.dataset.bo; renderBO(); }));

const FAILS = [
  ['Split brain', 'A partition leaves two groups, each electing its own leader. Both accept writes and the data forks.', 'Require a strict majority to elect or commit. With an even node count, add a witness.', 'Elasticsearch before 7.0 could split brain when minimum_master_nodes was misconfigured.'],
  ['Zombie leader', 'A leader stalls in a long GC pause, a new leader is elected, and the old one wakes up still writing.', 'Fencing tokens: storage rejects writes with an older epoch number. Leases with bounded clocks.', 'Kleppmann’s Redlock analysis showed that a lock without fencing can be held by two clients.'],
  ['Lost writes on failover', 'The primary confirms a write, then dies before replicating it. The promoted replica doesn’t have it.', 'Sync or quorum replication before confirming, or a documented loss window.', 'GitHub, Oct 2018: a 43-second network break led to a cross-coast MySQL failover and about 24 hours of degraded service.'],
  ['Clock skew with last-write-wins', 'A node whose clock runs 5 s fast wins every conflict, even against newer writes.', 'Logical, vector or hybrid logical clocks, or bounded uncertainty like TrueTime.', 'In Cassandra, NTP drift on one node can silently override newer data.'],
  ['Stale read after an update', 'A user saves, the page reloads from a lagging replica, and the old data reappears.', 'Read-your-writes: route the user to the leader for a while, or pass version tokens.', 'Many apps read from the primary for a few seconds after a write.'],
  ['Gray (asymmetric) partition', 'A reaches B, but B can’t reach A. Leadership flaps back and forth.', 'Raft pre-vote and check-quorum, plus health checks from several vantage points.', 'Cloudflare, Nov 2020: a partially failed switch caused repeated etcd leader elections.'],
  ['Timeout means unknown', 'A request times out. Did it happen? A blind retry may double-charge.', 'Idempotency keys, plus reconciling the outcome later.', 'Two Generals: certainty over a lossy link is impossible.'],
  ['Cascading failure', 'One slow dependency ties up threads upstream, which slows their callers, until everything is down.', 'Timeouts, circuit breakers, bulkheads, load shedding, backpressure.', 'Retry storms often turn small blips into full outages.']
];
$('fails').innerHTML = FAILS.map(f => `<article class="fail"><h4>${f[0]}</h4><dl><div><dt>What happens</dt><dd>${f[1]}</dd></div><div><dt>How systems handle it</dt><dd>${f[2]}</dd></div></dl><p class="real">${f[3]}</p></article>`).join('');

// ---------- Systems table ----------
const SYSTEMS = [
  ['etcd', 'Coordination', 'CP', 'PC/EC', 'Raft. The minority side stops accepting writes. Holds all Kubernetes state.'],
  ['ZooKeeper', 'Coordination', 'CP', 'PC/EC', 'ZAB through a leader. Reads may lag unless the client calls sync(). Building blocks: ephemeral and sequential znodes, watches.'],
  ['Consul', 'Service discovery', 'CP', 'PC/EC', 'Raft key-value store. Optional "stale" reads stay available without a leader.'],
  ['Google Spanner', 'Global SQL', 'CP', 'PC/EC', 'Paxos per shard, 2PC across shards, TrueTime commit wait. Strictly serializable.'],
  ['CockroachDB', 'Distributed SQL', 'CP', 'PC/EC', 'A Raft group per range. Ranges without a majority become unavailable.'],
  ['FoundationDB', 'Ordered key-value', 'CP', 'PC/EC', 'Strictly serializable transactions with optimistic concurrency. Used under Apple CloudKit and Snowflake metadata.'],
  ['MongoDB', 'Document', 'CP', 'PC/EC', 'One primary per replica set, and the minority primary steps down. CP only with majority write and read concerns; secondary or "local" reads can return data that is later rolled back.'],
  ['HBase / BigTable', 'Wide-column', 'CP', 'PC/EC', 'Each region is served by one server, so rows are strongly consistent. WAL plus memtable, flushed to SSTables.'],
  ['Cassandra', 'Wide-column', 'Tunable', 'PA/EL', 'Leaderless ring with gossip. Consistency level per query, LWW timestamps, Paxos for lightweight transactions.'],
  ['Amazon DynamoDB', 'Key-value', 'Tunable', 'PA/EL', 'Managed service: each partition is a leader-based Multi-Paxos group (not the 2007 Dynamo ring). Eventual reads by default; strongly consistent reads and transactions are optional.'],
  ['Riak', 'Key-value', 'AP', 'PA/EL', 'Dynamo-style. Siblings with dotted version vectors, built-in CRDT types.'],
  ['CouchDB', 'Document', 'AP', 'PA/EL', 'Multi-master and offline replication. Conflicts are kept as revisions.'],
  ['Redis (replicated)', 'Cache', 'Other', 'PA/EL', 'Async replication, so a failover can drop confirmed writes. Use it as a cache, not a ledger.'],
  ['Apache Kafka', 'Event log', 'Tunable', 'PC/EC', 'acks=all with min.insync.replicas=2 behaves like CP. Unclean leader election behaves like AP and can lose data.'],
  ['HDFS / GFS', 'File system', 'CP', 'PC/EC', 'A single metadata master and 3× chunk replication. GFS record appends were "at least once" and could duplicate.'],
  ['Elasticsearch', 'Search', 'CP', 'PC/EL', 'Only the cluster state uses a quorum (7.x+). Documents use primary-backup replication, and Jepsen has found lost and dirty writes in the past. Search is near real-time.'],
  ['PostgreSQL + replicas', 'Relational', 'Other', '—', 'One node is "CA". Sync replicas make it CP. Async replicas can lose writes on failover.'],
  ['DNS', 'Name lookup', 'AP', 'PA/EL', 'Always answers from cache. Changes spread as TTLs expire.'],
  ['Git', 'Version control', 'AP', 'PA/EL', 'Every clone accepts commits offline, and humans merge conflicts later.']
];
let sysFilter = 'All'; W.sys = { filter: 'All' };
function renderSystems() {
  $('sys-filters').innerHTML = ['All', 'CP', 'AP', 'Tunable', 'Other'].map(f => `<button class="chip" data-sf="${f}" aria-pressed="${f === sysFilter}">${f === 'Other' ? 'Neither' : f}</button>`).join('');
  $('sys-body').innerHTML = SYSTEMS.filter(s => sysFilter === 'All' || s[2] === sysFilter).map(s => `<tr><td><b>${s[0]}</b></td><td>${s[1]}</td><td><span class="cls ${s[2]}">${s[2] === 'Other' ? 'Neither' : s[2]}</span></td><td class="mono">${s[3]}</td><td class="hint" style="font-size:0.88rem">${s[4]}</td></tr>`).join('');
  W.sys = { filter: sysFilter }; tick();
}
$('sys-filters').addEventListener('click', e => { const b = e.target.closest('[data-sf]'); if (b) { sysFilter = b.dataset.sf; renderSystems(); } });
