/**
 * Crosslisting tab — status probe + embed refresh.
 * Talks only to the local Crosslisting app (default :3000). No keys, no external hosts.
 */
const CROSSLISTING_BASE = 'http://127.0.0.1:3000';

async function probeCrosslisting() {
  const badge = document.getElementById('crosslisting-status');
  const detail = document.getElementById('crosslisting-detail');
  if (!badge) return;
  badge.textContent = 'CHECKING';
  badge.className = 'voice-status voice-status-idle';
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    let ok = false;
    let msg = '';
    try {
      const input = encodeURIComponent(JSON.stringify({ json: { timestamp: Date.now() } }));
      const r = await fetch(CROSSLISTING_BASE + '/api/trpc/system.health?input=' + input, {
        signal: ctrl.signal,
        headers: { Accept: 'application/json' },
      });
      if (r.ok) {
        ok = true;
        msg = 'Service healthy on :3000.';
      }
    } catch {
      // fall through to root probe
    }
    if (!ok) {
      const r2 = await fetch(CROSSLISTING_BASE + '/', { signal: ctrl.signal, method: 'GET' });
      ok = r2.ok;
      msg = ok ? 'App responding on :3000.' : 'No response from :3000 (HTTP ' + r2.status + ').';
    }
    clearTimeout(timer);
    badge.textContent = ok ? 'ONLINE' : 'OFFLINE';
    badge.className = 'voice-status ' + (ok ? 'voice-status-listening' : 'voice-status-error');
    if (detail) {
      detail.textContent = msg + (ok ? '' : ' Start with: cd dashboard/crosslisting && pnpm dev');
    }
  } catch (e) {
    badge.textContent = 'OFFLINE';
    badge.className = 'voice-status voice-status-error';
    if (detail) {
      const reason = e.name === 'AbortError' ? 'timeout' : e.message;
      detail.textContent = 'Offline: ' + reason + '. Start with: cd dashboard/crosslisting && pnpm dev';
    }
  }
}

function initCrosslisting() {
  document.getElementById('crosslisting-refresh')?.addEventListener('click', probeCrosslisting);
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset && tab.dataset.tab === 'crosslisting') setTimeout(probeCrosslisting, 50);
    });
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initCrosslisting);
}

export { probeCrosslisting, CROSSLISTING_BASE, initCrosslisting };
