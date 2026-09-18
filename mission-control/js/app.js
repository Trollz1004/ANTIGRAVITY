// ANTIGRAVITY Dashboard — Agency × AIRI × OmniRoute × Mission Control
// Main application module. Served by ../server.mjs, which owns every secret and
// every live source: OmniRoute (proxied, key server-side), the skills tree
// (agents), the Obsidian vault (knowledge graph), FABLE'S SENTRY (service
// state), the rendered avatars, and the official Claude CLI launcher.
//
// Rule of this file (Joshua, 2026-09-10): REAL DATA ONLY. No sample agents,
// no seeded graph, no invented counts. When a source is down the page says so.
//
// NOTE: innerHTML usage below is limited to markup this file builds itself or
// to the user's own model responses; nothing third-party is rendered as HTML.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';

// ── Configuration ──────────────────────────────────────────────────────────
// The browser never talks to OmniRoute directly and never holds a key: the
// server proxies /api/omni/* to the one OmniRoute URL with the key from .env.
const API = '';                 // same origin as the page
const OMNI_PROXY = '/api/omni';
const IMAGE_MODEL = 'antigravity/gemini-3.1-flash-image'; // the only id /images/generations accepts (VERIFIED 2026-09-08)
const CHAT_MODEL = 'auto/best-fast';

// ── State ──────────────────────────────────────────────────────────────────

const state = {
  currentTab: 'dashboard',
  config: null,
  agents: [],
  categories: ['all'],
  selectedAgent: null,
  selectedCategory: 'all',
  graph: { nodes: [], links: [], meta: null },
  avatar: { scene: null, camera: null, renderer: null, controls: null, vrm: null, mixer: null, clock: null, loaded: false },
  widgets: { chat: [] },
};

// ── DOM Helpers ────────────────────────────────────────────────────────────

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else if (c) node.appendChild(c);
  }
  return node;
}

function setText(sel, text) { const n = $(sel); if (n) n.textContent = text; }

// ── Activity Log ───────────────────────────────────────────────────────────

function logActivity(msg) {
  const log = $('#activity-log');
  if (!log) return;
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const item = el('div', { class: 'activity-item' }, [
    el('span', { class: 'activity-time', text: time }),
    el('span', { text: msg }),
  ]);
  log.insertBefore(item, log.firstChild);
}

// ── API ────────────────────────────────────────────────────────────────────

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, options);
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(`${path} ${res.status}: ${(json && (json.error?.message || json.error)) || text.slice(0, 200)}`);
  return json;
}

