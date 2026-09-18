/**
 * FABLE'S SENTRY — the probe engine, folded into JARVIS 2026-09-18.
 *
 * Was a standalone wall display on :9140 (apps/fables-sentry/server.mjs).
 * Joshua's ruling 2026-09-18: one dashboard, one process — the separate
 * service is retired and this module carries its logic inside JARVIS
 * (mission-control/server.mjs), reading the same target registry
 * (mission-control/config/sentry-targets.json, moved unchanged from
 * apps/fables-sentry/targets.json) and producing the same verdicts.
 *
 * FOUNDING PRINCIPLE, learned the hard way on 2026-08-28: an open port is NOT
 * health. Redis sat LISTENING on 6379 for hours while answering PING with
 * MISCONF and refusing every write — the date app's session store was
 * read-only and every port-based check called it green. So each target
 * declares an `identity` string that must appear in the response, and Redis
 * gets a real PING/PONG probe rather than a port check.
 *
 * Pure-ish module: probes real services over the network, but takes no HTTP
 * framework dependency and owns no listening socket of its own — server.mjs
 * calls getSentrySnapshot()/getSentrySummary() in-process and serves the
 * result from /api/sentry and /api/sentry/summary. No self-HTTP hop.
 */
import { readFileSync, existsSync } from 'node:fs';
import { connect } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_TARGETS_PATH = join(HERE, '..', 'config', 'sentry-targets.json');
const DEFAULT_REPO = process.env.ANTIGRAVITY_ROOT || 'C:\\ANTIGRAVITY';
const CACHE_MS = 30000; // results are cached for 30s; the audit action forces a fresh probe

let cache = null; // { at: <ms epoch>, snapshot }

export function loadTargets(targetsPath = DEFAULT_TARGETS_PATH) {
  return JSON.parse(readFileSync(targetsPath, 'utf8'));
}

const portOpen = (port, ms = 1500, host = '127.0.0.1') =>
  new Promise((res) => {
    const s = connect({ host, port });
    const done = (v) => { try { s.destroy(); } catch {} res(v); };
    s.setTimeout(ms);
    s.on('connect', () => done(true));
    s.on('timeout', () => done(false));
    s.on('error', () => done(false));
  });

/** Redis PING must answer PONG. MISCONF means writes are disabled. */
const redisPing = (ms = 2500) =>
  new Promise((res) => {
    const s = connect({ host: '127.0.0.1', port: 6379 });
    let buf = '';
    const done = (v) => { try { s.destroy(); } catch {} res(v); };
    s.setTimeout(ms);
    s.on('connect', () => s.write('PING\r\n'));
    s.on('data', (d) => {
      buf += d.toString();
      if (buf.includes('\r\n')) {
        if (buf.startsWith('+PONG')) return done({ up: true });
        const why = buf.startsWith('-MISCONF')
          ? 'MISCONF — port open but WRITES DISABLED (RDB save failing)'
          : buf.trim().slice(0, 90);
        done({ up: false, detail: why });
      }
    });
    s.on('timeout', () => done({ up: false, detail: 'timeout' }));
    s.on('error', (e) => done({ up: false, detail: String(e.code || e.message) }));
  });

/**
 * Secrets for authenticated probes. Read from the repo .env at probe time,
 * never logged, never sent anywhere but the target that names the key.
 */
function envValue(name, repo) {
  try {
    const txt = readFileSync(join(repo, '.env'), 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line.trim());
      if (m && m[1] === name) return m[2].replace(/^"|"$/g, '');
    }
  } catch {}
  return '';
}

async function httpCheck(url, identity, ms, authEnv, repo) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const headers = {};
    if (authEnv) {
      const v = envValue(authEnv, repo);
      if (!v) return { up: false, detail: 'AUTH MISSING — ' + authEnv + ' not set in .env' };
      headers.authorization = 'Bearer ' + v;
    }
    const r = await fetch(url, { signal: c.signal, headers });
    if (authEnv && (r.status === 401 || r.status === 403)) return { up: false, detail: 'AUTH REJECTED — HTTP ' + r.status + ' with ' + authEnv };
    const body = (await r.text()).slice(0, 4000);
    if (r.status >= 400) return { up: false, detail: 'HTTP ' + r.status };
    if (identity && !body.includes(identity)) {
      return { up: false, detail: 'WRONG SERVICE — answered ' + r.status + ' but "' + identity + '" not in body' };
    }
    return { up: true, detail: 'HTTP ' + r.status + (identity ? ' · identity ok' : '') };
  } catch (e) {
    return { up: false, detail: String(e.name === 'AbortError' ? 'timeout' : e.message).slice(0, 90) };
  } finally { clearTimeout(t); }
}

/**
 * Same verdict vocabulary Sentry and `fable audit` have always used. The
 * explicit "AUTH REJECTED"/"AUTH MISSING" phrases are checked before the
 * looser 401/403 substrings — an AUTH REJECTED detail always names its own
 * HTTP status ("AUTH REJECTED — HTTP 401 with ..."), and a bare '401' check
 * running first would misclassify it as AUTH MISSING instead.
 */
