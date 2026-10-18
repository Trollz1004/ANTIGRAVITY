// Mission Agent OS (JARVIS/OPSIS) — the one Mission Control on the T5500.
// Serves the board (oldmissioncontrol.html) at /, a live admin page at /live,
// 16 Stitch screens at /screens/<name>/, a read-only state feed at /api/mos-state.json,
// official OAuth/CLI/ACP/A2A bridge probes at /api/bridges, and live JARVIS dispatch at /api/jarvis/dispatch.
// Binds 127.0.0.1 only. No secrets leave this process.
import http from 'node:http';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { guardRequest, readOps, openBrowser, envelope } from './ops-backend.mjs';

const ROOT = 'C:/ANTIGRAVITY';
const PORT = Number(process.env.MISSION_OS_PORT || 3130);
const BOARD = `${ROOT}/oldmissioncontrol.html`;
const STATUS = `${ROOT}/ops/t5500/status.json`;
const CLIENT_JS = `${ROOT}/mission-os/jarvis-bridge-client.js`;

export const BINARIES = {
  agy: 'C:/Users/joshi/AppData/Local/Microsoft/WinGet/Links/agy.exe',
  agyShim: 'C:/ANTIGRAVITY/ops/paperclip/agy-gemini.cmd',
  claude: 'C:/Users/joshi/.local/bin/claude.exe',
  codex: 'C:/Users/joshi/AppData/Roaming/npm/codex.cmd',
  grok: 'C:/Users/joshi/.grok/bin/grok.exe',
  hermes: 'C:/Users/joshi/AppData/Local/hermes/bin/hermes.exe',
  hermesAcp: 'C:/Users/joshi/AppData/Local/hermes/bin/hermes-acp.exe',
  ollama: 'C:/Users/joshi/AppData/Local/Programs/Ollama/ollama.exe',
};

export const SERVICES = [
  { id: 'mission-control', port: 3130, what: 'Mission Control (JARVIS/OPSIS board, this page)', url: 'http://127.0.0.1:3130/' },
  { id: 'paperclip', port: 3917, what: 'Paperclip, marketing command layer', url: 'http://127.0.0.1:3917/' },
  { id: 'omniroute', port: 20128, what: 'OmniRoute AI gateway + dashboard', url: 'http://127.0.0.1:20128/' },
  { id: 'hermes', port: 9119, what: 'Hermes desktop dashboard (Nous, the one Hermes on this node)', url: 'http://127.0.0.1:9119/' },
  { id: 'hermes-a2a', port: 8643, what: 'Hermes shared A2A / Gateway API (hermes-agent)', url: 'http://127.0.0.1:8643/health', probe: 'http://127.0.0.1:8643/health' },
  { id: 'ollama', port: 11434, what: 'Ollama root (ollama serve; GGUF models)', url: 'http://127.0.0.1:11434/', probe: 'http://127.0.0.1:11434/' },
  { id: 'ollama-v1', port: 11434, what: 'Ollama OpenAI-compatible /v1', url: 'http://127.0.0.1:11434/v1/models', probe: 'http://127.0.0.1:11434/v1/models' },
  { id: 'ollama-tags', port: 11434, what: 'Ollama installed models /api/tags', url: 'http://127.0.0.1:11434/api/tags', probe: 'http://127.0.0.1:11434/api/tags' },
  { id: 'domains', port: 9160, what: 'Static domain origins behind the tunnel', url: 'http://127.0.0.1:9160/' },
  { id: 'frontend', port: 3200, what: 'youandinotai.com date app frontend', url: 'http://127.0.0.1:3200/' },
  { id: 'api', port: 8000, what: 'Date app API (api.youandinotai.com)', url: 'http://127.0.0.1:8000/docs' },
  { id: 'postgres', port: 5432, what: 'PostgreSQL (date app data)' },
  { id: 'redis', port: 6379, what: 'Redis (sessions/cache)' },
  { id: 'obsidian', port: 27123, what: 'Obsidian Local REST (vault C:\\ANTIGRAVITY\\Antigravity)' },
];
export const DOMAINS = ['youandinotai.com', 'onlinerecycle.net', 'dream-online.net'];

