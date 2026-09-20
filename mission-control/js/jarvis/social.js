/**
 * Social panel (Phase C) — compose a post for "DREAM Online" or "AI
 * Solutions" only, see the compliance + copy-score checks, and submit it as
 * a Proposal. Nothing here ever posts anywhere: POST /api/social/proposals
 * only ever creates a PROPOSED row; approval happens in the Inbox panel.
 * Relative URLs only, no key ever touches this file.
 */
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function fetchJson(url, opts, fetchImpl = fetch) {
  const r = await fetchImpl(url, { headers: { accept: 'application/json' }, ...opts });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw Object.assign(new Error((j && j.error) || 'HTTP ' + r.status), { body: j, status: r.status });
  return j;
}

async function loadPlatforms(fetchImpl = fetch) {
  const select = document.getElementById('social-platform');
  if (!select) return;
  try {
    const j = await fetchJson('/api/social/platforms', undefined, fetchImpl);
    renderPlatformOptions(select, j.platforms || []);
  } catch (e) {
    select.innerHTML = `<option value="">unavailable: ${escapeHtml(e.message || e)}</option>`;
  }
}

function renderPlatformOptions(select, platforms) {
  if (!platforms.length) { select.innerHTML = '<option value="">no platforms configured</option>'; return; }
  select.innerHTML = platforms.map((p) =>
    `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}${p.configured ? '' : ' (not configured)'}</option>`
  ).join('');
}

function renderCheckResult(el, checks) {
  if (!el) return;
  if (!checks) { el.innerHTML = ''; return; }
  const c = checks.compliance || {};
  const s = checks.copyScore || {};
  const compliancePill = c.pass
    ? '<span class="check-pill pass">compliance: pass</span>'
    : `<span class="check-pill fail">compliance: fail — ${escapeHtml(c.matched || 'rule ' + c.ruleIndex)}</span>`;
  const scorePill = typeof s.score === 'number'
    ? `<span class="check-pill ${s.score === 5 ? 'pass' : 'fail'}">copy score: ${s.score}/5${(s.tripped || []).length ? ' — ' + escapeHtml(s.tripped.map((t) => t.rule).slice(0, 2).join(', ')) : ''}</span>`
    : '';
  el.innerHTML = compliancePill + scorePill;
}

function renderProposals(el, proposals) {
  if (!el) return;
  if (!proposals.length) { el.innerHTML = '<p class="placeholder">No proposals yet.</p>'; return; }
  el.innerHTML = proposals.map((p) => `
    <div class="proposal-row">
      <div class="proposal-row-head">
        <b>${escapeHtml(p.platform)}</b>
        <span>${escapeHtml(p.brand)}</span>
        <span class="state-badge ${escapeHtml(p.state)}">${escapeHtml(p.state)}</span>
      </div>
      <div class="inbox-row-body">${escapeHtml(p.title)}</div>
    </div>
  `).join('');
}

async function loadProposals(fetchImpl = fetch) {
  const el = document.getElementById('social-proposals');
  if (!el) return;
  try {
    const j = await fetchJson('/api/social/proposals', undefined, fetchImpl);
    renderProposals(el, j.proposals || []);
  } catch (e) {
    el.innerHTML = `<p class="placeholder">Proposals unavailable: ${escapeHtml(e.message || e)}</p>`;
  }
}

async function submitProposal(payload, fetchImpl = fetch) {
  return fetchJson('/api/social/proposals', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
  }, fetchImpl);
}

// Drafts one post in Joshua's Fable voice (youandinotai brand only). Never
// creates a proposal — the caller still has to review + submit it.
async function draftWithFable(payload, fetchImpl = fetch) {
  return fetchJson('/api/social/draft', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
  }, fetchImpl);
}

function initSocial() {
  loadPlatforms();
  loadProposals();
  const form = document.getElementById('social-form');
  const status = document.getElementById('social-form-status');
  const checkResult = document.getElementById('social-check-result');
  if (!form) return;
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (status) status.textContent = 'checking…';
    const payload = {
      brand: document.getElementById('social-brand').value,
      platform: document.getElementById('social-platform').value,
      title: document.getElementById('social-title').value,
      body: document.getElementById('social-body').value,
      scheduledFor: document.getElementById('social-scheduled').value || null,
    };
    try {
      const j = await submitProposal(payload);
      renderCheckResult(checkResult, j.proposal && j.proposal.checks);
      if (status) status.textContent = 'proposed — see it in the Inbox tab';
      loadProposals();
    } catch (e) {
      if (status) status.textContent = 'error: ' + (e.message || e);
      if (e.body && e.body.error) renderCheckResult(checkResult, null);
    }
  });

  const draftBtn = document.getElementById('social-draft-fable');
  if (draftBtn) {
    draftBtn.addEventListener('click', async () => {
      const bodyEl = document.getElementById('social-body');
      const titleEl = document.getElementById('social-title');
      const brief = (titleEl && titleEl.value) || (bodyEl && bodyEl.value) || '';
      if (status) status.textContent = 'drafting with Fable…';
      try {
        const j = await draftWithFable({
          brand: document.getElementById('social-brand').value,
          platform: document.getElementById('social-platform').value,
          brief,
        });
        if (bodyEl) bodyEl.value = j.draft || '';
        renderCheckResult(checkResult, j.checks);
        if (status) status.textContent = 'draft filled in — review before proposing';
      } catch (e) {
        if (status) status.textContent = 'draft error: ' + (e.message || e);
      }
    });
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initSocial);
}

export { escapeHtml, fetchJson, loadPlatforms, renderPlatformOptions, renderCheckResult, loadProposals, renderProposals, submitProposal, draftWithFable, initSocial };
