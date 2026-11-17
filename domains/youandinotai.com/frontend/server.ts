/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import http from 'http';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadDateAppFrontendConfig, resolveFrontendBind } from './bind.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

type EnvRequiredManifest = {
  service?: string;
  required?: string[];
  alternatives?: Record<string, string[]>;
};

type AgentDriftStatus = {
  present: boolean;
  path: string;
  driftedFiles: Array<{ file: string; reason: string }>;
  driftedCount: number;
};

type EnvLightHelpers = {
  logStartupEnvCheck: (
    manifestOrDir: string | EnvRequiredManifest,
    env?: Record<string, string | undefined>,
    warn?: (msg: string) => void
  ) => unknown;
  loadEnvRequiredManifest: (
    manifestOrDir: string | EnvRequiredManifest
  ) => EnvRequiredManifest;
  checkRequiredEnv: (
    manifestOrDir: string | EnvRequiredManifest,
    env?: Record<string, string | undefined>
  ) => { missingEnv: string[] };
  readAgentDriftStatus: (
    driftPathOrOptions?: string,
    envArg?: Record<string, string | undefined>
  ) => AgentDriftStatus;
};

function findFrontendManifestDir(): string {
  return fs.existsSync(path.join(__dirname, 'env.required.json'))
    ? __dirname
    : path.resolve(__dirname, '..');
}

