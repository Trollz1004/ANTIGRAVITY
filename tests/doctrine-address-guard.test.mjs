import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const DOCTRINE_SCRIPT = path.join(REPO_ROOT, 'scripts', 'doctrine', 'doctrine-check.py');

function createTempRepo(filesMap) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'doctrine-addr-test-'));
  execFileSync('git', ['init', '-q'], { cwd: dir });
  for (const [relPath, content] of Object.entries(filesMap)) {
    const abs = path.join(dir, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf8');
    execFileSync('git', ['add', relPath], { cwd: dir });
  }
  return dir;
}

function runDoctrine(repoRoot) {
  const proc = spawnSync('python', [DOCTRINE_SCRIPT, '--root', repoRoot], {
    encoding: 'utf8',
    timeout: 15000,
  });
  return {
    status: proc.status,
    stdout: String(proc.stdout || ''),
    stderr: String(proc.stderr || ''),
  };
}

test('doctrine-check.py rejects localhost:3130, 127.0.0.1:8000, and http/ws loopback URLs under loopback-address', () => {
  const badCases = [
    { file: 'app/client.mjs', content: 'export const MISSION = "localhost:3130";\n', expectedHit: 'localhost:3130' },
    {
      file: 'app/api.mjs',
      content: 'export const API = "http://127.0.0.1:8000/api/v1";\n',
      expectedHit: 'http://127.0.0.1:8000',
    },
    {
      file: 'app/bare.mjs',
      content: 'export const WEB = "http://localhost/status";\n',
      expectedHit: 'http://localhost',
    },
    { file: 'app/ws.mjs', content: 'export const WS = "ws://127.0.0.1:9119";\n', expectedHit: 'ws://127.0.0.1:9119' },
    {
      file: 'app/wss.mjs',
      content: 'export const WSS = "wss://localhost:8000/ws";\n',
      expectedHit: 'wss://localhost:8000',
    },
  ];

  for (const c of badCases) {
    const tmp = createTempRepo({ [c.file]: c.content });
    try {
      const res = runDoctrine(tmp);
      assert.equal(res.status, 1, `Expected violation for ${c.content.trim()}, got stdout=${res.stdout}`);
      assert.match(res.stdout, /\[loopback-address\]/);
      assert.ok(res.stdout.includes(c.expectedHit), `Expected ${c.expectedHit} in output: ${res.stdout}`);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
});

test('doctrine-check.py accepts 192.168.0.15:3130, 127.0.0.1:5432/6379, DevTools flag, fleet-map.json, and archive/**', () => {
  const tmp = createTempRepo({
    'app/endpoints.mjs': [
      'export const MISSION_OS = "http://192.168.0.15:3130";',
      'export const SWARM = "http://192.168.0.40:8000";',
      'export const PG = "postgresql+asyncpg://postgres:pw@127.0.0.1:5432/db";',
      'export const REDIS = "redis://127.0.0.1:6379/0";',
      'export const CHROME_FLAG = "--remote-debugging-address=127.0.0.1";',
      '',
    ].join('\n'),
    'ops/fleet/fleet-map.json': JSON.stringify({
      services: {
        postgres: { host: '127.0.0.1', port: 5432 },
        redis: { host: '127.0.0.1', port: 6379 },
      },
    }),
    'archive/old-note.md': 'Legacy retired reference http://localhost:3130 and 127.0.0.1:8000\n',
  });

  try {
    const res = runDoctrine(tmp);
    assert.equal(res.status, 0, `Expected clean exit, got stdout=${res.stdout} stderr=${res.stderr}`);
    assert.match(res.stdout, /doctrine-check: clean/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('doctrine-check.py passes cleanly on the live repository root', () => {
  const res = spawnSync('python', [DOCTRINE_SCRIPT], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.equal(res.status, 0, `Repo doctrine-check failed:\n${res.stdout}\n${res.stderr}`);
  assert.match(String(res.stdout || ''), /doctrine-check: clean/);
});

test('scripts/doctrine/baseline.json holds no dead entries for files that no longer exist', () => {
  const baselinePath = path.join(REPO_ROOT, 'scripts', 'doctrine', 'baseline.json');
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const dead = baseline.entries.filter((entry) => !fs.existsSync(path.join(REPO_ROOT, entry.file)));
  assert.deepEqual(dead, [], `Found dead baseline entries:\n${dead.map((e) => `  [${e.fact}] ${e.file}`).join('\n')}`);
});
