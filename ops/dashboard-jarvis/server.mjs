#!/usr/bin/env node
/**
 * JARVIS dashboard server — serves dashboard/jarvis on the LAN and gives the page
 * REAL data with no keys in the browser.
 *
 *   node server.mjs            # http://0.0.0.0:9150  (LAN: http://<NODE_LAN_IP>:9150)
 *
 * Configuration: process.env > <repo>/.env > derived defaults (lib/config.mjs).
 * Start it from a plain shell, not from inside a Claude Code terminal.
 *
 * Routes (all JSON unless noted):
 *   GET  /                      the dashboard (static files from this folder; lib/, tests/, server.mjs are never served)
 *   GET  /api/config            where things live, computed for the caller's host
 *   ANY  /api/omni/<path>       proxy -> OmniRoute /v1/<path> with OMNI_ROUTE_API_KEY from the repo .env
 *   ANY  /api/proxy/crosslisting/<path>  same-origin reverse proxy -> the local Crosslisting app
 *                                (keeps its iframe/embed working through a single-port tunnel)
 *   GET  /api/agents            every loadable skill (SKILL.md frontmatter) — live directory read
 *   GET  /api/speckit           Spec Kit panel: {constitution, features[]} read live from specs/ + .specify/memory/constitution.md
 *   GET  /api/speckit/<id>/<doc>  one feature's spec|plan|tasks markdown (path-sanitised, specs/ only)
 *   GET  /api/nodes             god's-eye view: both LAN nodes, every service identity-probed (lib/nodes.mjs)
 *   GET  /api/vault/graph       Obsidian vault notes + [[wikilinks]] as nodes/links
 *   GET  /api/vault/note?p=     one note's markdown (path relative to the vault)
 *   GET  /api/vault/status      is the Obsidian Local REST API answering (identity checked, https cert tolerated)
 *   GET  /api/crosslisting/status  server-side health probe of the local Crosslisting app
 *   GET  /api/house             FABLE'S SENTRY snapshot (real service state, identity-checked)
 *   GET  /api/avatars           rendered avatar PNGs in ops/avatar/out
 *   GET  /avatars/<file>        those PNGs
 *   GET  /api/claude/status     Claude CLI bridge capability (lib/bridge-routes.mjs; local-only unless DASHBOARD_BRIDGE_TOKEN)
 *   POST /api/claude/chat       headless `claude -p` streamed as Server-Sent Events
 *   POST /api/claude/stop       kill the running bridge child
 *   POST /api/launch/claude     open the official Claude CLI in a console on this host
 *   GET  /api/ollama/tags       local Ollama models
 *   POST /api/ollama/chat       local Ollama chat streamed as Server-Sent Events
 *   GET  /health                {service:"jarvis-dashboard"}  <- identity string for the wall
 *
 * Zero dependencies. Secrets are read from .env at request time and never logged or returned.
 */
