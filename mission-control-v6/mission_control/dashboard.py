"""Single-file ops dashboard (no build step) served by Mission Control."""

from __future__ import annotations

from html import escape

from . import __version__
from .config import Config

PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITLE__</title>
<style>
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: #070b14; color: #dbe4f3;
       font: 14px/1.5 ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace; }
header { padding: 14px 22px; display: flex; align-items: center; gap: 14px;
         border-bottom: 1px solid #1e2a44; flex-wrap: wrap; }
header h1 { font-size: 17px; margin: 0; letter-spacing: 2px; color: #7cd4fd; }
#banner { font-size: 12px; padding: 3px 10px; border-radius: 20px; font-weight: 700; }
#banner.ok { background: #052e16; color: #4ade80; border: 1px solid #14532d; }
#banner.bad { background: #450a0a; color: #fca5a5; border: 1px solid #7f1d1d; }
nav { display: flex; gap: 8px; padding: 10px 22px; flex-wrap: wrap; align-items: center;
      border-bottom: 1px solid #1e2a44; background: #0a1020; }
nav .lbl { color: #8296b8; font-size: 11px; letter-spacing: 1px; margin-right: 4px; }
nav a { color: #93c5fd; text-decoration: none; font-size: 12px; padding: 4px 10px;
        border: 1px solid #1e3a5f; border-radius: 6px; background: #0d1526; }
nav a:hover { border-color: #3b82f6; color: #bfdbfe; }
main { padding: 16px 22px 40px; }
h2 { font-size: 12px; color: #8296b8; letter-spacing: 2px; margin: 22px 0 10px; }
.group-name { font-size: 12px; color: #5b7297; letter-spacing: 1.5px; margin: 18px 0 8px;
              text-transform: uppercase; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.card { background: #0d1526; border: 1px solid #1e2a44; border-radius: 10px; padding: 12px 14px; }
.card.down { border-color: #991b1b; box-shadow: 0 0 12px #7f1d1d44; }
.card.degraded { border-color: #92610e; }
.card .top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.card .name { font-weight: 700; color: #f1f5f9; }
.card .target { font-size: 11px; color: #64748b; word-break: break-all; }
.pill { font-size: 10px; padding: 2px 8px; border-radius: 12px; font-weight: 700; white-space: nowrap; }
.pill.up { background: #052e16; color: #4ade80; }
.pill.degraded { background: #451a03; color: #fbbf24; }
.pill.down { background: #450a0a; color: #f87171; animation: blink 1.2s infinite; }
.pill.fixing { background: #1e3a5f; color: #93c5fd; }
.pill.unknown, .pill.standby { background: #1c2536; color: #94a3b8; }
@keyframes blink { 50% { opacity: .55; } }
.meta { display: flex; gap: 12px; font-size: 11px; color: #7c8ba5; margin: 8px 0; flex-wrap: wrap; }
.detail { font-size: 11px; color: #94a3b8; min-height: 16px; word-break: break-word; }
.detail.bad { color: #fca5a5; }
.actions { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
button { cursor: pointer; border-radius: 6px; border: 1px solid #274067; font-size: 11px;
         padding: 5px 12px; background: #122036; color: #93c5fd; font-family: inherit; }
button:hover { border-color: #3b82f6; }
button.fix { background: #052e16; color: #4ade80; border-color: #14532d; font-weight: 700; }
button.fix:hover { background: #064e3b; }
button:disabled { opacity: .45; cursor: not-allowed; }
.alert { border: 1px solid #7f1d1d; background: #1f0d12; border-radius: 10px;
         padding: 12px 14px; margin-bottom: 10px; }
.alert pre { background: #0d0810; border-radius: 6px; padding: 10px; overflow: auto;
             font-size: 11px; color: #fecaca; border: 1px solid #4c1d1d; max-height: 320px; }
.alert .row { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.alert .title { font-weight: 700; color: #fca5a5; }
footer { padding: 14px 22px; color: #475569; font-size: 11px; border-top: 1px solid #1e2a44; }
a.link { color: #60a5fa; font-size: 11px; text-decoration: none; }
a.link:hover { text-decoration: underline; }
#toast { position: fixed; right: 18px; bottom: 18px; max-width: 520px; background: #0d1526;
         border: 1px solid #274067; border-radius: 10px; padding: 14px; display: none; z-index: 10; }
#toast pre { max-height: 240px; overflow: auto; font-size: 11px; color: #a7f3d0; white-space: pre-wrap; }
</style></head>
<body>
<header>
  <h1>__TITLE__</h1>
  <span id="banner" class="ok">CONNECTING…</span>
  <span id="clock" style="color:#475569;font-size:11px"></span>
</header>
<nav id="omni"><span class="lbl">OMNI ROUTE ➜</span></nav>
<main>
  <h2>ACTIVE ALERTS</h2>
  <div id="alerts"><span style="color:#334155">no active alerts</span></div>
  <h2>SERVICES</h2>
  <div id="services"></div>
</main>
<footer>Mission Control v__VERSION__ · checks recorded in SQLite · FIX runs allow-listed playbooks only · <span id="foot"></span></footer>
<div id="toast"></div>
<script>
const $ = (id) => document.getElementById(id);
let BUSY = {};

function toast(title, body) {
  const t = $('toast');
  t.innerHTML = '<b>' + esc(title) + '</b><pre></pre><button onclick="this.parentNode.style.display=\'none\'">close</button>';
  t.querySelector('pre').textContent = body || '';
  t.style.display = 'block';
}
function esc(s) { const d = document.createElement('div'); d.textContent = String(s ?? ''); return d.innerHTML; }
function ago(ts) {
  if (!ts) return 'never';
  const s = Math.max(0, (Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return Math.floor(s) + 's ago';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  return Math.floor(s / 3600) + 'h ago';
}

async function loadLinks() {
  try {
    const data = await (await fetch('/api/links')).json();
    const nav = $('omni');
    for (const link of data.links) {
      const a = document.createElement('a');
      a.href = link.url; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = link.label;
      nav.appendChild(a);
    }
  } catch (e) { /* links stay empty */ }
}

function statePill(svc) {
  if (!svc.expected && svc.state !== 'up') return '<span class="pill standby">STANDBY</span>';
  return '<span class="pill ' + esc(svc.state) + '">' + esc(svc.state.toUpperCase()) + '</span>';
}

function renderServices(payload) {
  const counts = payload.counts;
  const banner = $('banner');
  if (counts.down > 0) {
    banner.className = 'bad'; banner.textContent = '⚠ ' + counts.down + ' DOWN';
  } else if (counts.degraded > 0) {
    banner.className = 'bad'; banner.textContent = counts.degraded + ' DEGRADED';
  } else {
    banner.className = 'ok'; banner.textContent = 'ALL SYSTEMS GO';
  }
  $('clock').textContent = payload.now + ' · alerts: ' + payload.active_alerts;
  $('foot').textContent = payload.base_url;

  const groups = {};
  for (const svc of payload.services) { (groups[svc.group] = groups[svc.group] || []).push(svc); }
  const host = $('services'); host.innerHTML = '';
  for (const [group, svcs] of Object.entries(groups)) {
    const g = document.createElement('div');
    g.innerHTML = '<div class="group-name">' + esc(group) + '</div>';
    const grid = document.createElement('div'); grid.className = 'cards';
    for (const svc of svcs) {
      const bad = (svc.state === 'down' || svc.state === 'fixing') && svc.expected;
      const card = document.createElement('div');
      card.className = 'card' + (bad ? ' down' : svc.state === 'degraded' ? ' degraded' : '');
      card.id = 'service-' + svc.id;
      const latency = svc.latency_ms == null ? '—' : svc.latency_ms + ' ms';
      const link = svc.link_url ? ' <a class="link" target="_blank" rel="noopener" href="' + esc(svc.link_url) + '">open ↗</a>' : '';
      card.innerHTML =
        '<div class="top"><span class="name">' + esc(svc.name) + '</span>' + statePill(svc) + '</div>' +
        '<div class="target">' + esc(svc.kind) + ' probe · ' + esc(svc.expected ? 'expected up' : 'standby') + '</div>' +
        '<div class="meta"><span>⏱ ' + latency + '</span><span>↻ ' + ago(svc.checked_at) + '</span>' +
        (svc.down_since ? '<span style="color:#f87171">down since ' + ago(svc.down_since) + '</span>' : '') + '</div>' +
        '<div class="detail' + (bad ? ' bad' : '') + '">' + esc(svc.detail) + '</div>' +
        '<div class="actions">' +
        (svc.playbook ? '<button class="fix" data-fix="' + esc(svc.id) + '"' + (svc.fixing ? ' disabled' : '') + '>⚡ ' + (svc.fixing ? 'FIXING…' : 'FIX IT') + '</button>' : '') +
        '<button data-check="' + esc(svc.id) + '">check now</button>' + link +
        '</div>' +
        (svc.last_fix ? '<div class="meta">last fix: ' + esc(svc.last_fix.ok ? 'ok' : 'failed') + ' · ' + ago(svc.last_fix.ts) + '</div>' : '');
      grid.appendChild(card);
    }
    g.appendChild(grid);
    host.appendChild(g);
  }
  host.querySelectorAll('[data-fix]').forEach(b => b.onclick = () => runFix(b.dataset.fix));
  host.querySelectorAll('[data-check]').forEach(b => b.onclick = () => checkNow(b.dataset.check));
}

function renderAlerts(alerts) {
  const host = $('alerts');
  if (!alerts.length) { host.innerHTML = '<span style="color:#334155">no active alerts</span>'; return; }
  host.innerHTML = '';
  for (const a of alerts) {
    const div = document.createElement('div');
    div.className = 'alert';
    div.innerHTML = '<div class="row"><span class="title">🔴 ' + esc(a.service_id) + ' — since ' + esc(a.opened_at) + '</span>' +
      '<span><button class="fix" data-fix="' + esc(a.service_id) + '">⚡ RUN EASY BUTTON</button> ' +
      '<button data-ack="' + a.id + '">ack</button></span></div>' +
      '<pre>' + esc(a.fix_hint || a.detail) + '</pre>';
    host.appendChild(div);
  }
  host.querySelectorAll('[data-fix]').forEach(b => b.onclick = () => runFix(b.dataset.fix));
  host.querySelectorAll('[data-ack]').forEach(b => b.onclick = async () => {
    await fetch('/api/alerts/' + b.dataset.ack + '/ack', { method: 'POST' });
    refresh();
  });
}

async function runFix(id) {
  if (BUSY[id]) return;
  if (!confirm('Run the allow-listed fix playbook for "' + id + '"?')) return;
  BUSY[id] = true; refresh();
  try {
    const res = await fetch('/api/services/' + encodeURIComponent(id) + '/fix', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      toast('FIX ' + (data.fix.ok ? 'SUCCEEDED' : 'FAILED') + ' — ' + id + ' → ' + data.state,
            (data.fix.output || data.fix.detail || '') + '\\n\\nre-check: ' + (data.result.detail || ''));
    } else {
      toast('FIX REFUSED — ' + id, data.detail || res.status);
    }
  } catch (e) { toast('FIX ERROR — ' + id, String(e)); }
  BUSY[id] = false; refresh();
}

async function checkNow(id) {
  await fetch('/api/services/' + encodeURIComponent(id) + '/check', { method: 'POST' });
  refresh();
}

async function refresh() {
  try {
    const payload = await (await fetch('/api/status')).json();
    renderServices(payload);
    const alerts = await (await fetch('/api/alerts?active=true')).json();
    renderAlerts(alerts.alerts);
  } catch (e) {
    const b = $('banner'); b.className = 'bad'; b.textContent = 'SERVER UNREACHABLE';
  }
}

loadLinks();
refresh();
setInterval(refresh, 5000);
</script>
</body>
</html>
"""


def render_dashboard(config: Config) -> str:
    title = escape(f"ANTIGRAVITY — MISSION CONTROL v{__version__}")
    return PAGE.replace("__TITLE__", title).replace("__VERSION__", escape(__version__))
