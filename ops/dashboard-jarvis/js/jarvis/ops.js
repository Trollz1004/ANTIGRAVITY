/**
 * Ops tab (Phase B) — read-only panels absorbed from the Emergent app
 * (frontend/, the app formerly on its own port): mission ribbon, task commander, git
 * panel, Hermes router, OpenClaw support, runbook viewer, ledger tail.
 * Everything here fetches a relative JARVIS route; no key, no absolute host,
 * no sample data — an empty or errored fetch says so instead of drawing a
 * placeholder row as real.
 */
import { renderMarkdown } from './speckit.js';

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

// ── Git panel ────────────────────────────────────────────────────────────
async function loadGitPanel(fetchImpl = fetch) {
  const el = document.getElementById('ops-git');
  if (!el) return;
  try {
    const j = await fetchJson('/api/git-panel', fetchImpl);
    renderGitPanel(el, j);
  } catch (e) {
    el.innerHTML = `<p class="placeholder">Git panel unavailable: ${escapeHtml(e.message || e)}</p>`;
  }
}

function renderGitPanel(el, j) {
  const repos = j.repos || [];
  if (!repos.length) { el.innerHTML = '<p class="placeholder">No repos configured.</p>'; return; }
  el.innerHTML = repos.map((r) => {
    if (!r.ok) {
      return `<div class="ops-git-repo"><div class="ops-git-head"><b>${escapeHtml(r.id)}</b></div><p class="placeholder">${escapeHtml(r.error || 'unreachable')}</p></div>`;
    }
    const aheadBehind = r.ahead == null && r.behind == null
      ? 'no upstream'
      : `+${r.ahead ?? 0} / -${r.behind ?? 0}`;
    const commitsHtml = (r.commits || []).map((c) => `<div class="ops-git-commit">${escapeHtml(c)}</div>`).join('');
    return `<div class="ops-git-repo">
      <div class="ops-git-head"><b>${escapeHtml(r.id)}</b> <span>${escapeHtml(r.branch)}</span> <span>dirty ${r.dirty}</span> <span>${escapeHtml(aheadBehind)}</span></div>
      ${commitsHtml}
    </div>`;
  }).join('');
}

// ── Hermes router / OpenClaw support (shared renderer) ──────────────────────
function renderServiceStatus(el, j, label) {
  if (!j) { el.innerHTML = `<p class="placeholder">${escapeHtml(label)} status unavailable.</p>`; return; }
  const ok = !!j.reachable;
  const dot = ok ? 'ok' : 'down';
  const detail = j.kind === 'json'
    ? `identity ok · HTTP ${j.status}`
    : j.kind === 'html'
      ? `reachable (HTML) · TCP ${j.tcp ? 'open' : 'closed'}`
      : `unreachable${j.error ? ' · ' + j.error : ''}`;
  el.innerHTML = `<div class="ops-service-head"><span class="dot ${dot}"></span><span>${ok ? 'UP' : 'DOWN'}</span></div><div class="ops-service-detail">${escapeHtml(detail)}</div>`;
}

async function loadHermesStatus(fetchImpl = fetch) {
  const el = document.getElementById('ops-hermes');
  if (!el) return;
  try { renderServiceStatus(el, await fetchJson('/api/hermes-status', fetchImpl), 'Hermes'); }
  catch (e) { el.innerHTML = `<p class="placeholder">Hermes status unavailable: ${escapeHtml(e.message || e)}</p>`; }
}

async function loadOpenClawStatus(fetchImpl = fetch) {
  const el = document.getElementById('ops-openclaw');
  if (!el) return;
  try { renderServiceStatus(el, await fetchJson('/api/openclaw-status', fetchImpl), 'OpenClaw'); }
  catch (e) { el.innerHTML = `<p class="placeholder">OpenClaw status unavailable: ${escapeHtml(e.message || e)}</p>`; }
}

// ── System status (heartbeat) — lives in the existing Mission Control tab ──
async function loadHeartbeat(fetchImpl = fetch) {
  const el = document.getElementById('heartbeat-status');
  if (!el) return;
  try {
    const j = await fetchJson('/api/heartbeat', fetchImpl);
    renderHeartbeat(el, j);
  } catch (e) {
    el.innerHTML = `<p class="placeholder">Heartbeat unavailable: ${escapeHtml(e.message || e)}</p>`;
  }
}

