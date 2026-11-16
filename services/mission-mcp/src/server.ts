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
    return String(fmap?.nodes?.t5500?.ip || '192.168.0.15');
  } catch {
    return '192.168.0.15';
  }
}

function readMcpGuardToken(): string {
  const fromEnv = String(process.env.MISSION_MCP_TOKEN || process.env.MISSION_OS_TOKEN || '').trim();
  if (fromEnv) return fromEnv;
  for (const root of [REPO_ROOT, 'C:/ANTIGRAVITY']) {
    try {
      const envFile = path.join(root, '.env');
      if (!fs.existsSync(envFile)) continue;
      const txt = fs.readFileSync(envFile, 'utf8');
      for (const key of ['MISSION_MCP_TOKEN', 'MISSION_OS_TOKEN']) {
        const m = txt.match(new RegExp(`^\\s*${key}\\s*=\\s*(.+)$`, 'm'));
        if (m && m[1]) {
          const val = m[1].trim().replace(/^['"]|['"]$/g, '');
          if (val) return val;
        }
      }
    } catch {
      // Never print .env contents
    }
  }
  return '';
}

function verifyTokenHeader(headers: Record<string, string | string[] | undefined>): { ok: boolean; status: number; error?: string } {
  const expected = readMcpGuardToken();
  if (!expected) {
    return { ok: false, status: 503, error: 'MISSION_MCP_TOKEN / MISSION_OS_TOKEN not configured' };
  }
  const direct = headers['x-mission-os-token'] ?? headers['x-mcp-token'];
  const directStr = Array.isArray(direct) ? direct[0] : direct;
  const auth = headers.authorization;
  const authStr = Array.isArray(auth) ? auth[0] : auth;
  const bearerMatch = authStr ? /^Bearer\s+(.+)$/i.exec(authStr.trim()) : null;
  const candidate = (directStr ? directStr.trim() : '') || (bearerMatch ? bearerMatch[1].trim() : '');
  if (!candidate) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }
  const expectedDigest = crypto.createHash('sha256').update(expected, 'utf8').digest();
  const candidateDigest = crypto.createHash('sha256').update(candidate, 'utf8').digest();
  if (!crypto.timingSafeEqual(expectedDigest, candidateDigest)) {
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
