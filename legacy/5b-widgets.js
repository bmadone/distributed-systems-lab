// ================= WIDGETS: system design =================
const fmtN = n => n >= 1e9 ? (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k' : Math.round(n).toString();
const fmtB = b => { const u = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB']; let i = 0; while (b >= 1000 && i < u.length - 1) { b /= 1000; i++; } return (b >= 100 ? b.toFixed(0) : b.toFixed(1)) + ' ' + u[i]; };
const fmtDur = s => s >= 86400 ? (s / 86400).toFixed(1) + ' days' : s >= 3600 ? (s / 3600).toFixed(1) + ' hours' : s >= 60 ? (s / 60).toFixed(1) + ' min' : s.toFixed(0) + ' s';

// ---------- Architecture explorer ----------
const ARCH = {
  dns: { x: 20, y: 30, n: 'DNS', role: 'Turns app.example.com into IP addresses, often returning the nearest region or edge.', fail: 'Nobody can find your service, even if everything behind it is healthy. Use multiple providers and sensible TTLs.' },
  clients: { x: 20, y: 143, n: 'Clients', role: 'Browsers and mobile apps. They retry, cache and render, and their behavior shapes backend load.', fail: 'Bad client retry logic can cause a retry storm. Clients need backoff and jitter.' },
  cdn: { x: 150, y: 30, n: 'CDN', role: 'Edge caches near users serve static files and video segments, so traffic never reaches your servers.', fail: 'Every request falls back to the origin, which usually can’t handle the full load. Plan origin shielding.' },
  lb: { x: 150, y: 143, n: 'Load balancer', role: 'Spreads requests across healthy app servers and terminates TLS. Layer 4 or layer 7.', fail: 'A single load balancer is a single point of failure. Run redundant pairs or a managed, multi-zone balancer.' },
  app: { x: 290, y: 143, n: 'App servers', role: 'Stateless business logic. Scale out by adding instances behind the load balancer.', fail: 'Lose one and the load balancer routes around it. Lose capacity and latency climbs, so autoscale with headroom.' },
  cache: { x: 430, y: 40, n: 'Cache', role: 'In-memory store like Redis or Memcached for hot reads. Takes most of the read load off the database.', fail: 'The database suddenly takes 10–100× more reads, which can cascade. Warm caches, limit load, and degrade gracefully.' },
  db: { x: 430, y: 143, n: 'DB primary', role: 'The source of truth for writes. ACID transactions live here.', fail: 'Writes stop until failover. With async replicas, recent writes may be lost.' },
  replica: { x: 570, y: 143, n: 'Read replica', role: 'Copies of the primary for read scaling and failover.', fail: 'Read capacity drops, and replication lag means reads can be stale.' },
  queue: { x: 430, y: 250, n: 'Queue', role: 'A durable buffer (Kafka, SQS) for async work such as emails, transcoding and analytics.', fail: 'Producers back up or drop work. Monitor lag, and make consumers idempotent.' },
  workers: { x: 570, y: 250, n: 'Workers', role: 'Background consumers that process queued jobs at their own pace.', fail: 'The queue grows, but users aren’t blocked. That’s the point of going async.' },
  blob: { x: 290, y: 250, n: 'Object storage', role: 'S3 or GCS for images, video and backups. Very durable and cheap per GB.', fail: 'Uploads and media fail. Rare, but use cross-region replication for critical data.' }
};
const AEDGES = [['clients', 'dns'], ['clients', 'cdn'], ['clients', 'lb'], ['cdn', 'blob'], ['lb', 'app'], ['app', 'cache'], ['app', 'db'], ['db', 'replica'], ['app', 'queue'], ['queue', 'workers'], ['workers', 'blob'], ['app', 'blob']];
let axSel = null; W.ax = { visited: new Set() };
function renderAX() {
  const svg = $('ax-svg'); svg.innerHTML = ''; const c = k => [ARCH[k].x + 50, ARCH[k].y + 22];
  AEDGES.forEach(([a, b]) => { const [x1, y1] = c(a), [x2, y2] = c(b); svgEl('line', { x1, y1, x2, y2, stroke: 'var(--line)', 'stroke-width': 2 }, svg); });
  Object.entries(ARCH).forEach(([k, a]) => { const g = svgEl('g', { 'data-ax': k, style: 'cursor:pointer', tabindex: 0, role: 'button', 'aria-label': a.n }, svg);
    svgEl('rect', { x: a.x, y: a.y, width: 100, height: 44, rx: 8, fill: axSel === k ? 'var(--accent-soft)' : 'var(--surface)', stroke: axSel === k ? 'var(--accent)' : W.ax.visited.has(k) ? 'var(--ok)' : 'var(--muted)', 'stroke-width': axSel === k ? 3 : 1.5 }, g);
    svgEl('text', { x: a.x + 50, y: a.y + 27, 'text-anchor': 'middle', class: 'sv-text' }, g).textContent = a.n; });
  const a = axSel && ARCH[axSel];
  $('ax-info').innerHTML = a ? `<div class="grid2"><div class="verdict info"><b>${a.n}: what it does</b><span>${a.role}</span></div><div class="verdict warn"><b>If it fails</b><span>${a.fail}</span></div></div>` : `<p class="hint">${W.ax.visited.size} of ${Object.keys(ARCH).length} explored.</p>`;
  tick();
}
const axPick = k => { axSel = k; W.ax.visited.add(k); renderAX(); };
$('ax-svg').addEventListener('click', e => { const g = e.target.closest('[data-ax]'); if (g) axPick(g.dataset.ax); });
$('ax-svg').addEventListener('keydown', e => { const g = e.target.closest('[data-ax]'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); axPick(g.dataset.ax); } });

// ---------- Availability builder ----------
const TIERS = [{ n: 'Load balancer', a: 0.9999 }, { n: 'App servers', a: 0.999 }, { n: 'Cache', a: 0.999 }, { n: 'Database', a: 0.9995 }];
const avCount = [1, 1, 1, 1]; W.av = {};
function renderAV() {
  const degrade = $('av-degrade').checked;
  const tierA = TIERS.map((t, i) => 1 - Math.pow(1 - t.a, avCount[i]));
  const total = tierA.reduce((p, a, i) => p * (degrade && i === 2 ? 1 : a), 1);
  const instances = avCount.reduce((a, b) => a + b, 0);
  $('av-tiers').innerHTML = TIERS.map((t, i) => `<div class="row" style="border:1px solid var(--line);border-radius:10px;padding:8px 12px;${degrade && i === 2 ? 'opacity:.6' : ''}">
    <span style="min-width:130px"><b>${t.n}</b><br><span class="hint">${pct(t.a, 2)} each</span></span>
    <span class="chips"><button class="btn" data-av="${i}" data-d="-1" aria-label="Remove ${t.n} instance">−</button><b class="mono">×${avCount[i]}</b><button class="btn" data-av="${i}" data-d="1" aria-label="Add ${t.n} instance">+</button></span>
    <span class="mono">${degrade && i === 2 ? 'optional' : pct(tierA[i], 4)}</span></div>`).join('');
  const down = (1 - total) * 365 * 86400;
  const weakest = tierA.map((a, i) => [a, i]).filter(([, i]) => !(degrade && i === 2)).sort((a, b) => a[0] - b[0])[0][1];
  $('av-out').innerHTML = `<div class="verdict ${total >= 0.9999 ? 'good' : total >= 0.999 ? 'warn' : 'bad'}"><b>Overall ${pct(total, 4)}</b><span>About ${fmtDur(down)} of downtime per year, ${fmtDur(down / 12)} per month. ${instances} instances.</span></div>
    <div class="verdict info"><b>Weakest link: ${TIERS[weakest].n}</b><span>Adding redundancy there helps most.</span></div>`;
  W.av = { total, instances }; tick();
}
$('av-tiers').addEventListener('click', e => { const b = e.target.closest('[data-av]'); if (!b) return; const i = +b.dataset.av; avCount[i] = Math.max(1, Math.min(4, avCount[i] + +b.dataset.d)); renderAV(); });
$('av-degrade').addEventListener('change', renderAV);

// ---------- Call chain ----------
const CCS = [{ n: 'Payment', note: 'Charge the card' }, { n: 'Inventory', note: 'Reserve stock' }, { n: 'Email', note: 'Send the receipt' }, { n: 'Analytics', note: 'Record the event' }];
const ccSync = [true, true, true, true]; W.cc = {};
function renderCC() {
  $('cc-svcs').innerHTML = CCS.map((s, i) => `<div class="row" style="border:1px solid var(--line);border-radius:10px;padding:8px 12px"><span><b>${s.n}</b> <span class="hint">· ${s.note}</span></span>
    <div class="seg" role="group" aria-label="${s.n} call mode"><button data-cc="${i}" data-v="1" aria-pressed="${ccSync[i]}">Sync</button><button data-cc="${i}" data-v="0" aria-pressed="${!ccSync[i]}">Async (queue)</button></div></div>`).join('');
  const syncN = ccSync.filter(Boolean).length, anyAsync = ccSync.some(s => !s);
  const avail = 0.9999 * Math.pow(0.995, syncN) * (anyAsync ? 0.9999 : 1), latency = 20 + 80 * syncN + (anyAsync ? 5 : 0);
  $('cc-out').innerHTML = `<div class="verdict ${avail >= 0.994 ? 'good' : avail >= 0.985 ? 'warn' : 'bad'}"><b>Checkout availability ${pct(avail, 2)}</b><span>${syncN} synchronous dependenc${syncN === 1 ? 'y' : 'ies'} multiplied together${anyAsync ? ', plus the queue' : ''}.</span></div>
    <div class="verdict ${latency < 150 ? 'good' : latency < 300 ? 'warn' : 'bad'}"><b>Response time ~${latency} ms</b><span>${anyAsync ? 'Async work happens after the response. If Email is down, messages wait in the queue.' : 'Every call adds 80 ms in sequence.'}</span></div>`;
  W.cc = { paymentSync: ccSync[0], avail, latency }; tick();
}
$('cc-svcs').addEventListener('click', e => { const b = e.target.closest('[data-cc]'); if (!b) return; ccSync[+b.dataset.cc] = b.dataset.v === '1'; renderCC(); });

// ---------- Quadtree ----------
const QPTS = (() => { const r = mulberry32(11), g = () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }, pts = [];
  for (let i = 0; i < 130; i++) pts.push([110 + g() * 35, 120 + g() * 35]); for (let i = 0; i < 110; i++) pts.push([285 + g() * 45, 275 + g() * 45]); for (let i = 0; i < 60; i++) pts.push([r() * 400, r() * 400]);
  return pts.map(([x, y]) => [Math.max(2, Math.min(398, x)), Math.max(2, Math.min(398, y))]); })();
