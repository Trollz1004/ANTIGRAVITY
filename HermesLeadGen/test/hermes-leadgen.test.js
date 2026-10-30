const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const ROOT_DIR = path.resolve(__dirname, '..');
const VAULT_DIR = path.resolve(ROOT_DIR, '..');

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), raw: body });
        } catch (err) {
          resolve({ status: res.statusCode, data: null, raw: body });
        }
      });
    }).on('error', reject);
  });
}

function httpPostJson(url, payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), raw: body });
        } catch (err) {
          resolve({ status: res.statusCode, data: null, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

test('1. Multi-harness entry files (AGENTS.md, CLAUDE.md, GEMINI.md, AGENT.md, workflow JSONs) have zero drift', () => {
  const files = [
    path.join(VAULT_DIR, 'AGENTS.md'),
    path.join(VAULT_DIR, 'CLAUDE.md'),
    path.join(VAULT_DIR, 'GEMINI.md'),
    path.join(VAULT_DIR, 'AGENT.md'),
    path.join(VAULT_DIR, 'api.workflow.json'),
    path.join(VAULT_DIR, 'workflow_api.json'),
    path.join(VAULT_DIR, 'Agent Universal', 'agent-workflow-graphy.json')
  ];
  for (const file of files) {
    assert.ok(fs.existsSync(file), `Missing canonical file: ${file}`);
    const content = fs.readFileSync(file, 'utf8');
    assert.ok(!content.includes('NO SUCH NODE — retired, OFF BY RULING'), `Stale Sabretooth retired claim found in ${file}`);
    assert.ok(content.includes('192.168.0.8'), `Missing Sabretooth 192.168.0.8 in ${file}`);
    assert.ok(content.includes('192.168.0.15'), `Missing T5500 192.168.0.15 in ${file}`);
    assert.ok(content.includes('192.168.0.40'), `Missing Alienware 192.168.0.40 in ${file}`);
  }
});

test('2. Agent souls and profiles include default research orchestrator, harvey, youtube, editor, kanban, notes, and fcc', () => {
  const requiredSouls = [
    'default-orchestrator-agent.md',
    'harvey-agent.md',
    'youtube-agent.md',
    'editor-agent.md',
    'kanban-agent.md',
    'notes-agent.md',
    'fcc-agent.md'
  ];
  for (const s of requiredSouls) {
    const p = path.join(ROOT_DIR, 'souls', s);
    assert.ok(fs.existsSync(p), `Missing soul file: ${s}`);
    const text = fs.readFileSync(p, 'utf8');
    assert.ok(text.includes('agy --dangerously-skip-permissions') || text.includes('grok') || text.includes('8082'), `Missing CLI auth spec in ${s}`);
    assert.ok(text.includes('Sabretooth'), `Missing node Sabretooth in ${s}`);
  }
  const defaultSoul = fs.readFileSync(path.join(ROOT_DIR, 'souls', 'default-orchestrator-agent.md'), 'utf8');
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
  assert.equal(statusRes.data.node, 'Sabretooth (.8 / 192.168.0.8)');
  assert.ok(Array.isArray(statusRes.data.services));
  const ports = statusRes.data.services.map(s => s.port);
  for (const p of [8392, 9119, 8082, 8391, 11434, 27123, 49374]) {
    assert.ok(ports.includes(p), `Missing port ${p} in Red/Green light check`);
  }

  // Dual Graphies
  const graphyRes = await httpGetJson('http://127.0.0.1:8392/api/graphy');
  assert.equal(graphyRes.status, 200);
  assert.ok(graphyRes.data.workflowGraphy, 'Missing workflowGraphy');
  assert.ok(graphyRes.data.codebaseGraphy, 'Missing codebaseGraphy');
  assert.ok(graphyRes.data.codebaseGraphy.nodeCount > 0, 'Codebase graphy should have nodes');

  // Leads per source and 3 specific lead types
  const leadsRes = await httpGetJson('http://127.0.0.1:8392/api/leads');
  assert.equal(leadsRes.status, 200);
  assert.ok(Array.isArray(leadsRes.data.leads));
  const leadTypes = new Set(leadsRes.data.leads.map(l => l.leadType));
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
    summary: 'Verified Sabretooth :8392 GUI, :9119 Hermes default session, :8082 Free Claude Code, Dual Graphies, and Harvey 3-type Lead Gen.'
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

test('5. Circular Node Hook -> GitHub PR Webhook -> Cloud Judge Merge Loop & Free Claude Code (:8082/admin) Bridge work end-to-end', async () => {
  const loopRes = await httpGetJson('http://127.0.0.1:8392/api/hooks/loop');
  assert.equal(loopRes.status, 200);
  assert.equal(loopRes.data.nodeCanSelfMergeToMain, false, 'Nodes must never self-merge; only GitHub Cloud Judges merge');
  assert.ok(Array.isArray(loopRes.data.mergeAuthority));
  assert.ok(loopRes.data.mergeAuthority.some(j => j.includes('Jules')));
  assert.ok(loopRes.data.mergeAuthority.some(j => j.includes('Claude')));
  assert.ok(loopRes.data.mergeAuthority.some(j => j.includes('Codex')));

  const trigRes = await httpPostJson('http://127.0.0.1:8392/api/hooks/trigger', {
    source: 'tdd-test-suite',
    repo: 'Trollz1004/ANTIGRAVITY',
    summary: 'Verified circular Task -> Node Orchestrator -> GitHub PR Webhook -> Cloud Judge Merge loop.'
  });
  assert.equal(trigRes.status, 200);
  assert.equal(trigRes.data.ok, true);

  const fccRes = await httpPostJson('http://127.0.0.1:8392/api/fcc/chat', {
    profile: 'harvey',
    message: 'Verify Free Claude Code :8082 wrapper bridge to Harvey profile.'
  });
  assert.equal(fccRes.status, 200);
  assert.equal(fccRes.data.ok, true);
  assert.ok(fccRes.data.reply.includes('8082'));
});

test('6. Mandatory RooFlow + SpecKit Post-Work Git Push & PR Creation Gate (speckit.git.push-and-pr) is enforced across extensions, scripts, souls, and API', async () => {
  const extPath = path.join(VAULT_DIR, '.specify', 'extensions.yml');
  assert.ok(fs.existsSync(extPath), 'Missing .specify/extensions.yml');
  const extText = fs.readFileSync(extPath, 'utf8');
  assert.ok(extText.includes('speckit.git.push-and-pr'), 'Missing speckit.git.push-and-pr hook in .specify/extensions.yml');
  assert.ok(extText.includes('optional: false'), 'Post-implement push-and-pr hook must be mandatory (optional: false)');

  const scriptPath = path.join(ROOT_DIR, 'scripts', 'node-auto-pr-push.ps1');
  assert.ok(fs.existsSync(scriptPath), 'Missing scripts/node-auto-pr-push.ps1');
  const scriptText = fs.readFileSync(scriptPath, 'utf8');
  assert.ok(scriptText.includes('git push'), 'Auto-PR script must push node branch');
  assert.ok(scriptText.includes('pr create'), 'Auto-PR script must create PR for Cloud Judges');

  const agentsMd = fs.readFileSync(path.join(VAULT_DIR, 'AGENTS.md'), 'utf8');
  assert.ok(agentsMd.includes('speckit.git.push-and-pr'), 'AGENTS.md must enforce mandatory git push & PR creation');

  const loopRes = await httpGetJson('http://127.0.0.1:8392/api/hooks/loop');
  assert.equal(loopRes.status, 200);
  assert.ok(loopRes.data.mandatoryPostWorkRule.includes('speckit.git.push-and-pr'));

  const pushPrRes = await httpPostJson('http://127.0.0.1:8392/api/hooks/push-pr', {
    agent: 'gemini',
    profile: 'default',
    summary: 'TDD verify mandatory auto-push & PR creation endpoint'
  });
  assert.equal(pushPrRes.status, 200);
  assert.equal(pushPrRes.data.ok, true);
});

test('7. Separated Tabs, :8391/health Harvey Scraping vs YouTube API-Only + Made-with-AI TOS, YouTube Studio UCJnFUOdEfSOJiXLnx6lXSzg, 9hNDPCQa3kw Gemini Notebook Remaster, and Zero Robotic TTS', async () => {
  // 1. Verify :8391/health split rules
  const health8391 = await httpGetJson('http://127.0.0.1:8391/health');
  assert.equal(health8391.status, 200);
  const w = health8391.data.worker;
  assert.equal(w.harvey_scraping_rules.harvey_scraping_permitted, true, 'Harvey must be authorized to scrape external non-YouTube sources');
  assert.equal(w.youtube_publish_method, 'youtube-data-api-v3', 'YouTube must remain API v3 only');
  assert.equal(w.youtube_made_with_ai_tos.containsSyntheticMedia, true, 'Made with AI (containsSyntheticMedia) must be enforced');
  assert.equal(w.youtube_studio_url, 'https://studio.youtube.com/channel/UCJnFUOdEfSOJiXLnx6lXSzg');
  assert.equal(w.gemini_notebook_remaster_source.legacyVideoId, '9hNDPCQa3kw');

  // 2. Verify :8392/api/youtube/studio
  const ytStudio = await httpGetJson('http://127.0.0.1:8392/api/youtube/studio');
  assert.equal(ytStudio.status, 200);
  assert.equal(ytStudio.data.studioChannelId, 'UCJnFUOdEfSOJiXLnx6lXSzg');
  assert.equal(ytStudio.data.splitRules.harveyLeadGenerator.scrapingPermitted, true);
  assert.equal(ytStudio.data.splitRules.youtubePipeline.scrapingPermitted, false);
  assert.equal(ytStudio.data.splitRules.youtubePipeline.madeWithAiTos.containsSyntheticMedia, true);
  assert.equal(ytStudio.data.legacyNotebookVideo.videoId, '9hNDPCQa3kw');
  assert.ok(ytStudio.data.legacyNotebookVideo.takedownReason.toLowerCase().includes('tax law'));

  // 3. Verify robotic browser speechSynthesis is completely removed from renderer.js & robotic TTS is rejected
  const rendererCode = fs.readFileSync(path.join(ROOT_DIR, 'renderer.js'), 'utf8');
  assert.ok(!rendererCode.includes('window.speechSynthesis.speak'), 'Robotic browser speechSynthesis must never be called');

  const roboticRes = await httpPostJson('http://127.0.0.1:8392/api/tts/female', {
    text: 'Test',
    voice: 'microsoft-david-sapi-robotic'
  });
  assert.equal(roboticRes.status, 400, 'Robotic SAPI voice must be rejected with HTTP 400');

  // 4. Verify separated single-purpose tabs exist in index.html
  const htmlCode = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  for (const tab of ['orchestrator', 'terminal', 'media', 'graphy', 'harvey', 'youtube', 'fcc', 'kanban', 'notes']) {
    assert.ok(htmlCode.includes(`data-tab="${tab}"`), `Missing separated tab button: ${tab}`);
    assert.ok(htmlCode.includes(`id="tab-${tab}"`), `Missing separated tab panel: tab-${tab}`);
  }
});



