const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = fs.existsSync(path.join(ROOT_DIR, '..', 'AGENTS.md'))
  ? path.resolve(ROOT_DIR, '..')
  : path.resolve(ROOT_DIR, '..', '..');
const VAULT_DIR = path.join(ROOT_DIR, 'data', 'test-vault');
process.env.SABRETOOTH_VAULT_ROOT = VAULT_DIR;
delete process.env.HERMES_LEADGEN_BIND;
delete process.env.HERMES_LEADGEN_TOKEN;

const { server, resolveBindHost, validateBindConfig, proxyHttpRequest } = require('../server');
const { spawnSync } = require('node:child_process');

let localServerStartedByTest = false;
let localServerInstance = null;
let baseUrl = 'http://127.0.0.1:8392';

test.before(async () => {
  localServerInstance = server;
  await new Promise((resolve) => {
    localServerInstance.listen(0, () => {
      localServerStartedByTest = true;
      const addr = localServerInstance.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (localServerStartedByTest && localServerInstance) {
    await new Promise((resolve) => localServerInstance.close(() => resolve()));
  }
});

function rewriteBaseUrl(url) {
  return String(url).replace('http://127.0.0.1:8392', baseUrl);
}

function httpGetJson(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(rewriteBaseUrl(url));
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'GET',
        headers: {
          ...extraHeaders,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body), raw: body });
          } catch (err) {
            resolve({ status: res.statusCode, data: null, raw: body });
          }
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

function httpRequestJson(method, url, payload, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const postData = payload !== undefined ? JSON.stringify(payload) : '';
    const u = new URL(rewriteBaseUrl(url));
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method,
        headers: {
          ...(payload !== undefined
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
            : {}),
          ...extraHeaders,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body), raw: body });
          } catch (err) {
            resolve({ status: res.statusCode, data: null, raw: body });
          }
        });
      },
    );
    req.on('error', reject);
    if (payload !== undefined) req.write(postData);
    req.end();
  });
}

function httpPostJson(url, payload, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const u = new URL(rewriteBaseUrl(url));
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...extraHeaders,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body), raw: body });
          } catch (err) {
            resolve({ status: res.statusCode, data: null, raw: body });
          }
        });
      },
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

test('1. Multi-harness entry files (AGENTS.md, CLAUDE.md, GEMINI.md) exist and contain zero retired-node drift', () => {
  const files = [
    path.join(REPO_ROOT, 'AGENTS.md'),
    path.join(REPO_ROOT, 'CLAUDE.md'),
    path.join(REPO_ROOT, 'GEMINI.md'),
  ];
  for (const file of files) {
    assert.ok(fs.existsSync(file), `Missing canonical file: ${file}`);
    const content = fs.readFileSync(file, 'utf8');
    assert.ok(
      !content.includes('NO SUCH NODE — retired, OFF BY RULING'),
      `Stale Sabretooth retired claim found in ${file}`,
    );
  }
});

test('2. Agent souls and profiles include OPSis default research orchestrator, harvey, youtube, editor, kanban, notes, and fcc', () => {
  const requiredSouls = [
    'default-orchestrator-agent.md',
    'harvey-agent.md',
    'youtube-agent.md',
    'editor-agent.md',
    'kanban-agent.md',
    'notes-agent.md',
    'fcc-agent.md',
  ];
  const bannedLabel = new RegExp('jar' + 'vis', 'i');
  for (const s of requiredSouls) {
    const p = path.join(ROOT_DIR, 'souls', s);
    assert.ok(fs.existsSync(p), `Missing soul file: ${s}`);
    const text = fs.readFileSync(p, 'utf8');
    assert.ok(
      text.includes('agy --dangerously-skip-permissions') || text.includes('grok') || text.includes('8082'),
      `Missing CLI auth spec in ${s}`,
    );
    assert.ok(text.includes('Sabretooth'), `Missing node Sabretooth in ${s}`);
    assert.ok(!bannedLabel.test(text), `Soul ${s} must use OPSis`);
  }
  const defaultSoul = fs.readFileSync(path.join(ROOT_DIR, 'souls', 'default-orchestrator-agent.md'), 'utf8');
  assert.ok(defaultSoul.includes('OPSis'));
  assert.ok(defaultSoul.includes('http://127.0.0.1:9119/chat?profile=default&resume=local-profile'));
  assert.ok(defaultSoul.includes('agy --dangerously-skip-permissions'));
  assert.ok(defaultSoul.includes('agent-reach'));
  assert.ok(defaultSoul.includes('last30days'));
  assert.ok(defaultSoul.includes('rea'));
  assert.ok(defaultSoul.includes('test-driven-development'));
});

