import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');
const SCRIPT_PATH = path.join(HERE, 'openclaw-autopull.ps1');
const INSTALL_SCRIPT_PATH = path.join(HERE, 'install-openclaw-autopull.ps1');
const LOCAL_BIND_HOST = ['127', '0', '0', '1'].join('.');
const ALT_LOOPBACK_HOST = ['127', '0', '0', '2'].join('.');

const FORBIDDEN_USERS = ['josh' + 'l', 'josh' + 'i', 'NSFW_' + 'BOTS'];
const HARDCODED_USER_PATH_RE = new RegExp(
  `(?:[A-Za-z]:\\\\+Users\\\\+|/Users/)(?:${FORBIDDEN_USERS.join('|')})\\b`,
  'i',
);

function git(cwd, args) {
  return execFileSync('git', ['-c', 'core.autocrlf=false', ...args], {
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
    [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      SCRIPT_PATH,
      '-RepoPath',
      repoPath,
      ...extraArgs,
    ],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      timeout: 20000,
      windowsHide: true,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0', ...extraEnv },
    },
  );
}

function runAutopullAsync(repoPath, extraArgs = [], extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        SCRIPT_PATH,
        '-RepoPath',
        repoPath,
        ...extraArgs,
      ],
      {
        cwd: REPO_ROOT,
        windowsHide: true,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0', ...extraEnv },
      },
    );
    let stdout = '';
    let stderr = '';
    proc.stdout.setEncoding('utf8');
    proc.stderr.setEncoding('utf8');
    proc.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    proc.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    proc.on('error', reject);
    proc.on('close', (status) => {
      resolve({ status, stdout, stderr });
    });
  });
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, LOCAL_BIND_HOST, () => {
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
      const sock = net.connect({ host: LOCAL_BIND_HOST, port }, () => {
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

test('openclaw-autopull.ps1 does nothing when ops\\t5500\\PAUSE-AUTOPULL exists', { concurrency: true }, async () => {
  const fx = createGitFixture();
  try {
    const oldHead = git(fx.cloneDir, ['rev-parse', 'HEAD']);
    pushUpstreamCommit(fx.seedDir, {
      'domains/youandinotai.com/backend/app/main.py': 'print("v2")\n',
    });

    writeRepoFile(fx.cloneDir, 'ops/t5500/PAUSE-AUTOPULL', 'paused\n');

    const res = await runAutopullAsync(fx.cloneDir, ['-Apply', '-SkipProcessStop']);
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

test(
  'openclaw-autopull.ps1 does nothing when origin/main is not straight ahead of HEAD (equal, behind, or diverged)',
  { concurrency: true },
  async () => {
    const fx = createGitFixture();
    try {
      // 1. Equal: origin/main === HEAD
      const baseHead = git(fx.cloneDir, ['rev-parse', 'HEAD']);
      const equalRes = await runAutopullAsync(fx.cloneDir, ['-Apply', '-SkipProcessStop']);
      assert.equal(equalRes.status, 0, `Expected exit 0 when up-to-date: ${equalRes.stderr}\n${equalRes.stdout}`);
      assert.equal(git(fx.cloneDir, ['rev-parse', 'HEAD']), baseHead);
      assert.equal(fs.existsSync(path.join(fx.cloneDir, 'logs', 'autopull')), false);

      // 2. Ahead locally (origin/main is behind HEAD)
      writeRepoFile(fx.cloneDir, 'local-only.txt', 'local commit\n');
      git(fx.cloneDir, ['add', 'local-only.txt']);
      git(fx.cloneDir, ['commit', '-q', '-m', 'local ahead commit']);
      const localAheadHead = git(fx.cloneDir, ['rev-parse', 'HEAD']);

      const aheadRes = await runAutopullAsync(fx.cloneDir, ['-Apply', '-SkipProcessStop']);
      assert.equal(aheadRes.status, 0, `Expected exit 0 when local is ahead: ${aheadRes.stderr}\n${aheadRes.stdout}`);
      assert.equal(git(fx.cloneDir, ['rev-parse', 'HEAD']), localAheadHead);
      assert.equal(fs.existsSync(path.join(fx.cloneDir, 'logs', 'autopull')), false);

      // 3. Diverged: upstream also has a new commit while local has an unpushed commit
      pushUpstreamCommit(fx.seedDir, {
        'domains/youandinotai.com/backend/app/main.py': 'print("v2-upstream")\n',
      });
      const divergedRes = await runAutopullAsync(fx.cloneDir, ['-Apply', '-SkipProcessStop']);
      assert.equal(
        divergedRes.status,
        0,
        `Expected exit 0 when diverged: ${divergedRes.stderr}\n${divergedRes.stdout}`,
      );
      assert.equal(git(fx.cloneDir, ['rev-parse', 'HEAD']), localAheadHead, 'Diverged HEAD must remain untouched');
      assert.equal(fs.existsSync(path.join(fx.cloneDir, 'logs', 'autopull')), false);
    } finally {
      fs.rmSync(fx.root, { recursive: true, force: true });
    }
  },
);

test(
  'openclaw-autopull.ps1 does nothing when a tracked local change touches a file the pull would change, but allows unrelated tracked changes',
  { concurrency: true },
  async () => {
    const fx = createGitFixture();
    try {
      const oldHead = git(fx.cloneDir, ['rev-parse', 'HEAD']);
      pushUpstreamCommit(fx.seedDir, {
        'domains/youandinotai.com/backend/app/main.py': 'print("v2-from-origin")\n',
      });

      // Dirty tracked file overlapping with incoming pull
      writeRepoFile(fx.cloneDir, 'domains/youandinotai.com/backend/app/main.py', 'print("dirty-local")\n');

      const conflictRes = await runAutopullAsync(fx.cloneDir, ['-Apply', '-SkipProcessStop']);
      assert.equal(
        conflictRes.status,
        0,
        `Expected exit 0 on overlapping local change: ${conflictRes.stderr}\n${conflictRes.stdout}`,
      );
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

      const dryRes = await runAutopullAsync(fx.cloneDir);
      assert.equal(
        dryRes.status,
        0,
        `Expected dry-run exit 0 with unrelated tracked edit: ${dryRes.stderr}\n${dryRes.stdout}`,
      );
      assert.match(dryRes.stdout, /8000/);
      assert.equal(git(fx.cloneDir, ['rev-parse', 'HEAD']), oldHead, 'Dry-run without -Apply must not advance HEAD');
    } finally {
      fs.rmSync(fx.root, { recursive: true, force: true });
    }
  },
);

test(
  'openclaw-autopull.ps1 maps changed paths to services accurately and without -Apply only prints what it would do',
  { concurrency: true },
  async () => {
    // Case A: Frontend-only change -> needs no service restart action
    const fxFrontend = createGitFixture();
    try {
      const oldHead = git(fxFrontend.cloneDir, ['rev-parse', 'HEAD']);
      pushUpstreamCommit(fxFrontend.seedDir, {
        'domains/youandinotai.com/frontend/src/App.tsx': 'export const App = () => "v2";\n',
      });

      const dryFrontend = await runAutopullAsync(fxFrontend.cloneDir);
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

      const dryAll = await runAutopullAsync(fxAll.cloneDir);
      assert.equal(dryAll.status, 0, `All-services dry-run failed: ${dryAll.stderr}\n${dryAll.stdout}`);
      assert.match(dryAll.stdout, /DRY-RUN/i);
      assert.match(dryAll.stdout, /git pull --ff-only/i);
      assert.match(dryAll.stdout, /8000/);
      assert.match(dryAll.stdout, /9160/);
      assert.match(dryAll.stdout, /ANTIGRAVITY Mission Control/);
      assert.match(dryAll.stdout, /ANTIGRAVITY T5500 Keepalive/);
      assert.match(dryAll.stdout, /192\.168\.0\.15/);
      assert.match(dryAll.stdout, /youandinotai\.com/);
      assert.match(dryAll.stdout, /api\.youandinotai\.com\/health/);
      assert.match(dryAll.stdout, /onlinerecycle\.net/);
      assert.match(dryAll.stdout, /shoot-page\.mjs/);
      assert.equal(git(fxAll.cloneDir, ['rev-parse', 'HEAD']), oldHead, 'Without -Apply must not pull');
      assert.notEqual(oldHead, newHead);
      assert.equal(fs.existsSync(path.join(fxAll.cloneDir, 'logs', 'autopull')), false);
    } finally {
      fs.rmSync(fxAll.root, { recursive: true, force: true });
    }
  },
);

test(
  'openclaw-autopull.ps1 with -Apply waits for restarted services on their port, checks public addresses by content, and takes one picture of each changed public page with ops/eyes/shoot-page.mjs into logs\\autopull beside the JSON record',
  { concurrency: true },
  async () => {
    const fx = createGitFixture();
    const backendPort = await getFreePort();
    const domainsPort = await getFreePort();
    const frontendPort = await getFreePort();
    const publicPort = await getFreePort();

    // Stub ops/eyes/shoot-page.mjs in the clone so we verify openclaw-autopull invokes ops/eyes/shoot-page.mjs headlessly into logs\autopull
    const stubShootPage = [
      "import fs from 'node:fs';",
      "import path from 'node:path';",
      'const args = process.argv.slice(2);',
      'const flags = {};',
      'for (let i = 0; i < args.length; i += 1) {',
      "  if (args[i].startsWith('--')) {",
      '    const k = args[i].slice(2);',
      "    const v = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : 'true';",
      '    flags[k] = v;',
      '  }',
      '}',
      "const outDir = flags.out || flags.output || '.';",
      "const name = flags.name || flags.prefix || 'shot';",
      'fs.mkdirSync(outDir, { recursive: true });',
      'const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);',
      'const pngPath = path.join(outDir, `${name}.png`);',
      'fs.writeFileSync(pngPath, pngHeader);',
      'console.log(JSON.stringify({ picture: pngPath, url: flags.url || flags.route || "" }));',
    ].join('\n');
    writeRepoFile(fx.seedDir, 'ops/eyes/shoot-page.mjs', stubShootPage);
    git(fx.seedDir, ['add', '.']);
    git(fx.seedDir, ['commit', '-q', '-m', 'add shoot-page stub']);
    git(fx.seedDir, ['push', '-q', 'origin', 'main']);
    git(fx.cloneDir, ['pull', '-q', '--ff-only', 'origin', 'main']);

    // Start a real hidden Node child process owning backendPort so -Apply stops it
    const oldOwner = spawn(
      process.execPath,
      [
        '-e',
        `const net = require('node:net'); const s = net.createServer(); s.listen(${backendPort}, '${LOCAL_BIND_HOST}', () => {}); setInterval(() => {}, 1000);`,
      ],
      {
        stdio: 'ignore',
        windowsHide: true,
      },
    );

    const replacementServers = [];
    const publicServer = http.createServer((req, res) => {
      const u = req.url || '/';
      if (u.startsWith('/public/youandinotai')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', Connection: 'close' });
        res.end(
          '<!DOCTYPE html><html><head><script src="/assets/index-live2.js"></script></head><body>YouAndINotAI</body></html>',
        );
        return;
      }
      if (u.startsWith('/public/api-health')) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', Connection: 'close' });
        res.end(JSON.stringify({ status: 'ok', db_connected: true }));
        return;
      }
      if (u.startsWith('/public/onlinerecycle/health')) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', Connection: 'close' });
        res.end(
          JSON.stringify({
            service: 'domains-server',
            sites: ['dream-online.net', 'untilnokidinneed.com', 'onlinerecycle.net'],
            nodeLight: 'green',
            missingEnvCount: 0,
            bookingNotices: 'on',
            bookingNoticesStatus: 'booking notices: on',
            unnotifiedBookings: 0,
          }),
        );
        return;
      }
      if (u.startsWith('/public/onlinerecycle')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', Connection: 'close' });
        res.end('<!DOCTYPE html><html><body>OnlineRecycle electronics pickup</body></html>');
        return;
      }
      res.writeHead(404, { Connection: 'close' });
      res.end('not found');
    });

    await new Promise((resolve) => publicServer.listen(publicPort, LOCAL_BIND_HOST, resolve));

    const replacementChildren = [];
    // When oldOwner exits (killed by openclaw-autopull.ps1), simulate keepalive bringing backendPort, domainsPort, and frontendPort back after 250ms in new child processes
    oldOwner.on('exit', () => {
      setTimeout(() => {
        for (const [port, body] of [
          [backendPort, JSON.stringify({ status: 'ok', db_connected: true })],
          [domainsPort, JSON.stringify({ status: 'ok', service: 'domains-server' })],
          [frontendPort, '<!DOCTYPE html><html><script src="/assets/index-live2.js"></script></html>'],
        ]) {
          const child = spawn(
            process.execPath,
            [
              '-e',
              `const http = require('node:http'); const body = ${JSON.stringify(body)}; const srv = http.createServer((_req, res) => { res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', Connection: 'close' }); res.end(body); }); srv.listen(${port}, '${LOCAL_BIND_HOST}'); setInterval(() => {}, 1000);`,
            ],
            { stdio: 'ignore', windowsHide: true },
          );
          replacementChildren.push(child);
        }
      }, 250);
    });

    try {
      await waitForPortListen(backendPort);

      const oldCommit = git(fx.cloneDir, ['rev-parse', 'HEAD']);
      const newCommit = pushUpstreamCommit(fx.seedDir, {
        'domains/youandinotai.com/backend/app/main.py': 'print("v2-live")\n',
        'domains/youandinotai.com/frontend/src/App.tsx': 'export const App = () => "v2-live";\n',
        'domains/onlinerecycle.net/index.html': '<html>OnlineRecycle v2-live</html>\n',
      });

      const publicBase = `http://${LOCAL_BIND_HOST}:${publicPort}`;
      const applyRes = await runAutopullAsync(fx.cloneDir, [
        '-Apply',
        '-NodeHost',
        LOCAL_BIND_HOST,
        '-BackendPort',
        String(backendPort),
        '-DomainsPort',
        String(domainsPort),
        '-FrontendPort',
        String(frontendPort),
        '-PublicWebUrl',
        `${publicBase}/public/youandinotai`,
        '-PublicApiHealthUrl',
        `${publicBase}/public/api-health`,
        '-PublicRecycleUrl',
        `${publicBase}/public/onlinerecycle`,
        '-WaitTimeoutSeconds',
        '10',
        '-PollIntervalMs',
        '150',
      ]);
      assert.equal(applyRes.status, 0, `-Apply failed (${applyRes.status}): ${applyRes.stderr}\n${applyRes.stdout}`);

      const currentHead = git(fx.cloneDir, ['rev-parse', 'HEAD']);
      assert.equal(currentHead, newCommit, 'HEAD must advance to origin/main after -Apply');

      // PAUSE-AUTOPULL must NOT exist when services came back and passed public content checks
      assert.equal(
        fs.existsSync(path.join(fx.cloneDir, 'ops', 't5500', 'PAUSE-AUTOPULL')),
        false,
        'PAUSE-AUTOPULL must not be created when all services and public checks pass',
      );

      const logDir = path.join(fx.cloneDir, 'logs', 'autopull');
      assert.ok(fs.existsSync(logDir), 'logs\\autopull directory must exist after -Apply');
      const files = fs.readdirSync(logDir);
      const records = files.filter((f) => f.endsWith('.json'));
      const pictures = files.filter((f) => f.endsWith('.png'));

      assert.equal(records.length, 1, `Expected 1 JSON record under logs\\autopull, found ${JSON.stringify(records)}`);
      assert.equal(
        pictures.length,
        2,
        `Expected 2 PNG pictures (one for youandinotai.com, one for onlinerecycle.net) beside the JSON record, found ${JSON.stringify(pictures)}`,
      );

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
      assert.equal(record.status, 'LIVE');
      assert.ok(Array.isArray(record.changedServices), 'changedServices must be an array');
      assert.ok(Array.isArray(record.publicChecks), 'publicChecks must be an array');
      assert.equal(
        record.publicChecks.every((c) => c.passed === true),
        true,
        'All public content checks must pass',
      );
    } finally {
      try {
        oldOwner.kill('SIGKILL');
      } catch {}
      for (const c of replacementChildren) {
        try {
          c.kill('SIGKILL');
        } catch {}
      }
      for (const s of replacementServers) {
        try {
          s.closeAllConnections?.();
          s.close();
        } catch {}
      }
      try {
        publicServer.closeAllConnections?.();
        publicServer.close();
      } catch {}
      fs.rmSync(fx.root, { recursive: true, force: true });
    }
  },
);

test(
  'openclaw-autopull.ps1 writes FAILED in the record, creates ops\\t5500\\PAUSE-AUTOPULL, and does not roll back code when a service does not come back',
  { concurrency: true },
  async () => {
    const fx = createGitFixture();
    const deadPort = await getFreePort();

    try {
      const oldCommit = git(fx.cloneDir, ['rev-parse', 'HEAD']);
      const newCommit = pushUpstreamCommit(fx.seedDir, {
        'domains/youandinotai.com/backend/app/main.py': 'print("v2-broken-startup")\n',
      });

      const applyRes = await runAutopullAsync(fx.cloneDir, [
        '-Apply',
        '-SkipProcessStop',
        '-NodeHost',
        LOCAL_BIND_HOST,
        '-BackendPort',
        String(deadPort),
        '-PublicApiHealthUrl',
        `http://${LOCAL_BIND_HOST}:${deadPort}/health`,
        '-WaitTimeoutSeconds',
        '1',
        '-PollIntervalMs',
        '200',
      ]);

      // Code must NOT be rolled back by itself
      const currentHead = git(fx.cloneDir, ['rev-parse', 'HEAD']);
      assert.equal(currentHead, newCommit, 'openclaw-autopull.ps1 must NOT roll back code by itself on failure');
      assert.notEqual(currentHead, oldCommit);

      // ops\t5500\PAUSE-AUTOPULL must be created so the next pass does not make it worse
      const pausePath = path.join(fx.cloneDir, 'ops', 't5500', 'PAUSE-AUTOPULL');
      assert.equal(
        fs.existsSync(pausePath),
        true,
        'ops\\t5500\\PAUSE-AUTOPULL must be created when a service fails to come back',
      );

      // Record in logs\autopull must contain FAILED
      const logDir = path.join(fx.cloneDir, 'logs', 'autopull');
      assert.ok(fs.existsSync(logDir), 'logs\\autopull directory must exist after failed -Apply');
      const records = fs.readdirSync(logDir).filter((f) => f.endsWith('.json'));
      assert.equal(records.length, 1, `Expected 1 JSON record under logs\\autopull, found ${JSON.stringify(records)}`);

      const recordRaw = fs.readFileSync(path.join(logDir, records[0]), 'utf8');
      assert.match(recordRaw, /FAILED/, 'JSON record must contain FAILED');
      const record = JSON.parse(recordRaw);
      assert.equal(record.status, 'FAILED');
      assert.equal(record.oldCommit, oldCommit);
      assert.equal(record.newCommit, newCommit);
      assert.match(`${applyRes.stdout}\n${applyRes.stderr}`, /FAILED/i);
    } finally {
      fs.rmSync(fx.root, { recursive: true, force: true });
    }
  },
);

test(
  'install-openclaw-autopull.ps1 prints the hourly scheduled task "ANTIGRAVITY OpenClaw Autopull" by default and registers only with -Apply',
  { concurrency: true },
  () => {
    assert.ok(fs.existsSync(INSTALL_SCRIPT_PATH), 'ops/t5500/install-openclaw-autopull.ps1 must exist');
    const rawBytes = fs.readFileSync(INSTALL_SCRIPT_PATH);
    assert.equal(
      rawBytes[0] === 0xef && rawBytes[1] === 0xbb && rawBytes[2] === 0xbf,
      false,
      'install-openclaw-autopull.ps1 must be UTF-8 without BOM',
    );

    const src = rawBytes.toString('utf8');
    assert.doesNotMatch(src, /\bWrite-Host\b/i, 'Installer must never use Write-Host');
    assert.doesNotMatch(src, /\bRead-Host\b/i, 'Installer must never prompt for interactive input');
    assert.doesNotMatch(src, HARDCODED_USER_PATH_RE, 'Installer must not contain hardcoded user folder names');
    assert.match(src, /ANTIGRAVITY OpenClaw Autopull/, 'Installer must define task name ANTIGRAVITY OpenClaw Autopull');

    const dryRes = spawnSync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', INSTALL_SCRIPT_PATH],
      {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        timeout: 15000,
        windowsHide: true,
      },
    );
    assert.equal(dryRes.status, 0, `Installer dry-run failed (${dryRes.status}): ${dryRes.stderr}\n${dryRes.stdout}`);
    assert.match(dryRes.stdout, /ANTIGRAVITY OpenClaw Autopull/);
    assert.match(dryRes.stdout, /DRY-RUN/i);
    assert.match(dryRes.stdout, /openclaw-autopull\.ps1/);
    assert.match(dryRes.stdout, /New-TimeSpan\s+-Hours\s+1|hourly/i);
    assert.match(dryRes.stdout, /New-ScheduledTaskPrincipal/);
    assert.match(dryRes.stdout, /-RunLevel\s+Highest/);
    assert.match(dryRes.stdout, /ANTIGRAVITY T5500 Keepalive/);
    assert.match(dryRes.stdout, /Register-ScheduledTask[\s\S]*?-Principal/);
  },
);

test(
  'openclaw-autopull.ps1 tries NodeHost then 127.0.0.1 on the same port, records which address answered, checks api.youandinotai.com/health for status, and records merged pull request numbers between oldCommit and newCommit',
  { concurrency: true },
  async () => {
    const fx = createGitFixture();
    const backendPort = await getFreePort();
    const publicPort = await getFreePort();

    // Listen ONLY on 127.0.0.1 (LOCAL_BIND_HOST), NOT on ALT_LOOPBACK_HOST (simulating a service bound only to 127.0.0.1 while NodeHost is 192.168.0.15)
    const localApiServer = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', Connection: 'close' });
      res.end(JSON.stringify({ status: 'listening-on-loopback-only' }));
    });
    const publicServer = http.createServer((req, res) => {
      if ((req.url || '').startsWith('/health')) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', Connection: 'close' });
        // Contains 'status', intentionally omits 'ok' and 'db_connected' to prove expectedContent is 'status'
        res.end(JSON.stringify({ status: 'healthy' }));
        return;
      }
      res.writeHead(404, { Connection: 'close' });
      res.end('not found');
    });

    await new Promise((resolve) => localApiServer.listen(backendPort, LOCAL_BIND_HOST, resolve));
    await new Promise((resolve) => publicServer.listen(publicPort, LOCAL_BIND_HOST, resolve));

    try {
      const oldCommit = git(fx.cloneDir, ['rev-parse', 'HEAD']);
      pushUpstreamCommit(
        fx.seedDir,
        { 'domains/youandinotai.com/backend/app/main.py': 'print("v2-pr-481")\n' },
        '[2026-11-20] Date app API route update, by Gemini 4 Argon (High) (#481)',
      );
      const newCommit = pushUpstreamCommit(
        fx.seedDir,
        { 'domains/youandinotai.com/backend/app/main.py': 'print("v3-pr-482")\n' },
        'Merge pull request #482 from Trollz1004/ai/inbox/api-tune',
      );

      const applyRes = await runAutopullAsync(fx.cloneDir, [
        '-Apply',
        '-SkipProcessStop',
        '-NodeHost',
        ALT_LOOPBACK_HOST,
        '-BackendPort',
        String(backendPort),
        '-PublicApiHealthUrl',
        `http://${LOCAL_BIND_HOST}:${publicPort}/health`,
        '-WaitTimeoutSeconds',
        '2',
        '-PollIntervalMs',
        '100',
      ]);

      assert.equal(
        applyRes.status,
        0,
        `Expected exit 0 when 127.0.0.1 fallback and public health pass, got ${applyRes.status}: ${applyRes.stderr}\n${applyRes.stdout}`,
      );
      assert.equal(
        fs.existsSync(path.join(fx.cloneDir, 'ops', 't5500', 'PAUSE-AUTOPULL')),
        false,
        'PAUSE-AUTOPULL must not exist when fallback port and public check pass',
      );

      const logDir = path.join(fx.cloneDir, 'logs', 'autopull');
      const records = fs.readdirSync(logDir).filter((f) => f.endsWith('.json'));
      assert.equal(records.length, 1);
      const record = JSON.parse(fs.readFileSync(path.join(logDir, records[0]), 'utf8'));

      assert.equal(record.status, 'LIVE');
      assert.equal(record.oldCommit, oldCommit);
      assert.equal(record.newCommit, newCommit);
      assert.deepEqual(
        record.pullRequests,
        [481, 482],
        'JSON record must list merged PR numbers between oldCommit and newCommit',
      );

      const apiSvc = record.changedServices.find((s) => s.service === 'date-app-api');
      assert.ok(apiSvc, 'date-app-api must be present in changedServices');
      assert.equal(apiSvc.portAnswered, true);
      assert.equal(
        apiSvc.portHost,
        LOCAL_BIND_HOST,
        'portHost must record the host that actually answered (127.0.0.1)',
      );
      assert.equal(apiSvc.answeredHost, LOCAL_BIND_HOST, 'answeredHost must record 127.0.0.1');
      assert.equal(
        apiSvc.answeredAddress,
        `${LOCAL_BIND_HOST}:${backendPort}`,
        'answeredAddress must record 127.0.0.1:<port>',
      );
      assert.equal(apiSvc.expectedContent, 'status', 'date-app-api public check expectedContent must be status');
      assert.equal(apiSvc.publicCheckPassed, true);
    } finally {
      try {
        localApiServer.closeAllConnections?.();
        localApiServer.close();
      } catch {}
      try {
        publicServer.closeAllConnections?.();
        publicServer.close();
      } catch {}
      fs.rmSync(fx.root, { recursive: true, force: true });
    }
  },
);

