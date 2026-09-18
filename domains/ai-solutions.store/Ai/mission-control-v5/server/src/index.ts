/**
 * MISSION CONTROL: AGENCY SWARM v5 (Orchestrator Edition) — API server.
 *
 * Four orchestrator harnesses; roles come from the skill catalog and ride on
 * sub-agents. No model is named in the UI — OmniRoute resolves it at run time.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { AGENTS, CATEGORIES } from './agents.js';
import { registerBrainRoutes } from './brain.js';
import { buildKnowledgeGraph, previewFile, searchKnowledge } from './knowledge.js';
import { describeExecutors, describeProviders, routerLive } from './omniroute.js';
import { registerMcpServer } from './mcpServer.js';
import { registerBridgeRoutes } from './bridge.js';
import { registerOfficialVoteRoutes } from './official-vote-routes.js';
import { pingService } from './service-health.js';
import { verifyProvenance } from './attestation.js';
import { loadState } from './store.js';
import { acknowledgeAlert, createPaperMatesTrustCase, createSupportCase, listAlerts, listPaperMatesTrustCases, listSupportCases, loadControlState, observeServices, updatePaperMatesTrustCase, updateSupportCase } from './control-store.js';
import { createMarketingItem, decideMarketingItem, ingestMarketingInbox, listMarketingItems, loadMarketingState } from './marketing-queue.js';
import { activeCount, createTask, deleteTask, listTasks, moveTask, retryTask, subscribe } from './swarm.js';
import type { AgentDef, Column } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3151) || 3151;
const HOST = (process.env.MISSION_CONTROL_BIND_HOST ?? '127.0.0.1').trim();
const VERSION = '5.1.0';
const EDITION = 'Governed Desktop Edition';
const INSTANCE_ID = (process.env.MISSION_CONTROL_INSTANCE_ID ?? '').trim() || randomUUID();
const STARTED_AT = new Date().toISOString();
const RUNTIME_AUTHORIZED = process.env.MISSION_CONTROL_RUNTIME_AUTHORIZED === '1';
const LOCAL_ORIGINS = new Set([
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  `http://127.0.0.1:${PORT}`,
  `http://localhost:${PORT}`,
]);

loadState();
loadControlState();
loadMarketingState();

const app = express();
app.use(
  cors({
    origin(origin, callback) {
      // Electron/file requests omit Origin. Browser development is deliberately
      // limited to the two loopback Vite origins, never a LAN wildcard.
      if (!origin || LOCAL_ORIGINS.has(origin)) return callback(null, true);
      return callback(new Error('MISSION_CONTROL_ORIGIN_BLOCKED'));
    },
  }),
);
app.use(express.json({ limit: '1mb' }));

const SUBAGENT_FILES = ['SOUL.md', 'HEARTBEAT.md', 'TOOLS.md', 'SKILLS.md'] as const;
const subagentsRoot = join(__dirname, '../../../.agents/subagents');

/**
 * Sections that DOCUMENT the report format rather than containing a report.
 *
 * Every HEARTBEAT.md carries a "Report shape" block spelling out the format:
 *
 *   - GREEN: fact + evidence handle (URL, path, exit 0)
 *   - RED: fact + blocker + next action
 *
 * The old parser matched those template lines and took the LAST one — and since
 * RED is always documented after GREEN, EVERY agent resolved to red forever,
 * whatever its real state. The graph was colouring itself from the instructions,
 * not the status, which is worse than showing nothing: a board that is always
 * red is a board nobody reads.
 */
const TEMPLATE_HEADING = /^#{1,6}\s*(report\s*shape|format|template|example|legend|schema)\b/i;

/** Drop sections that only describe the format, so their examples cannot be read as status. */
function stripTemplateSections(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const kept: string[] = [];
  let skipDepth = 0;
  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s/);
    if (heading) {
      const depth = heading[1].length;
      if (skipDepth && depth <= skipDepth) skipDepth = 0; // section ended
      if (!skipDepth && TEMPLATE_HEADING.test(line)) {
        skipDepth = depth;
        continue;
      }
    }
    if (!skipDepth) kept.push(line);
  }
  return kept.join('\n');
}

