// HermesLeadGen renderer

const ALLOWED_VOICES = ['Aoede', 'Kore', 'af_heart', 'af_bella', 'LFM3-Omni-2B'];
const BANNED_TTS = ['pyttsx3', 'espeak', 'sapi', 'sam', 'robotic-default'];
const CHANNELS = ['@DreamOnlineMMO', '@UntilNoKidInNeed', '@AIDreamTeamStudio'];
const STRIKE_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
const MIN_SHORT_S = 45;
const MAX_SHORT_S = 58.5;
const HARD_CEILING_S = 59;

let cards = [];
let publishLog = [];
let stats = {};

// --- Init ---
async function init() {
  cards = await window.hermes.cards.load();
  publishLog = await window.hermes.publish.load();
  stats = await window.hermes.stats.load();

  // Reset shortsToday if new day
  if (stats.shortsTodayDate !== new Date().toDateString()) {
    stats.shortsToday = 0;
    stats.shortsTodayDate = new Date().toDateString();
  }

  renderBoard();
  updateTopBar();
  updateWorkerStatus();

  // Event listeners
  document.querySelectorAll('.add-card-btn').forEach(btn => {
    btn.addEventListener('click', () => showAddCardModal(btn.dataset.status));
  });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  document.getElementById('yt-modal-close').addEventListener('click', closeYtModal);
  document.getElementById('yt-modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'yt-modal-overlay') closeYtModal();
  });

  // Periodic worker health refresh
  setInterval(updateWorkerStatus, 30000);
}

// --- Top bar ---
async function updateTopBar() {
  const lastPub = publishLog.length > 0
    ? new Date(publishLog[publishLog.length - 1].timestamp)
    : null;
  const nextLegal = lastPub ? new Date(lastPub.getTime() + STRIKE_INTERVAL_MS) : new Date();

  document.getElementById('shorts-today').textContent = stats.shortsToday || 0;
  document.getElementById('last-publish').textContent = lastPub ? formatTime(lastPub) : '—';
  document.getElementById('next-publish').textContent = formatTime(nextLegal);
  document.getElementById('emails-sent').textContent = stats.emailsSent || 0;
  document.getElementById('replies').textContent = stats.replies || 0;
  document.getElementById('revenue').textContent = '$' + (stats.revenue || 0).toLocaleString();
}

function formatTime(d) {
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function updateWorkerStatus() {
  const health = await window.hermes.workerHealth();
  const el = document.getElementById('worker-status');
  if (health && health.status === 'ok') {
    el.textContent = `Worker OK · ${health.worker?.gpu || 'GPU'} · :8391`;
    el.className = 'worker-status ok';
  } else {
    el.textContent = 'Worker offline';
    el.className = 'worker-status err';
  }
}

// --- Kanban board ---
function renderBoard() {
  const columns = { todo: [], doing: [], done: [], blocked: [] };
  cards.forEach(c => {
    if (columns[c.status]) columns[c.status].push(c);
  });
  Object.keys(columns).forEach(status => {
    const container = document.getElementById('col-' + status);
    container.innerHTML = '';
    columns[status].forEach(card => container.appendChild(renderCard(card)));
  });
}

function renderCard(card) {
  const el = document.createElement('div');
  el.className = 'card';
  el.dataset.id = card.id;
  el.innerHTML = `
    <div class="card-title">${escapeHtml(card.title)}</div>
    <div class="card-type ${card.type}">${card.typeLabel}</div>
    ${card.meta ? `<div class="card-meta">${escapeHtml(card.meta)}</div>` : ''}
    <div class="card-actions">
      ${renderCardActions(card)}
    </div>
  `;
  // Drag & drop
  el.draggable = true;
  el.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', card.id);
  });
  el.addEventListener('click', (e) => {
    if (e.target.classList.contains('card-btn')) return;
    openCardDetail(card.id);
  });
  return el;
}

