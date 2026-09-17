/**
 * Crosslisting tab — status via the same-origin server.
 * The browser cannot read the Crosslisting app cross-origin (no CORS headers), so
 * the old client probe reported a network failure as "ONLINE" from a root-page
 * fallback. The server probes the real tRPC health endpoint and this module
 * renders its verdict verbatim. No keys, no external hosts.
 */
const STATUS_URL = '/api/crosslisting/status';

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
      if (tab.dataset && tab.dataset.tab === 'crosslisting') setTimeout(probeCrosslisting, 50);
    });
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initCrosslisting);
}

export { probeCrosslisting, STATUS_URL, initCrosslisting };