function subagentHealth(heartbeat: string, updatedAt: Date) {
  const reports = stripTemplateSections(heartbeat).match(
    /^\s*(?:[-*]\s*)?(GREEN|YELLOW|RED):.*$/gim,
  );
  const explicit = reports
    ?.at(-1)
    ?.match(/(?:[-*]\s*)?(GREEN|YELLOW|RED):/i)?.[1]
    ?.toLowerCase();
  if (explicit) return explicit;
  // No real report: fall back to freshness. Yellow means "no status filed",
  // which is honest — it is not a claim that the agent is healthy.
  return Date.now() - updatedAt.getTime() > 24 * 60 * 60 * 1000 ? 'red' : 'yellow';
}

// Fixed-root reader: graph clients can inspect agent doctrine, never arbitrary files.
//
// Two sources, merged: (1) on-disk doctrine under .agents/subagents/<id>/ with
// real HEARTBEAT.md freshness, and (2) the orchestrator roster in agents.ts.
// On-disk entries win when present (they carry live heartbeats); any orchestrator
// with no on-disk folder is synthesized from agents.ts so the live 3D graph always
// shows the real swarm — never the lone core node an empty directory produced.
app.get('/api/subagents', (_req, res) => {
  const agents = readDiskSubagents();
  const seen = new Set(agents.map((a) => a.id));
  for (const agent of AGENTS) {
    if (!seen.has(agent.id)) agents.push(synthesizeSubagent(agent));
  }
  res.json({ agents });
});

/** Read live subagent doctrine from disk; empty when the directory is absent. */
function readDiskSubagents() {
  if (!existsSync(subagentsRoot)) return [];
  return readdirSync(subagentsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const files = Object.fromEntries(
        SUBAGENT_FILES.map((name) => {
          const path = join(subagentsRoot, entry.name, name);
          return [name, existsSync(path) ? readFileSync(path, 'utf8') : ''];
        }),
      );
      const heartbeatPath = join(subagentsRoot, entry.name, 'HEARTBEAT.md');
      const updatedAt = existsSync(heartbeatPath) ? statSync(heartbeatPath).mtime : new Date(0);
      return {
        id: entry.name,
        name: files['SOUL.md'].match(/^#\s+(.+?)(?:\s+SOUL(?:\.md)?)?$/m)?.[1] ?? entry.name,
        health: subagentHealth(files['HEARTBEAT.md'], updatedAt),
        updatedAt: updatedAt.toISOString(),
        files,
      };
    });
}

/**
 * Synthesize a subagent node from an orchestrator definition when no live
 * on-disk doctrine exists for it. Doctrine files are generated from the single
 * source of truth (agents.ts) so the graph and its drawer stay honest without a
 * parallel set of files that drift. Health is green: the orchestrator is defined
 * and available; there is simply no heartbeat writer attached.
 */
function synthesizeSubagent(agent: AgentDef) {
  const skillLines = (agent.harness ?? '')
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
  const files = {
    'SOUL.md': `# ${agent.name} SOUL\n\n${agent.description}\n`,
    'HEARTBEAT.md':
      `# ${agent.name} HEARTBEAT\n\n` +
      `SKELETON ENTRY — no live heartbeat writer is attached to this orchestrator.\n` +
      `Status is inferred from its definition in agents.ts, not from a filed report.\n`,
    'TOOLS.md': `# ${agent.name} TOOLS\n\n${agent.harness ?? '(no harness declared)'}\n`,
    'SKILLS.md': `${skillLines.map((s) => `- ${s}`).join('\n')}\n`,
  };
  return {
    id: agent.id,
    name: agent.name,
    health: 'green' as const,
    updatedAt: new Date().toISOString(),
    files,
  };
}

// ── Runtime identity / health ─────────────────────────────────────────────────
// A port or 200 alone is not proof. Electron and operators must first compare
// this response with the expected Mission Control service identity.
app.get('/api/identity', (_req, res) => {
  res.json({
    service: 'mission-control',
    instanceId: INSTANCE_ID,
    apiVersion: 'v1',
    version: VERSION,
    edition: EDITION,
    startedAt: STARTED_AT,
    bindHost: HOST,
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'mission-control',
    name: 'Mission Control: Agency Swarm v5',
    edition: EDITION,
    version: VERSION,
    routerLive: routerLive(),
    providers: describeProviders(),
    executors: describeExecutors(),
    agents: AGENTS.length,
    categories: CATEGORIES.length,
    activeTasks: activeCount(),
    time: new Date().toISOString(),
  });
});

