/**
 * ANTIGRAVITY screensaver — the dashboard's idle state. After IDLE_MS without
 * input, the board fades to a deep-space canvas where six AI platform marks
 * orbit a bright core and glowing nano-bites stream between them. Live tickers
 * ride the bottom: Hacker News (real front page via the server route) and the
 * Google Trends notebook summary. A click anywhere dismisses it and lands on
 * the gods-eye (JARVIS) tab — "the screen saver you click and it goes to gods
 * eye view". No invented content: a DOWN source says DOWN on the ticker.
 *
 * Platform marks are text lettermarks, not trademarked logos — hence the
 * persistent "Officially Unofficial" disclaimer (legal-safe by design).
 */

const MARKS = ['CL', 'CX', 'HE', 'OL', 'OR', 'FB']; // Claude CLI, Codex, Hermes, Ollama, OmniRoute, Freebuff

export function createScreensaver({ document: doc = globalThis.document, fetch: fetchImpl = globalThis.fetch, idleMs = 120000, refreshMs = 90000 } = {}) {
  let overlay = null;
  let canvas = null;
  let ctx = null;
  let visible = false;
  let raf = 0;
  let refreshTimer = 0;
  let idleTimer = 0;
  let bites = [];
  let t0 = 0;
  let inflight = null;

  function build() {
    if (overlay) return overlay;
    overlay = doc.createElement('div');
    overlay.classList.add('screensaver');
    canvas = doc.createElement('canvas');
    canvas.className = 'ss-canvas';
    overlay.appendChild(canvas);

    const marks = doc.createElement('div');
    marks.className = 'ss-marks';
    marks.textContent = MARKS.join('·');
    overlay.appendChild(marks);

    const news = doc.createElement('div');
    news.className = 'ss-news';
    news.textContent = 'Hacker News — loading…';
    overlay.appendChild(news);

    const trends = doc.createElement('div');
    trends.className = 'ss-trends';
    trends.textContent = 'Trends — loading…';
    overlay.appendChild(trends);

    const disclaimer = doc.createElement('div');
    disclaimer.className = 'ss-disclaimer';
    disclaimer.textContent = 'Officially Unofficial — community lettermarks, not affiliated with or endorsed by any platform.';
    overlay.appendChild(disclaimer);

    overlay.addEventListener('click', () => {
      hide();
      const godsEye = doc.querySelector('.nav-tab[data-tab="jarvis"]');
      if (godsEye && godsEye.click) godsEye.click(); // the real handler switches the tab
    });

    try { ctx = canvas.getContext && canvas.getContext('2d'); } catch { ctx = null; }
    doc.body.appendChild(overlay);
    return overlay;
  }

  function seedBites(w, h) {
    // Nano-bites: tiny glowing packets streaming between orbiting marks.
    bites = Array.from({ length: 36 }, (_v, i) => ({
      a: (i / 36) * Math.PI * 2 + Math.random(),
      r: 60 + Math.random() * 180,
      sp: 0.0004 + Math.random() * 0.0012,
      size: 1 + Math.random() * 2.2,
    }));
    void w; void h;
  }

  function paint(now) {
    if (!visible || !ctx) return;
    const w = canvas.width || 1280;
    const h = canvas.height || 720;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    // core
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90);
    core.addColorStop(0, 'rgba(34,211,238,0.55)');
    core.addColorStop(1, 'rgba(34,211,238,0)');
    ctx.fillStyle = core;
    ctx.fillRect(cx - 90, cy - 90, 180, 180);
    // marks + bites
    MARKS.forEach((m, i) => {
      const a = now * 0.00012 + (i / MARKS.length) * Math.PI * 2;
      const x = cx + Math.cos(a) * 220;
      const y = cy + Math.sin(a) * 130;
      ctx.fillStyle = 'rgba(233,185,73,0.9)';
      ctx.font = '600 18px "JetBrains Mono", monospace';
      ctx.fillText(m, x - 14, y + 6);
    });
    for (const b of bites) {
      b.a += b.sp * 16;
      const x = cx + Math.cos(b.a) * b.r;
      const y = cy + Math.sin(b.a) * b.r * 0.6;
      ctx.fillStyle = 'rgba(125,211,252,0.85)';
      ctx.beginPath();
      ctx.arc(x, y, b.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Animation frame helpers that survive hosts without rAF (tests, odd webviews).
  const rafRequest = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn) => setTimeout(() => fn(Date.now()), 16);
  const rafCancel = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : clearTimeout;

  function loop(now) {
    if (!visible) return;
    paint(now || (t0 += 16));
    raf = rafRequest(loop);
  }

  async function refresh() {
    if (!overlay) return;
    const newsEl = overlay.querySelector('.ss-news');
    const trendsEl = overlay.querySelector('.ss-trends');
    const [news, trends] = await Promise.all([
      fetchImpl('/api/news').then((r) => r.json()).catch((e) => ({ ok: false, error: String(e.message || e) })),
      fetchImpl('/api/trends').then((r) => r.json()).catch((e) => ({ ok: false, error: String(e.message || e) })),
    ]);
    newsEl.textContent = news.ok && news.items && news.items.length
      ? `HN · ${news.items.slice(0, 6).map((x) => `${x.title} (+${x.score})`).join('  ·  ')}`
      : `Hacker News — DOWN (${news.error || 'no items'})`;
    trendsEl.textContent = trends.ok && trends.summary
      ? `Trends notebook · ${trends.summary.datasets.join(', ') || 'no datasets read'} · ${trends.summary.headings.join(' / ') || ''}`
      : `Trends — DOWN (${trends.error || 'unavailable'})`;
  }

  function armIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => show(), idleMs);
  }

  function show() {
    build();
    visible = true;
    overlay.classList.add('visible');
    if (canvas.width !== (doc.body.clientWidth || 1280)) {
      canvas.width = doc.body.clientWidth || 1280;
      canvas.height = doc.body.clientHeight || 720;
      seedBites(canvas.width, canvas.height);
    }
    cancelAnimationFrameSafe();
    raf = rafRequest(loop);
    clearInterval(refreshTimer);
    refreshTimer = setInterval(refresh, refreshMs);
    inflight = refresh(); // resolved by once() so tests can await the live fetch
  }

  function hide() {
    visible = false;
    clearTimeout(idleTimer);
    clearInterval(refreshTimer);
    cancelAnimationFrameSafe();
    if (overlay) overlay.classList.remove('visible');
    armIdle();
  }

  function cancelAnimationFrameSafe() { if (raf) { rafCancel(raf); raf = 0; } }

  function once() {
    return inflight ? Promise.resolve(inflight) : Promise.resolve();
  }

  return { show, hide, once, armIdle };
}