let qtQuery = null; W.qt = { ratio: null };
function qtBuild(cap) { const node = (x, y, w, pts, d) => { if (pts.length <= cap || d >= 8) return { x, y, w, pts }; const h = w / 2, kids = [];
    [[x, y], [x + h, y], [x, y + h], [x + h, y + h]].forEach(([cx, cy]) => kids.push(node(cx, cy, h, pts.filter(p => p[0] >= cx && p[0] < cx + h && p[1] >= cy && p[1] < cy + h), d + 1))); return { x, y, w, kids }; };
  return node(0, 0, 400, QPTS, 0); }
function renderQT() {
  const cap = +$('qt-cap').value; $('qt-cap-out').textContent = cap;
  const root = qtBuild(cap), svg = $('qt-svg'); svg.innerHTML = '';
  svgEl('rect', { x: 0, y: 0, width: 400, height: 400, fill: 'var(--bg)' }, svg);
  let leaves = 0, checked = new Set(), found = 0;
  const q = qtQuery ? { x1: qtQuery[0] - 40, y1: qtQuery[1] - 40, x2: qtQuery[0] + 40, y2: qtQuery[1] + 40 } : null;
  const walk = n => { if (n.kids) { n.kids.forEach(walk); return; } leaves++;
    svgEl('rect', { x: n.x, y: n.y, width: n.w, height: n.w, fill: 'none', stroke: 'var(--line)', 'stroke-width': 1 }, svg);
    if (q && !(n.x > q.x2 || n.x + n.w < q.x1 || n.y > q.y2 || n.y + n.w < q.y1)) n.pts.forEach(p => checked.add(p)); };
  walk(root);
  QPTS.forEach(p => { const isC = checked.has(p), inQ = q && p[0] >= q.x1 && p[0] <= q.x2 && p[1] >= q.y1 && p[1] <= q.y2; if (inQ) found++;
    svgEl('circle', { cx: p[0], cy: p[1], r: inQ ? 3.5 : 2.5, fill: inQ ? 'var(--ok)' : isC ? 'var(--warn)' : 'var(--muted)', opacity: isC || inQ ? 1 : 0.5 }, svg); });
  if (q) svgEl('rect', { x: q.x1, y: q.y1, width: 80, height: 80, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }, svg);
  const ratio = q ? checked.size / QPTS.length : null;
  $('qt-out').innerHTML = q ? `<div class="verdict ${ratio < 0.15 ? 'good' : 'warn'}"><b>Checked ${checked.size} of ${QPTS.length} points (${pct(ratio, 0)})</b><span>A full scan would check all ${QPTS.length}. Orange points were checked but outside the box.</span></div><div class="verdict info"><b>Found ${found} drivers · ${leaves} cells</b><span>Smaller capacity means more, finer cells: fewer wasted checks, more tree to walk.</span></div>`
    : `<div class="verdict info"><b>${leaves} cells</b><span>Click the map to search an 80×80 box.</span></div>`;
  W.qt = { ratio }; tick();
}
$('qt-cap').addEventListener('input', renderQT);
$('qt-svg').addEventListener('keydown', e => {
  const d = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }[e.key];
  if (!d && e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault();
  const [x, y] = qtQuery || [200, 200]; qtQuery = d ? [Math.max(40, Math.min(360, x + d[0])), Math.max(40, Math.min(360, y + d[1]))] : [x, y]; renderQT();
});
$('qt-svg').addEventListener('click', e => { const svg = $('qt-svg'), pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); qtQuery = [p.x, p.y]; renderQT(); });