test(
  'openclaw-autopull.ps1 writes FAILED and PAUSE-AUTOPULL only when both the local check and the public check fail',
  { concurrency: true },
  async () => {
    // Case 1: Local check fails (neither NodeHost nor 127.0.0.1 answers), but public content check passes -> LIVE, no PAUSE-AUTOPULL
    const fxPublicOnly = createGitFixture();
    const deadLocalPort = await getFreePort();
    const publicPort = await getFreePort();
    const publicServer = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', Connection: 'close' });
      res.end(JSON.stringify({ status: 'ok' }));
    });
    await new Promise((resolve) => publicServer.listen(publicPort, LOCAL_BIND_HOST, resolve));

    try {
      pushUpstreamCommit(
        fxPublicOnly.seedDir,
        { 'domains/youandinotai.com/backend/app/main.py': 'print("v2-public-ok")\n' },
        'Fix API health (#490)',
      );

      const resPubOnly = await runAutopullAsync(fxPublicOnly.cloneDir, [
        '-Apply',
        '-SkipProcessStop',
        '-NodeHost',
        ALT_LOOPBACK_HOST,
        '-BackendPort',
        String(deadLocalPort),
        '-PublicApiHealthUrl',
        `http://${LOCAL_BIND_HOST}:${publicPort}/health`,
        '-WaitTimeoutSeconds',
        '1',
        '-PollIntervalMs',
        '150',
      ]);

      assert.equal(
        resPubOnly.status,
        0,
        `Expected LIVE (exit 0) when public check passes even if local check fails, got ${resPubOnly.status}: ${resPubOnly.stdout}`,
      );
      assert.equal(
        fs.existsSync(path.join(fxPublicOnly.cloneDir, 'ops', 't5500', 'PAUSE-AUTOPULL')),
        false,
        'PAUSE-AUTOPULL must not be written when public check passes',
      );
      const logDir1 = path.join(fxPublicOnly.cloneDir, 'logs', 'autopull');
      const rec1 = JSON.parse(
        fs.readFileSync(
          path.join(
            logDir1,
            fs.readdirSync(logDir1).find((f) => f.endsWith('.json')),
          ),
          'utf8',
        ),
      );
      assert.equal(rec1.status, 'LIVE');
      assert.equal(rec1.pausedAutopull, false);
      assert.deepEqual(rec1.pullRequests, [490]);
      assert.equal(rec1.changedServices[0].portAnswered, false);
      assert.equal(rec1.changedServices[0].publicCheckPassed, true);
      assert.equal(rec1.changedServices[0].status, 'LIVE');
    } finally {
      try {
        publicServer.closeAllConnections?.();
        publicServer.close();
      } catch {}
      fs.rmSync(fxPublicOnly.root, { recursive: true, force: true });
    }

    // Case 2: Local check passes (127.0.0.1 answers), but public check fails -> LIVE, no PAUSE-AUTOPULL
    const fxLocalOnly = createGitFixture();
    const liveLocalPort = await getFreePort();
    const deadPublicPort = await getFreePort();
    const localServer = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', Connection: 'close' });
      res.end(JSON.stringify({ status: 'ok' }));
    });
    await new Promise((resolve) => localServer.listen(liveLocalPort, LOCAL_BIND_HOST, resolve));

    try {
      pushUpstreamCommit(
        fxLocalOnly.seedDir,
        { 'domains/youandinotai.com/backend/app/main.py': 'print("v2-local-ok")\n' },
        'Fix API local (#491)',
      );

      const resLocalOnly = await runAutopullAsync(fxLocalOnly.cloneDir, [
        '-Apply',
        '-SkipProcessStop',
        '-NodeHost',
        ALT_LOOPBACK_HOST,
        '-BackendPort',
        String(liveLocalPort),
        '-PublicApiHealthUrl',
        `http://${LOCAL_BIND_HOST}:${deadPublicPort}/health`,
        '-WaitTimeoutSeconds',
        '1',
        '-PollIntervalMs',
        '150',
      ]);

      assert.equal(
        resLocalOnly.status,
        0,
        `Expected LIVE (exit 0) when local check passes even if public check fails, got ${resLocalOnly.status}: ${resLocalOnly.stdout}`,
      );
      assert.equal(
        fs.existsSync(path.join(fxLocalOnly.cloneDir, 'ops', 't5500', 'PAUSE-AUTOPULL')),
        false,
        'PAUSE-AUTOPULL must not be written when local check passes',
      );
      const logDir2 = path.join(fxLocalOnly.cloneDir, 'logs', 'autopull');
      const rec2 = JSON.parse(
        fs.readFileSync(
          path.join(
            logDir2,
            fs.readdirSync(logDir2).find((f) => f.endsWith('.json')),
          ),
          'utf8',
        ),
      );
      assert.equal(rec2.status, 'LIVE');
      assert.equal(rec2.pausedAutopull, false);
      assert.deepEqual(rec2.pullRequests, [491]);
      assert.equal(rec2.changedServices[0].portAnswered, true);
      assert.equal(rec2.changedServices[0].answeredHost, LOCAL_BIND_HOST);
      assert.equal(rec2.changedServices[0].publicCheckPassed, false);
      assert.equal(rec2.changedServices[0].status, 'LIVE');
    } finally {
      try {
        localServer.closeAllConnections?.();
        localServer.close();
      } catch {}
      fs.rmSync(fxLocalOnly.root, { recursive: true, force: true });
    }
  },
);

