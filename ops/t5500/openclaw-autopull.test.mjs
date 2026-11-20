import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');
const SCRIPT_PATH = path.join(HERE, 'openclaw-autopull.ps1');

const FORBIDDEN_USERS = ['josh' + 'l', 'josh' + 'i', 'NSFW_' + 'BOTS'];
const HARDCODED_USER_PATH_RE = new RegExp(
  `(?:[A-Za-z]:\\\\+Users\\\\+|/Users/)(?:${FORBIDDEN_USERS.join('|')})\\b`,
  'i',
);

function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
      GIT_AUTHOR_NAME: 'Test Author',
      GIT_AUTHOR_EMAIL: 'test@example.com',
      GIT_COMMITTER_NAME: 'Test Author',
      GIT_COMMITTER_EMAIL: 'test@example.com',
    },
  }).trim();
}

function writeRepoFile(repoDir, relPath, content) {
  const fullPath = path.join(repoDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

function createGitFixture(initialFiles = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'openclaw-autopull-'));
  const originDir = path.join(root, 'origin.git');
  const seedDir = path.join(root, 'seed');
  const cloneDir = path.join(root, 'clone');

  fs.mkdirSync(originDir, { recursive: true });
  git(originDir, ['init', '--bare', '-q']);

  fs.mkdirSync(seedDir, { recursive: true });
  git(seedDir, ['init', '-q']);
  git(seedDir, ['checkout', '-q', '-b', 'main']);

  const defaultFiles = {
    'README.md': '# fixture\n',
    'odysseus/note.txt': 'baseline\n',
    'domains/youandinotai.com/backend/app/main.py': 'print("v1")\n',
    'domains/youandinotai.com/frontend/src/App.tsx': 'export const App = () => "v1";\n',
    'ops/domains-server/server.mjs': 'export const v = 1;\n',
    'domains/onlinerecycle.net/index.html': '<html>v1</html>\n',
    'domains/dream-online.net/index.html': '<html>v1</html>\n',
    'mission-os/server.mjs': 'export const mos = 1;\n',
    'ops/t5500/keepalive.ps1': '# keepalive v1\n',
    ...initialFiles,
  };

  for (const [rel, body] of Object.entries(defaultFiles)) {
    writeRepoFile(seedDir, rel, body);
  }
  git(seedDir, ['add', '.']);
  git(seedDir, ['commit', '-q', '-m', 'initial commit']);
  git(seedDir, ['remote', 'add', 'origin', originDir]);
  git(seedDir, ['push', '-q', '-u', 'origin', 'main']);

  git(root, ['clone', '-q', '--branch', 'main', originDir, cloneDir]);

  return { root, originDir, seedDir, cloneDir };
}

function pushUpstreamCommit(seedDir, filesMap, message = 'upstream update') {
  for (const [rel, body] of Object.entries(filesMap)) {
    writeRepoFile(seedDir, rel, body);
  }
  git(seedDir, ['add', '.']);
  git(seedDir, ['commit', '-q', '-m', message]);
  git(seedDir, ['push', '-q', 'origin', 'main']);
  return git(seedDir, ['rev-parse', 'HEAD']);
}

function runAutopull(repoPath, extraArgs = [], extraEnv = {}) {
  return spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', SCRIPT_PATH, '-RepoPath', repoPath, ...extraArgs],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      timeout: 20000,
      windowsHide: true,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0', ...extraEnv },
    },
  );
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
    srv.on('error', reject);
  });
}

function waitForPortListen(port, timeoutMs = 8000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const sock = net.connect({ host: '127.0.0.1', port }, () => {
        sock.destroy();
        resolve();
      });
      sock.on('error', () => {
        sock.destroy();
        if (Date.now() - start >= timeoutMs) {
          reject(new Error(`Timed out waiting for listener on port ${port}`));
        } else {
          setTimeout(tryConnect, 100);
        }
      });
    };
    tryConnect();
  });
}

