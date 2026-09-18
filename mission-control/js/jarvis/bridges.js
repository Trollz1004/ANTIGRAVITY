/**
 * Bridges panel (Phase F, unit 1) — status cards for every outside agent this
 * node can reach, plus a run box that explains a run is always a Proposal
 * (never an immediate action from this panel).
 */
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

async function fetchJson(url, opts, fetchImpl = fetch) {
  const r = await fetchImpl(url, opts)
  const j = await r.json().catch(() => null)
  if (!r.ok && r.status !== 201) throw new Error((j && j.error) || 'HTTP ' + r.status)
  return j
}

export function statusClass(status) {
  if (status === 'UP') return 'ok'
  if (status === 'PARKED' || status === 'NOT CONFIGURED') return ''
  return 'down'
}

export function renderBridgeCard(b) {
  const dot = statusClass(b.status)
  const runNote = b.canRun ? 'accepts a prompt (creates a Proposal)' : (b.reason || 'read-only')
  return `<div class="mission-row" style="grid-template-columns:14px 1fr 110px 1fr 1fr" data-bridge-id="${escapeHtml(b.id)}">
    <span class="dot ${dot}"></span>
    <span>${escapeHtml(b.name)}</span>
    <span>${escapeHtml(b.status)}</span>
    <span class="mission-detail">${escapeHtml(b.identity || '')}</span>
    <span class="mission-detail">${escapeHtml(runNote)}</span>
  </div>`
}

export function renderBridges(el, j) {
  const bridges = (j && j.bridges) || []
  el.innerHTML = bridges.length ? bridges.map(renderBridgeCard).join('') : '<p class="placeholder">No bridges.</p>'
}

export async function loadBridges(fetchImpl = fetch) {
  const el = document.getElementById('bridges-panel')
  const select = document.getElementById('bridges-run-select')
  if (!el) return
  try {
    const j = await fetchJson('/api/bridges', undefined, fetchImpl)
    renderBridges(el, j)
    if (select) {
      const runnable = (j.bridges || []).filter((b) => b.canRun)
      select.innerHTML = runnable.map((b) => `<option value="${escapeHtml(b.id)}">${escapeHtml(b.name)}</option>`).join('') || '<option value="">(none available)</option>'
    }
  } catch (e) {
    el.innerHTML = `<p class="placeholder">Bridges unavailable: ${escapeHtml(e.message || e)}</p>`
  }
}

export async function runBridgePrompt(fetchImpl = fetch) {
  const select = document.getElementById('bridges-run-select')
  const input = document.getElementById('bridges-run-prompt')
  const out = document.getElementById('bridges-run-result')
  const id = select && select.value
  const prompt = String(input && input.value || '').trim()
  if (!out) return
  if (!id || !prompt) { out.textContent = 'Choose a bridge and enter a prompt.'; return }
  out.textContent = 'Creating a proposal…'
  try {
    const j = await fetchJson(`/api/bridges/${encodeURIComponent(id)}/run`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt }),
    }, fetchImpl)
    out.textContent = `Proposal created (${j.proposal.id}). It runs only after a founder approve in the Inbox.`
    if (input) input.value = ''
  } catch (e) {
    out.textContent = 'Could not create the proposal: ' + (e.message || e)
  }
}

function initBridges() {
  let loaded = false
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset && tab.dataset.tab === 'bridges' && !loaded) { loaded = true; loadBridges() }
    })
  })
  const runBtn = document.getElementById('bridges-run-btn')
  if (runBtn) runBtn.addEventListener('click', () => { void runBridgePrompt() })
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initBridges)
}

export { escapeHtml, fetchJson, initBridges }
