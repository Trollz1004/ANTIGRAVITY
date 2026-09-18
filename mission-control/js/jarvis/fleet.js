/**
 * Fleet rows (Phase D, unit 2) — Hermes/OpenClaw/OpenCode status, current
 * task, queue depth, and token spend, in the Mission Control tab. Every
 * value carries its own SOURCE badge; a `null` token spend renders as
 * "unavailable", never a fabricated number.
 */
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function fetchJson(url, fetchImpl = fetch) {
  const r = await fetchImpl(url, { headers: { accept: 'application/json' } });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error((j && j.error) || 'HTTP ' + r.status);
  return j;
}

export function renderFleetRow(row) {
  const dot = row.status === 'UP' ? 'ok' : row.status === 'NOT CONFIGURED' ? '' : 'down';
  const spend = row.tokenSpendToday == null ? 'unavailable' : String(row.tokenSpendToday);
  return `<div class="mission-row" style="grid-template-columns:14px 1fr 70px 1fr 1fr 1fr">
    <span class="dot ${dot}"></span>
    <span>${escapeHtml(row.lane)}</span>
    <span>${escapeHtml(row.status)}</span>
    <span class="mission-detail">${escapeHtml(row.currentTask || '(no did: line)')}</span>
    <span class="mission-detail">queue ${row.queueDepth}</span>
    <span class="mission-detail">spend ${escapeHtml(spend)} <span class="check-pill">${escapeHtml(row.source || 'unavailable')}</span></span>
  </div>`;
}

export function renderFleet(el, j) {
  const rows = (j && j.rows) || [];
  el.innerHTML = rows.length ? rows.map(renderFleetRow).join('') : '<p class="placeholder">No fleet rows.</p>';
}

export async function loadFleet(fetchImpl = fetch) {
  const el = document.getElementById('fleet-panel');
  if (!el) return;
  try {
    const j = await fetchJson('/api/fleet', fetchImpl);
    renderFleet(el, j);
  } catch (e) {
    el.innerHTML = `<p class="placeholder">Fleet unavailable: ${escapeHtml(e.message || e)}</p>`;
  }
}

function initFleet() {
  let loaded = false;
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset && tab.dataset.tab === 'mission-control' && !loaded) { loaded = true; loadFleet(); }
    });
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initFleet);
}

export { escapeHtml, fetchJson, initFleet };