test(
  'openclaw-autopull.ps1 records port owner pid and start time before and after, and counts a restart only when the id changed and the new start time is after the pull',
  { concurrency: true },
  async () => {
    const fx = createGitFixture();
    const domainsPort = await getFreePort();
    const publicPort = await getFreePort();

    const oldOwner = spawn(
      process.execPath,
      [
        '-e',
        `const http = require('node:http'); const srv = http.createServer((_req, res) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ service: 'domains-server' })); }); srv.listen(${domainsPort}, '${LOCAL_BIND_HOST}'); setInterval(() => {}, 1000);`,
      ],
      { stdio: 'ignore', windowsHide: true },
    );

    const publicServer = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', Connection: 'close' });
      res.end(
        JSON.stringify({
          service: 'domains-server',
          sites: ['dream-online.net', 'untilnokidinneed.com', 'onlinerecycle.net'],
          nodeLight: 'green',
          missingEnvCount: 0,
          bookingNotices: 'on',
          bookingNoticesStatus: 'booking notices: on',
          unnotifiedBookings: 0,
        }),
      );
    });
    await new Promise((resolve) => publicServer.listen(publicPort, LOCAL_BIND_HOST, resolve));

    let newOwner = null;
    oldOwner.on('exit', () => {
      setTimeout(() => {
        newOwner = spawn(
          process.execPath,
          [
            '-e',
            `const http = require('node:http'); const srv = http.createServer((_req, res) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ service: 'domains-server', restarted: true })); }); srv.listen(${domainsPort}, '${LOCAL_BIND_HOST}'); setInterval(() => {}, 1000);`,
          ],
          { stdio: 'ignore', windowsHide: true },
        );
      }, 200);
    });

    // Pre-spawn a process BEFORE the second pull that waits to bind domainsPort until newOwner exits,
    // proving that a PID change whose process start time is BEFORE the pull does NOT count as a restart.
    let prePullSpawnedOwner = null;

    try {
      await waitForPortListen(domainsPort);
      // Ensure oldOwner start time is clearly before the pull
      await new Promise((r) => setTimeout(r, 250));

      pushUpstreamCommit(
        fx.seedDir,
        { 'ops/domains-server/server.mjs': 'export const v = 2;\n' },
        'Update domains-server (#501)',
      );

      const res = await runAutopullAsync(fx.cloneDir, [
        '-Apply',
        '-NodeHost',
        LOCAL_BIND_HOST,
        '-DomainsPort',
        String(domainsPort),
        '-PublicRecycleUrl',
        `http://${LOCAL_BIND_HOST}:${publicPort}/public/onlinerecycle`,
        '-WaitTimeoutSeconds',
        '6',
        '-PollIntervalMs',
        '100',
      ]);

      assert.equal(res.status, 0, `Expected exit 0 on proven restart: ${res.stderr}\n${res.stdout}`);
      const logDir = path.join(fx.cloneDir, 'logs', 'autopull');
      const recFile = fs.readdirSync(logDir).find((f) => f.endsWith('.json'));
      const record = JSON.parse(fs.readFileSync(path.join(logDir, recFile), 'utf8'));

      assert.equal(record.status, 'LIVE');
      const domSvc = record.changedServices.find((s) => s.service === 'domains-server');
      assert.ok(domSvc, 'domains-server must be in changedServices');
      assert.equal(domSvc.beforePid, oldOwner.pid, 'beforePid must record the pre-pull process id');
      assert.ok(
        domSvc.beforeStartTime && !Number.isNaN(Date.parse(domSvc.beforeStartTime)),
        `beforeStartTime must be a valid ISO timestamp, got ${domSvc.beforeStartTime}`,
      );
      assert.ok(newOwner && newOwner.pid, 'newOwner child process must have started');
      assert.equal(domSvc.afterPid, newOwner.pid, 'afterPid must record the post-pull process id');
      assert.notEqual(domSvc.afterPid, domSvc.beforePid, 'afterPid must differ from beforePid');
      assert.ok(
        domSvc.afterStartTime && !Number.isNaN(Date.parse(domSvc.afterStartTime)),
        `afterStartTime must be a valid ISO timestamp, got ${domSvc.afterStartTime}`,
      );
      assert.ok(
        Date.parse(domSvc.afterStartTime) > Date.parse(domSvc.beforeStartTime),
        `afterStartTime (${domSvc.afterStartTime}) must be after beforeStartTime (${domSvc.beforeStartTime})`,
      );
      assert.ok(
        domSvc.pullTime && Date.parse(domSvc.afterStartTime) > Date.parse(domSvc.pullTime),
        `afterStartTime (${domSvc.afterStartTime}) must be after pullTime (${domSvc.pullTime})`,
      );
      assert.equal(domSvc.restarted, true, 'restarted must be true when pid changed and start time is after pull');
      assert.equal(domSvc.status, 'LIVE');

      // Case 2: A process started BEFORE the pull takes over the port after newOwner is stopped ->
      // pid changed, but afterStartTime is before pullTime, so restarted must be false and status FAILED-TO-RESTART
      prePullSpawnedOwner = spawn(
        process.execPath,
        [
          '-e',
          `const http = require('node:http'); const srv = http.createServer((_req, res) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ service: 'domains-server' })); }); const tryListen = () => { srv.listen(${domainsPort}, '${LOCAL_BIND_HOST}'); }; srv.on('error', () => setTimeout(tryListen, 80)); setTimeout(tryListen, 80); setInterval(() => {}, 1000);`,
        ],
        { stdio: 'ignore', windowsHide: true },
      );
      await new Promise((r) => setTimeout(r, 300));

      pushUpstreamCommit(
        fx.seedDir,
        { 'ops/domains-server/server.mjs': 'export const v = 3;\n' },
        'Update domains-server pre-started (#505)',
      );

      const resPreStarted = await runAutopullAsync(fx.cloneDir, [
        '-Apply',
        '-NodeHost',
        LOCAL_BIND_HOST,
        '-DomainsPort',
        String(domainsPort),
        '-PublicRecycleUrl',
        `http://${LOCAL_BIND_HOST}:${publicPort}/public/onlinerecycle`,
        '-WaitTimeoutSeconds',
        '4',
        '-PollIntervalMs',
        '100',
      ]);

      assert.equal(resPreStarted.status, 0);
      assert.equal(fs.existsSync(path.join(fx.cloneDir, 'ops', 't5500', 'PAUSE-AUTOPULL')), false);
      const recordsAll = fs
        .readdirSync(logDir)
        .filter((f) => f.endsWith('.json'))
        .sort();
      const record2 = JSON.parse(fs.readFileSync(path.join(logDir, recordsAll[recordsAll.length - 1]), 'utf8'));
      const domSvc2 = record2.changedServices.find((s) => s.service === 'domains-server');
      assert.equal(domSvc2.beforePid, newOwner.pid);
      assert.equal(domSvc2.afterPid, prePullSpawnedOwner.pid);
      assert.notEqual(domSvc2.afterPid, domSvc2.beforePid, 'pid changed to prePullSpawnedOwner');
      assert.ok(
        Date.parse(domSvc2.afterStartTime) <= Date.parse(domSvc2.pullTime),
        `Expected pre-started owner afterStartTime (${domSvc2.afterStartTime}) <= pullTime (${domSvc2.pullTime})`,
      );
      assert.equal(domSvc2.restarted, false, 'restarted must be false when new owner started before the pull');
      assert.equal(domSvc2.status, 'FAILED-TO-RESTART');
      assert.equal(record2.status, 'FAILED-TO-RESTART');
    } finally {
      try {
        oldOwner.kill('SIGKILL');
      } catch {}
      try {
        newOwner?.kill('SIGKILL');
      } catch {}
      try {
        prePullSpawnedOwner?.kill('SIGKILL');
      } catch {}
      try {
        publicServer.closeAllConnections?.();
        publicServer.close();
      } catch {}
      fs.rmSync(fx.root, { recursive: true, force: true });
    }
  },
);