// ---------- Cache simulator ----------
W.ch = {};
function renderCH() {
  const size = +$('ch-size').value, s = Math.round(+$('ch-skew').value * 10) / 10;
  $('ch-size-out').textContent = size; $('ch-skew-out').textContent = s.toFixed(1);
  const K = 1000, w = Array.from({ length: K }, (_, i) => 1 / Math.pow(i + 1, s)), cum = []; let acc = 0; w.forEach(x => { acc += x; cum.push(acc); });
  const r = mulberry32(5), lru = new Map(); let hits = 0; const REQ = 20000;
  for (let n = 0; n < REQ; n++) { const u = r() * acc; let lo = 0, hi = K - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < u) lo = m + 1; else hi = m; }
    if (size > 0) { if (lru.has(lo)) { hits++; lru.delete(lo); lru.set(lo, 1); } else { lru.set(lo, 1); if (lru.size > size) lru.delete(lru.keys().next().value); } } }
  const hit = hits / REQ, ideal = size ? cum[Math.min(size, K) - 1] / acc : 0, lat = hit * 1 + (1 - hit) * 21;
  $('ch-out').innerHTML = `<div class="stat ok"><span class="n">${pct(hit, 0)}</span><span class="k">Hit ratio (LRU)</span></div><div class="stat"><span class="n">${pct(ideal, 0)}</span><span class="k">Best possible: top ${size} items</span></div>
    <div class="stat ${lat < 6 ? 'ok' : 'warn'}"><span class="n">${lat.toFixed(1)} ms</span><span class="k">Average latency</span></div><div class="stat ${hit > 0.8 ? 'ok' : 'bad'}"><span class="n">${Math.round((1 - hit) * 1000)}</span><span class="k">DB queries per 1,000 requests</span></div>`;
  W.ch = { hit, size, skew: s }; tick();
}
['ch-size', 'ch-skew'].forEach(id => $(id).addEventListener('input', renderCH));

