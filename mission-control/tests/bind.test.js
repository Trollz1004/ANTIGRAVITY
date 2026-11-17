import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveMissionControlBind } from '../lib/config.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.resolve(HERE, '..', 'server.mjs');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const port = addr && typeof addr === 'object' ? addr.port : 0;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

describe('resolveMissionControlBind', () => {
  it('binds 127.0.0.1 with one plain warning when no token is set', () => {
    const warnings = [];
    const host = resolveMissionControlBind({}, { port: 9150, warn: (m) => warnings.push(m) });
    expect(host).toBe('127.0.0.1');
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toMatch(/MISSION_OS_TOKEN/);
    expect(warnings[0]).toMatch(/MISSION_CONTROL_TOKEN/);
    expect(warnings[0]).not.toMatch(/127\.0\.0\.1:\d+/);
  });

  it('refuses explicit non-loopback MISSION_CONTROL_HOST without a token', () => {
    expect(() => resolveMissionControlBind({ MISSION_CONTROL_HOST: '0.0.0.0' }, { warn: () => {} })).toThrow();
    expect(() => resolveMissionControlBind({ MISSION_CONTROL_HOST: '192.168.0.15' }, { warn: () => {} })).toThrow();
  });

  it('binds 0.0.0.0 when any guard token is configured', () => {
    expect(resolveMissionControlBind({ MISSION_OS_TOKEN: 'tok' }, { warn: () => {} })).toBe('0.0.0.0');
    expect(resolveMissionControlBind({ MISSION_CONTROL_TOKEN: 'tok' }, { warn: () => {} })).toBe('0.0.0.0');
    expect(resolveMissionControlBind({ DASHBOARD_BRIDGE_TOKEN: 'tok' }, { warn: () => {} })).toBe('0.0.0.0');
    expect(resolveMissionControlBind({ FLEET_SHARED_TOKEN: 'tok' }, { warn: () => {} })).toBe('0.0.0.0');
  });

  it('starts cleanly on 127.0.0.1 with warning and serves loopback routes without 503 when token is unset', async () => {
    const port = await getFreePort();
    const env = { ...process.env, AIRI_DASHBOARD_PORT: String(port) };
    delete env.MISSION_OS_TOKEN;
    delete env.MISSION_CONTROL_TOKEN;
    delete env.DASHBOARD_BRIDGE_TOKEN;
    delete env.FLEET_SHARED_TOKEN;
    delete env.MISSION_CONTROL_HOST;

    const child = spawn(process.execPath, [SERVER_PATH], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let logs = '';
    child.stdout.on('data', (c) => { logs += String(c); });
    child.stderr.on('data', (c) => { logs += String(c); });

    try {
      await new Promise((resolve, reject) => {
        const deadline = setTimeout(() => reject(new Error(`server did not listen; logs=${logs}`)), 8000);
        const check = () => {
          if (logs.includes(`http://127.0.0.1:${port}`)) {
            clearTimeout(deadline);
            resolve();
          }
        };
        child.stdout.on('data', check);
        child.stderr.on('data', check);
        child.on('exit', (code) => {
          clearTimeout(deadline);
          reject(new Error(`server exited early (${code}); logs=${logs}`));
        });
      });

      expect(logs).toMatch(/WARNING: MISSION_OS_TOKEN \/ MISSION_CONTROL_TOKEN is not set/);

      const healthRes = await fetch(`http://127.0.0.1:${port}/health`);
      expect(healthRes.status).toBe(200);

      const cfgRes = await fetch(`http://127.0.0.1:${port}/api/config`);
      expect(cfgRes.status).toBe(200);

      const vaultGraphRes = await fetch(`http://127.0.0.1:${port}/api/vault/graph`);
      expect(vaultGraphRes.status).toBe(200);
    } finally {
      child.kill();
    }
  });
});