test('openclaw-autopull.ps1 exists and obeys static safety rules: pull-only, no Write-Host, no prompts, no hardcoded usernames, no .env reads, UTF-8 no-BOM writes', () => {
  assert.ok(fs.existsSync(SCRIPT_PATH), 'ops/t5500/openclaw-autopull.ps1 must exist');
  const rawBytes = fs.readFileSync(SCRIPT_PATH);
  assert.equal(
    rawBytes[0] === 0xef && rawBytes[1] === 0xbb && rawBytes[2] === 0xbf,
    false,
    'openclaw-autopull.ps1 must be UTF-8 without BOM',
  );

  const src = rawBytes.toString('utf8');
  assert.doesNotMatch(src, /\bWrite-Host\b/i, 'Script must never use Write-Host');
  assert.doesNotMatch(src, /\bRead-Host\b/i, 'Script must never prompt for interactive input');
  assert.doesNotMatch(src, /git\s+[^\r\n]*\b(?:commit|push)\b/i, 'Script must never git commit or git push');
  assert.doesNotMatch(src, /git\s+[^\r\n]*\breset\s+--hard\b/i, 'Script must never run git reset --hard');
  assert.doesNotMatch(src, /Set-Content[^\r\n]*-Encoding\s+UTF8/i, 'Script must not use Set-Content -Encoding UTF8');
  assert.match(src, /WriteAllText[\s\S]*?UTF8Encoding\s+\$false/, 'Script must write JSON with UTF8Encoding($false)');
  assert.doesNotMatch(src, HARDCODED_USER_PATH_RE, 'Script must not contain hardcoded user folder names');
  assert.doesNotMatch(
    src,
    /(?:Get-Content|Import-Csv|ReadAllText|ReadAllLines|Select-String|StreamReader)[^\r\n]*\.env\b/i,
    'Script must never open .env files',
  );
});

test('openclaw-autopull.ps1 does nothing when ops\\t5500\\PAUSE-AUTOPULL exists', () => {
  const fx = createGitFixture();
  try {
    const oldHead = git(fx.cloneDir, ['rev-parse', 'HEAD']);
    pushUpstreamCommit(fx.seedDir, {
      'domains/youandinotai.com/backend/app/main.py': 'print("v2")\n',
    });

    writeRepoFile(fx.cloneDir, 'ops/t5500/PAUSE-AUTOPULL', 'paused\n');

    const res = runAutopull(fx.cloneDir, ['-Apply', '-SkipProcessStop']);
    assert.equal(res.status, 0, `Expected exit 0 when paused, got ${res.status}: ${res.stderr}\n${res.stdout}`);
    assert.match(res.stdout, /PAUSE-AUTOPULL/i);

    const afterHead = git(fx.cloneDir, ['rev-parse', 'HEAD']);
    assert.equal(afterHead, oldHead, 'HEAD must not change when PAUSE-AUTOPULL exists');

    const logDir = path.join(fx.cloneDir, 'logs', 'autopull');
    assert.equal(fs.existsSync(logDir), false, 'logs\\autopull must not be written when paused');
  } finally {
    fs.rmSync(fx.root, { recursive: true, force: true });
  }
});

test('openclaw-autopull.ps1 does nothing when origin/main is not straight ahead of HEAD (equal, behind, or diverged)', () => {
  const fx = createGitFixture();
  try {
    // 1. Equal: origin/main === HEAD
    const baseHead = git(fx.cloneDir, ['rev-parse', 'HEAD']);
    const equalRes = runAutopull(fx.cloneDir, ['-Apply', '-SkipProcessStop']);
    assert.equal(equalRes.status, 0, `Expected exit 0 when up-to-date: ${equalRes.stderr}\n${equalRes.stdout}`);
    assert.equal(git(fx.cloneDir, ['rev-parse', 'HEAD']), baseHead);
    assert.equal(fs.existsSync(path.join(fx.cloneDir, 'logs', 'autopull')), false);

    // 2. Ahead locally (origin/main is behind HEAD)
    writeRepoFile(fx.cloneDir, 'local-only.txt', 'local commit\n');
    git(fx.cloneDir, ['add', 'local-only.txt']);
    git(fx.cloneDir, ['commit', '-q', '-m', 'local ahead commit']);
    const localAheadHead = git(fx.cloneDir, ['rev-parse', 'HEAD']);

    const aheadRes = runAutopull(fx.cloneDir, ['-Apply', '-SkipProcessStop']);
    assert.equal(aheadRes.status, 0, `Expected exit 0 when local is ahead: ${aheadRes.stderr}\n${aheadRes.stdout}`);
    assert.equal(git(fx.cloneDir, ['rev-parse', 'HEAD']), localAheadHead);
    assert.equal(fs.existsSync(path.join(fx.cloneDir, 'logs', 'autopull')), false);

    // 3. Diverged: upstream also has a new commit while local has an unpushed commit
    pushUpstreamCommit(fx.seedDir, {
      'domains/youandinotai.com/backend/app/main.py': 'print("v2-upstream")\n',
    });
    const divergedRes = runAutopull(fx.cloneDir, ['-Apply', '-SkipProcessStop']);
    assert.equal(divergedRes.status, 0, `Expected exit 0 when diverged: ${divergedRes.stderr}\n${divergedRes.stdout}`);
    assert.equal(git(fx.cloneDir, ['rev-parse', 'HEAD']), localAheadHead, 'Diverged HEAD must remain untouched');
    assert.equal(fs.existsSync(path.join(fx.cloneDir, 'logs', 'autopull')), false);
  } finally {
    fs.rmSync(fx.root, { recursive: true, force: true });
  }
});

