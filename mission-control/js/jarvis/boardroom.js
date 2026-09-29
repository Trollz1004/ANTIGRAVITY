/**
 * Board Room (2026-09-29) - the mission's think tank: the collab tracks, every
 * AI lane's seat (how it connects, what its journal says, whether it has filed
 * its own TRUST.md), the branches the lanes left drifting, and the affiliate
 * links. Loads /api/boardroom once, on the first click of the tab. The page
 * holds no keys: the GitHub token stays on the server, and when it is not set
 * the drift card says so and shows nothing else. Nothing here executes and
 * nothing here votes; the founder's ClawX board holds the vote.
 */
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

async function fetchJson(url, fetchImpl = fetch) {
  const r = await fetchImpl(url, { headers: { accept: 'application/json' } })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error((j && j.error) || 'HTTP ' + r.status)
  return j
}

const DAY_MS = 24 * 60 * 60 * 1000
const LANE_GRID = 'grid-template-columns:14px 1.1fr 1.3fr 90px 1fr 110px 1.6fr 1.4fr 110px'
const TRACK_GRID = 'grid-template-columns:14px 1.4fr 80px 1fr 130px 2fr'

const isHttps = (u) => typeof u === 'string' && /^https:\/\//.test(u)

function externalLink(url, label) {
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(label)} ↗</a>`
}

/** Green UP, red DOWN (and any failing state), neutral LINKED / NOT CONFIGURED / PARKED. */
export function laneDotClass(status) {
  if (status === 'UP') return 'ok'
  if (status === 'LINKED' || status === 'NOT CONFIGURED' || status === 'PARKED') return ''
  return 'down'
}

function journalText(lane) {
  const f = lane.fleet
  if (f) return `${f.currentTask || 'no did: line'} (queue ${f.queueDepth == null ? 0 : f.queueDepth})`
  return lane.journal || 'no journal named'
}

/** FILED <date> or NOT FILED, from the lane's own TRUST.md; 'unknown' only when the response held no entry. */
export function trustCell(att) {
  if (!att) return { text: 'unknown', cls: '', title: 'this response held no attestation entry' }
  if (att.status === 'FILED') {
    // The date shown is the one the seat wrote on its own file; a checkout's file
    // time is not a filing date, so without a Filed line the cell says so.
    const filed = /^\d{4}-\d{2}-\d{2}$/.test(String(att.filedAt || '')) ? att.filedAt : null
    const modified = /^\d{4}-\d{2}-\d{2}/.exec(String(att.modifiedAt || att.at || ''))
    const text = filed ? 'FILED ' + filed : 'FILED' + (modified ? ' (file modified ' + modified[0] + ', no Filed line)' : '')
    return { text, cls: 'ok', title: `${att.lines} line(s)` + (filed ? `, Filed ${filed} on the file` : '') + (modified ? `, checkout file time ${att.modifiedAt || att.at}` : '') }
  }
  return { text: 'NOT FILED', cls: '', title: att.detail || 'no TRUST.md on disk' }
}

export function renderLaneRow(lane, att) {
  const dot = laneDotClass(lane.status)
  const url = lane.bridge && lane.bridge.url
  // A hosted link (Emergent) is a place to go, not a service that answered: the name
  // becomes the link and the dot stays neutral.
  const name = isHttps(url) ? externalLink(url, lane.name) : escapeHtml(lane.name)
  const checked = lane.bridge && lane.bridge.lastChecked ? ` (checked ${lane.bridge.lastChecked})` : ''
  const detail = (lane.detail || '') + checked
  const journal = journalText(lane)
  const nodes = Array.isArray(lane.node) ? lane.node.join(' + ') : lane.node
  const trust = trustCell(att)
  return `<div class="mission-row boardroom-lane" style="${LANE_GRID}" data-lane-id="${escapeHtml(lane.id)}">
    <span class="dot ${dot}"></span>
    <span title="${escapeHtml(lane.note || '')}">${name}</span>
    <span class="mission-detail" title="${escapeHtml(lane.role)}">${escapeHtml(lane.role)}</span>
    <span class="mission-detail">${escapeHtml(lane.connects)}</span>
    <span class="mission-detail">${escapeHtml(nodes)}</span>
    <span class="${dot}">${escapeHtml(lane.status)}</span>
    <span class="mission-detail" title="${escapeHtml(detail)}">${escapeHtml(detail)}</span>
    <span class="mission-detail" title="${escapeHtml(journal)}">${escapeHtml(journal)}</span>
    <span class="${trust.cls}" title="${escapeHtml(trust.title)}">${escapeHtml(trust.text)}</span>
  </div>`
}

export function renderLanes(el, lanes, attestations, at) {
  const rows = Array.isArray(lanes) ? lanes : []
  const byLane = new Map((Array.isArray(attestations) ? attestations : []).map((a) => [a.lane, a]))
  // The read time is printed so an UP or DOWN always carries when it was true.
  const read = at ? ` <span class="mission-detail">read ${escapeHtml(at)}; click the tab again to re-read</span>` : ''
  const note = `<p class="tab-desc" style="margin:0 0 8px">Each seat files its own TRUST.md; nobody files for another.${read}</p>`
  const head = `<div class="mission-row mission-head" style="${LANE_GRID}"><span></span><span>Lane</span><span>Role</span><span>Connects</span><span>Node</span><span>Status</span><span>Identity / detail</span><span>Journal</span><span>Trust</span></div>`
  el.innerHTML = rows.length ? note + head + rows.map((l) => renderLaneRow(l, byLane.get(l.id))).join('') : '<p class="placeholder">No lanes.</p>'
}

export function renderTrackRow(t) {
  const onRecord = t.status === 'ON RECORD'
  const dot = onRecord ? 'ok' : ''
  const where = onRecord ? t.record : [t.detail || 'no record on disk yet', t.record ? '(' + t.record + ')' : ''].filter(Boolean).join(' ')
  return `<div class="mission-row boardroom-track" style="${TRACK_GRID}" data-track-id="${escapeHtml(t.id)}">
    <span class="dot ${dot}"></span>
    <span>${escapeHtml(t.name)}</span>
    <span class="mission-detail">${escapeHtml(t.kind)}</span>
    <span class="mission-detail">${t.lead ? escapeHtml(t.lead) : 'no lead named'}</span>
    <span class="${dot}">${escapeHtml(t.status)}</span>
    <span class="mission-detail" title="${escapeHtml(where)}">${escapeHtml(where)}</span>
  </div>`
}

/** The collab tracks, each with an honest status from a disk check; nothing is invented for a track with no record. */
export function renderTracks(el, tracks) {
  const rows = Array.isArray(tracks) ? tracks : []
  const head = `<div class="mission-row mission-head" style="${TRACK_GRID}"><span></span><span>Track</span><span>Kind</span><span>Lead</span><span>Status</span><span>Record</span></div>`
  el.innerHTML = rows.length ? head + rows.map(renderTrackRow).join('') : '<p class="placeholder">No tracks.</p>'
}

/** Whole days since an ISO date; null when there is no readable date. */
export function ageDays(iso, nowMs = Date.now()) {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return null
  return Math.max(0, Math.floor((nowMs - t) / DAY_MS))
}

const BADGE_STATUS = /^[A-Z]+$/

function statusBadge(status) {
  const s = BADGE_STATUS.test(String(status)) ? status : 'UNKNOWN'
  return `<span class="drift-badge drift-${s}">${escapeHtml(status)}</span>`
}

function ageCell(b, nowMs) {
  const d = ageDays(b.lastCommitAt, nowMs)
  if (d !== null) return String(d)
  return b.status === 'DEAD' ? '<span title="nothing ahead of main, so no commit date was read">n/a</span>' : 'unknown'
}

function prCell(pr) {
  if (!pr) return 'none'
  const label = '#' + pr.number + (pr.title ? ' ' + pr.title : '')
  return isHttps(pr.url) ? externalLink(pr.url, label) : escapeHtml(label)
}

export function renderBranchRow(b, nowMs) {
  return `<tr data-branch="${escapeHtml(b.name)}">
    <td>${escapeHtml(b.name)}</td>
    <td>${escapeHtml(b.lane)}</td>
    <td>${statusBadge(b.status)}</td>
    <td>${escapeHtml(b.aheadBy)} / ${escapeHtml(b.behindBy)}</td>
    <td>${ageCell(b, nowMs)}</td>
    <td>${prCell(b.pr)}</td>
  </tr>`
}

/** "claude: 0 dead, 0 stale, 1 live, 0 working" for each lane that has branches. */
export function driftBadgeLine(badges, skippedCount = 0) {
  const parts = Object.entries(badges || {}).map(([lane, t]) => `${escapeHtml(lane)}: ${escapeHtml(t.dead)} dead, ${escapeHtml(t.stale)} stale, ${escapeHtml(t.live)} live, ${escapeHtml(t.working)} working`)
  if (parts.length) return `<p class="boardroom-badges"><b>Drift badges</b> ${parts.join(' &middot; ')}</p>`
  if (skippedCount > 0) return `<p class="boardroom-badges">No compared branches; ${escapeHtml(skippedCount)} not compared.</p>`
  return '<p class="boardroom-badges">No branches other than main.</p>'
}

export function renderDriftRepo(entry, nowMs = Date.now()) {
  const repo = escapeHtml(entry.repo)
  if (entry.status === 'DOWN' || entry.status === 'NOT CONFIGURED') {
    return `<div class="boardroom-repo-block" data-repo="${repo}"><h4 class="boardroom-repo">${repo} ${statusBadge(entry.status)}</h4><p class="tab-desc">${escapeHtml(entry.detail || '')}</p></div>`
  }
  const branches = Array.isArray(entry.branches) ? entry.branches : []
  const table = branches.length
    ? `<table class="boardroom-table"><thead><tr><th>Branch</th><th>Lane</th><th>Status</th><th>Ahead / behind</th><th>Age (days)</th><th>Pull request</th></tr></thead><tbody>${branches.map((b) => renderBranchRow(b, nowMs)).join('')}</tbody></table>`
    : ''
  const skipped = Array.isArray(entry.skipped) && entry.skipped.length
    ? `<p class="tab-desc">Not compared: ${entry.skipped.map((s) => `${escapeHtml(s.name)} (${escapeHtml(s.detail)})`).join('; ')}</p>`
    : ''
  const truncated = entry.truncated ? '<p class="tab-desc">GitHub returned a full page of branches; there may be more than are shown.</p>' : ''
  const fetched = entry.fetchedAt ? `<span class="mission-detail">read ${escapeHtml(entry.fetchedAt)}</span>` : ''
  return `<div class="boardroom-repo-block" data-repo="${repo}"><h4 class="boardroom-repo">${repo} <span class="mission-detail">against ${escapeHtml(entry.default || 'main')}</span> ${fetched}</h4>${driftBadgeLine(entry.badges, Array.isArray(entry.skipped) ? entry.skipped.length : 0)}${table}${skipped}${truncated}</div>`
}

/**
 * `drift` is an array (one entry per repo) or, with no GitHub token on the
 * server, { status: 'NOT CONFIGURED', detail }: then that sentence and nothing else.
 */
export function renderDrift(el, drift, nowMs = Date.now()) {
  if (Array.isArray(drift)) {
    el.innerHTML = drift.length ? drift.map((d) => renderDriftRepo(d, nowMs)).join('') : '<p class="placeholder">No repositories configured.</p>'
    return
  }
  if (drift && drift.status === 'NOT CONFIGURED') {
    el.innerHTML = `<p class="placeholder">${escapeHtml(drift.detail || 'The drift board is not configured.')}</p>`
    return
  }
  el.innerHTML = '<p class="placeholder">No drift data.</p>'
}

export function renderAffiliate(el, a) {
  if (!a) { el.innerHTML = '<p class="placeholder">No affiliate data.</p>'; return }
  const wing = isHttps(a.wing) ? externalLink(a.wing, 'Emergent wing chat') : 'NOT CONFIGURED: no Emergent wing link (EMERGENT_WING_URL)'
  const brief = `<code>${escapeHtml(a.brief)}</code> ${a.briefExists ? '(on disk)' : '(not found in this checkout)'}`
  el.innerHTML = `<p class="tab-desc" style="margin:0 0 8px">Wing: ${wing}</p>
    <p class="tab-desc" style="margin:0 0 8px">Brief: ${brief}</p>
    <p class="tab-desc" style="margin:0">Terms: ${escapeHtml(a.terms)}</p>`
}

export function renderLinks(el, j) {
  const cloud = isHttps(j && j.cloud) ? externalLink(j.cloud, 'Cloud dashboard') : 'Cloud dashboard: NOT CONFIGURED'
  const fb = j && j.founderBoard
  // The founder-board note is text from the server, never a control: the vote lives on the ClawX Board tab and nothing here reaches it.
  const founder = fb && fb.note
    ? `<p class="tab-desc" style="margin:8px 0 0">Founder board: ${escapeHtml(fb.note)} (the ${escapeHtml(fb.tab === 'board' ? 'ClawX Board' : String(fb.tab || ''))} tab)</p>`
    : ''
  el.innerHTML = `<p class="tab-desc" style="margin:0 0 8px">${cloud}</p>
    <p class="tab-desc" style="margin:0"><a href="/cockpit/" target="_blank" rel="noopener">Operator cockpit ↗</a></p>${founder}`
}

/** Fill every card; `els` is { tracks, lanes, drift, affiliate, links }, each a real element or a fake with innerHTML. */
export function renderBoardRoom(els, j, nowMs = Date.now()) {
  if (els.tracks) renderTracks(els.tracks, j && j.tracks)
  if (els.lanes) renderLanes(els.lanes, j && j.lanes, j && j.attestations, j && j.at)
  if (els.drift) renderDrift(els.drift, j && j.drift, nowMs)
  if (els.affiliate) renderAffiliate(els.affiliate, j && j.affiliate)
  if (els.links) renderLinks(els.links, j)
}

function cards() {
  const get = (id) => document.getElementById(id)
  return { tracks: get('boardroom-tracks'), lanes: get('boardroom-lanes'), drift: get('boardroom-drift'), affiliate: get('boardroom-affiliate'), links: get('boardroom-links') }
}

/** Returns true when the page rendered, false when the fetch failed (so a later tab click can retry). */
export async function loadBoardRoom(fetchImpl = fetch) {
  const els = cards()
  if (!els.lanes) return false
  try {
    const j = await fetchJson('/api/boardroom', fetchImpl)
    renderBoardRoom(els, j)
    return true
  } catch (e) {
    const msg = `<p class="placeholder">Board Room unavailable: ${escapeHtml(e.message || e)}</p>`
    for (const el of Object.values(els)) if (el) el.innerHTML = msg
    return false
  }
}

function initBoardroom() {
  // Every click on the tab re-reads the board (the drift read is cached server-side
  // for five minutes), so a status shown is never older than the last click.
  let loading = false
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset && tab.dataset.tab === 'boardroom' && !loading) {
        loading = true
        loadBoardRoom().then(() => { loading = false })
      }
    })
  })
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initBoardroom)
}

export { escapeHtml, fetchJson, initBoardroom }