async function omniFetch(path, options = {}) {
  return api(`${OMNI_PROXY}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
}

async function omniChat(messages, model = CHAT_MODEL) {
  return omniFetch('/chat/completions', { method: 'POST', body: JSON.stringify({ model, messages, stream: false }) });
}

async function omniImageGen(prompt, model = IMAGE_MODEL, size = '1024x1024') {
  return omniFetch('/images/generations', { method: 'POST', body: JSON.stringify({ model, prompt, size, n: 1, response_format: 'b64_json' }) });
}

async function omniTTS(text, voice = 'alloy') {
  // UNVERIFIED on this gateway: no speech credential is configured (ops/dashboard-airi/AGENTS.md).
  const res = await fetch(`${API}${OMNI_PROXY}/audio/speech`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: text, voice, model: 'tts-1' }),
  });
  if (!res.ok) throw new Error(`audio/speech ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return await res.blob();
}

// ── Tab Navigation ─────────────────────────────────────────────────────────

function initTabs() {
  $$('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
}

function switchTab(name) {
  $$('.nav-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  $$('.tab-content').forEach((c) => c.classList.toggle('active', c.id === `tab-${name}`));
  state.currentTab = name;
  if (name === 'graph' && state.graph.nodes.length === 0) initGraph();
  if (name === 'avatar' && !state.avatar.scene) initAvatar();
  if (name === 'mission-control') initMissionControl();
  if (name === 'claude') initClaude();
}

// ── Dashboard ──────────────────────────────────────────────────────────────

async function initDashboard() {
  try {
    state.config = await api('/api/config');
  } catch (e) {
    logActivity(`Dashboard server not answering: ${e.message}`);
  }

  try {
    const models = await omniFetch('/models');
    const count = models.data?.length || 0;
    setText('#omni-model-count', String(count));
    logActivity(`OmniRoute ${state.config?.omniRoute || ''} — ${count} models (via server proxy, key never in the page)`);
  } catch (e) {
    setText('#omni-model-count', 'OFF');
    logActivity(`OmniRoute unreachable — ${e.message}`);
  }

  // Stats: every number below is read from a live source or shown as unknown.
  try {
    const house = await api('/api/house');
    if (house.up) {
      setText('#stat-services', `${house.up}/${house.total}`);
      const down = [];
      for (const g of house.groups || []) for (const t of g.targets || []) if (!t.up) down.push(t.label || t.id);
      setText('#stat-services-detail', down.length ? `DOWN: ${down.join(', ')}` : 'every watched service is UP');
      logActivity(`FABLE'S SENTRY: ${house.up}/${house.total} up`);
    } else {
      setText('#stat-services', 'DOWN');
      setText('#stat-services-detail', `Sentry ${house.detail || 'not answering'}`);
    }
  } catch (e) { setText('#stat-services', '?'); }

  try {
    const g = await api('/api/vault/graph');
    setText('#stat-nodes', g.ok ? String(g.notes) : '—');
    setText('#stat-nodes-detail', g.ok ? `${g.wikilinks} wikilinks · ${g.orphans} orphans · vault ${g.name}` : g.error);
  } catch (e) { setText('#stat-nodes', '?'); }

  try {
    const v = await api('/api/vault/status');
    setText('#stat-vault', v.state);
    setText('#stat-vault-detail', v.up ? `Local REST API answering at ${v.url}` : v.detail);
  } catch (e) { setText('#stat-vault', '?'); }

  try {
    const a = await api('/api/avatars');
    setText('#stat-avatars', String(a.count));
    setText('#stat-avatars-detail', a.count ? `rendered PNGs in ops/avatar/out · no VRM on disk` : 'no renders yet');
  } catch (e) { setText('#stat-avatars', '?'); }
}

// ── Agents (live: every loadable skill in .agents/skills) ──────────────────

async function initAgents() {
  try {
    const data = await api('/api/agents');
    state.agents = data.agents;
    state.categories = ['all', ...Array.from(new Set(data.agents.map((a) => a.category))).sort()];
    setText('#stat-agents', String(data.count));
    setText('#stat-agents-detail', `loadable skills in ${data.source.replace(/\\/g, '/')}`);
    logActivity(`Agents: ${data.count} skills read from disk`);
  } catch (e) {
    state.agents = [];
    setText('#stat-agents', '?');
    logActivity(`Agents unavailable — ${e.message}`);
  }
  renderAgentCategories();
  renderAgentList();
}

function renderAgentCategories() {
  const container = $('#agent-categories');
  if (!container) return;
  container.innerHTML = '';
  for (const cat of state.categories) {
    const n = cat === 'all' ? state.agents.length : state.agents.filter((a) => a.category === cat).length;
    container.appendChild(el('div', {
      class: `category-item ${cat === state.selectedCategory ? 'active' : ''}`,
      text: `${cat.charAt(0).toUpperCase() + cat.slice(1)} (${n})`,
      onclick: () => { state.selectedCategory = cat; renderAgentCategories(); renderAgentList(); },
    }));
  }
}

function renderAgentList() {
  const container = $('#agent-list');
  if (!container) return;
  container.innerHTML = '';
  const search = ($('#agent-search')?.value || '').toLowerCase();
  const filtered = state.agents.filter((a) => {
    const matchCat = state.selectedCategory === 'all' || a.category === state.selectedCategory;
    const hay = `${a.name} ${a.description} ${a.category}`.toLowerCase();
    return matchCat && (!search || hay.includes(search));
  });
  if (!filtered.length) { container.appendChild(el('p', { class: 'placeholder', text: state.agents.length ? 'No skill matches.' : 'No skills loaded — is the dashboard server running?' })); return; }
  for (const agent of filtered) {
    container.appendChild(el('div', { class: 'agent-card', onclick: () => showAgentDetail(agent) }, [
      el('h4', { text: agent.name }),
      el('div', { class: 'agent-role', text: agent.description ? agent.description.slice(0, 140) : '(no description in frontmatter)' }),
      el('div', { class: 'agent-tags' }, [el('span', { class: 'tag', text: agent.category })]),
    ]));
  }
}

function showAgentDetail(agent) {
  state.selectedAgent = agent;
  const panel = $('#agent-detail-panel');
  if (!panel) return;
  panel.innerHTML = '';
  panel.appendChild(el('div', {}, [
    el('h3', { text: agent.name, style: 'font-size:18px;margin-bottom:8px' }),
    el('p', { text: agent.description || '(no description)', style: 'color:var(--text-secondary);margin-bottom:12px' }),
    el('p', { text: `Category: ${agent.category}`, style: 'font-size:12px;color:var(--text-muted)' }),
    el('p', { text: agent.path, style: 'font-size:12px;color:var(--text-muted);font-family:var(--font-mono)' }),
    el('p', { text: 'Loaded by any harness with `Skill` / `npx skills use`. This panel reads the file; it does not install anything.', style: 'font-size:12px;color:var(--text-muted);margin-top:12px' }),
  ]));
}

// ── Knowledge Graph (live: the Obsidian vault's notes and [[wikilinks]]) ────
// Same measures the obsidian-graph-query skill reports (hubs by degree, orphans,
// vault stats), computed server-side from the vault files so it works whether
// or not Obsidian is open.

async function initGraph() {
  let data;
  try { data = await api('/api/vault/graph'); } catch (e) { logActivity(`Vault graph failed: ${e.message}`); return; }
  if (!data.ok) { logActivity(`Vault graph: ${data.error}`); return; }
  state.graph.meta = data;
  const groups = Array.from(new Set(data.nodes.map((n) => n.group)));
  state.graph.nodes = data.nodes.map((n) => ({ ...n, size: 5 + Math.min(14, (n.in + n.out) * 2), x: Math.random() * 800, y: Math.random() * 600, vx: 0, vy: 0, gi: groups.indexOf(n.group) }));
  const byId = new Map(state.graph.nodes.map((n) => [n.id, n]));
  state.graph.links = data.links.map((l) => ({ source: byId.get(l.source), target: byId.get(l.target) })).filter((l) => l.source && l.target);
  renderGraph();
  setText('#stat-nodes', String(data.notes));
  const hubs = [...state.graph.nodes].sort((a, b) => (b.in + b.out) - (a.in + a.out)).slice(0, 5).filter((n) => n.in + n.out > 0);
  setText('#graph-meta', `${data.name}: ${data.notes} notes · ${data.wikilinks} wikilinks · ${data.orphans} orphans · hubs: ${hubs.map((h) => h.label).join(', ') || 'none yet'}`);
  logActivity(`Knowledge graph: ${data.notes} vault notes, ${data.wikilinks} links`);
}

const PALETTE = ['#58a6ff', '#3fb950', '#d29922', '#f85149', '#bc8cff', '#ff7b72', '#79c0ff', '#00ff41', '#00d4ff', '#ffa657'];

// ── Galaxy backdrop: parallax starfields + nebula clouds on a canvas layer ──
// Deterministic per-size (seeded), drawn once per render; the SVG sits above it
// and carries the animated node stars. Pure canvas 2D — no extra dependencies.
let galaxyCanvas = null;

function paintGalaxy(w, h) {
  if (!galaxyCanvas) {
    galaxyCanvas = document.createElement('canvas');
    galaxyCanvas.className = 'galaxy-backdrop';
    const container = $('#graph-canvas-container');
    if (container) container.insertBefore(galaxyCanvas, container.firstChild);
  }
  galaxyCanvas.width = w; galaxyCanvas.height = h;
  const ctx = galaxyCanvas.getContext && galaxyCanvas.getContext('2d');
  if (!ctx) return;
  // Deep space base: near-black blue, darker at the rim (vignette comes free via CSS).
  const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75);
  bg.addColorStop(0, '#0b1026');
  bg.addColorStop(0.55, '#070a18');
  bg.addColorStop(1, '#03040a');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  // Nebula clouds: big soft radial blobs in house colors, screen-ish via alpha.
  const clouds = [
    { x: w * 0.22, y: h * 0.3, r: Math.min(w, h) * 0.5, c: 'rgba(88, 166, 255, 0.10)' },
    { x: w * 0.75, y: h * 0.28, r: Math.min(w, h) * 0.42, c: 'rgba(188, 140, 255, 0.09)' },
    { x: w * 0.55, y: h * 0.78, r: Math.min(w, h) * 0.55, c: 'rgba(0, 255, 65, 0.05)' },
    { x: w * 0.12, y: h * 0.82, r: Math.min(w, h) * 0.38, c: 'rgba(248, 81, 73, 0.05)' },
  ];
  for (const c of clouds) {
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
    g.addColorStop(0, c.c); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  // Three star layers for parallax depth; a tiny seeded PRNG keeps it stable per size.
  let seed = (w * 7919 + h * 104729) | 0;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const layers = [
    { n: Math.round((w * h) / 2600), rMax: 0.7, a: 0.35 },
    { n: Math.round((w * h) / 5200), rMax: 1.1, a: 0.6 },
    { n: Math.round((w * h) / 11000), rMax: 1.7, a: 0.95 },
  ];
  for (const L of layers) {
    for (let i = 0; i < L.n; i++) {
      const x = rand() * w, y = rand() * h;
      const r = 0.25 + rand() * L.rMax;
      const tint = rand();
      ctx.fillStyle = tint > 0.92 ? `rgba(255, 240, 200, ${L.a})` : tint > 0.84 ? `rgba(150, 200, 255, ${L.a})` : `rgba(235, 240, 255, ${L.a * (0.4 + rand() * 0.6)})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      // A few of the brightest stars get a 4-point sparkle cross.
      if (r > 1.4 && rand() > 0.55) {
        ctx.strokeStyle = `rgba(255,255,255,${L.a * 0.5})`; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(x - r * 3, y); ctx.lineTo(x + r * 3, y); ctx.moveTo(x, y - r * 3); ctx.lineTo(x, y + r * 3); ctx.stroke();
      }
    }
  }
}

function renderGraph() {
  const svg = $('#graph-svg');
  const container = $('#graph-canvas-container');
  if (!svg || !container) return;
  const w = container.clientWidth || 800;
  const h = container.clientHeight || 600;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.innerHTML = '';
  paintGalaxy(w, h);
  const search = ($('#graph-search')?.value || '').toLowerCase();

  // Links: energy filaments — gradient stroke colored by endpoint hues.
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const glowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  glowFilter.setAttribute('id', 'galaxy-glow'); glowFilter.setAttribute('x', '-80%'); glowFilter.setAttribute('y', '-80%'); glowFilter.setAttribute('width', '260%'); glowFilter.setAttribute('height', '260%');
  const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
  blur.setAttribute('stdDeviation', '3.2'); blur.setAttribute('result', 'b');
  const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
  const mv1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode'); mv1.setAttribute('in', 'b');
  const mv2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode'); mv2.setAttribute('in', 'SourceGraphic');
  merge.appendChild(mv1); merge.appendChild(mv2); glowFilter.appendChild(blur); glowFilter.appendChild(merge);
  defs.appendChild(glowFilter);
  svg.appendChild(defs);

  for (const link of state.graph.links) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'galaxy-link');
    line.setAttribute('stroke', '#5b6b8c'); line.setAttribute('stroke-width', '1.2'); line.setAttribute('opacity', '0.55');
    line.setAttribute('stroke-linecap', 'round');
    svg.appendChild(line);
  }
  for (const node of state.graph.nodes) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'galaxy-node');
    g.style.cursor = 'pointer';
    const color = PALETTE[node.gi % PALETTE.length];
    const dim = search && !node.id.toLowerCase().includes(search);
    if (dim) g.setAttribute('opacity', '0.12');
    // Outer halo: the node's atmosphere.
    const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    halo.setAttribute('class', 'galaxy-halo');
    halo.setAttribute('r', node.size * 2.4); halo.setAttribute('fill', color); halo.setAttribute('opacity', '0.12');
    halo.setAttribute('filter', 'url(#galaxy-glow)');
    // Mid corona.
    const corona = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    corona.setAttribute('r', node.size * 1.45); corona.setAttribute('fill', color); corona.setAttribute('opacity', '0.28');
    // Hot core: white-hot center like a star.
    const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    core.setAttribute('class', 'galaxy-core');
    core.setAttribute('r', node.size * 0.62); core.setAttribute('fill', '#ffffff'); core.setAttribute('opacity', '0.95');
    core.setAttribute('stroke', color); core.setAttribute('stroke-width', '1.6');
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('text-anchor', 'middle'); text.setAttribute('dy', node.size * 2.4 + 12);
    text.setAttribute('fill', dim ? '#484f58' : '#dbe7ff'); text.setAttribute('font-size', '10'); text.setAttribute('font-family', 'var(--font-sans)');
    text.setAttribute('style', 'paint-order:stroke;stroke:#04060f;stroke-width:3px;stroke-linejoin:round');
    text.textContent = node.label;
    g.appendChild(halo); g.appendChild(corona); g.appendChild(core); g.appendChild(text);
    g.addEventListener('click', () => openNote(node));
    svg.appendChild(g);
  }
  simulateGraph(w, h);
  startGalaxy(w, h);
}

// ── Animation: the sim keeps breathing after the initial layout ────────────
let galaxyAnim = null;

function startGalaxy(w, h) {
  stopGalaxy();
  if (typeof globalThis.requestAnimationFrame !== 'function') return; // test harness
  let ticks = 0;
  const step = () => {
    simulateGraph(w, h, 1); // one gentle tick per frame
    ticks++;
    if (ticks % 4 === 0) {
      const t = ticks * 0.05;
      // Stars twinkle: pulse every core slightly out of phase.
      const svg = $('#graph-svg');
      if (svg) {
        const cores = svg.querySelectorAll('.galaxy-core');
        for (let i = 0; i < cores.length; i++) {
          const pulse = 0.85 + 0.15 * Math.sin(t + i * 1.3);
          cores[i] && cores[i].setAttribute && cores[i].setAttribute('opacity', String(0.75 + 0.2 * pulse));
        }
      }
    }
    galaxyAnim = globalThis.requestAnimationFrame(step);
  };
  galaxyAnim = globalThis.requestAnimationFrame(step);
}

function stopGalaxy() {
  if (galaxyAnim && typeof globalThis.cancelAnimationFrame === 'function') globalThis.cancelAnimationFrame(galaxyAnim);
  galaxyAnim = null;
}

function simulateGraph(w, h, ticks = 120) {
  const nodes = state.graph.nodes;
  const links = state.graph.links;
  for (let i = 0; i < ticks; i++) {
    for (const a of nodes) for (const b of nodes) {
      if (a === b) continue;
      const dx = a.x - b.x, dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = 400 / (dist * dist);
      a.vx += (dx / dist) * force; a.vy += (dy / dist) * force;
    }
    for (const link of links) {
      const dx = link.target.x - link.source.x, dy = link.target.y - link.source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - 90) * 0.02;
      link.source.vx += (dx / dist) * force; link.source.vy += (dy / dist) * force;
      link.target.vx -= (dx / dist) * force; link.target.vy -= (dy / dist) * force;
    }
    for (const n of nodes) {
      n.vx += (w / 2 - n.x) * 0.002; n.vy += (h / 2 - n.y) * 0.002;
      n.vx *= 0.85; n.vy *= 0.85;
      n.x = Math.max(30, Math.min(w - 30, n.x + n.vx));
      n.y = Math.max(30, Math.min(h - 30, n.y + n.vy));
    }
  }
  const svg = $('#graph-svg');
  if (!svg) return;
  const lines = svg.querySelectorAll('line');
  const groups = svg.querySelectorAll('g');
  links.forEach((link, i) => { if (lines[i]) { lines[i].setAttribute('x1', link.source.x); lines[i].setAttribute('y1', link.source.y); lines[i].setAttribute('x2', link.target.x); lines[i].setAttribute('y2', link.target.y); } });
  nodes.forEach((n, i) => { if (groups[i]) groups[i].setAttribute('transform', `translate(${n.x},${n.y})`); });
}

async function openNote(node) {
  const panel = $('#graph-note');
  if (!panel) return;
  panel.innerHTML = '';
  panel.appendChild(el('h3', { text: node.id, style: 'font-size:14px;margin-bottom:6px;font-family:var(--font-mono)' }));
  panel.appendChild(el('p', { text: `folder ${node.group} · ${node.in} inbound · ${node.out} outbound`, style: 'font-size:12px;color:var(--text-muted)' }));
  // Prefer the stable vault id (survives renames); fall back to the folder name.
  const vaultId = state.config?.vault?.id || state.graph.meta?.id || '';
  const vaultRef = vaultId || state.graph.meta?.name || 'Antigravity';
  panel.appendChild(el('a', { class: 'btn', href: `obsidian://open?vault=${encodeURIComponent(vaultRef)}&file=${encodeURIComponent(node.id)}`, text: 'Open in Obsidian', style: 'display:inline-block;margin:8px 0' }));
  try {
    const note = await api(`/api/vault/note?p=${encodeURIComponent(node.id)}`);
    panel.appendChild(el('pre', { class: 'output-box', text: note.ok ? note.markdown.slice(0, 6000) : note.error, style: 'white-space:pre-wrap;max-height:50vh;overflow:auto' }));
  } catch (e) { panel.appendChild(el('p', { text: e.message })); }
}

// ── 3D Avatar ──────────────────────────────────────────────────────────────
// Honest state: no .vrm exists in this repo (2026-09-10). The viewer starts
// EMPTY (grid + light), says so, and loads a real VRM only from the file input.
// The rendered 2D avatars from ops/avatar/out are shown beside it because
// those are the avatars that actually ship today.

function initAvatar() {
  const canvas = $('#avatar-canvas');
  const container = $('#avatar-canvas-container');
  if (!canvas || !container) return;
  const w = container.clientWidth || 640, h = container.clientHeight || 480;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x161b22);
  const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100);
  camera.position.set(0, 1.4, 3);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(window.devicePixelRatio);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.0, 0); controls.update();
  const light = new THREE.DirectionalLight(0xffffff, 1.0); light.position.set(1, 1, 1).normalize();
  scene.add(light); scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  scene.add(new THREE.GridHelper(10, 20, 0x30363d, 0x21262d));

  Object.assign(state.avatar, { scene, camera, renderer, controls, clock: new THREE.Clock() });
  (function animate() {
    requestAnimationFrame(animate);
    const dt = state.avatar.clock.getDelta();
    if (state.avatar.mixer) state.avatar.mixer.update(dt);
    if (state.avatar.vrm) state.avatar.vrm.update(dt);
    controls.update();
    renderer.render(scene, camera);
  })();
  window.addEventListener('resize', () => {
    const w2 = container.clientWidth, h2 = container.clientHeight;
    camera.aspect = w2 / h2; camera.updateProjectionMatrix(); renderer.setSize(w2, h2);
  });
  const empty = $('#avatar-empty');
  if (empty) empty.classList.remove('hidden');
  loadAvatarGallery();
  logActivity('3D viewer ready — no VRM on disk; load one with the file input');
}

async function loadAvatarGallery() {
  const gallery = $('#avatar-gallery');
  if (!gallery) return;
  gallery.innerHTML = '';
  try {
    const data = await api('/api/avatars');
    if (!data.count) { gallery.appendChild(el('p', { class: 'placeholder', text: 'No renders in ops/avatar/out yet. Run: npm run fable -- workflow avatar' })); return; }
    for (const f of data.files) {
      gallery.appendChild(el('figure', { class: 'avatar-thumb' }, [
        el('img', { src: f.url, alt: f.file, loading: 'lazy' }),
        el('figcaption', { text: `${f.file} · ${(f.bytes / 1024).toFixed(0)} KB` }),
      ]));
    }
  } catch (e) { gallery.appendChild(el('p', { class: 'placeholder', text: `Avatars unavailable: ${e.message}` })); }
}

function loadVRMFile(file) {
  const loading = $('#avatar-loading');
  loading?.classList.remove('hidden');
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));
      const gltf = await loader.parseAsync(e.target.result, '');
      const vrm = gltf.userData.vrm;
      if (vrm) {
        if (state.avatar.vrm) state.avatar.scene.remove(state.avatar.vrm.scene);
        state.avatar.vrm = vrm;
        state.avatar.scene.add(vrm.scene);
        vrm.scene.position.set(0, 0, 0);
        vrm.scene.rotation.y = Math.PI;
        state.avatar.loaded = true;
        $('#avatar-empty')?.classList.add('hidden');
        setText('#stat-avatars-detail', `VRM loaded from file: ${file.name}`);
        logActivity(`Loaded VRM: ${file.name}`);
      } else {
        logActivity(`${file.name} parsed but carries no VRM extension`);
      }
    } catch (err) {
      logActivity(`VRM load failed: ${err.message}`);
    }
    loading?.classList.add('hidden');
  };
  reader.readAsArrayBuffer(file);
}