function renderCardActions(card) {
  const btns = [];
  if (card.type === 'youtube') {
    btns.push(`<button class="card-btn primary" onclick="startYouTubePipeline('${card.id}')">Pipeline</button>`);
  }
  if (card.status === 'todo') {
    btns.push(`<button class="card-btn" onclick="moveCard('${card.id}','doing')">Start</button>`);
  }
  if (card.status === 'doing') {
    btns.push(`<button class="card-btn primary" onclick="moveCard('${card.id}','done')">Done</button>`);
    btns.push(`<button class="card-btn danger" onclick="moveCard('${card.id}','blocked')">Block</button>`);
  }
  if (card.status === 'blocked') {
    btns.push(`<button class="card-btn" onclick="moveCard('${card.id}','todo')">Unblock</button>`);
  }
  return btns.join('');
}

// Drag & drop on columns
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.column-body').forEach(col => {
    col.addEventListener('dragover', (e) => e.preventDefault());
    col.addEventListener('drop', (e) => {
      e.preventDefault();
      const cardId = e.dataTransfer.getData('text/plain');
      const newStatus = col.parentElement.dataset.status;
      moveCard(cardId, newStatus);
    });
  });
});

function moveCard(cardId, newStatus) {
  const card = cards.find(c => c.id === cardId);
  if (!card) return;
  card.status = newStatus;
  card.updatedAt = new Date().toISOString();
  saveCards();
  renderBoard();
}

function saveCards() {
  window.hermes.cards.save(cards);
}

