// Mission OS v1 Shell API routes (/api/v1/*) implementing docs/ops/MISSION-OS-API.md.
// Enforces ORDER-FIXUPS / A2 loopback no-token rule and constant-time token authentication via ops-backend.mjs.
// Routes heavy build, Playwright, 3D, and multi-repo tasks to Alienware wheel inbox via Swarm Command (:8000).
// Never opens environment files on disk; reads token and queue directory strictly from env.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getServiceUrl } from '../ops/fleet/fleet-map.mjs';
import { isLoopbackAddress, readMissionOsToken, verifyMissionOsToken } from './ops-backend.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = process.env.MISSION_OS_ROOT || path.resolve(HERE, '..');

export const ALLOWED_REPOS = Object.freeze([
  'Trollz1004/ANTIGRAVITY',
  'Trollz1004/dream-online',
  'Trollz1004/swarm-command',
]);

export const REPO_SHORT_MAP = Object.freeze({
  all: ALLOWED_REPOS,
  ANTIGRAVITY: ['Trollz1004/ANTIGRAVITY'],
  'dream-online': ['Trollz1004/dream-online'],
  'swarm-command': ['Trollz1004/swarm-command'],
  'Trollz1004/ANTIGRAVITY': ['Trollz1004/ANTIGRAVITY'],
  'Trollz1004/dream-online': ['Trollz1004/dream-online'],
  'Trollz1004/swarm-command': ['Trollz1004/swarm-command'],
});

export const ALLOWED_PR_STATES = Object.freeze(['open', 'closed', 'merged', 'all']);
export const ALLOWED_NODES = Object.freeze(['t5500', 'alienware']);
export const ALLOWED_AUTHORS = Object.freeze([
  'Josh',
  'Gemini Carbon',
  'GPT-6 Astra',
  'GPT-6.1 Sol',
  'Codex',
  'Opus',
  'Fable',
]);

export const DEFAULT_PR_CACHE_TTL_MS = 30000;

const HEAVY_BUILD_PATTERN =
  /\b(?:build|compile|bundle|test[-_\s]?suite|vite|webpack|docker|playwright|blender|3d|remake|electron|tauri|pytest)\b|\b(?:npm\s+run\s+build|pnpm(?:\s+-r)?\s+build)\b/i;

/**
 * Classifies whether a chat/dispatch request must be offloaded to Alienware wheel inbox.
 */
export function isHeavyBuildRequest({ message = '', repo, node, ab = false } = {}) {
  if (ab === true) return true;
  const normalizedNode = String(node || '')
    .trim()
    .toLowerCase();
  if (normalizedNode === 'alienware') return true;
  const normalizedRepo = repo === undefined || repo === null ? '' : String(repo).trim();
  if (normalizedRepo && normalizedRepo !== 'Trollz1004/ANTIGRAVITY') return true;
  return HEAVY_BUILD_PATTERN.test(String(message || ''));
}

/**
 * Formats a WheelEnqueueRequest body compatible with Alienware Swarm Command POST /api/wheel/enqueue.
 */
export function buildWheelEnqueuePayload({
  taskId = '',
  message = '',
  repo = 'Trollz1004/ANTIGRAVITY',
  author = 'Josh',
  ab = false,
  lane = 'mechanical',
  base = 'main',
  title = '',
  slug = '',
} = {}) {
  const cleanMsg = String(message || '').trim();
  const firstLine =
    cleanMsg
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) || '';
  const rawTitle = String(title || firstLine || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/^[#\s]+/, '')
    .trim();
  const resolvedTitle = (rawTitle || `Mission OS task ${taskId || 'queued'}`).slice(0, 120).trim();
  const laneNorm = String(lane || '')
    .trim()
    .toLowerCase();
  const resolvedLane = laneNorm === 'engine' ? 'engine' : 'mechanical';
  const resolvedRepo =
    repo === 'Trollz1004/dream-online' || repo === 'dream-online'
      ? 'dream-online'
      : repo === 'Trollz1004/swarm-command' || repo === 'swarm-command'
        ? 'swarm-command'
        : 'ANTIGRAVITY';
  const resolvedBase = String(base || 'main').trim() || 'main';
  const rawSlug = slug || taskId || resolvedTitle;
  const resolvedSlug =
    String(rawSlug || 'mission-os-task')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30)
      .replace(/-+$/g, '') || 'mission-os-task';

  const promptLines = [
    cleanMsg,
    '',
    `Requested repo: ${repo || 'Trollz1004/ANTIGRAVITY'}`,
    `Author: ${author}`,
    `Required PR title format: [YYYY-MM-DD #NNNN] <title>, by ${author}`,
    `Required commit trailer: Authored-by: ${author}`,
    ab ? 'A/B execution requested: true' : '',
    taskId ? `Mission OS taskId: ${taskId}` : '',
  ].filter((line, idx, arr) => line !== '' || (idx > 0 && arr[idx - 1] !== ''));

  return {
    title: resolvedTitle,
    lane: resolvedLane,
    repo: resolvedRepo,
    base: resolvedBase,
    prompt: promptLines.join('\n').trim(),
    slug: resolvedSlug,
  };
}

