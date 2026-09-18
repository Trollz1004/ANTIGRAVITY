// Hermes AI — voice assistant for the dashboard
// Architecture adapted from bilawalsidhu/gods-eye-view src/voice/ (MIT):
//   - status machine (OFF/CONNECTING/LISTENING/EXECUTING/ERROR)
//   - push-to-talk pattern
// Uses browser Web Speech API (SpeechRecognition + speechSynthesis) and the
// named Hermes CLI bridge, so replies use Hermes Desktop's configured model.

import { streamHermes } from './jarvis/claude-bridge.js';
import {
  resolveSpeakVoice,
  applyPickToUtterance,
  populateVoiceSelect,
  setStoredVoiceURI,
  getLocalPack,
  setLocalPack,
} from './jarvis/voice-picker.js';

const LOCAL_PACK_URL = '/api/voices/local-pack.json'; // served by server.mjs (or any static path)

const STATUS = { idle: 'OFF', listening: 'LISTENING', thinking: 'THINKING', speaking: 'SPEAKING', error: 'ERROR' };

const hermesVoice = {
  status: 'idle',
  recognition: null,
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
    u.voice = resolveSpeakVoice(voices, { preferLocal: !!getLocalPack() }) || null;
    applyPickToUtterance(u);
    u.rate = 1.05;
    u.onend = () => { setStatus('idle'); resolve(); };
    u.onerror = () => { setStatus('idle'); resolve(); };
    speechSynthesis.speak(u);
  });
}

async function askHermes(text) {
  voiceLog('you', text);
  setStatus('thinking');
  try {
    const result = await streamHermes({ prompt: text, session: 'jarvis-hud' });
    const reply = result.text || 'No response.';
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

  // Voice picker wiring
  const select = vEl('hermes-voice-select');
  const localToggle = vEl('hermes-voice-local');
  const dlBtn = vEl('hermes-voice-download');
  const populate = () => populateVoiceSelect(select, { preferLocal: !!localToggle?.checked });
  if (select) {
    populate();
    select.addEventListener('change', () => {
      setStoredVoiceURI(select.value || null);
      voiceLog('hermes', select.value ? 'Voice set: ' + (select.selectedOptions[0]?.textContent || select.value) : 'Voice cleared (using default)');
    });
    if ('speechSynthesis' in window) speechSynthesis.addEventListener?.('voiceschanged', populate);
  }
  if (localToggle) {
    localToggle.checked = !!getLocalPack();
    localToggle.addEventListener('change', () => { populate(); voiceLog('hermes', localToggle.checked ? 'Filtering to local pack' : 'Showing all voices'); });
  }
  if (dlBtn) {
    dlBtn.addEventListener('click', async () => {
      dlBtn.disabled = true; const prev = dlBtn.textContent; dlBtn.textContent = 'Downloading…';
      try {
        const res = await fetch(LOCAL_PACK_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const pack = await res.json();
        if (!pack || !Array.isArray(pack.voices)) throw new Error('Invalid pack shape');
        setLocalPack(pack); voiceLog('hermes', `Local pack loaded: ${pack.voices.length} voice(s)`);
        if (localToggle && !localToggle.checked) localToggle.checked = true;
        populate();
      } catch (e) {
        voiceLog('hermes', 'Local pack download failed: ' + e.message);
      } finally {
        dlBtn.disabled = false; dlBtn.textContent = prev;
      }
    });
  }

  // Warm the voice list (Chrome loads async)
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
  setStatus('idle');
}

document.addEventListener('DOMContentLoaded', initHermesVoice);

export { hermesVoice, askHermes, speak, startListening, initHermesVoice, setStatus, STATUS };
