/**
 * Bridge routes: the Claude CLI bridge, the interactive launcher and the Ollama
 * brain. Handled BEFORE the generic dashboard routes so these responses never
 * carry the wildcard CORS header: a foreign Origin is refused, preflight is
 * refused, and the remote-code path stays local unless a token is configured.
 *
 *   OPTIONS /api/claude/*, /api/launch/claude, /api/ollama/*   -> 403 (no CORS)
 *   GET     /api/claude/status                                  -> capability, no absolute paths
 *   POST    /api/claude/chat   {prompt, sessionId?, persona?, permissionMode?, model?, lean?}
 *                                                               -> text/event-stream (init, delta, tool, assistant, result, error, exit)
 *   POST    /api/claude/stop                                    -> {ok, killed}
 *   POST    /api/launch/claude                                  -> opens the CLI in a console on this host
 *   GET     /api/ollama/tags                                    -> {available, models}
 *   POST    /api/ollama/chat   {messages, model?}               -> text/event-stream (delta, result)
 *
 * Static deny: /lib, /tests, server.mjs, package files and node_modules are never served.
 */
import { basename } from 'node:path';
import { hostname } from 'node:os';
import { spawn as nodeSpawn } from 'node:child_process';
import { runClaude, resolveClaudeBinary, bridgeAccess, isSameOrigin, sse, killTree as defaultKillTree, effectivePermissionMode, PERMISSION_MODES, PERSONAS } from './claude-bridge.mjs';
import { pickOllamaModel, streamOllamaChat, resolveOllamaBase } from './ollama.mjs';

const DENY_STATIC = [/^\/lib(\/|$)/, /^\/tests(\/|$)/, /^\/server\.mjs$/, /^\/package(-lock)?\.json$/, /^\/vitest\.config\.js$/, /^\/node_modules(\/|$)/, /^\/\.git(\/|$)/, /^\/\.env/];
const SSE_HEADERS = { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' };
const state = { current: null }; // one Claude run at a time: { run, startedAt, persona }

function json(res, code, body) {
  res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve) => { const b = []; req.on('data', (c) => b.push(c)); req.on('end', () => resolve(Buffer.concat(b).toString('utf8'))); });
}
async function readJson(req, res) {
  if (!/application\/json/i.test(String(req.headers['content-type'] || ''))) { json(res, 415, { error: 'content-type must be application/json' }); return null; }
  try { return JSON.parse((await readBody(req)) || '{}'); } catch { json(res, 400, { error: 'body must be JSON' }); return null; }
}

