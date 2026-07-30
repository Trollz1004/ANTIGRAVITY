/**
 * Brain hub routes — wires the Pieces LTM proxy and per-platform journals into
 * the Express app. Mirrors the index.ts route shape (try/catch → JSON error).
 */
import { createConnection } from 'node:net';
import type { Express } from 'express';
import { loadBrainPlatforms, platformSummary, readJournal, writeJournal } from './brainStore.js';
import { callTool, listTools, pingPieces, PIECES_LTM_TOOL, PIECES_MCP_URL, piecesSessionId } from './pieces.js';
import { getCatalogEntry, loadCatalog } from './catalog.js';

let toolsCache: { tools: unknown[]; at: number } | null = null;
const TOOLS_TTL_MS = 60_000;

function piecesHostPort(): { host: string; port: number } {
  try {
    const u = new URL(PIECES_MCP_URL);
    return { host: u.hostname, port: Number(u.port) || 39300 };
  } catch {
    return { host: 'localhost', port: 39300 };
  }
}

/** Cheap TCP reachability check — safe to call on the 15s state poll. */
function piecesReachable(timeoutMs = 800): Promise<boolean> {
  const { host, port } = piecesHostPort();
  return new Promise((resolve) => {
    const sock = createConnection({ host, port }, () => {
      sock.end();
      resolve(true);
    });
    sock.setTimeout(timeoutMs);
    sock.on('error', () => resolve(false));
    sock.on('timeout', () => {
      sock.destroy();
      resolve(false);
    });
  });
}

async function cachedTools(): Promise<unknown[]> {
  if (toolsCache && Date.now() - toolsCache.at < TOOLS_TTL_MS) return toolsCache.tools;
  const tools = await listTools();
  toolsCache = { tools, at: Date.now() };
  return tools;
}

export function registerBrainRoutes(app: Express): void {
  // ── Brain hub ───────────────────────────────────────────────────────────────

  app.get('/api/brain/state', async (_req, res) => {
    try {
      const platforms = loadBrainPlatforms().map(platformSummary);
      const piecesUp = await piecesReachable();
      res.json({ platforms, piecesUp });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/brain/journal/:platformId', (req, res) => {
    try {
      const j = readJournal(req.params.platformId);
      if (!j) {
        res.status(404).json({ error: `Unknown platform: ${req.params.platformId}` });
        return;
      }
      res.json(j);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/brain/journal/:platformId', (req, res) => {
    try {
      const content = String(req.body?.content ?? '');
      const w = writeJournal(req.params.platformId, content);
      if (!w) {
        res.status(404).json({ error: `Unknown platform: ${req.params.platformId}` });
        return;
      }
      res.json(w);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/brain/tools', async (_req, res) => {
    try {
      const tools = await cachedTools();
      res.json({ tools });
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/brain/ask', async (req, res) => {
    try {
      const tool = String(req.body?.tool ?? '').trim() || PIECES_LTM_TOOL;
      // Query shorthand: the default LTM tool (ask_pieces_ltm / ask_memory) takes
      // a `question` field, so map the shorthand to that. Explicit `arguments`
      // pass through untouched.
      const args =
        req.body?.arguments ??
        (req.body?.query !== undefined ? { question: String(req.body.query) } : {});
      const started = Date.now();
      const result = await callTool(tool, args);
      res.json({ result, tool, ms: Date.now() - started });
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/brain/pieces', async (_req, res) => {
    try {
      const up = await pingPieces(9_000);
      let tools = 0;
      if (up) {
        try {
          tools = (await cachedTools()).length;
        } catch {
          tools = 0;
        }
      }
      res.json({ up, url: PIECES_MCP_URL, session: piecesSessionId(), tools });
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // ── Catalog (monorepo skills + tasks) ────────────────────────────────────────

  app.get('/api/brain/catalog', (req, res) => {
    try {
      const { skills, categories } = loadCatalog();
      const q = String(req.query.q ?? '').trim().toLowerCase();
      const category = String(req.query.category ?? '').trim().toLowerCase();
      const filtered = skills.filter((s) => {
        if (category && s.category !== category) return false;
        if (!q) return true;
        return (
          s.id.toLowerCase().includes(q) ||
          s.label.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
        );
      });
      res.json({ skills: filtered, categories });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/brain/catalog/:kind/:id', (req, res) => {
    try {
      const kind = req.params.kind === 'tasks' ? 'task' : 'skill';
      const entry = getCatalogEntry(req.params.id, kind);
      if (!entry) {
        res.status(404).json({ error: `Not found: ${req.params.kind}/${req.params.id}` });
        return;
      }
      res.json(entry);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });
}