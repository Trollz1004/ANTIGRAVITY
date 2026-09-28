/**
 * Screenshot health (ruled 2026-09-28: "200 ok is not ok, screenshot verified
 * only is ok"). The runner mission-control/scripts/screenshot-health.mjs opens
 * every target in config/screenshot-targets.json in headless Chromium, keeps a
 * PNG per target under evidence/health-shots/<date>/, and writes one JSON
 * result file (ops/heartbeat/screenshot-health.json, gitignored). This module
 * is the pure side: target loading, the verdict rule, and the JSON reader that
 * JARVIS serves at /api/screenshot-health. Paths are injected so tests use
 * fixtures; a missing result file is reported as NOT CONFIGURED, never as a
 * fabricated green.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TARGETS_PATH = join(HERE, '..', 'config', 'screenshot-targets.json');

export const STATES = ['UP', 'DOWN', 'WRONG SERVICE', 'ACCESS SIGN-IN', 'PENDING NAMESERVERS', 'NOT CONFIGURED'];

export function loadTargets(targetsPath = DEFAULT_TARGETS_PATH, { readFile = readFileSync } = {}) {
  const j = JSON.parse(stripBom(readFile(targetsPath, 'utf8')));
  const targets = Array.isArray(j.targets) ? j.targets : [];
  for (const t of targets) {
    if (!t.id || !/^[a-z0-9-]+$/.test(t.id)) throw new Error('screenshot target id must be [a-z0-9-]: ' + JSON.stringify(t.id));
    if (!t.url || !t.identity) throw new Error('screenshot target needs url and identity: ' + t.id);
  }
  return targets;
}

export function stripBom(text) {
  const s = String(text || '');
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/**
 * The verdict for one loaded page. `observed` is what the runner saw:
 *   { status, finalUrl, title, text, error }
 * The rule, in order:
 *   - navigation error naming DNS -> PENDING NAMESERVERS (a domain not yet cut over)
 *   - any other navigation error, or HTTP >= 500 -> DOWN
 *   - the final URL or title is a Cloudflare Access sign-in -> ACCESS SIGN-IN
 *     (UP for a target marked access:true, since the gate IS the expected page)
 *   - identity string in the visible text or title -> UP
 *   - otherwise -> WRONG SERVICE (something answered, but not the page we meant)
 */
export function verdictOf(target, observed) {
  const o = observed || {};
  const err = String(o.error || '');
  if (err) {
    if (/ERR_NAME_NOT_RESOLVED|ENOTFOUND|getaddrinfo/i.test(err)) return { state: 'PENDING NAMESERVERS', up: false, detail: err };
    return { state: 'DOWN', up: false, detail: err };
  }
  if (typeof o.status === 'number' && o.status >= 500) return { state: 'DOWN', up: false, detail: 'HTTP ' + o.status };
  const finalUrl = String(o.finalUrl || '');
  const title = String(o.title || '');
  if (/cloudflareaccess\.com/i.test(finalUrl) || /Cloudflare Access/i.test(title)) {
    return { state: 'ACCESS SIGN-IN', up: Boolean(target.access), detail: target.access ? 'Access sign-in page, the expected state' : 'unexpected Access gate' };
  }
  const hay = (title + '\n' + String(o.text || ''));
  if (hay.toLowerCase().includes(String(target.identity).toLowerCase())) return { state: 'UP', up: true, detail: 'identity "' + target.identity + '" visible' };
  return { state: 'WRONG SERVICE', up: false, detail: 'HTTP ' + (o.status ?? '?') + ' answered but "' + target.identity + '" is not on the page' };
}

/** Summarise a result file's targets: counts and an overall GREEN/YELLOW/RED. */
export function summarize(targets) {
  const list = Array.isArray(targets) ? targets : [];
  const up = list.filter((t) => t.up).length;
  const requiredDown = list.filter((t) => !t.up && !t.optional && t.state !== 'PENDING NAMESERVERS').length;
  const pending = list.filter((t) => t.state === 'PENDING NAMESERVERS').length;
  const overall = list.length === 0 ? 'RED' : requiredDown > 0 ? 'RED' : (pending > 0 || up < list.length) ? 'YELLOW' : 'GREEN';
  return { up, down: list.length - up, pending, total: list.length, overall };
}

/**
 * Read the runner's result file for JARVIS. Missing -> NOT CONFIGURED with the
 * path named; unparsable -> the error string. Never a sample row.
 */
export function readScreenshotHealth({ jsonPath, readFile = readFileSync, exists = existsSync, now = () => Date.now() } = {}) {
  if (!exists(jsonPath)) {
    return { ok: false, state: 'NOT CONFIGURED', detail: 'no result file at ' + jsonPath + ' (the Hermes cron has not run scripts/screenshot-health.mjs yet)', targets: [], summary: summarize([]), at: new Date(now()).toISOString() };
  }
  let data;
  try { data = JSON.parse(stripBom(readFile(jsonPath, 'utf8'))); }
  catch (e) { return { ok: false, state: 'DOWN', detail: 'screenshot-health.json: ' + (e.message || e), targets: [], summary: summarize([]), at: new Date(now()).toISOString() }; }
  if (data && data.state === 'NOT CONFIGURED') {
    return { ok: false, state: 'NOT CONFIGURED', detail: String(data.detail || 'runner reported NOT CONFIGURED'), targets: [], summary: summarize([]), at: String(data.at || new Date(now()).toISOString()) };
  }
  const targets = Array.isArray(data && data.targets) ? data.targets : [];
  const ageMs = data && data.at ? now() - Date.parse(data.at) : null;
  const stale = ageMs === null || !(ageMs >= 0) || ageMs > 2 * 60 * 60 * 1000;
  return { ok: true, state: stale ? 'STALE' : 'FRESH', detail: stale ? 'last run older than two hours' : 'last run within two hours', runAt: data.at || null, ageMs, targets, summary: summarize(targets), shotsDir: data.shotsDir || null, at: new Date(now()).toISOString() };
}
