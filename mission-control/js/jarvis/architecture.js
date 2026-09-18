/**
 * Architecture panel (Phase E, unit 3) — an iframe of the archify-rendered
 * (or plain-fallback) HTML from GET /api/architecture, same-origin, with a
 * refresh button that cache-busts the server's 5-minute cache.
 */
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function loadArchitecture() {
  const frame = document.getElementById('architecture-frame');
  if (!frame) return;
  frame.src = '/api/architecture?_=' + Date.now();
}

function initArchitecture() {
  document.getElementById('architecture-refresh')?.addEventListener('click', loadArchitecture);
  let loaded = false;
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset && tab.dataset.tab === 'architecture' && !loaded) { loaded = true; loadArchitecture(); }
    });
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initArchitecture);
}

export { escapeHtml, initArchitecture };
