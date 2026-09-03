#!/usr/bin/env node
// Fable — one npm script for Joshua's house. Zero dependencies, Node 24 ESM.
//
//   npm run fable -- <subcommand> [args]
//
// Subcommands: house, audit, omni, workflow, mcp, ledger, dns.
// Exit codes: 0 ok · 1 bad input · 2 target down · 3 auth.

import { spawn } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connect } from 'node:net';

const REPO = 'C:\\ANTIGRAVITY';
const HERE = dirname(fileURLToPath(import.meta.url));
const WORKFLOWS_DIR = join(HERE, 'workflows');

// OmniRoute hangs happen on shared-machine loopback traffic when a proxy is
// configured; force direct loopback regardless of what the shell inherited.
process.env.NO_PROXY = process.env.NO_PROXY || '127.0.0.1,localhost';
process.env.no_proxy = process.env.no_proxy || '127.0.0.1,localhost';

const EXIT = { OK: 0, BAD_INPUT: 1, TARGET_DOWN: 2, AUTH: 3 };

// Node on Windows can hit "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)"
// when process.exit() is called forcefully while a just-destroyed net socket's
// handle is still closing. So this CLI never calls process.exit() directly —
// every path sets process.exitCode and lets the event loop drain naturally,
// with control flow via this ExitSignal instead of an abrupt exit.
class ExitSignal extends Error {
  constructor(code) { super('exit:' + code); this.code = code; }
}

function fail(code, msg) {
  if (msg) console.error(msg);
  throw new ExitSignal(code);
}

// ── tiny arg parser: --flag value / --flag (bool) / bare positionals ──────
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

// ── probes (mirrors apps/fables-sentry/server.mjs — a port is not health) ─
const portOpen = (port, ms = 1500) =>
  new Promise((res) => {
    const s = connect({ host: '127.0.0.1', port });
    const done = (v) => { try { s.destroy(); } catch {} res(v); };
    s.setTimeout(ms);
    s.on('connect', () => done(true));
    s.on('timeout', () => done(false));
    s.on('error', () => done(false));
  });

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
        if (buf.startsWith('+PONG')) return done({ up: true, detail: 'PONG' });
        const why = buf.startsWith('-MISCONF')
          ? 'MISCONF — port open but WRITES DISABLED (RDB save failing)'
          : buf.trim().slice(0, 90);
        done({ up: false, detail: why });
      }
    });
    s.on('timeout', () => done({ up: false, detail: 'timeout' }));
    s.on('error', (e) => done({ up: false, detail: String(e.code || e.message) }));
  });

async function httpCheck(url, identity, ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, { signal: c.signal });
    const body = (await r.text()).slice(0, 4000);
    if (r.status === 401) return { up: false, detail: 'HTTP 401 — AUTH MISSING: ' + body.slice(0, 120) };
    if (r.status === 403) return { up: false, detail: 'HTTP 403 — AUTH REJECTED: ' + body.slice(0, 120) };
    if (r.status >= 400) return { up: false, detail: 'HTTP ' + r.status };
    if (identity && !body.includes(identity)) {
      return { up: false, detail: 'WRONG SERVICE — answered ' + r.status + ' but "' + identity + '" not in body' };
    }
    return { up: true, detail: 'HTTP ' + r.status + (identity ? ' · identity ok' : '') };
  } catch (e) {
    return { up: false, detail: String(e.name === 'AbortError' ? 'timeout' : e.message).slice(0, 90) };
  } finally { clearTimeout(t); }
}

async function probeTarget(t) {
  const timeout = t.public ? 8000 : 3000;
  if (t.kind === 'redis') {
    const r = await redisPing();
    return { ...t, ...r };
  }
  if (t.kind === 'http') {
    if (t.port && !(await portOpen(t.port))) return { ...t, up: false, detail: 'port ' + t.port + ' closed' };
    return { ...t, ...(await httpCheck(t.url, t.identity, timeout)) };
  }
  const open = await portOpen(t.port);
  return { ...t, up: open, detail: open ? 'port ' + t.port + ' open' : 'port ' + t.port + ' closed' };
}

function verdictOf(t, r) {
  if (r.up) return 'UP';
  const d = (r.detail || '').toLowerCase();
  if (d.includes('wrong service')) return 'WRONG SERVICE';
  if (d.includes('auth missing') || d.includes('401')) return 'AUTH MISSING';
  if (d.includes('auth rejected') || d.includes('403') || d.includes('invalid api key')) return 'AUTH REJECTED';
  if (t.fix === null || t.fix === undefined) return 'NOT CONFIGURED';
  return 'DOWN';
}

