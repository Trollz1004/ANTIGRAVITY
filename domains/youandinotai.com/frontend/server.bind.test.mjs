import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveFrontendBind } from './bind.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TSX_CLI = path.join(HERE, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const HAS_FRONTEND_DEPS =
  fs.existsSync(path.join(HERE, 'node_modules', 'express')) && fs.existsSync(TSX_CLI);
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

test('resolveFrontendBind binds 127.0.0.1 with warning when FLEET_SHARED_TOKEN is unset, fails closed on explicit LAN bind, and binds 0.0.0.0 with token', () => {
  const warnings = [];
  const host = resolveFrontendBind({}, { port: 3200, bind: '0.0.0.0', warn: (m) => warnings.push(m) });
  assert.equal(host, LOOPBACK);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /FLEET_SHARED_TOKEN/);
  assert.doesNotMatch(warnings[0], /127\.0\.0\.1:\d+/);

  assert.throws(() => resolveFrontendBind({ HOST: '0.0.0.0' }, { port: 3200, bind: '0.0.0.0', warn: () => {} }));
  assert.throws(() => resolveFrontendBind({ HOST: '192.168.0.15' }, { port: 3200, bind: '0.0.0.0', warn: () => {} }));
  assert.equal(resolveFrontendBind({ HOST: LOOPBACK }, { port: 3200, bind: '0.0.0.0', warn: () => {} }), LOOPBACK);
  assert.equal(
    resolveFrontendBind({ FLEET_SHARED_TOKEN: 'fleet-tok' }, { port: 3200, bind: '0.0.0.0', warn: () => {} }),
    '0.0.0.0'
  );
});

test(
  'youandinotai frontend server serves public routes (200) without fleet token in both no-token (127.0.0.1) and token-set (0.0.0.0) modes',
  {
    skip: !HAS_FRONTEND_DEPS ? 'requires frontend node_modules (express + tsx)' : false,
  },
  async () => {
    for (const mode of [
      { name: 'no-token', token: '', expectedBind: LOOPBACK, expectWarn: true },
      { name: 'token-set', token: 'test-fleet-token-3200', expectedBind: '0.0.0.0', expectWarn: false },
    ]) {
      const port = await getFreePort();
      const env = {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(port),
      };
      delete env.HOST;
      if (mode.token) env.FLEET_SHARED_TOKEN = mode.token;
      else delete env.FLEET_SHARED_TOKEN;

      const child = spawn(process.execPath, [TSX_CLI, 'server.ts'], {
        cwd: HERE,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let logs = '';
      child.stdout.on('data', (c) => { logs += String(c); });
      child.stderr.on('data', (c) => { logs += String(c); });

      try {
        await new Promise((resolve, reject) => {
          const deadline = setTimeout(() => reject(new Error(`frontend did not start; logs=${logs}`)), 10000);
          const check = () => {
            if (logs.includes(`Server running on http://${mode.expectedBind}:${port}`)) {
              clearTimeout(deadline);
              resolve();
            }
          };
          child.stdout.on('data', check);
          child.stderr.on('data', check);
          child.on('exit', (code) => {
            clearTimeout(deadline);
            reject(new Error(`frontend exited early (${code}); logs=${logs}`));
          });
        });

        if (mode.expectWarn) {
          assert.match(logs, /WARNING: FLEET_SHARED_TOKEN is not set/);
          assert.match(logs, /Startup env check: missing required setting names: FLEET_SHARED_TOKEN/);
        }

        const health = await fetch(`http://${LOOPBACK}:${port}/health`);
        assert.equal(health.status, 200, `${mode.name}: /health must return 200 without fleet token`);
        const healthBody = await health.json();
        assert.equal(Array.isArray(healthBody.missingEnv), true);

        const apiHealth = await fetch(`http://${LOOPBACK}:${port}/api/health`);
        assert.equal(apiHealth.status, 200, `${mode.name}: /api/health must return 200 without fleet token`);
        const apiHealthBody = await apiHealth.json();
        if (mode.token) {
          assert.deepEqual(apiHealthBody.missingEnv, []);
          assert.equal(JSON.stringify(apiHealthBody).includes(mode.token), false);
        } else {
          assert.deepEqual(apiHealthBody.missingEnv, ['FLEET_SHARED_TOKEN']);
          assert.equal(apiHealthBody.nodeLight, 'amber');
        }

        if (fs.existsSync(path.join(HERE, 'dist', 'index.html'))) {
          const home = await fetch(`http://${LOOPBACK}:${port}/`);
          assert.equal(home.status, 200, `${mode.name}: / must return 200 without fleet token`);
        }
      } finally {
        child.kill();
      }
    }
  }
);