// ---------- Tail latency & Amdahl ----------
W.tl = {}; W.am = {};
function renderTL() {
  const n = +$('tl-n').value, p = 1 - Math.pow(0.99, n); $('tl-n-out').textContent = n;
  $('tl-out').innerHTML = `<div class="verdict ${p < 0.1 ? 'good' : p < 0.5 ? 'warn' : 'bad'}"><b>${pct(p, 1)} of user requests are slow</b><span>1 − 0.99<sup>${n}</sup>. Each backend is slow only 1% of the time.</span></div>
    <div class="verdict info"><b>Fixes</b><span>Hedged requests (send a backup after the p95), tighter timeouts with partial results, and cutting variance at the source, such as GC pauses and noisy neighbors.</span></div>`;
  W.tl = { n, p }; tick();
}
function renderAM() {
  const p = +$('am-p').value / 100, n = +$('am-n').value, sp = 1 / ((1 - p) + p / n), max = p < 1 ? 1 / (1 - p) : Infinity;
  $('am-p-out').textContent = Math.round(p * 100) + '%'; $('am-n-out').textContent = n;
  $('am-out').innerHTML = `<div class="verdict info"><b>Speedup ${sp.toFixed(2)}×</b><span>On ${n} cores, ${pct(sp / n, 0)} parallel efficiency.</span></div><div class="verdict ${max < 20 ? 'warn' : 'good'}"><b>Ceiling ${isFinite(max) ? max.toFixed(1) + '×' : '∞'}</b><span>Even with unlimited cores, the ${Math.round((1 - p) * 100)}% serial part caps the gain.</span></div>`;
  W.am = { sp }; tick();
}
$('tl-n').addEventListener('input', renderTL); ['am-p', 'am-n'].forEach(id => $(id).addEventListener('input', renderAM));