function padTable(rows, headers) {
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i] ?? '').length)));
  const line = (cells) => cells.map((c, i) => String(c ?? '').padEnd(widths[i])).join('  ');
  const out = [line(headers), widths.map((w) => '-'.repeat(w)).join('  ')];
  for (const r of rows) out.push(line(r));
  return out.join('\n');
}

// ── .env reader — never logs a value, only ever returns it to the caller ──
function readEnvValue(key) {
  if (process.env[key]) return process.env[key];
  const envPath = join(REPO, '.env');
  if (!existsSync(envPath)) return undefined;
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && m[1] === key) return m[2].trim().replace(/^["']|["']$/g, '');
  }
  return undefined;
}

// ══════════════════════════════════════════════════════════════ house ════
function helpHouse() {
  console.log(`fable house — run scripts/fables-house/FABLES-HOUSE.ps1 (bring-up, single pass)

Usage: fable house

A hidden silent watchdog ALREADY runs this script's watchdog mode from the
Startup folder (see FABLES-HOUSE.ps1's -Watchdog branch). "fable house --watch"
is deliberately NOT implemented — running a second watchdog would double-heal
every stage. Just run this for a one-shot bring-up / status pass.

Exit code is the PowerShell process's own exit code (0 = bring-up completed).`);
}

async function cmdHouse(argv) {
  const args = parseArgs(argv);
  if (args.help || args.h) { helpHouse(); process.exitCode = EXIT.OK; return; }
  if (args.watch) {
    fail(EXIT.BAD_INPUT,
      'fable house --watch is not supported: a silent watchdog already runs FABLES-HOUSE.ps1 ' +
      'from the Startup folder (see FABLES-HOUSE.ps1 -Watchdog). Run "fable house" for a one-shot pass; ' +
      'run "fable audit" any time to see current state instead of starting a second watchdog.');
  }
  const script = join(REPO, 'scripts', 'fables-house', 'FABLES-HOUSE.ps1');
  if (!existsSync(script)) fail(EXIT.TARGET_DOWN, 'fable: FABLES-HOUSE.ps1 not found at ' + script);
  // -Once matches the script's own documented single-pass invocation
  // (its header comment: "-Once  (single pass, no watchdog)").
  await new Promise((resolve) => {
    const child = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-Once'], { stdio: 'inherit' });
    child.on('exit', (code) => { process.exitCode = code ?? EXIT.OK; resolve(); });
    child.on('error', () => { process.exitCode = EXIT.TARGET_DOWN; resolve(); });
  });
}

// ══════════════════════════════════════════════════════════════ audit ════
function helpAudit() {
  console.log(`fable audit — probe every target in apps/fables-sentry/targets.json the same way
Fable's Sentry does (port / http+identity / redis PING), then diff against
Sentry's own live snapshot at http://127.0.0.1:9140/api/status.

Usage: fable audit [--no-sentry]

Verdicts: UP · DOWN · WRONG SERVICE · AUTH MISSING · AUTH REJECTED · NOT CONFIGURED
A port answering is never reported as UP by itself — see targets.json's
"identity" fields and the redis PING probe.`);
}

