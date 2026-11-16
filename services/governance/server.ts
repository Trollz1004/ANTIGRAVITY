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
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response, type NextFunction } from 'express';
import { registerOfficialVoteRoutes } from './official-vote-routes.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');

function loadT5500Host(): string {
  try {
    const raw = fs.readFileSync(path.join(REPO_ROOT, 'ops', 'fleet', 'fleet-map.json'), 'utf8');
    const fmap = JSON.parse(raw);
    return String(fmap?.nodes?.t5500?.ip || '192.168.0.15');
  } catch {
    return '192.168.0.15';
  }
}

function readGuardToken(): string {
  const fromEnv = String(process.env.OFFICIAL_VOTE_TOKEN || process.env.MISSION_OS_TOKEN || '').trim();
  if (fromEnv) return fromEnv;
  for (const root of [REPO_ROOT, 'C:/ANTIGRAVITY']) {
    try {
      const envFile = path.join(root, '.env');
      if (!fs.existsSync(envFile)) continue;
      const txt = fs.readFileSync(envFile, 'utf8');
      for (const key of ['OFFICIAL_VOTE_TOKEN', 'MISSION_OS_TOKEN']) {
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

function isLoopback(addr: string | undefined): boolean {
  const r = String(addr || '').trim();
  return r === '127.0.0.1' || r === '::1' || r === '::ffff:127.0.0.1';
}

function requireVoteToken(req: Request, res: Response, next: NextFunction): void {
  const localRead = isLoopback(req.socket?.remoteAddress) && (req.method === 'GET' || req.method === 'HEAD');
  const directHeader = String(req.headers['x-mission-os-token'] || req.headers['x-vote-token'] || '').trim();
  const authHeader = String(req.headers.authorization || '').trim();
  const bearerMatch = /^Bearer\s+(.+)$/i.exec(authHeader);
  const candidate = directHeader || (bearerMatch ? bearerMatch[1].trim() : '');

  if (localRead && !candidate) {
    next();
    return;
  }

  const expected = readGuardToken();
  if (!expected) {
    res.status(503).json({ ok: false, error: 'OFFICIAL_VOTE_TOKEN / MISSION_OS_TOKEN not configured' });
    return;
  }
  if (!candidate) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }

  const expectedDigest = crypto.createHash('sha256').update(expected, 'utf8').digest();
  const candidateDigest = crypto.createHash('sha256').update(candidate, 'utf8').digest();
  if (!crypto.timingSafeEqual(expectedDigest, candidateDigest)) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }
  next();
}

const PORT = Number(process.env.OFFICIAL_VOTE_PORT || 9134);
const HOST = process.env.OFFICIAL_VOTE_HOST || '0.0.0.0';
const T5500_HOST = loadT5500Host();

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'official-vote-service', port: PORT });
});

app.use('/api/official-votes', requireVoteToken);
registerOfficialVoteRoutes(app);

app.listen(PORT, HOST, () => {
  console.log(`official-vote-service listening on http://${HOST}:${PORT} (LAN http://${T5500_HOST}:${PORT})`);
  console.log(`state dir: ${process.env.MISSION_CONTROL_VOTE_STATE_DIR || `${process.cwd()}/.mission-control`}`);
});
