import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { getServiceUrl } from '../ops/fleet/fleet-map.mjs';
import { createNodeWatchdog } from './node-watchdog.mjs';
import { createShellApi, isHeavyBuildRequest, buildWheelEnqueuePayload, defaultWheelEnqueue } from './shell-api.mjs';
import { createMissionHandler, mapAgyModel, AGY_V1_MODELS, dispatchJarvis } from './server.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHELL_API_PATH = path.join(HERE, 'shell-api.mjs');

function makeTempDir(prefix = 'mos-shell-api-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function invokeHandler(
  handler,
  { method = 'GET', url = '/', remoteAddress = '192.168.0.40', headers = {}, body = null } = {},
) {
  const chunks = body !== null ? [Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))] : [];
  const defaultHeaders = { host: '192.168.0.15:3130' };
  if (body !== null && !headers['content-type'] && !headers['Content-Type']) {
    defaultHeaders['content-type'] = 'application/json';
  }
  const req = Object.assign(Readable.from(chunks), {
    method,
    url,
    headers: { ...defaultHeaders, ...headers },
    socket: { remoteAddress },
  });
  let statusCode = 200;
  const responseHeaders = {};
  const bodyChunks = [];
  const res = {
    headersSent: false,
    setHeader(name, value) {
      responseHeaders[String(name).toLowerCase()] = value;
      return this;
    },
    getHeader(name) {
      return responseHeaders[String(name).toLowerCase()];
    },
    removeHeader(name) {
      delete responseHeaders[String(name).toLowerCase()];
    },
    writeHead(code, reasonOrHeaders, maybeHeaders) {
      statusCode = code;
      const hdrs = typeof reasonOrHeaders === 'object' && reasonOrHeaders !== null ? reasonOrHeaders : maybeHeaders;
      if (hdrs && typeof hdrs === 'object') {
        for (const [k, v] of Object.entries(hdrs)) {
          responseHeaders[k.toLowerCase()] = v;
        }
      }
      this.headersSent = true;
      return this;
    },
    write(chunk, encoding, cb) {
      if (typeof encoding === 'function') {
        cb = encoding;
        encoding = 'utf8';
      }
      if (chunk !== undefined) {
        bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), encoding || 'utf8'));
      }
      if (typeof cb === 'function') cb();
      return true;
    },
    end(payload, encoding, cb) {
      if (typeof payload === 'function') {
        cb = payload;
        payload = undefined;
      } else if (typeof encoding === 'function') {
        cb = encoding;
        encoding = 'utf8';
      }
      if (payload !== undefined) {
        bodyChunks.push(Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload), encoding || 'utf8'));
      }
      if (typeof cb === 'function') cb();
      return this;
    },
  };
  return handler(req, res).then(() => {
    const rawBody = Buffer.concat(bodyChunks).toString('utf8');
    let parsed = null;
    try {
      parsed = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      parsed = rawBody;
    }
    return { statusCode, headers: responseHeaders, body: parsed, rawBody };
  });
}

function fixtureFleetMap() {
  return {
    schema: 'antigravity.fleet-map.v1',
    nodes: {
      t5500: { id: 't5500', name: 'T5500', ip: '192.168.0.15', host: '192.168.0.15' },
      alienware: { id: 'alienware', name: 'Alienware', ip: '192.168.0.40', host: '192.168.0.40' },
    },
    services: {
      'mission-os': {
        id: 'mission-os',
        name: 'Mission OS',
        node: 't5500',
        host: '192.168.0.15',
        port: 3130,
        protocol: 'http',
        scope: 'lan-guarded',
        tokenEnv: 'MISSION_OS_TOKEN',
        healthPath: '/live',
      },
      'hermes-dashboard': {
        id: 'hermes-dashboard',
        name: 'Hermes Dashboard',
        node: 't5500',
        host: '192.168.0.15',
        port: 9119,
        protocol: 'http',
        scope: 'lan-guarded',
        tokenEnv: 'MISSION_OS_TOKEN',
        healthPath: '/api/health',
      },
      'dream-engine': {
        id: 'dream-engine',
        name: 'DREAM Engine',
        node: 'alienware',
        host: '192.168.0.40',
        port: 9180,
        protocol: 'http',
        scope: 'lan',
        tokenEnv: null,
        healthPath: '/health',
      },
    },
  };
}

