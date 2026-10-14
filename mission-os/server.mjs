// Mission Agent OS (JARVIS/OPSIS) — the one Mission Control on the T5500.
// Written by Opus (Claude) in the Antigravity IDE, 2026-10-12.
// Serves the board (oldmissioncontrol.html) at /, a live admin page at /live,
// and a read-only state feed at /api/mos-state.json. Binds 127.0.0.1 only. No secrets leave this process.
import http from 'node:http';
import fs from 'node:fs';
import net from 'node:net';

const ROOT = 'C:/ANTIGRAVITY';
const PORT = 3130;
const BOARD = `${ROOT}/oldmissioncontrol.html`;
const STATUS = `${ROOT}/ops/t5500/status.json`;

export const SERVICES = [
  { id: 'mission-control', port: 3130, what: 'Mission Control (JARVIS/OPSIS board, this page)', url: 'http://127.0.0.1:3130/' },
  { id: 'paperclip', port: 3917, what: 'Paperclip, marketing command layer', url: 'http://127.0.0.1:3917/' },
  { id: 'omniroute', port: 20128, what: 'OmniRoute AI gateway + dashboard', url: 'http://127.0.0.1:20128/' },
  { id: 'hermes', port: 9119, what: 'Hermes desktop dashboard (Nous, the one Hermes on this node)', url: 'http://127.0.0.1:9119/' },
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

let cache = { at: 0, data: null };
async function state() {
  if (Date.now() - cache.at < 15000 && cache.data) return cache.data;
  const services = await Promise.all(SERVICES.map(async (s) => ({ ...s, listening: s.probe ? (await head(s.probe)) === 200 : await tcp(s.port) })));
  const domains = await Promise.all(DOMAINS.map(async (d) => ({ domain: d, https: await head(`https://${d}/`) })));
  let keepalive = null;
  try { keepalive = JSON.parse(fs.readFileSync(STATUS, 'utf8').replace(/^\uFEFF/, '')); } catch {}
  cache = { at: Date.now(), data: { identity: 'mission-agent-os', node: 'T5500-2-XEON-72', host: 't5500-2-xeon-72-ram-3070-8gb-gpu-ram', ip: '192.168.0.15', generated: new Date().toISOString(), services, domains, keepalive } };
  return cache.data;
}

const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function livePage(s) {
  const row = (x) => `<tr><td><b>${esc(x.id)}</b></td><td>:${x.port}</td><td class="${x.listening ? 'up' : 'down'}">${x.listening ? 'UP' : 'DOWN'}</td><td>${esc(x.what)}</td><td>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">open</a>` : ''}</td></tr>`;
  const drow = (d) => `<tr><td><b>${esc(d.domain)}</b></td><td class="${d.https >= 200 && d.https < 400 ? 'up' : 'down'}">${d.https || 'NO ANSWER'}</td><td><a href="https://${esc(d.domain)}" target="_blank" rel="noopener">site</a> · <a href="https://dash.cloudflare.com/?to=/:account/${esc(d.domain)}/dns" target="_blank" rel="noopener">Cloudflare DNS</a></td></tr>`;
  const ka = (s.keepalive?.stages || []).map((k) => `<tr><td>${esc(k.stage)}</td><td class="${k.status === 'UP' ? 'up' : 'down'}">${esc(k.status)}</td><td>${esc(k.consecutive_failures)}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mission Control · Live · T5500</title><meta http-equiv="refresh" content="30">
<style>body{margin:0;background:#09090b;color:#e4e4e7;font:15px/1.5 Inter,Segoe UI,sans-serif}main{max-width:1100px;margin:auto;padding:24px}
h1{color:#facc15;margin:0 0 4px}h2{color:#facc15;font-size:17px;margin:28px 0 8px}p.sub{color:#a1a1aa;margin:0}
table{width:100%;border-collapse:collapse;background:#18181b;border:1px solid #27272a;border-radius:10px;overflow:hidden}
td{padding:9px 12px;border-top:1px solid #27272a}a{color:#facc15}.up{color:#4ade80;font-weight:700}.down{color:#f87171;font-weight:700}
nav a{margin-right:16px}</style></head><body><main>
<h1>Mission Control — live</h1><p class="sub">${esc(s.host)} · ${esc(s.ip)} · refreshed ${esc(s.generated)} · auto-refresh 30 s</p>
<nav style="margin-top:12px"><a href="/">JARVIS/OPSIS board</a><a href="http://127.0.0.1:3917/" target="_blank">Paperclip</a><a href="http://127.0.0.1:20128/" target="_blank">OmniRoute</a><a href="http://127.0.0.1:9119/" target="_blank">Hermes</a><a href="/api/mos-state.json">state JSON</a></nav>
<h2>Services on this node</h2><table>${s.services.map(row).join('')}</table>
<h2>Public domains (through the Cloudflare tunnel)</h2><table>${s.domains.map(drow).join('')}</table>
<h2>Keepalive watchdog</h2><table>${ka || '<tr><td>status.json not readable</td></tr>'}</table>
</main></body></html>`;
}

const SCREENS_DIR = `${ROOT}/mission-os/screens`;
const screens = () => { try { return fs.readdirSync(SCREENS_DIR).filter((d) => fs.existsSync(`${SCREENS_DIR}/${d}/code.html`)); } catch { return []; } };
const nice = (d) => d.replace(/^mission_control_/, '').replace(/_/g, ' ');
const LIVE_BADGE = () => `<div style="position:fixed;right:14px;bottom:14px;z-index:99999;display:flex;gap:8px;font:700 13px Segoe UI,sans-serif"><details style="background:#18181b;color:#e4e4e7;border:1px solid #27272a;border-radius:12px;padding:8px 12px;max-height:70vh;overflow:auto"><summary style="cursor:pointer;color:#facc15">SCREENS</summary>${screens().map((d) => `<div><a style="color:#e4e4e7" href="/screens/${d}/">${nice(d)}</a></div>`).join('')}</details><a href="/live" style="background:#facc15;color:#09090b;padding:8px 14px;border-radius:999px;text-decoration:none;align-self:flex-end">LIVE STATUS →</a></div>`;

http.createServer(async (req, res) => {
  const sec = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
  try {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/api/mos-state.json') {
      res.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify(await state(), null, 2));
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
    if (u.pathname === '/' || u.pathname === '/index.html') {
      const html = fs.readFileSync(BOARD, 'utf8').replace(/<\/body>/i, `${LIVE_BADGE()}</body>`);
      res.writeHead(200, { ...sec, 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }
    res.writeHead(404, sec); res.end('not found');
  } catch (e) { res.writeHead(500, sec); res.end('error'); }
}).listen(PORT, '127.0.0.1', () => console.log(`mission-agent-os on http://127.0.0.1:${PORT}`));
