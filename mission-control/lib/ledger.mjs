/**
 * Ledger panel (Phase B) — the last 30 lines of the shared node ledger via
 * `npm run fable -- ledger --tail 30`, run server-side with a bounded
 * timeout and a 60s cache so the panel never blocks the page on a slow or
 * hung process. On failure the exact error string is returned; the caller
 * must show it as-is, never a fabricated row.
 */
import { execFile } from 'node:child_process';

/** Default runner: shells out to npm (Windows-safe via shell: true). Injected in tests. */
export function defaultRunner(cwd, timeoutMs) {
  return new Promise((resolve) => {
    execFile(
      'npm',
      ['run', 'fable', '--', 'ledger', '--tail', '30'],
      { cwd, timeout: timeoutMs, windowsHide: true, shell: true, encoding: 'utf8' },
      (err, stdout, stderr) => {
        if (err) return resolve({ ok: false, error: String((stderr || err.message || err) || '').trim() || 'ledger command failed' });
        resolve({ ok: true, output: stdout });
      }
    );
  });
}

/**
 * Build a ledger reader bound to one cache. Each call either serves the
 * cached result (within cacheMs) or re-runs the command. The cache holds
 * both successes and failures, so a hung/erroring command is not retried on
 * every page load within the window — the panel just repeats the same error.
 */
export function createLedgerReader({ cwd, runner = defaultRunner, timeoutMs = 15000, cacheMs = 60000, now = Date.now } = {}) {
  let cache = { at: 0, data: null };
  return async function readLedger() {
    const t = now();
    if (cache.data && t - cache.at < cacheMs) return { ...cache.data, cached: true };
    const r = await runner(cwd, timeoutMs);
    const data = r.ok
      ? { ok: true, lines: r.output.split(/\r?\n/).filter((l) => l.length > 0), at: new Date(t).toISOString() }
      : { ok: false, error: r.error, at: new Date(t).toISOString() };
    cache = { at: t, data };
    return { ...data, cached: false };
  };
}
