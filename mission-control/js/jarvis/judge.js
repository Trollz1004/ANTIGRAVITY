/**
 * Judge Lanes panel (Phase D, unit 1) — the proposal feed with two verdict
 * columns (claude/codex), the live disagreement flag, a small form to open a
 * new code.review (server computes the real `git diff --stat`), and the
 * founder's EXECUTE control, which is the exact same approve action the
 * Inbox tab already uses (`performAction` from ./inbox.js) — no separate
 * founder-token flow is invented here. The per-lane judge token (used only
 * to post that lane's own verdict) lives in `sessionStorage` for this tab
 * only, exactly like the founder token, and is never sent anywhere but this
 * dashboard's own API.
 */
import { getToken as getFounderToken, performAction as inboxPerformAction } from './inbox.js';

const LANE_TOKEN_KEY = 'jarvis_judge_lane_token';
const LANE_NAME_KEY = 'jarvis_judge_lane_name';

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getLaneToken() { try { return sessionStorage.getItem(LANE_TOKEN_KEY) || ''; } catch { return ''; } }
function setLaneToken(v) { try { sessionStorage.setItem(LANE_TOKEN_KEY, v); } catch { /* private window: tab still works this session */ } }
function getLaneName() { try { return sessionStorage.getItem(LANE_NAME_KEY) || 'claude'; } catch { return 'claude'; } }
function setLaneName(v) { try { sessionStorage.setItem(LANE_NAME_KEY, v); } catch { /* best effort */ } }

async function fetchJson(url, opts, fetchImpl = fetch) {
  const r = await fetchImpl(url, { headers: { accept: 'application/json' }, ...opts });
  const j = await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, body: j };
}

function verdictPill(v) {
  const state = (v && v.state) || 'pending';
  const cls = state === 'approve' ? 'pass' : state === 'reject' ? 'fail' : '';
  return `<span class="check-pill ${cls}">${escapeHtml(state)}${v && v.reasoning ? ': ' + escapeHtml(v.reasoning) : ''}</span>`;
}

export function renderItem(item) {
  const disagreementHtml = item.disagreement ? '<span class="state-badge REJECTED">DISAGREEMENT</span>' : '';
  const canExecute = item.state === 'APPROVED';
  const execHtml = canExecute
    ? `<button class="btn" data-execute="${escapeHtml(item.id)}">Founder: EXECUTE</button>`
    : '';
  return `
    <div class="inbox-row" data-row="${escapeHtml(item.id)}">
      <div class="inbox-row-head">
        <b>${escapeHtml(item.kind)}</b>
        <span>${escapeHtml(item.repo || '')} ${escapeHtml(item.range || '')}</span>
        <span class="state-badge ${escapeHtml(item.state)}">${escapeHtml(item.state)}</span>
        ${disagreementHtml}
      </div>
      <div class="inbox-row-body">${escapeHtml(item.title || '')}</div>
      <div class="inbox-row-body">${item.diffStat ? `${item.diffStat.files} files, +${item.diffStat.insertions}/-${item.diffStat.deletions}` : ''}</div>
      <div class="judge-columns">
        <div>claude ${verdictPill(item.verdicts && item.verdicts.claude)}</div>
        <div>codex ${verdictPill(item.verdicts && item.verdicts.codex)}</div>
      </div>
      <div class="inbox-row-actions">
        <button class="btn" data-verdict="approve" data-id="${escapeHtml(item.id)}">Post my lane: approve</button>
        <button class="btn" data-verdict="reject" data-id="${escapeHtml(item.id)}">Post my lane: reject</button>
        ${execHtml}
      </div>
    </div>`;
}

export function renderFeed(el, j) {
  const items = (j && j.items) || [];
  el.innerHTML = items.length ? items.map(renderItem).join('') : '<p class="placeholder">No code reviews open.</p>';
}

async function loadFeed(fetchImpl = fetch) {
  const el = document.getElementById('judge-feed');
  if (!el) return;
  try {
    const r = await fetchJson('/api/judge/feed', undefined, fetchImpl);
    if (!r.ok) throw new Error((r.body && r.body.error) || 'HTTP ' + r.status);
    renderFeed(el, r.body);
  } catch (e) {
    el.innerHTML = `<p class="placeholder">Judge feed unavailable: ${escapeHtml(e.message || e)}</p>`;
  }
}

async function createReview(fetchImpl = fetch) {
  const status = document.getElementById('judge-form-status');
  const repo = document.getElementById('judge-repo')?.value || 'antigravity';
  const range = document.getElementById('judge-range')?.value || '';
  const title = document.getElementById('judge-title')?.value || '';
  if (!range) { if (status) status.textContent = 'range is required'; return; }
  const r = await fetchJson('/api/judge/reviews', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ repo, range, title }) }, fetchImpl);
  if (status) status.textContent = r.ok ? 'created' : ((r.body && r.body.error) || 'HTTP ' + r.status);
  await loadFeed(fetchImpl);
}

async function postVerdict(id, verdict, fetchImpl = fetch) {
  const lane = getLaneName();
  const token = getLaneToken();
  const r = await fetchJson(`/api/judge/${encodeURIComponent(id)}/verdict`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-judge-token': token },
    body: JSON.stringify({ lane, verdict }),
  }, fetchImpl);
  return r;
}

function initLaneRow() {
  const laneSelect = document.getElementById('judge-lane-select');
  const tokenInput = document.getElementById('judge-lane-token');
  const save = document.getElementById('judge-lane-save');
  if (laneSelect) laneSelect.value = getLaneName();
  if (tokenInput) tokenInput.value = getLaneToken();
  if (save) save.addEventListener('click', () => {
    setLaneName(laneSelect ? laneSelect.value : 'claude');
    setLaneToken(tokenInput ? tokenInput.value : '');
    const status = document.getElementById('judge-lane-status');
    if (status) status.textContent = 'saved for this tab only';
  });
}

function initActions() {
  const form = document.getElementById('judge-form');
  if (form) form.addEventListener('submit', (ev) => { ev.preventDefault(); createReview(); });
  const feed = document.getElementById('judge-feed');
  if (!feed) return;
  feed.addEventListener('click', async (ev) => {
    const verdictBtn = ev.target.closest('button[data-verdict]');
    if (verdictBtn) {
      verdictBtn.disabled = true;
      const r = await postVerdict(verdictBtn.dataset.id, verdictBtn.dataset.verdict);
      if (!r.ok) alert((r.body && r.body.error) || ('HTTP ' + r.status)); // eslint-disable-line no-alert
      await loadFeed();
      return;
    }
    const execBtn = ev.target.closest('button[data-execute]');
    if (execBtn) {
      execBtn.disabled = true;
      const r = await inboxPerformAction(execBtn.dataset.execute, 'approve');
      if (!r.ok) alert((r.body && r.body.error) || ('HTTP ' + r.status)); // eslint-disable-line no-alert
      await loadFeed();
    }
  });
}

function initJudge() {
  initLaneRow();
  initActions();
  let loaded = false;
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset && tab.dataset.tab === 'judge' && !loaded) { loaded = true; loadFeed(); }
    });
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initJudge);
}

export {
  escapeHtml, getLaneToken, setLaneToken, getLaneName, setLaneName, verdictPill,
  loadFeed, createReview, postVerdict, initJudge, getFounderToken,
};