function renderHeartbeat(el, j) {
  if (!j.ok || !j.health) {
    el.innerHTML = `<p class="placeholder">${escapeHtml((j.errors || []).join('; ') || 'No heartbeat data.')}</p>`;
    return;
  }
  const h = j.health;
  const overall = h.overall || 'UNKNOWN';
  const rows = (group) => Object.entries(h[group] || {}).map(([name, s]) => {
    const dot = s.status === 'UP' ? 'ok' : 'down';
    return `<div class="mission-row" style="grid-template-columns:14px 1fr 1fr"><span class="dot ${dot}"></span><span>${escapeHtml(name)}</span><span class="mission-detail">${escapeHtml(s.detail || '')}</span></div>`;
  }).join('');
  const logHtml = (j.logTail || []).map((l) => `<div class="ops-git-commit">${escapeHtml(l)}</div>`).join('');
  el.innerHTML = `
    <div style="margin-bottom:8px"><strong>Overall: </strong><span class="${overall === 'GREEN' ? 'ok' : 'down'}">${escapeHtml(overall)}</span> <span class="ops-service-detail">(${escapeHtml(h.ts || '')})</span></div>
    ${rows('required')}
    ${rows('optional')}
    <div style="margin-top:8px"><strong>Last 10 log lines</strong>${logHtml}</div>`;
}

// ── Runbook viewer (reuses the Spec Kit markdown renderer) ─────────────────
const runbookState = { runbooks: [], selected: null };
function runbookUrl(name) { return '/api/runbooks/' + encodeURIComponent(name); }

async function loadRunbooks(fetchImpl = fetch) {
  const listEl = document.getElementById('ops-runbook-list');
  if (!listEl) return;
  try {
    const j = await fetchJson('/api/runbooks', fetchImpl);
    runbookState.runbooks = j.runbooks || [];
    renderRunbookList(listEl);
  } catch (e) {
    listEl.innerHTML = `<p class="placeholder">Runbooks unavailable: ${escapeHtml(e.message || e)}</p>`;
  }
}

function renderRunbookList(listEl) {
  if (!runbookState.runbooks.length) { listEl.innerHTML = '<p class="placeholder">No files under ops/runbook/.</p>'; return; }
  listEl.innerHTML = '';
  for (const r of runbookState.runbooks) {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = r.name;
    btn.addEventListener('click', () => selectRunbook(r.name));
    listEl.appendChild(btn);
  }
}

async function selectRunbook(name, fetchImpl = fetch) {
  runbookState.selected = name;
  document.querySelectorAll('#ops-runbook-list button').forEach((b) => b.classList.toggle('active', b.textContent === name));
  const body = document.getElementById('ops-runbook-body');
  if (body) body.innerHTML = '<p class="placeholder">Loading…</p>';
  try {
    const j = await fetchJson(runbookUrl(name), fetchImpl);
    if (!j.ok) throw new Error(j.error || 'load failed');
    if (body) body.innerHTML = renderMarkdown(j.markdown);
  } catch (e) {
    if (body) body.innerHTML = `<p class="placeholder">Could not load ${escapeHtml(name)}: ${escapeHtml(e.message || e)}</p>`;
  }
}

// ── Ledger tail ──────────────────────────────────────────────────────────
async function loadLedger(fetchImpl = fetch) {
  const el = document.getElementById('ops-ledger');
  if (!el) return;
  try {
    const j = await fetchJson('/api/ledger', fetchImpl);
    renderLedger(el, j);
  } catch (e) {
    el.innerHTML = `<p class="placeholder">Ledger unavailable: ${escapeHtml(e.message || e)}</p>`;
  }
}

function renderLedger(el, j) {
  if (!j.ok) {
    el.innerHTML = `<p class="placeholder">${escapeHtml(j.error || 'ledger command failed')}</p>`;
    return;
  }
  const lines = j.lines || [];
  el.innerHTML = lines.length
    ? `<pre>${escapeHtml(lines.join('\n'))}</pre>`
    : '<p class="placeholder">No ledger lines.</p>';
}

// ── init ──────────────────────────────────────────────────────────────────
function loadOps() {
  loadMissionRibbon();
  loadTaskCommander();
  loadGitPanel();
  loadHermesStatus();
  loadOpenClawStatus();
  loadRunbooks();
  loadLedger();
}

function initOps() {
  document.getElementById('ops-refresh')?.addEventListener('click', loadOps);
  let opsLoaded = false;
  let heartbeatLoaded = false;
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset && tab.dataset.tab === 'ops' && !opsLoaded) { opsLoaded = true; loadOps(); }
      if (tab.dataset && tab.dataset.tab === 'mission-control' && !heartbeatLoaded) { heartbeatLoaded = true; loadHeartbeat(); }
    });
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initOps);
}

export { escapeHtml, fetchJson, loadMissionRibbon, renderMissionRibbon, loadTaskCommander, renderTaskCommander, loadGitPanel, renderGitPanel, renderServiceStatus, loadHermesStatus, loadOpenClawStatus, loadHeartbeat, renderHeartbeat, loadRunbooks, renderRunbookList, selectRunbook, runbookUrl, runbookState, loadLedger, renderLedger, loadOps, initOps };
