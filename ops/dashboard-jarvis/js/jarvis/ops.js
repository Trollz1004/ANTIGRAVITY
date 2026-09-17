/**
 * Ops tab (Phase B) — read-only panels absorbed from the Emergent app
 * (frontend/, the app formerly on its own port): mission ribbon, task commander, git
 * panel, Hermes router, OpenClaw support, runbook viewer, ledger tail.
 * Everything here fetches a relative JARVIS route; no key, no absolute host,
 * no sample data — an empty or errored fetch says so instead of drawing a
 * placeholder row as real.
 */

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function fetchJson(url, fetchImpl = fetch) {
  const r = await fetchImpl(url, { headers: { accept: 'application/json' } });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error((j && j.error) || 'HTTP ' + r.status);
  return j;
}

// ── Mission ribbon ───────────────────────────────────────────────────────
async function loadMissionRibbon(fetchImpl = fetch) {
  const el = document.getElementById('ops-ribbon');
  if (!el) return;
  try {
    const j = await fetchJson('/api/mission-ribbon', fetchImpl);
    renderMissionRibbon(el, j);
  } catch (e) {
    el.innerHTML = `<p class="placeholder">Mission ribbon unavailable: ${escapeHtml(e.message || e)}</p>`;
  }
}

function renderMissionRibbon(el, j) {
  const rulings = j.rulings || [];
  const recentNext = j.recentNext || [];
  const rulingsHtml = rulings.length
    ? rulings.slice(-6).map((r) => `<div class="ops-ribbon-ruling">${escapeHtml(r)}</div>`).join('')
    : '<p class="placeholder">No ruling headings found in CLAUDE.md.</p>';
  const nextHtml = recentNext.length
    ? recentNext.map((n) => `<div class="ops-ribbon-next"><b>${escapeHtml(n.heading)}</b> — ${escapeHtml(n.next || '(no next: line)')}</div>`).join('')
    : '<p class="placeholder">No journal entries found.</p>';
  el.innerHTML = `<div><strong>Rulings</strong>${rulingsHtml}</div><div>${nextHtml}</div>`;
  if (j.errors && j.errors.length) {
    el.innerHTML += `<p class="placeholder">${escapeHtml(j.errors.join('; '))}</p>`;
  }
}

// ── Task commander ───────────────────────────────────────────────────────
async function loadTaskCommander(fetchImpl = fetch) {
  const el = document.getElementById('ops-tasks');
  if (!el) return;
  try {
    const j = await fetchJson('/api/task-commander', fetchImpl);
    renderTaskCommander(el, j);
  } catch (e) {
    el.innerHTML = `<p class="placeholder">Task commander unavailable: ${escapeHtml(e.message || e)}</p>`;
  }
}

function renderTaskCommander(el, j) {
  const features = j.features || [];
  if (!features.length) { el.innerHTML = '<p class="placeholder">No specs/*/tasks.md found.</p>'; return; }
  el.innerHTML = features.map((f) => {
    const uncheckedHtml = f.unchecked.length
      ? `<ul>${f.unchecked.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`
      : '<p class="placeholder">All tasks checked.</p>';
    return `<div class="ops-task-feature">
      <div class="ops-task-head"><span>${escapeHtml(f.id)}</span><span>${f.done}/${f.total}</span></div>
      ${uncheckedHtml}
    </div>`;
  }).join('');
}

// ── init ──────────────────────────────────────────────────────────────────
function loadOps() {
  loadMissionRibbon();
  loadTaskCommander();
}

function initOps() {
  document.getElementById('ops-refresh')?.addEventListener('click', loadOps);
  let loaded = false;
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset && tab.dataset.tab === 'ops' && !loaded) { loaded = true; loadOps(); }
    });
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initOps);
}

export { escapeHtml, fetchJson, loadMissionRibbon, renderMissionRibbon, loadTaskCommander, renderTaskCommander, loadOps, initOps };