test('openclaw-autopull.ps1 does nothing when a tracked local change touches a file the pull would change, but allows unrelated tracked changes', () => {
  const fx = createGitFixture();
  try {
    const oldHead = git(fx.cloneDir, ['rev-parse', 'HEAD']);
    pushUpstreamCommit(fx.seedDir, {
      'domains/youandinotai.com/backend/app/main.py': 'print("v2-from-origin")\n',
    });

    // Dirty tracked file overlapping with incoming pull
    writeRepoFile(fx.cloneDir, 'domains/youandinotai.com/backend/app/main.py', 'print("dirty-local")\n');

    const conflictRes = runAutopull(fx.cloneDir, ['-Apply', '-SkipProcessStop']);
    assert.equal(conflictRes.status, 0, `Expected exit 0 on overlapping local change: ${conflictRes.stderr}\n${conflictRes.stdout}`);
    assert.match(conflictRes.stdout, /domains\/youandinotai\.com\/backend\/app\/main\.py/);
    assert.equal(git(fx.cloneDir, ['rev-parse', 'HEAD']), oldHead, 'HEAD must not move when tracked change overlaps');
    assert.equal(
      fs.readFileSync(path.join(fx.cloneDir, 'domains/youandinotai.com/backend/app/main.py'), 'utf8'),
      'print("dirty-local")\n',
      'Local tracked modification must not be overwritten or reset',
    );
    assert.equal(fs.existsSync(path.join(fx.cloneDir, 'logs', 'autopull')), false);

    // Restore overlapping file, dirty an unrelated tracked file (like odysseus/note.txt)
    git(fx.cloneDir, ['checkout', '--', 'domains/youandinotai.com/backend/app/main.py']);
    writeRepoFile(fx.cloneDir, 'odysseus/note.txt', 'unrelated local edit\n');

    const dryRes = runAutopull(fx.cloneDir);
    assert.equal(dryRes.status, 0, `Expected dry-run exit 0 with unrelated tracked edit: ${dryRes.stderr}\n${dryRes.stdout}`);
    assert.match(dryRes.stdout, /8000/);
    assert.equal(git(fx.cloneDir, ['rev-parse', 'HEAD']), oldHead, 'Dry-run without -Apply must not advance HEAD');
  } finally {
    fs.rmSync(fx.root, { recursive: true, force: true });
  }
});

test('openclaw-autopull.ps1 maps changed paths to services accurately and without -Apply only prints what it would do', () => {
  // Case A: Frontend-only change -> needs no service restart action
  const fxFrontend = createGitFixture();
  try {
    const oldHead = git(fxFrontend.cloneDir, ['rev-parse', 'HEAD']);
    pushUpstreamCommit(fxFrontend.seedDir, {
      'domains/youandinotai.com/frontend/src/App.tsx': 'export const App = () => "v2";\n',
    });

    const dryFrontend = runAutopull(fxFrontend.cloneDir);
    assert.equal(dryFrontend.status, 0, `Frontend dry-run failed: ${dryFrontend.stderr}\n${dryFrontend.stdout}`);
    assert.match(dryFrontend.stdout, /DRY-RUN/i);
    assert.match(dryFrontend.stdout, /git pull --ff-only/i);
    assert.match(dryFrontend.stdout, /keepalive rebuilds/i);
    assert.doesNotMatch(dryFrontend.stdout, /stop-port:8000|stop-port:9160|ANTIGRAVITY Mission Control/i);
    assert.equal(git(fxFrontend.cloneDir, ['rev-parse', 'HEAD']), oldHead);
  } finally {
    fs.rmSync(fxFrontend.root, { recursive: true, force: true });
  }

  // Case B: All mapped paths changed -> port 8000, port 9160 (deduped across 3 folders), ANTIGRAVITY Mission Control, ANTIGRAVITY T5500 Keepalive
  const fxAll = createGitFixture();
  try {
    const oldHead = git(fxAll.cloneDir, ['rev-parse', 'HEAD']);
    const newHead = pushUpstreamCommit(fxAll.seedDir, {
      'domains/youandinotai.com/backend/app/main.py': 'print("v2")\n',
      'ops/domains-server/server.mjs': 'export const v = 2;\n',
      'domains/onlinerecycle.net/index.html': '<html>v2</html>\n',
      'domains/dream-online.net/index.html': '<html>v2</html>\n',
      'mission-os/server.mjs': 'export const mos = 2;\n',
      'ops/t5500/keepalive.ps1': '# keepalive v2\n',
      'domains/youandinotai.com/frontend/src/App.tsx': 'export const App = () => "v2";\n',
    });

    const dryAll = runAutopull(fxAll.cloneDir);
    assert.equal(dryAll.status, 0, `All-services dry-run failed: ${dryAll.stderr}\n${dryAll.stdout}`);
    assert.match(dryAll.stdout, /DRY-RUN/i);
    assert.match(dryAll.stdout, /git pull --ff-only/i);
    assert.match(dryAll.stdout, /8000/);
    assert.match(dryAll.stdout, /9160/);
    assert.match(dryAll.stdout, /ANTIGRAVITY Mission Control/);
    assert.match(dryAll.stdout, /ANTIGRAVITY T5500 Keepalive/);
    assert.equal(git(fxAll.cloneDir, ['rev-parse', 'HEAD']), oldHead, 'Without -Apply must not pull');
    assert.notEqual(oldHead, newHead);
    assert.equal(fs.existsSync(path.join(fxAll.cloneDir, 'logs', 'autopull')), false);
  } finally {
    fs.rmSync(fxAll.root, { recursive: true, force: true });
  }
});