// ── Mission Control (the live board) + Claude CLI ──────────────────────────

function initMissionControl() {
  // This dashboard IS mission control: the live board is the whole tab. The
  // old Sabertooth iframe embed is gone — a blank frame was dead weight.
  // Hermes runs on its own port on the node; that only resolves on the LAN, so
  // through a single-port tunnel this is a labelled link, not a working frame.
  // The URL comes from /api/config (server-computed LAN IP), never location.hostname —
  // through a tunnel location.hostname is the tunnel's own domain, not the LAN.
  const hermes = $('#hermes-link');
  if (hermes) {
    const url = state.config?.hermesDashboard || '';
    if (url) { hermes.href = url; hermes.textContent = url; }
  }
  void renderMissionBoard();
}

/**
 * The mission board IS this dashboard: a live table of every service on both
 * LAN nodes and the public domains from /api/nodes, refreshed with the Refresh
 * button. Public rows carry the live DNS provider (Ionos = not moved to
 * Cloudflare yet). There is no external mission-control embed.
 */
let missionBoardRequest = 0;

async function renderMissionBoard() {
  const requestId = ++missionBoardRequest;
  const board = $('#mission-board');
  const note = $('#mission-board-note');
  if (!board) return;
  try {
    const data = await api('/api/nodes');
    if (requestId !== missionBoardRequest) return;
    board.innerHTML = '';
    for (const n of data.nodes || []) {
      const head = el('div', { class: 'mission-node-head' }, [
        el('h3', { text: `${n.name} (${n.ip})` }),
        el('span', { class: n.up === n.total ? 'ok' : 'warn', text: `${n.up}/${n.total} up — ${n.role || ''}` }),
      ]);
      const rows = (n.services || []).map((s) => el('div', { class: 'mission-row' }, [
        el('span', { class: 'dot ' + (s.up ? 'ok' : 'down') }),
        el('span', { class: 'mission-label', text: s.label || s.id || '' }),
        el('span', { class: 'mission-port', text: s.port ? ':' + s.port : '' }),
        el('span', { class: s.up ? 'ok' : 'down', text: s.state || (s.up ? 'UP' : 'DOWN') }),
        el('span', { class: 'mission-detail', text: s.ns ? `DNS: ${s.ns}` : (s.detail || '') }),
        el('span', { class: 'mission-latency', text: s.latencyMs != null ? s.latencyMs + ' ms' : '' }),
      ]));
      board.appendChild(el('section', { class: 'mission-node' }, [head, ...rows]));
    }
    if (note) note.textContent = `Live identity-checked board — ${data.nodes?.length || 0} nodes, refreshed ${new Date().toLocaleTimeString()}`;
  } catch (e) {
    if (requestId === missionBoardRequest && note) note.textContent = 'Board unavailable: ' + e.message;
  }
}

