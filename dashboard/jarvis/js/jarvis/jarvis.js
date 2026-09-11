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

const OMNI = 'http://127.0.0.1:20128/v1';

// ── State ────────────────────────────────────────────────────────────────────

const jarvis = {
  state: 'idle', // idle | listening | thinking | speaking
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

const jarvisVoice = {
  recognition: null,
  
  speak(text) {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) return resolve();
      setState('speaking');
      const u = new SpeechSynthesisUtterance(text);
      const voices = speechSynthesis.getVoices();
      u.voice = voices.find(v => /en-US/i.test(v.lang) && /neural|natural|aria|jenny|guy/i.test(v.name))
        || voices.find(v => /en-US/i.test(v.lang)) || voices[0] || null;
      u.rate = 1.05;
      u.pitch = 0.95; // Slightly deeper — JARVIS tone
      u.onend = () => { setState('idle'); resolve(); };
      u.onerror = () => { setState('idle'); resolve(); };
      speechSynthesis.speak(u);
    });
  },
  
  startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { jarvisLog('JARVIS', 'Speech recognition requires Chrome or Edge. Use the text input below.'); return; }
    if (this.recognition) { this.recognition.stop(); this.recognition = null; setState('idle'); return; }
    
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setState('listening');
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      this.recognition = null;
      askJarvis(text);
    };
    rec.onerror = (e) => {
      this.recognition = null;
      setState('error');
      jarvisLog('JARVIS', 'Mic error: ' + e.error);
      setTimeout(() => setState('idle'), 2000);
    };
    rec.onend = () => { if (jarvis.state === 'listening') setState('idle'); this.recognition = null; };
    this.recognition = rec;
    rec.start();
  },
  
  stop() {
    speechSynthesis.cancel();
    if (this.recognition) { this.recognition.stop(); this.recognition = null; }
    setState('idle');
  }
};

// ── OmniRoute Brain ──────────────────────────────────────────────────────────

async function askJarvis(text) {
  jarvisLog('You', text);
  setState('thinking');
  jarvis.history.push({ role: 'user', content: text });
  if (jarvis.history.length > 13) {
    jarvis.history = [jarvis.history[0], ...jarvis.history.slice(-12)];
  }
  
  try {
    const res = await fetch(`${OMNI}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'auto/best-fast', messages: jarvis.history, stream: false }),
    });
    if (!res.ok) throw new Error(`OmniRoute ${res.status}`);
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'No response.';
    jarvis.history.push({ role: 'assistant', content: reply });
    jarvisLog('JARVIS', reply);
    await jarvisVoice.speak(reply);
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
  document.querySelectorAll('.jarvis-dot').forEach(el => {
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
  
  // Agents
  try {
    const r = await fetch('http://localhost:3151/api/agents', { cache: 'no-store' });
    if (r.ok) {
      const d = await r.json();
      jarvis.metrics.agents = d.count || d.total || 0;
      const el = document.getElementById('jarvis-agents');
      if (el) el.textContent = jarvis.metrics.agents;
    }
  } catch {}
  
  // Services (from Fable's Sentry — proxied)
  try {
    const r = await fetch('http://localhost:9140/api/health', { cache: 'no-store' });
    if (r.ok) {
      const d = await r.json();
      const checks = d.checks || d.services || [];
      const up = checks.filter(c => ['up','ok','connected','live'].includes(c.status || c.state)).length;
      jarvis.metrics.services = { up, total: checks.length };
      const el = document.getElementById('jarvis-services');
      if (el) el.textContent = `${up}/${checks.length}`;
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
  const input = document.getElementById('jarvis-input');
  const send = document.getElementById('jarvis-send');
  const submit = () => { const t = input.value.trim(); if (t) { input.value = ''; askJarvis(t); } };
  send?.addEventListener('click', submit);
  input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
  

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
  if (avatarHost && typeof window !== 'undefined' && window.THREE) {
    try {
      const THREE = window.THREE;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, 1.2, 3);
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(avatarHost.clientWidth || 200, avatarHost.clientHeight || 280);
      avatarHost.appendChild(renderer.domElement);
      scene.add(new THREE.AmbientLight(0xffffff, 1));
      loadAvatar(THREE, scene, DEFAULT_AVATAR_URL, {
        GLTFLoader: window.GLTFLoader,
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
  }

  // Initial greeting
  setTimeout(() => {
    const greeting = 'JARVIS online. How can I assist?';
    jarvisLog('JARVIS', greeting);
    jarvisVoice.speak(greeting);
  }, 500);
  
  // Start metric updates
  updateMetrics();
  setInterval(updateMetrics, 15000);
  document.addEventListener('jarvis-refresh', updateMetrics);
  
  setState('idle');
}

document.addEventListener('DOMContentLoaded', initJarvis);

export { jarvis, jarvisVoice, askJarvis, updateMetrics, initJarvis, setState, createGlobe, loadAvatar, DEFAULT_AVATAR_URL };
