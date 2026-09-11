// Hermes AI — voice assistant for the dashboard
// Architecture adapted from bilawalsidhu/gods-eye-view src/voice/ (MIT):
//   - status machine (OFF/CONNECTING/LISTENING/EXECUTING/ERROR)
//   - push-to-talk pattern
// But: uses browser Web Speech API (SpeechRecognition + speechSynthesis)
// instead of OpenAI Realtime, and OmniRoute for the brain. Zero credentials.

const OMNI = 'http://127.0.0.1:20128/v1';
const STATUS = { idle: 'OFF', listening: 'LISTENING', thinking: 'THINKING', speaking: 'SPEAKING', error: 'ERROR' };

const hermesVoice = {
  status: 'idle',
  recognition: null,
  history: [
    { role: 'system', content: 'You are Hermes, the AI running this dashboard. Be concise — answers are spoken aloud, keep them under 3 sentences unless asked for detail. You can discuss the dashboard tabs (agents, knowledge graph, 3D avatar, widgets, scenes, image gen, video gen, mission control), OmniRoute models, and general questions.' },
  ],
};

function vEl(id) { return document.getElementById(id); }

function setStatus(s) {
  hermesVoice.status = s;
  const badge = vEl('hermes-voice-status');
  if (badge) {
    badge.textContent = STATUS[s] || s;
    badge.className = 'voice-status voice-status-' + s;
  }
}

function voiceLog(who, text) {
  const log = vEl('hermes-voice-log');
  if (!log) return;
  const div = document.createElement('div');
  div.className = 'chat-msg ' + (who === 'you' ? 'user' : 'assistant');
  div.textContent = (who === 'you' ? 'You: ' : 'Hermes: ') + text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function speak(text) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve();
    setStatus('speaking');
    const u = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    // Prefer a natural en-US voice
    u.voice = voices.find(v => /en-US/i.test(v.lang) && /natural|neural|aria|jenny|guy/i.test(v.name))
      || voices.find(v => /en-US/i.test(v.lang))
      || voices[0] || null;
    u.rate = 1.05;
    u.onend = () => { setStatus('idle'); resolve(); };
    u.onerror = () => { setStatus('idle'); resolve(); };
    speechSynthesis.speak(u);
  });
}

async function askHermes(text) {
  voiceLog('you', text);
  setStatus('thinking');
  hermesVoice.history.push({ role: 'user', content: text });
  // Keep history bounded (system + last 12 turns)
  if (hermesVoice.history.length > 13) {
    hermesVoice.history = [hermesVoice.history[0], ...hermesVoice.history.slice(-12)];
  }
  try {
    const res = await fetch(`${OMNI}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'auto/best-fast', messages: hermesVoice.history, stream: false }),
    });
    if (!res.ok) throw new Error(`OmniRoute ${res.status}`);
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'No response.';
    hermesVoice.history.push({ role: 'assistant', content: reply });
    voiceLog('hermes', reply);
    await speak(reply);
  } catch (e) {
    setStatus('error');
    voiceLog('hermes', 'Error: ' + e.message);
    setTimeout(() => setStatus('idle'), 2000);
  }
}

function startListening() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    voiceLog('hermes', 'Speech recognition not supported in this browser. Use Chrome/Edge, or type below.');
    return;
  }
  if (hermesVoice.recognition) { hermesVoice.recognition.stop(); hermesVoice.recognition = null; setStatus('idle'); return; }
  const rec = new SR();
  rec.lang = 'en-US';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onstart = () => setStatus('listening');
  rec.onresult = (e) => {
    const text = e.results[0][0].transcript;
    hermesVoice.recognition = null;
    askHermes(text);
  };
  rec.onerror = (e) => {
    hermesVoice.recognition = null;
    setStatus('error');
    voiceLog('hermes', 'Mic error: ' + e.error);
    setTimeout(() => setStatus('idle'), 2000);
  };
  rec.onend = () => { if (hermesVoice.status === 'listening') setStatus('idle'); hermesVoice.recognition = null; };
  hermesVoice.recognition = rec;
  rec.start();
}

function initHermesVoice() {
  vEl('hermes-voice-mic')?.addEventListener('click', startListening);
  const input = vEl('hermes-voice-input');
  const send = vEl('hermes-voice-send');
  const submit = () => { const t = input.value.trim(); if (t) { input.value = ''; askHermes(t); } };
  send?.addEventListener('click', submit);
  input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  vEl('hermes-voice-stop')?.addEventListener('click', () => { speechSynthesis.cancel(); setStatus('idle'); });
  // Warm the voice list (Chrome loads async)
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
  setStatus('idle');
}

document.addEventListener('DOMContentLoaded', initHermesVoice);

export { hermesVoice, askHermes, speak, startListening, initHermesVoice, setStatus, STATUS };
