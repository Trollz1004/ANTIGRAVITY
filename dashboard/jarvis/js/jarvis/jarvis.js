/*══════════════════════════════════════════════════════════════════════════════
  JARVIS — Just A Rather Very Intelligent System
  Ironman-style HUD for the Hermes Dashboard
  
  Features:
  - Voice interaction (Web Speech API + OmniRoute brain)
  - Rotating HUD rings with live stack data
  - Customizable panels (drag to rearrange)
  - Live service status, agent feed, knowledge graph stats
  - Text + voice input
  
  Inspired by: Ironman's JARVIS, God's Eye View (bilawalsidhu)
 ══════════════════════════════════════════════════════════════════════════════*/

import { createGlobe } from './globe.js';
import { loadAvatar, DEFAULT_AVATAR_URL } from './avatar.js';
import { getBridgeStatus, streamClaude, streamOllama, streamHermes } from './claude-bridge.js';
import { createPushToTalk, naturalCase, REST_MS, selectFemaleVoice } from './voice.js';
import { greetingFor, installShortcuts } from './shortcuts.js';

// All OmniRoute calls go through the server proxy — key stays server-side.
const OMNI = '/api/omni';
export const BRAINS = ['omni', 'claude', 'ollama', 'hermes'];

// ── State ────────────────────────────────────────────────────────────────────

const jarvis = {
  state: 'idle', // idle | listening | thinking | speaking
  brain: 'omni',
  ownerName: '',
  claude: { sessionId: '' },
  history: [
    { role: 'system', content: `You are JARVIS — the AI assistant embedded in this dashboard. 
You have a dry wit and loyalty to your operator. Keep answers short enough to display on a HUD panel (under 4 sentences).
You can discuss: system status, agents, the knowledge graph, avatar rendering, OmniRoute models, and any task assigned.
Current capabilities: voice chat, service monitoring, agent dispatch, image generation, web search.` },
  ],
  panels: [],
  metrics: {
    services: { up: 0, total: 0 },
    agents: 0,
    graphNodes: 0,
    omniModels: 0,
  },
  initialized: false,
};

// ── HUD Ring Renderer ────────────────────────────────────────────────────────

