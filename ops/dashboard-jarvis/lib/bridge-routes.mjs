/**
 * Bridge routes: the Claude CLI bridge, the interactive launcher and the Ollama
 * brain. Handled BEFORE the generic dashboard routes so these responses never
 * carry the wildcard CORS header: a foreign Origin is refused, preflight is
 * refused, and the remote-code path stays local unless a token is configured.
 *
 *   OPTIONS /api/claude/*, /api/launch/claude, /api/ollama/*   -> 403 (no CORS)
 *   GET     /api/claude/status                                  -> capability, no absolute paths
 *   POST    /api/claude/chat   {prompt, sessionId?, persona?, permissionMode?, model?, lean?, hud?, tab?}
 *                                                               -> text/event-stream (init, delta, tool, assistant, result, error, exit)
 *   GET     /api/hud/context                                   -> the same preamble the bridge would compose (display/debug)
 *   POST    /api/claude/stop                                    -> {ok, killed}
 *   POST    /api/launch/claude                                  -> opens the CLI in a console on this host
 *   POST    /api/launch/freebuff                                -> opens the FreeBuff CLI (free GLM agent) in a console on this host
 *   GET     /api/ollama/tags                                    -> {available, models}
 *   POST    /api/ollama/chat   {messages, model?}               -> text/event-stream (delta, result)
 *
 * Static deny: /lib, /tests, server.mjs, package files and node_modules are never served.
 */
import { basename, join } from 'node:path';
import { hostname, tmpdir } from 'node:os';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { spawn as nodeSpawn } from 'node:child_process';
import { runClaude, resolveClaudeBinary, bridgeAccess, isSameOrigin, sse, killTree as defaultKillTree, effectivePermissionMode, PERMISSION_MODES, PERSONAS } from './claude-bridge.mjs';
import { hudContext, promptWithContext } from './hud-context.mjs';
import { readMemory, appendMemory, memoryBlock } from './jarvis-memory.mjs';
import { pickOllamaModel, streamOllamaChat, resolveOllamaBase } from './ollama.mjs';

