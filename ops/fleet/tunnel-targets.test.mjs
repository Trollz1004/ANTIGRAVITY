import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.join(__dirname, 'tunnel-targets.ps1');

const SAMPLE_CONFIG = [
  '# T5500 cloudflared ingress fixture',
  'tunnel: 11111111-2222-3333-4444-555555555555',
  'credentials-file: C:\\cloudflared\\tunnel.json',
  'originRequest:',
  '  noTLSVerify: true',
  '',
  'ingress:',
  '  - hostname: youandinotai.com',
  '    service: http://127.0.0.1:3200',
  '  - hostname: api.youandinotai.com',
  '    service: http://localhost:8000',
  '  - hostname: dashboard.aidoesitall.website',
  '    service: http://127.0.0.1:3100',
  '  - hostname: aidoesitall.website',
  '    service: "http://127.0.0.1:9160" # static domains router',
  '  - hostname: mos.aidoesitall.website',
  '    service: http://localhost:3130',
  '  - hostname: pg-local.internal',
  '    service: tcp://127.0.0.1:5432',
  '  - service: http_status:404',
  '',
].join('\n');

function runPowerShell(args) {
  return execFileSync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', SCRIPT_PATH, ...args],
    { encoding: 'utf8' }
  );
}

test('tunnel-targets.ps1 dry-run prints diff without modifying config or creating backup', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-tunnel-dry-'));
  try {
    const cfgPath = path.join(tmpDir, 'config.yml');
    fs.writeFileSync(cfgPath, SAMPLE_CONFIG, 'utf8');

    const out = runPowerShell(['-ConfigPath', cfgPath, '-SkipProbe']);

    assert.match(out, /Mode: DRY-RUN/);
    assert.match(out, /-\s*- hostname: dashboard\.aidoesitall\.website/);
    assert.match(out, /-\s*service: http:\/\/127\.0\.0\.1:3100/);
    assert.match(out, /\+\s*service: http:\/\/192\.168\.0\.15:3200/);
    assert.match(out, /\+\s*service: http:\/\/192\.168\.0\.15:8000/);
    assert.match(out, /\+\s*service: "http:\/\/192\.168\.0\.15:9160" # static domains router/);
    assert.match(out, /\+\s*service: http:\/\/192\.168\.0\.15:3130/);
    assert.doesNotMatch(out, /192\.168\.0\.15:5432/);

    assert.equal(fs.readFileSync(cfgPath, 'utf8'), SAMPLE_CONFIG);
    const entries = fs.readdirSync(tmpDir);
    assert.deepEqual(entries, ['config.yml']);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('tunnel-targets.ps1 -Apply on temp fixture backs up first, edits only hostname/service lines, and is idempotent', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-tunnel-apply-'));
  try {
    const cfgPath = path.join(tmpDir, 'config.yml');
    fs.writeFileSync(cfgPath, SAMPLE_CONFIG, 'utf8');

    const out = runPowerShell(['-ConfigPath', cfgPath, '-SkipProbe', '-Apply']);
    assert.match(out, /Mode: APPLY/);
    assert.match(out, /Backup written:/);

    const files = fs.readdirSync(tmpDir);
    const backups = files.filter((f) => f.startsWith('config.yml.bak-'));
    assert.equal(backups.length, 1, 'Expected exactly one timestamped backup file');
    assert.equal(
      fs.readFileSync(path.join(tmpDir, backups[0]), 'utf8'),
      SAMPLE_CONFIG,
      'Backup must match original config byte-for-byte'
    );

    const updated = fs.readFileSync(cfgPath, 'utf8');
    const expected = [
      '# T5500 cloudflared ingress fixture',
      'tunnel: 11111111-2222-3333-4444-555555555555',
      'credentials-file: C:\\cloudflared\\tunnel.json',
      'originRequest:',
      '  noTLSVerify: true',
      '',
      'ingress:',
      '  - hostname: youandinotai.com',
      '    service: http://192.168.0.15:3200',
      '  - hostname: api.youandinotai.com',
      '    service: http://192.168.0.15:8000',
      '  - hostname: aidoesitall.website',
      '    service: "http://192.168.0.15:9160" # static domains router',
      '  - hostname: mos.aidoesitall.website',
      '    service: http://192.168.0.15:3130',
      '  - hostname: pg-local.internal',
      '    service: tcp://127.0.0.1:5432',
      '  - service: http_status:404',
      '',
    ].join('\n');

    assert.equal(updated, expected);

    const secondPass = runPowerShell(['-ConfigPath', cfgPath, '-SkipProbe']);
    assert.match(secondPass, /No changes required\./);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('tunnel-targets.ps1 -ProbeLive rewrites only ports with an active listener', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-tunnel-probe-'));
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const openPort = server.address().port;
  const closedPort = openPort === 65000 ? 65001 : openPort + 1;

  try {
    const customMapPath = path.join(tmpDir, 'fleet-map.json');
    fs.writeFileSync(
      customMapPath,
      JSON.stringify({
        schema: 'antigravity.fleet-map.v1',
        nodes: {
          t5500: { id: 't5500', name: 'T5500', ip: '127.0.0.1', host: '127.0.0.1' },
          alienware: { id: 'alienware', name: 'Alienware', ip: '192.168.0.40', host: '192.168.0.40' },
        },
        services: {
          'up-svc': { id: 'up-svc', node: 't5500', host: '127.0.0.1', port: openPort, scope: 'lan', bind: '0.0.0.0' },
          'down-svc': { id: 'down-svc', node: 't5500', host: '127.0.0.1', port: closedPort, scope: 'lan', bind: '0.0.0.0' },
        },
      }),
      'utf8'
    );

    const cfgPath = path.join(tmpDir, 'config.yml');
    fs.writeFileSync(
      cfgPath,
      [
        'ingress:',
        '  - hostname: up.example',
        `    service: http://localhost:${openPort}`,
        '  - hostname: down.example',
        `    service: http://localhost:${closedPort}`,
        '  - service: http_status:404',
        '',
      ].join('\n'),
      'utf8'
    );

    const out = runPowerShell(['-ConfigPath', cfgPath, '-MapPath', customMapPath, '-ProbeLive']);
    assert.match(out, new RegExp(`\\+\\s*service: http://127\\.0\\.0\\.1:${openPort}`));
    assert.match(out, new RegExp(`listener check failed on 127\\.0\\.0\\.1:${closedPort}`));
    assert.doesNotMatch(out, new RegExp(`\\+\\s*service: http://127\\.0\\.0\\.1:${closedPort}`));
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
