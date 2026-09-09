/**
 * Mission Control as an MCP server (streamable-HTTP, protocol 2025-03-26).
 *
 * Hand-rolled JSON-RPC 2.0 over POST /api/mcp — no SDK dependency for ~6 trivial
 * tools. Any AI-platform agent (Cursor, Claude Desktop, …) can point its MCP
 * client at http://localhost:3151/api/mcp and pull the task + capability set the
 * monorepo defines: read/write a platform journal, list swarm tasks, list
 * repository skills, and list configured platforms.
 *
 * Wire format: `initialize` returns an `mcp-session-id` response header that the
 * client must echo on subsequent requests. `notifications/initialized` is
 * fire-and-forget (204). JSON-RPC errors are returned HTTP 200 with an `error`
 * object (per spec); only transport-level parse failures use 400. Optional bearer
 * auth via MCP_TOKEN (401 if set and missing/wrong). No secrets logged.
 */
import { randomUUID } from 'node:crypto';
import type { Express, Request } from 'express';
import { loadBrainPlatforms, platformSummary, readJournal, writeJournal } from './brainStore.js';
import { loadCatalog } from './catalog.js';
import { authorHermesArtifact } from './hermes-authoring.js';
import { listTasks } from './swarm.js';

const env = (k: string): string => (process.env[k] ?? '').trim();
const MCP_TOKEN = env('MCP_TOKEN');
const PROTOCOL_VERSION = '2025-03-26';
const SERVER_NAME = 'mission-control';
const SERVER_VERSION = '5.0.0';
const SESSION_TTL_MS = 60 * 60_000;

interface Session {
  createdAt: number;
}
const sessions = new Map<string, Session>();

function sweepSessions(): void {
  const now = Date.now();
  for (const [sid, s] of sessions) {
    if (now - s.createdAt > SESSION_TTL_MS) sessions.delete(sid);
  }
}

interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

const TOOLS: ToolDef[] = [
  {
    name: 'read-journal',
    description: "Read a platform's STATE.md journal (read-on-start memory). Returns {content, updatedAt, bytes}.",
    inputSchema: {
      type: 'object',
      properties: { platformId: { type: 'string', description: 'e.g. hermes, openclaw, opencode' } },
      required: ['platformId'],
    },
  },
  {
    name: 'write-journal',
    description:
      "Write a platform's STATE.md journal (write-on-exit memory). Clamped to the platform's char cap with a timestamp prefix.",
    inputSchema: {
      type: 'object',
      properties: {
        platformId: { type: 'string' },
        content: { type: 'string', description: 'Full journal body to write.' },
      },
      required: ['platformId', 'content'],
    },
  },
  {
    name: 'list-tasks',
    description: 'List the live Agency Swarm kanban tasks (NOW/NEXT/BLOCKED/DONE).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list-skills',
        description: 'List skills and task capabilities defined in the C:\\ANTIGRAVITY repository. Optional query filter.',
    inputSchema: {
      type: 'object',
      properties: { q: { type: 'string', description: 'Optional substring filter on id/label/description.' } },
    },
  },
  {
    name: 'list-platforms',
    description: 'List configured brain platforms (per-AI-platform journals) with byte usage.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'author-hermes-artifact',
    description: 'Author a scoped repository skill, skill-hub document, contract, or Hermes YAML config. Rejects credentials and paths outside the allowlist.',
    inputSchema: {
      type: 'object',
      properties: {
        relativePath: { type: 'string', description: 'Allowed: .agents/skills/<name>/SKILL.md, .agents/harness-config/hermes.yaml, ops/skills/, or agent-contracts/.' },
        content: { type: 'string', description: 'Complete artifact content without credentials.' },
      },
      required: ['relativePath', 'content'],
    },
  },
];