const tcp = (port) => new Promise((res) => {
  const s = net.connect({ host: '127.0.0.1', port, timeout: 1500 });
  s.on('connect', () => { s.destroy(); res(true); });
  s.on('error', () => res(false)); s.on('timeout', () => { s.destroy(); res(false); });
});
const head = async (url) => {
  try { const r = await fetch(url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(6000) }); return r.status; }
  catch { return 0; }
};

function runVersion(bin, args = ['--version']) {
  return new Promise((resolve) => {
    if (!fs.existsSync(bin)) return resolve({ ok: false, version: 'NOT FOUND' });
    const isCmd = bin.toLowerCase().endsWith('.cmd');
    execFile(isCmd ? 'cmd.exe' : bin, isCmd ? ['/c', bin, ...args] : args, { timeout: 6000, windowsHide: true }, (err, stdout, stderr) => {
      const out = String(stdout || stderr || '').trim().split(/\r?\n/)[0];
      resolve({ ok: !err && Boolean(out), version: out || (err ? err.message : 'unknown') });
    });
  });
}

const bridgeSpecs = [
  ['gemini', 'Gemini (agy CLI)', 'agy'], ['claude', 'Claude Code', 'claude'],
  ['codex', 'OpenAI Codex', 'codex'], ['grok', 'Grok CLI', 'grok'],
  ['hermes', 'OmniRoute model proxy (not Hermes tools)', 'hermes'],
  ['fable', 'Fable local model', 'ollama'],
];
let bridgeCache = { at: 0, refreshing: false, data: {
  generated: null, bridges: bridgeSpecs.map(([id, name, bin]) => ({
    id, name, installed: fs.existsSync(BINARIES[bin]), status: 'UNVERIFIED',
    authenticated: null, inferenceVerified: false, version: null, canRun: false,
    auth: 'Not verified', protocol: id === 'hermes' ? 'Model proxy only; no agent tools' : 'CLI / HTTP',
  })),
}};
async function refreshBridges() {
  if (bridgeCache.refreshing) return bridgeCache.data;
  bridgeCache.refreshing = true;
  try {
    const bridges = await Promise.all(bridgeSpecs.map(async ([id, name, bin]) => {
      const installed = fs.existsSync(BINARIES[bin]);
      const v = await runVersion(BINARIES[bin]);
      return { id, name, installed, status: installed ? 'INSTALLED / UNVERIFIED' : 'NOT INSTALLED',
        version: v.ok ? v.version : null, authenticated: null, inferenceVerified: false,
        canRun: ['hermes', 'fable'].includes(id),
        auth: 'Not verified', protocol: id === 'hermes' ? 'OmniRoute model proxy only; no Hermes tools' : 'CLI / HTTP',
        detail: ['hermes', 'fable'].includes(id) ? 'Explicit model request available; inference not yet verified' : 'Use authenticated local CLI; unattended web dispatch disabled',
      };
    }));
    bridgeCache = { at: Date.now(), refreshing: false, data: { generated: new Date().toISOString(), bridges } };
  } finally { bridgeCache.refreshing = false; }
  return bridgeCache.data;
}
async function probeBridges() {
  if (Date.now() - bridgeCache.at > 30000) return refreshBridges();
  return bridgeCache.data;
}