async function cmdAudit(argv) {
  const args = parseArgs(argv);
  if (args.help || args.h) { helpAudit(); process.exitCode = EXIT.OK; return; }

  const targetsPath = join(REPO, 'apps', 'fables-sentry', 'targets.json');
  if (!existsSync(targetsPath)) fail(EXIT.TARGET_DOWN, 'fable: targets.json not found at ' + targetsPath);
  const registry = JSON.parse(readFileSync(targetsPath, 'utf8'));

  const rows = [];
  const probed = [];
  let downCount = 0;
  for (const g of registry.groups) {
    for (const t of g.targets) {
      const r = await probeTarget(t);
      probed.push({ t, r });
      const v = verdictOf(t, r);
      if (v !== 'UP') downCount++;
      rows.push([g.name, t.id, t.label, v, r.detail || '']);
    }
  }
  console.log(padTable(rows, ['Group', 'ID', 'Label', 'Verdict', 'Detail']));

  if (!args['no-sentry']) {
    console.log('\n--- diff vs Sentry (http://127.0.0.1:9140/api/status) ---');
    const sentry = await httpCheck('http://127.0.0.1:9140/api/status', null, 4000);
    if (!sentry.up) {
      console.log('Sentry UNREACHABLE: ' + sentry.detail + ' (no diff possible)');
    } else {
      try {
        const snap = await (await fetch('http://127.0.0.1:9140/api/status')).json();
        const byId = new Map();
        for (const g of snap.groups) for (const t of g.targets) byId.set(t.id, t.up);
        let diffs = 0;
        for (const { t, r } of probed) {
          const theirs = byId.get(t.id);
          if (theirs !== undefined && theirs !== r.up) {
            diffs++;
            console.log(`  DIFF ${t.id}: fable=${r.up ? 'UP' : 'DOWN'} sentry=${theirs ? 'UP' : 'DOWN'}`);
          }
        }
        if (diffs === 0) console.log('  no differences');
      } catch (e) {
        console.log('  could not parse Sentry snapshot: ' + e.message);
      }
    }
  }
  process.exitCode = downCount > 0 ? EXIT.TARGET_DOWN : EXIT.OK;
}

// ══════════════════════════════════════════════════════════════ omni ═════
const OMNI_BASE = () => (process.env.OPENAI_COMPAT_BASE_URL || 'http://192.168.0.8:20128/v1').replace(/\/+$/, '');

function omniHeaders(extra) {
  const key = readEnvValue('OMNI_ROUTE_API_KEY');
  const h = { ...extra };
  if (key) h['Authorization'] = 'Bearer ' + key;
  return h;
}

async function omniFetch(path, opts = {}, timeoutMs = 120000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  const url = OMNI_BASE() + path;
  try {
    const r = await fetch(url, { ...opts, signal: c.signal });
    return r;
  } finally { clearTimeout(t); }
}

function classifyHttpError(status) {
  if (status === 401) return EXIT.AUTH;
  if (status === 403) return EXIT.AUTH;
  return EXIT.TARGET_DOWN;
}

async function omniModels({ limit = 20 } = {}) {
  const r = await omniFetch('/models', { headers: omniHeaders({}) }, 120000);
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data: body, summary: r.ok ? `${body.data?.length ?? 0} models` : `HTTP ${r.status}` };
}

async function omniChat({ model, message, system, messagesFile, stream, maxTokens, temperature }) {
  if (!model) return { ok: false, status: 0, summary: '--model is required' };
  let messages;
  if (messagesFile) {
    messages = JSON.parse(readFileSync(messagesFile, 'utf8'));
  } else {
    messages = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: message || '' });
  }
  const body = { model, messages };
  if (maxTokens) body.max_tokens = Number(maxTokens);
  if (temperature) body.temperature = Number(temperature);
  if (stream) body.stream = true;

  const r = await omniFetch('/chat/completions', {
    method: 'POST',
    headers: omniHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify(body),
  });

  if (stream && r.body) {
    let full = '';
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        const l = line.trim();
        if (!l.startsWith('data:')) continue;
        const data = l.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const j = JSON.parse(data);
          const delta = j.choices?.[0]?.delta?.content;
          if (delta) { process.stdout.write(delta); full += delta; }
        } catch {}
      }
    }
    process.stdout.write('\n');
    return { ok: r.ok, status: r.status, data: { content: full }, summary: r.ok ? 'streamed' : `HTTP ${r.status}` };
  }

  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = null; }
  const content = json?.choices?.[0]?.message?.content;
  return {
    ok: r.ok,
    status: r.status,
    data: json ?? { raw: text.slice(0, 500) },
    summary: r.ok ? (content ?? JSON.stringify(json).slice(0, 300)) : `HTTP ${r.status}: ${text.slice(0, 300)}`,
  };
}

async function omniImage({ image, prompt, model }) {
  if (!image || !existsSync(image)) return { ok: false, status: 0, summary: '--image <path> must exist' };
  const fd = new FormData();
  fd.append('image', new Blob([readFileSync(image)]), basename(image));
  if (prompt) fd.append('prompt', prompt);
  if (model) fd.append('model', model);
  const r = await omniFetch('/images/edits', { method: 'POST', headers: omniHeaders({}), body: fd });
  const text = await r.text();
  return { ok: r.ok, status: r.status, data: { raw: text.slice(0, 500) }, summary: r.ok ? 'OK' : `HTTP ${r.status}: ${text.slice(0, 300)}` };
}

