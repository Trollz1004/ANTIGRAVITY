/**
 * Spec Kit panel — read-only. Lists every feature under specs/ with its
 * spec/plan/tasks status and task counts, renders one doc as markdown, and
 * shows the ratified constitution in a side card. Everything comes from the
 * server (/api/speckit, /api/speckit/<id>/<doc>) over a relative URL so the
 * tunnel keeps working; no key, no absolute host, no sample data — an empty
 * or errored fetch says so instead of drawing a placeholder row as real.
 */

const SPECKIT_URL = '/api/speckit';
function docUrl(id, doc) {
  return '/api/speckit/' + encodeURIComponent(id) + '/' + encodeURIComponent(doc);
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Minimal, dependency-free markdown-to-HTML: escapes first, then layers on a
 * handful of safe substitutions (headings, bold/italic, inline code, task
 * list checkboxes, plain list items). No raw HTML from the source ever
 * reaches the DOM — every substitution starts from the escaped string.
 */
function renderMarkdown(md) {
  const lines = escapeHtml(md).split(/\r?\n/);
  const out = [];
  let inList = false;
  const closeList = () => { if (inList) { out.push('</ul>'); inList = false; } };
  for (const raw of lines) {
    const line = raw;
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) { closeList(); const lvl = h[1].length; out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`); continue; }
    const task = /^\s*-\s*\[( |x|X)\]\s*(.*)$/.exec(line);
    if (task) {
      if (!inList) { out.push('<ul class="speckit-tasklist">'); inList = true; }
      const done = /x/i.test(task[1]);
      out.push(`<li class="${done ? 'done' : ''}"><span class="speckit-check">${done ? '✓' : '☐'}</span> ${inline(task[2])}</li>`);
      continue;
    }
    const item = /^\s*[-*]\s+(.*)$/.exec(line);
    if (item) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${inline(item[1])}</li>`);
      continue;
    }
    closeList();
    if (!line.trim()) { out.push(''); continue; }
    if (line.trim() === '---') { out.push('<hr/>'); continue; }
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return out.join('\n');
}
function inline(s) {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

async function fetchSpeckit(fetchImpl = fetch) {
  const r = await fetchImpl(SPECKIT_URL, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error('speckit fetch failed: HTTP ' + r.status);
  return r.json();
}

async function fetchDoc(id, doc, fetchImpl = fetch) {
  const r = await fetchImpl(docUrl(id, doc), { headers: { accept: 'application/json' } });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || !j.ok) throw new Error((j && j.error) || 'HTTP ' + r.status);
  return j;
}

const state = { features: [], selected: null, doc: 'spec' };

function renderList() {
  const el = document.getElementById('speckit-list');
  if (!el) return;
  if (!state.features.length) { el.innerHTML = '<p class="placeholder">No features under specs/ yet.</p>'; return; }
  el.innerHTML = '';
  for (const f of state.features) {
    const card = document.createElement('div');
    card.className = 'speckit-card';
    card.dataset.id = f.id;
    const pct = f.tasksTotal ? Math.round((f.tasksDone / f.tasksTotal) * 100) : 0;
    card.innerHTML = `
      <div class="speckit-card-title">${escapeHtml(f.title || f.id)}</div>
      <div class="speckit-card-id">${escapeHtml(f.id)}</div>
      <div class="speckit-badges">
        <span class="speckit-badge ${f.hasSpec ? 'yes' : 'no'}">spec</span>
        <span class="speckit-badge ${f.hasPlan ? 'yes' : 'no'}">plan</span>
        <span class="speckit-badge ${f.hasTasks ? 'yes' : 'no'}">tasks</span>
        <span class="speckit-count">${f.tasksDone}/${f.tasksTotal} (${pct}%)</span>
      </div>`;
    card.addEventListener('click', () => selectFeature(f.id));
    el.appendChild(card);
  }
}

function renderConstitution() {
  const el = document.getElementById('speckit-constitution');
  if (!el) return;
  el.innerHTML = state.constitution ? renderMarkdown(state.constitution) : '<p class="placeholder">No constitution found at .specify/memory/constitution.md</p>';
}

async function selectFeature(id, doc = 'spec', fetchImpl = fetch) {
  state.selected = id;
  state.doc = doc;
  const panel = document.getElementById('speckit-detail');
  const title = document.getElementById('speckit-detail-title');
  const body = document.getElementById('speckit-doc-body');
  if (panel) panel.hidden = false;
  const f = state.features.find((x) => x.id === id);
  if (title) title.textContent = (f && f.title) || id;
  document.querySelectorAll('.speckit-doc-btn').forEach((b) => b.classList.toggle('active', b.dataset.doc === doc));
  if (body) body.innerHTML = '<p class="placeholder">Loading…</p>';
  try {
    const r = await fetchDoc(id, doc, fetchImpl);
    if (body) body.innerHTML = renderMarkdown(r.markdown);
  } catch (e) {
    if (body) body.innerHTML = `<p class="placeholder">Could not load ${escapeHtml(doc)}: ${escapeHtml(e.message || e)}</p>`;
  }
}

async function loadSpeckit(fetchImpl = fetch) {
  const listEl = document.getElementById('speckit-list');
  try {
    const j = await fetchSpeckit(fetchImpl);
    state.features = j.features || [];
    state.constitution = j.constitution || '';
    renderList();
    renderConstitution();
  } catch (e) {
    if (listEl) listEl.innerHTML = `<p class="placeholder">Spec Kit unavailable: ${escapeHtml(e.message || e)}</p>`;
    const cEl = document.getElementById('speckit-constitution');
    if (cEl) cEl.innerHTML = '<p class="placeholder">Unavailable.</p>';
  }
}

function initSpeckit() {
  document.getElementById('speckit-refresh')?.addEventListener('click', () => loadSpeckit());
  document.querySelectorAll('.speckit-doc-btn').forEach((btn) => {
    btn.addEventListener('click', () => { if (state.selected) selectFeature(state.selected, btn.dataset.doc); });
  });
  let loaded = false;
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset && tab.dataset.tab === 'speckit' && !loaded) { loaded = true; loadSpeckit(); }
    });
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initSpeckit);
}

export { SPECKIT_URL, docUrl, escapeHtml, renderMarkdown, fetchSpeckit, fetchDoc, selectFeature, loadSpeckit, initSpeckit, state };