test('shell-api source has zero retired nodes, zero .env reads, zero sha256 token hashing, zero polynomial Bearer regexes, and zero .fable-kitchen/inbox writes', () => {
  const src = fs.readFileSync(SHELL_API_PATH, 'utf8');
  assert.doesNotMatch(src, /sabretooth/i);
  assert.ok(!src.includes(['192', '168', '0', '8'].join('.')));
  assert.doesNotMatch(src, /(?<!process)\.env\b/);
  assert.doesNotMatch(src, /createHash\s*\(\s*['"]sha256['"]\s*\)/);
  assert.doesNotMatch(src, /Bearer\\s\+/i);
  assert.doesNotMatch(src, /\.fable-kitchen[\\/]+inbox/i);
});

test('ORDER-FIXUPS / A2 loopback rule: no token allows loopback /api/v1/* while LAN returns 503; configured token enforces auth on both', async () => {
  const tmp = makeTempDir();
  try {
    let missionToken = '';
    let fleetToken = '';
    const envProxy = {
      get MISSION_OS_TOKEN() {
        return missionToken;
      },
      get FLEET_SHARED_TOKEN() {
        return fleetToken;
      },
      MISSION_OS_TASK_QUEUE_DIR: path.join(tmp, 'queue'),
    };
    const watchdog = createNodeWatchdog({
      fleetMap: fixtureFleetMap(),
      incidentsPath: path.join(tmp, 'incidents.json'),
      keepaliveStatusPath: path.join(tmp, 'status.json'),
      env: envProxy,
      disableTelegram: true,
      probeService: async () => ({ up: true, status: 'UP', reason: 'Healthy', lastError: null }),
    });
    const shellApi = createShellApi({
      env: envProxy,
      watchdog,
      prFetcher: async () => [],
    });
    const handler = createMissionHandler({ env: envProxy, watchdog, shellApi });

    // 1. Unset tokens + loopback -> 200 / 202 (ZERO 503s!)
    const loopbackStatus = await invokeHandler(handler, {
      method: 'GET',
      url: '/api/v1/status',
      remoteAddress: '127.0.0.1',
      headers: { host: '127.0.0.1:3130' },
    });
    assert.equal(loopbackStatus.statusCode, 200);
    assert.equal(loopbackStatus.body.ok, true);
    assert.equal(loopbackStatus.body.apiVersion, 'v1');

    const loopbackChat = await invokeHandler(handler, {
      method: 'POST',
      url: '/api/v1/chat/send',
      remoteAddress: '127.0.0.1',
      headers: {
        host: '127.0.0.1:3130',
        origin: 'http://127.0.0.1:3130',
        'content-type': 'application/json',
      },
      body: { message: 'Check Mission OS health summary', repo: 'Trollz1004/ANTIGRAVITY', node: 't5500' },
    });
    assert.equal(loopbackChat.statusCode, 202);
    assert.equal(loopbackChat.body.ok, true);
    assert.equal(loopbackChat.body.node, 't5500');

    // 2. Unset tokens + non-loopback (192.168.0.40) -> 503 (env setting name scrubbed by stream-safe wrapper)
    const lan503 = await invokeHandler(handler, {
      method: 'GET',
      url: '/api/v1/status',
      remoteAddress: '192.168.0.40',
      headers: { host: '192.168.0.15:3130' },
    });
    assert.equal(lan503.statusCode, 503);
    assert.equal(lan503.body.ok, false);
    assert.equal(lan503.body.apiVersion, 'v1');
    assert.match(lan503.body.error, /not configured/i);
    assert.ok(!lan503.rawBody.includes('MISSION_OS_TOKEN'), '503 HTTP response must not leak raw env setting name');

    // 3. Configure MISSION_OS_TOKEN -> both loopback and LAN require valid token
    missionToken = 'mission-v1-secret-token';
    for (const remoteAddress of ['127.0.0.1', '192.168.0.40']) {
      const host = remoteAddress === '127.0.0.1' ? '127.0.0.1:3130' : '192.168.0.15:3130';
      const missing = await invokeHandler(handler, {
        method: 'GET',
        url: '/api/v1/status',
        remoteAddress,
        headers: { host },
      });
      assert.equal(missing.statusCode, 401);
      assert.deepEqual(missing.body, { ok: false, apiVersion: 'v1', error: 'Unauthorized' });

      const wrong = await invokeHandler(handler, {
        method: 'GET',
        url: '/api/v1/status',
        remoteAddress,
        headers: { host, 'x-mission-os-token': 'wrong-token' },
      });
      assert.equal(wrong.statusCode, 401);

      const okHeader = await invokeHandler(handler, {
        method: 'GET',
        url: '/api/v1/status',
        remoteAddress,
        headers: { host, 'x-mission-os-token': missionToken },
      });
      assert.equal(okHeader.statusCode, 200);
      assert.equal(okHeader.body.ok, true);

      const okBearer = await invokeHandler(handler, {
        method: 'GET',
        url: '/api/v1/status',
        remoteAddress,
        headers: { host, authorization: `Bearer ${missionToken}` },
      });
      assert.equal(okBearer.statusCode, 200);
      assert.equal(okBearer.body.ok, true);
    }

    // 4. Configure only FLEET_SHARED_TOKEN + Alienware Host header -> enforced and accepted
    missionToken = '';
    fleetToken = 'fleet-shared-v1-token';
    const loopbackBlocked = await invokeHandler(handler, {
      method: 'GET',
      url: '/api/v1/status',
      remoteAddress: '127.0.0.1',
      headers: { host: '127.0.0.1:3130' },
    });
    assert.equal(loopbackBlocked.statusCode, 401);

    const alienwareHostOk = await invokeHandler(handler, {
      method: 'GET',
      url: '/api/v1/status',
      remoteAddress: '192.168.0.40',
      headers: { host: '192.168.0.40:3130', authorization: `Bearer ${fleetToken}` },
    });
    assert.equal(alienwareHostOk.statusCode, 200);
    assert.equal(alienwareHostOk.body.ok, true);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('GET /api/v1/status caches for 60s and honors ?refresh=1, and GET /api/v1/prs filters/caches/validates', async () => {
  const tmp = makeTempDir();
  try {
    const token = 'test-v1-token';
    const env = {
      MISSION_OS_TOKEN: token,
      MISSION_OS_TASK_QUEUE_DIR: path.join(tmp, 'queue'),
    };
    let probePasses = 0;
    let clockMs = Date.parse('2026-11-16T20:00:00.000Z');
    const watchdog = createNodeWatchdog({
      fleetMap: fixtureFleetMap(),
      incidentsPath: path.join(tmp, 'incidents.json'),
      keepaliveStatusPath: path.join(tmp, 'status.json'),
      env,
      disableTelegram: true,
      nowMs: () => clockMs,
      probeService: async (svc) => {
        if (svc.id === 'mission-os') probePasses += 1;
        return { up: true, status: 'UP', reason: 'Healthy', lastError: null };
      },
    });

    let prCalls = 0;
    const shellApi = createShellApi({
      env,
      watchdog,
      nowMs: () => clockMs,
      prFetcher: async ({ repo, state, limit }) => {
        prCalls += 1;
        return [
          {
            repo: repo === 'all' ? 'Trollz1004/ANTIGRAVITY' : `Trollz1004/${repo}`,
            number: 418,
            title: '[2026-11-16 #0418] Mission OS v1 API contract, by Gemini Carbon',
            state,
            headRefName: 'claude/finalize-mission-os-api',
            url: 'https://github.com/Trollz1004/ANTIGRAVITY/pull/418',
            updatedAt: '2026-11-16T20:00:00.000Z',
            author: { login: 'Trollz1004' },
            statusCheckRollup: [{ status: 'COMPLETED', conclusion: 'SUCCESS' }],
          },
        ].slice(0, limit);
      },
    });
    const handler = createMissionHandler({ env, watchdog, shellApi });
    const authHeaders = { 'x-mission-os-token': token };

    const s1 = await invokeHandler(handler, { url: '/api/v1/status', headers: authHeaders });
    assert.equal(s1.statusCode, 200);
    assert.equal(s1.body.pollIntervalSeconds, 60);
    assert.deepEqual(
      s1.body.nodes.map((n) => n.id),
      ['t5500', 'alienware'],
    );
    assert.equal(probePasses, 1);

    clockMs += 20000;
    await invokeHandler(handler, { url: '/api/v1/status', headers: authHeaders });
    assert.equal(probePasses, 1);

    await invokeHandler(handler, { url: '/api/v1/status?refresh=1', headers: authHeaders });
    assert.equal(probePasses, 2);

    const p1 = await invokeHandler(handler, {
      url: '/api/v1/prs?repo=ANTIGRAVITY&state=open&limit=10',
      headers: authHeaders,
    });
    assert.equal(p1.statusCode, 200);
    assert.equal(p1.body.apiVersion, 'v1');
    assert.equal(p1.body.items.length, 1);
    assert.equal(p1.body.items[0].code, '#0418');
    assert.equal(p1.body.items[0].authorLabel, 'Gemini Carbon');
    assert.equal(p1.body.items[0].checksSummary, 'passing');
    assert.equal(prCalls, 1);

    clockMs += 10000;
    await invokeHandler(handler, {
      url: '/api/v1/prs?repo=ANTIGRAVITY&state=open&limit=10',
      headers: authHeaders,
    });
    assert.equal(prCalls, 1);

    await invokeHandler(handler, {
      url: '/api/v1/prs?repo=ANTIGRAVITY&state=open&limit=10&refresh=1',
      headers: authHeaders,
    });
    assert.equal(prCalls, 2);

    const badRepo = await invokeHandler(handler, { url: '/api/v1/prs?repo=unknown', headers: authHeaders });
    assert.equal(badRepo.statusCode, 400);
    const badState = await invokeHandler(handler, { url: '/api/v1/prs?state=draft', headers: authHeaders });
    assert.equal(badState.statusCode, 400);
    const badLimit = await invokeHandler(handler, { url: '/api/v1/prs?limit=500', headers: authHeaders });
    assert.equal(badLimit.statusCode, 400);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('POST /api/v1/chat/send, GET /api/v1/chat/tasks, GET /api/v1/watchdog, and POST /api/v1/watchdog/fix-task match contract', async () => {
  const tmp = makeTempDir();
  try {
    const queueDir = path.join(tmp, 'chat-queue');
    const token = 'test-v1-token-chat';
    const env = {
      MISSION_OS_TOKEN: token,
      MISSION_OS_TASK_QUEUE_DIR: queueDir,
    };
    const watchdog = createNodeWatchdog({
      fleetMap: fixtureFleetMap(),
      incidentsPath: path.join(tmp, 'incidents.json'),
      keepaliveStatusPath: path.join(tmp, 'status.json'),
      env,
      disableTelegram: true,
      probeService: async (svc) =>
        svc.id === 'hermes-dashboard'
          ? {
              up: false,
              status: 'DOWN',
              reason: 'Connection refused',
              lastError: 'connect ECONNREFUSED 192.168.0.15:9119',
            }
          : { up: true, status: 'UP', reason: 'Healthy', lastError: null },
    });
    const shellApi = createShellApi({
      env,
      watchdog,
      prFetcher: async () => [],
      wheelEnqueueImpl: async () => ({ ok: true, wheelSyncStatus: 'enqueued' }),
    });
    const handler = createMissionHandler({ env, watchdog, shellApi });
    const authHeaders = { 'x-mission-os-token': token };

    const emptyMsg = await invokeHandler(handler, {
      method: 'POST',
      url: '/api/v1/chat/send',
      headers: authHeaders,
      body: { message: '   ' },
    });
    assert.equal(emptyMsg.statusCode, 400);

    const tooLong = await invokeHandler(handler, {
      method: 'POST',
      url: '/api/v1/chat/send',
      headers: authHeaders,
      body: { message: 'x'.repeat(16001) },
    });
    assert.equal(tooLong.statusCode, 400);

    const badNode = await invokeHandler(handler, {
      method: 'POST',
      url: '/api/v1/chat/send',
      headers: authHeaders,
      body: { message: 'Check status', node: 'retired-box' },
    });
    assert.equal(badNode.statusCode, 400);

    const badAuthor = await invokeHandler(handler, {
      method: 'POST',
      url: '/api/v1/chat/send',
      headers: authHeaders,
      body: { message: 'Check status', author: 'Unknown Bot' },
    });
    assert.equal(badAuthor.statusCode, 400);

    // Normal T5500 request (non-heavy, ab: false)
    const sendRes = await invokeHandler(handler, {
      method: 'POST',
      url: '/api/v1/chat/send',
      headers: authHeaders,
      body: {
        message: 'Verify Mission OS node lights',
        repo: 'Trollz1004/ANTIGRAVITY',
        node: 't5500',
        author: 'Gemini Carbon',
        ab: false,
      },
    });
    assert.equal(sendRes.statusCode, 202);
    assert.equal(sendRes.body.ok, true);
    assert.equal(sendRes.body.apiVersion, 'v1');
    assert.match(sendRes.body.taskId, /^task-\d{8}-\d{6}-[a-f0-9]{4}$/);
    assert.equal(sendRes.body.status, 'queued');
    assert.equal(sendRes.body.node, 't5500');
    assert.equal(sendRes.body.expectedTitleFormat, '[YYYY-MM-DD #NNNN] <title>, by Gemini Carbon');
    assert.equal(sendRes.body.trailer, 'Authored-by: Gemini Carbon');

    // GET /api/v1/chat/tasks -> 200
    const tasksRes = await invokeHandler(handler, {
      method: 'GET',
      url: '/api/v1/chat/tasks',
      headers: authHeaders,
    });
    assert.equal(tasksRes.statusCode, 200);
    assert.equal(tasksRes.body.items.length, 1);
    assert.equal(tasksRes.body.items[0].taskId, sendRes.body.taskId);
    assert.equal(tasksRes.body.items[0].ab, false);

    // GET /api/v1/watchdog -> 200
    const wdRes = await invokeHandler(handler, {
      method: 'GET',
      url: '/api/v1/watchdog?refresh=1',
      headers: authHeaders,
    });
    assert.equal(wdRes.statusCode, 200);
    assert.equal(wdRes.body.redAlertAfterSeconds, 300);
    assert.equal(wdRes.body.nodes.t5500.light, 'red');
    assert.equal(wdRes.body.nodes.t5500.flashing, true);
    assert.equal(wdRes.body.nodes.alienware.light, 'green');
    assert.equal(wdRes.body.incidents.length, 1);
    assert.equal(wdRes.body.incidents[0].serviceId, 'hermes-dashboard');

    // POST /api/v1/watchdog/fix-task validation & 201 creation
    const badFix = await invokeHandler(handler, {
      method: 'POST',
      url: '/api/v1/watchdog/fix-task',
      headers: authHeaders,
      body: { node: 't5500', serviceId: '' },
    });
    assert.equal(badFix.statusCode, 400);

    const fixRes = await invokeHandler(handler, {
      method: 'POST',
      url: '/api/v1/watchdog/fix-task',
      headers: authHeaders,
      body: {
        node: 't5500',
        serviceId: 'hermes-dashboard',
        reason: 'Connection refused',
        lastError: 'connect ECONNREFUSED 192.168.0.15:9119',
      },
    });
    assert.equal(fixRes.statusCode, 201);
    assert.equal(fixRes.body.ok, true);
    assert.equal(fixRes.body.apiVersion, 'v1');
    assert.match(fixRes.body.taskId, /^fix-\d{8}-\d{6}-[a-f0-9]{4}$/);
    assert.equal(fixRes.body.node, 't5500');
    assert.equal(fixRes.body.serviceId, 'hermes-dashboard');
    assert.equal(fixRes.body.lane, 't5500');
    assert.ok(fs.existsSync(path.join(queueDir, `${fixRes.body.taskId}.json`)));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('Addendum A1 heavy-build routing sends heavy jobs to Alienware wheel inbox and refuses them in dispatchJarvis', async () => {
  const tmp = makeTempDir();
  try {
    assert.equal(
      isHeavyBuildRequest({
        message: 'Verify Mission OS node lights',
        repo: 'Trollz1004/ANTIGRAVITY',
        node: 't5500',
        ab: false,
      }),
      false,
    );
    assert.equal(isHeavyBuildRequest({ message: 'Quick note', ab: true }), true);
    assert.equal(isHeavyBuildRequest({ message: 'Quick note', repo: 'Trollz1004/dream-online' }), true);
    assert.equal(isHeavyBuildRequest({ message: 'Quick note', node: 'alienware' }), true);
    for (const kw of [
      'run build now',
      'compile rust crate',
      'bundle assets',
      'run test-suite',
      'vite dev',
      'webpack config',
      'docker image',
      'playwright e2e',
      'blender render',
      '3d asset',
      'remake page',
      'electron shell',
      'tauri package',
      'npm run build',
      'pnpm build',
      'pytest suite',
    ]) {
      assert.equal(isHeavyBuildRequest({ message: kw }), true, `Expected heavy build match for "${kw}"`);
    }

    const wheelPayload = buildWheelEnqueuePayload({
      taskId: 'task-20261116-200000-aa11',
      message: 'Run playwright test-suite for dream-online',
      repo: 'Trollz1004/dream-online',
      author: 'Gemini Carbon',
      ab: false,
    });
    assert.equal(wheelPayload.repo, 'dream-online');
    assert.equal(wheelPayload.base, 'main');
    assert.equal(wheelPayload.lane, 'mechanical');
    assert.ok(wheelPayload.title.length > 0);
    assert.ok(wheelPayload.slug.length > 0);
    assert.match(wheelPayload.prompt, /Run playwright test-suite/);

    const queueDir = path.join(tmp, 'chat-queue');
    const token = 'test-v1-heavy-token';
    const fleetToken = 'fleet-shared-heavy-999';
    const env = {
      MISSION_OS_TOKEN: token,
      FLEET_SHARED_TOKEN: fleetToken,
      MISSION_OS_TASK_QUEUE_DIR: queueDir,
    };
    const watchdog = createNodeWatchdog({
      fleetMap: fixtureFleetMap(),
      incidentsPath: path.join(tmp, 'incidents.json'),
      keepaliveStatusPath: path.join(tmp, 'status.json'),
      env,
      disableTelegram: true,
      probeService: async () => ({ up: true, status: 'UP', reason: 'Healthy', lastError: null }),
    });

    // 1. Default wheelEnqueue using fetchImpl sends WheelEnqueueRequest to swarm-command URL with fleet token
    const fetchCalls = [];
    const shellViaFetch = createShellApi({
      env,
      watchdog,
      prFetcher: async () => [],
      fetchImpl: async (url, init) => {
        fetchCalls.push({ url, init });
        return { ok: true, status: 201, json: async () => ({ ok: true }) };
      },
    });
    const handlerFetch = createMissionHandler({ env, watchdog, shellApi: shellViaFetch });
    const heavyRes = await invokeHandler(handlerFetch, {
      method: 'POST',
      url: '/api/v1/chat/send',
      headers: { 'x-mission-os-token': token },
      body: {
        message: 'Run pnpm build and playwright test-suite',
        repo: 'Trollz1004/ANTIGRAVITY',
        node: 't5500',
        author: 'Codex',
        ab: true,
      },
    });
    assert.equal(heavyRes.statusCode, 202);
    assert.equal(heavyRes.body.node, 'alienware');
    assert.equal(heavyRes.body.executionTarget, 'alienware-wheel-inbox');
    assert.equal(heavyRes.body.neverRunOnT5500, true);
    assert.equal(heavyRes.body.wheelSyncStatus, 'enqueued');
    assert.equal(fetchCalls.length, 1);
    assert.equal(fetchCalls[0].url, getServiceUrl('swarm-command', '/api/wheel/enqueue'));
    assert.equal(fetchCalls[0].init.method, 'POST');
    assert.equal(fetchCalls[0].init.headers['X-Fleet-Token'], fleetToken);
    assert.equal(fetchCalls[0].init.headers.Authorization, `Bearer ${fleetToken}`);
    const sentWheelBody = JSON.parse(fetchCalls[0].init.body);
    assert.equal(sentWheelBody.repo, 'ANTIGRAVITY');
    assert.equal(sentWheelBody.base, 'main');
    assert.equal(sentWheelBody.lane, 'mechanical');
    assert.ok(sentWheelBody.title);
    assert.ok(sentWheelBody.slug);
    assert.ok(sentWheelBody.prompt);

    // 2. Injectable wheelEnqueueImpl when Alienware is unreachable -> graceful deferred-unreachable, still 202
    let injectedCalls = 0;
    const shellUnreachable = createShellApi({
      env,
      watchdog,
      prFetcher: async () => [],
      wheelEnqueueImpl: async () => {
        injectedCalls += 1;
        throw new Error('connect ECONNREFUSED 192.168.0.40:8000');
      },
    });
    const handlerUnreachable = createMissionHandler({ env, watchdog, shellApi: shellUnreachable });
    const deferredRes = await invokeHandler(handlerUnreachable, {
      method: 'POST',
      url: '/api/v1/chat/send',
      headers: { 'x-mission-os-token': token },
      body: {
        message: 'Compile tauri desktop package',
        repo: 'Trollz1004/dream-online',
        node: 't5500',
        author: 'Opus',
      },
    });
    assert.equal(injectedCalls, 1);
    assert.equal(deferredRes.statusCode, 202);
    assert.equal(deferredRes.body.node, 'alienware');
    assert.equal(deferredRes.body.executionTarget, 'alienware-wheel-inbox');
    assert.equal(deferredRes.body.neverRunOnT5500, true);
    assert.equal(deferredRes.body.wheelSyncStatus, 'deferred-unreachable');

    // 3. dispatchJarvis + POST /api/jarvis/dispatch refuse heavy builds locally on T5500
    const directRefusal = await dispatchJarvis({ brain: 'gemini', prompt: 'Run webpack bundle and playwright tests' });
    assert.equal(directRefusal.ok, false);
    assert.equal(directRefusal.refusedOnT5500, true);
    assert.equal(directRefusal.executionTarget, 'alienware-wheel-inbox');

    const httpRefusal = await invokeHandler(handlerFetch, {
      method: 'POST',
      url: '/api/jarvis/dispatch',
      remoteAddress: '127.0.0.1',
      headers: {
        host: '127.0.0.1:3130',
        origin: 'http://127.0.0.1:3130',
        'content-type': 'application/json',
        'x-mission-os-token': token,
      },
      body: { brain: 'claude', prompt: 'Execute docker build and pytest' },
    });
    assert.equal(httpRefusal.statusCode, 200);
    assert.equal(httpRefusal.body.ok, false);
    assert.equal(httpRefusal.body.refusedOnT5500, true);
    assert.equal(httpRefusal.body.executionTarget, 'alienware-wheel-inbox');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('Addendum A1 stream-safe end-to-end redaction wraps /live, /api/live/settings, /api/mos-state.json, /api/v1/status, /api/v1/watchdog, and /api/v1/chat/tasks', async () => {
  const tmp = makeTempDir();
  try {
    const queueDir = path.join(tmp, 'chat-queue');
    const sharedTok = 'shared-stream-secret-887766';
    const mosTok = 'mos-stream-secret-112233';
    const syntheticMission1 = ['for', ' ', 'the', ' ', 'kids'].join('');
    const syntheticMission2 = ['ped', 'iatric'].join('');
    const custEmail = 'buyer.lead@example.com';
    const custPhone = '(321) 555-0144';
    const privRepo1 = 'Trollz1004/mission-loop';
    const privRepo2 = 'auto-freelance-hub';

    const env = {
      MISSION_OS_TOKEN: mosTok,
      FLEET_SHARED_TOKEN: sharedTok,
      OPENAI_API_KEY: 'sk-proj-syntheticTestKeyValue9988',
      MISSION_OS_TASK_QUEUE_DIR: queueDir,
    };

    const watchdog = createNodeWatchdog({
      fleetMap: fixtureFleetMap(),
      incidentsPath: path.join(tmp, 'incidents.json'),
      keepaliveStatusPath: path.join(tmp, 'status.json'),
      env,
      disableTelegram: true,
      probeService: async (svc) =>
        svc.id === 'hermes-dashboard'
          ? {
              up: false,
              status: 'DOWN',
              reason: `Repo ${privRepo1} failed for ${custEmail} (${syntheticMission1})`,
              lastError: `MISSION_OS_TOKEN=${mosTok} FLEET_SHARED_TOKEN=${sharedTok} phone=${custPhone} ${privRepo2}`,
            }
          : { up: true, status: 'UP', reason: 'Healthy', lastError: null },
    });

    const shellApi = createShellApi({ env, watchdog, prFetcher: async () => [] });
    const handler = createMissionHandler({
      env,
      watchdog,
      shellApi,
      getSettingsTab: async () => ({
        ok: true,
        apiAudit: [
          { id: 'openai', keyEnv: 'OPENAI_API_KEY', configured: true, note: `Uses ${sharedTok}` },
          { id: 'mos', keyEnv: 'MISSION_OS_TOKEN', configured: true, repo: privRepo1 },
        ],
        customerEmail: custEmail,
      }),
      getState: async () => ({
        identity: 'mission-agent-os',
        host: 't5500',
        ip: '192.168.0.15',
        generated: '2026-11-16T20:00:00.000Z',
        services: [],
        domains: [],
        bridges: [],
        leakedSecret: sharedTok,
        leakedSetting: 'FLEET_SHARED_TOKEN',
        leakedEmail: custEmail,
        leakedPhone: custPhone,
        leakedRepo: privRepo2,
        leakedMission: syntheticMission2,
      }),
    });

    const authHeaders = { 'x-mission-os-token': mosTok };
    await invokeHandler(handler, {
      method: 'POST',
      url: '/api/v1/chat/send',
      headers: authHeaders,
      body: {
        message: `Check ${privRepo1} and ${privRepo2} for ${custEmail} ${custPhone} token ${sharedTok} MISSION_OS_TOKEN ${syntheticMission1}`,
        repo: 'Trollz1004/ANTIGRAVITY',
        node: 't5500',
      },
    });

    const forbiddenStrings = [
      mosTok,
      sharedTok,
      'sk-proj-syntheticTestKeyValue9988',
      'MISSION_OS_TOKEN',
      'FLEET_SHARED_TOKEN',
      'OPENAI_API_KEY',
      custEmail,
      custPhone,
      privRepo1,
      privRepo2,
      syntheticMission1,
      syntheticMission2,
    ];

    for (const route of [
      '/live',
      '/api/live/settings',
      '/api/mos-state.json',
      '/api/v1/status',
      '/api/v1/watchdog',
      '/api/v1/chat/tasks',
    ]) {
      const res = await invokeHandler(handler, {
        method: 'GET',
        url: route,
        remoteAddress: '192.168.0.40',
        headers: authHeaders,
      });
      assert.equal(res.statusCode, 200, `Expected 200 for ${route}`);
      for (const secretOrPii of forbiddenStrings) {
        assert.ok(
          !res.rawBody.includes(secretOrPii),
          `Route ${route} leaked unredacted value matching ${secretOrPii.slice(0, 12)}...`,
        );
      }
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('Addendum A8 models: GET /v1/models returns gemini-4-carbon-high and gemini-4-hydrogen and mapAgyModel maps them', async () => {
  const modelIds = AGY_V1_MODELS.map((m) => m.id);
  assert.ok(modelIds.includes('gemini-4-carbon-high'));
  assert.ok(modelIds.includes('gemini-4-hydrogen'));
  assert.ok(modelIds.includes('gemini-4-argon-high'));

  assert.equal(mapAgyModel('carbon'), 'gemini-4-carbon-high');
  assert.equal(mapAgyModel('agy/carbon'), 'gemini-4-carbon-high');
  assert.equal(mapAgyModel('gemini-4-carbon-high'), 'gemini-4-carbon-high');
  assert.equal(mapAgyModel('hydrogen'), 'gemini-4-hydrogen');
  assert.equal(mapAgyModel('gemini/hydrogen'), 'gemini-4-hydrogen');
  assert.equal(mapAgyModel('gemini-4-hydrogen'), 'gemini-4-hydrogen');

  const handler = createMissionHandler({ env: {} });
  const modelsRes = await invokeHandler(handler, {
    method: 'GET',
    url: '/v1/models',
    remoteAddress: '127.0.0.1',
    headers: { host: '127.0.0.1:3130' },
  });
  assert.equal(modelsRes.statusCode, 200);
  const returnedIds = (modelsRes.body?.data || []).map((m) => m.id);
  assert.ok(returnedIds.includes('gemini-4-carbon-high'));
  assert.ok(returnedIds.includes('gemini-4-hydrogen'));
  assert.ok(returnedIds.includes('gemini-4-argon-high'));
});

test('D1 Node Lights /live HTML renders dark-only carbon-fiber WCAG AAA UI with zero env setting names leaked', async () => {
  const tmp = makeTempDir();
  try {
    const token = 'd1-live-ui-secret-token';
    const env = {
      MISSION_OS_TOKEN: token,
      MISSION_OS_TASK_QUEUE_DIR: path.join(tmp, 'queue'),
    };
    const watchdog = createNodeWatchdog({
      fleetMap: fixtureFleetMap(),
      incidentsPath: path.join(tmp, 'incidents.json'),
      keepaliveStatusPath: path.join(tmp, 'status.json'),
      env,
      disableTelegram: true,
      probeService: async (svc) =>
        svc.id === 'hermes-dashboard'
          ? {
              up: false,
              status: 'DOWN',
              reason: 'Connection refused',
              lastError: 'connect ECONNREFUSED 192.168.0.15:9119',
            }
          : { up: true, status: 'UP', reason: 'Healthy', lastError: null },
    });
    const handler = createMissionHandler({ env, watchdog });

    const liveRes = await invokeHandler(handler, {
      method: 'GET',
      url: '/live',
      remoteAddress: '127.0.0.1',
      headers: { host: '127.0.0.1:3130' },
    });
    assert.equal(liveRes.statusCode, 200);
    assert.match(liveRes.rawBody, /#09090b/);
    assert.match(liveRes.rawBody, /repeating-linear-gradient/i);
    assert.doesNotMatch(liveRes.rawBody, /prefers-color-scheme:\s*light/i);
    assert.match(liveRes.rawBody, /data-service-id="mission-os"/);
    assert.match(liveRes.rawBody, /prefers-reduced-motion:\s*reduce/);
    assert.match(liveRes.rawBody, /T5500/);
    assert.match(liveRes.rawBody, /Alienware/);
    assert.match(liveRes.rawBody, /Hermes Dashboard/);
    assert.match(liveRes.rawBody, /Connection refused/);
    assert.match(liveRes.rawBody, /Write Fix Task/);
    assert.match(liveRes.rawBody, /\/api\/v1\/watchdog\/fix-task/);
    assert.match(liveRes.rawBody, /type="password"/);
    assert.match(liveRes.rawBody, /Session access token/);
    assert.match(liveRes.rawBody, /sessionStorage/);
    assert.ok(!liveRes.rawBody.includes('MISSION_OS_TOKEN'), '/live HTML must not contain raw env setting name');
    assert.ok(!liveRes.rawBody.includes('[REDACTED_SETTING]'), '/live UI copy must not trigger env setting redaction');
    assert.ok(!liveRes.rawBody.includes(token), '/live HTML must never echo live token value');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('Carbon review remediation: WheelEnqueuePayload constraints, 4xx rejection status, swarm-command routing, and /v1 loopback Host/Origin check', async () => {
  // 1. Engine lane preserved; invalid/scout coerced to mechanical; slug <= 30 without trailing '-'; single-line title without leading '#'
  const enginePayload = buildWheelEnqueuePayload({
    taskId: 'task-abcdefghijklmnopqrstuvwxyz-0123456789',
    lane: 'engine',
    repo: 'Trollz1004/dream-online',
    title: '### \nBuild Desktop Shell\r\nExtra details',
    slug: 'very-long-slug-exceeding-limit-abc',
  });
  assert.equal(enginePayload.lane, 'engine');
  assert.equal(enginePayload.repo, 'dream-online');
  assert.ok(enginePayload.slug.length <= 30, `slug exceeded 30 chars: ${enginePayload.slug}`);
  assert.match(enginePayload.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.doesNotMatch(enginePayload.title, /[\r\n]/);
  assert.ok(!enginePayload.title.startsWith('#'));

  const scoutCoerced = buildWheelEnqueuePayload({
    lane: 'scout',
    title: '###',
    slug: 'alpha-bravo-charlie-delta-echo-foxtrot',
  });
  assert.equal(scoutCoerced.lane, 'mechanical');
  assert.ok(scoutCoerced.slug.length <= 30);
  assert.match(scoutCoerced.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(scoutCoerced.title.length > 0 && !scoutCoerced.title.startsWith('#'));

  // 2. HTTP 4xx -> rejected vs HTTP 5xx -> deferred-unreachable
  const res400 = await defaultWheelEnqueue(
    {
      title: 'Build app',
      lane: 'mechanical',
      repo: 'ANTIGRAVITY',
      base: 'main',
      prompt: 'Build app',
      slug: 'build-app',
    },
    {
      env: {},
      fetchImpl: async () => ({ ok: false, status: 400 }),
    },
  );
  assert.equal(res400.ok, false);
  assert.equal(res400.wheelSyncStatus, 'rejected');

  const res503 = await defaultWheelEnqueue(
    {
      title: 'Build app',
      lane: 'mechanical',
      repo: 'ANTIGRAVITY',
      base: 'main',
      prompt: 'Build app',
      slug: 'build-app',
    },
    {
      env: {},
      fetchImpl: async () => ({ ok: false, status: 503 }),
    },
  );
  assert.equal(res503.ok, false);
  assert.equal(res503.wheelSyncStatus, 'deferred-unreachable');

  // 3. Heavy build for swarm-command does NOT rewrite repo to ANTIGRAVITY or post invalid literal
  const tmp = makeTempDir();
  try {
    const token = 'wheel-contract-token';
    const env = { MISSION_OS_TOKEN: token, MISSION_OS_TASK_QUEUE_DIR: path.join(tmp, 'queue') };
    const watchdog = createNodeWatchdog({
      fleetMap: fixtureFleetMap(),
      incidentsPath: path.join(tmp, 'incidents.json'),
      keepaliveStatusPath: path.join(tmp, 'status.json'),
      env,
      disableTelegram: true,
      probeService: async () => ({ up: true, status: 'UP', reason: 'Healthy', lastError: null }),
    });
    let enqueueCalls = 0;
    const shell = createShellApi({
      env,
      watchdog,
      prFetcher: async () => [],
      fetchImpl: async () => {
        enqueueCalls += 1;
        return { ok: true, status: 200 };
      },
    });
    const handler = createMissionHandler({ env, watchdog, shellApi: shell });

    const scRes = await invokeHandler(handler, {
      method: 'POST',
      url: '/api/v1/chat/send',
      headers: { 'x-mission-os-token': token },
      body: {
        message: 'Run pytest full test suite for swarm-command',
        repo: 'Trollz1004/swarm-command',
        node: 't5500',
        author: 'Josh',
      },
    });
    assert.equal(scRes.statusCode, 202);
    assert.equal(scRes.body.node, 'alienware');
    assert.equal(scRes.body.executionTarget, 'alienware-wheel-inbox');
    assert.equal(scRes.body.neverRunOnT5500, true);
    assert.equal(scRes.body.wheelSyncStatus, 'deferred-unsupported-repo');
    assert.equal(enqueueCalls, 0);

    const saved = JSON.parse(fs.readFileSync(path.join(tmp, 'queue', `${scRes.body.taskId}.json`), 'utf8'));
    assert.equal(saved.wheelPayload.repo, 'swarm-command');

    // 4. Loopback /v1/models rejects untrusted Host (DNS rebinding) & mismatched Origin while permitting CLI Host: 127.0.0.1:3130
    const badHost = await invokeHandler(handler, {
      method: 'GET',
      url: '/v1/models',
      remoteAddress: '127.0.0.1',
      headers: { host: 'evil.example:3130' },
    });
    assert.equal(badHost.statusCode, 403);

    const badOrigin = await invokeHandler(handler, {
      method: 'GET',
      url: '/v1/models',
      remoteAddress: '127.0.0.1',
      headers: { host: '127.0.0.1:3130', origin: 'http://127.0.0.1:9999' },
    });
    assert.equal(badOrigin.statusCode, 403);

    const okLocalCli = await invokeHandler(handler, {
      method: 'GET',
      url: '/v1/models',
      remoteAddress: '127.0.0.1',
      headers: { host: '127.0.0.1:3130' },
    });
    assert.equal(okLocalCli.statusCode, 200);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