/**
 * Default HTTP pusher from T5500 to Alienware Swarm Command /api/wheel/enqueue.
 */
export async function defaultWheelEnqueue(payload, { env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const url = getServiceUrl('swarm-command', '/api/wheel/enqueue');
  if (payload?.repo !== 'ANTIGRAVITY' && payload?.repo !== 'dream-online') {
    return {
      ok: false,
      wheelSyncStatus: 'deferred-unsupported-repo',
      url,
      status: 0,
      error: `Swarm Command wheel enqueue currently accepts only ANTIGRAVITY or dream-online (got ${String(payload?.repo || '')})`,
    };
  }
  const token = String(env?.FLEET_SHARED_TOKEN || env?.SWARM_COMMAND_TOKEN || '').trim();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['X-Fleet-Token'] = token;
    headers.Authorization = `Bearer ${token}`;
  }
  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (!res || !res.ok) {
      const status = Number(res?.status || 0);
      return {
        ok: false,
        wheelSyncStatus: status >= 400 && status < 500 ? 'rejected' : 'deferred-unreachable',
        url,
        status,
        error: `Swarm Command returned HTTP ${res ? res.status : 'no response'}`,
      };
    }
    return {
      ok: true,
      wheelSyncStatus: 'enqueued',
      url,
      status: Number(res.status),
    };
  } catch (err) {
    return {
      ok: false,
      wheelSyncStatus: 'deferred-unreachable',
      url,
      status: 0,
      error: String(err?.cause?.message || err?.message || err || 'Alienware unreachable'),
    };
  }
}

