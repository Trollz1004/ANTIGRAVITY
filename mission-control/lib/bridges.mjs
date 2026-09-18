/**
 * Bridge registry (Phase F, unit 1) — one adapter per outside agent/service
 * JARVIS can reach from this node. Every adapter judges its bridge by an
 * identity call (a marker string, a JSON shape, a binary resolving and
 * answering `--version`), never by a bare port being open. Every adapter
 * returns the same shape:
 *
 *   { id, name, status: 'UP'|'DOWN'|'AUTH MISSING'|'NOT CONFIGURED'|'PARKED',
 *     identity, lastChecked, canRun, reason }
 *
 * Bridges that accept a prompt (`canRun: true`) are run only through a
 * `bridge.run` Proposal — this module never runs anything on its own; the
 * server creates the proposal, and only a founder approve (x-founder-token)
 * calls `executeBridgeRun`. Read-only bridges (ollama, omniroute, obsidian,
 * buzz) are safe to call directly from a GET.
 *
 * Pure-ish: fetch/exec/spawn/clock are all injected so tests never touch a
 * real socket or a real process.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { spawn as nodeSpawn } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';

export const BRIDGE_IDS = ['hermes', 'openclaw', 'claude', 'codex', 'ollama', 'omniroute', 'obsidian', 'browser-cdp', 'buzz', 'unreal'];
export const RUNNABLE_BRIDGE_IDS = ['hermes', 'claude', 'codex', 'ollama'];

const HERMES_MARKER = /Headless backend \(hermes serve\)|__HERMES_SESSION_TOKEN__/;
const OPENCLAW_MARKER = /OpenClaw Control|data-openclaw-terminal-enabled/;
const HERMES_GATEWAY_MARKER = /hermes-agent/;

function now() { return new Date().toISOString(); }

/** GET with a timeout; never throws. */
async function httpGet(url, { fetchImpl = globalThis.fetch, timeoutMs = 4000, headers = {} } = {}) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  try {
    const r = await fetchImpl(url, { signal: c.signal, headers });
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not JSON, fine */ }
    return { ok: true, status: r.status, text, json };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  } finally { clearTimeout(t); }
}