// ── Services reachability ─────────────────────────────────────────────────────
/**
 * LAN address of this node, DETECTED — never hardcoded.
 *
 * This used to default to a fixed LAN address. When the disk moved between
 * nodes, that address died, and because the OmniRoute entry built its PROBE URL
 * from it, Mission Control spent 9s timing out against a machine that no longer
 * existed and reported its own gateway DOWN while the gateway was serving
 * perfectly on loopback.
 *
 * Detecting it means the next hardware move fixes itself. NODE_LAN_HOST still
 * overrides, for the case where the guess is wrong.
 */
function detectLanHost(): string {
  const candidates: string[] = [];
  for (const addrs of Object.values(networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (a.family !== 'IPv4' || a.internal) continue;
      candidates.push(a.address);
    }
  }
  // Prefer a real LAN address. 172.16/12 is where Docker and WSL put their
  // virtual switches — picking one of those yields a link nothing can reach.
  const preferred = candidates.find((ip) => /^(192\.168\.|10\.)/.test(ip));
  return preferred ?? candidates.find((ip) => !/^(172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(ip)) ?? '127.0.0.1';
}

const LAN_HOST = (process.env.NODE_LAN_HOST ?? detectLanHost()).trim();
const OMNIROUTE_GATEWAY_BASE_URL = (process.env.OPENAI_COMPAT_BASE_URL ?? 'http://localhost:20129/v1').replace(/\/+$/, '');

app.get('/api/services', async (_req, res) => {
  const openclawPort = Number(process.env.OPENCLAW_PORT ?? 18789) || 18789;
  const hermesPort = Number(process.env.HERMES_PORT ?? 9119) || 9119;
  const hermesHealthUrl = process.env.HERMES_HEALTH_URL?.trim() || `http://127.0.0.1:${hermesPort}/health`;
  const openclawHealthUrl = process.env.OPENCLAW_HEALTH_URL?.trim() || `http://127.0.0.1:${openclawPort}/health`;
  const omniRouteHealthUrl = process.env.OMNIROUTE_HEALTH_URL?.trim() || 'http://192.168.0.8:20128/v1';
  const dateAppHealthUrl = process.env.DATE_APP_HEALTH_URL?.trim() || 'http://127.0.0.1:8000/api/v1/health';
  const oneminShimStatusUrl = process.env.ONEMIN_SHIM_STATUS_URL?.trim() ?? '';
  // Per-service ping timeout. OmniRoute's /v1/models aggregates models from
  // backends and answers in ~3s, so it needs a longer window than a fast
  // fail-closed ECONNREFUSED on an idle port. Others fail fast, keeping the
  // panel snappy.
  // The authenticated API-v1 root returns basic gateway status. It is separate
  // from the inference gateway and the optional omniroute MCP process.
  const omniKey = (process.env.OPENAI_COMPAT_API_KEY ?? '').trim() || (process.env.OMNIROUTE_API_KEY ?? '').trim();
  const results = await Promise.all([
    pingService({
      name: 'Hermes',
      url: hermesHealthUrl,
      timeoutMs: 2500,
      expectedServiceMarker: { field: 'service', allowedValues: [process.env.HERMES_EXPECTED_SERVICE?.trim() || 'hermes'] },
    }),
    pingService({
      name: 'OpenClaw',
      url: openclawHealthUrl,
      timeoutMs: 2500,
      expectedServiceMarker: { field: 'service', allowedValues: [process.env.OPENCLAW_EXPECTED_SERVICE?.trim() || 'openclaw'] },
    }),
    pingService({
      name: 'OmniRoute',
      url: omniRouteHealthUrl,
      openUrl: `http://${LAN_HOST}:20128/dashboard`,
      lanReachable: true,
      // Authorized /api/v1 aggregates every configured provider live and can
      // exceed 4s with a full provider roster; anonymous requests return fast.
      timeoutMs: 15_000,
      headers: omniKey ? { authorization: `Bearer ${omniKey}` } : {},
      requiresAuth: true,
      authConfigured: Boolean(omniKey),
      // OmniRoute's /api/v1 answers with an OpenAI-style model list and no
      // `service` field, so the default marker verifies that documented shape.
      // Set OMNIROUTE_EXPECTED_SERVICE only if the gateway gains a service field.
      expectedServiceMarker: process.env.OMNIROUTE_EXPECTED_SERVICE?.trim()
        ? { field: 'service', allowedValues: [process.env.OMNIROUTE_EXPECTED_SERVICE.trim()] }
        : { field: 'object', allowedValues: ['list'] },
    }),
    // This is intentionally independent from the gateway. An idle or offline
    // `omniroute --mcp` process must never turn the main cloud gateway red.
    pingService({
      name: 'OmniRoute MCP',
      url: process.env.OMNIROUTE_MCP_STATUS_URL?.trim() ?? '',
      timeoutMs: 2500,
      expectedServiceMarker: { field: 'service', allowedValues: [process.env.OMNIROUTE_MCP_EXPECTED_SERVICE?.trim() || 'omniroute-mcp'] },
    }),
    pingService({
      name: 'Ollama Fail-safe',
      url: 'http://127.0.0.1:11434/api/tags',
      timeoutMs: 2500,
      expectedServiceMarker: { field: 'models', requiresArray: true },
    }),
    pingService({
      name: 'Date App Backend',
      url: dateAppHealthUrl,
      openUrl: 'http://localhost:8000/docs',
      lanReachable: true,
      timeoutMs: 3000,
      expectedServiceMarker: { field: 'status', allowedValues: ['ok', 'degraded'] },
    }),
    pingService({
      name: 'onemin-shim',
      url: oneminShimStatusUrl,
      openUrl: oneminShimStatusUrl || undefined,
      timeoutMs: 2500,
      expectedServiceMarker: { field: 'service', allowedValues: ['onemin-shim'] },
    }),
  ]);
  const createdAlerts = observeServices(results);
  res.json({ services: results, gatewayBaseUrl: OMNIROUTE_GATEWAY_BASE_URL, alerts: createdAlerts });
});

// ── Agent library ─────────────────────────────────────────────────────────────
app.get('/api/agents', (req, res) => {
  const q = String(req.query.q ?? '')
    .trim()
    .toLowerCase();
  const category = String(req.query.category ?? '').trim();
  let agents = AGENTS;
  if (category) agents = agents.filter((agent) => agent.category === category);
  if (q) {
    agents = agents.filter((agent) => agent.id.includes(q) || agent.description.toLowerCase().includes(q));
  }
  res.json({ total: AGENTS.length, count: agents.length, categories: CATEGORIES, agents });
});

// ── Tasks ─────────────────────────────────────────────────────────────────────
app.get('/api/tasks', (_req, res) => {
  res.json({ tasks: listTasks() });
});

app.post('/api/tasks', (req, res) => {
  try {
    const task = createTask({
      title: req.body?.title,
      prompt: req.body?.prompt,
      agentIds: req.body?.agentIds,
      mode: req.body?.mode,
      executor: req.body?.executor,
    });
    res.status(201).json({ task });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

const COLUMNS: Column[] = ['NOW', 'NEXT', 'BLOCKED', 'DONE'];

app.patch('/api/tasks/:id', (req, res) => {
  try {
    const column = req.body?.column as Column;
    if (!COLUMNS.includes(column)) {
      res.status(400).json({ error: `column must be one of ${COLUMNS.join('/')}` });
      return;
    }
    res.json({ task: moveTask(req.params.id, column) });
  } catch (err) {
    res.status(404).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post('/api/tasks/:id/retry', (req, res) => {
  try {
    res.json({ task: retryTask(req.params.id) });
  } catch (err) {
    res.status(404).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  if (deleteTask(req.params.id)) res.status(204).end();
  else res.status(404).json({ error: 'Task not found.' });
});

// ── Unified control center: local support metadata + alert acknowledgments ───
// Customer support content is intentionally limited to redacted local metadata.
// This increment never delivers an external message, changes a payment, or reads
// account/identity information.
app.get('/api/control/alerts', (_req, res) => {
  res.json({ alerts: listAlerts() });
});

app.post('/api/control/alerts/:id/ack', (req, res) => {
  try {
    res.json({ alert: acknowledgeAlert(req.params.id) });
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/control/support', (_req, res) => {
  res.json({ cases: listSupportCases() });
});

app.post('/api/control/support', (req, res) => {
  try {
    res.status(201).json({ supportCase: createSupportCase(req.body ?? {}) });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.patch('/api/control/support/:id', (req, res) => {
  try {
    res.json({ supportCase: updateSupportCase(req.params.id, req.body ?? {}) });
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ── PaperMates: static readiness, validated skill inventory, local trust queue ─
// All externally consequential actions remain disabled. This is intentionally
// not a model route, moderation engine, or customer-message sender.
const PAPERMATES_LAUNCH_ITEMS = [
  { id: 'adult-consent', label: 'Adult Gate and Consent Ledger', state: 'prototype', dependency: 'Backend consent record and regional policy' },
  { id: 'orbit', label: 'Orbit Introductions', state: 'prototype', dependency: 'Matching and messaging service' },
  { id: 'intent', label: 'Intent Card', state: 'prototype', dependency: 'Profile data contract' },
  { id: 'bot-check', label: 'Bot Check', state: 'policy required', dependency: 'Signal policy, evaluation, and appeal flow' },
  { id: 'report-block', label: 'Report and Block', state: 'prototype', dependency: 'Backend enforcement and response SLA' },
  { id: 'check-in', label: 'Safe Check-In Plan', state: 'backend required', dependency: 'Consent, retention, and trusted-contact workflow' },
  { id: 'circle-date', label: 'Circle Date', state: 'prototype', dependency: 'Group membership and permission model' },
  { id: 'quiet-pass', label: 'Quiet Pass', state: 'prototype', dependency: 'Matching preference contract' },
  { id: 'founding-signal', label: 'Founding Signal', state: 'policy required', dependency: 'Eligibility, rate limits, and truthful launch terms' },
  { id: 'help-appeal', label: 'Human Help and Appeal', state: 'prototype', dependency: 'Support policy and review workflow' },
] as const;

const PAPERMATES_SKILLS = [
  ['accessibility-review', 'WCAG, keyboard, motion, contrast, and touch-target review'],
  ['design-critique', 'Hierarchy, usability, interaction, and trust-language review'],
  ['design-handoff', 'Component states, data boundaries, and acceptance criteria'],
  ['design-system', 'Tokens, variants, accessibility notes, and visual consistency'],
  ['research-synthesis', 'Redacted evidence themes and prioritized product learning'],
  ['user-research', 'Adult-only, consent-led research planning'],
  ['ux-copy', 'Dignified consent, trust, support, and error-state language'],
  ['papermates-trust-support', 'Local cases, review boundaries, and assisted-draft policy'],
] as const;

app.get('/api/papermates/overview', (_req, res) => {
  res.json({
    brand: 'PaperMates — You&i, watched over by AI',
    aiSupport: { state: 'NOT CONFIGURED', detail: 'Human-reviewed Gemini or Claude drafting is proposed but not activated.' },
    launchItems: PAPERMATES_LAUNCH_ITEMS,
    skills: PAPERMATES_SKILLS.map(([id, description]) => ({ id, description, state: 'VALIDATED' })),
  });
});

app.get('/api/papermates/trust', (_req, res) => {
  res.json({ cases: listPaperMatesTrustCases() });
});

app.post('/api/papermates/trust', (req, res) => {
  try {
    res.status(201).json({ trustCase: createPaperMatesTrustCase(req.body ?? {}) });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.patch('/api/papermates/trust/:id', (req, res) => {
  try {
    res.json({ trustCase: updatePaperMatesTrustCase(req.params.id, req.body ?? {}) });
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ── Real-time: Server-Sent Events ────────────────────────────────────────────
app.get('/api/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  });
  const send = (payload: unknown) => res.write(`data: ${JSON.stringify(payload)}\n\n`);
  send({ type: 'hello', routerLive: routerLive() });

  const unsubscribe = subscribe((event) => {
    send({ type: event.type, task: event.task ?? null });
  });
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

// ── Brain hub (repository knowledge, Graphy, Obsidian status, and journals) ──
registerBrainRoutes(app);

// ── Bridge hub (official-platform visibility + operational bridges) ───────────
registerBridgeRoutes(app);

// ── Official vote engine (isolated from general bridge and model routing) ──────
registerOfficialVoteRoutes(app);

// ── Mission Control AS an MCP server (expose to other AI platforms) ──────────
// Any agent with a streamable-HTTP MCP client can POST to /api/mcp and pull the
// task + capability set defined by the monorepo. See server/src/mcpServer.ts.
registerMcpServer(app);

// ── KNOWLEDGE GRAPH — the repo as a navigable, searchable graph ──────────────
// Agents hit /api/knowledge/search on mission start instead of guessing paths;
// the Graphy KNOWLEDGE view renders /api/knowledge/graph in 3D. Secrets and
// build junk are excluded at walk time and re-checked on preview.
app.get('/api/knowledge/graph', (_req, res) => {
  res.json(buildKnowledgeGraph());
});
app.get('/api/knowledge/search', (req, res) => {
  const q = String(req.query.q ?? '');
  res.json({ query: q, hits: searchKnowledge(q) });
});
app.get('/api/knowledge/file', (req, res) => {
  try {
    res.json(previewFile(String(req.query.path ?? '')));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ── Provenance — checks committed Markdown artifacts without reading secrets ───
app.post('/api/evidence/verify', async (req, res) => {
  const result = await verifyProvenance(join(__dirname, '../../..'), req.body ?? {});
  res.status(result.state === 'BLOCKED' ? 400 : 200).json(result);
});

// ── DATE APP METRICS — real production data, never mock ────────────────────
app.get('/api/dateapp/metrics', async (_req, res) => {
  try {
    const [health, allocations] = await Promise.all([
      fetch('http://127.0.0.1:8000/api/v1/health').then(r => r.json()).catch(() => null),
      fetch('http://127.0.0.1:8000/api/v1/health/allocations/summary').then(r => r.json()).catch(() => null),
    ]);
    res.json({
      health: health ?? { status: 'unreachable' },
      allocations: allocations ?? null,
      frontend: { url: 'http://localhost:3200', reachable: true },
      public: {
        site: 'https://youandinotai.com',
        api: 'https://api.youandinotai.com',
      },
    });
  } catch {
    res.json({ health: { status: 'unreachable' }, allocations: null });
  }
});

// ── MARKETING APPROVAL QUEUE — Paperclip (9020) routes marketing here for
// Joshua's approval and response before anything publishes ──────────────────
app.get('/api/marketing/queue', (_req, res) => {
  ingestMarketingInbox();
  const all = listMarketingItems();
  res.json({ items: all, pending: all.filter((i) => i.status === 'pending').length });
});

app.post('/api/marketing/queue', (req, res) => {
  try {
    res.status(201).json({ item: createMarketingItem(req.body ?? {}) });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post('/api/marketing/queue/:id/decide', (req, res) => {
  try {
    res.json({ item: decideMarketingItem(req.params.id, req.body ?? {}) });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});


// ── CANONICAL RECORD — Joshua's signed, hash-anchored doctrine page. Served
// verbatim; the page verifies its own SHA-256 in the browser ────────────────
const canonicalDir = join(__dirname, '..', '..', '..', 'apps', 'canonical-record');
if (existsSync(canonicalDir)) {
  app.use('/canonical', express.static(canonicalDir));
}

// ── Static client (production build) ─────────────────────────────────────────
const clientDist = join(__dirname, '..', '..', 'client', 'dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(join(clientDist, 'index.html')));
}

if (!RUNTIME_AUTHORIZED) {
  // Runtime start is deliberately separate from source changes and must be an
  // explicit owner action. This guard prevents an accidental `npm start` from
  // claiming that a task-control runtime has been authorized.
  console.error('[mission-control] RUNTIME AUTHORIZATION REQUIRED — set MISSION_CONTROL_RUNTIME_AUTHORIZED=1 after explicit owner approval.');
  process.exitCode = 3;
} else {
  app.listen(PORT, HOST, () => {
    const live = routerLive();
    console.log(`[mission-control] identity=mission-control instance=${INSTANCE_ID} v${VERSION} (${EDITION}) on ${HOST}:${PORT}`);
    console.log(`[mission-control] agents=${AGENTS.length} divisions=${CATEGORIES.length}`);
    console.log(
      `[omniroute] ${live ? 'LIVE' : 'OFFLINE — no provider configured (fail-closed, tasks will BLOCK honestly)'}`,
    );
  });
}