function readOmniRouteKey() {
  const candidates = [
    'C:\\ANTIGRAVITY\\.env',
    path.join(os.homedir(), '.omniroute', '.env'),
  ];
  for (const p of candidates) {
    try {
      const txt = fs.readFileSync(p, 'utf8');
      const m = txt.match(/^OMNIROUTE_API_KEY\s*=\s*(.+)$/m);
      if (m && m[1]) return m[1].trim().replace(/^['"]|['"]$/g, '');
    } catch {}
  }
  return '';
}

async function dispatchJarvis({ brain = 'gemini', prompt = '' }) {
  const cleanPrompt = String(prompt || '').trim();
  if (!cleanPrompt) return { ok: false, brain, error: 'Prompt is required' };
  const start = Date.now();

  if (brain === 'fable') {
    try {
      const r = await fetch('http://127.0.0.1:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'joshlcoleman/Fable:latest',
          stream: false,
          messages: [{ role: 'user', content: cleanPrompt }],
        }),
        signal: AbortSignal.timeout(60000),
      });
      const j = await r.json();
      return {
        ok: r.ok && Boolean(j?.message?.content),
        brain,
        commandUsed: 'ollama /api/chat (joshlcoleman/Fable:latest)',
        output: j?.message?.content || '',
        error: !r.ok ? `HTTP ${r.status}` : undefined,
        durationMs: Date.now() - start,
      };
    } catch (e) {
      return { ok: false, brain, commandUsed: 'ollama /api/chat', error: String(e.message || e), durationMs: Date.now() - start };
    }
  }

  if (['gemini', 'claude', 'codex', 'grok'].includes(brain)) {
    return { ok: false, brain, error: 'Web CLI dispatch disabled: use the authenticated local CLI with interactive permissions. No shell commands are accepted.' };
  }

  if (brain === 'hermes') {
    try {
      const orKey = readOmniRouteKey();
      const headers = { 'Content-Type': 'application/json' };
      if (orKey) headers.Authorization = `Bearer ${orKey}`;
      const r = await fetch('http://127.0.0.1:20128/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'hermes-support',
          messages: [{ role: 'user', content: cleanPrompt }],
        }),
        signal: AbortSignal.timeout(60000),
      });
      const j = await r.json();
      const reply = j?.choices?.[0]?.message?.content || '';
      return {
        ok: r.ok && Boolean(reply),
        brain,
        commandUsed: 'OmniRoute http://127.0.0.1:20128/v1 (hermes-support model proxy; no Hermes tools)',
        output: reply,
        error: !r.ok ? `HTTP ${r.status}` : undefined,
        durationMs: Date.now() - start,
      };
    } catch (e) {
      return {
        ok: false,
        brain,
        commandUsed: 'OmniRoute http://127.0.0.1:20128/v1 (hermes-support)',
        error: String(e.message || e),
        durationMs: Date.now() - start,
      };
    }
  }

  return { ok: false, brain, error: `Unknown brain: ${brain}` };
}

function readKeepaliveSync() {
  try { return JSON.parse(fs.readFileSync(STATUS, 'utf8').replace(/^\uFEFF/, '')); } catch { return null; }
}

let cache = {
  at: Date.now(),
  refreshing: false,
  data: {
    identity: 'mission-agent-os',
    node: os.hostname(),
    host: os.hostname(),
    ip: '192.168.0.15',
    generated: new Date().toISOString(),
    services: SERVICES.map((s) => ({ ...s, listening: null, status: 'UNVERIFIED', identityVerified: false })),
    domains: DOMAINS.map((d) => ({ domain: d, https: null })),
    bridges: bridgeCache.data.bridges,
    keepalive: readKeepaliveSync(),
  },
};

async function refreshState() {
  if (cache.refreshing) return cache.data;
  cache.refreshing = true;
  try {
    const [services, domains, bridgeData] = await Promise.all([
      Promise.all(SERVICES.map(async (s) => { const listening = await tcp(s.port); return {...s, listening, status: listening ? 'LISTENING / IDENTITY UNVERIFIED' : 'DOWN', identityVerified: false, checkedAt: new Date().toISOString()}; })),
      Promise.all(DOMAINS.map(async (d) => ({ domain: d, https: await head(`https://${d}/`) }))),
      probeBridges(),
    ]);
    cache = {
      at: Date.now(),
      refreshing: false,
      data: {
        identity: 'mission-agent-os',
        node: os.hostname(),
        host: os.hostname(),
        ip: '192.168.0.15',
        generated: new Date().toISOString(),
        services,
        domains,
        bridges: bridgeData.bridges,
        keepalive: readKeepaliveSync(),
      },
    };
  } catch {
    cache.refreshing = false;
  }
  return cache.data;
}

async function state() {
  cache.data.keepalive = readKeepaliveSync() || cache.data.keepalive;
  cache.data.bridges = bridgeCache.data.bridges;
  if (Date.now() - cache.at > 15000 && !cache.refreshing) {
    refreshState().catch(() => {});
  }
  return cache.data;
}

if (process.env.MISSION_OS_NO_BACKGROUND !== '1') {
  setTimeout(() => { refreshBridges().catch(() => {}); refreshState().catch(() => {}); }, 200);
  setInterval(() => { refreshState().catch(() => {}); }, 25000);
}

