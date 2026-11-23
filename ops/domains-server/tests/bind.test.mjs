import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveDomainsServerBind, buildDomainsHealthPayload, server } from '../server.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.resolve(HERE, '..', 'server.mjs');
const LOOPBACK = ['127', '0', '0', '1'].join('.');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, LOOPBACK, () => {
      const addr = srv.address();
      const port = addr && typeof addr === 'object' ? addr.port : 0;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

function httpGet(port, urlPath, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: LOOPBACK, port, path: urlPath, method: 'GET', headers }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function waitForReady(port, logsRef) {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await httpGet(port, '/health');
      if (res.status === 200) return res;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`domains-server did not start on port ${port}; logs=${logsRef()}`);
}

test('resolveDomainsServerBind uses explicit DOMAINS_SERVER_HOST ("127.0.0.1,192.168.0.15") without token and never throws, defaults to 127.0.0.1 with warning when host and token are unset, and binds 0.0.0.0 with token', () => {
  const warnings = [];
  assert.deepEqual(resolveDomainsServerBind({}, { port: 9160, warn: (m) => warnings.push(m) }), [LOOPBACK]);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /FLEET_SHARED_TOKEN/);
  assert.doesNotMatch(warnings[0], /127\.0\.0\.1:\d+/);

  assert.deepEqual(
    resolveDomainsServerBind({ DOMAINS_SERVER_HOST: '127.0.0.1,192.168.0.15' }, { port: 9160, warn: () => {} }),
    ['127.0.0.1', '192.168.0.15']
  );
  assert.deepEqual(
    resolveDomainsServerBind({ DOMAINS_SERVER_HOST: '0.0.0.0' }, { port: 9160, warn: () => {} }),
    ['0.0.0.0']
  );
  assert.deepEqual(resolveDomainsServerBind({ FLEET_SHARED_TOKEN: 'tok' }, { port: 9160, warn: () => {} }), ['0.0.0.0']);
});

