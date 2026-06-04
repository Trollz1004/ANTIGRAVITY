const form = document.getElementById('ask-form');
const previews = document.getElementById('previews');
const sessionsEl = document.getElementById('sessions');
const modelEl = document.getElementById('model');
const tempEl = document.getElementById('temp');

function addCard(title, body) {
  const el = document.createElement('div');
  el.className = 'card';
  const h = document.createElement('h3');
  h.textContent = title;
  const p = document.createElement('p');
  p.textContent = body;
  el.appendChild(h);
  el.appendChild(p);
  previews.prepend(el);
}

async function populateModels() {
  try {
    const res = await fetch('/models');
    const data = await res.json();
    modelEl.innerHTML = '';
    (data.models || []).forEach(name => {
      const opt = document.createElement('option');
      opt.value = name; opt.textContent = name;
      modelEl.appendChild(opt);
    });
  } catch {}
}

async function populateSessions() {
  try {
    const res = await fetch('/sessions');
    const data = await res.json();
    sessionsEl.innerHTML = '';
    (data.sessions || []).forEach(s => {
      const div = document.createElement('div');
      div.className = 'session-item';
      div.innerHTML = `<div><strong>${s.id}</strong></div><div class="meta">${s.last || ''}</div>`;
      div.addEventListener('click', async () => {
        document.getElementById('session').value = s.id;
        const r = await fetch(`/sessions/${encodeURIComponent(s.id)}`);
        const d = await r.json();
        addCard(`Loaded ${s.id}`, (d.messages || []).map(m => `${m.role}: ${m.content}`).join('\n\n').slice(-2000));
      });
      sessionsEl.appendChild(div);
    });
  } catch {}
}

document.getElementById('new-session').addEventListener('click', () => {
  const id = 'sess-' + Math.random().toString(36).slice(2, 8);
  document.getElementById('session').value = id;
  addCard('New Session', id);
});

document.getElementById('refresh-sessions').addEventListener('click', populateSessions);

document.getElementById('clear-sessions').addEventListener('click', async () => {
  if (!confirm('Delete all sessions?')) return;
  await fetch('/sessions', { method: 'DELETE' });
  populateSessions();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const session = document.getElementById('session').value.trim() || 'dashboard';
  const system = document.getElementById('system').value.trim();
  const message = document.getElementById('message').value.trim();
  if (!message) return;

  const cardTitle = `Preview (${modelEl.value || 'model'})`;
  addCard(cardTitle, '');
  const card = previews.firstChild;
  card.querySelector('h3').textContent = cardTitle;
  const p = card.querySelector('p');
  p.textContent = '';

  try {
    const resp = await fetch('/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: session, message, system_prompt: system || undefined, temperature: parseFloat(tempEl.value), model: modelEl.value || undefined })
    });
    if (!resp.ok || !resp.body) {
      const t = await resp.text();
      addCard('Error', `${resp.status}: ${t}`);
      return;
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      p.textContent += text;
    }
    document.getElementById('message').value = '';
    populateSessions();
  } catch (err) {
    addCard('Error', String(err));
  }
});

// Init
populateModels();
populateSessions();
