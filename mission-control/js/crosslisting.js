/**
 * Crosslisting tab — status, embed, and the "open app" link all go through the
 * same-origin server. The browser cannot read the Crosslisting app cross-origin
 * (no CORS headers), and behind a single-port tunnel (VS Code dev tunnel on
 * :9150) it cannot reach :3000 at all — so the status probe, the iframe, and the
 * link all stay same-origin/relative or server-labelled. No keys, no hardcoded
 * LAN/loopback URLs in this file.
 */
const STATUS_URL = '/api/crosslisting/status';
// Same-origin reverse proxy (server.mjs) to the Crosslisting app — keeps the
// iframe working through a tunnel that can only reach JARVIS's own port.
const EMBED_URL = '/api/proxy/crosslisting/';
let embedWired = false;

// The "Open app" link is meant to open Crosslisting directly in a new tab —
// that only works on the LAN, so a tunnel user just sees the LAN URL as a
// label instead of a broken frame. The URL comes from /api/config, never hardcoded.
async function wireEmbed() {
  if (embedWired) return;
  embedWired = true;
  const frame = document.querySelector('#crosslisting-frame');
  if (frame && !frame.getAttribute('src')) frame.src = EMBED_URL;
  const openLink = document.querySelector('#crosslisting-open');
  if (openLink) {
    try {
      const r = await fetch('/api/config', { headers: { accept: 'application/json' } });
      const cfg = await r.json();
      const base = cfg && cfg.crosslisting && cfg.crosslisting.base;
      if (base) { openLink.href = base; openLink.title = 'LAN-only: ' + base; }
    } catch { /* leave the placeholder href — status badge already reports DOWN */ }
  }
}

async function probeCrosslisting() {
  const badge = document.querySelector('#crosslisting-status');
  const detail = document.querySelector('#crosslisting-detail');
  if (!badge) return;
  badge.textContent = 'CHECKING';
  badge.className = 'voice-status voice-status-idle';
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    let j;
    try {
      const r = await fetch(STATUS_URL, { signal: ctrl.signal, headers: { accept: 'application/json' } });
      j = await r.json();
    } finally {
      clearTimeout(timer);
    }
    const up = Boolean(j && j.up);
    badge.textContent = up ? 'UP' : 'DOWN';
    badge.className = 'voice-status ' + (up ? 'voice-status-listening' : 'voice-status-error');
    if (detail) {
      detail.textContent = `${j.state || (up ? 'UP' : 'DOWN')} — ${j.detail || ''}${j.url ? ' (' + j.url + ')' : ''}`
        + (up ? '' : ' Start with: cd dashboard/crosslisting && pnpm dev');
    }
  } catch (e) {
    badge.textContent = 'DOWN';
    badge.className = 'voice-status voice-status-error';
    if (detail) {
      const reason = e.name === 'AbortError' ? 'timeout' : e.message;
      detail.textContent = 'Status unavailable: ' + reason + '. Start with: cd dashboard/crosslisting && pnpm dev';
    }
  }
}

function initCrosslisting() {
  document.querySelector('#crosslisting-refresh')?.addEventListener('click', probeCrosslisting);
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset && tab.dataset.tab === 'crosslisting') {
        wireEmbed();
        setTimeout(probeCrosslisting, 50);
      }
    });
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initCrosslisting);
}

export { probeCrosslisting, STATUS_URL, EMBED_URL, wireEmbed, initCrosslisting };