// ---------- Estimator ----------
W.es = {};
function renderES() {
  const dau = Math.round(Math.pow(10, 4 + +$('es-dau').value * 0.05)), wr = +$('es-wr').value, rr = +$('es-rr').value, sz = +$('es-sz').value, pk = +$('es-pk').value, yr = +$('es-yr').value;
  $('es-dau-out').textContent = fmtN(dau); $('es-wr-out').textContent = wr; $('es-rr-out').textContent = rr + ':1'; $('es-sz-out').textContent = sz >= 1000 ? (sz / 1000).toFixed(1) + ' MB' : sz + ' KB'; $('es-pk-out').textContent = pk + '×'; $('es-yr-out').textContent = yr;
  const wq = dau * wr / 86400, rq = wq * rr, peak = (wq + rq) * pk, perYear = dau * wr * sz * 1000 * 365, total = perYear * yr, egress = rq * sz * 1000;
  $('es-out').innerHTML = `<div class="stat"><span class="n">${fmtN(wq)}</span><span class="k">Write QPS (average)</span></div><div class="stat"><span class="n">${fmtN(rq)}</span><span class="k">Read QPS (average)</span></div>
    <div class="stat ${peak > 100000 ? 'bad' : peak > 10000 ? 'warn' : 'ok'}"><span class="n">${fmtN(peak)}</span><span class="k">Peak QPS</span></div><div class="stat"><span class="n">${fmtB(total)}</span><span class="k">Storage over ${yr} yr (${fmtB(perYear)}/yr)</span></div>`;
  const adv = [];
  if (peak > 100000) adv.push('Peak traffic needs many stateless servers, heavy caching or a CDN, and probably sharded storage.');
  else if (peak > 10000) adv.push('A few app servers plus a cache handle this. Consider read replicas.');
  else adv.push('One well-tuned database with a replica for failover is probably enough.');
  if (total > 1e14) adv.push('Over 100 TB: put blobs in object storage and shard the metadata.'); else if (total > 1e12) adv.push('Terabytes: plan partitioning and retention policies early.');
  if (egress > 1e9) adv.push(`About ${fmtB(egress)}/s read egress, so a CDN is essential.`);
  $('es-advice').innerHTML = `<div class="verdict info"><b>What this implies</b><span>${adv.join(' ')}</span></div>`;
  W.es = { peak }; tick();
}
['es-dau', 'es-wr', 'es-rr', 'es-sz', 'es-pk', 'es-yr'].forEach(id => $(id).addEventListener('input', renderES));