async function launchFreebuff() {
  const out = $('#freebuff-result');
  if (out) out.textContent = 'Opening FreeBuff CLI…';
  try {
    const r = await api('/api/launch/freebuff', { method: 'POST' });
    if (out) out.textContent = `Opened ${r.opened} on ${r.on} — free GLM agent, ad-supported, time-boxed. Non-judge lane: hand its work to Claude/Codex.`;
    logActivity(`FreeBuff CLI opened on ${r.on}`);
  } catch (e) {
    if (out) out.textContent = `Could not open: ${e.message}`;
  }
}

// ── ClawX AI Board: six seats vote separately; the founder breaks ties ──────
async function callBoardVote() {
  const q = $('#board-question');
  const out = $('#board-result');
  const seats = $('#board-seats');
  const founder = $('#board-founder');
  const question = (q && q.value || '').trim();
  if (!out) return;
  if (!question) { out.textContent = 'Write the motion first.'; return; }
  out.textContent = 'Convening the board — six seats thinking…';
  if (seats) seats.innerHTML = '';
  try {
    const body = { question };
    if (founder && founder.value) body.founderVote = founder.value;
    const r = await api('/api/board/vote', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (seats) {
      for (const v of r.votes || []) {
        const card = el('div', { class: 'widget-card board-seat' }, [
          el('h3', { text: (v.name || 'seat') }),
          el('span', { class: 'board-light ' + (v.vote === 'YES' ? 'board-yes' : v.vote === 'NO' ? 'board-no' : 'board-abstain'), text: v.vote || 'ABSTAIN' }),
          el('p', { class: 'tab-desc', text: v.reason || '' }),
        ]);
        seats.appendChild(card);
      }
    }
    const tie = r.tie ? ` — 3–3 SPLIT, founder ${r.tieBreak ? 'voted ' + r.tieBreak : 'DECIDES'}` : '';
    const verdict = r.outcome === 'PASSED' ? '🟢 PASSED' : r.outcome === 'FAILED' ? '🔴 FAILED' : r.outcome === 'NO QUORUM' ? '⚪ NO QUORUM (fewer than 4 seats voted)' : '🟡 FOUNDER DECIDES';
    if (out) out.textContent = `${verdict} — ${r.yes} yes · ${r.no} no · ${r.abstain} abstain${tie}`;
    logActivity(`ClawX board: ${r.outcome} (${r.yes}-${r.no}) on "${question.slice(0, 60)}"`);
  } catch (e) {
    if (out) out.textContent = 'Vote failed: ' + e.message;
  }
}

// Wake bridge: write a pending task for the user's Freebuff desktop session.
async function createWake() {
  const input = $('#wake-prompt');
  const out = $('#wake-result');
  const prompt = (input && input.value || '').trim();
  if (!out) return;
  if (!prompt) { out.textContent = 'Type a task first.'; return; }
  out.textContent = 'Writing wake…';
  try {
    const w = await api('/api/freebuff/wakes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt }) });
    if (out) out.textContent = `Wake ${w.runId} is pending — open your Freebuff session; it reports done/fail back here.`;
    if (input) input.value = '';
    logActivity(`FreeBuff wake created: ${w.runId}`);
  } catch (e) {
    if (out) out.textContent = 'Wake failed: ' + e.message;
  }
}

async function initClaude() {
  const cfg = state.config?.claude;
  if (cfg) {
    setText('#claude-command', cfg.command);
    setText('#claude-note', cfg.note);
  }
  try {
    const status = await api('/api/claude/status');
    setText('#claude-bridge-status', `Bridge: ${status.installed ? 'installed' : 'not installed'} · access ${status.access?.ok ? 'ok' : 'refused'} · mode ${status.permissionMode}`);
  } catch (e) {
    setText('#claude-bridge-status', 'Bridge: unavailable');
  }
}

async function launchClaude() {
  const out = $('#claude-result');
  if (out) out.textContent = 'Opening…';
  try {
    const r = await api('/api/launch/claude', { method: 'POST' });
    if (out) out.textContent = `Opened ${r.opened} on ${r.on}`;
    logActivity(`Official Claude CLI opened on ${r.on}`);
  } catch (e) {
    if (out) out.textContent = `Could not open: ${e.message}`;
  }
}

// ── Claudian panel: full Claude Code chat, model roster like the Obsidian plugin ──
// Grouped by backend exactly as Claudian shows them. The bridge passes --model
// through to the CLI; a model the CLI cannot route errors honestly in the log.
const CLAUDIAN_MODELS = [
  { group: 'Claude', models: ['fable', 'opus', 'sonnet', 'haiku'] },
  { group: 'Codex', models: ['gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.5', 'gpt-6-astra'] },
  { group: 'PI (local)', models: ['ornith-1.5:9b'] },
  { group: 'OpenCode (free)', models: ['opencode/muse-spark-1.3-contributor-free', 'opencode/big-pickle', 'opencode/mimo-v2.5-free', 'opencode/ling-3.0-flash-fin-free', 'opencode/nemotron-3-ultra-free', 'opencode/nemotron-3.5-lightning-free'] },
];
const CLAUDIAN_CUSTOM_KEY = 'claudian.models';

function claudianModels() {
  let custom = [];
  try { custom = JSON.parse(localStorage.getItem(CLAUDIAN_CUSTOM_KEY) || '[]'); } catch {}
  const known = new Set(CLAUDIAN_MODELS.flatMap((g) => g.models));
  return [...CLAUDIAN_MODELS, { group: 'Custom', models: (Array.isArray(custom) ? custom : []).filter((m) => m && !known.has(m)) }];
}

function addClaudianModel(name) {
  const m = String(name || '').trim();
  if (!m || !/^[A-Za-z0-9._:/-]{1,80}$/.test(m)) return false;
  const all = claudianModels();
  if (all.some((g) => g.models.includes(m))) return true;
  const custom = all.find((g) => g.group === 'Custom');
  custom.models.push(m);
  try { localStorage.setItem(CLAUDIAN_CUSTOM_KEY, JSON.stringify(custom.models)); } catch {}
  return true;
}

function initClaudian() {
  const model = $('#claudian-model');
  if (!model || model.dataset.ready) return;
  model.dataset.ready = '1';
  for (const g of claudianModels()) {
    if (!g.models.length) continue;
    const og = document.createElement('optgroup');
    og.label = g.group;
    for (const m of g.models) {
      const o = document.createElement('option');
      o.value = m; o.textContent = m;
      og.appendChild(o);
    }
    model.appendChild(og);
  }
  const addBtn = $('#claudian-add');
  const addInput = $('#claudian-add-input');
  const rebuild = () => {
    const current = model.value;
    for (const og of Array.from(model.querySelectorAll('optgroup'))) og.remove();
    for (const g of claudianModels()) {
      if (!g.models.length) continue;
      const og = document.createElement('optgroup');
      og.label = g.group;
      for (const m of g.models) {
        const o = document.createElement('option');
        o.value = m; o.textContent = m;
        if (m === current) o.selected = true;
        og.appendChild(o);
      }
      model.appendChild(og);
    }
  };
  addBtn?.addEventListener('click', () => {
    if (addClaudianModel(addInput?.value)) { rebuild(); if (addInput) addInput.value = ''; }
    else if (addInput) addInput.value = '';
  });
  addInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addBtn?.click(); } });

  const input = $('#claudian-input');
  const send = $('#claudian-send');
  const log = $('#claudian-log');
  const effort = $('#claudian-effort');
  const badge = $('#claudian-session');
  const claudian = { sessionId: '', busy: false };
  const run = async () => {
    const prompt = String(input?.value || '').trim();
    if (!prompt || claudian.busy) return;
    claudian.busy = true;
    if (input) input.value = '';
    const row = log ? document.createElement('div') : null;
    if (row) {
      row.className = 'claudian-row';
      row.appendChild(el('b', { text: 'You: ' }));
      row.appendChild(document.createTextNode(prompt));
      log.appendChild(row);
    }
    const live = log ? document.createElement('div') : null;
    const liveText = document.createElement('span');
    if (live) {
      live.className = 'claudian-row';
      live.appendChild(el('b', { text: 'Claude: ' }));
      live.appendChild(liveText);
      log.appendChild(live);
    }
    try {
      const { streamClaude } = await import('./jarvis/claude-bridge.js');
      const result = await streamClaude({
        prompt, persona: 'claude', sessionId: claudian.sessionId || undefined,
        model: model?.value || undefined, permissionMode: effort?.value || undefined,
        onEvent: (event, data) => {
          if (event === 'delta') liveText.textContent += data?.text || '';
          if (event === 'tool') liveText.textContent += `[${data?.name || 'tool'}] `;
        },
      });
      claudian.sessionId = result.sessionId || claudian.sessionId;
      if (result.text) liveText.textContent = result.text;
      if (badge) badge.textContent = claudian.sessionId ? `session ${claudian.sessionId.slice(0, 8)}` : '';
    } catch (e) {
      liveText.textContent = `Error: ${e.message}`;
    } finally { claudian.busy = false; }
  };
  send?.addEventListener('click', () => { void run(); });
  input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); void run(); } });
}