function writeV1Json(res, secHeaders, statusCode, payload) {
  res.writeHead(statusCode, {
    ...secHeaders,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  return res.end(JSON.stringify({ apiVersion: 'v1', ...payload }, null, 2));
}

function writeV1Error(res, secHeaders, statusCode, error) {
  return writeV1Json(res, secHeaders, statusCode, {
    ok: false,
    apiVersion: 'v1',
    error: String(error || 'Request failed'),
  });
}

function extractAuthorLabel(title, authorObj) {
  const rawTitle = String(title || '').trim();
  const byIdx = rawTitle.lastIndexOf(', by ');
  if (byIdx >= 0) {
    const candidate = rawTitle.slice(byIdx + 5).trim();
    if (candidate && candidate.length <= 64) {
      return candidate;
    }
  }
  return String(authorObj?.login || authorObj?.name || 'unknown');
}

function summarizeChecks(rollup) {
  if (!Array.isArray(rollup) || rollup.length === 0) return 'none';
  let hasPending = false;
  for (const item of rollup) {
    const conclusion = String(item?.conclusion || '').toUpperCase();
    const state = String(item?.state || '').toUpperCase();
    const status = String(item?.status || '').toUpperCase();
    if (
      ['FAILURE', 'TIMED_OUT', 'CANCELLED', 'ACTION_REQUIRED', 'STARTUP_FAILURE'].includes(conclusion) ||
      ['FAILURE', 'ERROR'].includes(state)
    ) {
      return 'failing';
    }
    if ((status && status !== 'COMPLETED') || state === 'PENDING' || (!conclusion && !state)) {
      hasPending = true;
    }
  }
  return hasPending ? 'pending' : 'passing';
}

function queryGhPrListForRepo(fullRepo, state, limit) {
  return new Promise((resolve) => {
    const args = [
      'pr',
      'list',
      '-R',
      fullRepo,
      '--state',
      state,
      '--limit',
      String(limit),
      '--json',
      'number,title,state,headRefName,url,updatedAt,author,statusCheckRollup',
    ];
    execFile(
      'gh',
      args,
      { timeout: 15000, maxBuffer: 2 * 1024 * 1024, windowsHide: true, shell: false },
      (err, stdout) => {
        if (err || !stdout) return resolve([]);
        try {
          const parsed = JSON.parse(stdout);
          if (!Array.isArray(parsed)) return resolve([]);
          return resolve(parsed.map((item) => ({ ...item, repo: fullRepo })));
        } catch {
          return resolve([]);
        }
      },
    );
  });
}

/**
 * Fetches GitHub pull requests across the allowlisted Trollz1004 repositories via gh CLI.
 */
export async function defaultPrFetcher({ repo, state, limit }) {
  const targets = REPO_SHORT_MAP[repo] || ALLOWED_REPOS;
  const perRepoLists = await Promise.all(targets.map((fullRepo) => queryGhPrListForRepo(fullRepo, state, limit)));
  return perRepoLists.flat();
}

function normalizePrItem(raw) {
  const number = Number(raw?.number || 0);
  const code = `#${String(number).padStart(4, '0')}`;
  return {
    repo: String(raw?.repo || 'Trollz1004/ANTIGRAVITY'),
    number,
    code,
    title: String(raw?.title || ''),
    authorLabel: raw?.authorLabel ? String(raw.authorLabel) : extractAuthorLabel(raw?.title, raw?.author),
    state: String(raw?.state || 'open').toLowerCase(),
    branch: String(raw?.branch ?? raw?.headRefName ?? ''),
    url: String(raw?.url || ''),
    updatedAt: String(raw?.updatedAt || ''),
    checksSummary: raw?.checksSummary ? String(raw.checksSummary) : summarizeChecks(raw?.statusCheckRollup),
  };
}

function formatTaskTimestamp(isoString) {
  return String(isoString)
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, '')
    .replace('T', '-');
}

function resolveTaskQueueDir(env, repoRoot) {
  const fromEnv = String(env?.MISSION_OS_TASK_QUEUE_DIR || '').trim();
  const resolved = path.resolve(fromEnv || path.join(repoRoot, 'ops/t5500/chat-queue'));
  if (resolved.toLowerCase().includes('.fable-kitchen')) {
    throw Object.assign(new Error('Refusing task queue path inside restricted directory'), { status: 400 });
  }
  return resolved;
}

function readQueuedTasks(queueDir) {
  try {
    if (!fs.existsSync(queueDir)) return [];
    const entries = fs.readdirSync(queueDir, { withFileTypes: true });
    const items = [];
    for (const entry of entries) {
      if (!entry.isFile() || entry.isSymbolicLink() || !entry.name.endsWith('.json')) continue;
      try {
        const raw = fs.readFileSync(path.join(queueDir, entry.name), 'utf8').replace(/^\uFEFF/, '');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.taskId) {
          items.push(parsed);
        }
      } catch {
        // Ignore malformed file
      }
    }
    return items.sort((a, b) => String(b.queuedAt || '').localeCompare(String(a.queuedAt || '')));
  } catch {
    return [];
  }
}

/**
 * Creates the Mission OS /api/v1/* HTTP request handler backed by node-watchdog and ops-backend auth.
 */