const DENY_STATIC = [/^\/lib(\/|$)/, /^\/tests(\/|$)/, /^\/server\.mjs$/, /^\/package(-lock)?\.json$/, /^\/vitest\.config\.js$/, /^\/node_modules(\/|$)/, /^\/\.git(\/|$)/, /^\/\.env/, /^\/data(\/|$)/];
const SSE_HEADERS = { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' };
const state = { current: null }; // one Claude run at a time: { run, startedAt, persona }
const hermesState = { current: null, lastLatencyMs: null };

function resolveHermesBinary(env = process.env) {
  if (env.HERMES_BIN && existsSync(env.HERMES_BIN)) return env.HERMES_BIN;
  const local = env.LOCALAPPDATA ? join(env.LOCALAPPDATA, 'hermes', 'bin', 'hermes.exe') : '';
  if (local && existsSync(local)) return local;
  return 'hermes'; // PATH lookup
}
/** FreeBuff CLI (free GLM agent, npm -g). Its launcher shim is what we open. */
function resolveFreebuffBinary(env = process.env) {
  if (env.FREEBUFF_BIN && existsSync(env.FREEBUFF_BIN)) return env.FREEBUFF_BIN;
  const npm = env.APPDATA ? join(env.APPDATA, 'npm') : '';
  for (const name of ['freebuff.cmd', 'freebuff.ps1', 'freebuff']) {
    if (npm && existsSync(join(npm, name))) return join(npm, name);
  }
  return ''; // honestly uninstalled
}
function readOwnerFileDefault(env = process.env) {
  return readFileSync(join(env.LOCALAPPDATA || '', 'hermes', 'memories', 'USER.md'), 'utf8');
}
/** First word of the first non-empty line, only when it looks like a given name. */
export function ownerNameFrom(text) {
  const line = String(text || '').split(/\r?\n/).map((l) => l.trim()).find(Boolean) || '';
  const word = line.split(/\s+/)[0] || '';
  return /^[A-Z][a-z]{1,30}$/.test(word) ? word : '';
}
/** A Hermes one-shot prints the reply plus a session trailer; keep only the reply. */
export function cleanHermesReply(text) {
  return String(text || '').split(/\r?\n/).filter((l) => !/^\s*session_id:\s*\S+\s*$/.test(l)).join('\n').trim();
}

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
  const isBridge = p.startsWith('/api/claude/') || p === '/api/launch/claude' || p === '/api/launch/freebuff' || p.startsWith('/api/hermes/') || p === '/api/hud/context' || p === '/api/jarvis/memory';
  const isOllama = p.startsWith('/api/ollama/');
  const isOwner = p === '/api/owner';
  if (!isBridge && !isOllama && !isOwner) return false;

  if (req.method === 'OPTIONS') { json(res, 403, { error: 'no cross-origin access to the bridge' }); return true; }
  if (!isSameOrigin(req.headers)) { json(res, 403, { error: 'origin refused' }); return true; }

  const cfg = deps.cfg || {};
  const envValue = deps.envValue || (() => '');
  const spawn = deps.spawn || nodeSpawn;
  const killTree = deps.killTree || ((child) => defaultKillTree(child, { spawn }));
  const resolveBinary = deps.resolveBinary || (() => resolveClaudeBinary());
  const resolveFreebuff = deps.resolveFreebuff || (() => resolveFreebuffBinary());
  const fetchImpl = deps.fetch || globalThis.fetch;
  const ollamaBase = deps.ollamaBase ? String(deps.ollamaBase).replace(/\/$/, '') : resolveOllamaBase({ JARVIS_OLLAMA_URL: envValue('JARVIS_OLLAMA_URL'), OLLAMA_HOST: envValue('OLLAMA_HOST') });

  if (isOwner) {
    let text = '';
    try { text = (deps.readOwnerFile || readOwnerFileDefault)(); } catch { text = ''; }
    json(res, 200, { name: ownerNameFrom(text) });
    return true;
  }

  // ── HUD context: the exact preamble /api/claude/chat would compose ─────────
  if (p === '/api/hud/context' && req.method === 'GET') {
    const live = {};
    const src = { nodes: deps.probeAll, vault: deps.vaultStatus, agents: deps.agentsSummary, graph: deps.vaultGraph, house: deps.houseSummary };
    const jobs = Object.entries(src).filter(([, f]) => typeof f === 'function').map(async ([k, f]) => { try { live[k] = await f(); } catch { live[k] = null; } });
    await Promise.all(jobs);
    const context = hudContext({ nodes: live.nodes || null, house: live.house || null, vault: live.vault || null, agents: live.agents || null, graph: live.graph || null, config: { repo: cfg.repo, missionControl: cfg.missionControl, vaultName: cfg.vaultName, vaultPath: cfg.vaultPath } });
    return json(res, 200, { context, tab: 'hud', at: new Date().toISOString() });
  }

  // ── JARVIS memory: what the bridge remembers, shown honestly ────────────────
  if (p === '/api/jarvis/memory' && req.method === 'GET') {
    return json(res, 200, readMemory(deps.jarvisMemory || {}));
  }

  // ── Ollama (chat only, no tools: LAN callers are fine) ───────────────────────
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
  // ── Hermes as a brain (runs tools, so it sits behind the same gate) ────────
  if (p === '/api/hermes/status') {
    const bin = (deps.resolveHermes || resolveHermesBinary)();
    json(res, 200, { installed: bin !== 'hermes', bin: bin === 'hermes' ? 'hermes (PATH)' : basename(bin), access: { ok: access.ok, local: access.local }, busy: Boolean(hermesState.current), lastLatencyMs: hermesState.lastLatencyMs, session: 'jarvis-hud' });
    return true;
  }
  if (!access.ok) { json(res, 403, { error: 'bridge refused: ' + access.reason }); return true; }

  if (p === '/api/hermes/chat' && req.method === 'POST') {
    const body = await readJson(req, res); if (!body) return true;
    const prompt = String(body.prompt || '').trim();
    if (!prompt || prompt.length > 20000) { json(res, 400, { error: 'prompt required (1..20000 chars)' }); return true; }
    const session = /^[A-Za-z0-9_-]{3,40}$/.test(String(body.session || '')) ? String(body.session) : 'jarvis-hud';
    if (hermesState.current) { json(res, 429, { error: 'a Hermes turn is already in progress' }); return true; }
    const bin = (deps.resolveHermes || resolveHermesBinary)();
    const file = join(tmpdir(), `jarvis-hermes-${randomBytes(6).toString('hex')}.txt`);
    writeFileSync(file, prompt, 'utf8'); // the prompt never travels on the command line
    res.writeHead(200, SSE_HEADERS);
    const t0 = Date.now();
    let out = ''; let err = '';
    const child = spawn(bin, ['chat', '--query-file', file, '-Q', '--oneshot', '-c', session, '--create-if-missing'], { cwd: cfg.repo, env: process.env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    hermesState.current = { child, startedAt: t0 };
    const finish = (code, extra = {}) => {
      if (hermesState.current && hermesState.current.child === child) hermesState.current = null;
      clearTimeout(timer);
      try { unlinkSync(file); } catch {}
      const latencyMs = Date.now() - t0;
      hermesState.lastLatencyMs = latencyMs;
      try { res.write(sse('result', { type: 'result', ok: code === 0, text: cleanHermesReply(out), latencyMs, session, code, stderr: code ? err.trim().split('\n').slice(-3).join('\n') : '', ...extra })); res.end(); } catch {}
    };
    const timer = setTimeout(() => { killTree(child); finish(null, { error: 'timeout' }); }, Number(envValue('HERMES_BRIDGE_TIMEOUT_MS')) || 600000);
    if (typeof timer.unref === 'function') timer.unref();
    child.stdout.on('data', (c) => { out += String(c); });
    child.stderr.on('data', (c) => { err += String(c); if (err.length > 8000) err = err.slice(-8000); });
    child.on('error', (e) => finish(-1, { error: String(e.message || e) }));
    child.on('close', (code) => finish(code));
    const onGone = () => { if (!res.writableFinished && child.exitCode === null) killTree(child); };
    if (req.socket && typeof req.socket.once === 'function') req.socket.once('close', onGone); else res.on('close', onGone); // socket close = client really gone
    console.log(new Date().toISOString(), 'hermes bridge session', session, 'from', req.socket && req.socket.remoteAddress);
    return true;
  }

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
    // The HUD preamble is composed here, from this server's own live data. The
    // client only asks for it (hud:true) and names its tab — it can never forge
    // the house state (body.hudContext is ignored on purpose).
    let finalPrompt = prompt;
    if (body.hud === true) {
      const depsForCtx = { nodes: deps.probeAll, vault: deps.vaultStatus, agents: deps.agentsSummary, graph: deps.vaultGraph, house: deps.houseSummary };
      const live = {};
      const jobs = Object.entries(depsForCtx).filter(([, f]) => typeof f === 'function').map(async ([k, f]) => { try { live[k] = await f(); } catch { live[k] = null; } });
      await Promise.all(jobs);
      const memorySection = memoryBlock(readMemory(deps.jarvisMemory || {}));
      finalPrompt = promptWithContext({
        context: [hudContext({ nodes: live.nodes || null, house: live.house || null, vault: live.vault || null, agents: live.agents || null, graph: live.graph || null, config: { repo: cfg.repo, missionControl: cfg.missionControl, vaultName: cfg.vaultName, vaultPath: cfg.vaultPath } }), memorySection].filter(Boolean).join('\n\n'),
        tab: String(body.tab || ''), user: prompt, at: new Date().toISOString(),
      });
    }
    // Durable memory: every jarvis-persona turn is captured (result or failure).
    const remember = (reply, ok) => { try { appendMemory({ ...(deps.jarvisMemory || {}), entry: { prompt, reply, ok } }); } catch {} };
    let sawResult = false;
    const bin = resolveBinary();
    res.writeHead(200, SSE_HEADERS);
    let run;
    const finish = () => { if (state.current && state.current.run === run) state.current = null; clearInterval(ping); try { res.end(); } catch {} };
    const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 15000);
    if (typeof ping.unref === 'function') ping.unref();
    try {
      run = runClaude({
        prompt: finalPrompt, cwd: cfg.repo, env: process.env, spawn, bin, sessionId, persona,
        permissionMode: effectivePermissionMode(String(body.permissionMode || ''), configuredMode),
        maxTurns, model: String(body.model || ''), lean: typeof body.lean === 'boolean' ? body.lean : undefined,
        timeoutMs: Number(envValue('CLAUDE_BRIDGE_TIMEOUT_MS')) || 300000,
        onEvent: (ev) => {
          try { res.write(sse(ev.type, ev)); } catch {}
          if (persona === 'jarvis') {
            if (ev.type === 'result') { sawResult = true; remember(ev.text || ev.error || '', ev.ok !== false && !ev.error); }
            else if (ev.type === 'error') { sawResult = true; remember(ev.message || 'error', false); }
            else if (ev.type === 'exit' && !sawResult) remember(ev.stderr || `exit code ${ev.code}`, false);
          }
          if (ev.type === 'exit') { console.log(new Date().toISOString(), 'claude bridge exit code', ev.code, 'after', Date.now() - startedAt, 'ms'); finish(); }
        },
      });
    } catch (e) { res.write(sse('error', { type: 'error', message: String(e.message || e) })); finish(); return true; }
    const startedAt = Date.now();
    state.current = { run, startedAt, persona };
    // Client-disconnect detection: `req` emits 'close' as soon as its body has been consumed, so it
    // must NOT be used here (it killed every browser call 300 ms after spawn). The response closes
    // only when the connection drops or after finish(); writableFinished tells the two apart.
    // Chromium also closes `res` early (~250 ms after the headers) while the connection stays
    // open, so the detector listens to the socket itself: it closes only when the client is gone.
    const sock = req.socket;
    const onGone = () => {
      if (res.writableFinished || run.child.exitCode !== null) return;
      console.log(new Date().toISOString(), 'claude bridge client gone, killing pid', run.child.pid,
        JSON.stringify({ writableEnded: res.writableEnded, resDestroyed: res.destroyed, sockDestroyed: sock && sock.destroyed, reqComplete: req.complete }));
      killTree(run.child);
    };
    if (sock && typeof sock.once === 'function') sock.once('close', onGone); else res.on('close', onGone);
    console.log(new Date().toISOString(), 'claude bridge', persona, 'from', req.socket && req.socket.remoteAddress, 'session', sessionId || 'new');
    return true;
  }

  if (p === '/api/launch/freebuff' && req.method === 'POST') {
    const bin = resolveFreebuff();
    if (!bin) { json(res, 503, { ok: false, error: 'freebuff CLI not found (npm i -g freebuff, or set FREEBUFF_BIN)' }); return true; }
    try {
      // Same verified recipe as the Claude launch: a visible console on this host.
      const c = spawn('powershell.exe', ['-NoProfile', '-Command', `Start-Process cmd.exe -ArgumentList '/k','"${bin}"' -WorkingDirectory '${cfg.repo || '.'}'`], { detached: true, stdio: 'ignore', windowsHide: true });
      if (c && typeof c.unref === 'function') c.unref();
      console.log(new Date().toISOString(), 'launch freebuff from', req.socket && req.socket.remoteAddress);
      json(res, 200, { ok: true, opened: basename(bin), on: String(cfg.nodeName || hostname()).toUpperCase(), from: req.socket && req.socket.remoteAddress });
    } catch (e) { json(res, 500, { ok: false, error: String(e.message || e) }); }
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
