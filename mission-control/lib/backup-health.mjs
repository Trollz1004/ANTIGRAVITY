/**
 * Backup health. The runner scripts/backup-node.mjs writes
 * ops/heartbeat/backup-node.json (gitignored node state, written atomically).
 * This is the pure reader JARVIS serves at /api/backup-health.
 *   - no file at all: NOT CONFIGURED (the runner has never run here)
 *   - a file that exists but cannot be read or parsed: RED (a backup-monitoring
 *     failure, never a setup state)
 *   - a result older than 26 hours: STALE
 * Never a sample row.
 */
import { readFileSync } from 'node:fs';

export const STALE_MS = 26 * 60 * 60 * 1000;

export function readBackupHealth({ file, now = () => Date.now() } = {}) {
  if (!file) return { status: 'NOT CONFIGURED', detail: 'backup-node.json not written yet; run scripts/backup-node.mjs' };
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (e) {
    if (e && e.code === 'ENOENT') return { status: 'NOT CONFIGURED', detail: 'backup-node.json not written yet; run scripts/backup-node.mjs' };
    return { status: 'RED', detail: `backup-node.json unreadable: ${(e && e.code) || (e && e.message) || 'error'}` };
  }
  let data;
  try {
    data = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
  } catch (e) {
    return { status: 'RED', detail: `backup-node.json is not valid JSON: ${(e && e.message) || 'parse error'}` };
  }
  if (!data || typeof data !== 'object') {
    return { status: 'RED', detail: 'backup-node.json holds no result object' };
  }
  const t = Date.parse(data.at);
  const age = Number(typeof now === 'function' ? now() : now) - t;
  const items = Array.isArray(data.items) ? data.items : [];
  if (!Number.isFinite(age) || age > STALE_MS) {
    return { status: 'STALE', detail: 'last backup older than 26 hours', at: data.at || null, overall: data.overall || null, items, set: data.set || null, removed: data.removed || 0 };
  }
  return { status: data.overall, at: data.at, items, set: data.set, removed: data.removed };
}