function loadFrontendEnvHelpers(): EnvLightHelpers {
  let dir = __dirname;
  for (let i = 0; i < 6; i += 1) {
    const envReq = path.join(dir, 'ops', 'agents', 'env-required.cjs');
    const nodeLight = path.join(dir, 'ops', 'agents', 'node-light.cjs');
    if (fs.existsSync(envReq) && fs.existsSync(nodeLight)) {
      const { logStartupEnvCheck, loadEnvRequiredManifest, checkRequiredEnv } =
        require(envReq) as Pick<
          EnvLightHelpers,
          'logStartupEnvCheck' | 'loadEnvRequiredManifest' | 'checkRequiredEnv'
        >;
      const { readAgentDriftStatus } = require(nodeLight) as Pick<
        EnvLightHelpers,
        'readAgentDriftStatus'
      >;
      return {
        logStartupEnvCheck,
        loadEnvRequiredManifest,
        checkRequiredEnv,
        readAgentDriftStatus,
      };
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return {
    logStartupEnvCheck: () => undefined,
    loadEnvRequiredManifest: () => ({
      service: 'dateapp-frontend',
      required: [],
    }),
    checkRequiredEnv: () => ({ missingEnv: [] }),
    readAgentDriftStatus: () => ({
      present: false,
      path: '',
      driftedFiles: [],
      driftedCount: 0,
    }),
  };
}

const FRONTEND_MANIFEST_DIR = findFrontendManifestDir();
const {
  logStartupEnvCheck,
  loadEnvRequiredManifest,
  checkRequiredEnv,
  readAgentDriftStatus,
} = loadFrontendEnvHelpers();

function preloadFrontendManifest(): EnvRequiredManifest {
  try {
    return loadEnvRequiredManifest(FRONTEND_MANIFEST_DIR);
  } catch {
    return { service: 'dateapp-frontend', required: [] };
  }
}

const frontendManifest = preloadFrontendManifest();

function loadStaticAssetBuffer(filePath: string): Buffer | null {
  try {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
  } catch {
    return null;
  }
}

function createInMemoryRateLimiter(
  windowMs = 60_000,
  maxRequests = 600,
  maxEntries = 10_000
) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const current = hits.get(key);
    if (!current || current.resetAt <= now) {
      if (hits.size >= maxEntries) {
        for (const [entryKey, entry] of hits.entries()) {
          if (entry.resetAt <= now) hits.delete(entryKey);
        }
        if (hits.size >= maxEntries) {
          const oldestKey = hits.keys().next().value;
          if (oldestKey !== undefined) hits.delete(oldestKey);
        }
      }
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    current.count += 1;
    if (current.count > maxRequests) {
      res.setHeader(
        'Retry-After',
        String(Math.ceil((current.resetAt - now) / 1000))
      );
      res.status(429).send('Too Many Requests');
      return;
    }
    next();
  };
}

const FLEET_FRONTEND = loadDateAppFrontendConfig();
const PORT = Number(process.env.PORT || FLEET_FRONTEND.port);

export { resolveFrontendBind };

// Types
type Vector3 = { x: number; y: number; z: number };

interface Player {
  id: string;
  color: string;
  position: Vector3 | null;
  lastUpdate: number;
}

interface ForceField {
  id: string;
  position: Vector3;
  type: 'attractor' | 'repulsor';
  ownerId: string;
  createdAt: number;
  color: string;
}

// State
const players = new Map<string, Player>();
const forceFields = new Map<string, ForceField>();
const clients = new Map<string, WebSocket>();

// Colors for players (Romantic/Cosmic theme)
const COLORS = [
  '#FF3366', // Hot Pink
  '#FF66B2', // Rose
  '#CC33FF', // Purple
  '#FF99CC', // Pastel Pink
  '#FF0000', // Red
  '#FFD700', // Gold
  '#E6E6FA', // Lavender
  '#FF4500', // Orange Red
];

function broadcast(data: any, excludeId?: string) {
  const message = JSON.stringify(data);
  for (const [id, ws] of clients.entries()) {
    if (id !== excludeId && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

export async function startServer(
  opts: {
    port?: number;
    host?: string;
    env?: Record<string, string | undefined>;
    warn?: ((msg: string) => void) | null;
  } = {}
) {
  const env = opts.env ?? process.env;
  const listenPort = opts.port ?? Number(env.PORT || FLEET_FRONTEND.port);
  const app = express();
  const server = http.createServer(app);

  // WebSocket Server
  const wss = new WebSocketServer({ server });

  wss.on('connection', ws => {
    const id = uuidv4();
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    const player: Player = {
      id,
      color,
      position: null,
      lastUpdate: Date.now(),
    };

    players.set(id, player);
    clients.set(id, ws);

    // Send initial state to the new client
    ws.send(
      JSON.stringify({
        type: 'init',
        id,
        color,
        players: Array.from(players.values()),
        forceFields: Array.from(forceFields.values()),
      })
    );

    // Broadcast new player to others
    broadcast(
      {
        type: 'player_joined',
        player,
      },
      id
    );

    ws.on('message', message => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'cursor') {
          const p = players.get(id);
          if (p) {
            p.position = data.position;
            p.lastUpdate = Date.now();
          }
        } else if (data.type === 'add_force') {
          const forceId = uuidv4();
          const force: ForceField = {
            id: forceId,
            position: data.position,
            type: data.forceType,
            ownerId: id,
            createdAt: Date.now(),
            color: data.color,
          };
          forceFields.set(forceId, force);

          // Broadcast new force field immediately
          broadcast({
            type: 'force_added',
            force,
          });
        }
      } catch (e) {
        console.error('Invalid message', e);
      }
    });

    ws.on('close', () => {
      players.delete(id);
      clients.delete(id);

      // Remove player's force fields
      for (const [forceId, force] of forceFields.entries()) {
        if (force.ownerId === id) {
          forceFields.delete(forceId);
        }
      }

      broadcast({
        type: 'player_left',
        id,
      });
    });
  });

  // Preload drift state outside route handlers and refresh periodically inside syncTimer
  let cachedDrift = readAgentDriftStatus('', env);
  let lastDriftRefreshAt = Date.now();
  const getHealthLightPayload = () => {
    const envCheck = checkRequiredEnv(frontendManifest, env);
    const missingEnv = Array.isArray(envCheck.missingEnv)
      ? envCheck.missingEnv
      : [];
    const driftedFiles = Array.isArray(cachedDrift?.driftedFiles)
      ? cachedDrift.driftedFiles
      : [];
    const driftedCount = driftedFiles.length;
    const nodeLight: 'green' | 'amber' =
      missingEnv.length > 0 || driftedCount > 0 ? 'amber' : 'green';
    return { missingEnv, driftedFiles, driftedCount, nodeLight };
  };

  // Broadcast loop (20Hz)
  const syncTimer = setInterval(() => {
    const now = Date.now();
    if (now - lastDriftRefreshAt >= 5000) {
      lastDriftRefreshAt = now;
      cachedDrift = readAgentDriftStatus('', env);
    }

    // Clean up old force fields (e.g., after 10.5 seconds to allow client animation)
    let forcesChanged = false;
    for (const [id, force] of forceFields.entries()) {
      if (now - force.createdAt > 10500) {
        forceFields.delete(id);
        forcesChanged = true;
      }
    }

    const updateData = {
      type: 'sync',
      players: Array.from(players.values()).filter(p => p.position !== null),
      ...(forcesChanged
        ? { forceFields: Array.from(forceFields.values()) }
        : {}),
    };

    broadcast(updateData);
  }, 50);
  syncTimer.unref?.();
  server.on('close', () => clearInterval(syncTimer));

  // API routes
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'dateapp-frontend',
      players: players.size,
      ...getHealthLightPayload(),
    });
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'dateapp-frontend',
      players: players.size,
      ...getHealthLightPayload(),
    });
  });

  // Static discovery routes (Tobira AI / RFC 8615) - preloaded outside handlers, rate-limited
  const publicDir = path.join(__dirname, 'public');
  const distDir = path.join(__dirname, 'dist');
  const discoveryDir =
    process.env.NODE_ENV === 'production' ? distDir : publicDir;
  const publicRateLimiter = createInMemoryRateLimiter();

  const discoveryAssets = [
    {
      route: '/llms.txt',
      filename: 'llms.txt',
      contentType: 'text/plain; charset=utf-8',
    },
    {
      route: '/AGENTS.md',
      filename: 'AGENTS.md',
      contentType: 'text/markdown; charset=utf-8',
    },
    {
      route: '/for-ai',
      filename: 'for-ai',
      contentType: 'text/markdown; charset=utf-8',
    },
    {
      route: '/agent.json',
      filename: 'agent.json',
      contentType: 'application/json; charset=utf-8',
    },
    {
      route: '/guest-agent.json',
      filename: 'guest-agent.json',
      contentType: 'application/json; charset=utf-8',
    },
  ].map(spec => ({
    ...spec,
    body: loadStaticAssetBuffer(path.join(discoveryDir, spec.filename)),
  }));

  for (const asset of discoveryAssets) {
    app.get(asset.route, publicRateLimiter, (_req, res) => {
      if (!asset.body) {
        res.status(404).send('Not Found');
        return;
      }
      res.setHeader('Content-Type', asset.contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(asset.body);
    });
  }

  app.use(
    '/.well-known',
    express.static(
      path.join(
        process.env.NODE_ENV === 'production' ? distDir : publicDir,
        '.well-known'
      ),
      {
        dotfiles: 'allow',
        setHeaders(res) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'public, max-age=3600');
        },
      }
    )
  );

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // Public traffic arrives via the cloudflared tunnel with the real
        // hostname — Vite's host check 403s anything not listed here.
        allowedHosts: [
          '.youandinotai.com',
          FLEET_FRONTEND.host,
          'localhost',
          '127.0.0.1',
        ],
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static assets with CDN-ready cache headers.
    // Fingerprinted assets (containing a hash like abc1234) get long-term immutable caching.
    // Non-fingerprinted assets and HTML get short/no caching.
    app.use(
      express.static(distDir, {
        setHeaders(res, filePath) {
          const basename = path.basename(filePath);
          if (basename === 'llms.txt') {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          } else if (basename === 'AGENTS.md' || basename === 'for-ai') {
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
          } else if (basename.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
          }

          // HTML files: no-cache so clients always get the latest entry point
          if (filePath.endsWith('.html')) {
            res.setHeader(
              'Cache-Control',
              'no-cache, no-store, must-revalidate'
            );
            return;
          }

          // Fingerprinted assets: hash in filename (e.g. main-abc1234.js, vendor-def5678.css)
          // These are safe to cache forever because the hash changes when content changes.
          const hasHash = /-[a-f0-9]{8,}\./.test(basename);
          if (hasHash) {
            res.setHeader(
              'Cache-Control',
              'public, max-age=31536000, immutable'
            );
            return;
          }

          // All other static assets (images, fonts, etc.): moderate cache
          res.setHeader('Cache-Control', 'public, max-age=86400');
        },
      })
    );

    const preloadedIndexHtml = loadStaticAssetBuffer(
      path.join(distDir, 'index.html')
    );

    app.get('*', publicRateLimiter, (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      if (req.path.startsWith('/.') || req.path.includes('/.')) {
        res.status(404).send('Not Found');
        return;
      }
      if (!preloadedIndexHtml) {
        res.status(404).send('Not Found');
        return;
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(preloadedIndexHtml);
    });
  }

  const bindHost =
    opts.host ??
    resolveFrontendBind(env, {
      port: listenPort,
      bind: FLEET_FRONTEND.bind,
      warn: opts.warn ?? console.warn,
    });
  if (opts.warn !== null) {
    logStartupEnvCheck(FRONTEND_MANIFEST_DIR, env, opts.warn ?? console.warn);
  }
  await new Promise<void>(resolve => {
    server.listen(listenPort, bindHost, () => {
      const addr = server.address();
      const activePort =
        addr && typeof addr === 'object' ? addr.port : listenPort;
      console.log(
        `Server running on http://${bindHost}:${activePort} (LAN http://${FLEET_FRONTEND.host}:${activePort})`
      );
      resolve();
    });
  });
  return { app, server, host: bindHost };
}

const IS_MAIN_MODULE = Boolean(
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)
);

if (IS_MAIN_MODULE) {
  startServer();
}
