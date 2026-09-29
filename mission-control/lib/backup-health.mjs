/**
 * Backup health. The runner scripts/backup-node.mjs writes
 * ops/heartbeat/backup-node.json (gitignored node state). This is the pure
 * reader JARVIS serves at /api/backup-health. A missing or unreadable file is
 * NOT CONFIGURED and a result older than 26 hours is STALE. Never a sample row.
 */
import { readFileSync } from 'node:fs';

export const STALE_MS = 26 * 60 * 60 * 1000;

export function readBackupHealth({ file, now = () => Date.now() } = {}) {
  let data;
  try {
    const text = readFileSync(file, 'utf8');
    data = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
  } catch {
    data = null;
  }
  if (!data || typeof data !== 'object') {
    return { status: 'NOT CONFIGURED', detail: 'backup-node.json not written yet; run scripts/backup-node.mjs' };
  }
  const t = Date.parse(data.at);
  const age = Number(typeof now === 'function' ? now() : now) - t;
  const items = Array.isArray(data.items) ? data.items : [];
  if (!Number.isFinite(age) || age > STALE_MS) {
    return { status: 'STALE', detail: 'last backup older than 26 hours', at: data.at || null, overall: data.overall || null, items, set: data.set || null, removed: data.removed || 0 };
  }
  return { status: data.overall, at: data.at, items, set: data.set, removed: data.removed };
}
