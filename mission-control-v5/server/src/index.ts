/**
 * MISSION CONTROL: AGENCY SWARM v5 (Haiku-Sonnet 3.5 Edition) — API server.
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { AGENTS, CATEGORIES } from './agents.js';
import { describeProviders, routerLive } from './omniroute.js';
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
const EDITION = 'Haiku-Sonnet 3.5 Edition';

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
  status: 'up' | 'down';
  ms: number;
  detail: string;
}

async function pingService(name: string, url: string, timeoutMs = 2500): Promise<ServiceStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const res = await fetch(url, { signal: controller.signal });
    const ms = Date.now() - started;
    return {
      name,
      url,
      status: res.ok ? 'up' : 'down',
      ms,
      detail: res.ok ? 'OK' : `HTTP ${res.status}`,
    };
  } catch (err) {
    const ms = Date.now() - started;
    const aborted = err instanceof Error && err.name === 'AbortError';
    return {
      name,
      url,
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
    { name: 'Hermes', url: 'http://127.0.0.1:9119', timeoutMs: 2500 },
    { name: 'OpenClaw', url: `http://127.0.0.1:${openclawPort}`, timeoutMs: 2500 },
    { name: 'OmniRoute', url: 'http://127.0.0.1:20128/v1/models', timeoutMs: 9000 },
    { name: 'Ollama', url: 'http://127.0.0.1:11434/api/tags', timeoutMs: 2500 },
  ];
  const results = await Promise.all(
    services.map((s) => pingService(s.name, s.url, s.timeoutMs)),
  );
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