async function omniTranscribe({ file, model }) {
  if (!file || !existsSync(file)) return { ok: false, status: 0, summary: '--file <path> must exist' };
  const fd = new FormData();
  fd.append('file', new Blob([readFileSync(file)]), basename(file));
  fd.append('model', model || 'whisper-1');
  const r = await omniFetch('/audio/transcriptions', { method: 'POST', headers: omniHeaders({}), body: fd });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = null; }
  return { ok: r.ok, status: r.status, data: json ?? { raw: text.slice(0, 500) }, summary: r.ok ? (json?.text ?? 'OK') : `HTTP ${r.status}: ${text.slice(0, 300)}` };
}

async function omniVideo({ prompt, model, seconds }) {
  // UNVERIFIED route: /videos exists in the compiled bundle's route tree
  // (docs/omniroute-workflow-api/README.md) but its request/response schema
  // has not been confirmed against a live call.
  const body = { model: model || 'auto/best-fast', prompt };
  if (seconds) body.seconds = Number(seconds);
  const r = await omniFetch('/videos', { method: 'POST', headers: omniHeaders({ 'content-type': 'application/json' }), body: JSON.stringify(body) });
  const text = await r.text();
  return { ok: r.ok, status: r.status, data: { raw: text.slice(0, 500) }, summary: r.ok ? 'OK (route UNVERIFIED)' : `HTTP ${r.status}: ${text.slice(0, 300)}` };
}

async function omniEmbed({ input, model }) {
  // UNVERIFIED route — same caveat as /videos.
  const body = { model: model || 'auto/best-fast', input };
  const r = await omniFetch('/embeddings', { method: 'POST', headers: omniHeaders({ 'content-type': 'application/json' }), body: JSON.stringify(body) });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = null; }
  return { ok: r.ok, status: r.status, data: json ?? { raw: text.slice(0, 500) }, summary: r.ok ? 'OK (route UNVERIFIED)' : `HTTP ${r.status}: ${text.slice(0, 300)}` };
}

async function omniModeration({ input }) {
  // UNVERIFIED route.
  const r = await omniFetch('/moderations', { method: 'POST', headers: omniHeaders({ 'content-type': 'application/json' }), body: JSON.stringify({ input }) });
  const text = await r.text();
  return { ok: r.ok, status: r.status, data: { raw: text.slice(0, 500) }, summary: r.ok ? 'OK (route UNVERIFIED)' : `HTTP ${r.status}: ${text.slice(0, 300)}` };
}

async function omniBatches() {
  // UNVERIFIED route.
  const r = await omniFetch('/batches', { headers: omniHeaders({}) });
  const text = await r.text();
  return { ok: r.ok, status: r.status, data: { raw: text.slice(0, 500) }, summary: r.ok ? 'OK (route UNVERIFIED)' : `HTTP ${r.status}: ${text.slice(0, 300)}` };
}

const OMNI_ACTIONS = {
  models: omniModels,
  chat: omniChat,
  image: omniImage,
  transcribe: omniTranscribe,
  video: omniVideo,
  embed: omniEmbed,
  moderations: omniModeration,
  batches: omniBatches,
};

function helpOmni() {
  console.log(`fable omni <action> [args] — thin client for OmniRoute
  Base URL: \${OPENAI_COMPAT_BASE_URL:-http://192.168.0.8:20128/v1}
  Auth:     Authorization: Bearer \$OMNI_ROUTE_API_KEY (env, else parsed from C:\\ANTIGRAVITY\\.env at runtime — never printed)

Actions:
  models                                          VERIFIED  — GET /models
  chat --model <id> --message <text> [--system <text>] [--stream] [--max-tokens N] [--temperature N] [--messages-file <path>]
                                                   VERIFIED  — POST /chat/completions
  image --image <path> --prompt <text> [--model <id>]
                                                   UNVERIFIED body schema — POST /images/edits
  transcribe --file <path> [--model <id>]         UNVERIFIED body schema — POST /audio/transcriptions
  video --prompt <text> [--model <id>] [--seconds N]
                                                   UNVERIFIED route+schema — POST /videos
  embed --input <text> [--model <id>]             UNVERIFIED route+schema — POST /embeddings
  moderations --input <text>                      UNVERIFIED route+schema — POST /moderations
  batches                                         UNVERIFIED route+schema — GET /batches

Known combos: auto/best-coding, auto/best-reasoning, auto/best-fast all work
(200 "OK" via codex/gpt-5.6-sol as of 2026-09-03). auto/fastest does NOT exist (400).`);
}