// ── Widgets ────────────────────────────────────────────────────────────────

function initWidgets() {
  $('#widget-chat-send')?.addEventListener('click', sendChat);
  $('#widget-chat-input')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });
  $('#widget-search-btn')?.addEventListener('click', doSearch);
  $('#widget-search-input')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  $('#widget-summarize-btn')?.addEventListener('click', doSummarize);
  $('#widget-tts-btn')?.addEventListener('click', doTTS);
}

async function sendChat() {
  const input = $('#widget-chat-input');
  const log = $('#widget-chat-log');
  const msg = input.value.trim();
  if (!msg) return;
  log.appendChild(el('div', { class: 'chat-msg user', text: `You: ${msg}` }));
  input.value = '';
  try {
    const res = await omniChat([{ role: 'user', content: msg }]);
    const reply = res.choices?.[0]?.message?.content || 'No response';
    log.appendChild(el('div', { class: 'chat-msg assistant', text: `AI (${res.model || CHAT_MODEL}): ${reply}` }));
    log.scrollTop = log.scrollHeight;
  } catch (e) {
    log.appendChild(el('div', { class: 'chat-msg', text: `Error: ${e.message}`, style: 'color:var(--error)' }));
  }
}

async function doSearch() {
  // Vault search — real, local. (The old widget hit an OmniRoute /search route that is not in the verified route table.)
  const input = $('#widget-search-input');
  const results = $('#widget-search-results');
  const q = input.value.trim().toLowerCase();
  if (!q) return;
  results.innerHTML = '<p class="placeholder">Searching the vault…</p>';
  try {
    if (!state.graph.meta) { const g = await api('/api/vault/graph'); if (g.ok) { state.graph.meta = g; state.graph.nodes = g.nodes.map((n) => ({ ...n })); } }
    const hits = (state.graph.meta?.nodes || []).filter((n) => n.id.toLowerCase().includes(q)).slice(0, 12);
    results.innerHTML = '';
    if (!hits.length) results.appendChild(el('p', { class: 'placeholder', text: 'No note title matches.' }));
    for (const n of hits) {
      results.appendChild(el('div', { class: 'search-result', onclick: () => { switchTab('graph'); setTimeout(() => openNote(state.graph.nodes.find((x) => x.id === n.id) || n), 50); } }, [
        el('div', { class: 'search-result-title', text: n.label }),
        el('div', { class: 'search-result-snippet', text: `${n.id} · ${n.in + n.out} links` }),
      ]));
    }
  } catch (e) {
    results.innerHTML = `<p class="placeholder">Search unavailable: ${e.message}</p>`;
  }
}