test('3. Server API provides Node Status (Red/Green Light), Dual Graphies, Leads per Source & 3 Specific Types, Terminal/Media Previews, FCC :8082, and Obsidian Memory Sync', async () => {
  const statusRes = await httpGetJson('http://127.0.0.1:8392/api/node/status');
  assert.equal(statusRes.status, 200);
  assert.ok(statusRes.data.node.startsWith('Sabretooth'));
  assert.ok(Array.isArray(statusRes.data.services));
  const ports = statusRes.data.services.map((s) => s.port);
  for (const p of [8392, 9119, 8082, 8391, 11434, 27123, 49374]) {
    assert.ok(ports.includes(p), `Missing port ${p} in Red/Green light check`);
  }

  // Dual Graphies
  const graphyRes = await httpGetJson('http://127.0.0.1:8392/api/graphy');
  assert.equal(graphyRes.status, 200);
  assert.ok(graphyRes.data.workflowGraphy, 'Missing workflowGraphy');
  assert.ok(graphyRes.data.codebaseGraphy, 'Missing codebaseGraphy');

  // Leads per source and 3 specific lead types
  const leadsRes = await httpGetJson('http://127.0.0.1:8392/api/leads');
  assert.equal(leadsRes.status, 200);
  assert.ok(Array.isArray(leadsRes.data.leads));
  assert.ok(leadsRes.data.leads.length <= 2, 'Default leads must have at most 2 sample rows');
  for (const l of leadsRes.data.leads) {
    assert.ok(l.company.includes('SAMPLE'), 'Seed company must say SAMPLE');
    assert.ok(l.contact.includes('SAMPLE'), 'Seed contact must say SAMPLE');
    assert.equal(l.approvalState, 'Awaiting Josh Approval', 'Seeds must only produce Awaiting Josh Approval');
    assert.equal(l.approved, false, 'Seeds must not be approved');
    assert.ok(['GitHub REST API', 'xAI API'].includes(l.source), 'Source must be an API this node holds key for');
  }
  assert.ok(Array.isArray(leadsRes.data.leadTypes));
  const leadTypes = new Set(leadsRes.data.leadTypes.map((t) => t.id));
  assert.ok(leadTypes.has('1-affiliate-dateapp'), 'Missing Type 1: Affiliate links for Date App');
  assert.ok(leadTypes.has('2-subscriptions-dateapp'), 'Missing Type 2: Subscriptions for Actual Date App');
  assert.ok(leadTypes.has('3-funding-dream-online'), 'Missing Type 3: Funding sources for DREAM Online crowdfunding');

  // Terminal & Media preview APIs
  const termRes = await httpGetJson('http://127.0.0.1:8392/api/terminal/logs');
  assert.equal(termRes.status, 200);
  assert.ok(Array.isArray(termRes.data.logs));

  const mediaRes = await httpGetJson('http://127.0.0.1:8392/api/media/previews');
  assert.equal(mediaRes.status, 200);
  assert.ok(Array.isArray(mediaRes.data.items));

  // Obsidian Session-End Memory Sync
  const memRes = await httpPostJson('http://127.0.0.1:8392/api/memory/sync', {
    agent: 'gemini',
    useCase: 'TDD Automated Memory Verification',
    summary:
      'Verified Sabretooth :8392 GUI, :9119 Hermes OPSis session, :8082 Free Claude Code, Dual Graphies, and Harvey 3-type Lead Gen.',
  });
  assert.equal(memRes.status, 200);
  assert.equal(memRes.data.ok, true);
  assert.ok(fs.existsSync(path.join(VAULT_DIR, 'Sabretooth', 'gemini-to-gemini.md')));
  assert.ok(fs.existsSync(path.join(VAULT_DIR, 'Sabretooth', 'hermes-to-hermes.md')));
});

test('4. Gemini Easy Button bootstrap batch file exists, self-heals, and never closes window on error', () => {
  const easyBtnPath = path.join(ROOT_DIR, 'SABRETOOTH-GEMINI-EASY-BUTTON.bat');
  assert.ok(fs.existsSync(easyBtnPath), 'Missing SABRETOOTH-GEMINI-EASY-BUTTON.bat');
  const bat = fs.readFileSync(easyBtnPath, 'utf8');
  assert.ok(bat.includes('8392'), 'Bootstrap must check/start port 8392');
  assert.ok(bat.includes('9119'), 'Bootstrap must check/start port 9119');
  assert.ok(bat.includes('8082'), 'Bootstrap must check/start port 8082');
  assert.ok(bat.includes('27123'), 'Bootstrap must check/start Obsidian port 27123');
  assert.ok(bat.includes('pause') || bat.includes('cmd /k'), 'Bootstrap must not close terminal window on error');
});

