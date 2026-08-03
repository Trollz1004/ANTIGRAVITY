/**
 * MISSION CONTROL: AGENCY SWARM v5 (Orchestrator Edition) — API server.
 *
 * Four orchestrator harnesses; roles come from the skill catalog and ride on
 * sub-agents. No model is named in the UI — OmniRoute resolves it at run time.
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { AGENTS, CATEGORIES } from './agents.js';
import { registerBrainRoutes } from './brain.js';
import { describeExecutors, describeProviders, routerLive } from './omniroute.js';
import { PIECES_MCP_URL, pingPieces } from './pieces.js';
import { registerMcpServer } from './mcpServer.js';
import { loadState } from './store.js';
import {
  activeCount,
  createTask,
  deleteTask,
  listTasks,
  moveTask,
  retryTask,
  subscribe,
} from './swarm.js';
import type { Column } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3151) || 3151;
const VERSION = '5.0.0';
const EDITION = 'Orchestrator Edition';

loadState();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

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
 * LAN address of this node. The dashboard gets opened from the laptop, where
 * 127.0.0.1 means the laptop — a dead link. DHCP assigns this, so it is
 * overridable rather than hardcoded.
 */
const LAN_HOST = (process.env.NODE_LAN_HOST ?? '192.168.0.15').trim();

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
      detail: aborted ? `timeout (${timeoutMs}ms)` : (err instanceof Error ? err.message : String(err)),
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
    { name: 'OmniRoute', url: `http://${LAN_HOST}:20128/v1/models`, timeoutMs: 9000, lan: true },
    { name: 'Ollama', url: 'http://127.0.0.1:11434/api/tags', timeoutMs: 2500, lan: false },
  ];
  // The gateway requires auth on /v1/*. Probing without the key returns 401 and
  // reads as DOWN on a perfectly healthy gateway; with it, the card can report
  // the live model count instead of a status code.
  // `||`, not `??`: OPENAI_COMPAT_API_KEY is present but empty in .env, and `??`
  // would hand back that empty string instead of falling through to the real key.
  const omniKey =
    (process.env.OPENAI_COMPAT_API_KEY ?? '').trim() || (process.env.OMNIROUTE_API_KEY ?? '').trim();
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
  const q = String(req.query.q ?? '').trim().toLowerCase();
  const category = String(req.query.category ?? '').trim();
  let agents = AGENTS;
  if (category) agents = agents.filter((agent) => agent.category === category);
  if (q) {
    agents = agents.filter(
      (agent) => agent.id.includes(q) || agent.description.toLowerCase().includes(q),
    );
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