export function createShellApi({
  env = process.env,
  repoRoot = DEFAULT_ROOT,
  watchdog,
  prFetcher = defaultPrFetcher,
  prCacheTtlMs = DEFAULT_PR_CACHE_TTL_MS,
  fetchImpl = globalThis.fetch,
  wheelEnqueueImpl = null,
  nowMs = () => Date.now(),
} = {}) {
  if (!watchdog) {
    throw new Error('createShellApi requires a watchdog instance');
  }

  const prCache = new Map();

  async function handleRequest(req, res, { urlObj, secHeaders = {}, readBody }) {
    const expectedToken = readMissionOsToken({ env });
    const isLoopback = isLoopbackAddress(req?.socket?.remoteAddress);
    if (expectedToken || !isLoopback) {
      const auth = verifyMissionOsToken(req, { env });
      if (!auth.ok) {
        return writeV1Error(res, secHeaders, auth.status, auth.error);
      }
    }

    const method = String(req.method || 'GET').toUpperCase();
    const pathname = urlObj.pathname.replace(/\/+$/, '') || '/api/v1';

    if (!['GET', 'HEAD'].includes(method)) {
      if (!/^application\/json(?:;|$)/i.test(String(req.headers?.['content-type'] || ''))) {
        return writeV1Error(res, secHeaders, 415, 'Content-Type must be application/json');
      }
    }

    // Route 1: GET /api/v1/status
    if (pathname === '/api/v1/status') {
      if (method !== 'GET') return writeV1Error(res, secHeaders, 405, 'Method not allowed');
      const refresh = urlObj.searchParams.get('refresh') === '1';
      const statusPayload = await watchdog.getStatus({ refresh });
      return writeV1Json(res, secHeaders, 200, statusPayload);
    }

    // Route 2: GET /api/v1/prs
    if (pathname === '/api/v1/prs') {
      if (method !== 'GET') return writeV1Error(res, secHeaders, 405, 'Method not allowed');
      const repoParam = String(urlObj.searchParams.get('repo') || 'all').trim();
      if (!Object.prototype.hasOwnProperty.call(REPO_SHORT_MAP, repoParam)) {
        return writeV1Error(res, secHeaders, 400, 'Invalid repo parameter');
      }
      const stateParam = String(urlObj.searchParams.get('state') || 'open')
        .trim()
        .toLowerCase();
      if (!ALLOWED_PR_STATES.includes(stateParam)) {
        return writeV1Error(res, secHeaders, 400, 'Invalid state parameter');
      }
      const rawLimit = urlObj.searchParams.get('limit');
      const trimmedLimit = rawLimit === null ? '' : String(rawLimit).trim();
      const limit = trimmedLimit === '' ? 30 : /^\d+$/.test(trimmedLimit) ? Number(trimmedLimit) : NaN;
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        return writeV1Error(res, secHeaders, 400, 'limit must be an integer between 1 and 100');
      }
      const refresh = urlObj.searchParams.get('refresh') === '1';
      const cacheKey = `${repoParam}|${stateParam}|${limit}`;
      const currentMs = Number(nowMs());
      const cached = prCache.get(cacheKey);
      if (!refresh && cached && currentMs - cached.atMs < prCacheTtlMs) {
        return writeV1Json(res, secHeaders, 200, cached.payload);
      }

      const rawItems = await prFetcher({ repo: repoParam, state: stateParam, limit });
      const items = (Array.isArray(rawItems) ? rawItems : [])
        .map(normalizePrItem)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, limit);
      const payload = {
        ok: true,
        apiVersion: 'v1',
        generatedAt: new Date(currentMs).toISOString(),
        items,
      };
      prCache.set(cacheKey, { atMs: currentMs, payload });
      return writeV1Json(res, secHeaders, 200, payload);
    }

    // Route 3a: POST /api/v1/chat/send
    if (pathname === '/api/v1/chat/send') {
      if (method !== 'POST') return writeV1Error(res, secHeaders, 405, 'Method not allowed');
      let body;
      try {
        body = await readBody(req);
      } catch (err) {
        return writeV1Error(res, secHeaders, err.status || 400, err.message || 'Invalid JSON body');
      }

      if (typeof body.message !== 'string') {
        return writeV1Error(res, secHeaders, 400, 'message is required');
      }
      const message = body.message.trim();
      if (message.length < 1 || message.length > 16000) {
        return writeV1Error(res, secHeaders, 400, 'message must be between 1 and 16000 characters');
      }

      const repo = body.repo === undefined ? 'Trollz1004/ANTIGRAVITY' : String(body.repo).trim();
      if (!ALLOWED_REPOS.includes(repo)) {
        return writeV1Error(res, secHeaders, 400, 'repo must be an allowlisted Trollz1004 repository');
      }

      const requestedNode = body.node === undefined ? 't5500' : String(body.node).trim().toLowerCase();
      if (!ALLOWED_NODES.includes(requestedNode)) {
        return writeV1Error(res, secHeaders, 400, 'node must be "t5500" or "alienware"');
      }

      const author = body.author === undefined ? 'Josh' : String(body.author).trim();
      if (!ALLOWED_AUTHORS.includes(author)) {
        return writeV1Error(res, secHeaders, 400, 'author is not in the allowlist');
      }

      const ab = body.ab === undefined ? false : body.ab;
      if (typeof ab !== 'boolean') {
        return writeV1Error(res, secHeaders, 400, 'ab must be a boolean');
      }

      let queueDir;
      try {
        queueDir = resolveTaskQueueDir(env, repoRoot);
      } catch (err) {
        return writeV1Error(res, secHeaders, err.status || 400, err.message);
      }

      const queuedAt = new Date(Number(nowMs())).toISOString();
      const suffix = crypto.randomBytes(2).toString('hex');
      const taskId = `task-${formatTaskTimestamp(queuedAt)}-${suffix}`;
      const expectedTitleFormat = `[YYYY-MM-DD #NNNN] <title>, by ${author}`;
      const trailer = `Authored-by: ${author}`;

      const heavyBuild = isHeavyBuildRequest({ message, repo, node: requestedNode, ab });
      const node = heavyBuild ? 'alienware' : requestedNode;
      const executionTarget = heavyBuild ? 'alienware-wheel-inbox' : 't5500-chat-queue';
      const neverRunOnT5500 = heavyBuild;

      let wheelSyncStatus = null;
      let wheelSyncError = null;
      let wheelPayload = null;

      if (heavyBuild) {
        wheelPayload = buildWheelEnqueuePayload({
          taskId,
          message,
          repo,
          author,
          ab,
          lane: body.lane,
        });
        if (wheelPayload.repo !== 'ANTIGRAVITY' && wheelPayload.repo !== 'dream-online') {
          wheelSyncStatus = 'deferred-unsupported-repo';
          wheelSyncError = `Swarm Command wheel enqueue accepts only ANTIGRAVITY or dream-online (got ${wheelPayload.repo})`;
        } else {
          try {
            const enqueueFn = wheelEnqueueImpl || ((p) => defaultWheelEnqueue(p, { env, fetchImpl }));
            const enqueueRes = await enqueueFn(wheelPayload, {
              env,
              url: getServiceUrl('swarm-command', '/api/wheel/enqueue'),
              taskId,
              repo,
              author,
            });
            if (enqueueRes && enqueueRes.ok === false) {
              wheelSyncStatus = enqueueRes.wheelSyncStatus || 'deferred-unreachable';
              wheelSyncError = enqueueRes.error ? String(enqueueRes.error) : null;
            } else {
              wheelSyncStatus = (enqueueRes && enqueueRes.wheelSyncStatus) || 'enqueued';
            }
          } catch (err) {
            wheelSyncStatus = 'deferred-unreachable';
            wheelSyncError = String(err?.cause?.message || err?.message || err || 'Alienware unreachable');
          }
        }
      }

      const taskRecord = {
        taskId,
        status: 'queued',
        message,
        repo,
        node,
        requestedNode,
        executionTarget,
        neverRunOnT5500,
        ...(heavyBuild ? { wheelSyncStatus, ...(wheelSyncError ? { wheelSyncError } : {}), wheelPayload } : {}),
        author,
        ab,
        expectedTitleFormat,
        trailer,
        queuedAt,
      };

      fs.mkdirSync(queueDir, { recursive: true });
      fs.writeFileSync(path.join(queueDir, `${taskId}.json`), JSON.stringify(taskRecord, null, 2), 'utf8');

      return writeV1Json(res, secHeaders, 202, {
        ok: true,
        apiVersion: 'v1',
        taskId,
        status: 'queued',
        repo,
        node,
        executionTarget,
        neverRunOnT5500,
        ...(heavyBuild ? { wheelSyncStatus } : {}),
        author,
        expectedTitleFormat,
        trailer,
        queuedAt,
      });
    }

    // Route 3b: GET /api/v1/chat/tasks
    if (pathname === '/api/v1/chat/tasks') {
      if (method !== 'GET') return writeV1Error(res, secHeaders, 405, 'Method not allowed');
      let queueDir;
      try {
        queueDir = resolveTaskQueueDir(env, repoRoot);
      } catch (err) {
        return writeV1Error(res, secHeaders, err.status || 400, err.message);
      }
      const items = readQueuedTasks(queueDir);
      return writeV1Json(res, secHeaders, 200, {
        ok: true,
        apiVersion: 'v1',
        items,
      });
    }

    // Route 4a: GET /api/v1/watchdog
    if (pathname === '/api/v1/watchdog') {
      if (method !== 'GET') return writeV1Error(res, secHeaders, 405, 'Method not allowed');
      const refresh = urlObj.searchParams.get('refresh') === '1';
      const watchdogState = await watchdog.getWatchdogState({ refresh });
      return writeV1Json(res, secHeaders, 200, watchdogState);
    }

    // Route 4b: POST /api/v1/watchdog/fix-task
    if (pathname === '/api/v1/watchdog/fix-task') {
      if (method !== 'POST') return writeV1Error(res, secHeaders, 405, 'Method not allowed');
      let body;
      try {
        body = await readBody(req);
      } catch (err) {
        return writeV1Error(res, secHeaders, err.status || 400, err.message || 'Invalid JSON body');
      }

      const node = String(body.node || '')
        .trim()
        .toLowerCase();
      if (!ALLOWED_NODES.includes(node)) {
        return writeV1Error(res, secHeaders, 400, 'node must be "t5500" or "alienware"');
      }

      const serviceId = String(body.serviceId || '').trim();
      if (!serviceId || serviceId.length > 128 || !/^[a-zA-Z0-9._-]+$/.test(serviceId)) {
        return writeV1Error(res, secHeaders, 400, 'serviceId must be a valid non-empty service identifier');
      }

      const reason =
        body.reason === undefined
          ? ''
          : String(body.reason || '')
              .trim()
              .slice(0, 500);
      const lastError =
        body.lastError === undefined
          ? ''
          : String(body.lastError || '')
              .split(/\r?\n/)[0]
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 1000);

      let queueDir;
      try {
        queueDir = resolveTaskQueueDir(env, repoRoot);
      } catch (err) {
        return writeV1Error(res, secHeaders, err.status || 400, err.message);
      }

      const queuedAt = new Date(Number(nowMs())).toISOString();
      const suffix = crypto.randomBytes(2).toString('hex');
      const taskId = `fix-${formatTaskTimestamp(queuedAt)}-${suffix}`;
      const lane = node;
      const author = 'Josh';

      const fixCard = {
        taskId,
        kind: 'watchdog-fix',
        status: 'queued',
        node,
        serviceId,
        lane,
        reason: reason || null,
        lastError: lastError || null,
        message: `Diagnose and restore service ${serviceId} on ${node}${reason ? ` (${reason})` : ''}`,
        repo: 'Trollz1004/ANTIGRAVITY',
        author,
        expectedTitleFormat: `[YYYY-MM-DD #NNNN] <title>, by ${author}`,
        trailer: `Authored-by: ${author}`,
        queuedAt,
      };

      fs.mkdirSync(queueDir, { recursive: true });
      fs.writeFileSync(path.join(queueDir, `${taskId}.json`), JSON.stringify(fixCard, null, 2), 'utf8');

      return writeV1Json(res, secHeaders, 201, {
        ok: true,
        apiVersion: 'v1',
        taskId,
        node,
        serviceId,
        lane,
        queuedAt,
      });
    }

    return writeV1Error(res, secHeaders, 404, 'Not found');
  }

  return {
    handleRequest,
  };
}