async function doSummarize() {
  const input = $('#widget-summarize-input');
  const output = $('#widget-summarize-output');
  const text = input.value.trim();
  if (!text) return;
  output.textContent = 'Summarizing…';
  try {
    const res = await omniChat([
      { role: 'system', content: 'Summarize the following text concisely.' },
      { role: 'user', content: text },
    ]);
    output.textContent = res.choices?.[0]?.message?.content || 'No summary';
  } catch (e) { output.textContent = `Error: ${e.message}`; }
}

async function doTTS() {
  const input = $('#widget-tts-input');
  const audio = $('#widget-audio');
  const text = input.value.trim();
  if (!text) return;
  try {
    const blob = await omniTTS(text);
    audio.src = URL.createObjectURL(blob);
    audio.classList.remove('hidden');
    audio.play();
  } catch (e) {
    logActivity(`TTS failed (no speech credential on the gateway yet): ${e.message}`);
    $('#widget-tts-status') && ($('#widget-tts-status').textContent = `Not available: ${e.message}`);
  }
}

// ── Generation ──────────────────────────────────────────────────────────────

async function generateImage(promptElId, resultElId, modelElId, styleElId = null) {
  const prompt = $(promptElId).value.trim();
  const model = $(modelElId)?.value || IMAGE_MODEL;
  const result = $(resultElId);
  if (!prompt) return;
  result.innerHTML = '<p class="placeholder">Generating…</p>';
  let fullPrompt = prompt;
  if (styleElId) {
    const style = $(styleElId).value;
    if (style && style !== 'natural') fullPrompt = `${prompt}, ${style} style`;
  }
  try {
    const res = await omniImageGen(fullPrompt, model);
    const item = res.data?.[0];
    const src = item?.b64_json ? `data:image/png;base64,${item.b64_json}` : item?.url;
    if (!src) throw new Error('no image in the response');
    result.innerHTML = '';
    result.appendChild(el('img', { src, alt: prompt }));
    logActivity(`Generated image via ${model}: ${prompt.slice(0, 40)}…`);
  } catch (e) {
    result.innerHTML = `<p class="placeholder">Generation failed: ${e.message}</p>`;
  }
}