export function verdictOf(t, r) {
  if (r.up) return 'UP';
  const d = (r.detail || '').toLowerCase();
  if (d.includes('wrong service')) return 'WRONG SERVICE';
  if (d.includes('auth rejected') || d.includes('invalid api key')) return 'AUTH REJECTED';
  if (d.includes('auth missing') || d.includes('401') || d.includes('403')) return 'AUTH MISSING';
  if (t.fix === null || t.fix === undefined) return 'NOT CONFIGURED';
  return 'DOWN';
}

async function probeOne(t, { repo }) {
  // Per-target budget wins; else public 8s, local 3s. OmniRoute's model catalog
  // legitimately takes 2-20s, so it carries its own timeoutMs.
  const timeout = t.timeoutMs || (t.public ? 8000 : 3000);
  const t0 = Date.now();
  let r;
  if (t.kind === 'redis') {
    const rr = await redisPing();
    r = { ...rr, detail: rr.detail || 'PONG' };
  } else if (t.kind === 'http') {
    if (t.port && !(await portOpen(t.port, 1500, t.host || '127.0.0.1'))) r = { up: false, detail: 'port ' + t.port + ' closed' };
    else r = await httpCheck(t.url, t.identity, timeout, t.authEnv, repo);
  } else {
    const open = await portOpen(t.port, 1500, t.host || '127.0.0.1');
    r = { up: open, detail: open ? 'port ' + t.port + ' open' : 'port ' + t.port + ' closed' };
  }
  const latencyMs = Date.now() - t0;
  const lastChecked = new Date().toISOString();
  return { ...t, ...r, status: verdictOf(t, r), latencyMs, lastChecked };
}

/** Same MCP-server reporting Sentry's wall carried (ported verbatim). */
function mcpStatus(repo, mcpPaths) {
  const out = [];
  const paths = mcpPaths || [join(repo, '.mcp.json'), join(process.env.USERPROFILE || '', '.claude.json')];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    try {
      const d = JSON.parse(readFileSync(p, 'utf8'));
      const servers = d.mcpServers || d;
      for (const [name, cfg] of Object.entries(servers)) {
        if (!cfg || typeof cfg !== 'object') continue;
        if (!cfg.command && !cfg.url) continue;
        let detail, up;
        if (cfg.command) {
          const script = (cfg.args || []).find((a) => typeof a === 'string' && /\.(mjs|cjs|js|py)$/i.test(a));
          if (script) {
            const present = existsSync(script) || existsSync(script.replace(/\//g, '\\'));
            up = present;
            detail = present ? 'stdio · script present' : 'stdio · MISSING ' + script;
          } else {
            up = true;
            detail = 'stdio · ' + cfg.command + (cfg.args && cfg.args.length ? ' ' + cfg.args.filter((a) => !String(a).startsWith('-')).slice(0, 2).join(' ') : '');
          }
        } else {
          up = true;
          detail = 'remote · ' + String(cfg.url).replace(/\?.*$/, '').slice(0, 60);
        }
        if (!out.some((x) => x.label === name)) {
          out.push({ id: 'mcp-' + name, label: name, up, detail, status: up ? 'UP' : 'DOWN', kind: 'mcp', fix: null, latencyMs: 0, lastChecked: new Date().toISOString() });
        }
      }
    } catch {}
  }
  return out;
}

/**
 * One fresh probe pass over every target. No caching here — getSentrySnapshot owns
 * that. `mcpPaths` is test-only DI (defaults to the real .mcp.json / .claude.json
 * pair); leave it unset in production.
 */
export async function probeSnapshot({ targetsPath = DEFAULT_TARGETS_PATH, repo = DEFAULT_REPO, mcpPaths } = {}) {
  const registry = loadTargets(targetsPath);
  const groups = [];
  for (const g of registry.groups) {
    groups.push({ name: g.name, targets: await Promise.all(g.targets.map((t) => probeOne(t, { repo }))) });
  }
  groups.push({ name: 'MCP servers', targets: mcpStatus(repo, mcpPaths) });

  const targets = groups.flatMap((g) => g.targets.map((t) => ({ ...t, group: g.name })));
  const up = targets.filter((t) => t.up).length;
  const total = targets.length;
  const byGroup = {};
  for (const g of groups) byGroup[g.name] = { up: g.targets.filter((t) => t.up).length, total: g.targets.length };

  return { at: new Date().toISOString(), up, down: total - up, total, groups, targets, byGroup };
}

/**
 * Cached snapshot (30s). Pass `force: true` for the audit action, which
 * always re-probes regardless of cache age.
 */
export async function getSentrySnapshot({ force = false, targetsPath, repo, mcpPaths } = {}) {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) return cache.snapshot;
  const snapshot = await probeSnapshot({ targetsPath, repo, mcpPaths });
  cache = { at: Date.now(), snapshot };
  return snapshot;
}

/** The compact form for the dashboard stat and the HUD preamble. */
export async function getSentrySummary(opts = {}) {
  const snap = await getSentrySnapshot(opts);
  return { at: snap.at, up: snap.up, down: snap.down, total: snap.total, byGroup: snap.byGroup };
}

/** Drop the cache — used only by tests and the audit action's callers, if ever needed. */
export function clearSentryCache() { cache = null; }