function createHudRing(container, segments, radius, thickness) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', (radius + thickness) * 2);
  svg.setAttribute('height', (radius + thickness) * 2);
  svg.setAttribute('viewBox', `0 0 ${(radius + thickness) * 2} ${(radius + thickness) * 2}`);
  svg.style.position = 'absolute';
  svg.style.top = '50%';
  svg.style.left = '50%';
  svg.style.transform = 'translate(-50%, -50%)';
  
  const circumference = 2 * Math.PI * radius;
  
  segments.forEach((seg, i) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const offset = (seg.offset / 100) * circumference;
    const dash = (seg.length / 100) * circumference;
    
    circle.setAttribute('cx', radius + thickness);
    circle.setAttribute('cy', radius + thickness);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', seg.color);
    circle.setAttribute('stroke-width', thickness);
    circle.setAttribute('stroke-dasharray', `${dash} ${circumference - dash}`);
    circle.setAttribute('stroke-dashoffset', -offset);
    circle.setAttribute('opacity', seg.active ? 1 : 0.15);
    circle.style.transition = 'all 0.6s ease';
    
    if (seg.animate) {
      circle.style.animation = `spin${i} ${seg.animate}s linear infinite`;
      const style = document.createElement('style');
      style.textContent = `@keyframes spin${i} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
      svg.appendChild(style);
    }
    
    svg.appendChild(circle);
  });
  
  container.appendChild(svg);
  return svg;
}

// ── Voice Engine ─────────────────────────────────────────────────────────────

const browserSpeech = {
  recognition: null,
  onresult: null,
  onend: null,

  start() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return false;
    if (!this.recognition) {
      const recognition = new Recognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => this.onresult?.(event);
      recognition.onend = () => this.onend?.();
      this.recognition = recognition;
    }
    try { this.recognition.start(); } catch {}
    return true;
  },

  stop() {
    try { this.recognition?.stop(); } catch {}
  },

  cancelSpeaking() {
    window.speechSynthesis?.cancel();
  },
};

let pushToTalk = null;
let restTimer = null;
let conversationStartedAt = null;

function setConversationPanel(live) {
  const container = document.querySelector('.jarvis-hud-container');
  const stop = document.getElementById('jarvis-conv-stop');
  container?.classList?.toggle('jarvis-conversing', live);
  if (stop) stop.hidden = !live;
}

function setConversationRowsVisible(visible) {
  document.querySelectorAll('.jarvis-msg').forEach((row) => {
    row.hidden = !visible;
    if (visible) row.removeAttribute?.('hidden');
    else row.setAttribute?.('hidden', '');
  });
}

function beginConversationHud() {
  if (!conversationStartedAt) {
    conversationStartedAt = Date.now();
    document.querySelectorAll('.jarvis-msg').forEach((row) => {
      const timestamp = Number(row.getAttribute?.('data-ts') || 0);
      if (timestamp < conversationStartedAt) {
        row.hidden = true;
        row.setAttribute?.('hidden', '');
      }
    });
  }
  if (restTimer) clearTimeout(restTimer);
  restTimer = null;
  setConversationPanel(true);
}

function setVoiceHudState(state, live) {
  const globe = document.getElementById('jarvis-globe');
  if (!live) return;
  beginConversationHud();
  if (globe) globe.style.pointerEvents = 'auto';
  if (state === 'listening' || state === 'latched') setState('listening');
}

function restVoiceHud(reason) {
  if (reason === 'unavailable') {
    jarvisLog('JARVIS', 'Speech recognition requires Chrome or Edge. Use the text input below.');
  }
  conversationStartedAt = null;
  if (restTimer) clearTimeout(restTimer);
  restTimer = setTimeout(() => {
    if (pushToTalk?.isLive()) return;
    const interim = document.getElementById('jarvis-interim');
    const globe = document.getElementById('jarvis-globe');
    if (interim) interim.textContent = '';
    if (globe) globe.style.pointerEvents = 'none';
    setConversationPanel(false);
    setConversationRowsVisible(true);
    setState('idle');
  }, REST_MS);
}

function getPushToTalk() {
  if (pushToTalk) return pushToTalk;
  pushToTalk = createPushToTalk({
    globeEl: document.getElementById('jarvis-globe'),
    speech: browserSpeech,
    onState: setVoiceHudState,
    onInterim: (text) => {
      const interim = document.getElementById('jarvis-interim');
      if (interim) interim.textContent = text;
    },
    onStop: restVoiceHud,
    onTurn: async (text) => {
      const interim = document.getElementById('jarvis-interim');
      if (interim) interim.textContent = '';
      await askJarvis(text);
    },
  });
  return pushToTalk;
}

const jarvisVoice = {
  get recognition() { return browserSpeech.recognition; },

  speak(text) {
    return new Promise((resolve) => {
      const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
      if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return resolve();
      setState('speaking');
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        getPushToTalk().resume();
        if (!getPushToTalk().isLive()) setState('idle');
        resolve();
      };
      // Muted, voiceless or headless browsers never fire onend: resolve on a timer sized to the text.
      const timer = setTimeout(finish, Math.min(20000, 1500 + String(text || '').length * 60));
      // Recognition is stopped while replies play; it resumes only after the reply ends or a user interrupt.
      getPushToTalk().pause();
      const u = new SpeechSynthesisUtterance(naturalCase(text));
      const voices = synth.getVoices ? synth.getVoices() : [];
      u.voice = selectFemaleVoice(voices);
      u.rate = 1.05;
      u.pitch = 1.05;
      u.onend = finish;
      u.onerror = finish;
      try { synth.speak(u); } catch { finish(); }
    });
  },
  
  startListening() { return getPushToTalk().tap() },
  
  stop() {
    browserSpeech.cancelSpeaking();
    getPushToTalk().end('stop');
    fetch('/api/claude/stop', { method: 'POST' }).catch(() => {});
  }
};

// ── Brain selection and replies ─────────────────────────────────────────────

function brainAvailable(id, status) {
  if (id === 'omni') return true;
  if (id === 'claude') return Boolean(status?.claude?.installed && status.claude.access?.ok);
  if (id === 'ollama') return Boolean(status?.ollama?.available && status.ollama.models?.length);
  if (id === 'hermes') return Boolean(status?.hermes?.installed && status.hermes.access?.ok);
  return false;
}

function brainUnavailableReason(id, status) {
  if (id === 'claude') return status?.claude?.access?.reason || 'Claude CLI bridge unavailable';
  if (id === 'ollama') return status?.ollama?.available ? 'No local Ollama model installed' : 'Ollama unavailable';
  if (id === 'hermes') return status?.hermes?.access?.reason || 'Hermes bridge unavailable';
  return '';
}

function setBrain(id) {
  if (!BRAINS.includes(id)) return false;
  jarvis.brain = id;
  try { if (typeof localStorage !== 'undefined') localStorage.setItem('jarvis.brain', id); } catch {}
  const select = document.getElementById('jarvis-brain');
  if (select) select.value = id;
  const status = document.getElementById('jarvis-brain-status');
  if (status) status.textContent = id.toUpperCase();
  return true;
}

function greetBrain(id) {
  if (!setBrain(id)) return;
  const greeting = greetingFor(id, jarvis.ownerName);
  jarvisLog('JARVIS', greeting);
  void jarvisVoice.speak(greeting);
}

function pickDefaultBrain(status = {}, stored) {
  if (BRAINS.includes(stored) && brainAvailable(stored, status)) return stored;
  if (brainAvailable('claude', status)) return 'claude';
  if (brainAvailable('ollama', status)) return 'ollama';
  return 'omni';
}

function addStreamRow() {
  const log = document.getElementById('jarvis-log');
  if (!log) return { row: null, body: null };
  const row = document.createElement('div');
  row.className = 'jarvis-msg jarvis-msg-jarvis jarvis-msg-stream';
  row.setAttribute('data-ts', Date.now());
  const name = document.createElement('span');
  name.className = 'jarvis-msg-name';
  name.textContent = 'JARVIS';
  const body = document.createElement('span');
  row.appendChild(name);
  row.appendChild(body);
  log.appendChild(row);
  return { row, body };
}

function addToolRow(name) {
  const log = document.getElementById('jarvis-log');
  if (!log) return;
  const row = document.createElement('div');
  row.className = 'jarvis-msg-tool';
  row.textContent = `Tool: ${name}`;
  log.appendChild(row);
}

function appendReply(reply, body = null) {
  const text = reply || 'No response.';
  if (body) body.textContent = text;
  else jarvisLog('JARVIS', text);
  jarvis.history.push({ role: 'assistant', content: text });
  return text;
}

async function askOmni(text) {
  setState('thinking');
  const res = await fetch(`${OMNI}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'auto/best-fast', messages: jarvis.history, stream: false }),
  });
  if (!res.ok) throw new Error(`OmniRoute ${res.status}`);
  const data = await res.json();
  const reply = appendReply(data.choices?.[0]?.message?.content, null);
  await jarvisVoice.speak(reply);
}