/** Resolve a binary and confirm it answers, without ever throwing past the caller. */
function binaryVersion(bin, args = ['--version'], { exec = execFileSync } = {}) {
  try {
    const out = exec(bin, args, { encoding: 'utf8', windowsHide: true, timeout: 8000, stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, out: String(out || '').trim().split(/\r?\n/)[0] };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

// ── hermes ────────────────────────────────────────────────────────────────
export async function probeHermes({ fetchImpl, dashboardUrl = 'http://127.0.0.1:9119/', gatewayUrl = 'http://127.0.0.1:8642/health', exec = execFileSync, resolveHermesBin = () => 'hermes' } = {}) {
  const dash = await httpGet(dashboardUrl, { fetchImpl });
  const gw = await httpGet(gatewayUrl, { fetchImpl });
  const dashUp = dash.ok && HERMES_MARKER.test(dash.text || '');
  const gwUp = gw.ok && (HERMES_GATEWAY_MARKER.test(gw.text || '') || (gw.json && /hermes-agent/i.test(String(gw.json.platform || ''))));
  const up = dashUp || gwUp;
  let canRun = false, reason;
  const bin = resolveHermesBin();
  const v = binaryVersion(bin, ['--help'], { exec });
  if (v.ok && /oneshot|--query-file|chat/i.test(v.out + JSON.stringify(v))) canRun = true;
  // `hermes.exe --help` prints usage to stdout; the real signal already proven
  // elsewhere in this repo is the `chat --oneshot` invocation, not a flag in
  // --help output alone — so canRun tracks whether the binary resolves at all.
  canRun = v.ok;
  if (!canRun) reason = 'hermes.exe not found or did not answer --help';
  return {
    status: up ? 'UP' : 'DOWN',
    identity: dashUp ? 'dashboard marker ok' : gwUp ? 'gateway marker ok (hermes-agent)' : (dash.error || gw.error || 'no marker in dashboard or gateway response'),
    canRun, reason,
  };
}

// ── openclaw ──────────────────────────────────────────────────────────────
export async function probeOpenclaw({ fetchImpl, dashboardUrl = 'http://127.0.0.1:18789/' } = {}) {
  const r = await httpGet(dashboardUrl, { fetchImpl });
  const up = r.ok && OPENCLAW_MARKER.test(r.text || '');
  return {
    status: up ? 'UP' : 'DOWN',
    identity: up ? 'dashboard marker ok (OpenClaw Control)' : (r.error || 'no OpenClaw marker in response'),
    canRun: false, reason: 'no headless CLI documented for the OpenClaw gateway',
  };
}

// ── claude (official Claude Code, headless) ──────────────────────────────
export function probeClaude({ exec = execFileSync, resolveBin = () => 'claude' } = {}) {
  const bin = resolveBin();
  const v = binaryVersion(bin, ['--version'], { exec });
  return {
    status: v.ok ? 'UP' : 'NOT CONFIGURED',
    identity: v.ok ? v.out : (v.error || 'claude CLI not found'),
    canRun: v.ok, reason: v.ok ? undefined : 'claude CLI not on PATH and CLAUDE_BIN not set',
  };
}

// ── codex (official Codex CLI, headless) ─────────────────────────────────
export function probeCodex({ exec = execFileSync, resolveBin = () => 'codex' } = {}) {
  const bin = resolveBin();
  const v = binaryVersion(bin, ['--version'], { exec });
  if (!v.ok) return { status: 'NOT CONFIGURED', identity: v.error || 'codex CLI not found', canRun: false, reason: 'codex CLI not on PATH and CODEX_BIN not set' };
  const help = binaryVersion(bin, ['exec', '--help'], { exec });
  const canRun = help.ok; // `codex exec` is documented as "Run Codex non-interactively"
  return { status: 'UP', identity: v.out, canRun, reason: canRun ? undefined : 'codex exec --help did not answer' };
}

// ── ollama (fail-safe only) ───────────────────────────────────────────────
export async function probeOllama({ fetchImpl, base = 'http://127.0.0.1:11434' } = {}) {
  const r = await httpGet(base.replace(/\/$/, '') + '/api/tags', { fetchImpl });
  const models = r.ok && r.json && Array.isArray(r.json.models) ? r.json.models.map((m) => m.name) : [];
  return {
    status: r.ok && r.json ? 'UP' : 'DOWN',
    identity: r.ok && r.json ? `${models.length} model(s) — fail-safe only, never primary` : (r.error || 'ollama did not answer /api/tags'),
    canRun: r.ok && models.length > 0, reason: models.length ? undefined : 'no models installed',
    models,
  };
}

// ── omniroute (key stays server-side) ────────────────────────────────────
export async function probeOmniroute({ fetchImpl, base = 'http://127.0.0.1:20128', key = '' } = {}) {
  const root = base.replace(/\/v1\/?$/, '').replace(/\/$/, '');
  const health = await httpGet(root + '/api/health', { fetchImpl });
  const modelsUrl = root + '/v1/models';
  const models = await httpGet(modelsUrl, { fetchImpl, headers: key ? { authorization: 'Bearer ' + key } : {} });
  const up = health.ok && health.json && (health.json.status === 'ok' || health.json.ok === true);
  const count = models.ok && models.json && Array.isArray(models.json.data) ? models.json.data.length : null;
  if (!up) return { status: 'DOWN', identity: health.error || 'OmniRoute /api/health did not report ok', canRun: false };
  if (count === null && models.status === 401) return { status: 'AUTH MISSING', identity: 'health ok, /v1/models unauthorized', canRun: false, reason: 'OMNI_ROUTE_API_KEY not set' };
  return { status: 'UP', identity: `health ok, ${count === null ? 'model count unavailable' : count + ' model(s)'}`, canRun: false, modelCount: count };
}

// ── obsidian (vault file count + Local REST identity) ────────────────────
export async function probeObsidian({ vaultPath = '', restUrl = '', restProbe } = {}) {
  let fileCount = null;
  if (vaultPath && existsSync(vaultPath)) {
    let n = 0;
    const walk = (dir) => { for (const e of readdirSync(dir, { withFileTypes: true })) { if (e.name.startsWith('.')) continue; const p = join(dir, e.name); if (e.isDirectory()) walk(p); else if (e.name.toLowerCase().endsWith('.md')) n++; } };
    try { walk(vaultPath); fileCount = n; } catch { fileCount = null; }
  }
  let restUp = false, restDetail = 'not probed';
  if (restProbe) {
    try { const r = await restProbe(); restUp = Boolean(r && r.up); restDetail = r && r.detail; } catch (e) { restDetail = String((e && e.message) || e); }
  }
  const status = fileCount !== null ? (restUp ? 'UP' : 'UP') : 'DOWN';
  return {
    status: fileCount !== null ? 'UP' : 'DOWN',
    identity: `${fileCount === null ? 'vault not found' : fileCount + ' note(s)'}; Local REST ${restUp ? 'UP' : 'DOWN'} (${restDetail || 'n/a'})`,
    canRun: false, fileCount, restUp,
  };
}

// ── browser CDP (Chrome opened with --remote-debugging-port) ─────────────
export async function probeBrowserCdp({ fetchImpl, url = 'http://127.0.0.1:9222/json/version' } = {}) {
  const r = await httpGet(url, { fetchImpl, timeoutMs: 1500 });
  const up = r.ok && r.json && r.json.Browser;
  return {
    status: up ? 'UP' : 'NOT CONFIGURED',
    identity: up ? r.json.Browser : 'Chrome is not open with --remote-debugging-port=9222',
    canRun: false,
  };
}

// ── buzz relay (read-only tap on the ledger already exposed at /api/ledger) ─
export async function probeBuzz({ readLedger } = {}) {
  if (!readLedger) return { status: 'NOT CONFIGURED', identity: 'no ledger reader configured', canRun: false };
  try {
    const r = await readLedger();
    return { status: r && r.ok ? 'UP' : 'DOWN', identity: r && r.ok ? `${(r.lines || []).length} ledger line(s)` : (r && r.error) || 'ledger read failed', canRun: false };
  } catch (e) { return { status: 'DOWN', identity: String((e && e.message) || e), canRun: false }; }
}

// ── unreal (parked) ───────────────────────────────────────────────────────
export function probeUnreal() {
  return { status: 'PARKED', identity: 'Parked per toolchain decision 2026-07-08', canRun: false, reason: 'Parked per toolchain decision 2026-07-08' };
}

const NAMES = {
  hermes: 'Hermes', openclaw: 'OpenClaw', claude: 'Claude Code', codex: 'Codex',
  ollama: 'Ollama', omniroute: 'OmniRoute', obsidian: 'Obsidian', 'browser-cdp': 'Browser (CDP)',
  buzz: 'Buzz relay', unreal: 'Unreal Engine',
};

/** Build every bridge row in parallel. Never throws — a dead adapter reports DOWN, not a 500. */
export async function buildBridges(deps = {}) {
  const at = now();
  const jobs = BRIDGE_IDS.map(async (id) => {
    let partial;
    try {
      partial = await ({
        hermes: () => probeHermes(deps.hermes || {}),
        openclaw: () => probeOpenclaw(deps.openclaw || {}),
        claude: () => probeClaude(deps.claude || {}),
        codex: () => probeCodex(deps.codex || {}),
        ollama: () => probeOllama(deps.ollama || {}),
        omniroute: () => probeOmniroute(deps.omniroute || {}),
        obsidian: () => probeObsidian(deps.obsidian || {}),
        'browser-cdp': () => probeBrowserCdp(deps.browserCdp || {}),
        buzz: () => probeBuzz(deps.buzz || {}),
        unreal: () => probeUnreal(),
      })[id]();
    } catch (e) {
      partial = { status: 'DOWN', identity: String((e && e.message) || e), canRun: false };
    }
    return { id, name: NAMES[id], lastChecked: at, ...partial };
  });
  const bridges = await Promise.all(jobs);
  return { bridges, at };
}

export function findBridge(bridges, id) {
  return (bridges || []).find((b) => b.id === id) || null;
}

/** POST /api/bridges/:id/run — always a Proposal, never an immediate execution. */
export function createBridgeRunProposal({ store, id, prompt, bridgeRow }) {
  if (!BRIDGE_IDS.includes(id)) return { status: 404, body: { error: 'unknown bridge: ' + id } };
  if (!RUNNABLE_BRIDGE_IDS.includes(id)) return { status: 400, body: { error: `"${id}" is read-only — GET /api/bridges/${id} instead` } };
  const text = String(prompt || '').trim();
  if (!text) return { status: 400, body: { error: 'prompt is required' } };
  if (bridgeRow && bridgeRow.canRun === false) return { status: 409, body: { error: `"${id}" cannot run right now: ${bridgeRow.reason || 'not available'}` } };
  const rec = store.create({
    source: 'judge', kind: 'bridge.run', brand: null, platform: null,
    title: `bridge.run: ${id}`, body: text, bridge: id, prompt: text,
  });
  return { status: 201, body: { proposal: rec } };
}

// ── executors (called only after a founder approve) ───────────────────────
function withTimeout(promise, ms, onTimeout) {
  return Promise.race([
    promise,
    new Promise((resolve) => { const t = setTimeout(() => { onTimeout(); resolve({ ok: false, error: `timed out after ${ms} ms` }); }, ms); if (t.unref) t.unref(); }),
  ]);
}

async function runHermesPrompt({ prompt, cwd, resolveHermesBin = () => 'hermes', spawn = nodeSpawn, timeoutMs = 120000 }) {
  const bin = resolveHermesBin();
  const file = join(tmpdir(), `jarvis-bridge-hermes-${randomBytes(6).toString('hex')}.txt`);
  writeFileSync(file, prompt, 'utf8');
  return withTimeout(new Promise((resolve) => {
    let out = '', err = '';
    const child = spawn(bin, ['chat', '--query-file', file, '-Q', '--oneshot', '-c', 'jarvis-bridge', '--create-if-missing'], { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    child.stdout.on('data', (c) => { out += String(c); });
    child.stderr.on('data', (c) => { err += String(c); });
    child.on('error', (e) => resolve({ ok: false, error: String(e.message || e) }));
    child.on('close', (code) => resolve({ ok: code === 0, output: out.trim(), error: code ? err.trim().slice(-2000) : undefined }));
  }).finally(() => { try { unlinkSync(file); } catch {} }), timeoutMs, () => {});
}

async function runClaudePrompt({ prompt, cwd, timeoutMs = 180000, runClaudeImpl }) {
  return new Promise((resolve) => {
    let text = '';
    let resolved = false;
    const run = runClaudeImpl({
      prompt, cwd, permissionMode: 'plan', maxTurns: 8, model: 'sonnet', persona: 'claude', timeoutMs,
      onEvent: (ev) => {
        if (ev.type === 'result') { text = ev.text || text; }
        if (ev.type === 'exit' && !resolved) { resolved = true; resolve({ ok: ev.code === 0, output: text, error: ev.code ? (ev.stderr || `exit ${ev.code}`) : undefined }); }
        if (ev.type === 'error' && !resolved) { resolved = true; resolve({ ok: false, error: ev.message }); }
      },
    });
    void run;
  });
}

async function runCodexPrompt({ prompt, cwd, spawn = nodeSpawn, timeoutMs = 180000 }) {
  return withTimeout(new Promise((resolve) => {
    let out = '', err = '';
    const child = spawn('codex', ['exec', '-s', 'read-only', '-C', cwd, prompt], { env: process.env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    child.stdout.on('data', (c) => { out += String(c); });
    child.stderr.on('data', (c) => { err += String(c); });
    child.on('error', (e) => resolve({ ok: false, error: String(e.message || e) }));
    child.on('close', (code) => resolve({ ok: code === 0, output: out.trim().slice(-8000), error: code ? err.trim().slice(-2000) : undefined }));
  }), timeoutMs, () => {});
}

async function runOllamaPrompt({ prompt, base, model, streamOllamaChatImpl, fetchImpl, timeoutMs = 120000 }) {
  return withTimeout((async () => {
    try {
      const r = await streamOllamaChatImpl({ base, model, messages: [{ role: 'user', content: prompt }], fetch: fetchImpl, onEvent: () => {} });
      return { ok: true, output: r.text };
    } catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
  })(), timeoutMs, () => {});
}

/** POST /api/ask, bridge:"omniroute" branch — a direct chat completion, key stays server-side. */
export async function askOmniRoute({ base = 'http://127.0.0.1:20128/v1', key = '', question = '', fetchImpl = globalThis.fetch, timeoutMs = 30000 }) {
  if (!key) return { status: 503, body: { error: 'AUTH MISSING: OMNI_ROUTE_API_KEY not configured' } };
  const q = String(question || '').trim();
  if (!q) return { status: 400, body: { error: 'question is required' } };
  const c = new AbortController(); const t = setTimeout(() => c.abort(), timeoutMs);
  try {
    const r = await fetchImpl(base.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST', signal: c.signal,
      headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'auto/best-fast', messages: [{ role: 'user', content: q }] }),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j) return { status: 502, body: { error: 'OmniRoute did not answer', status: r.status } };
    const answer = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '';
    return { status: 200, body: { bridge: 'omniroute', answer, model: j.model || 'auto/best-fast' } };
  } catch (e) {
    return { status: 502, body: { error: 'OmniRoute unreachable: ' + String((e && e.message) || e) } };
  } finally { clearTimeout(t); }
}

/**
 * Run one bridge's prompt for an approved `bridge.run` proposal. `deps` supplies
 * the same injectable pieces as the rest of this module (cwd, spawn, the
 * Claude bridge's own runClaude, streamOllamaChat, fetch) so nothing here ever
 * touches a real process or socket in a test.
 */
export async function executeBridgeRun({ proposal, deps = {} }) {
  const id = proposal.bridge;
  const prompt = proposal.prompt || proposal.body || '';
  try {
    if (id === 'hermes') return await runHermesPrompt({ prompt, cwd: deps.cwd, resolveHermesBin: deps.resolveHermesBin, spawn: deps.spawn });
    if (id === 'claude') return await runClaudePrompt({ prompt, cwd: deps.cwd, runClaudeImpl: deps.runClaudeImpl });
    if (id === 'codex') return await runCodexPrompt({ prompt, cwd: deps.cwd, spawn: deps.spawn });
    if (id === 'ollama') return await runOllamaPrompt({ prompt, base: deps.ollamaBase, model: deps.ollamaModel, streamOllamaChatImpl: deps.streamOllamaChatImpl, fetchImpl: deps.fetch });
    return { ok: false, error: 'no executor for bridge: ' + id };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}
