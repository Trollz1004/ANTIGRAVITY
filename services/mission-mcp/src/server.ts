import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { openDb } from './db.js';
import { TOOLS } from './tools/index.js';

const NAME = 'mission-mcp';
const VERSION = '0.1.0';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');

function loadT5500Host(): string {
  try {
    const raw = fs.readFileSync(path.join(REPO_ROOT, 'ops', 'fleet', 'fleet-map.json'), 'utf8');
    const fmap = JSON.parse(raw);
    return String(fmap?.nodes?.t5500?.ip || fmap?.nodes?.t5500?.host || '192.168.0.15');
  } catch {
    return '192.168.0.15';
  }
}

function constantTimeEqualSecret(expected: string, candidate: string): boolean {
  const a = Buffer.from(String(expected || ''), 'utf8');
  const b = Buffer.from(String(candidate || ''), 'utf8');
  const len = Math.max(a.length, b.length, 1);
  const padA = Buffer.alloc(len);
  const padB = Buffer.alloc(len);
  a.copy(padA);
  b.copy(padB);
  return crypto.timingSafeEqual(padA, padB) && a.length === b.length;
}

function readMcpGuardToken(): string {
  return String(process.env.MISSION_MCP_TOKEN || process.env.MISSION_OS_TOKEN || '').trim();
}

function verifyTokenHeader(headers: Record<string, string | string[] | undefined>): { ok: boolean; status: number; error?: string } {
  const expected = readMcpGuardToken();
  if (!expected) {
    return { ok: false, status: 503, error: 'MISSION_MCP_TOKEN / MISSION_OS_TOKEN not configured' };
  }
  const direct = headers['x-mission-os-token'] ?? headers['x-mcp-token'];
  const directStr = Array.isArray(direct) ? direct[0] : direct;
  const authHeader = headers.authorization;
  const auth = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const trimmed = String(auth || '').trim();
  const bearer = trimmed.slice(0, 7).toLowerCase() === 'bearer ' ? trimmed.slice(7).trim() : '';
  const candidate = (directStr ? directStr.trim() : '') || bearer;
  if (!candidate || !constantTimeEqualSecret(expected, candidate)) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }
  return { ok: true, status: 200 };
}

async function createMcpServer() {
  const db = openDb();

  const server = new Server({ name: NAME, version: VERSION }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = TOOLS.find((t) => t.name === request.params.name);
    if (!tool) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Unknown tool: ${request.params.name}`,
          },
        ],
        isError: true,
      };
    }

    try {
      const result = tool.handler({ db }, request.params.arguments ?? {});
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  return { server, db };
}

async function startStdio() {
  const { server } = await createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`[mission-mcp] ready on stdio\n`);
}

async function startHttp() {
  const { createServer } = await import('http');
  const express = (await import('express')).default;
  const { StreamableHTTPServerTransport } = await import('@modelcontextprotocol/sdk/server/streamableHttp.js');

  const port = parseInt(process.env.MISSION_MCP_PORT ?? '3901', 10);
  const host = process.env.MISSION_MCP_HOST ?? '0.0.0.0';
  const lanIp = loadT5500Host();
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true, name: NAME, version: VERSION });
  });

  app.post('/mcp', async (req, res) => {
    const check = verifyTokenHeader(req.headers);
    if (!check.ok) {
      res.status(check.status).json({ ok: false, error: check.error });
      return;
    }
    const { server } = await createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const httpServer = createServer(app);
  httpServer.listen(port, host, () => {
    process.stderr.write(`[mission-mcp] ready on http://${host}:${port} (LAN http://${lanIp}:${port})\n`);
  });
}

const transport = process.env.MISSION_MCP_TRANSPORT;

if (transport === 'http') {
  startHttp().catch((err) => {
    process.stderr.write(`[mission-mcp] fatal: ${err.message}\n`);
    process.exit(1);
  });
} else {
  startStdio().catch((err) => {
    process.stderr.write(`[mission-mcp] fatal: ${err.message}\n`);
    process.exit(1);
  });
}