test(
  'openclaw-autopull.ps1 records "restart refused: access denied" and marks the service FAILED-TO-RESTART (not LIVE) without pausing when Stop-Process is refused',
  { concurrency: true },
  async () => {
    const fx = createGitFixture();
    const domainsPort = await getFreePort();
    const publicPort = await getFreePort();

    const sessionZeroOwner = spawn(
      process.execPath,
      [
        '-e',
        `const http = require('node:http'); const srv = http.createServer((_req, res) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ service: 'domains-server', oldCode: true })); }); srv.listen(${domainsPort}, '${LOCAL_BIND_HOST}'); setInterval(() => {}, 1000);`,
      ],
      { stdio: 'ignore', windowsHide: true },
    );

    const publicServer = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', Connection: 'close' });
      res.end(
        JSON.stringify({
          service: 'domains-server',
          sites: ['dream-online.net', 'untilnokidinneed.com', 'onlinerecycle.net'],
          nodeLight: 'green',
          missingEnvCount: 0,
          bookingNotices: 'on',
          bookingNoticesStatus: 'booking notices: on',
          unnotifiedBookings: 0,
        }),
      );
    });
    await new Promise((resolve) => publicServer.listen(publicPort, LOCAL_BIND_HOST, resolve));

    try {
      await waitForPortListen(domainsPort);

      pushUpstreamCommit(
        fx.seedDir,
        { 'ops/domains-server/server.mjs': 'export const v = 3;\n' },
        'Update domains-server (#502)',
      );

      const res = await runAutopullAsync(fx.cloneDir, [
        '-Apply',
        '-SimulateStopAccessDenied',
        '-NodeHost',
        LOCAL_BIND_HOST,
        '-DomainsPort',
        String(domainsPort),
        '-PublicRecycleUrl',
        `http://${LOCAL_BIND_HOST}:${publicPort}/public/onlinerecycle`,
        '-WaitTimeoutSeconds',
        '3',
        '-PollIntervalMs',
        '150',
      ]);

      assert.match(res.stdout, /restart refused:\s*access denied/i);
      assert.equal(
        fs.existsSync(path.join(fx.cloneDir, 'ops', 't5500', 'PAUSE-AUTOPULL')),
        false,
        'PAUSE-AUTOPULL must NOT be created when Stop-Process is refused with access denied',
      );

      const logDir = path.join(fx.cloneDir, 'logs', 'autopull');
      const recFile = fs.readdirSync(logDir).find((f) => f.endsWith('.json'));
      const record = JSON.parse(fs.readFileSync(path.join(logDir, recFile), 'utf8'));

      assert.equal(record.pausedAutopull, false, 'pausedAutopull must be false');
      assert.notEqual(record.status, 'LIVE', 'Overall status must not be LIVE when restart was refused');
      assert.equal(record.status, 'FAILED-TO-RESTART');

      const domSvc = record.changedServices.find((s) => s.service === 'domains-server');
      assert.ok(domSvc, 'domains-server must be in changedServices');
      assert.equal(domSvc.beforePid, sessionZeroOwner.pid, 'beforePid must match unstopped owner pid');
      assert.equal(domSvc.afterPid, sessionZeroOwner.pid, 'afterPid must still match unstopped owner pid');
      assert.ok(domSvc.beforeStartTime, 'beforeStartTime must be recorded');
      assert.ok(domSvc.afterStartTime, 'afterStartTime must be recorded');
      assert.equal(domSvc.restarted, false, 'restarted must be false');
      assert.match(String(domSvc.restartNote || domSvc.restartError || ''), /restart refused:\s*access denied/i);
      assert.equal(domSvc.status, 'FAILED-TO-RESTART', 'Service status must be FAILED-TO-RESTART, not LIVE');
    } finally {
      try {
        sessionZeroOwner.kill('SIGKILL');
      } catch {}
      try {
        publicServer.closeAllConnections?.();
        publicServer.close();
      } catch {}
      fs.rmSync(fx.root, { recursive: true, force: true });
    }
  },
);