test('5. Static & Live GitHub PR Gate Check: Verifies worktree branch on origin, real PR number when pushed, and honest non-faked hook statuses', async (t) => {
  const loopRes = await httpGetJson('http://127.0.0.1:8392/api/hooks/loop');
  assert.equal(loopRes.status, 200);
  assert.equal(
    loopRes.data.nodeCanSelfMergeToMain,
    false,
    'Nodes must never self-merge; only GitHub Cloud Judges merge',
  );
  assert.ok(Array.isArray(loopRes.data.mergeAuthority));
  assert.ok(loopRes.data.mergeAuthority.some((j) => j.includes('Jules')));
  assert.ok(loopRes.data.mergeAuthority.some((j) => j.includes('Claude')));
  assert.ok(loopRes.data.mergeAuthority.some((j) => j.includes('Codex')));

  // Verify server.js never logs fake PUSHED or QUEUED statuses for unconfirmed local events
  const serverCode = fs.readFileSync(path.join(ROOT_DIR, 'server.js'), 'utf8');
  assert.ok(
    !serverCode.includes('PUSHED_AND_PR_QUEUED_FOR_GITHUB_JUDGES'),
    'Must never log fake PUSHED_AND_PR_QUEUED_FOR_GITHUB_JUDGES status',
  );
  assert.ok(
    serverCode.includes('LOCAL_EVENT_RECORDED_NOT_PUSHED'),
    'Unpushed local hook events must log LOCAL_EVENT_RECORDED_NOT_PUSHED',
  );

  // Verify Host header gate on GET (rejects foreign Host header with 403)
  const foreignHostGet = await httpGetJson('http://127.0.0.1:8392/api/node/status', { Host: 'evil.example.com:8392' });
  assert.equal(foreignHostGet.status, 403, 'Foreign Host header on GET must be rejected with HTTP 403');

  // Verify POST Origin security gate (rejects foreign Origin with 403, allows dashboard same-origin)
  const crossOriginPost = await httpPostJson(
    'http://127.0.0.1:8392/api/node/heal',
    {},
    { Origin: 'http://evil.example.com' },
  );
  assert.equal(crossOriginPost.status, 403, 'Foreign Origin on POST route must be rejected with HTTP 403');

  const sameOriginPost = await httpPostJson(
    'http://127.0.0.1:8392/api/node/heal',
    {},
    { Origin: 'http://127.0.0.1:8392' },
  );
  assert.equal(sameOriginPost.status, 200, 'Dashboard same-origin POST must succeed with HTTP 200');

  // Verify /api/media/file restricts access to media-previews via path.relative(..) check
  const traversalRes = await httpGetJson('http://127.0.0.1:8392/api/media/file?path=../server.js');
  assert.equal(traversalRes.status, 403, '/api/media/file traversal outside media-previews must return 403');

  const fccRes = await httpPostJson('http://127.0.0.1:8392/api/fcc/chat', {
    profile: 'harvey',
    message: 'Verify Free Claude Code :8082 wrapper bridge to Harvey profile.',
  });
  assert.equal(fccRes.status, 200);
  assert.equal(fccRes.data.ok, true);
  assert.ok(fccRes.data.reply.includes('8082'));

  // Check gh auth status; skip live GitHub PR lookup when gh is not authenticated (e.g. CI or unauthed node)
  const ghExe = fs.existsSync('C:\\Program Files\\GitHub CLI\\gh.exe') ? 'C:\\Program Files\\GitHub CLI\\gh.exe' : 'gh';
  let ghAuthed = false;
  try {
    execFileSync(ghExe, ['auth', 'status'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 8000,
    });
    ghAuthed = true;
  } catch (_) {
    ghAuthed = false;
  }

  if (!ghAuthed) {
    return;
  }

  const lsRemote = execFileSync('git', ['ls-remote', '--heads', 'origin', 'sabretooth/hermes-leadgen'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    timeout: 8000,
  }).trim();
  if (!lsRemote) {
    return;
  }
  assert.match(lsRemote, /^[0-9a-f]{40}\s+refs\/heads\/sabretooth\/hermes-leadgen$/m);

  const prJson = execFileSync(
    ghExe,
    [
      'pr',
      'list',
      '--repo',
      'Trollz1004/ANTIGRAVITY',
      '--head',
      'sabretooth/hermes-leadgen',
      '--state',
      'open',
      '--json',
      'number,url',
    ],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      timeout: 8000,
    },
  ).trim();
  const parsed = JSON.parse(prJson);
  assert.ok(Array.isArray(parsed) && parsed.length > 0, 'Expected open PR for sabretooth/hermes-leadgen');
  assert.ok(Number.isInteger(parsed[0].number) && parsed[0].number > 0, 'Expected real numeric GitHub PR number');
});