async function askClaude(text, retryWithoutSession = false, stream = null) {
  setState('thinking');
  const live = stream || addStreamRow();
  let resultEvent = null;
  const result = await streamClaude({
    prompt: text,
    sessionId: retryWithoutSession ? '' : jarvis.claude.sessionId,
    persona: 'jarvis',
    onEvent: (event, data) => {
      if (event === 'delta' && live.body) live.body.textContent += data?.text || '';
      if (event === 'tool') addToolRow(data?.name || data?.tool || 'unknown');
      if (event === 'result') resultEvent = data;
    },
  });
  const issue = resultEvent?.error || resultEvent?.message || '';
  if (!retryWithoutSession && /session/i.test(String(issue))) {
    jarvis.claude.sessionId = '';
    if (live.body) live.body.textContent = '';
    return askClaude(text, true, live);
  }
  jarvis.claude.sessionId = result.sessionId || '';
  const badge = document.getElementById('jarvis-session');
  if (badge) badge.textContent = jarvis.claude.sessionId ? `session ${jarvis.claude.sessionId.slice(0, 8)}` : '';
  const reply = appendReply(result.text, live.body);
  await jarvisVoice.speak(reply);
}

async function askOllama() {
  setState('thinking');
  const live = addStreamRow();
  const result = await streamOllama({
    messages: jarvis.history,
    onEvent: (event, data) => { if (event === 'delta' && live.body) live.body.textContent += data?.text || ''; },
  });
  const reply = appendReply(result.text, live.body);
  await jarvisVoice.speak(reply);
}

