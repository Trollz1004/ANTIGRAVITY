/**
 * Architecture panel (Phase E, unit 3) — a typed JSON description (archify's
 * "architecture" JSON-IR: schema_version/diagram_type/meta/components/
 * boundaries/connections/cards, see
 * vendor/archify/schemas/architecture.schema.json) of the live Sabertooth
 * stack, built read-only from two real sources: the House stage table
 * (`scripts/fables-house/FABLES-HOUSE.ps1`, parsed as text — never executed)
 * and the 30-minute health probe's JSON (`ops/heartbeat/sabretooth-health.json`).
 * No network calls, no fixture rows: a service the House does not define, or
 * a status the health JSON does not report, is simply absent rather than
 * invented.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

/** One `@{ Name = 'X'; Required = $true ... }` stage entry from the PowerShell source. */
export function parseStages(psText) {
  const text = String(psText || '');
  const re = /@\{\s*Name\s*=\s*(['"])((?:(?!\1).)*)\1\s*;\s*Required\s*=\s*\$(true|false)/g;
  const out = [];
  let m;
  while ((m = re.exec(text))) {
    out.push({ rawName: m[2], required: m[3] === 'true' });
  }
  return out;
}

/** "JARVIS (Mission Control) :9150" -> { label: "JARVIS", port: "9150" }. Parens and the :port token are stripped from the label; a name with neither still round-trips. */
export function splitStageName(rawName) {
  const portMatch = /:(\d{2,5})\b/.exec(rawName);
  const label = rawName.replace(/:\d{2,5}\b/, '').replace(/\([^)]*\)/g, '').trim().replace(/\s+/g, ' ');
  return { label: label || rawName.trim(), port: portMatch ? portMatch[1] : null };
}

export function slugify(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x';
}

/** Best-effort component `type` for archify's enum (frontend/backend/database/cloud/security/messagebus/external). */
export function guessType(label) {
  const l = label.toLowerCase();
  if (/postgres|redis/.test(l)) return 'database';
  if (/frontend/.test(l)) return 'frontend';
  if (/jarvis/.test(l)) return 'frontend';
  if (/tunnel|vs code/.test(l)) return 'cloud';
  if (/housekeeping/.test(l)) return 'external';
  return 'backend';
}

/** Flatten the health JSON's required+optional groups into `{ port: status }`, keyed by the trailing `_<port>` in each key. */
export function healthPortStatus(health) {
  const map = {};
  if (!health) return map;
  for (const group of [health.required, health.optional]) {
    if (!group) continue;
    for (const [key, val] of Object.entries(group)) {
      const m = /_(\d{2,5})$/.exec(key);
      if (m && val && val.status) map[m[1]] = val.status;
    }
  }
  return map;
}

// The primary components archify draws and wires with real connections —
// kept small on purpose. archify's layout checker enforces clean orthogonal
// routing with no label/component overlap; the House stage table has ~19
// entries, and fanning every one of them into the connection graph produced
// dozens of crossing edges the checker correctly rejected. Every stage still
// appears, in full, inside `cards` below — nothing from the House table is
// dropped, it is just not each individually wired with an edge.
const PRIMARY = [
  { id: 'jarvis', match: /^jarvis$/i },
  { id: 'omniroute', match: /omniroute/i },
  { id: 'fables-sentry', match: /sentry/i },
  { id: 'hermes', match: /^hermes$/i },
  { id: 'openclaw', match: /openclaw/i },
  { id: 'cloudflared-tunnel', match: /cloudflared/i },
  { id: 'frontend', match: /^frontend$/i },
  { id: 'backend-api', match: /backend api/i },
];

/** Pure builder: given the House stage text and a (possibly null) health object, produce the typed JSON. */
export function buildArchitectureJson({ stageText, health }) {
  const stages = parseStages(stageText);
  const portStatus = healthPortStatus(health);
  const seenIds = new Set();
  const allServices = stages.map((s) => {
    const { label, port } = splitStageName(s.rawName);
    let id = slugify(label);
    while (seenIds.has(id)) id = id + '-2';
    seenIds.add(id);
    return { id, label, port, required: s.required, status: port && portStatus[port] ? portStatus[port] : null };
  });

  // Explicit free-placement coordinates rather than an auto-layout mode:
  // archify's "clean-flow" checker rejects any straight connector that
  // passes through an unrelated component's box, which an auto grid cannot
  // guarantee for a hub-and-spoke graph. JARVIS sits at the center of a
  // 4-direction star (one real proxy edge per compass side, so no line ever
  // has another node between its two endpoints); the tunnel/frontend/
  // backend-api trio is a second, separate star well clear of the first.
  // Crosslisting, the health probe, and the Alienware placeholder are real
  // components (and — for Crosslisting/the health probe — real proxy/watch
  // relationships, noted in their own `tag`) but are not forced into the
  // drawn graph, which keeps the diagram legible instead of a crossing mess.
  const POS = {
    jarvis: [520, 320], omniroute: [520, 60], 'fables-sentry': [520, 580],
    hermes: [180, 320], openclaw: [860, 320],
    'cloudflared-tunnel': [1220, 320], frontend: [1220, 60], 'backend-api': [1220, 580],
    crosslisting: [180, 60], 'health-probe': [180, 580], 'alienware-host': [860, 60],
  };
  const SIZE = [140, 60];

  const components = [];
  const primaryIds = {};
  for (const p of PRIMARY) {
    const svc = allServices.find((s) => p.match.test(s.label));
    if (!svc) continue; // the House removed/renamed a stage — never fabricate the node
    primaryIds[p.id] = svc.id;
    components.push({
      id: svc.id, type: guessType(svc.label), label: svc.label,
      sublabel: svc.port ? `:${svc.port}` : (svc.required ? 'required' : 'optional'),
      tag: [svc.required ? 'required' : 'optional', svc.status].filter(Boolean).join(' · '),
      pos: POS[p.id] || [40, 800], size: SIZE, node: 'sabretooth',
    });
  }
  // Crosslisting: a real local app JARVIS proxies, but not a House stage.
  components.push({ id: 'crosslisting', type: 'backend', label: 'Crosslisting OS', sublabel: ':3000', tag: 'proxied by JARVIS', pos: POS.crosslisting, size: SIZE, node: 'sabretooth' });
  primaryIds.crosslisting = 'crosslisting';
  // Health probe: the 30-minute heartbeat that watches every stage above.
  components.push({ id: 'health-probe', type: 'external', label: 'Health probe', sublabel: '30-min heartbeat', tag: 'watches every stage on this page', pos: POS['health-probe'], size: SIZE, node: 'sabretooth' });
  // A synthetic node for Alienware: the House stage table only covers
  // Sabertooth, so Alienware appears with no service rows rather than
  // fabricated ones — its own boundary needs at least one member (archify's
  // schema requires a non-empty `wraps`), so this placeholder stands in.
  components.push({ id: 'alienware-host', type: 'external', label: 'Alienware', sublabel: 'Dream Online + Hermes/Ollama host', pos: POS['alienware-host'], size: SIZE, node: 'alienware' });

  const sabertoothIds = components.filter((c) => c.node === 'sabretooth').map((c) => c.id);
  const alienwareIds = components.filter((c) => c.node === 'alienware').map((c) => c.id);
  const boundaries = [
    { kind: 'region', label: 'Sabertooth', wraps: sabertoothIds },
    { kind: 'region', label: 'Alienware', wraps: alienwareIds },
  ].filter((b) => b.wraps.length > 0);

  const connections = [];
  // labelDy nudges each label clear of the component boxes it would
  // otherwise sit inside — the exact offsets archify's own layout checker
  // suggested for this geometry (see the "Suggested fix" lines it prints).
  const addEdge = (from, to, label, variant, labelDy) => {
    if (!from || !to || from === to) return;
    const edge = { id: `${from}-to-${to}`, from, to, variant: variant || 'default' };
    if (label) edge.label = label;
    if (labelDy) edge.labelDy = labelDy;
    connections.push(edge);
  };
  addEdge(primaryIds.jarvis, primaryIds.omniroute, 'model calls', 'emphasis', -24);
  addEdge(primaryIds.jarvis, primaryIds['fables-sentry'], 'status feed', 'default', 24);
  addEdge(primaryIds.jarvis, primaryIds.hermes, 'router proxy');
  addEdge(primaryIds.jarvis, primaryIds.openclaw, 'support proxy');
  addEdge(primaryIds['cloudflared-tunnel'], primaryIds.frontend, 'public HTTPS', 'emphasis', -24);
  addEdge(primaryIds['cloudflared-tunnel'], primaryIds['backend-api'], 'public HTTPS', 'emphasis', 24);

  const fmt = (s) => `${s.label}${s.port ? ' :' + s.port : ''}${s.status ? ' — ' + s.status : ''}`;
  const cards = [
    { dot: 'emerald', title: 'Required House stages', items: allServices.filter((s) => s.required).map(fmt) },
    { dot: 'slate', title: 'Optional House stages', items: allServices.filter((s) => !s.required).map(fmt) },
  ].filter((c) => c.items.length > 0);

  return {
    schema_version: 1,
    diagram_type: 'architecture',
    meta: { title: 'Sabertooth stack — live from the House stage table', output: 'architecture.html' },
    // `node` was only for grouping into boundaries; `tag` is dropped rather
    // than sent as an empty string — archify's schema requires `tag` (when
    // present) to be a non-empty string. `at`/`sources` metadata this module
    // wants to keep lives in the wrapper `buildArchitecture()` returns below,
    // never inside this object, so this object always validates on its own.
    components: components.map(({ node, tag, ...rest }) => (tag ? { ...rest, tag } : rest)),
    boundaries,
    connections,
    cards,
  };
}

/**
 * Live version: reads the real House script + health JSON off disk. Returns
 * `{ archify, at, sources }` — `archify` is the exact schema-valid object to
 * hand the CLI or the JSON route; `at`/`sources` are this server's own
 * provenance metadata, kept outside `archify` so it always validates.
 */
export function buildArchitecture({ housePath, healthPath, readFile = readFileSync, exists = existsSync } = {}) {
  const stageText = exists(housePath) ? readFile(housePath, 'utf8') : '';
  let health = null;
  if (exists(healthPath)) {
    try { health = JSON.parse(readFile(healthPath, 'utf8').replace(/^﻿/, '')); } catch { health = null; }
  }
  const archify = buildArchitectureJson({ stageText, health });
  return { archify, at: new Date().toISOString(), sources: { housePath, healthPath, healthLoaded: health !== null } };
}

/**
 * Before/after architecture diff for the git panel (Phase E, "add the
 * before and after renderer to the git panel for a chosen commit range" —
 * archify's CLI does support a diff mode: `archify compare architecture
 * base.json head.json out.html`, confirmed 2026-09-17). The "before" and
 * "after" snapshots are the House stage table's content at two git refs
 * (`git show <ref>:<path>`, read-only — no checkout, no network), combined
 * with the CURRENT health JSON in both cases (health state has no history
 * to diff against; this is noted in the response as `healthIsLive: true`
 * rather than presented as historical).
 */
export function readStageTextAtRef({ repoPath, ref, housePathInRepo = 'scripts/fables-house/FABLES-HOUSE.ps1', exec }) {
  try {
    return { ok: true, text: exec(repoPath, ['show', `${ref}:${housePathInRepo}`]) };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

export function renderArchitectureDiff({ repoPath, base, head, healthPath, archifyBin, workDir, exec, spawnImpl = spawn, timeoutMs = 20000, readFile = readFileSync, exists = existsSync, writeFile = writeFileSync, mkdir = mkdirSync }) {
  return new Promise((resolvePromise) => {
    const baseText = readStageTextAtRef({ repoPath, ref: base, exec });
    if (!baseText.ok) return resolvePromise({ ok: false, error: 'could not read the House stage table at ' + base + ': ' + baseText.error });
    const headText = readStageTextAtRef({ repoPath, ref: head, exec });
    if (!headText.ok) return resolvePromise({ ok: false, error: 'could not read the House stage table at ' + head + ': ' + headText.error });
    let health = null;
    if (exists(healthPath)) { try { health = JSON.parse(readFile(healthPath, 'utf8').replace(/^﻿/, '')); } catch { health = null; } }
    const baseJson = buildArchitectureJson({ stageText: baseText.text, health });
    const headJson = buildArchitectureJson({ stageText: headText.text, health });
    if (!archifyBin || !exists(archifyBin)) return resolvePromise({ ok: false, error: 'archify CLI not found at ' + archifyBin });
    try { mkdir(workDir, { recursive: true }); } catch { /* best effort */ }
    const basePath = join(workDir, 'diff-base.json');
    const headPath = join(workDir, 'diff-head.json');
    const outPath = join(workDir, 'diff.html');
    try { writeFile(basePath, JSON.stringify(baseJson), 'utf8'); writeFile(headPath, JSON.stringify(headJson), 'utf8'); }
    catch (e) { return resolvePromise({ ok: false, error: 'could not write diff inputs: ' + String((e && e.message) || e) }); }
    let done = false;
    const child = spawnImpl('node', [archifyBin, 'compare', 'architecture', basePath, headPath, outPath], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const timer = setTimeout(() => { if (!done) { done = true; try { child.kill(); } catch {} resolvePromise({ ok: false, error: 'archify compare timed out after ' + timeoutMs + ' ms' }); } }, timeoutMs);
    let stderr = '';
    child.stderr && child.stderr.on('data', (c) => { stderr += String(c); });
    child.on('error', (e) => { if (!done) { done = true; clearTimeout(timer); resolvePromise({ ok: false, error: String((e && e.message) || e) }); } });
    child.on('close', (code) => {
      if (done) return;
      done = true; clearTimeout(timer);
      if (code !== 0) return resolvePromise({ ok: false, error: 'archify compare exited ' + code + ': ' + stderr.trim().slice(-300) });
      try { resolvePromise({ ok: true, html: readFile(outPath, 'utf8'), healthIsLive: true }); }
      catch (e) { resolvePromise({ ok: false, error: 'could not read compare output: ' + String((e && e.message) || e) }); }
    });
  });
}

/** Plain-text HTML fallback — never an empty frame when the archify CLI is unavailable or errors. */
export function fallbackHtml(json) {
  const nodes = (json.boundaries || []).map((b) => `<li><b>${b.label}</b>: ${b.wraps.join(', ')}</li>`).join('');
  const edges = (json.connections || []).map((e) => `<li>${e.from} &rarr; ${e.to}${e.label ? ' (' + e.label + ')' : ''}</li>`).join('');
  const services = (json.components || []).map((c) => `<li><b>${c.label}</b> [${c.type}] ${c.sublabel || ''} ${c.tag ? '&mdash; ' + c.tag : ''}</li>`).join('');
  const cards = (json.cards || []).map((c) => `<li><b>${c.title}</b><ul>${(c.items || []).map((i) => `<li>${i}</li>`).join('')}</ul></li>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Architecture (fallback)</title></head><body>
  <h1>Sabertooth architecture — plain fallback (archify CLI unavailable)</h1>
  <h2>Nodes</h2><ul>${nodes}</ul>
  <h2>Primary services</h2><ul>${services}</ul>
  <h2>Edges</h2><ul>${edges}</ul>
  <h2>Every House stage</h2><ul>${cards}</ul>
  </body></html>`;
}

/**
 * Render `json` through the vendored archify CLI (node vendor/archify/bin/archify.mjs
 * render architecture <in.json> <out.html>). Falls back to a plain HTML page on any
 * failure (missing CLI, non-zero exit, timeout) — never an empty iframe.
 */
export function renderArchitectureHtml({ json, archifyBin, workDir, spawnImpl = spawn, timeoutMs = 20000, exists = existsSync, writeFile = writeFileSync, readFile = readFileSync, mkdir = mkdirSync }) {
  return new Promise((resolvePromise) => {
    if (!archifyBin || !exists(archifyBin)) {
      return resolvePromise({ ok: false, html: fallbackHtml(json), reason: 'archify CLI not found at ' + archifyBin });
    }
    try { mkdir(workDir, { recursive: true }); } catch { /* best effort */ }
    const inPath = join(workDir, 'architecture.json');
    const outPath = join(workDir, 'architecture.html');
    try { writeFile(inPath, JSON.stringify(json), 'utf8'); }
    catch (e) { return resolvePromise({ ok: false, html: fallbackHtml(json), reason: 'could not write input JSON: ' + String((e && e.message) || e) }); }
    let done = false;
    const child = spawnImpl('node', [archifyBin, 'render', 'architecture', inPath, outPath], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const timer = setTimeout(() => { if (!done) { done = true; try { child.kill(); } catch {} resolvePromise({ ok: false, html: fallbackHtml(json), reason: 'archify CLI timed out after ' + timeoutMs + ' ms' }); } }, timeoutMs);
    let stderr = '';
    child.stderr && child.stderr.on('data', (c) => { stderr += String(c); });
    child.on('error', (e) => { if (!done) { done = true; clearTimeout(timer); resolvePromise({ ok: false, html: fallbackHtml(json), reason: String((e && e.message) || e) }); } });
    child.on('close', (code) => {
      if (done) return;
      done = true; clearTimeout(timer);
      if (code !== 0) return resolvePromise({ ok: false, html: fallbackHtml(json), reason: 'archify exited ' + code + ': ' + stderr.trim().slice(-300) });
      try { resolvePromise({ ok: true, html: readFile(outPath, 'utf8') }); }
      catch (e) { resolvePromise({ ok: false, html: fallbackHtml(json), reason: 'could not read rendered HTML: ' + String((e && e.message) || e) }); }
    });
  });
}