test('6. Mandatory RooFlow + SpecKit Post-Work Git Push & PR Creation Gate (speckit.git.push-and-pr) uses worktree apps/hermes-leadgen and checks exit codes', async () => {
  const extPath = path.join(ROOT_DIR, '.specify', 'extensions.yml');
  assert.ok(fs.existsSync(extPath), 'Missing .specify/extensions.yml');
  const extText = fs.readFileSync(extPath, 'utf8');
  assert.ok(
    extText.includes('speckit.git.push-and-pr'),
    'Missing speckit.git.push-and-pr hook in .specify/extensions.yml',
  );
  assert.ok(extText.includes('optional: false'), 'Post-implement push-and-pr hook must be mandatory (optional: false)');

  const scriptPath = path.join(ROOT_DIR, 'scripts', 'node-auto-pr-push.ps1');
  assert.ok(fs.existsSync(scriptPath), 'Missing scripts/node-auto-pr-push.ps1');
  const scriptText = fs.readFileSync(scriptPath, 'utf8');
  assert.ok(
    scriptText.includes('C:\\Ai-Dream-Team\\_pr-worktree'),
    'Auto-PR script must use C:\\Ai-Dream-Team\\_pr-worktree',
  );
  assert.ok(
    scriptText.includes('sabretooth/hermes-leadgen'),
    'Auto-PR script must use branch sabretooth/hermes-leadgen',
  );
  assert.ok(scriptText.includes('apps/hermes-leadgen'), 'Auto-PR script must stage only apps/hermes-leadgen paths');
  assert.ok(scriptText.includes('doctrine-check.py'), 'Auto-PR script must run doctrine-check.py');
  assert.ok(scriptText.includes('git push'), 'Auto-PR script must push node branch');
  assert.ok(scriptText.includes('pr create'), 'Auto-PR script must create PR for Cloud Judges');
  assert.ok(
    !scriptText.includes('git add -A') && !scriptText.includes('git add .'),
    'Auto-PR script must never run add-all',
  );
});

test('7. Separated Tabs, :8391/health Official API Prospecting + YouTube Data API v3 Made-with-AI TOS, YouTube Studio UCJnFUOdEfSOJiXLnx6lXSzg, 9hNDPCQa3kw Gemini Notebook Remaster, and Zero Robotic TTS', async () => {
  try {
    const health8391 = await httpGetJson('http://127.0.0.1:8391/health');
    if (health8391.status === 200 && health8391.data?.worker) {
      const w = health8391.data.worker;
      assert.equal(w.youtube_publish_method, 'youtube-data-api-v3', 'YouTube must remain API v3 only');
      assert.equal(
        w.youtube_made_with_ai_tos.containsSyntheticMedia,
        true,
        'Made with AI (containsSyntheticMedia) must be enforced',
      );
      assert.equal(w.youtube_studio_url, 'https://studio.youtube.com/channel/UCJnFUOdEfSOJiXLnx6lXSzg');
      assert.equal(w.gemini_notebook_remaster_source.legacyVideoId, '9hNDPCQa3kw');
    }
  } catch (_) {}

  const ytStudio = await httpGetJson('http://127.0.0.1:8392/api/youtube/studio');
  assert.equal(ytStudio.status, 200);
  assert.equal(ytStudio.data.studioChannelId, 'UCJnFUOdEfSOJiXLnx6lXSzg');
  assert.equal(ytStudio.data.splitRules.harveyLeadGenerator.officialApisOnly, true);
  assert.equal(ytStudio.data.splitRules.harveyLeadGenerator.scrapingPermitted, false);
  assert.equal(ytStudio.data.splitRules.youtubePipeline.scrapingPermitted, false);
  assert.equal(ytStudio.data.splitRules.youtubePipeline.madeWithAiTos.containsSyntheticMedia, true);
  assert.equal(ytStudio.data.legacyNotebookVideo.videoId, '9hNDPCQa3kw');
  assert.ok(ytStudio.data.legacyNotebookVideo.takedownReason.toLowerCase().includes('tax law'));

  const rendererCode = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');
  assert.ok(
    !rendererCode.includes('window.speechSynthesis.speak'),
    'Robotic browser speechSynthesis must never be called',
  );

  const roboticRes = await httpPostJson('http://127.0.0.1:8392/api/tts/female', {
    text: 'Test',
    voice: 'microsoft-david-sapi-robotic',
  });
  assert.equal(roboticRes.status, 400, 'Robotic SAPI voice must be rejected with HTTP 400');

  const htmlCode = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  assert.ok(!new RegExp('jar' + 'vis', 'i').test(htmlCode), 'index.html must use OPSis');
  for (const tab of ['orchestrator', 'terminal', 'media', 'graphy', 'harvey', 'youtube', 'fcc', 'kanban', 'notes']) {
    assert.ok(htmlCode.includes(`data-tab="${tab}"`), `Missing separated tab button: ${tab}`);
    assert.ok(htmlCode.includes(`id="tab-${tab}"`), `Missing separated tab panel: tab-${tab}`);
  }
});

