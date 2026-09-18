/**
 * Global JARVIS dock — the agentic layer of the whole dashboard: one always
 * visible ⬢ JARVIS entry in the sidebar opens a chat drawer on any tab. Replies
 * stream from the official Claude CLI bridge (persona: jarvis) with the HUD
 * context flag set, so the SERVER composes the preamble from live house data.
 * The client never forges context. No sample data, honest errors.
 */

function parseSseChunk(buffer) {
  const blocks = buffer.split(/\r?\n\r?\n/);
  const rest = blocks.pop() || '';
  const events = [];
  for (const block of blocks) {
    let event = 'message';
    const dataLines = [];
    for (const line of block.split(/\r?\n/)) {
      if (!line || line.startsWith(':')) continue;
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
    }
    if (!dataLines.length) continue;
    const raw = dataLines.join('\n');
    let data = raw;
    try { data = JSON.parse(raw); } catch {}
    events.push({ event, data });
  }
  return { events, rest };
}

async function readSse(response, onEvent = () => {}) {
  if (!response.body?.getReader) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parsed = parseSseChunk(buffer);
    buffer = parsed.rest;
    for (const entry of parsed.events) onEvent(entry.event, entry.data);
  }
}

const dock = { open: false, busy: false, sessionId: '' };

function log(target, who, text) {
  if (!target) return;
  const row = document.createElement('div');
  row.className = `dock-row dock-${who.toLowerCase()}`;
  const b = document.createElement('b');
  b.textContent = who + ': ';
  const span = document.createElement('span');
  span.textContent = text;
  row.appendChild(b); row.appendChild(span);
  target.appendChild(row);
}

function dockButtons() {
  return Array.from((document.querySelectorAll('.dock-toggle') || []));
}

export function mountDock({ fetchImpl = fetch } = {}) {
  const nav = document.querySelector('.nav-tabs') || document.querySelector('#sidebar');
  if (!nav || dockButtons().length) return;
  const li = document.createElement('li');
  li.className = 'nav-tab dock-toggle';
  li.setAttribute('title', 'Ask JARVIS (global) — Claude CLI bridge with live house context');
  li.textContent = '⬢ Ask JARVIS';
  li.addEventListener('click', () => openDock());
  nav.appendChild(li);

  // The drawer lives at body level so it overlays every tab.
  const panel = document.createElement('div');
  panel.id = 'jarvis-dock';
  panel.className = 'dock-panel';
  panel.hidden = true;
  const head = document.createElement('div');
  head.className = 'dock-head';
  const title = document.createElement('span');
  title.textContent = '⬢ JARVIS — ask about any tab';
  const close = document.createElement('button');
  close.className = 'btn dock-close';
  close.textContent = '×';
  close.addEventListener('click', () => closeDock());
  head.appendChild(title); head.appendChild(close);
  const logEl = document.createElement('div');
  logEl.id = 'dock-log';
  logEl.className = 'dock-log';
  const status = document.createElement('span');
  status.id = 'dock-status';
  status.className = 'voice-status voice-status-idle';
  status.textContent = 'IDLE';
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'dock-input';
  input.className = 'chat-input';
  input.placeholder = 'Ask JARVIS about this tab, the house, or the repo...';
  const send = document.createElement('button');
  send.id = 'dock-send';
  send.className = 'btn primary';
  send.textContent = 'Send';
  const row = document.createElement('div');
  row.className = 'chat-input-row';
  row.appendChild(input); row.appendChild(send);
  panel.appendChild(head); panel.appendChild(logEl); panel.appendChild(status); panel.appendChild(row);
  document.body.appendChild(panel);
  // Send paths use the current global fetch (tests swap it after mount).
  send.addEventListener('click', () => { void sendFromDock(); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { void sendFromDock(); } });

  // Ask-JARVIS buttons on live panels: open the drawer and fire the pre-armed
  // question pinned to that panel's tab (the preamble names the same tab).
  document.addEventListener('click', (e) => {
    const btn = e.target && typeof e.target.closest === 'function' ? e.target.closest('.dock-ask') : null;
    if (!btn) return;
    openDock();
    const box = document.getElementById('dock-input');
    if (box) box.value = String(btn.dataset.question || '').trim();
    void sendFromDock({ tab: String(btn.dataset.tab || '') || undefined });
  });
}

export function openDock() {
  dock.open = true;
  const panel = document.getElementById('jarvis-dock');
  if (panel) panel.hidden = false;
}

export function closeDock() {
  dock.open = false;
  const panel = document.getElementById('jarvis-dock');
  if (panel) panel.hidden = true;
}

export function isDockOpen() { return dock.open; }

/**
 * One turn: fetch the tab hint, POST to the bridge with hud:true (the server
 * composes the preamble), stream deltas into the drawer log, keep the session.
 */
export async function sendFromDock({ fetchImpl = fetch, tab } = {}) {
  const input = document.getElementById('dock-input');
  const logEl = document.getElementById('dock-log');
  const status = document.getElementById('dock-status');
  const prompt = String(input && input.value || '').trim();
  if (!prompt || dock.busy) return;
  dock.busy = true;
  if (input) input.value = '';
  if (status) { status.textContent = 'THINKING'; status.className = 'voice-status voice-status-busy'; }
  log(logEl, 'You', prompt);
  const live = logEl ? (() => {
    const row = document.createElement('div');
    row.className = 'dock-row dock-jarvis';
    const b = document.createElement('b');
    b.textContent = 'JARVIS: ';
    const span = document.createElement('span');
    row.appendChild(b); row.appendChild(span);
    logEl.appendChild(row);
    return span;
  })() : null;
  let currentTab = 'hud';
  try {
    currentTab = tab || (document.querySelector('.nav-tab.active')?.dataset?.tab) || 'hud';
  } catch {}
  try {
    const headers = { 'Content-Type': 'application/json' };
    const body = { prompt, persona: 'jarvis', hud: true, tab: currentTab };
    if (dock.sessionId) body.sessionId = dock.sessionId;
    const response = await fetchImpl('/api/claude/chat', { method: 'POST', headers, body: JSON.stringify(body) });
    if (!response.ok) {
      const text = `Claude bridge refused (${response.status})`;
      if (live) live.textContent = text; else log(logEl, 'JARVIS', text);
      if (status) { status.textContent = 'ERROR'; status.className = 'voice-status voice-status-error'; }
      return;
    }
    let resultText = '';
    await readSse(response, (event, data) => {
      if (event === 'delta' && live) live.textContent += data?.text || '';
      if (event === 'result') {
        resultText = data?.text || resultText;
        if (data?.sessionId) dock.sessionId = data.sessionId;
      }
      if (event === 'error' && live) live.textContent += `\n[error] ${data?.message || 'unknown'}`;
    });
    if (live && resultText) live.textContent = resultText;
    if (status) { status.textContent = 'IDLE'; status.className = 'voice-status voice-status-idle'; }
  } catch (e) {
    const text = 'Error: ' + String(e.message || e);
    if (live) live.textContent = text; else log(logEl, 'JARVIS', text);
    if (status) { status.textContent = 'ERROR'; status.className = 'voice-status voice-status-error'; }
  } finally {
    dock.busy = false;
  }
}

export { dock, dockButtons, parseSseChunk };

// Auto-mount with the page (module scripts run after the nav exists; the guard
// keeps the bare test harness, which stubs a minimal DOM, from double-mounting).
try {
  if (document.querySelector && document.querySelector('.nav-tabs')) mountDock();
} catch {}
