/**
 * Rotation engine — the "≤3 tags and ≤3 cities per post, no repeats within a
 * window" core.
 *
 * pick() is pure: state goes in, new state comes out. The engine (engine.js)
 * owns persistence; callers thread `state` across runs so rotation survives
 * restarts. `recent` holds the ids picked in the last `window` selections;
 * a candidate already in `recent` is skipped, so nothing repeats within the
 * window while the pool is large enough. When the window is larger than the
 * pool (or the pool is otherwise exhausted), the fallback fill allows the
 * oldest picks to repeat rather than deadlocking — bounded pools cannot
 * satisfy window >= pool size forever.
 */

/**
 * @param {Array<{id: string}>} pool
 * @param {number} max  maximum items to pick (per post: 3)
 * @param {number} window  recent-window size (in picked items)
 * @param {{cursor?: number, recent?: string[]}} state  rotation state
 * @returns {{picked: Array, state: {cursor: number, recent: string[]}}}
 */
export function pick(pool, max, window, state = {}) {
  const n = pool.length;
  if (n === 0 || max <= 0) {
    return { picked: [], state: { cursor: state.cursor ?? 0, recent: state.recent ?? [] } };
  }

  const cursor = Number.isFinite(state.cursor) ? state.cursor % n : 0;
  const recent = Array.isArray(state.recent) ? state.recent : [];
  const recentSet = new Set(recent);
  const picked = [];

  // Primary pass: walk from cursor, skip anything in the recent window.
  for (let step = 0; step < n && picked.length < max; step++) {
    const item = pool[(cursor + step) % n];
    if (!recentSet.has(item.id)) picked.push(item);
  }

  // Fallback: window larger than pool — fill remaining with the oldest picks
  // (no repeats *within this selection*) rather than returning fewer.
  if (picked.length < max) {
    for (let step = 0; step < n && picked.length < max; step++) {
      const item = pool[(cursor + step) % n];
      if (!picked.some((p) => p.id === item.id)) picked.push(item);
    }
  }

  const nextCursor = (cursor + picked.length) % n;
  const nextRecent = [...recent, ...picked.map((p) => p.id)].slice(-window);

  return { picked, state: { cursor: nextCursor, recent: nextRecent } };
}