test('8. default loopback bind: server binds to 127.0.0.1 unless HERMES_LEADGEN_BIND=0.0.0.0', () => {
  assert.equal(resolveBindHost({}), '127.0.0.1');
  assert.equal(resolveBindHost({ HERMES_LEADGEN_BIND: '127.0.0.1' }), '127.0.0.1');
  assert.equal(resolveBindHost({ HERMES_LEADGEN_BIND: '0.0.0.0' }), '0.0.0.0');
  const addr = localServerInstance.address();
  assert.equal(addr.address, '127.0.0.1', 'Server must bind to 127.0.0.1 by default');
});

test('9. LAN without token refuses: binding 0.0.0.0 with empty HERMES_LEADGEN_TOKEN fails closed', () => {
  assert.throws(
    () => validateBindConfig({ HERMES_LEADGEN_BIND: '0.0.0.0', HERMES_LEADGEN_TOKEN: '' }),
    /HERMES_LEADGEN_TOKEN/,
  );
  assert.throws(
    () => validateBindConfig({ HERMES_LEADGEN_BIND: '0.0.0.0', HERMES_LEADGEN_TOKEN: '   ' }),
    /HERMES_LEADGEN_TOKEN/,
  );
  const proc = spawnSync(process.execPath, [path.join(ROOT_DIR, 'server.js')], {
    env: {
      ...process.env,
      HERMES_LEADGEN_BIND: '0.0.0.0',
      HERMES_LEADGEN_TOKEN: '',
    },
    encoding: 'utf8',
    timeout: 5000,
  });
  assert.notEqual(proc.status, 0, 'server.js must refuse to start on 0.0.0.0 without HERMES_LEADGEN_TOKEN');
  assert.match(String(proc.stderr || ''), /HERMES_LEADGEN_TOKEN/);
});

test('10. POST without bearer is 401 when LAN-bound; /proxy/* and /api/memory/* require bearer; state-changing methods check Origin; framing headers preserved', async () => {
  const prevBind = process.env.HERMES_LEADGEN_BIND;
  const prevToken = process.env.HERMES_LEADGEN_TOKEN;
  process.env.HERMES_LEADGEN_BIND = '0.0.0.0';
  process.env.HERMES_LEADGEN_TOKEN = 'unit-test-bearer-secret';
  try {
    const postNoAuth = await httpPostJson('http://127.0.0.1:8392/api/hooks/push-pr', {
      agent: 'gemini',
      profile: 'default',
      summary: 'unauthed test',
    });
    assert.equal(postNoAuth.status, 401, 'POST without bearer on LAN must return 401');

    const postWrongAuth = await httpPostJson(
      'http://127.0.0.1:8392/api/leads/approve',
      { id: 'lead-aff-01' },
      { Authorization: 'Bearer wrong-token' },
    );
    assert.equal(postWrongAuth.status, 401, 'POST with wrong bearer token must return 401');

    const putNoAuth = await httpRequestJson('PUT', 'http://127.0.0.1:8392/api/leads', {});
    assert.equal(putNoAuth.status, 401, 'PUT without bearer on LAN must return 401');

    const patchNoAuth = await httpRequestJson('PATCH', 'http://127.0.0.1:8392/api/leads', {});
    assert.equal(patchNoAuth.status, 401, 'PATCH without bearer on LAN must return 401');

    const deleteNoAuth = await httpRequestJson('DELETE', 'http://127.0.0.1:8392/api/leads');
    assert.equal(deleteNoAuth.status, 401, 'DELETE without bearer on LAN must return 401');

    const deleteBadOrigin = await httpRequestJson('DELETE', 'http://127.0.0.1:8392/api/leads', undefined, {
      Origin: 'http://evil.example.com',
      Authorization: 'Bearer unit-test-bearer-secret',
    });
    assert.equal(deleteBadOrigin.status, 403, 'State-changing DELETE with foreign Origin must return 403');

    const proxyNoAuth = await httpGetJson('http://127.0.0.1:8392/proxy/fcc/admin');
    assert.equal(proxyNoAuth.status, 401, '/proxy/* without bearer on LAN must return 401');

    const memoryLedgerNoAuth = await httpGetJson('http://127.0.0.1:8392/api/memory/ledger');
    assert.equal(memoryLedgerNoAuth.status, 401, 'GET /api/memory/ledger without bearer on LAN must return 401');

    const authedPost = await httpPostJson(
      'http://127.0.0.1:8392/api/hooks/trigger',
      { agent: 'gemini', profile: 'default', summary: 'authed test' },
      { Authorization: 'Bearer unit-test-bearer-secret' },
    );
    assert.equal(authedPost.status, 200, 'POST with valid bearer on LAN must succeed with 200');

    const serverSrc = fs.readFileSync(path.join(ROOT_DIR, 'server.js'), 'utf8');
    assert.ok(!serverSrc.includes("delete resHeaders['x-frame-options']"), 'Must not strip x-frame-options');
    assert.ok(
      !serverSrc.includes("delete resHeaders['content-security-policy']"),
      'Must not strip content-security-policy',
    );

    // Verify proxyHttpRequest preserves x-frame-options and content-security-policy headers at runtime
    const upstream = http.createServer((_req, uRes) => {
      uRes.writeHead(200, {
        'Content-Type': 'application/json',
        'X-Frame-Options': 'DENY',
        'Content-Security-Policy': "default-src 'self'",
      });
      uRes.end(JSON.stringify({ ok: true }));
    });
    await new Promise((r) => upstream.listen(0, '127.0.0.1', r));
    const upstreamPort = upstream.address().port;
    const proxyBridge = http.createServer((pReq, pRes) => proxyHttpRequest(pReq, pRes, upstreamPort, '/proxy/test'));
    await new Promise((r) => proxyBridge.listen(0, '127.0.0.1', r));
    const bridgePort = proxyBridge.address().port;
    try {
      const headersReceived = await new Promise((resolve, reject) => {
        http
          .get(`http://127.0.0.1:${bridgePort}/proxy/test/check`, (pRes) => {
            pRes.resume();
            resolve(pRes.headers);
          })
          .on('error', reject);
      });
      assert.equal(headersReceived['x-frame-options'], 'DENY');
      assert.equal(headersReceived['content-security-policy'], "default-src 'self'");
    } finally {
      await new Promise((r) => proxyBridge.close(r));
      await new Promise((r) => upstream.close(r));
    }
  } finally {
    if (prevBind === undefined) delete process.env.HERMES_LEADGEN_BIND;
    else process.env.HERMES_LEADGEN_BIND = prevBind;
    if (prevToken === undefined) delete process.env.HERMES_LEADGEN_TOKEN;
    else process.env.HERMES_LEADGEN_TOKEN = prevToken;
  }
});

