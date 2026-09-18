/**
 * Live news for the screensaver ticker — the popular Hacker News feed (Firebase
 * API, no key, probed server-side so the browser never hits CORS). Real items
 * only: when the source is down the route says so, it never serves stale or
 * invented headlines. Pure module; fetch and the clock are injected for tests.
 */

const HN_BASE = 'https://hacker-news.firebaseio.com/v0';

/** Map one HN item to the ticker shape; empty url becomes the HN discussion link. */
export function normalizeItem(it) {
  if (!it || typeof it !== 'object') return null;
  const id = Number(it.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    title: String(it.title || '').trim(),
    score: Number(it.score || 0),
    comments: Number(it.descendants || 0),
    by: String(it.by || ''),
    time: Number(it.time || 0),
    url: it.url ? String(it.url) : `https://news.ycombinator.com/item?id=${id}`,
  };
}

async function getJson(url, { fetch: f, timeoutMs, signal }) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  const relay = () => { if (signal) signal.addEventListener('abort', () => c.abort(), { once: true }); };
  try {
    relay();
    const r = await f(url, { signal: c.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

/**
 * @param {object} [opts]
 * @param {function} [opts.fetch]    injected fetch (tests); default globalThis.fetch
 * @param {number}   [opts.limit]    max stories returned (default 12)
 * @param {number}   [opts.ttlMs]    cache lifetime (default 120000)
 * @param {number}   [opts.timeoutMs] per-request deadline (default 8000)
 * @param {function} [opts.now]      clock (tests)
 */
export function createNewsService({ fetch: f = globalThis.fetch, limit = 12, ttlMs = 120000, timeoutMs = 8000, now = Date.now } = {}) {
  let cache = { at: 0, result: null };
  const base = (opts) => ({ fetch: f, timeoutMs, ...opts });

  async function fetchFresh() {
    try {
      const ids = await getJson(`${HN_BASE}/topstories.json`, base({}));
      const top = (Array.isArray(ids) ? ids : []).slice(0, limit);
      const items = (await Promise.all(top.map((id) => getJson(`${HN_BASE}/item/${id}.json`, base({})).catch(() => null))))
        .map(normalizeItem).filter(Boolean)
        .sort((a, b) => b.score - a.score); // hottest first, the way the front page means it
      return { ok: true, source: 'Hacker News', items, at: now() };
    } catch (e) {
      return { ok: false, source: 'Hacker News', items: [], error: String(e.message || e) };
    }
  }

  return {
    async getTopStories() {
      if (cache.result && now() - cache.at < ttlMs) return cache.result;
      const r = await fetchFresh();
      if (r.ok) cache = { at: now(), result: r };
      return r; // a failed fetch is returned honestly and NOT cached
    },
  };
}