async function cmdOmni(argv) {
  const [action, ...rest] = argv;
  if (!action || action === '--help' || action === '-h') { helpOmni(); process.exitCode = EXIT.OK; return; }
  const fn = OMNI_ACTIONS[action];
  if (!fn) fail(EXIT.BAD_INPUT, `fable omni: unknown action "${action}". Run "fable omni --help".`);
  const args = parseArgs(rest);
  if (args.help || args.h) { helpOmni(); process.exitCode = EXIT.OK; return; }
  try {
    const result = await fn(args);
    console.log(result.summary);
    process.exitCode = result.ok ? EXIT.OK : classifyHttpError(result.status);
  } catch (e) {
    fail(EXIT.TARGET_DOWN, `fable omni ${action}: ${e.message}`);
  }
}

// ══════════════════════════════════════════════════════════ workflow ═════
function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function interpolate(value, store) {
  if (typeof value !== 'string') return value;
  const m = value.match(/^\$\{([\w.]+)\}$/);
  if (m) return getPath(store, m[1]) ?? value;
  return value.replace(/\$\{([\w.]+)\}/g, (_, path) => {
    const v = getPath(store, path);
    return v === undefined ? '' : (typeof v === 'string' ? v : JSON.stringify(v));
  });
}

function helpWorkflow() {
  const names = existsSync(WORKFLOWS_DIR)
    ? readdirSync(WORKFLOWS_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
    : [];
  console.log(`fable workflow <name> — run scripts/fable/workflows/<name>.json

A workflow is a list of steps: { "omni": "<action>", "args": {...}, "saveAs": "<var>" }.
Args may reference earlier steps with \${var} or \${var.field.path}.

Available: ${names.join(', ') || '(none found)'}`);
}

async function cmdWorkflow(argv) {
  const [name, ...rest] = argv;
  if (!name || name === '--help' || name === '-h') { helpWorkflow(); process.exitCode = EXIT.OK; return; }
  const path = existsSync(name) ? name : join(WORKFLOWS_DIR, name.endsWith('.json') ? name : name + '.json');
  if (!existsSync(path)) fail(EXIT.BAD_INPUT, `fable workflow: not found: ${path}`);
  const def = JSON.parse(readFileSync(path, 'utf8'));
  const store = {};
  let failed = false;
  for (const [i, step] of (def.steps || []).entries()) {
    const fn = OMNI_ACTIONS[step.omni];
    if (!fn) { console.error(`step ${i}: unknown omni action "${step.omni}"`); failed = true; break; }
    const args = {};
    for (const [k, v] of Object.entries(step.args || {})) args[k] = interpolate(v, store);
    console.log(`--- step ${i}: omni ${step.omni} ---`);
    const result = await fn(args);
    console.log(result.summary);
    if (step.saveAs) store[step.saveAs] = result.data ?? result;
    if (!result.ok) { failed = true; break; }
  }
  process.exitCode = failed ? EXIT.TARGET_DOWN : EXIT.OK;
}

// ══════════════════════════════════════════════════════════════ mcp ══════
function helpMcp() {
  console.log(`fable mcp — list MCP servers from C:\\ANTIGRAVITY\\.mcp.json and %USERPROFILE%\\.claude.json,
plus the Paperclip broker's own view if http://127.0.0.1:3100/api/openapi.json answers
with info.title == "Paperclip API".

Usage: fable mcp`);
}

function listMcpFile(path, label) {
  if (!existsSync(path)) return [];
  let d;
  try { d = JSON.parse(readFileSync(path, 'utf8')); } catch { return []; }
  const servers = d.mcpServers || {};
  const rows = [];
  for (const [name, cfg] of Object.entries(servers)) {
    if (!cfg || typeof cfg !== 'object') continue;
    let transport, scriptPresent = '';
    if (cfg.url) {
      transport = 'http: ' + String(cfg.url).replace(/\?.*$/, '').slice(0, 50);
    } else if (cfg.command) {
      const script = (cfg.args || []).find((a) => typeof a === 'string' && /\.(mjs|cjs|js|py)$/i.test(a));
      transport = 'stdio: ' + cfg.command;
      scriptPresent = script ? (existsSync(script) ? 'yes' : 'MISSING') : 'n/a';
    } else {
      transport = 'unknown';
    }
    rows.push([label, name, transport, scriptPresent]);
  }
  return rows;
}

async function cmdMcp(argv) {
  const args = parseArgs(argv);
  if (args.help || args.h) { helpMcp(); process.exitCode = EXIT.OK; return; }

  const rows = [
    ...listMcpFile(join(REPO, '.mcp.json'), '.mcp.json'),
    ...listMcpFile(join(process.env.USERPROFILE || '', '.claude.json'), '~/.claude.json'),
  ];
  console.log(padTable(rows, ['Source', 'Name', 'Transport', 'Script present?']));

  console.log('\n--- Paperclip broker view ---');
  const check = await httpCheck('http://127.0.0.1:3100/api/openapi.json', 'Paperclip API', 5000);
  if (!check.up) {
    console.log('Paperclip: ' + verdictOf({ fix: 'paperclip' }, check) + ' — ' + check.detail);
    process.exitCode = EXIT.TARGET_DOWN;
    return;
  }
  try {
    const spec = await (await fetch('http://127.0.0.1:3100/api/openapi.json')).json();
    const mcpPaths = Object.keys(spec.paths || {}).filter((p) => /mcp/i.test(p));
    if (mcpPaths.length === 0) {
      console.log('Paperclip is UP but no MCP-related routes found in its OpenAPI spec.');
      process.exitCode = EXIT.OK;
      return;
    }
    console.log('MCP-related routes: ' + mcpPaths.join(', '));
    const listPath = mcpPaths.find((p) => spec.paths[p].get && !p.includes('{'));
    if (!listPath) {
      console.log('No parameter-free GET list route found among them; not guessing one.');
      process.exitCode = EXIT.OK;
      return;
    }
    const r = await fetch('http://127.0.0.1:3100' + listPath);
    if (r.status === 401 || r.status === 403) {
      console.log(`GET ${listPath} -> HTTP ${r.status}: AUTH MISSING (no token guessed).`);
      process.exitCode = EXIT.AUTH;
      return;
    }
    const body = await r.text();
    console.log(`GET ${listPath} -> HTTP ${r.status}: ${body.slice(0, 500)}`);
    process.exitCode = r.ok ? EXIT.OK : EXIT.TARGET_DOWN;
  } catch (e) {
    console.log('Paperclip openapi.json did not parse as JSON: ' + e.message);
    process.exitCode = EXIT.TARGET_DOWN;
  }
}

// ══════════════════════════════════════════════════════════════ ledger ═══
function helpLedger() {
  console.log(`fable ledger [text...]   — post a line to the shared node ledger (ops/buzz/ledger.sh, PowerShell fallback)
fable ledger --tail [N]  — read the last N entries (default 30, ops/buzz/ledger-tail.sh)`);
}

function runScript(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: 'inherit' });
    child.on('error', () => resolve({ ok: false, code: EXIT.TARGET_DOWN, missing: true }));
    child.on('exit', (code) => resolve({ ok: code === 0, code: code ?? EXIT.TARGET_DOWN }));
  });
}

