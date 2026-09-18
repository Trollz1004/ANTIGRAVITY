/**
 * Skills, plugins, and MCP panel (Phase F, unit 3) — everything installed
 * for Claude Code on this node, read live. The full project skills tree
 * already has its own view in the Agents tab (the AIRI skills tree); this
 * panel links to it with a live count instead of rendering it a second time.
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

export function renderSkillsPanel(el, j) {
  const plugins = (j.plugins || []).map((p) => `<li>${escapeHtml(p.id)} <span class="check-pill">${escapeHtml(p.version || 'unknown version')}</span></li>`).join('')
  const mcp = (j.mcpServers || []).map((m) => `<li>${escapeHtml(m.name)} — <span class="${m.connected ? 'check-ok' : 'check-warn'}">${escapeHtml(m.state)}</span></li>`).join('')
  const userSkills = (j.userSkills || []).map((s) => `<li><b>${escapeHtml(s.id)}</b> — ${escapeHtml(s.description || '')}</li>`).join('')
  const obsidian = (j.obsidianCommands || []).map((c) => `<li><b>/${escapeHtml(c.id)}</b> — ${escapeHtml(c.description || '')}</li>`).join('')
  const restart = j.loadOnRestart || {}
  const related = (restart.relatedSkills || []).map(escapeHtml).join(', ')
  el.innerHTML = `
    <div class="widget-card">
      <h3>Enabled plugins <span class="check-pill">${j.counts?.plugins ?? plugins.length ?? 0}</span></h3>
      <ul class="inbox-list">${plugins || '<li class="placeholder">None enabled.</li>'}</ul>
    </div>
    <div class="widget-card">
      <h3>MCP servers <span class="check-pill">${j.counts?.mcpServers ?? 0}</span></h3>
      <ul class="inbox-list">${mcp || '<li class="placeholder">No MCP servers configured.</li>'}</ul>
    </div>
    <div class="widget-card">
      <h3>User skills (~/.claude/skills) <span class="check-pill">${j.counts?.userSkills ?? 0}</span></h3>
      <ul class="inbox-list">${userSkills || '<li class="placeholder">None found.</li>'}</ul>
    </div>
    <div class="widget-card">
      <h3>Project skills <span class="check-pill">${j.counts?.projectSkills ?? 0}</span></h3>
      <p class="tab-desc">Full tree merged into the <b>Agents</b> tab — not repeated here.</p>
    </div>
    <div class="widget-card">
      <h3>obsidian-second-brain commands <span class="check-pill">${(j.obsidianCommands || []).length}</span></h3>
      <ul class="inbox-list">${obsidian || '<li class="placeholder">Plugin not enabled or not found.</li>'}</ul>
    </div>
    <div class="widget-card">
      <h3>Loads on restart (drift)</h3>
      <p class="tab-desc">${restart.skill ? `<b>${escapeHtml(restart.skill)}</b>` : 'not found'}${related ? ' → related: ' + related : ''}${restart.error ? ' — ' + escapeHtml(restart.error) : ''}</p>
    </div>`
}

export async function loadSkillsPanel(fetchImpl = fetch) {
  const el = document.getElementById('skills-panel')
  if (!el) return
  try {
    const j = await fetchJson('/api/skills', fetchImpl)
    renderSkillsPanel(el, j)
  } catch (e) {
    el.innerHTML = `<p class="placeholder">Skills panel unavailable: ${escapeHtml(e.message || e)}</p>`
  }
}

function initSkillsPanel() {
  let loaded = false
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset && tab.dataset.tab === 'skills' && !loaded) { loaded = true; loadSkillsPanel() }
    })
  })
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initSkillsPanel)
}

export { escapeHtml, fetchJson, initSkillsPanel }
