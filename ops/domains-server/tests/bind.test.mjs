import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveDomainsServerBind } from '../server.mjs';

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