async function cmdLedger(argv) {
  const args = parseArgs(argv);
  if (args.help || args.h) { helpLedger(); process.exitCode = EXIT.OK; return; }

  if (args.tail !== undefined) {
    const n = args.tail === true ? '30' : String(args.tail);
    const sh = join(REPO, 'ops', 'buzz', 'ledger-tail.sh');
    const r = await runScript('bash', [sh, n]);
    if (r.missing) fail(EXIT.TARGET_DOWN, 'fable ledger --tail: bash not found — cannot run ledger-tail.sh (no PowerShell tail script exists).');
    process.exitCode = r.code;
    return;
  }

  const text = argv.filter((a) => !a.startsWith('--')).join(' ');
  if (!text) fail(EXIT.BAD_INPUT, 'fable ledger: no message text given');
  const shSh = join(REPO, 'ops', 'buzz', 'ledger.sh');
  const r1 = await runScript('bash', [shSh, text]);
  if (!r1.missing) { process.exitCode = r1.code; return; }

  console.error('fable ledger: bash not found, falling back to PowerShell');
  const ps1 = join(REPO, 'ops', 'buzz', 'ledger.ps1');
  const r2 = await runScript('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1, text]);
  if (r2.missing) fail(EXIT.TARGET_DOWN, 'fable ledger: neither bash nor powershell could be launched.');
  process.exitCode = r2.code;
}

// ══════════════════════════════════════════════════════════════ dns ══════
const DNS_DOMAINS = [
  'aidoesitall.info', 'aidoesitall.online', 'aidoesitall.store', 'aidoesitall.website',
  'ai-solutions.store',
  'dream-online.info', 'dream-online.net', 'dream-online.org', 'dream-online.store',
  'onlinerecycle.net',
  'untilnokidinneed.com', 'untilnokidinneed.online', 'untilnokidinneed.org', 'untilnokidinneed.store',
];

function nslookupNS(domain) {
  return new Promise((resolve) => {
    const child = spawn('nslookup', ['-type=NS', domain, '8.8.8.8']);
    let out = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.on('error', () => resolve({ domain, servers: [], raw: 'nslookup not available' }));
    child.on('exit', () => {
      const servers = [...out.matchAll(/nameserver\s*=\s*(\S+)/gi)].map((m) => m[1].replace(/\.$/, ''));
      resolve({ domain, servers, raw: out });
    });
  });
}

function classifyNS(servers) {
  if (servers.length === 0) return 'EMPTY';
  if (servers.some((s) => s.includes('cloudflare.com'))) return 'CLOUDFLARE';
  if (servers.some((s) => s.includes('ui-dns'))) return 'IONOS';
  return 'OTHER';
}

function helpDns() {
  console.log(`fable dns — nslookup -type=NS via 8.8.8.8 for each of the 14 project domains,
classify as CLOUDFLARE / IONOS (ui-dns) / EMPTY (no NS = delegated nowhere) / OTHER.

Usage: fable dns`);
}

async function cmdDns(argv) {
  const args = parseArgs(argv);
  if (args.help || args.h) { helpDns(); process.exitCode = EXIT.OK; return; }

  const results = await Promise.all(DNS_DOMAINS.map(nslookupNS));
  const rows = results.map((r) => [r.domain, classifyNS(r.servers), r.servers.join(', ') || '(none)']);
  console.log(padTable(rows, ['Domain', 'Verdict', 'Nameservers']));
  process.exitCode = rows.some((r) => r[1] === 'EMPTY') ? EXIT.TARGET_DOWN : EXIT.OK;
}

// ══════════════════════════════════════════════════════════════ main ═════
function topHelp() {
  console.log(`fable — one npm script for the House

Usage: npm run fable -- <subcommand> [args]
   or: node scripts/fable/fable.mjs <subcommand> [args]

Subcommands:
  house               run FABLES-HOUSE.ps1 (single pass; --watch intentionally refused)
  audit                probe apps/fables-sentry/targets.json + diff vs Sentry's live /api/status
  omni <action>        thin client for OmniRoute (chat, image, transcribe, video, embed, models, ...)
  workflow <name>      run scripts/fable/workflows/<name>.json (data-driven omni pipelines)
  mcp                  list configured MCP servers + Paperclip broker's own view
  ledger [text]        post/read the shared node ledger (ops/buzz/ledger.sh / .ps1)
  dns                  NS lookup + registrar classification for the 14 project domains

Run "fable <subcommand> --help" for details. Exit codes: 0 ok · 1 bad input · 2 target down · 3 auth.`);
}

async function main() {
  const [, , cmd, ...rest] = process.argv;
  try {
    switch (cmd) {
      case undefined:
      case '--help':
      case '-h':
        topHelp();
        process.exitCode = EXIT.OK;
        break;
      case 'house': await cmdHouse(rest); break;
      case 'audit': await cmdAudit(rest); break;
      case 'omni': await cmdOmni(rest); break;
      case 'workflow': await cmdWorkflow(rest); break;
      case 'mcp': await cmdMcp(rest); break;
      case 'ledger': await cmdLedger(rest); break;
      case 'dns': await cmdDns(rest); break;
      default:
        console.error(`fable: unknown subcommand "${cmd}"\n`);
        topHelp();
        process.exitCode = EXIT.BAD_INPUT;
    }
  } catch (e) {
    if (e instanceof ExitSignal) {
      process.exitCode = e.code;
    } else {
      console.error(e.stack || e.message);
      process.exitCode = EXIT.TARGET_DOWN;
    }
  }
}

main();