test('domains-server serves public routes (200) without fleet token in both no-token (127.0.0.1) and token-set (0.0.0.0) modes', async () => {
  for (const mode of [
    { name: 'no-token', token: '', expectedBind: LOOPBACK, expectWarn: true },
    { name: 'token-set', token: 'test-fleet-token-9160', expectedBind: '0.0.0.0', expectWarn: false },
  ]) {
    const port = await getFreePort();
    const env = { ...process.env, DOMAINS_SERVER_PORT: String(port) };
    delete env.DOMAINS_SERVER_HOST;
    if (mode.token) env.FLEET_SHARED_TOKEN = mode.token;
    else {
      delete env.FLEET_SHARED_TOKEN;
      delete env.DOMAINS_SERVER_TOKEN;
    }

    const child = spawn(process.execPath, [SERVER_PATH], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let logs = '';
    child.stdout.on('data', (c) => { logs += String(c); });
    child.stderr.on('data', (c) => { logs += String(c); });

    try {
      const healthRes = await waitForReady(port, () => logs);
      assert.equal(healthRes.status, 200, `${mode.name}: /health must return 200 without token`);
      assert.ok(
        logs.includes(`listening on http://${mode.expectedBind}:${port}`),
        `${mode.name}: expected bind ${mode.expectedBind}; logs=${logs}`
      );
      if (mode.expectWarn) {
        assert.match(logs, /WARNING: FLEET_SHARED_TOKEN is not set/);
        assert.match(logs, /Startup env check: missing required setting names: FLEET_SHARED_TOKEN/);
      }

      const healthJson = JSON.parse(healthRes.body);
      assert.equal(healthJson.service, 'domains-server');
      assert.ok(healthJson.bookingNotices === 'on' || healthJson.bookingNotices === 'off');
      assert.equal(typeof healthJson.unnotifiedBookings, 'number');
      // Public route: counts and light only, never setting or file names.
      assert.equal('missingEnv' in healthJson, false);
      assert.equal('driftedFiles' in healthJson, false);
      assert.equal(healthRes.body.includes('FLEET_SHARED_TOKEN'), false);
      if (mode.token) {
        assert.equal(healthJson.missingEnvCount, 0);
        assert.equal(healthRes.body.includes(mode.token), false);
      } else {
        assert.equal(healthJson.missingEnvCount, 1);
        assert.equal(healthJson.nodeLight, 'amber');
      }

      const publicHealthRes = await httpGet(port, '/health', { Host: 'onlinerecycle.net' });
      assert.equal(publicHealthRes.status, 200);
      const publicHealthJson = JSON.parse(publicHealthRes.body);
      assert.equal(publicHealthJson.bookingNotices, healthJson.bookingNotices);
      assert.equal(publicHealthJson.unnotifiedBookings, healthJson.unnotifiedBookings);

      const apiHealthRes = await httpGet(port, '/api/health', { Host: 'onlinerecycle.net' });
      assert.equal(apiHealthRes.status, 200);
      const apiHealthJson = JSON.parse(apiHealthRes.body);
      assert.equal(apiHealthJson.bookingNotices, healthJson.bookingNotices);
      assert.equal(apiHealthJson.unnotifiedBookings, healthJson.unnotifiedBookings);

      const siteRes = await httpGet(port, '/', { Host: 'onlinerecycle.net' });
      assert.equal(siteRes.status, 200, `${mode.name}: public vhost / must return 200 without token`);

      const bookingCfgRes = await httpGet(port, '/api/booking-config', { Host: 'onlinerecycle.net' });
      assert.equal(bookingCfgRes.status, 200, `${mode.name}: /api/booking-config must return 200 without token`);
    } finally {
      child.kill();
    }
  }
});
test('domains-server starts with two explicit addresses of this PC in DOMAINS_SERVER_HOST and no token, and answers /health', async () => {
  const os = await import('node:os');
  const nets = os.default.networkInterfaces();
  let secondAddr = '127.0.0.2';
  for (const list of Object.values(nets)) {
    for (const info of list || []) {
      if (info && info.family === 'IPv4' && !info.internal && !info.address.startsWith('169.254.')) {
        secondAddr = info.address;
        break;
      }
    }
    if (secondAddr !== '127.0.0.2') break;
  }
  const port = await getFreePort();
  const env = { ...process.env, DOMAINS_SERVER_PORT: String(port), DOMAINS_SERVER_HOST: `${LOOPBACK},${secondAddr}` };
  delete env.FLEET_SHARED_TOKEN;
  delete env.DOMAINS_SERVER_TOKEN;

  const child = spawn(process.execPath, [SERVER_PATH], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  let logs = '';
  child.stdout.on('data', (c) => { logs += String(c); });
  child.stderr.on('data', (c) => { logs += String(c); });

  try {
    const healthRes = await waitForReady(port, () => logs);
    assert.equal(healthRes.status, 200);
    assert.match(healthRes.body, /"domains-server"/);
    assert.ok(logs.includes(`listening on http://${LOOPBACK}:${port}`), `expected loopback listener in logs=${logs}`);
    assert.ok(logs.includes(`listening on http://${secondAddr}:${port}`), `expected second listener in logs=${logs}`);
  } finally {
    child.kill();
  }
});

test('buildDomainsHealthPayload reports bookingNotices on/off, unnotifiedBookings, missingEnvCount from FLEET_SHARED_TOKEN only, and amber nodeLight when notices are off or unnotifiedBookings > 0', () => {
  const offMissingFleet = buildDomainsHealthPayload({}, { unnotifiedBookings: 0, driftPath: 'nonexistent-drift.json' });
  assert.equal(offMissingFleet.service, 'domains-server');
  assert.equal(offMissingFleet.missingEnvCount, 1);
  assert.equal(offMissingFleet.bookingNotices, 'off');
  assert.equal(offMissingFleet.bookingNoticesStatus, 'booking notices: off');
  assert.equal(offMissingFleet.unnotifiedBookings, 0);
  assert.equal(offMissingFleet.nodeLight, 'amber');

  const offWithFleet = buildDomainsHealthPayload(
    { FLEET_SHARED_TOKEN: 'fleet-tok' },
    { unnotifiedBookings: 0, driftPath: 'nonexistent-drift.json' }
  );
  assert.equal(offWithFleet.missingEnvCount, 0);
  assert.equal(offWithFleet.bookingNotices, 'off');
  assert.equal(offWithFleet.nodeLight, 'amber');

  const onClean = buildDomainsHealthPayload(
    {
      FLEET_SHARED_TOKEN: 'fleet-tok',
      ORC_NOTIFY_TELEGRAM_TOKEN: 'tg-tok',
      ORC_NOTIFY_TELEGRAM_CHAT: 'tg-chat',
    },
    { unnotifiedBookings: 0, driftPath: 'nonexistent-drift.json' }
  );
  assert.equal(onClean.missingEnvCount, 0);
  assert.equal(onClean.bookingNotices, 'on');
  assert.equal(onClean.bookingNoticesStatus, 'booking notices: on');
  assert.equal(onClean.unnotifiedBookings, 0);
  assert.equal(onClean.nodeLight, 'green');

  const onWithUnnotified = buildDomainsHealthPayload(
    {
      FLEET_SHARED_TOKEN: 'fleet-tok',
      ORC_NOTIFY_TELEGRAM_TOKEN: 'tg-tok',
      ORC_NOTIFY_TELEGRAM_CHAT: 'tg-chat',
    },
    { unnotifiedBookings: 2, driftPath: 'nonexistent-drift.json' }
  );
  assert.equal(onWithUnnotified.bookingNotices, 'on');
  assert.equal(onWithUnnotified.unnotifiedBookings, 2);
  assert.equal(onWithUnnotified.nodeLight, 'amber');
});

test('public /health code path (server request handler for Host: onlinerecycle.net) answers with bookingNotices and unnotifiedBookings', async () => {
  const handler = server.listeners('request')[0];
  assert.equal(typeof handler, 'function');
  for (const url of ['/health', '/health/', '/api/health']) {
    let status = 0;
    let headers = {};
    let rawBody = '';
    const req = {
      method: 'GET',
      url,
      headers: { host: 'onlinerecycle.net', 'cf-connecting-ip': '203.0.113.10' },
      socket: { remoteAddress: '127.0.0.1' },
    };
    const res = {
      headersSent: false,
      destroyed: false,
      writeHead(code, hdrs) {
        status = code;
        headers = hdrs || {};
        this.headersSent = true;
      },
      end(chunk = '') {
        rawBody += String(chunk);
      },
    };
    await handler(req, res);
    assert.equal(status, 200, `expected 200 on ${url}`);
    assert.equal(headers['Cache-Control'], 'no-store');
    const parsed = JSON.parse(rawBody);
    assert.equal(parsed.service, 'domains-server');
    assert.ok(parsed.bookingNotices === 'on' || parsed.bookingNotices === 'off');
    assert.equal(typeof parsed.unnotifiedBookings, 'number');
  }
});