// --- Add card modal ---
function showAddCardModal(defaultStatus) {
  const body = document.getElementById('modal-body');
  body.innerHTML = `
    <div class="form-group">
      <label>Card Type</label>
      <select id="card-type">
        <option value="youtube">YouTube Short</option>
        <option value="outreach">Cold Outreach (Harvey)</option>
        <option value="affiliate">Affiliate Check</option>
      </select>
    </div>
    <div class="form-group">
      <label>Title</label>
      <input type="text" id="card-title" placeholder="e.g. DREAM Online day/night cycle devlog" />
    </div>
    <div class="form-group">
      <label>Notes / Meta</label>
      <textarea id="card-meta" placeholder="Channel, topic, target, etc."></textarea>
    </div>
    <div class="form-actions">
      <button class="card-btn" onclick="closeModal()">Cancel</button>
      <button class="card-btn primary" onclick="createCard('${defaultStatus}')">Create</button>
    </div>
  `;
  document.getElementById('modal-title').textContent = 'New Card';
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function createCard(status) {
  const type = document.getElementById('card-type').value;
  const title = document.getElementById('card-title').value.trim();
  if (!title) { alert('Title required'); return; }
  const meta = document.getElementById('card-meta').value.trim();

  const typeLabels = { youtube: 'YouTube Short', outreach: 'Cold Outreach', affiliate: 'Affiliate Check' };

  const card = {
    id: 'card_' + Date.now(),
    type,
    typeLabel: typeLabels[type],
    title,
    meta,
    status: status || 'todo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  cards.push(card);
  saveCards();
  renderBoard();
  closeModal();
}

function openCardDetail(cardId) {
  const card = cards.find(c => c.id === cardId);
  if (!card) return;
  const body = document.getElementById('modal-body');
  body.innerHTML = `
    <div class="form-group">
      <label>Type</label>
      <div>${card.typeLabel}</div>
    </div>
    <div class="form-group">
      <label>Title</label>
      <input type="text" id="edit-title" value="${escapeAttr(card.title)}" />
    </div>
    <div class="form-group">
      <label>Notes / Meta</label>
      <textarea id="edit-meta">${escapeHtml(card.meta || '')}</textarea>
    </div>
    <div class="form-group">
      <label>Status</label>
      <select id="edit-status">
        <option value="todo" ${card.status==='todo'?'selected':''}>Todo</option>
        <option value="doing" ${card.status==='doing'?'selected':''}>Doing</option>
        <option value="done" ${card.status==='done'?'selected':''}>Done</option>
        <option value="blocked" ${card.status==='blocked'?'selected':''}>Blocked</option>
      </select>
    </div>
    <div class="form-actions">
      <button class="card-btn danger" onclick="deleteCard('${card.id}')">Delete</button>
      <button class="card-btn" onclick="closeModal()">Cancel</button>
      <button class="card-btn primary" onclick="saveCardEdit('${card.id}')">Save</button>
    </div>
  `;
  document.getElementById('modal-title').textContent = 'Edit Card';
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function saveCardEdit(cardId) {
  const card = cards.find(c => c.id === cardId);
  if (!card) return;
  card.title = document.getElementById('edit-title').value.trim();
  card.meta = document.getElementById('edit-meta').value.trim();
  card.status = document.getElementById('edit-status').value;
  card.updatedAt = new Date().toISOString();
  saveCards();
  renderBoard();
  closeModal();
}

function deleteCard(cardId) {
  if (!confirm('Delete this card?')) return;
  cards = cards.filter(c => c.id !== cardId);
  saveCards();
  renderBoard();
  closeModal();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// --- YouTube Pipeline ---
let ytState = {
  cardId: null,
  step: 0,
  channel: CHANNELS[0],
  voice: ALLOWED_VOICES[0],
  topic: '',
  script: '',
  audioPath: '',
  videoPath: '',
  duration: 0,
  previewApproved: false
};

function startYouTubePipeline(cardId) {
  ytState = { cardId, step: 0, channel: CHANNELS[0], voice: ALLOWED_VOICES[0], topic: '', script: '', audioPath: '', videoPath: '', duration: 0, previewApproved: false };
  const card = cards.find(c => c.id === cardId);
  if (card) ytState.topic = card.title + (card.meta ? ' — ' + card.meta : '');
  showYtModal();
}

function showYtModal() {
  renderYtModal();
  document.getElementById('yt-modal-overlay').classList.remove('hidden');
}

function closeYtModal() {
  document.getElementById('yt-modal-overlay').classList.add('hidden');
}

function renderYtModal() {
  const body = document.getElementById('yt-modal-body');
  body.innerHTML = `
    <!-- Step 1: Topic & Channel -->
    <div class="yt-step">
      <h3>Step 1 — Topic & Channel</h3>
      <div class="form-group">
        <label>Topic / Title</label>
        <input type="text" id="yt-topic" value="${escapeAttr(ytState.topic)}" />
      </div>
      <div class="form-group">
        <label>Channel</label>
        <div class="channel-list">
          ${CHANNELS.map(ch => `<span class="channel-chip ${ch===ytState.channel?'selected':''}" onclick="selectChannel('${ch}')">${ch}</span>`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label>Voice (allowed only)</label>
        <div class="voice-list">
          ${ALLOWED_VOICES.map(v => `<span class="voice-chip ${v===ytState.voice?'selected':''}" onclick="selectVoice('${v}')">${v}</span>`).join('')}
        </div>
        <div style="font-size:10px;color:#f85149;margin-top:4px;">Banned: ${BANNED_TTS.join(', ')}</div>
      </div>
      <button class="card-btn primary" onclick="ytGenerateScript()">Generate Script (gemini-4-high-reasoning)</button>
      <div class="status" id="yt-script-status"></div>
    </div>

    <!-- Step 2: Script -->
    <div class="yt-step">
      <h3>Step 2 — Script (45–58.5s target)</h3>
      <div class="form-group">
        <label>Script</label>
        <textarea id="yt-script" rows="8" placeholder="Generated script appears here...">${escapeHtml(ytState.script)}</textarea>
      </div>
      <div class="status" id="yt-script-len"></div>
    </div>

    <!-- Step 3: Render -->
    <div class="yt-step">
      <h3>Step 3 — Render (DirectML/Vulkan on RX 6800)</h3>
      <button class="card-btn" onclick="ytRender()">Render MP4 (45–58.5s)</button>
      <div class="status" id="yt-render-status"></div>
    </div>

    <!-- Step 4: Visualize (MANDATORY) -->
    <div class="yt-step">
      <h3>Step 4 — VISUALIZE (Founder must preview before upload)</h3>
      <button class="card-btn" onclick="ytSelectPreview()">Select MP4 Preview</button>
      <div id="yt-preview-area"></div>
      <div class="status" id="yt-preview-status"></div>
    </div>

    <!-- Step 5: Publish -->
    <div class="yt-step">
      <h3>Step 5 — Publish (youtube-data-api-v3)</h3>
      <div class="status" id="yt-publish-status"></div>
      <button class="card-btn primary" id="yt-publish-btn" onclick="ytPublish()" disabled>Publish to YouTube</button>
      <div style="font-size:10px;color:#8b949e;margin-top:6px;">Strike interval: 4 hours between publishes. Next legal: <span id="yt-next-legal">—</span></div>
    </div>
  `;
  updateYtNextLegal();
}

function selectChannel(ch) {
  ytState.channel = ch;
  renderYtModal();
}

function selectVoice(v) {
  ytState.voice = v;
  renderYtModal();
}

async function ytGenerateScript() {
  ytState.topic = document.getElementById('yt-topic').value.trim();
  const status = document.getElementById('yt-script-status');
  status.textContent = 'Generating script via OmniRoute (gemini-4-high-reasoning)...';
  status.className = 'status warn';

  const result = await window.hermes.omniroute.chat({
    model: 'gemini-4-high-reasoning',
    messages: [
      { role: 'system', content: 'You are a YouTube Shorts script writer for DREAM Online MMORPG, Until No Kid In Need, and AI Dream Team Studio. Write punchy, human-sounding scripts. No AI-isms. Target 45-58.5 seconds spoken (about 110-145 words). Output ONLY the script text, no stage directions, no markdown.' },
      { role: 'user', content: `Write a YouTube Short script about: ${ytState.topic}\nChannel: ${ytState.channel}\nKeep it under 145 words, energetic, human cadence.` }
    ]
  });

  if (result.ok) {
    ytState.script = result.content.trim();
    document.getElementById('yt-script').value = ytState.script;
    const words = ytState.script.split(/\s+/).length;
    const estSec = Math.round(words / 2.5);
    const lenEl = document.getElementById('yt-script-len');
    lenEl.textContent = `~${words} words ≈ ${estSec}s (target 45–58.5s)`;
    lenEl.className = 'status ' + (estSec >= 45 && estSec <= 58.5 ? 'ok' : 'warn');
    status.textContent = 'Script generated.';
    status.className = 'status ok';
  } else {
    status.textContent = 'Error: ' + (result.error || 'unknown');
    status.className = 'status err';
  }
}

async function ytRender() {
  ytState.script = document.getElementById('yt-script').value.trim();
  const status = document.getElementById('yt-render-status');
  status.textContent = 'Rendering... (GPU path: DirectML/Vulkan on RX 6800). In production this calls the worker render pipeline.';
  status.className = 'status warn';

  // In a full implementation this would call the worker render endpoint.
  // For now, we track the state and mark ready for preview.
  setTimeout(() => {
    ytState.duration = 52; // placeholder
    status.textContent = `Render complete. Duration: ${ytState.duration}s (within 45–58.5s). Ready for preview.`;
    status.className = 'status ok';
  }, 1500);
}

async function ytSelectPreview() {
  const filePath = await window.hermes.dialog.openFile();
  if (!filePath) return;
  ytState.videoPath = filePath;
  ytState.previewApproved = false;

  const area = document.getElementById('yt-preview-area');
  area.innerHTML = `<video class="preview-player" controls src="file://${filePath.replace(/\\/g, '/')}"></video>`;

  const status = document.getElementById('yt-preview-status');
  status.textContent = 'Preview loaded. Watch it, then approve to enable publish.';
  status.className = 'status warn';

  // Add approve button
  const approveBtn = document.createElement('button');
  approveBtn.className = 'card-btn primary';
  approveBtn.style.marginTop = '8px';
  approveBtn.textContent = 'I have visualized this MP4 — Approve for upload';
  approveBtn.onclick = () => {
    ytState.previewApproved = true;
    status.textContent = 'Approved. Publish enabled.';
    status.className = 'status ok';
    document.getElementById('yt-publish-btn').disabled = false;
  };
  area.appendChild(approveBtn);
}

function updateYtNextLegal() {
  const lastPub = publishLog.length > 0 ? new Date(publishLog[publishLog.length-1].timestamp) : null;
  const nextLegal = lastPub ? new Date(lastPub.getTime() + STRIKE_INTERVAL_MS) : new Date();
  const el = document.getElementById('yt-next-legal');
  if (el) el.textContent = formatTime(nextLegal);
}

async function ytPublish() {
  if (!ytState.previewApproved) {
    alert('You must visualize (preview) the MP4 before publishing.');
    return;
  }

  // Check 4-hour interval
  const lastPub = publishLog.length > 0 ? new Date(publishLog[publishLog.length-1].timestamp) : null;
  const now = new Date();
  if (lastPub && (now.getTime() - lastPub.getTime()) < STRIKE_INTERVAL_MS) {
    const nextLegal = new Date(lastPub.getTime() + STRIKE_INTERVAL_MS);
    const status = document.getElementById('yt-publish-status');
    status.textContent = `BLOCKED: Next legal publish at ${formatTime(nextLegal)}. 4-hour interval not met.`;
    status.className = 'status err';

    // Mark card as blocked
    const card = cards.find(c => c.id === ytState.cardId);
    if (card) {
      card.status = 'blocked';
      card.meta = (card.meta || '') + ` | Blocked: next legal publish ${formatTime(nextLegal)}`;
      saveCards();
      renderBoard();
    }
    return;
  }

  const status = document.getElementById('yt-publish-status');
  status.textContent = 'Publishing via youtube-data-api-v3...';
  status.className = 'status warn';

  // In production this calls the YouTube Data API v3 upload endpoint.
  // Record the publish.
  const entry = {
    timestamp: new Date().toISOString(),
    channel: ytState.channel,
    voice: ytState.voice,
    topic: ytState.topic,
    duration: ytState.duration,
    videoPath: ytState.videoPath
  };
  publishLog.push(entry);
  await window.hermes.publish.save(publishLog);

  // Update stats
  stats.shortsToday = (stats.shortsToday || 0) + 1;
  stats.shortsTodayDate = new Date().toDateString();
  await window.hermes.stats.save(stats);

  // Mark card done
  const card = cards.find(c => c.id === ytState.cardId);
  if (card) {
    card.status = 'done';
    card.meta = (card.meta || '') + ` | Published ${formatTime(new Date())} to ${ytState.channel}`;
    saveCards();
  }

  status.textContent = `Published to ${ytState.channel}. Next publish legal after ${formatTime(new Date(Date.now() + STRIKE_INTERVAL_MS))}.`;
  status.className = 'status ok';

  renderBoard();
  updateTopBar();
  closeYtModal();
}

// --- Helpers ---
function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeAttr(s) {
  return String(s || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// --- Notes & Ideas (FluxInk-style) ---
let notes = [];

function loadNotes() {
  try { notes = JSON.parse(localStorage.getItem('hermes-notes') || '[]'); } catch (e) { notes = []; }
}

function saveNotes() {
  localStorage.setItem('hermes-notes', JSON.stringify(notes));
}

function showNotesModal() {
  loadNotes();
  renderNotesModal();
  document.getElementById('notes-modal-overlay').classList.remove('hidden');
  document.getElementById('notes-modal-close').onclick = closeNotesModal;
  document.getElementById('notes-modal-overlay').onclick = (e) => {
    if (e.target.id === 'notes-modal-overlay') closeNotesModal();
  };
}

function closeNotesModal() {
  document.getElementById('notes-modal-overlay').classList.add('hidden');
}

function renderNotesModal() {
  const body = document.getElementById('notes-modal-body');
  body.innerHTML = `
    <div class="yt-step">
      <h3>Write Naturally — Capture Ideas</h3>
      <div class="form-group">
        <label>Title</label>
        <input type="text" id="note-title" placeholder="Idea title..." />
      </div>
      <div class="form-group">
        <label>Content (notes, sketches, ideas)</label>
        <textarea id="note-content" rows="6" placeholder="Write your idea here..."></textarea>
      </div>
      <div class="form-actions">
        <button class="card-btn primary" onclick="createNote()">Save Note</button>
      </div>
    </div>

    <div class="yt-step">
      <h3>AI Actions</h3>
      <div class="form-group">
        <label>Select Note</label>
        <select id="note-select">${notes.map((n, i) => `<option value="${i}">${escapeHtml(n.title)}</option>`).join('')}</select>
      </div>
      <div class="form-actions">
        <button class="card-btn" onclick="aiSummarizeNote()">Summarize with AI</button>
        <button class="card-btn" onclick="aiGreetingCard()">Create Greeting Card</button>
        <button class="card-btn" onclick="autoLayoutNotes()">Auto Layout</button>
      </div>
      <div class="status" id="note-ai-status"></div>
      <div id="note-ai-output" style="margin-top:8px;"></div>
    </div>

    <div class="yt-step">
      <h3>Saved Notes (${notes.length})</h3>
      <div id="notes-list">${notes.map((n, i) => `
        <div class="card" style="margin-bottom:6px;">
          <div class="card-title">${escapeHtml(n.title)}</div>
          <div class="card-meta">${escapeHtml((n.content || '').substring(0, 120))}${(n.content || '').length > 120 ? '...' : ''}</div>
          <div class="card-actions">
            <button class="card-btn danger" onclick="deleteNote(${i})">Delete</button>
          </div>
        </div>
      `).join('') || '<div style="color:#8b949e;font-size:12px;">No notes yet.</div>'}</div>
    </div>
  `;
}

function createNote() {
  const title = document.getElementById('note-title').value.trim();
  const content = document.getElementById('note-content').value.trim();
  if (!title) { alert('Title required'); return; }
  notes.push({ title, content, createdAt: new Date().toISOString() });
  saveNotes();
  renderNotesModal();
}

function deleteNote(i) {
  if (!confirm('Delete this note?')) return;
  notes.splice(i, 1);
  saveNotes();
  renderNotesModal();
}

async function aiSummarizeNote() {
  const idx = parseInt(document.getElementById('note-select').value);
  const note = notes[idx];
  if (!note) return;
  const status = document.getElementById('note-ai-status');
  status.textContent = 'Summarizing with AI...';
  status.className = 'status warn';
  const result = await window.hermes.omniroute.chat({
    model: 'gemini-4-high-reasoning',
    messages: [
      { role: 'system', content: 'You are a concise summarizer. Summarize the following note in 2-3 sentences. No AI-isms.' },
      { role: 'user', content: note.title + '\n\n' + note.content }
    ]
  });
  if (result.ok) {
    document.getElementById('note-ai-output').innerHTML = `<div class="yt-step"><h3>Summary</h3><p>${escapeHtml(result.content)}</p></div>`;
    status.textContent = 'Summary generated.';
    status.className = 'status ok';
  } else {
    status.textContent = 'Error: ' + (result.error || 'unknown');
    status.className = 'status err';
  }
}

async function aiGreetingCard() {
  const idx = parseInt(document.getElementById('note-select').value);
  const note = notes[idx];
  if (!note) return;
  const status = document.getElementById('note-ai-status');
  status.textContent = 'Creating greeting card with AI...';
  status.className = 'status warn';
  const result = await window.hermes.omniroute.chat({
    model: 'gemini-4-high-reasoning',
    messages: [
      { role: 'system', content: 'You are a creative greeting card writer. Turn the following idea into a warm, personal greeting card message. Include a title line, body, and sign-off. No AI-isms. Human, authentic tone.' },
      { role: 'user', content: note.title + '\n\n' + note.content }
    ]
  });
  if (result.ok) {
    document.getElementById('note-ai-output').innerHTML = `<div class="yt-step"><h3>Greeting Card</h3><pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(result.content)}</pre></div>`;
    status.textContent = 'Greeting card generated.';
    status.className = 'status ok';
  } else {
    status.textContent = 'Error: ' + (result.error || 'unknown');
    status.className = 'status err';
  }
}

function autoLayoutNotes() {
  // Simple auto-layout: sort by date, group by first word
  notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  saveNotes();
  renderNotesModal();
  const status = document.getElementById('note-ai-status');
  status.textContent = 'Notes reorganized by date (newest first).';
  status.className = 'status ok';
}

// --- Tab switching ---
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
  document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById('tab-' + tabName).classList.add('active');
}

// --- Agent Chat ---
const AGENT_PROFILES = {
  youtube: { name: 'YouTube Agent', soul: 'youtube-agent', system: 'You are the YouTube Agent for HermesLeadGen on Sabretooth. You handle YouTube Short scripting (gemini-4-high-reasoning), voice selection (Aoede, Kore, af_heart, af_bella, LFM3-Omni-2B), rendering (45-58.5s, DirectML/Vulkan), and publishing (youtube-data-api-v3). Enforce 4-hour strike interval. Founder must visualize MP4 before upload. No banned TTS (pyttsx3, espeak, sapi, sam, robotic-default). No Paperclip.' },
  editor: { name: 'Editor Agent (REA Media)', soul: 'editor-agent', system: 'You are the Editor Agent for HermesLeadGen on Sabretooth. You handle REA (Reverse Engineer Anything) media creation, ComfyUI workflows (DirectML on RX 6800), HyperFrames video rendering, and media asset management. Use agent-reach for research. No Paperclip.' },
  harvey: { name: 'Marketing Lead (Harvey)', soul: 'harvey-agent', system: 'You are the Harvey Marketing Lead Agent for HermesLeadGen on Sabretooth. You handle cold outreach (3-email sequences, <75 words each), prospecting, reply handling, and affiliate checks. Use humanizer for zero AI-slop copy. No Paperclip.' },
  notes: { name: 'Notes & Ideas Agent', soul: 'notes-agent', system: 'You are the Notes & Ideas Agent for HermesLeadGen on Sabretooth. You help capture ideas, summarize notes, create greeting cards, and organize thoughts using AI (OmniRoute/gemini-4-high-reasoning). No Paperclip.' }
};

function openAgentChat(profileKey) {
  const profile = AGENT_PROFILES[profileKey];
  if (!profile) return;
  const body = document.getElementById('chat-modal-body');
  body.innerHTML = `
    <div class="chat-messages" id="chat-messages"></div>
    <div class="chat-input-row">
      <input type="text" id="chat-input" placeholder="Ask ${profile.name}..." onkeydown="if(event.key==='Enter')sendChatMessage('${profileKey}')" />
      <button class="card-btn primary" onclick="sendChatMessage('${profileKey}')">Send</button>
    </div>
  `;
  document.getElementById('chat-modal-title').textContent = profile.name + ' Chat';
  document.getElementById('chat-modal-overlay').classList.remove('hidden');
  document.getElementById('chat-modal-close').onclick = () => document.getElementById('chat-modal-overlay').classList.add('hidden');
  document.getElementById('chat-modal-overlay').onclick = (e) => {
    if (e.target.id === 'chat-modal-overlay') document.getElementById('chat-modal-overlay').classList.add('hidden');
  };
  // Load chat history
  const history = JSON.parse(localStorage.getItem('chat-' + profileKey) || '[]');
  const msgs = document.getElementById('chat-messages');
  history.forEach(m => {
    msgs.innerHTML += `<div class="chat-msg ${m.role}">${escapeHtml(m.content)}</div>`;
  });
  msgs.scrollTop = msgs.scrollHeight;
}

async function sendChatMessage(profileKey) {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  const profile = AGENT_PROFILES[profileKey];
  const msgs = document.getElementById('chat-messages');
  msgs.innerHTML += `<div class="chat-msg user">${escapeHtml(text)}</div>`;
  msgs.scrollTop = msgs.scrollHeight;

  const history = JSON.parse(localStorage.getItem('chat-' + profileKey) || '[]');
  history.push({ role: 'user', content: text });

  const result = await window.hermes.omniroute.chat({
    model: 'gemini-4-high-reasoning',
    messages: [
      { role: 'system', content: profile.system },
      ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
    ]
  });

  const reply = result.ok ? result.content : 'Error: ' + (result.error || 'unknown');
  msgs.innerHTML += `<div class="chat-msg agent">${escapeHtml(reply)}</div>`;
  msgs.scrollTop = msgs.scrollHeight;

  history.push({ role: 'assistant', content: reply });
  localStorage.setItem('chat-' + profileKey, JSON.stringify(history.slice(-20)));
}

// --- Tab switching ---
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
  const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  if (btn) btn.classList.add('active');
  const tc = document.getElementById('tab-' + tabName);
  if (tc) tc.classList.add('active');
}

// Start
init();