test('openclaw-autopull.ps1 with -Apply runs git pull --ff-only, stops the process owning each mapped port, and writes one JSON record under logs\\autopull', async () => {
  const fx = createGitFixture();
  const testPort = await getFreePort();

  // Start a real hidden Node child process owning testPort so -Apply stops it
  const child = spawn(
    process.execPath,
    [
      '-e',
      `const net = require('node:net'); const s = net.createServer(); s.listen(${testPort}, '127.0.0.1', () => {}); setInterval(() => {}, 1000);`,
    ],
    {
      stdio: 'ignore',
      windowsHide: true,
    },
  );

  try {
    await waitForPortListen(testPort);

    const oldCommit = git(fx.cloneDir, ['rev-parse', 'HEAD']);
    const newCommit = pushUpstreamCommit(fx.seedDir, {
      'domains/youandinotai.com/backend/app/main.py': 'print("v2-live")\n',
      'domains/onlinerecycle.net/index.html': '<html>v2-live</html>\n',
      'mission-os/server.mjs': 'export const mos = 2;\n',
      'ops/t5500/keepalive.ps1': '# keepalive v2\n',
    });

    const applyRes = runAutopull(fx.cloneDir, [
      '-Apply',
      '-BackendPort',
      String(testPort),
      '-DomainsPort',
      String(testPort),
    ]);
    assert.equal(applyRes.status, 0, `-Apply failed (${applyRes.status}): ${applyRes.stderr}\n${applyRes.stdout}`);

    // Verify git pull --ff-only advanced HEAD to newCommit
    const currentHead = git(fx.cloneDir, ['rev-parse', 'HEAD']);
    assert.equal(currentHead, newCommit, 'HEAD must advance to origin/main after -Apply');

    // Verify the process owning testPort was stopped
    const portStillOpen = await new Promise((resolve) => {
      const sock = net.connect({ host: '127.0.0.1', port: testPort }, () => {
        sock.destroy();
        resolve(true);
      });
      sock.on('error', () => {
        sock.destroy();
        resolve(false);
      });
    });
    assert.equal(portStillOpen, false, `Expected process owning port ${testPort} to be stopped by -Apply`);

    // Verify JSON record written under logs\autopull
    const logDir = path.join(fx.cloneDir, 'logs', 'autopull');
    assert.ok(fs.existsSync(logDir), 'logs\\autopull directory must exist after -Apply');
    const records = fs.readdirSync(logDir).filter((f) => f.endsWith('.json'));
    assert.equal(records.length, 1, `Expected 1 JSON record under logs\\autopull, found ${JSON.stringify(records)}`);

    const recordPath = path.join(logDir, records[0]);
    const rawBuf = fs.readFileSync(recordPath);
    assert.equal(
      rawBuf[0] === 0xef && rawBuf[1] === 0xbb && rawBuf[2] === 0xbf,
      false,
      'JSON record must be UTF-8 with no BOM',
    );

    const record = JSON.parse(rawBuf.toString('utf8'));
    assert.ok(record.time && !Number.isNaN(Date.parse(record.time)), `Expected valid ISO time, got ${record.time}`);
    assert.equal(record.oldCommit, oldCommit);
    assert.equal(record.newCommit, newCommit);
    assert.ok(Array.isArray(record.changedServices), 'changedServices must be an array');

    const serializedServices = JSON.stringify(record.changedServices);
    assert.match(serializedServices, /8000/);
    assert.match(serializedServices, /9160/);
    assert.match(serializedServices, /ANTIGRAVITY Mission Control/);
    assert.match(serializedServices, /ANTIGRAVITY T5500 Keepalive/);
  } finally {
    try {
      child.kill('SIGKILL');
    } catch {}
    fs.rmSync(fx.root, { recursive: true, force: true });
  }
});
