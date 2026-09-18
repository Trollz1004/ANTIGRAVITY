/**
 * Approval Inbox panel (Phase C) — reads GET /api/inbox (proposals + judge
 * items + health triggers + the sale-pending row) and drives
 * approve/reject/snooze on POST /api/inbox/:id/:action. The founder token is
 * held only in `sessionStorage` for this tab — no other browser storage, no
 * outbound destination but this dashboard's own API, never logged. Also
 * drives the header bell
 * count, browser notifications, and the top alerts strip used by other tabs.
 */
const TOKEN_KEY = 'jarvis_founder_token';
// Only these sources are backed by the proposal store and can actually be
// acted on; trigger/health/sale rows are shown read-only rather than
// offering a button that would just 404.
const ACTIONABLE_SOURCES = new Set(['social', 'judge']);

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}
function setToken(v) {
  try { sessionStorage.setItem(TOKEN_KEY, v); } catch { /* private-window storage can throw; the tab still works this session */ }
}

async function fetchJson(url, opts, fetchImpl = fetch) {
  const r = await fetchImpl(url, { headers: { accept: 'application/json' }, ...opts });
  const j = await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, body: j };
}

function renderChecks(checks) {
  if (!checks) return '';
  const c = checks.compliance; const s = checks.copyScore;
  const parts = [];
  if (c) parts.push(`<span class="check-pill ${c.pass ? 'pass' : 'fail'}">compliance: ${c.pass ? 'pass' : 'fail'}</span>`);
  if (s && typeof s.score === 'number') parts.push(`<span class="check-pill ${s.score === 5 ? 'pass' : 'fail'}">copy ${s.score}/5</span>`);
  return parts.join(' ');
}

function renderItem(item) {
  const actionable = ACTIONABLE_SOURCES.has(item.source) && item.state === 'PROPOSED';
  const actions = actionable
    ? `<div class="inbox-row-actions">
        <button class="btn" data-act="approve" data-id="${escapeHtml(item.id)}">Approve</button>
        <button class="btn" data-act="reject" data-id="${escapeHtml(item.id)}">Reject</button>
        <button class="btn" data-act="snooze" data-id="${escapeHtml(item.id)}">Snooze</button>
      </div>`
    : '';
  return `
    <div class="inbox-row" data-row="${escapeHtml(item.id)}">
      <div class="inbox-row-head">
        <b>${escapeHtml(item.source)}</b>
        <span>${escapeHtml(item.kind || '')}</span>
        ${item.brand ? `<span>${escapeHtml(item.brand)}</span>` : ''}
        ${item.platform ? `<span>${escapeHtml(item.platform)}</span>` : ''}
        <span class="state-badge ${escapeHtml(item.state)}">${escapeHtml(item.state)}</span>
      </div>
      <div class="inbox-row-body">${escapeHtml(item.title || '')}</div>
      <div class="inbox-row-body">${renderChecks(item.checks)}</div>
      ${actions}
    </div>`;
}

function renderInbox(el, j) {
  const items = (j && j.items) || [];
  el.innerHTML = items.length ? items.map(renderItem).join('') : '<p class="placeholder">Nothing open.</p>';
}

function renderBell(count) {
  const badge = document.getElementById('jarvis-bell-count');
  if (!badge) return;
  if (count > 0) { badge.textContent = String(count); badge.hidden = false; }
  else { badge.hidden = true; }
}

function renderAlertsStrip(j) {
  const strip = document.getElementById('jarvis-alerts-strip');
  if (!strip) return;
  const red = (j.items || []).find((i) => i.source === 'health');
  const trigger = (j.items || []).find((i) => i.source === 'trigger');
  if (red) { strip.hidden = false; strip.textContent = 'RED — ' + (red.title || 'heartbeat unhealthy'); return; }
  if (trigger) { strip.hidden = false; strip.textContent = 'Trigger open — ' + (trigger.title || trigger.id); return; }
  strip.hidden = true; strip.textContent = '';
}

let lastUnread = 0;
function maybeNotify(j) {
  if (typeof Notification === 'undefined') return;
  const unread = j.unread || 0;
  if (unread > lastUnread && Notification.permission === 'granted') {
    try { new Notification('JARVIS inbox', { body: unread + ' item(s) need attention' }); } catch { /* best-effort only */ }
  }
  lastUnread = unread;
}

async function loadInbox(fetchImpl = fetch) {
  const el = document.getElementById('inbox-list');
  try {
    const r = await fetchJson('/api/inbox', undefined, fetchImpl);
    if (!r.ok) throw new Error((r.body && r.body.error) || 'HTTP ' + r.status);
    if (el) renderInbox(el, r.body);
    renderBell(r.body.unread || 0);
    renderAlertsStrip(r.body);
    maybeNotify(r.body);
    return r.body;
  } catch (e) {
    if (el) el.innerHTML = `<p class="placeholder">Inbox unavailable: ${escapeHtml(e.message || e)}</p>`;
    return null;
  }
}

async function performAction(id, action, fetchImpl = fetch) {
  const token = getToken();
  const r = await fetchJson(`/api/inbox/${encodeURIComponent(id)}/${action}`, {
    method: 'POST', headers: { 'x-founder-token': token },
  }, fetchImpl);
  return r;
}

function initTokenRow() {
  const input = document.getElementById('inbox-token');
  const save = document.getElementById('inbox-token-save');
  const status = document.getElementById('inbox-token-status');
  if (input) input.value = getToken();
  if (save) save.addEventListener('click', () => {
    setToken(input ? input.value : '');
    if (status) status.textContent = 'saved for this tab only';
  });
}

function initActions() {
  const list = document.getElementById('inbox-list');
  if (!list) return;
  list.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button[data-act]');
    if (!btn) return;
    const { act, id } = btn.dataset;
    btn.disabled = true;
    const r = await performAction(id, act);
    if (!r.ok) {
      const status = document.getElementById('inbox-token-status');
      if (status) status.textContent = (r.body && r.body.error) || ('HTTP ' + r.status);
    }
    await loadInbox();
  });
}

function initNotificationPermission() {
  const bell = document.getElementById('jarvis-bell');
  if (!bell || typeof Notification === 'undefined') return;
  bell.addEventListener('click', () => {
    if (Notification.permission === 'default') Notification.requestPermission();
  });
}

function initInbox() {
  initTokenRow();
  initActions();
  initNotificationPermission();
  loadInbox();
  let inboxLoaded = false;
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset && tab.dataset.tab === 'inbox' && !inboxLoaded) { inboxLoaded = true; loadInbox(); }
    });
  });
  // Bell/alerts strip need fresh data regardless of which tab is open.
  setInterval(loadInbox, 60000);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initInbox);
}

export {
  escapeHtml, getToken, setToken, fetchJson, renderChecks, renderItem, renderInbox,
  renderBell, renderAlertsStrip, maybeNotify, loadInbox, performAction, initInbox, TOKEN_KEY,
};