// ── Tool dispatch ──────────────────────────────────────────────────────────────
async function dispatch(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'read-journal': {
      const id = String(args?.platformId ?? '');
      const j = readJournal(id);
      if (!j) throw new Error(`Unknown platform: ${id}`);
      return j;
    }
    case 'write-journal': {
      const id = String(args?.platformId ?? '');
      const content = String(args?.content ?? '');
      const w = writeJournal(id, content);
      if (!w) throw new Error(`Unknown platform: ${id}`);
      return w;
    }
    case 'list-tasks':
      return listTasks();
    case 'list-skills': {
      const q = String(args?.q ?? '')
        .trim()
        .toLowerCase();
      const { skills } = loadCatalog();
      const filtered = q
        ? skills.filter((s) => [s.id, s.label, s.description].some((f) => f.toLowerCase().includes(q)))
        : skills;
      return filtered.map((s) => ({
        id: s.id,
        label: s.label,
        category: s.category,
        description: s.description,
        tools: s.tools,
        path: s.path,
        kind: s.kind,
      }));
    }
    case 'list-platforms':
      return loadBrainPlatforms().map(platformSummary);
    case 'author-hermes-artifact':
      return authorHermesArtifact({
        relativePath: String(args?.relativePath ?? ''),
        content: String(args?.content ?? ''),
      });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── JSON-RPC helpers ───────────────────────────────────────────────────────────
const rpcError = (id: unknown, code: number, message: string, data?: unknown) => ({
  jsonrpc: '2.0',
  id,
  error: { code, message, ...(data !== undefined ? { data } : {}) },
});

const rpcOk = (id: unknown, result: unknown) => ({ jsonrpc: '2.0', id, result });

type RpcRequest = Request & { __mcpSessionId?: string };

async function handleOne(msg: any, req: RpcRequest): Promise<unknown> {
  if (!msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0') {
    return rpcError(msg?.id ?? null, -32600, 'Invalid Request');
  }
  const id = msg.id ?? null;
  const method: string = msg.method;
  const params = msg.params ?? {};

  // Notification (no id) — fire-and-forget. Only notifications/initialized expected.
  if (id === null || id === undefined) return null;

  if (method === 'initialize') {
    const sid = randomUUID();
    sessions.set(sid, { createdAt: Date.now() });
    req.__mcpSessionId = sid;
    return rpcOk(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
    });
  }

  // Everything else requires an established session.
  const sid = req.get('mcp-session-id');
  if (!sid || !sessions.has(sid)) {
    return rpcError(id, -32000, 'mcp-session-id header required (call initialize first)');
  }
  sessions.get(sid)!.createdAt = Date.now();

  if (method === 'tools/list') return rpcOk(id, { tools: TOOLS });

  if (method === 'tools/call') {
    const name = String(params?.name ?? '');
    const args = (params?.arguments ?? {}) as Record<string, unknown>;
    try {
      const result = await dispatch(name, args);
      return rpcOk(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Tool-level failure: return an MCP error result (isError) per spec.
      return rpcError(id, -32603, `Tool error: ${message}`);
    }
  }

  if (method === 'ping') return rpcOk(id, {});

  return rpcError(id, -32601, `Method not found: ${method}`);
}

async function handle(msg: unknown, req: RpcRequest): Promise<unknown> {
  if (Array.isArray(msg)) {
    const results = await Promise.all(msg.map((m) => handleOne(m, req)));
    return results.filter((x) => x !== null);
  }
  return handleOne(msg, req);
}

export function registerMcpServer(app: Express): void {
  // Status for the dashboard's "MCP SERVER" card. No secrets — just counts + endpoint.
  app.get('/api/mcp/status', (_req, res) => {
    res.json({
      endpoint: '/api/mcp',
      url: `http://localhost:${process.env.PORT || 3151}/api/mcp`,
      tools: TOOLS.length,
      toolNames: TOOLS.map((t) => t.name),
      sessions: sessions.size,
      authEnabled: Boolean(MCP_TOKEN),
      protocolVersion: PROTOCOL_VERSION,
      serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
    });
  });

  app.post('/api/mcp', async (req, res) => {
    if (MCP_TOKEN) {
      const auth = req.get('authorization') ?? '';
      if (auth !== `Bearer ${MCP_TOKEN}`) {
        res.status(401).json({ jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorized' } });
        return;
      }
    }
    sweepSessions();

    let out: unknown;
    try {
      out = await handle(req.body, req as RpcRequest);
    } catch {
      res.status(400).json(rpcError(null, -32700, 'Parse error'));
      return;
    }

    // Notification (no id) → 204 no body.
    if (out === null || (Array.isArray(out) && out.length === 0)) {
      res.status(204).end();
      return;
    }
    const mreq = req as RpcRequest;
    if (mreq.__mcpSessionId) res.setHeader('mcp-session-id', mreq.__mcpSessionId);
    res.json(out);
  });
}