const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function livePage(s) {
  const brow = (b) => `<tr><td><b>${esc(b.name)}</b></td><td><code>${esc(b.protocol)}</code></td><td class="${b.status === 'UP' ? 'up' : 'down'}">${esc(b.status)}</td><td>${esc(b.version)}</td><td>${esc(b.auth)}</td></tr>`;
  const row = (x) => `<tr><td><b>${esc(x.id)}</b></td><td>:${x.port}</td><td class="${x.listening ? 'up' : 'down'}">${esc(x.status || 'UNVERIFIED')}</td><td>${esc(x.what)}</td><td>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">open</a>` : ''}</td></tr>`;
  const drow = (d) => `<tr><td><b>${esc(d.domain)}</b></td><td class="${d.https >= 200 && d.https < 400 ? 'up' : 'down'}">${d.https || 'NO ANSWER'}</td><td><a href="https://${esc(d.domain)}" target="_blank" rel="noopener">site</a> · <a href="https://dash.cloudflare.com/?to=/:account/${esc(d.domain)}/dns" target="_blank" rel="noopener">Cloudflare DNS</a></td></tr>`;
  const ka = (s.keepalive?.stages || []).map((k) => `<tr><td>${esc(k.stage)}</td><td class="${k.status === 'UP' ? 'up' : 'down'}">${esc(k.status)}</td><td>${esc(k.consecutive_failures)}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mission Control · Live · T5500</title><meta http-equiv="refresh" content="30">