// ── Screensaver (idle → galaxy idle state; click → gods-eye) ───────────────

import('./screensaver.js').then(({ createScreensaver }) => {
  const ss = createScreensaver({ idleMs: 120000 });
  ss.armIdle();
  state.screensaver = ss;
}).catch((e) => logActivity(`screensaver unavailable: ${e.message}`));

// ── You&i hero (finisher particles in the founder's colors, 3D tilt) ──────

import('./header-fx.js').then(({ createHeroFx }) => {
  const heroRoot = $('#hero-youi');
  const fx = createHeroFx({ container: heroRoot, FinisherHeader: window.FinisherHeader || null });
  fx.init();
}).catch((e) => logActivity(`hero fx unavailable: ${e.message}`));

// ── Init ───────────────────────────────────────────────────────────────────

function init() {
  initTabs();
  initDashboard();
  initAgents();
  initWidgets();
  $('#agent-search')?.addEventListener('input', renderAgentList);
  $('#graph-refresh')?.addEventListener('click', () => { state.graph.nodes = []; initGraph(); });
  $('#graph-fit')?.addEventListener('click', () => renderGraph());
  $('#graph-search')?.addEventListener('input', () => renderGraph());
  $('#avatar-file')?.addEventListener('change', (e) => { if (e.target.files[0]) loadVRMFile(e.target.files[0]); });
  $('#avatar-reset')?.addEventListener('click', () => {
    if (state.avatar.camera) { state.avatar.camera.position.set(0, 1.4, 3); state.avatar.controls.target.set(0, 1.0, 0); state.avatar.controls.update(); }
  });
  $('#scene-generate')?.addEventListener('click', () => generateImage('#scene-prompt', '#scene-result', '#scene-model'));
  $('#image-generate')?.addEventListener('click', () => generateImage('#image-prompt', '#image-result', '#image-model', '#image-style'));
  $('#claude-launch')?.addEventListener('click', launchClaude);
  $('#freebuff-launch')?.addEventListener('click', launchFreebuff);
  $('#wake-create')?.addEventListener('click', createWake);
  $('#board-vote')?.addEventListener('click', callBoardVote);
  $('#mission-refresh')?.addEventListener('click', () => void renderMissionBoard());
  initClaudian();
  logActivity('Dashboard initialized');
}

document.addEventListener('DOMContentLoaded', init);

// Exports for testing
export {
  state, $, $$, el, setText, logActivity, initTabs, switchTab, initDashboard, initAgents,
  renderAgentCategories, renderAgentList, showAgentDetail, initGraph, renderGraph, simulateGraph,
  openNote, initAvatar, loadAvatarGallery, loadVRMFile, initMissionControl, renderMissionBoard, initClaude, launchClaude, launchFreebuff, createWake, callBoardVote, initClaudian, stopGalaxy,
  CLAUDIAN_MODELS, claudianModels, addClaudianModel,
  initWidgets, sendChat, doSearch, doSummarize, doTTS, generateImage, api, omniFetch, omniChat,
  omniImageGen, omniTTS, init, IMAGE_MODEL, CHAT_MODEL, OMNI_PROXY,
};