async function askHermes(text) {
  setState('thinking');
  const result = await streamHermes({ prompt: text, session: 'jarvis-hud' });
  const reply = appendReply(result.text, null);
  await jarvisVoice.speak(reply);
}

async function askJarvis(text) {
  jarvisLog('You', text);
  jarvis.history.push({ role: 'user', content: text });
  if (jarvis.history.length > 13) jarvis.history = [jarvis.history[0], ...jarvis.history.slice(-12)];
  try {
    if (jarvis.brain === 'claude') await askClaude(text);
    else if (jarvis.brain === 'ollama') await askOllama(text);
    else if (jarvis.brain === 'hermes') await askHermes(text);
    else await askOmni(text);
    if (!pushToTalk?.isLive()) setState('idle');
  } catch (e) {
    setState('error');
    jarvisLog('JARVIS', 'Error: ' + e.message);
    setTimeout(() => setState('idle'), 2000);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function setState(s) {
  jarvis.state = s;
  document.querySelectorAll('.jarvis-state').forEach(el => el.textContent = s.toUpperCase());
  // Only the state badge's dot changes colour; the node service dots keep their up/down class.
  document.querySelectorAll('.jarvis-state-badge .jarvis-dot').forEach(el => {
    el.className = 'jarvis-dot jarvis-dot-' + s;
  });
  const micBtn = document.getElementById('jarvis-mic');
  if (micBtn) micBtn.textContent = s === 'listening' ? '◉ Listening' : '🎙 Talk';
}

function jarvisLog(who, text) {
  const log = document.getElementById('jarvis-log');
  if (!log) return;
  const div = document.createElement('div');
  div.className = 'jarvis-msg jarvis-msg-' + (who === 'You' ? 'user' : 'jarvis');
  div.setAttribute('data-ts', Date.now());
  const name = document.createElement('span');
  name.className = 'jarvis-msg-name';
  name.textContent = who === 'You' ? 'YOU' : 'JARVIS';
  const body = document.createElement('span');
  body.textContent = text;
  div.appendChild(name);
  div.appendChild(body);
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

// ── Live Metrics Updater ─────────────────────────────────────────────────────

async function updateMetrics() {
  // OmniRoute models
  try {
    const r = await fetch(`${OMNI}/models`, { cache: 'no-store' });
    if (r.ok) {
      const d = await r.json();
      jarvis.metrics.omniModels = d.data?.length || 0;
      const el = document.getElementById('jarvis-omni');
      if (el) el.textContent = jarvis.metrics.omniModels;
    }
  } catch {}
  
  // Agents = loadable skills, read from disk by the server
  try {
    const r = await fetch('/api/agents', { cache: 'no-store' });
    if (r.ok) {
      const d = await r.json();
      jarvis.metrics.agents = d.count || 0;
      const el = document.getElementById('jarvis-agents');
      if (el) el.textContent = jarvis.metrics.agents;
    }
  } catch {}

  // God's-eye nodes and services
  try {
    const r = await fetch('/api/nodes', { cache: 'no-store' });
    if (r.ok) {
      const d = await r.json();
      const services = d.services || (d.nodes || []).flatMap((node) => node.services || []);
      const up = services.filter((service) => service.up || service.state === 'UP').length;
      jarvis.metrics.services = { up, total: services.length };
      const el = document.getElementById('jarvis-services');
      if (el) el.textContent = `${up}/${services.length}`;
      renderNodes(d);
    }
  } catch {}
  
  // Graph nodes (from app state)
  const nodesEl = document.getElementById('stat-nodes');
  if (nodesEl && nodesEl.textContent !== '—') {
    jarvis.metrics.graphNodes = parseInt(nodesEl.textContent) || 0;
    const el = document.getElementById('jarvis-graph');
    if (el) el.textContent = jarvis.metrics.graphNodes;
  }
}

function renderNodes(data) {
  const list = document.getElementById('jarvis-nodes-list');
  if (!list) return;
  list.textContent = '';
  for (const node of data?.nodes || []) {
    const row = document.createElement('div');
    row.className = 'jarvis-node-row';
    const services = node.services || [];
    const up = node.up ?? services.filter((service) => service.up || service.state === 'UP').length;
    const nodeLabel = document.createElement('div');
    nodeLabel.textContent = `${node.name || node.id} · ${node.ip || '—'} · ${up}/${node.total ?? services.length}`;
    row.appendChild(nodeLabel);
    for (const service of services) {
      const serviceRow = document.createElement('div');
      serviceRow.className = 'jarvis-service-row';
      const dot = document.createElement('span');
      dot.className = `jarvis-dot ${service.up || service.state === 'UP' ? 'jarvis-dot-up' : 'jarvis-dot-down'}`;
      const label = document.createElement('span');
      label.textContent = service.label || service.id;
      serviceRow.appendChild(dot);
      serviceRow.appendChild(label);
      row.appendChild(serviceRow);
    }
    list.appendChild(row);
  }
}

async function getOwnerName() {
  try {
    const response = await fetch('/api/owner', { cache: 'no-store' });
    if (!response.ok) return '';
    const owner = await response.json();
    return String(owner?.name || '').trim();
  } catch {
    return '';
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────

function initJarvis() {
  if (jarvis.initialized) return;
  jarvis.initialized = true;
  
  // HUD rings
  const hudContainer = document.getElementById('jarvis-hud');
  if (hudContainer) {
    createHudRing(hudContainer, [
      { offset: 0, length: 25, color: '#58a6ff', active: true },
      { offset: 25, length: 25, color: '#00d4ff', active: true },
      { offset: 50, length: 25, color: '#00ff41', active: true },
      { offset: 75, length: 25, color: '#bc8cff', active: true },
    ], 110, 6);
    createHudRing(hudContainer, [
      { offset: 10, length: 15, color: '#58a6ff', active: true, animate: 8 },
      { offset: 40, length: 10, color: '#00ff41', active: true, animate: 12 },
      { offset: 70, length: 20, color: '#ff0080', active: true, animate: 6 },
    ], 130, 3);
  }
  
  // Voice
  document.getElementById('jarvis-mic')?.addEventListener('click', () => jarvisVoice.startListening());
  document.getElementById('jarvis-stop')?.addEventListener('click', () => jarvisVoice.stop());
  document.getElementById('jarvis-conv-stop')?.addEventListener('click', () => getPushToTalk().end('conversation-stop'));
  const voiceGlobe = document.getElementById('jarvis-globe');
  if (voiceGlobe) {
    voiceGlobe.style.pointerEvents = 'none';
    voiceGlobe.addEventListener('pointerdown', (event) => {
      event.preventDefault?.();
      getPushToTalk().press();
    });
    voiceGlobe.addEventListener('pointerup', (event) => {
      event.preventDefault?.();
      getPushToTalk().release();
    });
    voiceGlobe.addEventListener('pointercancel', () => getPushToTalk().release());
  }
  const isVoiceShortcutTarget = (target) => ['input', 'textarea', 'select'].includes(String(target?.tagName || '').toLowerCase());
  document.addEventListener('keydown', (event) => {
    if (event.repeat || event.ctrlKey || event.metaKey || isVoiceShortcutTarget(event.target)) return;
    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault?.();
      getPushToTalk().press();
    }
  });
  document.addEventListener('keyup', (event) => {
    if (event.ctrlKey || event.metaKey || isVoiceShortcutTarget(event.target)) return;
    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault?.();
      getPushToTalk().release();
    }
  });
  document.getElementById('jarvis-session-new')?.addEventListener('click', () => {
    jarvis.claude.sessionId = '';
    const badge = document.getElementById('jarvis-session');
    if (badge) badge.textContent = '';
  });
  const brainSelect = document.getElementById('jarvis-brain');
  brainSelect?.addEventListener('change', () => greetBrain(brainSelect.value));
  installShortcuts(document, {
    onBrain: greetBrain,
    onEnd: () => getPushToTalk().end('escape'),
    onHelp: () => {
      const panel = document.getElementById('jarvis-shortcuts');
      if (panel) panel.hidden = !panel.hidden;
    },
  });
  const input = document.getElementById('jarvis-input');
  const send = document.getElementById('jarvis-send');
  const submit = () => { const t = input.value.trim(); if (t) { input.value = ''; askJarvis(t); } };
  send?.addEventListener('click', submit);
  input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  
  if ('speechSynthesis' in window) speechSynthesis.getVoices();

  (async () => {
    const [bridgeStatus, ownerName] = await Promise.all([getBridgeStatus(), getOwnerName()]);
    jarvis.ownerName = ownerName;
    let storedChoice = '';
    try { if (typeof localStorage !== 'undefined') storedChoice = localStorage.getItem('jarvis.brain') || ''; } catch {}
    const selectedBrain = pickDefaultBrain(bridgeStatus, storedChoice);
    setBrain(selectedBrain);
    for (const option of brainSelect?.options || []) {
      const available = brainAvailable(option.value, bridgeStatus);
      option.disabled = !available;
      option.title = available ? option.textContent : `${option.textContent}: ${brainUnavailableReason(option.value, bridgeStatus)}`;
    }
    greetBrain(selectedBrain);
  })();
  

  // Globe (keyless OSM Cesium if window.Cesium present; else stub)
  const globeHost = document.getElementById('jarvis-globe');
  if (globeHost) {
    try {
      jarvis.globe = createGlobe(globeHost, { keyless: true });
    } catch (e) {
      console.warn('[JARVIS] globe init:', e);
    }
  }

  // Avatar billboard (three.js if available)
  const avatarHost = document.getElementById('jarvis-avatar');
  if (avatarHost) {
    (async () => {
    try {
      const THREE = await import('three');
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, 1.2, 3);
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(avatarHost.clientWidth || 200, avatarHost.clientHeight || 280);
      avatarHost.appendChild(renderer.domElement);
      scene.add(new THREE.AmbientLight(0xffffff, 1));
      loadAvatar(THREE, scene, DEFAULT_AVATAR_URL, {
        GLTFLoader,
        position: [0, 0, 0],
        scale: 1,
      }).then((handle) => {
        jarvis.avatar = handle;
        const animate = () => {
          if (jarvis.avatarDisposed) return;
          requestAnimationFrame(animate);
          if (handle.root) handle.root.rotation.y += 0.005;
          renderer.render(scene, camera);
        };
        animate();
      }).catch((e) => console.warn('[JARVIS] avatar:', e));
    } catch (e) {
      console.warn('[JARVIS] avatar three:', e);
    }
    })();
  }

  // Start metric updates
  updateMetrics();
  setInterval(updateMetrics, 15000);
  document.addEventListener('jarvis-refresh', updateMetrics);
  
  setState('idle');
}

document.addEventListener('DOMContentLoaded', initJarvis);

export { jarvis, jarvisVoice, askJarvis, askClaude, askOllama, askHermes, updateMetrics, initJarvis, setState, setBrain, pickDefaultBrain, renderNodes, jarvisLog, addStreamRow, createGlobe, loadAvatar, DEFAULT_AVATAR_URL };