export async function handleBridgeRoutes(req, res, deps = {}) {
  const url = new URL(req.url || '/', 'http://x');
  const p = url.pathname;
  if (DENY_STATIC.some((rx) => rx.test(p))) { json(res, 404, { error: 'not found' }); return true; }
  const isBridge = p.startsWith('/api/claude/') || p === '/api/launch/claude';
  const isOllama = p.startsWith('/api/ollama/');
  if (!isBridge && !isOllama) return false;

  if (req.method === 'OPTIONS') { json(res, 403, { error: 'no cross-origin access to the bridge' }); return true; }
  if (!isSameOrigin(req.headers)) { json(res, 403, { error: 'origin refused' }); return true; }

  const cfg = deps.cfg || {};
  const envValue = deps.envValue || (() => '');
  const spawn = deps.spawn || nodeSpawn;
  const killTree = deps.killTree || ((child) => defaultKillTree(child, { spawn }));
  const resolveBinary = deps.resolveBinary || (() => resolveClaudeBinary());
  const fetchImpl = deps.fetch || globalThis.fetch;
  const ollamaBase = deps.ollamaBase ? String(deps.ollamaBase).replace(/\/$/, '') : resolveOllamaBase({ JARVIS_OLLAMA_URL: envValue('JARVIS_OLLAMA_URL'), OLLAMA_HOST: envValue('OLLAMA_HOST') });

  // ── Ollama (chat only, no tools: LAN callers are fine) ─────────────────────
  if (isOllama) {
    if (p === '/api/ollama/tags' && req.method === 'GET') {
      try {
        const r = await fetchImpl(ollamaBase + '/api/tags');
        const j = JSON.parse(await r.text());
        json(res, 200, { available: true, models: (j.models || []).map((m) => m.name), base: ollamaBase });
      } catch (e) { json(res, 200, { available: false, models: [], base: ollamaBase, detail: String(e.message || e) }); }
      return true;
    }
    if (p === '/api/ollama/chat' && req.method === 'POST') {
      const body = await readJson(req, res); if (!body) return true;
      if (!Array.isArray(body.messages) || !body.messages.length) { json(res, 400, { error: 'messages required' }); return true; }
      let tags = [];
      try { const r = await fetchImpl(ollamaBase + '/api/tags'); tags = (JSON.parse(await r.text()).models || []).map((m) => m.name); }
      catch (e) { json(res, 503, { error: 'ollama unreachable: ' + String(e.message || e) }); return true; }
      const model = pickOllamaModel({ requested: String(body.model || ''), configured: envValue('JARVIS_OLLAMA_MODEL'), tags });
      if (!model) { json(res, 503, { error: 'no ollama models installed' }); return true; }
      res.writeHead(200, SSE_HEADERS);
      try { await streamOllamaChat({ base: ollamaBase, model, messages: body.messages, fetch: fetchImpl, onEvent: (ev) => res.write(sse(ev.type, ev)) }); }
      catch (e) { res.write(sse('error', { type: 'error', message: String(e.message || e) })); }
      res.end();
      return true;
    }
    json(res, 404, { error: 'no such route' }); return true;
  }

  // ── Claude CLI bridge ──────────────────────────────────────────────────────
  const token = envValue('DASHBOARD_BRIDGE_TOKEN');
  const gate = bridgeAccess({ token, lanIp: cfg.lanIp || '' });
  const access = gate({ remoteAddress: req.socket && req.socket.remoteAddress, headers: req.headers });
  // .env may raise the ceiling (CLAUDE_BRIDGE_PERMISSION_MODE=default|acceptEdits); the default ceiling is plan (read-only).
  const wanted = envValue('CLAUDE_BRIDGE_PERMISSION_MODE');
  const configuredMode = PERMISSION_MODES.includes(wanted) ? wanted : 'plan';
  const maxTurns = Math.max(1, Math.min(50, Number(envValue('CLAUDE_BRIDGE_MAX_TURNS')) || 6));

  if (p === '/api/claude/status') {
    const bin = resolveBinary();
    json(res, 200, {
      installed: bin !== 'claude', bin: bin === 'claude' ? 'claude (PATH)' : basename(bin),
      access: { ok: access.ok, local: access.local, tokenRequired: !access.local, reason: access.reason },
      permissionMode: configuredMode, maxTurns, startedInsideClaudeCode: Boolean(process.env.CLAUDECODE),
      busy: Boolean(state.current), cwdName: basename(String(cfg.repo || '')), personas: Object.keys(PERSONAS), permissionModes: PERMISSION_MODES,
    });
    return true;
  }
  if (!access.ok) { json(res, 403, { error: 'bridge refused: ' + access.reason }); return true; }

  if (p === '/api/claude/stop' && req.method === 'POST') {
    const cur = state.current;
    const killed = cur ? Boolean(killTree(cur.run.child)) || cur.run.child.exitCode === null : false;
    if (cur) state.current = null;
    json(res, 200, { ok: true, killed });
    return true;
  }

  if (p === '/api/claude/chat' && req.method === 'POST') {
    const body = await readJson(req, res); if (!body) return true;
    const prompt = String(body.prompt || '').trim();
    if (!prompt || prompt.length > 20000) { json(res, 400, { error: 'prompt required (1..20000 chars)' }); return true; }
    const sessionId = String(body.sessionId || '');
    if (sessionId && !/^[A-Za-z0-9_-]{6,80}$/.test(sessionId)) { json(res, 400, { error: 'sessionId must be a plain id' }); return true; }
    const persona = Object.hasOwn(PERSONAS, String(body.persona || '')) ? String(body.persona) : 'claude';
    if (state.current) { json(res, 429, { error: 'a Claude run is already in progress; stop it first' }); return true; }
    const bin = resolveBinary();
    res.writeHead(200, SSE_HEADERS);
    let run;
    const finish = () => { if (state.current && state.current.run === run) state.current = null; clearInterval(ping); try { res.end(); } catch {} };
    const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 15000);
    if (typeof ping.unref === 'function') ping.unref();
    try {
      run = runClaude({
        prompt, cwd: cfg.repo, env: process.env, spawn, bin, sessionId, persona,
        permissionMode: effectivePermissionMode(String(body.permissionMode || ''), configuredMode),
        maxTurns, model: String(body.model || ''), lean: typeof body.lean === 'boolean' ? body.lean : undefined,
        timeoutMs: Number(envValue('CLAUDE_BRIDGE_TIMEOUT_MS')) || 300000,
        onEvent: (ev) => { try { res.write(sse(ev.type, ev)); } catch {} if (ev.type === 'exit') finish(); },
      });
    } catch (e) { res.write(sse('error', { type: 'error', message: String(e.message || e) })); finish(); return true; }
    state.current = { run, startedAt: Date.now(), persona };
    const onGone = () => { if (run.child.exitCode === null) killTree(run.child); };
    req.on('close', onGone); res.on('close', onGone);
    console.log(new Date().toISOString(), 'claude bridge', persona, 'from', req.socket && req.socket.remoteAddress, 'session', sessionId || 'new');
    return true;
  }

  if (p === '/api/launch/claude' && req.method === 'POST') {
    const bin = resolveBinary();
    if (bin === 'claude') { json(res, 503, { ok: false, error: 'claude CLI not found (set CLAUDE_BIN or install to ~/.local/bin)' }); return true; }
    try {
      // VERIFIED 2026-09-10: `cmd /k` via Start-Process is what actually shows a console from a hidden server.
      const c = spawn('powershell.exe', ['-NoProfile', '-Command', `Start-Process cmd.exe -ArgumentList '/k','"${bin}"' -WorkingDirectory '${cfg.repo || '.'}'`], { detached: true, stdio: 'ignore', windowsHide: true, env: { ...process.env, CLAUDECODE: undefined } });
      if (c && typeof c.unref === 'function') c.unref();
      console.log(new Date().toISOString(), 'launch claude from', req.socket && req.socket.remoteAddress);
      json(res, 200, { ok: true, opened: basename(bin), on: String(cfg.nodeName || hostname()).toUpperCase(), from: req.socket && req.socket.remoteAddress });
    } catch (e) { json(res, 500, { ok: false, error: String(e.message || e) }); }
    return true;
  }

  json(res, 404, { error: 'no such route' });
  return true;
}
