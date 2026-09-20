/**
 * Global JARVIS dock — the agentic layer of the whole dashboard: one always
 * visible ⬢ JARVIS entry in the sidebar opens a chat drawer on any tab.
 *
 * Two engines, one drawer (specs/009-jarvis-agentic-ask, ruling 2026-09-19 —
 * a model in this picker is useless unless it can act):
 *   - "Claude Code (Claudian)" (default, value "claude-code") — unchanged:
 *     the official Claude CLI bridge (persona: jarvis) with the HUD context
 *     flag set, so the SERVER composes the preamble from live house data.
 *   - any other model in the picker — POST /api/ask {bridge:"omniroute"},
 *     which runs the tool-calling agent loop (lib/ask-agent.mjs) over
 *     OmniRoute. Only models GET /api/ask/models reports agentic:true ever
 *     appear here; a model that cannot call a tool is never offered.
 * Both stream the same SSE event vocabulary (init/delta/tool/result/error),
 * so one reader (readSse/parseSseChunk below) serves both. The client never
 * forges context or fabricates a tool trace. No sample data, honest errors.
 *
 * Phase F, unit 2 (voice): a push-to-talk mic button fills the input with a
 * transcript (never auto-sent — the operator still presses Send), and a
 * finished reply is spoken through the server's edge-tts voice, falling back
 * to the browser's own speechSynthesis when the server has none. Mute and
 * the chosen voice persist in localStorage as per-viewer conveniences only.
 */
import { speak as ttsSpeak, isMuted, setMuted, getEdgeVoice, setEdgeVoice } from './tts-client.js'
import { speak as browserSpeak } from './voice-picker.js'

export const EDGE_VOICE_CHOICES = [
  { id: 'en-US-GuyNeural', label: 'Guy' },
  { id: 'en-US-AndrewNeural', label: 'Andrew' },
  { id: 'en-US-BrianNeural', label: 'Brian' },
  { id: 'en-US-AriaNeural', label: 'Aria' },
  { id: 'en-US-JennyNeural', label: 'Jenny' },
  { id: 'en-US-ChristopherNeural', label: 'Christopher' },
]