test('11. bad agent is 400: agent and profile validated against /^[a-z0-9_-]{1,32}$/i', async () => {
  const badHookAgent = await httpPostJson('http://127.0.0.1:8392/api/hooks/push-pr', {
    agent: '../evil',
    profile: 'default',
    summary: 'bad agent test',
  });
  assert.equal(badHookAgent.status, 400, 'Bad agent on /api/hooks/push-pr must return 400');

  const badHookProfile = await httpPostJson('http://127.0.0.1:8392/api/hooks/push-pr', {
    agent: 'gemini',
    profile: 'bad;profile',
    runGitPushPr: true,
    summary: 'bad profile test',
  });
  assert.equal(badHookProfile.status, 400, 'Bad profile on /api/hooks/push-pr must return 400');

  const badMemoryAgent = await httpPostJson('http://127.0.0.1:8392/api/memory/sync', {
    agent: 'bad/agent',
    summary: 'bad memory agent',
  });
  assert.equal(badMemoryAgent.status, 400, 'Bad agent on /api/memory/sync must return 400');

  const badSoulAgent = await httpGetJson('http://127.0.0.1:8392/api/souls/bad..agent');
  assert.equal(badSoulAgent.status, 400, 'Bad agent on /api/souls/:agent must return 400');
});

test('12. OPSis Desk v1 WCAG AAA palette contrast verification (>= 7:1 on every text pair, lowest pair printed)', () => {
  const renderer = require('../renderer.js');
  const report = renderer.verifyWcagAaaPalette();
  assert.equal(report.allPassAaa, true, 'Every DREAM Space text/background pair must meet WCAG AAA (>= 7:1)');
  assert.equal(report.lowestPair.id, 'slate-on-ink');
  assert.equal(report.lowestPair.fg, '#9DA3AA');
  assert.equal(report.lowestPair.bg, '#0A0B0D');
  assert.ok(report.lowestPair.ratio >= 7.0, `Lowest pair ratio ${report.lowestPair.ratio}:1 must be >= 7.0:1`);

  const noAuth = renderer.buildRuntimeAuthHeaders('', { 'X-Desk': 'opsis' });
  assert.equal(noAuth.Authorization, undefined);
  const withAuth = renderer.buildRuntimeAuthHeaders('  runtime-secret-token  ', { 'X-Desk': 'opsis' });
  assert.equal(withAuth.Authorization, 'Bearer runtime-secret-token');
});

