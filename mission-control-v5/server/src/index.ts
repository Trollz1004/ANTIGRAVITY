/**
 * MISSION CONTROL: AGENCY SWARM v5 (Orchestrator Edition) — API server.
 *
 * Four orchestrator harnesses; roles come from the skill catalog and ride on
 * sub-agents. No model is named in the UI — OmniRoute resolves it at run time.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
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
import { PIECES_MCP_URL, pingPieces } from './pieces.js';
import { registerMcpServer } from './mcpServer.js';
import { loadState } from './store.js';
import { activeCount, createTask, deleteTask, listTasks, moveTask, retryTask, subscribe } from './swarm.js';
import type { AgentDef, Column } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3151) || 3151;
const VERSION = '5.0.0';
const EDITION = 'Orchestrator Edition';

loadState();

const app = express();
app.use(cors());
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

// ── Health / router status ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
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
interface ServiceStatus {
  name: string;
  url: string;
  /**
   * Where the OPEN link goes. This is not always the probed URL: an API
   * endpoint answers a token-bearing probe but shows a browser only an auth
   * error, so link the human page and probe the API.
   */
  openUrl: string;
  lanReachable: boolean;
  status: 'up' | 'down';
  ms: number;
  detail: string;
}

/**
 * LAN address of this node, DETECTED — never hardcoded.
 *
 * This used to default to a literal '192.168.0.15'. When the disk moved from
 * the T5500 into Sabretooth (192.168.0.8) that address died, and because the
 * OmniRoute entry built its PROBE url from it, Mission Control spent 9s timing
 * out against a machine that no longer exists and reported its own gateway
 * DOWN while the gateway was serving perfectly on loopback.
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

function lanUrl(url: string): string {
  return url.replace(/(127\.0\.0\.1|localhost)/, LAN_HOST);
}

async function pingService(
  name: string,
  url: string,
  timeoutMs = 2500,
  lanReachable = false,
  headers: Record<string, string> = {},
  openOverride?: string,
): Promise<ServiceStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  const openUrl = openOverride ?? (lanReachable ? lanUrl(url) : url);
  try {
    const res = await fetch(url, { signal: controller.signal, headers });
    const ms = Date.now() - started;
    // 401/403 means the service answered and enforced auth — that is UP, not
    // down. Judging liveness purely by 2xx reported healthy gateways as dead.
    const authGated = res.status === 401 || res.status === 403;
    let detail = res.ok ? 'OK' : authGated ? `auth required (HTTP ${res.status})` : `HTTP ${res.status}`;
    // Verify by content where the body says something meaningful.
    if (res.ok) {
      try {
        const body: any = await res.json();
        const count = Array.isArray(body?.data)
          ? body.data.length
          : Array.isArray(body?.models)
            ? body.models.length
            : null;
        if (count !== null) detail = `OK · ${count} models`;
      } catch {
        /* not JSON — plain OK stands */
      }
    }
    return {
      name,
      url,
      openUrl,
      lanReachable,
      status: res.ok || authGated ? 'up' : 'down',
      ms,
      detail,
    };
  } catch (err) {
    const ms = Date.now() - started;
    const aborted = err instanceof Error && err.name === 'AbortError';
    return {
      name,
      url,
      openUrl,
      lanReachable,
      status: 'down',
      ms,
      detail: aborted ? `timeout (${timeoutMs}ms)` : err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

app.get('/api/services', async (_req, res) => {
  const openclawPort = Number(process.env.OPENCLAW_PORT ?? 9120) || 9120;
  // Per-service ping timeout. OmniRoute's /v1/models aggregates models from
  // backends and answers in ~3s, so it needs a longer window than a fast
  // fail-closed ECONNREFUSED on an idle port. Others fail fast, keeping the
  // panel snappy.
  const services = [
    { name: 'Hermes', url: 'http://127.0.0.1:9119', timeoutMs: 2500, lan: false },
    { name: 'OpenClaw', url: `http://127.0.0.1:${openclawPort}`, timeoutMs: 2500, lan: false },
    // OmniRoute is probed at the address it advertises as its Local Server and
    // that every other node actually uses — not loopback. (Its dashboard also
    // lists 172.17.x / 172.25.x; those are the Docker and WSL bridges, not the
    // LAN.) DHCP assigns this, so NODE_LAN_HOST overrides it.
    // PROBE ON LOOPBACK. This server runs on the node, so 127.0.0.1 is always
    // correct and instant; only the clickable "open" link below needs the LAN
    // address, because the dashboard is opened from the laptop.
    { name: 'OmniRoute', url: 'http://127.0.0.1:20128/v1/models', timeoutMs: 4000, lan: true },
    { name: 'Ollama', url: 'http://127.0.0.1:11434/api/tags', timeoutMs: 2500, lan: false },
  ];
  // The gateway requires auth on /v1/*. Probing without the key returns 401 and
  // reads as DOWN on a perfectly healthy gateway; with it, the card can report
  // the live model count instead of a status code.
  // `||`, not `??`: OPENAI_COMPAT_API_KEY is present but empty in .env, and `??`
  // would hand back that empty string instead of falling through to the real key.
  const omniKey = (process.env.OPENAI_COMPAT_API_KEY ?? '').trim() || (process.env.OMNIROUTE_API_KEY ?? '').trim();
  const results = await Promise.all([
    ...services.map((s) =>
      pingService(
        s.name,
        s.url,
        s.timeoutMs,
        s.lan,
        s.name === 'OmniRoute' && omniKey ? { authorization: `Bearer ${omniKey}` } : {},
        // /v1/models is an API: a browser cannot send the token and just sees
        // AUTH_002. Send the click to the gateway UI instead.
        s.name === 'OmniRoute' ? `http://${LAN_HOST}:20128/dashboard` : undefined,
      ),
    ),
    // Pieces LTM speaks MCP, not plain HTTP — a raw GET would 400. Probe it with
    // a real initialize roundtrip and fold the result into the services list.
    pingPieces(9_000).then(async (up) => {
      const started = Date.now();
      return {
        name: 'Pieces LTM',
        url: PIECES_MCP_URL,
        openUrl: PIECES_MCP_URL, // loopback-only: Pieces OS binds 127.0.0.1
        lanReachable: false,
        status: (up ? 'up' : 'down') as 'up' | 'down',
        ms: Date.now() - started,
        detail: up ? 'OK' : 'MCP initialize failed',
      };
    }),
  ]);
  res.json({ services: results });
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

// ── Brain hub (Pieces LTM + per-platform journals) ────────────────────────────
registerBrainRoutes(app);

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

// ── PAPERWEIGHT command center (static page; roster + metrics are sample data,
// not live feeds — do not publish outside the LAN) ───────────────────────────
const paperweightDir = join(__dirname, '..', '..', '..', 'apps', 'paperweight');
if (existsSync(paperweightDir)) {
  app.use('/paperweight', express.static(paperweightDir));
}

// ── Static client (production build) ─────────────────────────────────────────
const clientDist = join(__dirname, '..', '..', 'client', 'dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(join(clientDist, 'index.html')));
}

app.listen(PORT, () => {
  const live = routerLive();
  console.log(`[mission-control] v${VERSION} (${EDITION}) on :${PORT}`);
  console.log(`[mission-control] agents=${AGENTS.length} divisions=${CATEGORIES.length}`);
  console.log(
    `[omniroute] ${live ? 'LIVE' : 'OFFLINE — no provider configured (fail-closed, tasks will BLOCK honestly)'}`,
  );
});