function speechRecognitionCtor() {
  return (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null
}

/** Push-to-talk: mousedown starts listening, mouseup stops. Transcript only fills the input box. */
function wirePushToTalk(micButton, inputEl) {
  const Ctor = speechRecognitionCtor()
  if (!Ctor) {
    micButton.disabled = true
    micButton.title = 'voice input needs Chrome or the HTTPS tunnel'
    return null
  }
  const rec = new Ctor()
  rec.continuous = true
  rec.interimResults = true
  rec.lang = 'en-US'
  let active = false
  rec.onresult = (e) => {
    let text = ''
    for (let i = 0; i < e.results.length; i++) text += e.results[i][0]?.transcript || ''
    if (inputEl) inputEl.value = text.trim() // shown, never auto-sent
  }
  rec.onend = () => { active = false; micButton.classList.remove('active') }
  rec.onerror = () => { active = false; micButton.classList.remove('active') }
  micButton.addEventListener('mousedown', () => {
    if (active) return
    active = true
    micButton.classList.add('active')
    try { rec.start() } catch {}
  })
  micButton.addEventListener('mouseup', () => { try { rec.stop() } catch {} })
  return rec
}

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

const CLAUDE_ENGINE = 'claude-code';

/**
 * GET /api/ask/models — only agentic:true OmniRoute models plus the builtin
 * Claude Code entry ever populate the picker (doctrine 2026-09-19: a model
 * that cannot call a tool is removed, not just deprioritized).
 */
export async function loadDockModels(fetchImpl = fetch) {
  const select = document.getElementById('dock-model');
  if (!select) return [];
  try {
    const r = await fetchImpl('/api/ask/models');
    const j = await r.json().catch(() => null);
    const kept = (j && Array.isArray(j.kept) ? j.kept : []).map((id) => ({ id, label: id }));
    const builtin = (j && Array.isArray(j.builtin) ? j.builtin : [{ id: CLAUDE_ENGINE, label: 'Claude Code (Claudian)' }]);
    const options = [...builtin, ...kept];
    select.innerHTML = options.map((m) => `<option value="${m.id}">${m.label}</option>`).join('');
    select.value = CLAUDE_ENGINE;
    return options;
  } catch {
    // Honest degrade: keep whatever the select already has (the builtin default).
    return [];
  }
}

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
  const capability = document.createElement('p');
  capability.id = 'dock-capability';
  capability.className = 'tab-desc';
  capability.textContent = 'JARVIS can read this repo, search it, see node health, God’s Eye, and the Inbox — and file a proposal for anything that would change the world. Approvals are Joshua’s alone.';
  const modelRow = document.createElement('div');
  modelRow.className = 'gen-row';
  const modelLabel = document.createElement('span');
  modelLabel.textContent = 'Engine: ';
  const modelSelect = document.createElement('select');
  modelSelect.id = 'dock-model';
  modelSelect.className = 'select-input';
  modelSelect.title = 'Only tool-calling ("agentic") models are offered — see GET /api/ask/models';
  modelSelect.innerHTML = `<option value="${CLAUDE_ENGINE}">Claude Code (Claudian)</option>`;
  modelRow.appendChild(modelLabel); modelRow.appendChild(modelSelect);
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
  const mic = document.createElement('button');
  mic.id = 'dock-mic';
  mic.className = 'btn dock-mic';
  mic.title = 'Hold to talk (push-to-talk)';
  mic.textContent = '\u{1F399}'; // microphone
  wirePushToTalk(mic, input);
  const send = document.createElement('button');
  send.id = 'dock-send';
  send.className = 'btn primary';
  send.textContent = 'Send';
  const row = document.createElement('div');
  row.className = 'chat-input-row';
  row.appendChild(mic); row.appendChild(input); row.appendChild(send);

  // Voice settings: mute toggle, a short list of natural voices, a test button.
  const voiceRow = document.createElement('div');
  voiceRow.className = 'dock-voice-row';
  const mute = document.createElement('button');
  mute.id = 'dock-mute';
  mute.className = 'btn dock-mute';
  const refreshMute = () => { mute.textContent = isMuted() ? '\u{1F507} Muted' : '\u{1F50A} Voice on'; };
  refreshMute();
  mute.addEventListener('click', () => { setMuted(!isMuted()); refreshMute(); });
  const voiceSelect = document.createElement('select');
  voiceSelect.id = 'dock-voice-select';
  for (const v of EDGE_VOICE_CHOICES) {
    const opt = document.createElement('option');
    opt.value = v.id; opt.textContent = v.label;
    voiceSelect.appendChild(opt);
  }
  voiceSelect.value = getEdgeVoice();
  voiceSelect.addEventListener('change', () => setEdgeVoice(voiceSelect.value));
  const testVoice = document.createElement('button');
  testVoice.id = 'dock-voice-test';
  testVoice.className = 'btn';
  testVoice.textContent = 'Test voice';
  testVoice.addEventListener('click', () => {
    void ttsSpeak('This is JARVIS, testing the selected voice.', { voice: voiceSelect.value, muted: false, fallbackSpeak: (t) => browserSpeak(t) });
  });
  voiceRow.appendChild(mute); voiceRow.appendChild(voiceSelect); voiceRow.appendChild(testVoice);

  panel.appendChild(head); panel.appendChild(capability); panel.appendChild(modelRow); panel.appendChild(logEl); panel.appendChild(status); panel.appendChild(row); panel.appendChild(voiceRow);
  document.body.appendChild(panel);
  void loadDockModels(fetchImpl);
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

/** Collapsible tool-call trace under a finished answer — never fabricated, built only from real 'tool' events. */
function renderToolTrace(logEl, trace) {
  if (!logEl || !trace || !trace.length) return;
  const details = document.createElement('details');
  details.className = 'dock-trace';
  const summary = document.createElement('summary');
  summary.textContent = `Tool calls (${trace.length})`;
  details.appendChild(summary);
  for (const t of trace) {
    const line = document.createElement('div');
    line.className = 'dock-trace-row';
    line.textContent = `${t.ok ? '✓' : '✗'} ${t.tool} (${t.ms}ms)${t.argsSummary ? ' — ' + t.argsSummary : ''}`;
    details.appendChild(line);
  }
  logEl.appendChild(details);
}

/** A "Proposals filed" chip linking to the Inbox tab — only rendered when a tool actually filed one. */
function renderProposalsChip(logEl, proposals) {
  if (!logEl || !proposals || !proposals.length) return;
  const chip = document.createElement('a');
  chip.className = 'dock-proposals-chip';
  chip.href = '#tab-inbox';
  chip.textContent = `Proposals filed: ${proposals.join(', ')} — see Inbox`;
  chip.addEventListener('click', () => {
    document.querySelectorAll?.('.nav-tab')?.forEach?.((t) => t.dataset?.tab === 'inbox' && t.click?.());
  });
  logEl.appendChild(chip);
}

/**
 * One turn. "Claude Code (Claudian)" (default engine) posts to the Claude CLI
 * bridge exactly as before. Any other selected engine posts to /api/ask
 * (bridge:"omniroute"), which runs the tool-calling agent loop — its 'tool'
 * events render as a collapsible trace, and a filed proposal shows as a chip.
 */
export async function sendFromDock({ fetchImpl = fetch, tab } = {}) {
  const input = document.getElementById('dock-input');
  const logEl = document.getElementById('dock-log');
  const status = document.getElementById('dock-status');
  const modelSelect = document.getElementById('dock-model');
  const engine = (modelSelect && modelSelect.value) || CLAUDE_ENGINE;
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
    const isOmni = engine !== CLAUDE_ENGINE;
    const body = isOmni
      ? { bridge: 'omniroute', question: prompt, model: engine }
      : (() => { const b = { prompt, persona: 'jarvis', hud: true, tab: currentTab }; if (dock.sessionId) b.sessionId = dock.sessionId; return b; })();
    const response = await fetchImpl(isOmni ? '/api/ask' : '/api/claude/chat', { method: 'POST', headers, body: JSON.stringify(body) });
    if (!response.ok) {
      const text = `${isOmni ? 'Ask-JARVIS' : 'Claude bridge'} refused (${response.status})`;
      if (live) live.textContent = text; else log(logEl, 'JARVIS', text);
      if (status) { status.textContent = 'ERROR'; status.className = 'voice-status voice-status-error'; }
      return;
    }
    let resultText = '';
    let trace = [];
    let proposals = [];
    await readSse(response, (event, data) => {
      if (event === 'delta' && live) live.textContent += data?.text || '';
      if (event === 'tool') trace.push(data);
      if (event === 'result') {
        resultText = data?.text || data?.answer || resultText;
        if (data?.sessionId) dock.sessionId = data.sessionId;
        if (Array.isArray(data?.trace)) trace = data.trace;
        if (Array.isArray(data?.proposals)) proposals = data.proposals;
      }
      if (event === 'error' && live) live.textContent += `\n[error] ${data?.message || 'unknown'}`;
    });
    if (live && resultText) live.textContent = resultText;
    if (isOmni) { renderToolTrace(logEl, trace); renderProposalsChip(logEl, proposals); }
    if (status) { status.textContent = 'IDLE'; status.className = 'voice-status voice-status-idle'; }
    if (resultText) void ttsSpeak(resultText, { fetchImpl, fallbackSpeak: (t) => browserSpeak(t) });
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