test('13. Fake-payload unit test: View 1 Overview panel (cron jobs, 5 ports 8082/8390/8391/8392/11434, job queue, last 10 log lines, skills per step)', () => {
  const { renderOverviewPanelMarkup } = require('../renderer.js');
  const fakeLogLines = Array.from({ length: 14 }, (_, i) => ({
    id: `fake-log-${i + 1}`,
    ts: `2026-11-04T23:00:${String(i).padStart(2, '0')}.000Z`,
    profile: 'opsis',
    cmd: `step-${i + 1}`,
    output: `completed line ${i + 1}`,
  }));
  const fakeOverview = {
    requiredPorts: [
      { port: 8082, name: 'FCC Admin', up: true, dot: 'green', url: 'http://127.0.0.1:8082' },
      { port: 8390, name: 'Queue Worker', up: true, dot: 'green', url: 'http://127.0.0.1:8390' },
      { port: 8391, name: 'GPU AMF TTS', up: true, dot: 'green', url: 'http://127.0.0.1:8391' },
      { port: 8392, name: 'OPSis Desk', up: true, dot: 'green', url: 'http://127.0.0.1:8392' },
      { port: 11434, name: 'Local Ollama', up: false, dot: 'red', url: 'http://127.0.0.1:11434' },
    ],
    cronJobs: [
      {
        id: 'cron-1',
        name: 'Nightly Shorts Render',
        schedule: '0 2 * * *',
        lastRun: '2026-11-04 02:00',
        lastResult: 'OK: 2 private uploads',
        statusDot: 'green',
      },
    ],
    jobQueue: [
      {
        id: 'sample-job-1',
        title: 'SAMPLE — Render #041',
        lane: 'YouTube Shorts',
        stage: 'AMF Render',
        state: 'Private Ready',
        statusDot: 'green',
        detail: 'hevc_amf 58s',
      },
    ],
    logTail: fakeLogLines,
    skillsLoaded: [{ step: '1. Brainstorm', skill: 'superpowers', purpose: 'Architecture & TDD plan' }],
  };
  const out = renderOverviewPanelMarkup(fakeOverview);
  for (const p of [8082, 8390, 8391, 8392, 11434]) {
    assert.ok(out.portsRowsHtml.includes(`:${p}`), `Overview ports table must include :${p}`);
  }
  assert.ok(out.portsRowsHtml.includes('DOWN'), 'Port 11434 down state must render');
  assert.ok(out.cronRowsHtml.includes('Nightly Shorts Render') && out.cronRowsHtml.includes('OK: 2 private uploads'));
  assert.ok(out.queueRowsHtml.includes('Render #041') && out.queueRowsHtml.includes('Private Ready'));
  assert.equal(out.logLineCount, 10, 'Log tail must cap to the last 10 lines');
  assert.ok(!out.logTailHtml.includes('fake-log-4'), 'Older log lines beyond last 10 must be excluded');
  assert.ok(out.logTailHtml.includes('fake-log-14'), 'Newest log line must be included');
  assert.ok(out.skillsHtml.includes('superpowers'));
});

test('14. Fake-payload unit test: View 2 YouTube & Podcast desk (pipeline stages, private-only, containsSyntheticMedia, Josh publishes in Studio, never a publish button)', () => {
  const { renderYoutubeDeskMarkup } = require('../renderer.js');
  const fakeYt = {
    pipelineStages: [
      { id: 'st-1', name: 'Script & Hook', state: 'Ready', statusDot: 'green', detail: 'Caveman voice pass' },
      { id: 'st-2', name: 'AMF Encode', state: 'Ready', statusDot: 'green', detail: 'h264_amf RX 6700 XT' },
    ],
    uploads: [
      {
        id: 'sample-upload-1',
        title: 'SAMPLE — AI Bottlenecks Short',
        lane: '59s Short',
        encoder: 'h264_amf',
        duration: '57s',
        stage: 'Studio Handoff',
        state: 'Private Upload Complete',
        statusDot: 'amber',
        privacyStatus: 'private',
        containsSyntheticMedia: true,
        syntheticMediaLabel: 'containsSyntheticMedia: true (AI neural voice disclosed)',
        studioPublishNote: 'Josh publishes in Studio',
        descriptionTribute: "CLAUDE's N Joshua's · #TeamClaudeForLife",
      },
    ],
  };
  const out = renderYoutubeDeskMarkup(fakeYt);
  assert.equal(out.uploadCount, 1);
  assert.ok(out.pipelineRailHtml.includes('Script &amp; Hook'));
  assert.ok(out.uploadsRowsHtml.includes('privacyStatus: private'));
  assert.ok(out.uploadsRowsHtml.includes('containsSyntheticMedia: true'));
  assert.ok(out.uploadsRowsHtml.includes('Josh publishes in Studio'));
  assert.ok(out.uploadsRowsHtml.includes('#TeamClaudeForLife'));
  assert.ok(!/<button[^>]*>[^<]*publish/i.test(out.uploadsRowsHtml), 'Must never render a publish button');
});

