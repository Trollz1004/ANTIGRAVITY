/**
 * System status (Phase B) — the 30-minute Sabretooth health probe, merged
 * into the existing Mission Control tab rather than duplicated. Reads
 * ops/heartbeat/sabretooth-health.json (tolerating a leading UTF-8 BOM,
 * which PowerShell's `Out-File`/`ConvertTo-Json` pipeline writes by default)
 * and the last 10 lines of ops/heartbeat/health.log. Pure module: paths are
 * injected so tests use fixtures instead of the real repo.
 */
import { readFileSync, existsSync } from 'node:fs';

export function stripBom(text) {
  const s = String(text || '');
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

export function parseHealthJson(text) {
  return JSON.parse(stripBom(text));
}

export function tailLines(text, n = 10) {
  const lines = stripBom(String(text || '')).split(/\r?\n/).filter((l) => l.length > 0);
  return lines.slice(-n);
}

export function readHeartbeat({ jsonPath, logPath, readFile = readFileSync, exists = existsSync }) {
  const errors = [];
  let health = null;
  let logTail = [];
  if (exists(jsonPath)) {
    try { health = parseHealthJson(readFile(jsonPath, 'utf8')); }
    catch (e) { errors.push('sabretooth-health.json: ' + (e.message || e)); }
  } else {
    errors.push('sabretooth-health.json: not found at ' + jsonPath);
  }
  if (exists(logPath)) {
    try { logTail = tailLines(readFile(logPath, 'utf8'), 10); }
    catch (e) { errors.push('health.log: ' + (e.message || e)); }
  } else {
    errors.push('health.log: not found at ' + logPath);
  }
  return { ok: health !== null, health, logTail, errors, at: new Date().toISOString() };
}