test(
  'openclaw-autopull.ps1 public content check for domains-server reads /health and requires the commit-specific field list or a build stamp, rejecting plain HTML or stale /health payloads',
  { concurrency: true },
  async () => {
    // 1. Plain HTML or old pre-notices /health JSON must fail publicCheckPassed
    const fxStale = createGitFixture();
    const deadLocalPort = await getFreePort();
    const publicPort = await getFreePort();
    let healthMode = 'old-health';
    let currentTargetCommit = '';

    const publicServer = http.createServer((req, res) => {
      const u = req.url || '/';
      if (u.endsWith('/health')) {
        if (healthMode === 'html') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', Connection: 'close' });
          res.end('<!DOCTYPE html><html><body>OnlineRecycle electronics pickup</body></html>');
          return;
        }
        if (healthMode === 'old-health') {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', Connection: 'close' });
          res.end(
            JSON.stringify({
              status: 'ok',
              service: 'domains-server',
              sites: ['dream-online.net', 'untilnokidinneed.com', 'onlinerecycle.net'],
            }),
          );
          return;
        }
        if (healthMode === 'build-stamp') {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', Connection: 'close' });
          res.end(
            JSON.stringify({
              service: 'domains-server',
              buildStamp: currentTargetCommit,
            }),
          );
          return;
        }
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', Connection: 'close' });
      res.end('<!DOCTYPE html><html><body>OnlineRecycle homepage only</body></html>');
    });
    await new Promise((resolve) => publicServer.listen(publicPort, LOCAL_BIND_HOST, resolve));

    try {
      pushUpstreamCommit(
        fxStale.seedDir,
        { 'domains/onlinerecycle.net/index.html': '<html>v2</html>\n' },
        'OnlineRecycle update (#503)',
      );

      const resOldHealth = await runAutopullAsync(fxStale.cloneDir, [
        '-Apply',
        '-SkipProcessStop',
        '-NodeHost',
        ALT_LOOPBACK_HOST,
        '-DomainsPort',
        String(deadLocalPort),
        '-PublicRecycleUrl',
        `http://${LOCAL_BIND_HOST}:${publicPort}/public/onlinerecycle`,
        '-WaitTimeoutSeconds',
        '1',
        '-PollIntervalMs',
        '150',
      ]);

      // Both local (deadLocalPort) and public (stale /health missing commit-specific fields and buildStamp) must fail
      assert.notEqual(
        resOldHealth.status,
        0,
        'Expected non-zero exit when both local and stale /health public check fail',
      );
      const logDir1 = path.join(fxStale.cloneDir, 'logs', 'autopull');
      const rec1 = JSON.parse(
        fs.readFileSync(
          path.join(
            logDir1,
            fs.readdirSync(logDir1).find((f) => f.endsWith('.json')),
          ),
          'utf8',
        ),
      );
      const domSvc1 = rec1.changedServices.find((s) => s.service === 'domains-server');
      assert.ok(domSvc1);
      assert.match(domSvc1.publicUrl, /\/health$/);
      assert.equal(domSvc1.publicCheckPassed, false, 'Stale /health payload missing commit-specific fields must fail');

      // 2. When /health returns a buildStamp matching newCommit, publicCheckPassed must pass
      fs.rmSync(path.join(fxStale.cloneDir, 'ops', 't5500', 'PAUSE-AUTOPULL'), { force: true });
      healthMode = 'build-stamp';
      currentTargetCommit = pushUpstreamCommit(
        fxStale.seedDir,
        { 'domains/onlinerecycle.net/index.html': '<html>v3</html>\n' },
        'OnlineRecycle build stamp (#504)',
      );

      const resStamp = await runAutopullAsync(fxStale.cloneDir, [
        '-Apply',
        '-SkipProcessStop',
        '-NodeHost',
        ALT_LOOPBACK_HOST,
        '-DomainsPort',
        String(deadLocalPort),
        '-PublicRecycleUrl',
        `http://${LOCAL_BIND_HOST}:${publicPort}/public/onlinerecycle`,
        '-WaitTimeoutSeconds',
        '2',
        '-PollIntervalMs',
        '150',
      ]);
      assert.equal(resStamp.status, 0, `Expected pass when /health has matching buildStamp: ${resStamp.stdout}`);
      const records2 = fs
        .readdirSync(logDir1)
        .filter((f) => f.endsWith('.json'))
        .sort();
      const rec2 = JSON.parse(fs.readFileSync(path.join(logDir1, records2[records2.length - 1]), 'utf8'));
      const domSvc2 = rec2.changedServices.find((s) => s.service === 'domains-server');
      assert.equal(domSvc2.publicCheckPassed, true, '/health with matching buildStamp must pass');
    } finally {
      try {
        publicServer.closeAllConnections?.();
        publicServer.close();
      } catch {}
      fs.rmSync(fxStale.root, { recursive: true, force: true });
    }
  },
);
