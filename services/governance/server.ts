/**
 * Standalone official-vote service.
 *
 * Exists so legacy mission-control-v5 can be retired without taking council ballots
 * with it. Binds 0.0.0.0:9134 (OFFICIAL_VOTE_HOST / OFFICIAL_VOTE_PORT) and enforces
 * constant-time token authentication (OFFICIAL_VOTE_TOKEN or MISSION_OS_TOKEN) on
 * guarded ballot routes while keeping /health available for identity probes.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response, type NextFunction } from 'express';
import { registerOfficialVoteRoutes } from './official-vote-routes.js';
import { isLoopbackRemote, readGuardToken, resolveVoteBind } from './bind.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');
const require = createRequire(import.meta.url);

type EnvHelpers = {
  logStartupEnvCheck: (
    manifestOrDir: string,
    env?: Record<string, string | undefined>,
    warn?: (msg: string) => void
  ) => unknown;
  buildHealthEnvLight: (opts: {
    manifestDir: string;
    env?: Record<string, string | undefined>;
    driftPath?: string;
  }) => {
    missingEnv: string[];
    driftedFiles: Array<{ file: string; reason: string }>;
    driftedCount: number;
    nodeLight: 'green' | 'amber';
  };
};

function findManifestDir(baseDir: string): string {
  return fs.existsSync(path.join(baseDir, 'env.required.json'))
    ? baseDir
    : path.resolve(baseDir, '..');
}

function loadGovernanceEnvHelpers(): EnvHelpers {
  let dir = HERE;
  for (let i = 0; i < 6; i += 1) {
    const envReq = path.join(dir, 'ops', 'agents', 'env-required.cjs');
    const nodeLight = path.join(dir, 'ops', 'agents', 'node-light.cjs');
    if (fs.existsSync(envReq) && fs.existsSync(nodeLight)) {
      const { logStartupEnvCheck } = require(envReq) as Pick<EnvHelpers, 'logStartupEnvCheck'>;
      const { buildHealthEnvLight } = require(nodeLight) as Pick<EnvHelpers, 'buildHealthEnvLight'>;
      return { logStartupEnvCheck, buildHealthEnvLight };
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return {
    logStartupEnvCheck: () => undefined,
    buildHealthEnvLight: () => ({
      missingEnv: [],
      driftedFiles: [],
      driftedCount: 0,
      nodeLight: 'green',
    }),
  };
}

const MANIFEST_DIR = findManifestDir(HERE);
const { logStartupEnvCheck, buildHealthEnvLight } = loadGovernanceEnvHelpers();

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

function requireVoteToken(req: Request, res: Response, next: NextFunction): void {
  const loopbackCaller = isLoopbackRemote(req.socket?.remoteAddress);
  const directHeader = String(
    req.headers['x-mission-os-token'] || req.headers['x-vote-token'] || req.headers['x-fleet-token'] || ''
  ).trim();
  const auth = req.headers.authorization;
  const trimmed = String(auth || '').trim();
  const bearer = trimmed.slice(0, 7).toLowerCase() === 'bearer ' ? trimmed.slice(7).trim() : '';
  const candidate = directHeader || bearer;

  const expected = readGuardToken(process.env);
  if (!expected) {
    if (loopbackCaller) {
      next();
      return;
    }
    res.status(503).json({ ok: false, error: 'OFFICIAL_VOTE_TOKEN / MISSION_OS_TOKEN not configured' });
    return;
  }

  const localRead = loopbackCaller && (req.method === 'GET' || req.method === 'HEAD');
  if (localRead && !candidate) {
    next();
    return;
  }

  if (!candidate || !constantTimeEqualSecret(expected, candidate)) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }
  next();
}

const PORT = Number(process.env.OFFICIAL_VOTE_PORT || 9134);
const T5500_HOST = loadT5500Host();

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'official-vote-service',
    port: PORT,
    ...buildHealthEnvLight({ manifestDir: MANIFEST_DIR }),
  });
});

app.use('/api/official-votes', requireVoteToken);
registerOfficialVoteRoutes(app);

const IS_MAIN_MODULE = Boolean(
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
);

export { app, resolveVoteBind, requireVoteToken, readGuardToken, PORT };

if (IS_MAIN_MODULE) {
  logStartupEnvCheck(MANIFEST_DIR);
  const HOST = resolveVoteBind(process.env, { port: PORT });
  app.listen(PORT, HOST, () => {
    console.log(`official-vote-service listening on http://${HOST}:${PORT} (LAN http://${T5500_HOST}:${PORT})`);
    console.log(`state dir: ${process.env.MISSION_CONTROL_VOTE_STATE_DIR || `${process.cwd()}/.mission-control`}`);
  });
}