<style>body{margin:0;background:#09090b;color:#e4e4e7;font:15px/1.5 Inter,Segoe UI,sans-serif}main{max-width:1180px;margin:auto;padding:24px}
h1{color:#facc15;margin:0 0 4px}h2{color:#facc15;font-size:17px;margin:28px 0 8px}p.sub{color:#a1a1aa;margin:0}
table{width:100%;border-collapse:collapse;background:#18181b;border:1px solid #27272a;border-radius:10px;overflow:hidden}
td{padding:9px 12px;border-top:1px solid #27272a}a{color:#facc15}.up{color:#4ade80;font-weight:700}.down{color:#f87171;font-weight:700}
nav a{margin-right:16px}code{color:#38bdf8;font-size:13px}</style></head><body><main>
<h1>Mission Control — live</h1><p class="sub">${esc(s.host)} · ${esc(s.ip)} · refreshed ${esc(s.generated)} · auto-refresh 30 s</p>
<nav style="margin-top:12px"><a href="/screens/mission_control_overview/">Overview</a><a href="/screens/mission_control_jarvis_command_console/">JARVIS / OPSIS Console</a><a href="/screens/mission_control_settings_logins/">Agent Logins</a><a href="/">Board</a><a href="http://127.0.0.1:3917/" target="_blank">Paperclip</a><a href="http://127.0.0.1:20128/" target="_blank">OmniRoute</a><a href="http://127.0.0.1:9119/" target="_blank">Hermes</a><a href="/api/bridges">bridges JSON</a><a href="/api/mos-state.json">state JSON</a></nav>
<h2>Bridge installation and verification status</h2><table>${(s.bridges || []).map(brow).join('')}</table>
<h2>Services on this node</h2><table>${s.services.map(row).join('')}</table>
<h2>Public domains (through the Cloudflare tunnel)</h2><table>${s.domains.map(drow).join('')}</table>
<h2>Keepalive watchdog</h2><table>${ka || '<tr><td>status.json not readable</td></tr>'}</table>
</main><script src="/jarvis-bridge-client.js"></script></body></html>`;
}

const SCREENS_DIR = `${ROOT}/mission-os/screens`;
const screens = () => { try { return fs.readdirSync(SCREENS_DIR).filter((d) => fs.existsSync(`${SCREENS_DIR}/${d}/code.html`)); } catch { return []; } };
const nice = (d) => d.replace(/^mission_control_/, '').replace(/_/g, ' ');
const LIVE_BADGE = () => `<div style="position:fixed;left:272px;bottom:10px;z-index:99998;display:flex;gap:8px;font:700 11px Segoe UI,sans-serif"><details style="background:#18181b;color:#e4e4e7;border:1px solid #27272a;border-radius:12px;padding:6px 10px;max-height:70vh;overflow:auto"><summary style="cursor:pointer;color:#facc15">SCREENS (16)</summary>${screens().map((d) => `<div style="padding:2px 0"><a style="color:#e4e4e7;text-decoration:none" href="/screens/${d}/">${nice(d)}</a></div>`).join('')}</details><a href="/screens/mission_control_jarvis_command_console/" style="background:#22d3ee;color:#09090b;padding:6px 10px;border-radius:999px;text-decoration:none;align-self:flex-end">JARVIS CONSOLE →</a><a href="/live" style="background:#facc15;color:#09090b;padding:6px 10px;border-radius:999px;text-decoration:none;align-self:flex-end">LIVE TRUTH →</a></div><script src="/jarvis-bridge-client.js"></script>`;

async function readJsonBody(req) {
  let bytes = 0; const chunks = [];
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 65536) { const error = new Error('Request body too large'); error.status = 413; throw error; }
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { const error = new Error('Invalid JSON object'); error.status = 400; throw error; }
}

http.createServer(async (req, res) => {
  const sec = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
  try {
    const denied = guardRequest(req, PORT);
    if (denied) { res.writeHead(denied, {...sec, 'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:'Local same-origin JSON requests only'})); }
    const u = new URL(req.url, 'http://x');
    if (u.pathname.startsWith('/api/ops/')) {
      const view = u.pathname.slice('/api/ops/'.length);
      let result;
      if (view === 'browser/open' && req.method === 'POST') {
        const body = await readJsonBody(req);
        result = await openBrowser(body.url);
      } else if (req.method === 'GET' && ['board','memory','node','logs','support','hermes','settings','browser','video','youtube','marketing','ecosystem'].includes(view)) {
        result = await readOps(view, {root:ROOT,state,bridges:probeBridges});
      } else { res.writeHead(404, sec); return res.end('not found'); }
      res.writeHead(200, {...sec, 'Content-Type':'application/json', 'Cache-Control':'no-store'});
      return res.end(JSON.stringify(result));
    }
    if (u.pathname === '/jarvis-bridge-client.js') {
      res.writeHead(200, { ...sec, 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(fs.readFileSync(CLIENT_JS, 'utf8'));
    }
    if (u.pathname === '/api/mos-state.json') {
      res.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify(await state(), null, 2));
    }
    if (u.pathname === '/api/bridges') {
      res.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify(await probeBridges(), null, 2));
    }
    if (u.pathname === '/api/jarvis/dispatch' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const result = await dispatchJarvis(body);
      res.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify(result, null, 2));
    }
    if (u.pathname === '/live') {
      res.writeHead(200, { ...sec, 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(livePage(await state()));
    }
    const m = u.pathname.match(/^\/screens\/([a-z0-9_.]+)\/?$/i);
    if (m && screens().includes(m[1])) {
      const html = fs.readFileSync(`${SCREENS_DIR}/${m[1]}/code.html`, 'utf8').replace(/<\/body>/i, `${LIVE_BADGE()}</body>`);
      res.writeHead(200, { ...sec, 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }
    // Joshua 2026-10-16: the JARVIS command console is the Mission Control front door.
    if (u.pathname === '/' || u.pathname === '/index.html') {
      const html = fs.readFileSync(`${SCREENS_DIR}/mission_control_jarvis_command_console/code.html`, 'utf8').replace(/<\/body>/i, '<script src="/jarvis-bridge-client.js"></script></body>');
      res.writeHead(200, { ...sec, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    if (u.pathname === '/board' || u.pathname === '/board/') {
      const html = fs.readFileSync(BOARD, 'utf8').replace(/<\/body>/i, `${LIVE_BADGE()}</body>`);
      res.writeHead(200, { ...sec, 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }
    res.writeHead(404, sec); res.end('not found');
  } catch (e) { res.writeHead(e.status || 500, {...sec, 'Content-Type':'application/json'}); res.end(JSON.stringify({ok:false,error:e.status ? e.message : 'Internal error'})); }
}).listen(PORT, '127.0.0.1', () => console.log(`mission-agent-os on http://127.0.0.1:${PORT}`));