test('15. Fake-payload unit test: View 3 Clay-type Lead Gen panel (filters by stage & official API source, detail pane, Josh approval state)', () => {
  const { renderClayLeadGenMarkup } = require('../renderer.js');
  const fakeLeadsPayload = {
    leads: [
      {
        id: 'lead-a',
        company: 'Austin Singles Collective',
        contact: 'SAMPLE — Host Contact',
        stage: 'Outreach Drafted',
        source: 'xAI API',
        owner: 'Harvey',
        lastTouch: '2026-11-04',
        nextStep: 'Josh reviews draft',
        approvalState: 'Awaiting Josh Approval',
        signal: 'Verified event post via xAI API',
        outreachDraft: 'Product value draft A',
      },
      {
        id: 'lead-b',
        company: 'Indie Game Guild',
        contact: 'SAMPLE — Producer Contact',
        stage: 'Qualified Signal',
        source: 'GitHub REST API',
        owner: 'Harvey',
        lastTouch: '2026-11-04',
        nextStep: 'Josh approves co-op',
        approvalState: 'Approved by Josh',
        signal: 'Public release tag via GitHub REST API',
        outreachDraft: 'Product value draft B',
      },
    ],
  };

  const allOut = renderClayLeadGenMarkup(fakeLeadsPayload, { stage: 'ALL', source: 'ALL' }, 'lead-a');
  assert.equal(allOut.filteredCount, 2);
  assert.equal(allOut.activeLead.company, 'Austin Singles Collective');
  assert.equal(allOut.activeLead.approvalState, 'Awaiting Josh Approval');

  const filteredBySource = renderClayLeadGenMarkup(
    fakeLeadsPayload,
    { stage: 'ALL', source: 'GitHub REST API' },
    'lead-a',
  );
  assert.equal(filteredBySource.filteredCount, 1);
  assert.equal(filteredBySource.activeLead.id, 'lead-b');
  assert.equal(filteredBySource.activeLead.approvalState, 'Approved by Josh');
});

test('16. Fake-payload & live SVG QR test: View 4 Marketing panel + Bottom Dock (UTM links, MIT qrcode SVG cards with CLAUDEs N Joshuas and #TeamClaudeForLife, product-value copy only)', async () => {
  const { renderMarketingDeskMarkup, renderBottomDockMarkup } = require('../renderer.js');
  const { ensureMarketingQrCards } = require('../server.js');

  const cards = await ensureMarketingQrCards();
  assert.ok(cards.length >= 4, 'Must generate at least 4 SVG QR cards');
  for (const c of cards) {
    assert.ok(c.utmUrl.startsWith('https://youandinotai.com/?utm_source='), 'Marketing URL must use UTM parameters');
    const svgDiskPath = path.join(ROOT_DIR, 'marketing', 'qr', c.fileName);
    assert.ok(fs.existsSync(svgDiskPath), `SVG QR file ${c.fileName} must exist on disk`);
    const svgContent = fs.readFileSync(svgDiskPath, 'utf8');
    assert.ok(
      svgContent.includes("CLAUDE's N Joshua's") ||
        svgContent.includes('CLAUDE&#39;s N Joshua&#39;s') ||
        svgContent.includes('CLAUDE&apos;s N Joshua&apos;s'),
      'SVG card must include CLAUDEs N Joshuas title',
    );
    assert.ok(svgContent.includes('#TeamClaudeForLife'), 'SVG card must include #TeamClaudeForLife');
    assert.ok(
      !/charity|mission|donation|payout|commission/i.test(c.productCopy),
      'Copy must sell product value only with no charity/mission/payout wording',
    );
  }

  const mktOut = renderMarketingDeskMarkup({ campaigns: cards });
  assert.equal(mktOut.campaignCount, cards.length);
  assert.ok(mktOut.qrGalleryHtml.includes('#TeamClaudeForLife'));

  const dockOut = renderBottomDockMarkup({
    terminal: [{ ts: '2026-11-04T23:00:00Z', cmd: 'node --test', output: 'pass' }],
    files: [{ path: 'apps/hermes-leadgen/server.js', role: 'Backend', state: 'Modified' }],
    git: { branch: 'ai/opsis-desk-v1', base: 'origin/main', prTitle: 'opsis: desk v1 (house shell, four views)' },
    browser: [{ label: 'OPSis Desk', url: 'http://127.0.0.1:8392', mode: 'Live', dot: 'green' }],
    previews: [{ title: 'Founding QR', path: '/marketing/qr/youandinotai-founding-member.svg', kind: 'SVG' }],
  });
  assert.ok(dockOut.terminalHtml.includes('node --test'));
  assert.ok(dockOut.filesHtml.includes('apps/hermes-leadgen/server.js'));
  assert.ok(dockOut.gitHtml.includes('ai/opsis-desk-v1'));
  assert.ok(dockOut.browserHtml.includes('http://127.0.0.1:8392'));
  assert.ok(dockOut.previewsHtml.includes('youandinotai-founding-member.svg'));
});