import { createServer } from 'node:http';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { readFileSync, existsSync, readdirSync, statSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, resolve, sep } from 'node:path';
import { resolveConfig, resolveVault, readEnvFile } from './lib/config.mjs';
import { probeAll } from './lib/nodes.mjs';
import { resolveClaudeBinary, killTree, PERMISSION_MODES, PERSONAS } from './lib/claude-bridge.mjs';
import { resolveHermesBinary } from './lib/bridge-routes.mjs';
import { handleBridgeRoutes } from './lib/bridge-routes.mjs';
import { streamOllamaChat } from './lib/ollama.mjs';
import { createNewsService } from './lib/news.mjs';
import { loadTrends } from './lib/trends.mjs';
import { readConstitution, listFeatures, resolveDoc } from './lib/speckit.mjs';
import { readMissionRibbon } from './lib/mission-ribbon.mjs';
import { listTaskCommander } from './lib/task-commander.mjs';
import { gitPanel } from './lib/git-panel.mjs';
import { sanitizeHeaders, probeService } from './lib/session-proxy.mjs';
import { readHeartbeat } from './lib/heartbeat.mjs';
import { listRunbooks, resolveRunbook } from './lib/runbooks.mjs';
import { createLedgerReader } from './lib/ledger.mjs';
import { hostname, tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
// process.env > <repo>/.env > derived defaults (lib/config.mjs). The repo root is this checkout.
const CFG = resolveConfig({ here: HERE });
const REPO = CFG.repo;
const PORT = CFG.port;
const LAN_IP = CFG.lanIp;
const OMNI = CFG.omni;
// Vault resolution self-heals across machines: a configured path that does not exist
// (e.g. a Sabertooth path on Alienware) is skipped in favour of an existing candidate.
const VAULT_CFG = resolveVault({ env: process.env, readEnv: readEnvFile, envFile: CFG.envFile, candidates: [join(REPO, 'Antigravity'), 'C:\\DREAM\\AlienwareDream'] });
const VAULT = VAULT_CFG.path;
const VAULT_NAME = VAULT_CFG.name;
const VAULT_ID = VAULT_CFG.id; // stable Obsidian vault id for obsidian:// deep links
const SENTRY = CFG.sentry; // Fable's Sentry lives on Sabertooth unless FABLES_SENTRY_URL says otherwise
// Node-local endpoints from config (env > .env > live-verified defaults). The Obsidian
// plugin serves https with a self-signed cert, so vault probes tolerate the cert.
const OBSIDIAN_REST = CFG.obsidianRest;
const CROSSLISTING = CFG.crosslisting;
// ClawX AI Board voter: one Hermes one-shot per question (its own session, so the
// board never touches the JARVIS HUD conversation).
async function hermesBoardAsk(question) {
  const bin = resolveHermesBinary();
  const file = join(tmpdir(), `board-hermes-${randomBytes(6).toString('hex')}.txt`);
  writeFileSync(file, question, 'utf8');
  try {
    const out = await new Promise((resolve, reject) => {
      const child = spawn(bin, ['chat', '--query-file', file, '-Q', '--oneshot', '-c', 'clawx-board', '--create-if-missing'], { cwd: REPO, env: process.env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
      let o = '', e = '';
      const timer = setTimeout(() => { try { child.kill(); } catch {} reject(new Error('hermes timeout')); }, 120000);
      child.stdout.on('data', (c) => { o += String(c); });
      child.stderr.on('data', (c) => { e += String(c); });
      child.on('error', (err) => { clearTimeout(timer); reject(err); });
      child.on('close', (code) => { clearTimeout(timer); code === 0 ? resolve(o) : reject(new Error(e.trim().slice(-160) || 'hermes exit ' + code)); });
    });
    return { text: out };
  } finally { try { unlinkFileSync(file); } catch {} }
}
// Summary providers shared with the bridge so JARVIS's HUD preamble is composed
 // from exactly the data this server serves the page.
async function vaultStatusSummary() {
  const r = OBSIDIAN_REST.startsWith('https:')
    ? await getJsonInsecure(OBSIDIAN_REST + '/', 5000)
    : await getJson(OBSIDIAN_REST + '/', 5000);
  const up = r.status === 200 && /Obsidian Local REST API/.test(r.text || '');
  return { up, state: up ? 'UP' : (r.status ? 'WRONG SERVICE' : 'DOWN'), detail: up ? 'identity ok' : (r.error || 'HTTP ' + r.status) };
}
// Crosslisting health on behalf of the page: the browser cannot read :3000 cross-origin,
// so its old client probe reported a CORS failure as ONLINE. The tRPC health route is
// identity-checked server-side ({result:{data:{json:{ok:true}}}}).
async function crosslistingStatusSummary() {
  const probe = CROSSLISTING + '/api/trpc/system.health?input=' + encodeURIComponent('{"json":{"timestamp":0}}');
  const r = await getJson(probe, 5000);
  const ok = r.status === 200 && r.json && r.json.result && r.json.result.data && r.json.result.data.json && r.json.result.data.json.ok === true;
  return { up: ok, state: ok ? 'UP' : (r.status ? 'DOWN' : 'DOWN'), detail: ok ? 'health ok' : (r.error || 'HTTP ' + r.status), url: CROSSLISTING };
}
function agentsSummary() {
  const a = agents();
  return { count: a.length, source: SKILLS };
}
function houseSummary() {
  return getJson(SENTRY + '/api/status', 20000).then((r) => (!r.json ? { up: false, state: 'DOWN', detail: r.error || 'HTTP ' + r.status } : { up: true, state: 'UP', ...r.json }));
}
function vaultGraphSummary() {
  const g = vaultGraph();
  return { notes: (g.nodes || []).length, links: (g.links || []).length };
}
// Screensaver sources: live HN front page + the founder's real Google Trends notebook.
// Both probed server-side (no CORS, no keys in the browser) and honest when down.
const newsService = createNewsService({});
function trendsSummary() {
  const r = loadTrends(CFG.trendsPath);
  return r.ok ? { ok: true, source: r.source, summary: r.summary } : { ok: false, error: r.error, source: CFG.trendsPath };
}
// Skills tree: the classic .agents/skills layout when present, else this repo's skills/ folder.
const SKILLS = [join(REPO, '.agents', 'skills'), join(REPO, 'skills')].find((d) => existsSync(d)) || join(REPO, 'skills');
const AVATARS = join(REPO, 'ops', 'avatar', 'out');
// Spec Kit panel: specs/<feature>/{spec,plan,tasks}.md and the ratified constitution — both read live, no cache.
const SPECS_DIR = join(REPO, 'specs');
const CONSTITUTION_PATH = join(REPO, '.specify', 'memory', 'constitution.md');
// Ops tab (Phase B): mission ribbon reads CLAUDE.md + the judge journal, both live, no cache.
const CLAUDE_MD_PATH = join(REPO, 'CLAUDE.md');
const JUDGE_STATE_PATH = join(REPO, '.agents', 'journals', 'paperclip-judge', 'STATE.md');
// Git panel (Phase B): both real checkouts on this node, overridable in .env for a moved clone.
const GIT_REPOS = [
  { id: 'antigravity', path: REPO },
  { id: 'hermes', path: envValue('HERMES_REPO_PATH') || 'C:\\Users\\joshi\\hermes' },
];
// Hermes router + OpenClaw support (Phase B): same-node services, loopback by default.
const HERMES_URL = (envValue('HERMES_URL') || 'http://127.0.0.1:9119').replace(/\/$/, '');
const OPENCLAW_URL = (envValue('OPENCLAW_URL') || 'http://127.0.0.1:18789').replace(/\/$/, '');
// System status (Phase B, merged into the Mission Control tab): the 30-minute health probe's own files.
const HEARTBEAT_JSON_PATH = join(REPO, 'ops', 'heartbeat', 'sabretooth-health.json');
const HEARTBEAT_LOG_PATH = join(REPO, 'ops', 'heartbeat', 'health.log');
// Runbook viewer (Phase B).
const RUNBOOK_DIR = join(REPO, 'ops', 'runbook');
// Ledger panel (Phase B): 60s cache, 15s timeout, one reader instance for the process lifetime.
const readLedger = createLedgerReader({ cwd: REPO });
const STARTED_AT = new Date().toISOString(); // the House restarts this server when server.mjs is newer

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8' };

// Secrets are read from the .env at request time and never logged or returned.
function envValue(name) {
  return process.env[name] || readEnvFile(CFG.envFile)[name] || readEnvFile(join(REPO, '.env'))[name] || '';
}

// ── skills = agents (live directory read; --hash clones are Paperclip copies, skipped) ──
function agents() {
  if (!existsSync(SKILLS)) return [];
  const out = [];
  for (const d of readdirSync(SKILLS)) {
    if (/--[0-9a-f]{6,}$/.test(d)) continue;
    const f = join(SKILLS, d, 'SKILL.md');
    if (!existsSync(f)) continue;
    let name = d, description = '';
    try {
      const head = readFileSync(f, 'utf8').slice(0, 4000);
      const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(head);
      if (fm) {
        const n = /^name:\s*(.+)$/m.exec(fm[1]); if (n) name = n[1].trim().replace(/^"|"$/g, '');
        const ds = /^description:\s*([\s\S]*?)(?=\n[a-zA-Z_-]+:|\s*$)/m.exec(fm[1]);
        if (ds) description = ds[1].replace(/^[>|]-?\s*/, '').replace(/^"|"$/g, '').replace(/\s+/g, ' ').trim();
      }
    } catch {}
    const category = d.startsWith('agency-') ? 'agency'
      : d.startsWith('dateapp-') ? 'date app'
      : d.startsWith('hermes-') ? 'hermes'
      : d.startsWith('paperclip') ? 'paperclip (parked)'
      : d.startsWith('azure-') || d.startsWith('microsoft-') || d.startsWith('entra-') || d.startsWith('appinsights') ? 'azure'
      : /market|growth|seo|social|content|affiliate|copy|devrel|preorder|revenue/.test(d) ? 'marketing'
      : /judge|orchestrat|house|sabretooth|mission|omniroute|fables|self-improving|ceo|status-card|issue-triage|doc-maint|workspace-memory|para-memory|planning|verification|requesting|finishing|executing|writing-plans|subagent|dispatching|using-git|systematic|tdd|test-driven|brainstorm|find-skills|skill-creator|create-skills|caveman|adhd|reflection/.test(d) ? 'ops + method'
      : /game|unreal|godot|unity|dream|motion/.test(d) ? 'game + design'
      : /supabase|payments|browser|agent-reach|miyo|obsidian|openviking|system-connector|webapp|ui-ux|sleek|21st/.test(d) ? 'tools'
      : 'other';
    out.push({ id: d, name, description, category, path: `.agents/skills/${d}/SKILL.md` });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

// ── Obsidian vault graph (notes + wikilinks), cached 60 s ─────────────────────
let graphCache = { at: 0, data: null };
function walk(dir, base, acc) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, base, acc);
    else if (e.name.toLowerCase().endsWith('.md')) acc.push(p.slice(base.length + 1).replace(/\\/g, '/'));
  }
}
function vaultGraph() {
  if (Date.now() - graphCache.at < 60000 && graphCache.data) return graphCache.data;
  if (!existsSync(VAULT)) return { ok: false, error: 'vault not found: ' + VAULT, nodes: [], links: [] };
  const files = [];
  walk(VAULT, VAULT, files);
  const byName = new Map();
  const nodes = files.map((rel) => {
    const name = rel.replace(/\.md$/i, '');
    const short = name.split('/').pop();
    const folder = name.includes('/') ? name.split('/')[0] : '(root)';
    const n = { id: name, label: short, group: folder, out: 0, in: 0 };
    byName.set(name.toLowerCase(), n);
    if (!byName.has(short.toLowerCase())) byName.set(short.toLowerCase(), n);
    return n;
  });
  const links = [];
  const seen = new Set();
  for (const rel of files) {
    const src = byName.get(rel.replace(/\.md$/i, '').toLowerCase());
    let txt; try { txt = readFileSync(join(VAULT, rel), 'utf8'); } catch { continue; }
    for (const m of txt.matchAll(/\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g)) {
      const target = byName.get(m[1].trim().replace(/\.md$/i, '').toLowerCase());
      if (!target || target === src) continue;
      const key = src.id + '\u0000' + target.id;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({ source: src.id, target: target.id });
      src.out++; target.in++;
    }
  }
  const data = { ok: true, vault: VAULT, name: VAULT_NAME, id: VAULT_ID, notes: nodes.length, wikilinks: links.length,
    orphans: nodes.filter((n) => n.in + n.out === 0).length, nodes, links, at: new Date().toISOString() };
  graphCache = { at: Date.now(), data };
  return data;
}
function vaultNote(rel) {
  const full = resolve(VAULT, rel.endsWith('.md') ? rel : rel + '.md');
  if (!full.startsWith(resolve(VAULT) + sep)) return { ok: false, error: 'outside the vault' };
  if (!existsSync(full)) return { ok: false, error: 'not found' };
  return { ok: true, path: rel, markdown: readFileSync(full, 'utf8').slice(0, 200000) };
}

// ── Spec Kit panel (Phase A): specs/<feature>/{spec,plan,tasks}.md + the constitution ──
// Read-only, live off disk every request — no cache, no sample rows (Constitution VIII).
// Logic lives in lib/speckit.mjs (pure, path-injected) so it is unit-tested without booting this server.

// ── helpers ───────────────────────────────────────────────────────────────────
async function getJson(url, ms = 20000, headers = {}) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch(url, { signal: c.signal, headers }); const text = await r.text(); let j = null; try { j = JSON.parse(text); } catch {} return { status: r.status, json: j, text }; }
  catch (e) { return { status: 0, error: String(e.message || e) }; }
  finally { clearTimeout(t); }
}
// fetch with a self-signed certificate tolerated (node:https), same shape as getJson.
async function getJsonInsecure(url, ms = 20000) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https:') ? httpsRequest : httpRequest;
    const req = mod(url, { rejectUnauthorized: false, timeout: ms }, (r) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null; try { json = JSON.parse(text); } catch {}
        resolve({ status: r.statusCode, json, text });
      });
    });
    req.on('timeout', () => { req.destroy(new Error('timeout after ' + ms + ' ms')); });
    req.on('error', (e) => resolve({ status: 0, error: String(e.message || e) }));
    req.end();
  });
}
function readBody(req) { return new Promise((res) => { const b = []; req.on('data', (c) => b.push(c)); req.on('end', () => res(Buffer.concat(b))); }); }
function send(res, code, body, type = 'application/json') {
  res.writeHead(code, { 'content-type': type, 'access-control-allow-origin': '*', 'cache-control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
// Same-origin reverse proxy with response headers sanitized (lib/session-proxy.mjs):
// a session/auth cookie from Hermes or OpenClaw must never reach the browser.
async function proxyStripped(req, res, url, base, prefix) {
  const target = base + url.pathname.slice(prefix.length) + url.search;
  const c = new AbortController(); const t = setTimeout(() => c.abort(), 20000);
  try {
    const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await readBody(req);
    const r = await fetch(target, { method: req.method, headers: { 'content-type': req.headers['content-type'] || 'application/json' }, body, signal: c.signal, redirect: 'manual' });
    const buf = Buffer.from(await r.arrayBuffer());
    const headers = sanitizeHeaders(r.headers);
    res.writeHead(r.status, { 'content-type': headers['content-type'] || 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    return res.end(buf);
  } catch (e) {
    const label = base.includes('9119') ? 'Hermes' : 'OpenClaw';
    return send(res, 502, { error: `${label} unreachable: ${String(e.message || e)}`, target });
  } finally { clearTimeout(t); }
}
function serveStatic(res, rel) {
  const full = resolve(HERE, '.' + rel);
  if (!full.startsWith(resolve(HERE) + sep) && full !== resolve(HERE)) return send(res, 403, { error: 'forbidden' });
  if (!existsSync(full) || statSync(full).isDirectory()) return send(res, 404, { error: 'not found' });
  res.writeHead(200, { 'content-type': MIME[extname(full).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(readFileSync(full));
}

// ── server ────────────────────────────────────────────────────────────────────
// Bridge + Ollama routes (lib/bridge-routes.mjs) run first: no wildcard CORS, origin-checked, local-only by default.
const BRIDGE_DEPS = {
  cfg: { ...CFG, vaultName: VAULT_NAME, vaultPath: VAULT, vaultId: VAULT_ID },
  envValue, spawn, killTree: (child) => killTree(child, { spawn }), resolveBinary: () => resolveClaudeBinary(), fetch: globalThis.fetch,
  probeAll, vaultStatus: vaultStatusSummary, agentsSummary, houseSummary, vaultGraph: vaultGraphSummary,
  // Durable JARVIS memory (dashboard/jarvis/data/jarvis-memory.json; /data is never served).
  jarvisMemory: { dataFile: join(HERE, 'data', 'jarvis-memory.json') },
  // FreeBuff wake bridge (wake-file protocol from ANTIGRAVITY's paperclip-ceo):
  // the dashboard writes pending wakes; the user's Freebuff desktop session watches
  // this dir and reports done/fail back through POST routes.
  wakeStore: { wakesDir: envValue('FREEBUFF_WAKES_DIR') || join(REPO, '.freebuff', 'wakes') },
  // ClawX AI Board: six free-thinking voters over real backends — Hermes plus five
  // Ollama models verified installed on this node (ollama list, 2026-09-16). A seat
  // that fails, stalls past the route's seat timeout, or answers without a clear
  // yes/no ABSTAINS — the tally never counts a dead seat as a vote.
  board: {
    seatTimeoutMs: 120000,
    brains: [
      { name: 'Hermes', ask: (q) => hermesBoardAsk(q) },
      ...['gemma4:e4b', 'ornith-1.5:9b', 'deepseek-v4-flash:cloud', 'glm-5.3-flash:cloud', 'qwen3:1.7b'].map((model) => ({
        name: 'Ollama/' + model.split(':')[0],
        ask: async (q) => streamOllamaChat({ model, messages: [{ role: 'user', content: q }], onEvent: () => {} }),
      })),
    ],
  },
};

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  if (await handleBridgeRoutes(req, res, BRIDGE_DEPS)) return;
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' }); return res.end(); }

  if (p === '/favicon.ico') { res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'max-age=86400' }); return res.end('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0d1117"/><circle cx="16" cy="16" r="9" fill="none" stroke="#58a6ff" stroke-width="3"/><circle cx="16" cy="16" r="3" fill="#3fb950"/></svg>'); }
  if (p === '/health') return send(res, 200, { status: 'ok', service: 'jarvis-dashboard', port: PORT, startedAt: STARTED_AT });

  if (p === '/api/config') {
    const host = (req.headers.host || '').replace(/:\d+$/, '') || LAN_IP;
    return send(res, 200, {
      host, lanIp: LAN_IP, omniRoute: OMNI, omniProxy: '/api/omni',
      // LAN-only "open in a new tab" links are built from LAN_IP, never req.headers.host:
      // behind a tunnel that host is the tunnel's own domain (not this LAN), so a link
      // built from it would be a silently broken URL instead of a clearly-labelled LAN one.
      missionControl: CFG.missionControl, hermesDashboard: `http://${LAN_IP}:9119/`, sentry: SENTRY + '/',
      vault: { path: VAULT, name: VAULT_NAME, id: VAULT_ID, rest: OBSIDIAN_REST },
      crosslisting: { base: CROSSLISTING, status: '/api/crosslisting/status', embed: '/api/proxy/crosslisting/' },
      claude: {
        chat: '/api/claude/chat', status: '/api/claude/status', launch: '/api/launch/claude',
        command: 'claude -p --output-format stream-json (headless, account auth)',
        note: 'Chat streams from the official Claude CLI on ' + (CFG.nodeName || hostname()) + '. Loopback callers only unless DASHBOARD_BRIDGE_TOKEN is set in .env. The launch button opens an interactive window on this host.',
        personas: Object.keys(PERSONAS), permissionModes: PERMISSION_MODES,
      },
      at: new Date().toISOString(),
    });
  }

  // Local TTS voice pack manifest. The picker UI downloads this so users can register
  // a self-hosted/local voice set on this node instead of relying solely on browser/OS voices.
  // Real voice binaries live in VOICES_DIR (override in .env) and are served by the static
  // fallback below; this endpoint just describes what's available so the picker can offer them.
  if (p === '/api/voices/local-pack' || p === '/api/voices/local-pack.json') {
    const voicesDir = process.env.JARVIS_VOICES_DIR || path.join(ROOT, 'voices');
    let voices = [];
    try {
      const entries = await fs.readdir(voicesDir, { withFileTypes: true });
      voices = entries.filter(e => e.isFile() && /\.(wav|mp3|ogg|m4a)$/i.test(e.name)).map(e => ({
        name: e.name.replace(/\.[^.]+$/, ''),
        uri: '/api/voices/' + encodeURIComponent(e.name),
        lang: 'en-US',
        local: true,
      }));
    } catch (e) {
      // Directory missing is fine — return an empty pack so the picker still works.
      voices = [];
    }
    return send(res, 200, { voices, dir: voicesDir, note: 'Drop .wav/.mp3/.ogg/.m4a files into the voices dir and refresh the picker.' });
  }
  if (p.startsWith('/api/voices/')) {
    const voicesDir = process.env.JARVIS_VOICES_DIR || path.join(ROOT, 'voices');
    const name = decodeURIComponent(p.slice('/api/voices/'.length));
    if (!name || name.includes('/') || name.includes('..')) return send(res, 400, { error: 'Bad voice name' });
    const file = path.join(voicesDir, name);
    if (!file.startsWith(path.resolve(voicesDir))) return send(res, 403, { error: 'Forbidden' });
    try {
      const stat = await fs.stat(file);
      if (!stat.isFile()) return send(res, 404, { error: 'Not a file' });
      res.writeHead(200, { 'content-type': 'audio/wav', 'content-length': stat.size, 'cache-control': 'max-age=3600', 'access-control-allow-origin': '*' });
      return fs.createReadStream(file).pipe(res);
    } catch (e) { return send(res, 404, { error: 'Voice file not found' }); }
  }

  // Same-origin reverse proxy to the local Crosslisting app, so its iframe embed
  // (and any future "open service X in this dashboard" panel) works through a
  // single-port tunnel that can only reach JARVIS's own port. No secrets involved;
  // this just forwards bytes to a loopback service the browser otherwise cannot reach.
  if (p === '/api/proxy/crosslisting' || p.startsWith('/api/proxy/crosslisting/')) {
    const target = CROSSLISTING + p.slice('/api/proxy/crosslisting'.length) + url.search;
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 20000);
    try {
      const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await readBody(req);
      const r = await fetch(target, { method: req.method, headers: { 'content-type': req.headers['content-type'] || 'application/json' }, body, signal: c.signal });
      const buf = Buffer.from(await r.arrayBuffer());
      res.writeHead(r.status, { 'content-type': r.headers.get('content-type') || 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(buf);
    } catch (e) { return send(res, 502, { error: 'Crosslisting unreachable: ' + String(e.message || e), target: CROSSLISTING }); }
    finally { clearTimeout(t); }
  }

  if (p.startsWith('/api/omni/')) {
    const key = envValue('OMNI_ROUTE_API_KEY');
    if (!key) return send(res, 503, { error: 'AUTH MISSING: OMNI_ROUTE_API_KEY not in ' + CFG.envFile });
    const target = OMNI + p.slice('/api/omni'.length) + url.search;
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 300000);
    try {
      const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await readBody(req);
      const r = await fetch(target, { method: req.method, headers: { authorization: 'Bearer ' + key, 'content-type': req.headers['content-type'] || 'application/json' }, body, signal: c.signal });
      const buf = Buffer.from(await r.arrayBuffer());
      res.writeHead(r.status, { 'content-type': r.headers.get('content-type') || 'application/json', 'access-control-allow-origin': '*', 'cache-control': 'no-store' });
      return res.end(buf);
    } catch (e) { return send(res, 502, { error: 'OmniRoute unreachable: ' + String(e.message || e) }); }
    finally { clearTimeout(t); }
  }

  if (p === '/api/agents') { const a = agents(); return send(res, 200, { count: a.length, source: SKILLS, agents: a, at: new Date().toISOString() }); }
  // Spec Kit panel (read-only): specs/<feature>/{spec,plan,tasks}.md + the constitution.
  if (p === '/api/speckit') return send(res, 200, { constitution: readConstitution(CONSTITUTION_PATH), features: listFeatures(SPECS_DIR), at: new Date().toISOString() });
  // Ops tab (Phase B): mission ribbon (read-only, no cache).
  if (p === '/api/mission-ribbon') return send(res, 200, readMissionRibbon({ claudeMdPath: CLAUDE_MD_PATH, stateMdPath: JUDGE_STATE_PATH }));
  if (p === '/api/task-commander') return send(res, 200, { features: listTaskCommander(SPECS_DIR), at: new Date().toISOString() });
  if (p === '/api/git-panel') return send(res, 200, { repos: gitPanel(GIT_REPOS), at: new Date().toISOString() });

  // Hermes router + OpenClaw support panels: status probe (identity-checked when JSON,
  // reachable+TCP when the service only serves HTML) and a session-stripping reverse proxy
  // so an embedded view never leaks a Set-Cookie / auth header to the browser.
  if (p === '/api/hermes-status') return send(res, 200, await probeService({ url: HERMES_URL + '/api/health', host: '127.0.0.1', port: 9119 }));
  if (p === '/api/openclaw-status') return send(res, 200, await probeService({ url: OPENCLAW_URL + '/healthz', host: '127.0.0.1', port: 18789 }));
  if (p === '/api/proxy/hermes' || p.startsWith('/api/proxy/hermes/')) return proxyStripped(req, res, url, HERMES_URL, '/api/proxy/hermes');
  if (p === '/api/proxy/openclaw' || p.startsWith('/api/proxy/openclaw/')) return proxyStripped(req, res, url, OPENCLAW_URL, '/api/proxy/openclaw');
  if (p === '/api/heartbeat') return send(res, 200, readHeartbeat({ jsonPath: HEARTBEAT_JSON_PATH, logPath: HEARTBEAT_LOG_PATH }));
  if (p === '/api/runbooks') return send(res, 200, { runbooks: listRunbooks(RUNBOOK_DIR), at: new Date().toISOString() });
  { const m = /^\/api\/runbooks\/([^/]+)$/.exec(p);
    if (m) { const r = resolveRunbook(RUNBOOK_DIR, decodeURIComponent(m[1])); return send(res, r.ok ? 200 : (r.error === 'not found' ? 404 : 400), r); } }
  if (p === '/api/ledger') return send(res, 200, await readLedger());
  { const m = /^\/api\/speckit\/([^/]+)\/([^/]+)$/.exec(p);
    if (m) { const r = resolveDoc(SPECS_DIR, decodeURIComponent(m[1]), decodeURIComponent(m[2])); return send(res, r.ok ? 200 : (r.error === 'not found' ? 404 : 400), r); } }
  // God's-eye view: every LAN service probed with an identity check (lib/nodes.mjs). No sample data.
  if (p === '/api/nodes') return send(res, 200, await probeAll({ timeoutMs: 3000 }));
  if (p === '/api/vault/graph') return send(res, 200, vaultGraph());
  if (p === '/api/vault/note') return send(res, 200, vaultNote(url.searchParams.get('p') || ''));
  if (p === '/api/vault/status') {
    const r = await vaultStatusSummary();
    return send(res, 200, { ...r, url: OBSIDIAN_REST });
  }
  if (p === '/api/crosslisting/status') {
    return send(res, 200, await crosslistingStatusSummary());
  }
  if (p === '/api/news') return send(res, 200, await newsService.getTopStories());
  if (p === '/api/trends') return send(res, 200, trendsSummary());
  if (p === '/api/house') {
    const r = await getJson(SENTRY + '/api/status', 120000);
    if (!r.json) return send(res, 200, { up: false, state: 'DOWN', detail: r.error || ('HTTP ' + r.status), sentry: SENTRY });
    return send(res, 200, { up: true, state: 'UP', sentry: SENTRY, ...r.json });
  }
  if (p === '/api/avatars') {
    const files = existsSync(AVATARS) ? readdirSync(AVATARS).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f)).map((f) => ({ file: f, url: '/avatars/' + encodeURIComponent(f), bytes: statSync(join(AVATARS, f)).size, modified: statSync(join(AVATARS, f)).mtime.toISOString() })) : [];
    return send(res, 200, { dir: AVATARS, count: files.length, files });
  }
  if (p.startsWith('/avatars/')) {
    const f = decodeURIComponent(p.slice('/avatars/'.length));
    const full = resolve(AVATARS, f);
    if (!full.startsWith(resolve(AVATARS) + sep) || !existsSync(full)) return send(res, 404, { error: 'not found' });
    res.writeHead(200, { 'content-type': MIME[extname(full).toLowerCase()] || 'application/octet-stream' });
    return res.end(readFileSync(full));
  }

  if (p === '/' || p === '/index.html') return serveStatic(res, '/index.html');
  if (p === '/data/' || p.startsWith('/data/')) return send(res, 404, { error: 'not found' }); // JARVIS memory stays server-side
  if (p.startsWith('/api/')) return send(res, 404, { error: 'no such route' });
  return serveStatic(res, p);
}).listen(PORT, '0.0.0.0', () => {
  console.log(`JARVIS dashboard on http://0.0.0.0:${PORT}  (LAN: http://${LAN_IP}:${PORT})  omni=${OMNI}  vault=${VAULT}`);
});
