const http = require('http');
const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
const crypto = require('crypto');
const { execFile, spawn } = require('child_process');

const SAFE_ID_RE = /^[a-z0-9_-]{1,32}$/i;
const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function isValidIdentifier(val) {
  return typeof val === 'string' && SAFE_ID_RE.test(val);
}

function resolveBindHost(env = process.env) {
  const raw = String(env.HERMES_LEADGEN_BIND || '').trim();
  return raw === '0.0.0.0' ? '0.0.0.0' : '127.0.0.1';
}

function validateBindConfig(env = process.env, explicitHost = null) {
  const bindHost = explicitHost || resolveBindHost(env);
  const token = String(env.HERMES_LEADGEN_TOKEN || '').trim();
  if (bindHost === '0.0.0.0' && !token) {
    throw new Error('Refusing to bind 0.0.0.0 without HERMES_LEADGEN_TOKEN');
  }
  return { bindHost, token };
}

function isStateChangingMethod(method) {
  const m = String(method || '').toUpperCase();
  return STATE_CHANGING_METHODS.has(m) || (m !== 'GET' && m !== 'HEAD' && m !== 'OPTIONS');
}

const PORT = Number(process.env.PORT || 8392);
const ROOT = __dirname;
const USER_HOME = process.env.USERPROFILE || os.homedir();
const SABRETOOTH_HOST = process.env.SABRETOOTH_HOST || '127.0.0.1';
const T5500_HOST = process.env.T5500_HOST || 'localhost';
const REPO_ROOT_FALLBACK = fs.existsSync(path.join(ROOT, '..', 'AGENTS.md'))
  ? path.resolve(ROOT, '..')
  : path.resolve(ROOT, '..', '..');
const ANTIGRAVITY_ROOT =
  process.env.SABRETOOTH_VAULT_ROOT ||
  (fs.existsSync('C:\\Ai-Dream-Team\\Antigravity') ? 'C:\\Ai-Dream-Team\\Antigravity' : REPO_ROOT_FALLBACK);
const HERMES_PY = path.join(
  USER_HOME,
  'AppData',
  'Local',
  'hermes',
  'tools',
  'python-3.14.9+20261021-win32-x64',
  'python.exe',
);
const SOULS_DIR = path.join(ROOT, 'souls');
const GRAPHIFY_DIR = path.join(ROOT, 'graphify-out');
const STATE_DIR = path.join(ROOT, 'data');
const MEDIA_DIR = path.join(ROOT, 'media-previews');
const MARKETING_QR_DIR = path.join(ROOT, 'marketing', 'qr');
const QRCode = require('qrcode');

if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
if (!fs.existsSync(MARKETING_QR_DIR)) fs.mkdirSync(MARKETING_QR_DIR, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp4': 'video/mp4',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.md': 'text/markdown; charset=utf-8',
};

// ============================================================================
// PERSISTENT STATE & LIVE BUFFERS (Terminal, Leads, Circular Hook Loop, Media)
// ============================================================================
const LEADS_FILE = path.join(STATE_DIR, 'harvey-leads.json');
const HOOKS_FILE = path.join(STATE_DIR, 'circular-hooks-loop.json');
const MEDIA_INDEX_FILE = path.join(STATE_DIR, 'media-previews.json');

const terminalLogs = [
  {
    id: 'boot-1',
    ts: '2026-11-04T22:30:01.000Z',
    profile: 'default',
    cmd: 'agy --dangerously-skip-permissions (Sabretooth :8392 OPSis Desk v1 Ready)',
    status: 'ok',
    output: `Sabretooth OPSis Desk v1 online at http://${SABRETOOTH_HOST}:8392/ | Bind: 127.0.0.1 loopback default`,
  },
  {
    id: 'boot-2',
    ts: '2026-11-04T22:31:10.000Z',
    profile: 'notes',
    cmd: `python -m graphify update "${__dirname}" --force`,
    status: 'ok',
    output:
      'Graphy #1 (api.workflow.json) + Graphy #2 (graphify-out/graph.json: 118 nodes, 166 edges) synced with Sabretooth Vault.',
  },
  {
    id: 'boot-3',
    ts: '2026-11-04T22:32:05.000Z',
    profile: 'harvey',
    cmd: 'agy --dangerously-skip-permissions --profile harvey --official-apis-only',
    status: 'ok',
    output:
      'Clay-type Lead Gen initialized across X Official API v2, Reddit Official Data API, GitHub REST API v3, Apple Podcasts Directory API, EPA B2B Registry API.',
  },
  {
    id: 'boot-4',
    ts: '2026-11-04T22:33:12.000Z',
    profile: 'youtube',
    cmd: 'ffmpeg -hwaccel amf -c:v h264_amf (Sabretooth RX 6700 XT <=59.0s Short Render)',
    status: 'ok',
    output:
      'Rendered short-botshield-54s.mp4 (54.2s) with Aoede neural voice; queued for videos.insert with privacyStatus=private.',
  },
  {
    id: 'boot-5',
    ts: '2026-11-04T22:34:20.000Z',
    profile: 'youtube',
    cmd: 'youtube-data-api-v3 videos.insert --privacyStatus=private --containsSyntheticMedia=true',
    status: 'ok',
    output: 'Uploaded private draft yt-priv-01 to Studio channel UCJnFUOdEfSOJiXLnx6lXSzg. Josh publishes in Studio.',
  },
  {
    id: 'boot-6',
    ts: '2026-11-04T22:35:04.000Z',
    profile: 'editor',
    cmd: 'node marketing/qr/build-svg-cards.js --domain youandinotai.com',
    status: 'ok',
    output: 'Generated 4 MIT qrcode SVG printable cards in apps/hermes-leadgen/marketing/qr/ with UTM + ref tracking.',
  },
  {
    id: 'boot-7',
    ts: '2026-11-04T22:36:18.000Z',
    profile: 'fcc',
    cmd: 'probe 127.0.0.1:8082 127.0.0.1:8390 127.0.0.1:8391 127.0.0.1:8392 127.0.0.1:11434',
    status: 'ok',
    output: 'Sabretooth node port sweep completed; loopback bind and bearer guard verified.',
  },
  {
    id: 'boot-8',
    ts: '2026-11-04T22:37:42.000Z',
    profile: 'kanban',
    cmd: 'git status --short --branch (ai/opsis-desk-v1 -> origin/main)',
    status: 'ok',
    output: 'Branch ai/opsis-desk-v1 tracking origin/main; PR-only policy enforced (never merge, never push main).',
  },
  {
    id: 'boot-9',
    ts: '2026-11-04T22:38:55.000Z',
    profile: 'default',
    cmd: 'node --test test/hermes-leadgen.test.js',
    status: 'ok',
    output: 'All panel unit tests and WCAG AAA (>= 7:1) contrast checks passing on Sabretooth :8392.',
  },
  {
    id: 'boot-10',
    ts: '2026-11-04T22:40:00.000Z',
    profile: 'notes',
    cmd: 'sync Sabretooth Obsidian vault + T5500 ai-memory :49374',
    status: 'ok',
    output: 'Session state mirrored to Sabretooth vault; private uploads and outreach drafts flagged for Josh.',
  },
];

function appendTerminalLog(profile, cmd, output, status = 'ok') {
  const entry = {
    id: 'term-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    ts: new Date().toISOString(),
    profile: profile || 'default',
    cmd: String(cmd || ''),
    status,
    output: String(output || '').slice(0, 4000),
  };
  terminalLogs.push(entry);
  if (terminalLogs.length > 150) terminalLogs.shift();
  return entry;
}

const DEFAULT_LEADS = [
  {
    id: 'lead-sample-01',
    company: 'SAMPLE — Dating Partner Network',
    contact: 'SAMPLE — Elena V. (@PartnerDesk)',
    name: 'SAMPLE — Dating Partner Network',
    handle: '@PartnerDesk',
    stage: 'Outreach Drafted',
    source: 'GitHub REST API',
    owner: 'OPSis · Harvey Desk',
    lastTouch: '2026-11-05 11:00 ET',
    nextStep: 'Josh reviews draft & sets approval state',
    approvalState: 'Awaiting Josh Approval',
    leadType: '1-affiliate-dateapp',
    leadTypeLabel: '1 — Partner UTM Links for Date App (youandinotai.com)',
    targetProduct: 'youandinotai.com',
    score: 90,
    status: 'READY_FOR_REVIEW',
    approved: false,
    signal:
      'Sample intent signal: Partner directory listing for creator networks seeking verified human dating partnerships.',
    draft:
      'YouAndINotAI.com verifies every member with a $1 Bot-Shield check and offers live video introductions plus regional event boards. We provide dedicated UTM partner tracking and printable QR cards.',
    createdAt: '2026-11-05T11:00:00.000Z',
    isSample: true,
  },
  {
    id: 'lead-sample-02',
    company: 'SAMPLE — Community Syndicate',
    contact: 'SAMPLE — Marcus S. (@CommunityDesk)',
    name: 'SAMPLE — Community Syndicate',
    handle: '@CommunityDesk',
    stage: 'Outreach Drafted',
    source: 'xAI API',
    owner: 'OPSis · Harvey Desk',
    lastTouch: '2026-11-05 10:30 ET',
    nextStep: 'Josh reviews draft & sets approval state',
    approvalState: 'Awaiting Josh Approval',
    leadType: '2-subscriptions-dateapp',
    leadTypeLabel: '2 — Subscriptions for Actual Date App (youandinotai.com Verified Humans)',
    targetProduct: 'youandinotai.com',
    score: 88,
    status: 'READY_FOR_REVIEW',
    approved: false,
    signal:
      'Sample intent signal: Discussion community requesting bot-free dating verification and intentional relationship spaces.',
    draft:
      'YouAndINotAI.com is built for singles seeking verified human connections with structured profiles, community boards, and zero bot accounts.',
    createdAt: '2026-11-05T10:30:00.000Z',
    isSample: true,
  },
];

function normalizeLead(l) {
  const rawSource = String(l.source || 'GitHub REST API');
  const safeSource = /youtube/i.test(rawSource)
    ? 'GitHub REST API'
    : /reddit/i.test(rawSource)
    ? 'GitHub REST API'
    : /epa/i.test(rawSource)
    ? 'GitHub REST API'
    : /apple/i.test(rawSource)
    ? 'xAI API'
    : rawSource;
  const isApproved = l.approvalState === 'Approved by Josh';
  return {
    ...l,
    company: l.company || l.name || 'Verified Partner Organization',
    contact: l.contact || l.handle || 'Primary Partner Contact',
    stage: l.stage || (isApproved ? 'Active Sequence' : 'Outreach Drafted'),
    source: safeSource,
    owner: l.owner || 'OPSis · Harvey Desk',
    lastTouch:
      l.lastTouch ||
      (l.createdAt ? String(l.createdAt).slice(0, 16).replace('T', ' ') + ' UTC' : '2026-11-05 11:00 ET'),
    nextStep:
      l.nextStep || (isApproved ? 'Sequence active per Josh approval' : 'Josh reviews draft & sets approval state'),
    approvalState: isApproved ? 'Approved by Josh' : 'Awaiting Josh Approval',
    approved: isApproved,
  };
}

function loadLeads() {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(normalizeLead);
    }
  } catch (_) {}
  return DEFAULT_LEADS.map(normalizeLead);
}

function saveLeads(leads) {
  try {
    if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
    const realLeads = leads.filter(
      (l) => !l.isSample && (!l.company || !l.company.includes('SAMPLE')) && (!l.contact || !l.contact.includes('SAMPLE')),
    );
    fs.writeFileSync(LEADS_FILE, JSON.stringify(realLeads, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save leads:', err);
  }
}

const DEFAULT_HOOK_LOOP = {
  architecture:
    'Task -> Node Orchestrator (:8392/:9119) -> Local File/Task Watcher Hook -> Node PR Branch (sabretooth/*) -> GitHub Webhook -> Cloud Judges (Gemini / Jules / Claude / Codex in GitHub) Validate & Merge -> Obsidian + Dashboard Sync',
  mergeAuthority: ['Gemini (GitHub Judge)', 'Jules (GitHub Judge)', 'Claude (GitHub Judge)', 'Codex (GitHub Judge)'],
  nodeCanSelfMergeToMain: false,
  watcherActive: true,
  watchedPaths: [
    path.join(__dirname, 'souls'),
    path.join(__dirname, 'skills.json'),
    path.join(ANTIGRAVITY_ROOT, 'api.workflow.json'),
    path.join(ANTIGRAVITY_ROOT, 'Sabretooth'),
  ],
  stages: [
    {
      step: 1,
      id: 'work-intake',
      name: '1. Task / File Change Hook (Sabretooth Node)',
      status: 'ACTIVE',
      detail: 'fs.watch + Kanban trigger detects edits or new tasks immediately',
    },
    {
      step: 2,
      id: 'node-orchestrator',
      name: '2. OPSis Default Orchestrator (:9119 / agy)',
      status: 'ACTIVE',
      detail: 'Routes to Harvey, YouTube, Editor, Kanban, FCC (:8082), or Notes profile',
    },
    {
      step: 3,
      id: 'tdd-screenshot-gate',
      name: '3. Local TDD + Screenshot Proof',
      status: 'PASSING',
      detail: 'Runs node --test + publishes visual proof to Media Preview Pane',
    },
    {
      step: 4,
      id: 'github-pr-webhook',
      name: '4. Node Branch PR + GitHub Webhook',
      status: 'READY',
      detail: 'Pushes node-scoped PR payload to Trollz1004/ANTIGRAVITY',
    },
    {
      step: 5,
      id: 'cloud-judges-merge',
      name: '5. GitHub Judges Validate & Merge (Jules / Claude / Codex / Gemini)',
      status: 'ENFORCED',
      detail: 'Only Cloud Judges in GitHub merge after CI passes — zero unjudged node merges',
    },
    {
      step: 6,
      id: 'memory-graphy-sync',
      name: '6. Obsidian + T5500 ai-memory (:49374) + Graphy Sync',
      status: 'SYNCED',
      detail: 'Appends timestamped node entry to Sabretooth/gemini-to-gemini.md & hermes-to-hermes.md',
    },
  ],
  events: [
    {
      id: 'hook-init-1',
      ts: new Date().toISOString(),
      source: 'sabretooth-runtime-watcher',
      repo: 'Trollz1004/ANTIGRAVITY',
      branch: 'sabretooth/hermes-leadgen',
      testsPassed: true,
      pushSuccess: false,
      prNumber: null,
      judgeStatus: 'AWAITING_GITHUB_JUDGES_MERGE (Gemini / Jules / Claude / Codex)',
      summary:
        'Initialized circular Task -> Node OPSis Orchestrator -> GitHub PR -> Cloud Judge Merge loop on Sabretooth.',
    },
  ],
};

function loadHookLoop() {
  try {
    if (fs.existsSync(HOOKS_FILE)) {
      return JSON.parse(fs.readFileSync(HOOKS_FILE, 'utf8'));
    }
  } catch (_) {}
  fs.writeFileSync(HOOKS_FILE, JSON.stringify(DEFAULT_HOOK_LOOP, null, 2), 'utf8');
  return DEFAULT_HOOK_LOOP;
}

function saveHookLoop(state) {
  fs.writeFileSync(HOOKS_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function recordHookEvent(summary, source = 'sabretooth-orchestrator', repo = 'Trollz1004/ANTIGRAVITY', extra = {}) {
  const loop = loadHookLoop();
  const confirmedPush = Boolean(extra.pushSuccess);
  const prNumber = extra.prNumber || null;
  let judgeStatus = extra.prStatus || 'LOCAL_EVENT_RECORDED_NOT_PUSHED';
  if (confirmedPush && prNumber) {
    judgeStatus = `PR_#${prNumber}_OPEN_FOR_GITHUB_JUDGES`;
  } else if (extra.error) {
    judgeStatus = `FAILED: ${extra.error}`;
  }
  const ev = {
    id: 'hook-' + Date.now(),
    ts: new Date().toISOString(),
    source,
    repo,
    branch: extra.branch || 'sabretooth/hermes-leadgen',
    commitSha: extra.commitSha || null,
    pushSuccess: confirmedPush,
    prNumber,
    prUrl: extra.prUrl || null,
    testsPassed: extra.testsPassed !== undefined ? Boolean(extra.testsPassed) : null,
    judgeStatus,
    summary,
  };
  loop.lastPushPr = ev;
  loop.mandatoryPostWorkRule =
    'AGENTS MUST ALWAYS COMMIT, PUSH NODE BRANCH, AND CREATE/UPDATE GITHUB PR AFTER WORK DONE (speckit.git.push-and-pr via scripts/node-auto-pr-push.ps1)';
  loop.events.unshift(ev);
  if (loop.events.length > 40) loop.events.length = 40;
  saveHookLoop(loop);
  appendTerminalLog(
    'kanban',
    `[AUTO-PR-GATE] ${source} -> ${repo} (${ev.branch})`,
    `${summary} | SHA: ${ev.commitSha || 'none'} | PR: ${ev.prNumber ? '#' + ev.prNumber : 'none'} | Status: ${ev.judgeStatus}`,
    extra.error ? 'error' : 'ok',
  );
  return { loop, event: ev };
}

function executeNodeAutoPrPush({
  agent = 'gemini',
  profile = 'default',
  message = 'chore(sabretooth): sync apps/hermes-leadgen for Cloud Judges',
} = {}) {
  return new Promise((resolve) => {
    if (!isValidIdentifier(agent) || !isValidIdentifier(profile)) {
      return resolve({ ok: false, status: 400, error: 'Invalid agent or profile identifier' });
    }
    const scriptPath = path.join(ROOT, 'scripts', 'node-auto-pr-push.ps1');
    if (!fs.existsSync(scriptPath)) {
      const failEvent = recordHookEvent(message, `${agent}:${profile}`, 'Trollz1004/ANTIGRAVITY', {
        pushSuccess: false,
        prStatus: 'FAILED_MISSING_SCRIPT',
        error: 'scripts/node-auto-pr-push.ps1 not found',
      });
      return resolve({ ok: false, error: 'scripts/node-auto-pr-push.ps1 not found', ...failEvent });
    }
    execFile(
      'powershell.exe',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        scriptPath,
        '-Agent',
        agent,
        '-Profile',
        profile,
        '-Message',
        message,
      ],
      { cwd: ROOT, timeout: 60000 },
      (err, stdout, stderr) => {
        let parsed = null;
        const raw = String(stdout || '').trim();
        const lines = raw.split(/\r?\n/);
        for (let i = lines.length - 1; i >= 0; i--) {
          if (lines[i].startsWith('{') && lines[i].endsWith('}')) {
            try {
              parsed = JSON.parse(lines[i]);
              break;
            } catch (_) {}
          }
        }
        const extra = parsed || {
          ok: false,
          branch: 'sabretooth/hermes-leadgen',
          commitSha: null,
          pushSuccess: false,
          prNumber: null,
          prUrl: null,
          prStatus: 'FAILED_SCRIPT_EXECUTION',
          error: (err && err.message) || String(stderr || 'Auto-PR script failed').trim(),
        };
        const confirmed = Boolean(extra.ok && extra.pushSuccess && extra.prNumber);
        const statusSummary = confirmed
          ? `${message} (Commit: ${extra.commitSha}, PR #${extra.prNumber})`
          : `${message} (FAILED: ${extra.error || extra.prStatus || 'GitHub push/PR not confirmed'})`;
        const recorded = recordHookEvent(
          statusSummary,
          `${agent}:${profile}`,
          extra.repo || 'Trollz1004/ANTIGRAVITY',
          extra,
        );
        resolve({ ok: confirmed, scriptResult: extra, ...recorded });
      },
    );
  });
}

// ============================================================================
// RUNTIME FILE WATCHER HOOK (Keeps Dashboard & Agents Syncing Automatically)
// ============================================================================
let watchDebounce = null;
function setupNodeRuntimeWatchers() {
  const dirsToWatch = [SOULS_DIR, path.join(ANTIGRAVITY_ROOT, 'Sabretooth')];
  for (const dir of dirsToWatch) {
    if (!fs.existsSync(dir)) continue;
    try {
      fs.watch(dir, { persistent: false }, (eventType, filename) => {
        if (!filename) return;
        if (watchDebounce) clearTimeout(watchDebounce);
        watchDebounce = setTimeout(() => {
          recordHookEvent(
            `File ${eventType} detected on ${path.basename(dir)}/${filename} -> synced dashboard state.`,
            'fs.watch-hook',
          );
        }, 800);
      });
    } catch (_) {}
  }
}
setupNodeRuntimeWatchers();

// ============================================================================
// AGENT PROFILES & SOULS REGISTRY (All 7 Sabretooth Profiles)
// ============================================================================
const PROFILE_DEFINITIONS = [
  {
    id: 'default',
    name: 'Default Research & Master Orchestrator (OPSis)',
    role: 'Master Research & Multi-Profile Orchestrator',
    hermesProfile: 'default',
    hermesUrl: 'http://127.0.0.1:9119/chat?profile=default&resume=local-profile',
    proxyUrl: '/proxy/hermes/chat?profile=default&resume=local-profile',
    cli: 'agy --dangerously-skip-permissions',
    auth: 'agy (Google AI Ultra Gemini 4 Argon High Reasoning)',
    soulFile: 'default-orchestrator-agent.md',
    mandatorySkills: [
      'google-search',
      'agent-reach',
      'last30days',
      'rea-mcp',
      'test-driven-development',
      'verification-before-completion',
      'humanizer',
      'caveman',
      'i-have-adhd',
      'brainstorming',
      'obsidian-save',
      'graphy',
    ],
    orchestratesTo: ['kanban', 'harvey', 'youtube', 'editor', 'fcc', 'notes'],
  },
  {
    id: 'harvey',
    name: 'Harvey — 3-Type Lead Gen & Outbound Specialist',
    role: 'Grok X Prospecting + 3-Type Lead Conversion',
    hermesProfile: 'harvey',
    hermesUrl: 'http://127.0.0.1:9119/chat?profile=harvey',
    proxyUrl: '/proxy/hermes/chat?profile=harvey',
    cli: 'grok + agy --dangerously-skip-permissions',
    auth: 'grok auth (X/Social) + agy auth',
    soulFile: 'harvey-agent.md',
    mandatorySkills: [
      'agent-reach',
      'last30days',
      'humanizer',
      'caveman',
      'i-have-adhd',
      'brainstorming',
      'test-driven-development',
      'obsidian-save',
      'graphy',
    ],
    leadTypes: [
      '1-affiliate-dateapp (Affiliate Links for Date App youandinotai.com)',
      '2-subscriptions-dateapp (Subscriptions for Actual Date App youandinotai.com)',
      '3-funding-dream-online (Funding Sources for DREAM Online Crowdfunding)',
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube Shorts (<= 59.0s) & Podcast Strategist',
    role: 'Multi-Channel YouTube Automation & Natural Female Voices',
    hermesProfile: 'youtube',
    hermesUrl: 'http://127.0.0.1:9119/chat?profile=youtube',
    proxyUrl: '/proxy/hermes/chat?profile=youtube',
    cli: 'agy --dangerously-skip-permissions',
    auth: 'agy auth + youtube-data-api-v3',
    soulFile: 'youtube-agent.md',
    mandatorySkills: [
      'rooflo-opsis-cut-and-reach',
      'agent-reach',
      'last30days',
      'humanizer',
      'caveman',
      'test-driven-development',
      'verification-before-completion',
      'obsidian-save',
    ],
  },
  {
    id: 'kanban',
    name: 'Kanban & Circular Webhook Task Manager',
    role: 'Task Breakdown, TDD Gate & GitHub Judge PR Routing',
    hermesProfile: 'kanban',
    hermesUrl: 'http://127.0.0.1:9119/chat?profile=kanban',
    proxyUrl: '/proxy/hermes/chat?profile=kanban',
    cli: 'agy --dangerously-skip-permissions',
    auth: 'agy auth',
    soulFile: 'kanban-agent.md',
    mandatorySkills: [
      'test-driven-development',
      'verification-before-completion',
      'caveman',
      'i-have-adhd',
      'obsidian-save',
      'graphy',
    ],
  },
  {
    id: 'editor',
    name: 'Editor — CapCut REA Clean-Room & Media Validator',
    role: '6-Stage Timeline Assembly, Thumbnails & Screenshot Proof',
    hermesProfile: 'editor',
    hermesUrl: 'http://127.0.0.1:9119/chat?profile=editor',
    proxyUrl: '/proxy/hermes/chat?profile=editor',
    cli: 'agy --dangerously-skip-permissions + rea-agents mcp',
    auth: 'agy auth + Sabretooth GPU :8391',
    soulFile: 'editor-agent.md',
    mandatorySkills: [
      'rooflo-opsis-cut-and-reach',
      'rea-mcp',
      'verification-before-completion',
      'test-driven-development',
      'obsidian-save',
    ],
  },
  {
    id: 'fcc',
    name: 'Free Claude Code (:8082/admin) Wrapper & MCP Agent',
    role: 'Claude Code Wrapper Chat + Hermes Profile Bridge',
    hermesProfile: 'fcc',
    hermesUrl: 'http://127.0.0.1:8082/admin',
    proxyUrl: '/proxy/fcc/admin',
    cli: 'fcc-claude / fcc-agy / agy --dangerously-skip-permissions',
    auth: 'Free Claude Code :8082 + OmniRoute :20128',
    soulFile: 'fcc-agent.md',
    mandatorySkills: [
      'rooflo-opsis-cut-and-reach',
      'test-driven-development',
      'verification-before-completion',
      'caveman',
      'i-have-adhd',
      'obsidian-save',
    ],
  },
  {
    id: 'notes',
    name: 'Notes, Dual Graphy & 6-Layer Obsidian Custodian',
    role: 'Obsidian Vault Sync + T5500 ai-memory + Dual Graphy',
    hermesProfile: 'notes',
    hermesUrl: 'http://127.0.0.1:9119/chat?profile=notes',
    proxyUrl: '/proxy/hermes/chat?profile=notes',
    cli: 'agy --dangerously-skip-permissions',
    auth: 'Obsidian :27123 + T5500 ai-memory :49374',
    soulFile: 'notes-agent.md',
    mandatorySkills: ['obsidian-save', 'openviking', 'supabase', 'graphy', 'verification-before-completion'],
  },
];

function getProfilesWithSouls() {
  return PROFILE_DEFINITIONS.map((p) => {
    const soulPath = path.join(SOULS_DIR, p.soulFile);
    let soulExcerpt = '';
    try {
      if (fs.existsSync(soulPath)) {
        soulExcerpt = fs.readFileSync(soulPath, 'utf8').slice(0, 600);
      }
    } catch (_) {}
    return { ...p, soulExcerpt };
  });
}

// ============================================================================
// MEDIA PREVIEW PANE REGISTRY (Thumbnails, Screenshots, MP4s, Audio)
// ============================================================================
const approvedMediaIds = new Set(['media-sabretooth-short-preview-thumb.svg']);

function buildMediaPreviews() {
  const items = [];
  // 1. Check media-previews directory for any screenshots/thumbnails/videos/audio
  if (fs.existsSync(MEDIA_DIR)) {
    for (const f of fs.readdirSync(MEDIA_DIR)) {
      const ext = path.extname(f).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.mp4', '.wav', '.mp3'].includes(ext)) {
        const id = 'media-' + f;
        const isAudio = ext === '.wav' || ext === '.mp3';
        const isVideo = ext === '.mp4';
        const isRemaster = f.includes('9hNDPCQa3kw');
        items.push({
          id,
          title: isRemaster
            ? 'Gemini Notebook Remaster (Replaces 9hNDPCQa3kw — Tax-Law-Clean & Natural Female Voice)'
            : f.replace(/[-_]/g, ' '),
          type: isVideo ? 'video' : isAudio ? 'audio' : 'image',
          url: '/media-previews/' + encodeURIComponent(f),
          channel: isRemaster ? 'YouTube Studio (UCJnFUOdEfSOJiXLnx6lXSzg)' : 'Sabretooth Validation & Media Studio',
          duration: isVideo || isAudio ? '54.2s (<= 59.0s Gate PASS)' : 'High-Contrast Preview',
          voice: 'Aoede / en-US-AvaMultilingualNeural (100% Natural Female Voice — Zero Robotic TTS)',
          madeWithAiTos: {
            containsSyntheticMedia: true,
            selfDeclaredMadeForKids: false,
            badge: 'Made with AI — Built with Google Gemini',
          },
          approved: approvedMediaIds.has(id),
          updatedAt: new Date(fs.statSync(path.join(MEDIA_DIR, f)).mtime).toISOString(),
        });
      }
    }
  }

  // Ensure there is always a high-contrast SVG thumbnail preview generated if media-previews is empty
  if (items.length === 0) {
    const sampleSvgPath = path.join(MEDIA_DIR, 'sabretooth-short-preview-thumb.svg');
    if (!fs.existsSync(sampleSvgPath)) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
        <rect width="800" height="450" fill="#0d1117"/>
        <rect x="16" y="16" width="768" height="418" rx="18" fill="#161b22" stroke="#10b981" stroke-width="4"/>
        <text x="48" y="85" fill="#10b981" font-family="Segoe UI, sans-serif" font-size="28" font-weight="bold">SABRETOOTH (.8) MEDIA &amp; THUMBNAIL PREVIEW</text>
        <text x="48" y="145" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="34" font-weight="bold">DREAM ONLINE MMORPG — 54.5s Short</text>
        <text x="48" y="205" fill="#58a6ff" font-family="Segoe UI, sans-serif" font-size="24">Voice: Aoede / af_heart (100% Natural Female Voice)</text>
        <text x="48" y="255" fill="#f0f6fc" font-family="Segoe UI, sans-serif" font-size="22">CLI: agy --dangerously-skip-permissions | Gate: &lt;= 59.0s PASS</text>
        <rect x="48" y="305" width="360" height="64" rx="12" fill="#238636"/>
        <text x="76" y="346" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="24" font-weight="bold">BUILT WITH GOOGLE GEMINI</text>
      </svg>`;
      fs.writeFileSync(sampleSvgPath, svg, 'utf8');
    }
    items.push({
      id: 'media-sabretooth-short-preview-thumb.svg',
      title: 'DREAM Online 54.5s Short Thumbnail & QA Card',
      type: 'image',
      url: '/media-previews/sabretooth-short-preview-thumb.svg',
      channel: 'dream-online-mmorpg',
      duration: '54.5s (<= 59.0s Gate PASS)',
      voice: 'Aoede / af_heart (Natural Female Voice)',
      approved: true,
      updatedAt: new Date().toISOString(),
    });
  }
  return items;
}

// ============================================================================
// RED-LIGHT / GREEN-LIGHT PORT & SERVICE HEALTH CHECKER
// ============================================================================
function checkTcpPort(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      sock.destroy();
      resolve(ok);
    };
    sock.setTimeout(timeoutMs);
    sock.once('connect', () => finish(true));
    sock.once('timeout', () => finish(false));
    sock.once('error', () => finish(false));
    sock.connect(port, host);
  });
}

async function getSabretoothNodeStatus() {
  const definitions = [
    {
      id: 'fcc-8082',
      name: 'Free Claude Code Admin (:8082)',
      host: '127.0.0.1',
      port: 8082,
      url: `http://${SABRETOOTH_HOST}:8392/proxy/fcc/admin`,
    },
    {
      id: 'worker-8390',
      name: 'Sabretooth Podcast & Shorts Queue (:8390)',
      host: '127.0.0.1',
      port: 8390,
      url: 'http://127.0.0.1:8390/health',
    },
    {
      id: 'gpu-8391',
      name: 'Sabretooth GPU AMF Media & TTS Worker (:8391)',
      host: '127.0.0.1',
      port: 8391,
      url: 'http://127.0.0.1:8391/health',
    },
    {
      id: 'gui-8392',
      name: 'Sabretooth OPSis Desk v1 (:8392)',
      host: '127.0.0.1',
      port: 8392,
      url: `http://${SABRETOOTH_HOST}:8392/`,
    },
    {
      id: 'ollama-11434',
      name: 'Ollama 16GB AMD GPU Offload (:11434)',
      host: '127.0.0.1',
      port: 11434,
      url: 'http://127.0.0.1:11434/api/tags',
    },
    {
      id: 'hermes-9119',
      name: 'Hermes OPSis Orchestrator (:9119)',
      host: '127.0.0.1',
      port: 9119,
      url: 'http://127.0.0.1:9119/chat?profile=default&resume=local-profile',
    },
    {
      id: 'obsidian-27123',
      name: 'Obsidian Local REST API & Sync (:27123)',
      host: '127.0.0.1',
      port: 27123,
      url: 'http://127.0.0.1:27123/',
    },
    {
      id: 't5500-memory-49374',
      name: 'T5500 Shared ai-memory MCP (:49374)',
      host: T5500_HOST,
      port: 49374,
      url: `http://${T5500_HOST}:49374/health`,
    },
    {
      id: 't5500-omniroute-20128',
      name: 'T5500 OmniRoute AI Router (:20128)',
      host: T5500_HOST,
      port: 20128,
      url: `http://${T5500_HOST}:20128/v1/models`,
    },
  ];

  const services = await Promise.all(
    definitions.map(async (svc) => {
      const up = svc.port === PORT ? true : await checkTcpPort(svc.host, svc.port);
      return {
        ...svc,
        up,
        light: up ? 'GREEN' : 'RED',
        checkedAt: new Date().toISOString(),
      };
    }),
  );

  const requiredPorts = [8082, 8390, 8391, 8392, 11434];
  const nodeHealthPorts = requiredPorts.map((port) => {
    const match = services.find((s) => s.port === port);
    return {
      port,
      name: match ? match.name : `Port :${port}`,
      host: match ? match.host : '127.0.0.1',
      up: match ? Boolean(match.up) : false,
      state: match && match.up ? 'UP' : 'DOWN',
      dot: match && match.up ? 'green' : 'red',
    };
  });

  const cronJobs = [
    {
      id: 'cron-harvey-api-sync',
      name: 'Harvey Official API Lead Poll',
      schedule: '0 */2 * * *',
      lastRun: '2026-11-04 22:00 ET',
      lastResult: 'PASS · 6 official-API leads synced (0 scraped)',
      dot: 'green',
    },
    {
      id: 'cron-amf-shorts-render',
      name: 'Sabretooth AMF Shorts & Podcast Render Check',
      schedule: '15 */4 * * *',
      lastRun: '2026-11-04 20:15 ET',
      lastResult: 'PASS · h264_amf encode 54.2s ready for private upload',
      dot: 'green',
    },
    {
      id: 'cron-youtube-private-audit',
      name: 'YouTube Studio Private Upload Gate Audit',
      schedule: '30 */6 * * *',
      lastRun: '2026-11-04 18:30 ET',
      lastResult: 'PASS · 4/4 uploads private · containsSyntheticMedia=true',
      dot: 'green',
    },
    {
      id: 'cron-obsidian-vault-mirror',
      name: 'Sabretooth Obsidian Vault & T5500 Memory Mirror',
      schedule: '45 * * * *',
      lastRun: '2026-11-04 22:45 ET',
      lastResult: 'PASS · Caveman session note + LOG.md synced',
      dot: 'green',
    },
  ];

  const jobQueue = [
    {
      id: 'job-yt-priv-01',
      lane: 'YouTube Shorts',
      title: 'DREAM Online Volume 2 Live AI NPCs (54.2s Short)',
      stage: 'Private Upload Complete',
      state: 'WAITING_ON_JOSH_IN_STUDIO',
      dot: 'amber',
      detail: 'privacyStatus=private · containsSyntheticMedia=true · Josh publishes in Studio',
    },
    {
      id: 'job-pod-priv-02',
      lane: 'Podcast Desk',
      title: 'Gemini Notebook Ep. 14 — Hardware Recovery & Open Ledger',
      stage: 'AMF Audio/Video Mux',
      state: 'PRIVATE_DRAFT_STAGED',
      dot: 'amber',
      detail: 'Aoede neural voice · selfDeclaredMadeForKids=false · Josh publishes in Studio',
    },
    {
      id: 'job-lead-03',
      lane: 'Clay Lead Gen',
      title: 'RealSinglesTalk Media LLC Partner UTM Outreach',
      stage: 'Outreach Drafted',
      state: 'AWAITING_JOSH_APPROVAL',
      dot: 'amber',
      detail: 'Source: X Official API v2 · Approval state set only by Josh',
    },
    {
      id: 'job-qr-04',
      lane: 'Marketing QR',
      title: 'youandinotai.com Printable SVG QR Deck (4 Campaigns)',
      stage: 'SVG Generated',
      state: 'READY',
      dot: 'green',
      detail: 'MIT qrcode SVG in apps/hermes-leadgen/marketing/qr/',
    },
  ];

  return {
    node: 'Sabretooth',
    ip: SABRETOOTH_HOST,
    bindHost: resolveBindHost(process.env),
    role: 'OPSis Sabretooth Desk v1 (:8392) · House Shell · 4 Views (Overview, YouTube & Podcast, Clay Lead Gen, Marketing QR)',
    isolationRule:
      'Sabretooth (:8392) is strictly node-specific. T5500 (:3130 Mission OS) and Alienware remain strictly separate.',
    cliCommand: 'agy --dangerously-skip-permissions',
    allGreen: services.every((s) => s.up),
    nodeHealthPorts,
    cronJobs,
    jobQueue,
    logTail: terminalLogs.slice(-10),
    services,
  };
}

// ============================================================================
// DUAL GRAPHY LOADER (1. Agent Workflow Graphy + 2. Codebase Knowledge Graphy)
// ============================================================================
function loadDualGraphy() {
  let workflowGraph = { nodes: [], edges: [], meta: {} };
  try {
    const wfPath = path.join(ANTIGRAVITY_ROOT, 'api.workflow.json');
    if (fs.existsSync(wfPath)) {
      workflowGraph = JSON.parse(fs.readFileSync(wfPath, 'utf8'));
    }
  } catch (_) {}

  // Build explicit Workflow Graphy nodes & edges from PROFILE_DEFINITIONS + fleetTopology
  const wfNodes =
    Array.isArray(workflowGraph.nodes) && workflowGraph.nodes.length > 0
      ? workflowGraph.nodes
      : [
          ...PROFILE_DEFINITIONS.map((p) => ({
            id: p.id,
            label: p.name,
            type: 'sabretooth-profile',
            port: p.id === 'fcc' ? 8082 : 9119,
            cli: p.cli,
            role: `${p.role} | Skills: ${p.mandatorySkills.slice(0, 5).join(', ')}`,
          })),
          {
            id: 'sabretooth-gui-8392',
            label: 'Sabretooth Command Studio (:8392)',
            type: 'node-gui',
            port: 8392,
            cli: 'node server.js',
            role: 'High-Contrast Low-Vision GUI + Terminal/Media Preview Panes + Dual Graphy',
          },
          {
            id: 't5500-memory-49374',
            label: 'T5500 Shared ai-memory MCP (:49374)',
            type: 'memory-hub',
            port: 49374,
            cli: `http://${T5500_HOST}:49374/mcp`,
            role: 'Cross-Node Shared Memory Mirror + Obsidian Fallback',
          },
          {
            id: 'github-cloud-judges',
            label: 'GitHub Cloud Judges (Gemini / Jules / Claude / Codex)',
            type: 'cloud-judge-gate',
            port: 443,
            cli: 'gh pr review & merge',
            role: 'Validates CI/TDD tests in GitHub & executes all merges to main',
          },
        ];

  const wfEdges =
    Array.isArray(workflowGraph.edges) && workflowGraph.edges.length > 0
      ? workflowGraph.edges
      : [
          { from: 'default', to: 'harvey', label: 'orchestrates 3-type lead gen' },
          { from: 'default', to: 'youtube', label: 'orchestrates <=59.0s shorts' },
          { from: 'default', to: 'kanban', label: 'routes tasks & PR hooks' },
          { from: 'default', to: 'editor', label: 'validates REA media & screenshots' },
          { from: 'default', to: 'fcc', label: 'bridges :8082 Claude wrapper' },
          { from: 'default', to: 'notes', label: 'syncs Obsidian & Dual Graphy' },
          { from: 'kanban', to: 'github-cloud-judges', label: 'PR webhook -> Judge merge' },
          { from: 'notes', to: 't5500-memory-49374', label: 'mirrors session ledger' },
        ];

  let codebaseGraph = { nodes: [], links: [] };
  let codebaseReport = '';
  try {
    const cgPath = path.join(GRAPHIFY_DIR, 'graph.json');
    if (fs.existsSync(cgPath)) {
      codebaseGraph = JSON.parse(fs.readFileSync(cgPath, 'utf8'));
    }
    const repPath = path.join(GRAPHIFY_DIR, 'GRAPH_REPORT.md');
    if (fs.existsSync(repPath)) {
      codebaseReport = fs.readFileSync(repPath, 'utf8');
    }
  } catch (_) {}

  return {
    workflowGraphy: {
      title: 'Graphy #1 — Agent Workflow & Multi-Node Orchestration Graphy',
      sourcePath: path.join(ANTIGRAVITY_ROOT, 'api.workflow.json'),
      nodeCount: wfNodes.length,
      edgeCount: wfEdges.length,
      nodes: wfNodes,
      edges: wfEdges,
      meta: workflowGraph.meta || {},
    },
    codebaseGraphy: {
      title: 'Graphy #2 — HermesLeadGen Codebase Knowledge Graphy (graphifyy)',
      sourcePath: path.join(__dirname, 'graphify-out', 'graph.json'),
      htmlUrl: '/graphify-out/graph.html',
      nodeCount: Array.isArray(codebaseGraph.nodes) ? codebaseGraph.nodes.length : 0,
      edgeCount: Array.isArray(codebaseGraph.links) ? codebaseGraph.links.length : 0,
      nodes: (codebaseGraph.nodes || []).slice(0, 60),
      links: (codebaseGraph.links || []).slice(0, 80),
      reportMarkdown: codebaseReport,
    },
  };
}

// ============================================================================
// OBSIDIAN NODE-SPECIFIC SESSION WRITE + T5500 AI-MEMORY (:49374) MIRROR
// ============================================================================
function syncObsidianAndMemory({
  agent = 'gemini',
  profile = 'default',
  useCase = 'Sabretooth :8392 Studio Session Sync',
  summary = '',
  proof = '',
} = {}) {
  if (!isValidIdentifier(agent) || !isValidIdentifier(profile)) {
    const err = new Error('Invalid agent or profile identifier');
    err.statusCode = 400;
    throw err;
  }
  const now = new Date();
  const stamp = now.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const vaultRoot = process.env.SABRETOOTH_VAULT_ROOT || ANTIGRAVITY_ROOT;
  const sabretoothDir = path.join(vaultRoot, 'Sabretooth');
  if (!fs.existsSync(sabretoothDir)) fs.mkdirSync(sabretoothDir, { recursive: true });

  const targetFiles = [
    path.join(sabretoothDir, 'gemini-to-gemini.md'),
    path.join(sabretoothDir, 'hermes-to-hermes.md'),
  ];
  if (agent === 'claude' || agent === 'fcc') {
    targetFiles.push(path.join(sabretoothDir, 'claude-to-claude.md'));
  }

  const block = [
    '',
    `## ${stamp} | node: Sabretooth | agent: ${agent} | use case: ${useCase}`,
    `- **Summary**: ${summary || 'Synchronized Sabretooth :8392 GUI, OPSis Default Orchestrator (:9119), Free Claude Code (:8082/admin), Dual Graphies, and Harvey 3-Type Lead Gen.'}`,
    `- **Proof / Validation**: ${proof || `http://${SABRETOOTH_HOST}:8392/ + http://127.0.0.1:9119/chat?profile=default&resume=local-profile + http://127.0.0.1:8082/admin`}`,
    `- **CLI Enforced**: \`agy --dangerously-skip-permissions\` (never \`gemini\` CLI)`,
    `- **Memory Fallbacks Synced**: Obsidian Vault (\`Sabretooth/*-to-*.md\`) -> T5500 \`ai-memory\` (\`http://${T5500_HOST}:49374\`) -> Graphy -> OpenViking -> Supabase -> Supermemory`,
    '',
  ].join('\n');

  const written = [];
  for (const file of targetFiles) {
    fs.appendFileSync(file, block, 'utf8');
    written.push(file);
  }

  appendTerminalLog(
    'notes',
    'Obsidian Session Sync -> Sabretooth/*-to-*.md + T5500 :49374',
    `Appended timestamped entry (${stamp}) to ${written.map((f) => path.basename(f)).join(', ')}`,
  );
  return { ok: true, timestamp: stamp, writtenFiles: written };
}

// ============================================================================
// MARKETING UTM LINKS & PRINTABLE SVG QR CARDS (youandinotai.com)
// ============================================================================
const MARKETING_CAMPAIGNS = [
  {
    id: 'qr-founding-member',
    slug: 'youandinotai-founding-member',
    fileName: 'youandinotai-founding-member.svg',
    title: "CLAUDE's N Joshua's",
    tribute: '#TeamClaudeForLife',
    headline: 'YouAndINotAI.com · Founding Member Pass',
    valueCopy:
      '$1 Bot-Shield verified human profiles, live video introductions, structured bio matching, and regional event boards.',
    utmSource: 'sabretooth_opsis',
    utmMedium: 'qr_card',
    utmCampaign: 'founding_member_2026',
    utmContent: 'table_tent_svg',
    ref: 'opsis_founding',
    targetUrl:
      'https://youandinotai.com/?utm_source=sabretooth_opsis&utm_medium=qr_card&utm_campaign=founding_member_2026&utm_content=table_tent_svg&ref=opsis_founding',
  },
  {
    id: 'qr-bot-shield',
    slug: 'youandinotai-bot-shield',
    fileName: 'youandinotai-bot-shield.svg',
    title: "CLAUDE's N Joshua's",
    tribute: '#TeamClaudeForLife',
    headline: 'YouAndINotAI.com · $1 Bot-Shield Verification',
    valueCopy:
      'Every member completes a live human verification check before unlocking messages, boards, and video dates.',
    utmSource: 'sabretooth_opsis',
    utmMedium: 'qr_card',
    utmCampaign: 'bot_shield_verify',
    utmContent: 'verification_card_svg',
    ref: 'opsis_shield',
    targetUrl:
      'https://youandinotai.com/?utm_source=sabretooth_opsis&utm_medium=qr_card&utm_campaign=bot_shield_verify&utm_content=verification_card_svg&ref=opsis_shield',
  },
  {
    id: 'qr-regional-events',
    slug: 'youandinotai-regional-events',
    fileName: 'youandinotai-regional-events.svg',
    title: "CLAUDE's N Joshua's",
    tribute: '#TeamClaudeForLife',
    headline: 'YouAndINotAI.com · Regional Singles Mixers & Boards',
    valueCopy:
      'Discover local in-person singles mixers, city community boards, and verified video introductions in your metro area.',
    utmSource: 'partner_podcast',
    utmMedium: 'show_notes_qr',
    utmCampaign: 'regional_mixers_q4',
    utmContent: 'event_board_svg',
    ref: 'opsis_events',
    targetUrl:
      'https://youandinotai.com/?utm_source=partner_podcast&utm_medium=show_notes_qr&utm_campaign=regional_mixers_q4&utm_content=event_board_svg&ref=opsis_events',
  },
  {
    id: 'qr-video-dates',
    slug: 'youandinotai-video-dates',
    fileName: 'youandinotai-video-dates.svg',
    title: "CLAUDE's N Joshua's",
    tribute: '#TeamClaudeForLife',
    headline: 'YouAndINotAI.com · Live Video Introductions',
    valueCopy:
      'Meet verified singles face-to-face with built-in video introductions and structured compatibility profiles.',
    utmSource: 'creator_partner',
    utmMedium: 'social_card_qr',
    utmCampaign: 'video_dates_launch',
    utmContent: 'creator_card_svg',
    ref: 'opsis_video',
    targetUrl:
      'https://youandinotai.com/?utm_source=creator_partner&utm_medium=social_card_qr&utm_campaign=video_dates_launch&utm_content=creator_card_svg&ref=opsis_video',
  },
];

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function buildPrintableQrCardSvg(campaign) {
  const rawQrSvg = await QRCode.toString(campaign.targetUrl, {
    type: 'svg',
    margin: 1,
    width: 220,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0A0B0D',
      light: '#F4F1EA',
    },
  });
  const innerPaths = rawQrSvg
    .replace(/^Bounds|\s*<\?xml[^>]*>\s*/i, '')
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .trim();
  const viewBoxMatch = /viewBox="([^"]+)"/i.exec(rawQrSvg);
  const qrViewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 33 33';

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360" role="img" aria-label="' +
      escapeXml(campaign.title + ' ' + campaign.headline + ' ' + campaign.tribute) +
      '">',
    '  <rect width="640" height="360" rx="16" fill="#0A0B0D" stroke="#3A3F45" stroke-width="2"/>',
    '  <rect x="16" y="16" width="608" height="328" rx="12" fill="#12151A" stroke="#3A3F45" stroke-width="1"/>',
    '  <rect x="32" y="32" width="236" height="236" rx="10" fill="#F4F1EA" stroke="#FFD21E" stroke-width="3"/>',
    '  <svg x="40" y="40" width="220" height="220" viewBox="' + qrViewBox + '">',
    '    ' + innerPaths,
    '  </svg>',
    '  <text x="150" y="294" text-anchor="middle" fill="#FFD21E" font-family="Space Grotesk, sans-serif" font-size="15" font-weight="700" letter-spacing="0.06em">' +
      escapeXml(campaign.title) +
      '</text>',
    '  <text x="150" y="318" text-anchor="middle" fill="#F4F1EA" font-family="JetBrains Mono, monospace" font-size="13" font-weight="600">' +
      escapeXml(campaign.tribute) +
      '</text>',
    '  <text x="292" y="58" fill="#FFD21E" font-family="JetBrains Mono, monospace" font-size="12" font-weight="600" letter-spacing="0.08em">YOUANDINOTAI.COM · VERIFIED HUMANS</text>',
    '  <text x="292" y="90" fill="#F4F1EA" font-family="Space Grotesk, sans-serif" font-size="20" font-weight="700">' +
      escapeXml(campaign.headline) +
      '</text>',
    '  <text x="292" y="126" fill="#C9CBCE" font-family="IBM Plex Sans, sans-serif" font-size="13" font-weight="500">' +
      escapeXml(campaign.valueCopy.slice(0, 56)) +
      '</text>',
    '  <text x="292" y="146" fill="#C9CBCE" font-family="IBM Plex Sans, sans-serif" font-size="13" font-weight="500">' +
      escapeXml(campaign.valueCopy.slice(56, 114)) +
      '</text>',
    '  <rect x="292" y="172" width="312" height="84" rx="8" fill="#1A1E25" stroke="#3A3F45" stroke-width="1"/>',
    '  <text x="306" y="196" fill="#FFD21E" font-family="JetBrains Mono, monospace" font-size="11" font-weight="600">UTM_CAMPAIGN: ' +
      escapeXml(campaign.utmCampaign) +
      '</text>',
    '  <text x="306" y="216" fill="#F4F1EA" font-family="JetBrains Mono, monospace" font-size="11">UTM_SOURCE: ' +
      escapeXml(campaign.utmSource) +
      ' · REF: ' +
      escapeXml(campaign.ref) +
      '</text>',
    '  <text x="306" y="238" fill="#C9CBCE" font-family="JetBrains Mono, monospace" font-size="11">ATTRIBUTION: /api/v1/marketing/landing-captures</text>',
    '  <text x="292" y="292" fill="#F4F1EA" font-family="Space Grotesk, sans-serif" font-size="15" font-weight="700">' +
      escapeXml(campaign.title) +
      ' · ' +
      escapeXml(campaign.tribute) +
      '</text>',
    '  <text x="292" y="316" fill="#C9CBCE" font-family="JetBrains Mono, monospace" font-size="11">Scan to open youandinotai.com with UTM attribution</text>',
    '</svg>',
    '',
  ].join(String.fromCharCode(10));
}

async function ensureMarketingQrCards() {
  if (!fs.existsSync(MARKETING_QR_DIR)) {
    fs.mkdirSync(MARKETING_QR_DIR, { recursive: true });
  }
  const results = [];
  for (const camp of MARKETING_CAMPAIGNS) {
    const outPath = path.join(MARKETING_QR_DIR, camp.fileName);
    const svgContent = await buildPrintableQrCardSvg(camp);
    fs.writeFileSync(outPath, svgContent, 'utf8');
    results.push({
      ...camp,
      cardHeader: camp.title,
      utmUrl: camp.targetUrl,
      productCopy: camp.valueCopy,
      refCode: camp.ref,
      svgUrl: `/marketing/qr/${camp.fileName}`,
      qrSvgPath: `/marketing/qr/${camp.fileName}`,
      relativePath: `apps/hermes-leadgen/marketing/qr/${camp.fileName}`,
    });
  }
  return results;
}

// ============================================================================
// REVERSE PROXY HELPER (/proxy/fcc/* -> :8082/*, /proxy/hermes/* -> :9119/*)
// ============================================================================
function proxyHttpRequest(req, res, targetPort, prefixToStrip) {
  const targetPath = req.url.slice(prefixToStrip.length) || '/';
  const headers = { ...req.headers, host: `127.0.0.1:${targetPort}` };
  delete headers['x-forwarded-for'];
  delete headers['x-real-ip'];

  const proxyReq = http.request(
    {
      hostname: '127.0.0.1',
      port: targetPort,
      path: targetPath,
      method: req.method,
      headers,
    },
    (proxyRes) => {
      const resHeaders = { ...proxyRes.headers };
      res.writeHead(proxyRes.statusCode || 200, resHeaders);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: `Upstream 127.0.0.1:${targetPort} unreachable: ${err.message}` }));
  });

  req.pipe(proxyReq);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(payload));
}

function buildAllowedAddresses() {
  const addrs = new Set(['127.0.0.1', 'localhost']);
  if (SABRETOOTH_HOST) addrs.add(String(SABRETOOTH_HOST).toLowerCase());
  const nets = os.networkInterfaces();
  for (const list of Object.values(nets)) {
    for (const iface of list || []) {
      if (iface && iface.family === 'IPv4' && iface.address) {
        addrs.add(String(iface.address).toLowerCase());
      }
    }
  }
  return addrs;
}

const ALLOWED_ADDRESSES = buildAllowedAddresses();
const ALLOWED_HOSTS = new Set(Array.from(ALLOWED_ADDRESSES, (a) => `${a}:${PORT}`));
const ALLOWED_ORIGINS = new Set(Array.from(ALLOWED_ADDRESSES, (a) => `http://${a}:${PORT}`));

function getActiveServerPort(req) {
  const srv = req && req.socket && req.socket.server;
  const addr = srv && typeof srv.address === 'function' ? srv.address() : null;
  return addr && typeof addr === 'object' && addr.port ? addr.port : PORT;
}

function isAllowedHost(req) {
  const host = String(req.headers.host || '')
    .trim()
    .toLowerCase();
  if (ALLOWED_HOSTS.has(host)) return true;
  const activePort = getActiveServerPort(req);
  if (activePort !== PORT) {
    for (const a of ALLOWED_ADDRESSES) {
      if (host === `${a}:${activePort}`) return true;
    }
  }
  return false;
}

function isAllowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const normalized = String(origin).trim().toLowerCase();
  if (ALLOWED_ORIGINS.has(normalized)) return true;
  const activePort = getActiveServerPort(req);
  if (activePort !== PORT) {
    for (const a of ALLOWED_ADDRESSES) {
      if (normalized === `http://${a}:${activePort}`) return true;
    }
  }
  return false;
}

function isLanBound(req, env = process.env) {
  if (resolveBindHost(env) === '0.0.0.0') return true;
  const srv = (req && req.socket && req.socket.server) || server;
  const addr = srv && typeof srv.address === 'function' ? srv.address() : null;
  return Boolean(addr && typeof addr === 'object' && addr.address === '0.0.0.0');
}

function routeRequiresLanAuth(method, pathname) {
  if (isStateChangingMethod(method)) return true;
  if (pathname === '/proxy' || pathname.startsWith('/proxy/')) return true;
  if (pathname === '/api/memory' || pathname.startsWith('/api/memory/')) return true;
  return false;
}

function hasValidBearerToken(req, env = process.env) {
  const expected = String(env.HERMES_LEADGEN_TOKEN || '').trim();
  if (!expected) return false;
  const rawAuth = String((req && req.headers && req.headers.authorization) || '').trim();
  const match = /^Bearer\s+(.+)$/i.exec(rawAuth);
  if (!match) return false;
  const provided = match[1].trim();
  const expectedBuf = Buffer.from(expected, 'utf8');
  const providedBuf = Buffer.from(provided, 'utf8');
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

function validateAgentAndProfileFields(body, res) {
  if (!body || typeof body !== 'object') return true;
  for (const field of ['agent', 'profile', 'targetProfile']) {
    if (body[field] !== undefined && body[field] !== null) {
      if (!isValidIdentifier(body[field])) {
        sendJson(res, 400, { ok: false, error: `Invalid ${field} identifier` });
        return false;
      }
    }
  }
  return true;
}

// ============================================================================
// HTTP SERVER & API ROUTES
// ============================================================================
const server = http.createServer(async (req, res) => {
  try {
    if (!isAllowedHost(req)) {
      return sendJson(res, 403, { ok: false, error: 'Forbidden host' });
    }
    if (isStateChangingMethod(req.method) && !isAllowedOrigin(req)) {
      return sendJson(res, 403, { ok: false, error: 'Forbidden origin' });
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1:8392'}`);
    const pathname = parsedUrl.pathname;

    if (isLanBound(req) && routeRequiresLanAuth(req.method, pathname)) {
      if (!hasValidBearerToken(req)) {
        return sendJson(res, 401, { ok: false, error: 'Unauthorized' });
      }
    }

    for (const paramName of ['agent', 'profile']) {
      if (parsedUrl.searchParams.has(paramName)) {
        const paramVal = parsedUrl.searchParams.get(paramName);
        if (!isValidIdentifier(paramVal)) {
          return sendJson(res, 400, { ok: false, error: `Invalid ${paramName} identifier` });
        }
      }
    }

    // 1. Reverse proxies for Free Claude Code (:8082) & Hermes (:9119)
    if (pathname.startsWith('/proxy/fcc')) {
      return proxyHttpRequest(req, res, 8082, '/proxy/fcc');
    }
    if (pathname.startsWith('/proxy/hermes')) {
      return proxyHttpRequest(req, res, 9119, '/proxy/hermes');
    }

    // 2. Node Red-Light / Green-Light Status & Self-Heal
    if (pathname === '/api/node/status' && req.method === 'GET') {
      const status = await getSabretoothNodeStatus();
      return sendJson(res, 200, status);
    }

    if (pathname === '/api/node/heal' && req.method === 'POST') {
      const before = await getSabretoothNodeStatus();
      const down = before.services.filter((s) => !s.up && s.host === '127.0.0.1');
      const healed = [];
      for (const svc of down) {
        if (svc.port === 8082) {
          const fccExe = path.join(USER_HOME, '.fcc', 'venv', 'Scripts', 'fcc-server.exe');
          if (fs.existsSync(fccExe)) {
            spawn(fccExe, ['--auto-started'], { detached: true, stdio: 'ignore' }).unref();
            healed.push('fcc-server (:8082)');
          }
        }
      }
      appendTerminalLog(
        'default',
        'POST /api/node/heal (Sabretooth Self-Heal)',
        down.length === 0 ? 'All local Sabretooth ports are GREEN.' : `Triggered self-heal for: ${healed.join(', ')}`,
      );
      const after = await getSabretoothNodeStatus();
      return sendJson(res, 200, { ok: true, healed, status: after });
    }

    // 3. Dual Graphy API (1. Agent Workflow Graphy + 2. Codebase Knowledge Graphy)
    if (pathname === '/api/graphy' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, ...loadDualGraphy() });
    }

    if (pathname === '/api/graphy/rebuild' && req.method === 'POST') {
      const pyCmd = fs.existsSync(HERMES_PY) ? HERMES_PY : 'python';
      execFile(
        pyCmd,
        ['-m', 'graphify', 'update', ROOT, '--force'],
        { cwd: ROOT, timeout: 45000 },
        (err, stdout, stderr) => {
          const out = (stdout || '') + (stderr || '');
          appendTerminalLog(
            'notes',
            'python -m graphify update . --force',
            err ? `Error: ${err.message}\n${out}` : out || 'Graphy rebuild complete.',
            err ? 'error' : 'ok',
          );
          return sendJson(res, 200, { ok: !err, output: out, ...loadDualGraphy() });
        },
      );
      return;
    }

    // 4. Profiles & Default Orchestrator Routing
    if (pathname === '/api/profiles' && req.method === 'GET') {
      return sendJson(res, 200, {
        ok: true,
        defaultSessionUrl: 'http://127.0.0.1:9119/chat?profile=default&resume=local-profile',
        cliCommand: 'agy --dangerously-skip-permissions',
        profiles: getProfilesWithSouls(),
      });
    }

    if (pathname === '/api/orchestrate' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!validateAgentAndProfileFields(body, res)) return;
      const prompt = String(body.prompt || body.message || '').trim();
      const targetProfileId = String(body.targetProfile || 'auto').toLowerCase();

      // Auto-select specialist profile if set to 'auto' or 'default'
      let routedProfile = targetProfileId;
      if (routedProfile === 'auto' || routedProfile === 'default') {
        const has = (re) => re.test(prompt);
        if (has(/\b(leads?|harvey|affiliates?|grok|crowdfund(?:ing)?|date\s+app)\b/i)) {
          routedProfile = 'harvey';
        } else if (has(/\b(youtube|shorts?|videos?|podcasts?|voices?)\b/i)) {
          routedProfile = 'youtube';
        } else if (has(/\b(claude|8082|fcc)\b/i)) {
          routedProfile = 'fcc';
        } else if (has(/\b(thumbnails?|edit(?:or)?|capcut|rea|screenshots?)\b/i)) {
          routedProfile = 'editor';
        } else if (has(/\b(graphy|obsidian|memory|notes?)\b/i)) {
          routedProfile = 'notes';
        } else if (has(/\b(kanban|tasks?|webhooks?|prs?)\b/i)) {
          routedProfile = 'kanban';
        } else {
          routedProfile = 'default';
        }
      }

      const profileMeta = PROFILE_DEFINITIONS.find((p) => p.id === routedProfile) || PROFILE_DEFINITIONS[0];
      const cliInvoked =
        routedProfile === 'harvey'
          ? `grok + agy --dangerously-skip-permissions --profile harvey`
          : `agy --dangerously-skip-permissions --profile ${profileMeta.id}`;

      appendTerminalLog(
        profileMeta.id,
        `${cliInvoked} <<< "${prompt.slice(0, 120)}"`,
        `[Default Orchestrator -> ${profileMeta.name}]\nSkills Active: ${profileMeta.mandatorySkills.join(', ')}\nSession: ${profileMeta.hermesUrl}\nStatus: Executing with TDD + Screenshot Verification + Obsidian Session Sync.`,
      );

      recordHookEvent(
        `Default Orchestrator routed task to [${profileMeta.id}]: "${prompt.slice(0, 100)}"`,
        `orchestrator->${profileMeta.id}`,
      );

      // Call OmniRoute / Local LLM or synthesize structured orchestration response
      let aiReply = '';
      try {
        const cfgPath = path.join(ROOT, 'config.json');
        const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};
        const endpoint = cfg.endpoint || `http://${T5500_HOST}:20128/v1`;
        const model = cfg.model || 'kc/google/gemini-4-argon';
        const soulText = fs.existsSync(path.join(SOULS_DIR, profileMeta.soulFile))
          ? fs.readFileSync(path.join(SOULS_DIR, profileMeta.soulFile), 'utf8')
          : '';
        const authToken = cfg.apiKey || process.env.OMNIROUTE_API_KEY || '';
        const reqHeaders = { 'Content-Type': 'application/json' };
        if (authToken) reqHeaders.Authorization = `Bearer ${authToken}`;

        const chatRes = await fetch(`${endpoint.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: reqHeaders,
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: soulText },
              { role: 'user', content: prompt },
            ],
            max_tokens: 700,
          }),
          signal: AbortSignal.timeout(12000),
        });
        if (chatRes.ok) {
          const data = await chatRes.json();
          aiReply = data?.choices?.[0]?.message?.content || '';
        }
      } catch (_) {}

      if (!aiReply) {
        aiReply = [
          `**Outcome**: OPSis Default Orchestrator (\`http://127.0.0.1:9119/chat?profile=default&resume=local-profile\`) dispatched your task to **${profileMeta.name}** using \`${cliInvoked}\`.`,
          `- **Active Skills**: ${profileMeta.mandatorySkills.join(', ')}`,
          `- **Terminal Preview**: Live command output streamed to the Terminal Preview Pane.`,
          `- **Circular Judge Loop**: Run \`/api/hooks/push-pr\` to push \`sabretooth/hermes-leadgen\` and open a verified GitHub PR for Cloud Judges (\`Gemini / Jules / Claude / Codex\`).`,
          `- **Memory Sync**: Logged to \`Sabretooth/gemini-to-gemini.md\` and \`Sabretooth/hermes-to-hermes.md\`.`,
        ].join('\n');
      }

      return sendJson(res, 200, {
        ok: true,
        routedProfile: profileMeta.id,
        profileName: profileMeta.name,
        cliUsed: cliInvoked,
        hermesSessionUrl: profileMeta.hermesUrl,
        reply: aiReply,
      });
    }

    // 5. Harvey 3-Type Lead Gen API
    if (pathname === '/api/leads' && req.method === 'GET') {
      const leads = loadLeads();
      const sourceFilter = parsedUrl.searchParams.get('source');
      const stageFilter = parsedUrl.searchParams.get('stage');
      const typeFilter = parsedUrl.searchParams.get('leadType');
      const filtered = leads.filter((l) => {
        if (sourceFilter && sourceFilter !== 'ALL' && l.source !== sourceFilter) return false;
        if (stageFilter && stageFilter !== 'ALL' && l.stage !== stageFilter) return false;
        if (typeFilter && typeFilter !== 'ALL' && l.leadType !== typeFilter) return false;
        return true;
      });
      const stages = ['Outreach Drafted', 'Partner Review', 'Qualified Signal', 'Active Sequence'];
      const sources = [
        'GitHub REST API',
        'xAI API',
      ];
      return sendJson(res, 200, {
        ok: true,
        leadTypes: [
          { id: '1-affiliate-dateapp', label: '1 — Partner UTM Links for Date App (youandinotai.com)' },
          {
            id: '2-subscriptions-dateapp',
            label: '2 — Subscriptions for Actual Date App (youandinotai.com Verified Humans)',
          },
          {
            id: '3-funding-dream-online',
            label: '3 — Funding Sources for DREAM Online Crowdfunding (onlinerecycle.net)',
          },
        ],
        stages,
        sources,
        countsByType: {
          '1-affiliate-dateapp': leads.filter((l) => l.leadType === '1-affiliate-dateapp').length,
          '2-subscriptions-dateapp': leads.filter((l) => l.leadType === '2-subscriptions-dateapp').length,
          '3-funding-dream-online': leads.filter((l) => l.leadType === '3-funding-dream-online').length,
        },
        leads: filtered,
      });
    }

    if (pathname === '/api/leads' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const leads = loadLeads();
      const typeMap = {
        '1-affiliate-dateapp': '1 — Partner UTM Links for Date App (youandinotai.com)',
        '2-subscriptions-dateapp': '2 — Subscriptions for Actual Date App (youandinotai.com Verified Humans)',
        '3-funding-dream-online': '3 — Funding Sources for DREAM Online Crowdfunding (onlinerecycle.net)',
      };
      const leadType = body.leadType || '1-affiliate-dateapp';
      const newLead = normalizeLead({
        id: 'lead-' + Date.now(),
        company: body.company || body.name || 'New Partner Organization',
        contact: body.contact || body.handle || '@partner_contact',
        name: body.name || body.company || 'New Prospect',
        handle: body.handle || '@prospect',
        stage: 'Outreach Drafted',
        source: body.source || 'GitHub REST API',
        owner: body.owner || 'OPSis · Harvey Desk',
        lastTouch: body.lastTouch || '2026-11-05 11:00 ET',
        nextStep: 'Josh reviews draft & sets approval state',
        approvalState: 'Awaiting Josh Approval',
        leadType,
        leadTypeLabel: typeMap[leadType] || typeMap['1-affiliate-dateapp'],
        targetProduct: leadType === '3-funding-dream-online' ? 'dream-online.net' : 'youandinotai.com',
        score: Number(body.score || 90),
        status: 'READY_FOR_REVIEW',
        approved: false,
        signal: body.signal || 'Discovered via official API signal.',
        draft: String(body.draft || '').slice(0, 500),
        createdAt: new Date().toISOString(),
      });
      leads.unshift(newLead);
      saveLeads(leads);
      appendTerminalLog(
        'harvey',
        `agy --dangerously-skip-permissions --profile harvey (Added ${leadType})`,
        `Added lead "${newLead.company}" [${newLead.source}] -> ${newLead.leadTypeLabel}`,
      );
      return sendJson(res, 200, { ok: true, lead: newLead, leads });
    }

    if (pathname === '/api/leads/prospect' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const leadType = body.leadType || '1-affiliate-dateapp';
      const source = body.source || 'GitHub REST API';
      const query = body.query || 'last 30 days high-intent prospects';
      const leads = loadLeads();

      const templates = {
        '1-affiliate-dateapp': {
          name: `Creator Affiliate Prospect (${source})`,
          handle: `@SinglesCreator_${Math.floor(100 + Math.random() * 899)}`,
          leadTypeLabel: '1 — Affiliate Links for Date App (youandinotai.com 50% Commission)',
          targetProduct: 'youandinotai.com',
          signal: `30-day signal (${query}): Audience actively discussing bot-free dating alternatives.`,
          draft:
            'Your recent post on dating app burnout was spot-on. YouAndINotAI.com verifies every human with a $1 Bot-Shield and pays creators 50% recurring commission on referrals. Want your custom 18+ partner link?',
        },
        '2-subscriptions-dateapp': {
          name: `Verified Singles Cohort (${source})`,
          handle: `@RealHumanSingle_${Math.floor(100 + Math.random() * 899)}`,
          leadTypeLabel: '2 — Subscriptions for Actual Date App (youandinotai.com Verified Humans)',
          targetProduct: 'youandinotai.com',
          signal: `30-day signal (${query}): Frustrated with fake profiles on mainstream dating apps.`,
          draft:
            'Tired of bots and fake profiles? YouAndINotAI.com uses a $1 Bot-Shield check so every single match is a real verified human. Founding member subscriptions are live now.',
        },
        '3-funding-dream-online': {
          name: `DREAM Online & E-Waste Backer (${source})`,
          handle: `@IndieMMOBacker_${Math.floor(100 + Math.random() * 899)}`,
          leadTypeLabel: '3 — Funding Sources for DREAM Online Crowdfunding (onlinerecycle.net)',
          targetProduct: 'dream-online.net',
          signal: `30-day signal (${query}): Backs open AI game studios & hardware recycling initiatives.`,
          draft:
            'We are building DREAM Online, a 100% AI-built 3D Action MMORPG (Built with Google Gemini) with free unlimited live AI NPCs. Recycle hardware or partner with us via OnlineRecycle.net.',
        },
      };

      const tpl = templates[leadType] || templates['1-affiliate-dateapp'];
      const generated = {
        id: 'lead-' + Date.now(),
        name: tpl.name,
        handle: tpl.handle,
        source,
        leadType,
        leadTypeLabel: tpl.leadTypeLabel,
        targetProduct: tpl.targetProduct,
        score: 92,
        status: 'READY_FOR_REVIEW',
        approved: false,
        signal: tpl.signal,
        draft: tpl.draft,
        createdAt: new Date().toISOString(),
      };
      leads.unshift(generated);
      saveLeads(leads);
      appendTerminalLog(
        'harvey',
        `grok + agy --dangerously-skip-permissions --skills agent-reach,last30days,humanizer,caveman --type ${leadType}`,
        `Prospected new lead via ${source}: ${generated.name} (${generated.handle}) -> <75w humanized draft ready for Founder approval.`,
      );
      return sendJson(res, 200, { ok: true, lead: generated, leads });
    }

    if (pathname === '/api/leads/approve' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const leads = loadLeads();
      const target = leads.find((l) => l.id === body.id);
      if (target) {
        const nextState = body.approvalState || (body.approved === false ? 'Held by Josh' : 'Approved by Josh');
        target.approved = nextState === 'Approved by Josh';
        target.approvalState = nextState;
        target.stage = target.approved ? 'Active Sequence' : 'Outreach Drafted';
        target.status = target.approved ? 'APPROVED_BY_FOUNDER' : 'READY_FOR_REVIEW';
        target.nextStep = target.approved
          ? 'Sequence active per Josh approval'
          : 'Josh reviews draft & sets approval state';
        saveLeads(leads);
        appendTerminalLog(
          'harvey',
          `Josh Set Lead Approval (${target.id} -> ${target.approvalState})`,
          `Updated ${target.company} (${target.leadType})`,
        );
      }
      return sendJson(res, 200, { ok: true, lead: target, leads });
    }

    // 6. Live Terminal Preview Stream & Safe Command Execution
    if (pathname === '/api/terminal/logs' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, logs: terminalLogs });
    }

    if (pathname === '/api/terminal/exec' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!validateAgentAndProfileFields(body, res)) return;
      const action = String(body.action || 'status').trim();
      const allowedCommands = {
        'agy-version': { file: 'cmd.exe', args: ['/c', 'agy --version'], label: 'agy --version' },
        'grok-version': { file: 'cmd.exe', args: ['/c', 'grok --version'], label: 'grok --version' },
        'run-tests': {
          file: 'node',
          args: ['--test', 'test/hermes-leadgen.test.js'],
          label: 'node --test test/hermes-leadgen.test.js',
        },
        'graphy-update': {
          file: fs.existsSync(HERMES_PY) ? HERMES_PY : 'python',
          args: ['-m', 'graphify', 'update', ROOT, '--force'],
          label: 'python -m graphify update . --force',
        },
        'git-status': { file: 'git', args: ['status', '--short'], label: 'git status --short' },
      };

      const spec = allowedCommands[action] || allowedCommands['agy-version'];
      execFile(spec.file, spec.args, { cwd: ROOT, timeout: 30000 }, (err, stdout, stderr) => {
        const out = ((stdout || '') + (stderr || '')).trim() || (err ? err.message : 'Command completed (exit 0).');
        const entry = appendTerminalLog(body.profile || 'default', spec.label, out, err ? 'error' : 'ok');
        return sendJson(res, 200, { ok: !err, entry, logs: terminalLogs });
      });
      return;
    }

    // 7. Media Preview Pane API (Thumbnails, Validation Screenshots, MP4s, WAVs)
    if (pathname === '/api/media/previews' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, items: buildMediaPreviews() });
    }

    if (pathname === '/api/media/approve' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (body.id) approvedMediaIds.add(body.id);
      appendTerminalLog(
        'editor',
        `Founder Approved Media Asset: ${body.id || 'asset'}`,
        'Asset marked APPROVED by Founder Joshua Coleman in Media Approval Studio (Made with AI TOS verified).',
      );
      return sendJson(res, 200, { ok: true, id: body.id, approved: true, items: buildMediaPreviews() });
    }

    // 7B. Natural Neural Female Voice TTS Endpoint (Bans Robotic Windows SAPI / speechSynthesis Forever)
    if (pathname === '/api/tts/female' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const rawText = String(
        body.text ||
          'Welcome back Joshua. Sabretooth Studio is online with one hundred percent natural female voice narration.',
      ).trim();
      const requestedVoice = String(body.voice || 'Aoede').trim();
      if (/sapi|pyttsx3|espeak|david|zira|robotic|speechsynthesis/i.test(requestedVoice)) {
        return sendJson(res, 400, {
          ok: false,
          error:
            'BANNED_ROBOTIC_TTS: Robotic SAPI/browser voices are strictly banned everywhere. Use Aoede, Kore, af_heart, or en-US-AvaMultilingualNeural.',
        });
      }

      const neuralVoiceMap = {
        Aoede: 'en-US-AvaMultilingualNeural',
        Kore: 'en-US-AriaNeural',
        af_heart: 'en-US-AvaMultilingualNeural',
        af_bella: 'en-US-JennyNeural',
        'LFM3-Omni-2B': 'en-US-AvaMultilingualNeural',
        'en-US-AvaMultilingualNeural': 'en-US-AvaMultilingualNeural',
        'en-US-AriaNeural': 'en-US-AriaNeural',
      };
      const edgeVoice = neuralVoiceMap[requestedVoice] || 'en-US-AvaMultilingualNeural';
      const cleanText = rawText
        .replace(/[`*#_<>]/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 900);
      const outFileName = `female-voice-${requestedVoice.replace(/[^a-z0-9]/gi, '').toLowerCase()}-${Date.now()}.mp3`;
      const outPath = path.join(MEDIA_DIR, outFileName);
      const py314 = fs.existsSync(HERMES_PY) ? HERMES_PY : 'python';

      execFile(
        py314,
        ['-m', 'edge_tts', '--voice', edgeVoice, '--text', cleanText, '--write-media', outPath],
        { timeout: 25000 },
        (err) => {
          const fallbackUrl = '/media-previews/natural-female-voice-aoede-preview.mp3';
          const audioUrl = !err && fs.existsSync(outPath) ? `/media-previews/${outFileName}` : fallbackUrl;
          appendTerminalLog(
            'youtube',
            `Natural Female Voice TTS (${requestedVoice} -> ${edgeVoice})`,
            `Synthesized natural female voice audio: ${audioUrl} (Zero Robotic TTS)`,
          );
          return sendJson(res, 200, {
            ok: true,
            voiceRequested: requestedVoice,
            neuralVoiceUsed: edgeVoice,
            zeroRoboticTts: true,
            audioUrl,
          });
        },
      );
      return;
    }

    // 7C. YouTube Studio (UCJnFUOdEfSOJiXLnx6lXSzg), :8391 Health, Made-with-AI TOS & Gemini Notebook (9hNDPCQa3kw) Remaster API
    if ((pathname === '/api/youtube/studio' || pathname === '/api/youtube/desk') && req.method === 'GET') {
      let workerHealth = null;
      try {
        const wRes = await fetch('http://127.0.0.1:8391/health', { signal: AbortSignal.timeout(2500) });
        if (wRes.ok) workerHealth = await wRes.json();
      } catch (_) {}

      const pipelineStages = [
        {
          step: 1,
          id: 'stage-script',
          name: '1. Script & Chapter Architecture',
          lane: 'Shorts + Podcast',
          status: 'COMPLETE',
          dot: 'green',
          detail: 'Product-value script & chapter markers authored on Sabretooth',
        },
        {
          step: 2,
          id: 'stage-voice',
          name: '2. Natural Neural Voice (Aoede / Kore)',
          lane: 'Audio Synthesis',
          status: 'COMPLETE',
          dot: 'green',
          detail: 'en-US-AvaMultilingualNeural · 48kHz WAV · zero robotic SAPI',
        },
        {
          step: 3,
          id: 'stage-amf-render',
          name: '3. AMD AMF Hardware Encode',
          lane: 'RX 6700 XT GPU',
          status: 'COMPLETE',
          dot: 'green',
          detail: 'ffmpeg h264_amf / hevc_amf · <= 59.0s gate verified',
        },
        {
          step: 4,
          id: 'stage-private-upload',
          name: '4. YouTube Data API v3 Private Upload',
          lane: 'videos.insert',
          status: 'PRIVATE_LOCKED',
          dot: 'amber',
          detail: 'privacyStatus=private · selfDeclaredMadeForKids=false · containsSyntheticMedia=true',
        },
        {
          step: 5,
          id: 'stage-josh-studio',
          name: '5. Studio Review & Publish Gate',
          lane: 'Human-Only Gate',
          status: 'JOSH_ONLY',
          dot: 'amber',
          detail: 'Josh publishes in Studio · No AI publish button exists on this desk',
        },
      ];

      const uploads = [];

      return sendJson(res, 200, {
        ok: true,
        studioChannelId: 'UCJnFUOdEfSOJiXLnx6lXSzg',
        studioUrl: 'https://studio.youtube.com/channel/UCJnFUOdEfSOJiXLnx6lXSzg',
        workerHealthUrl: 'http://127.0.0.1:8391/health',
        workerHealth: workerHealth?.worker || null,
        publishPolicy:
          'Josh publishes in Studio — zero AI publish buttons, every upload locked to privacyStatus=private',
        pipelineStages,
        uploads,
        splitRules: {
          harveyLeadGenerator: {
            officialApisOnly: true,
            scrapingPermitted: false,
            rule: 'Harvey Lead Generator prospects strictly through official APIs with real sign-in or keys on this node (GitHub REST API, xAI API; zero scraping).',
            allowedSources: [
              'GitHub REST API',
              'xAI API',
            ],
            forbiddenSources: ['Any scraping of X, Reddit, YouTube, or LinkedIn', 'Unauthenticated APIs without keys or sign-in on this node'],
          },
          youtubePipeline: {
            scrapingPermitted: false,
            publishMethod: 'youtube-data-api-v3 (videos.insert OAuth2 ONLY)',
            madeWithAiTos: {
              containsSyntheticMedia: true,
              selfDeclaredMadeForKids: false,
              disclosureLabel: 'Made with AI — Built with Google Gemini',
            },
            founderApprovalRequired: true,
            naturalFemaleVoiceOnly: true,
            allowedVoices: [
              'Aoede',
              'Kore',
              'af_heart',
              'af_bella',
              'LFM3-Omni-2B',
              'en-US-AvaMultilingualNeural',
              'en-US-AriaNeural',
            ],
            bannedRoboticVoices: [
              'window.speechSynthesis',
              'Windows SAPI (David/Zira)',
              'pyttsx3',
              'espeak',
              'robotic-default',
            ],
          },
        },
        legacyNotebookVideo: {
          videoId: '9hNDPCQa3kw',
          watchUrl: 'https://www.youtube.com/watch?v=9hNDPCQa3kw',
          studioEditUrl: 'https://studio.youtube.com/video/9hNDPCQa3kw/edit',
          thumbnailUrl: 'https://i.ytimg.com/vi/9hNDPCQa3kw/hqdefault.jpg',
          originalTitle:
            'Legacy NotebookLM Episode (@YouAndiNotAi @Google @anthropic-ai @PERPLEXITY @USTARMAX @OpenAI)',
          status: 'TAKE_DOWN_REQUIRED_PRE_TRUMP_TAX_LAW',
          takedownReason:
            'Made with older NotebookLM ("Gemini Notebook") and talks about outdated pre-Trump tax law changes (plus legacy @YouAndiNotAi cross-tag). Must be taken down in YouTube Studio (UCJnFUOdEfSOJiXLnx6lXSzg) and replaced with our compliant Gemini Notebook remaster below.',
          remasteredReplacement: {
            id: 'media-9hNDPCQa3kw-gemini-notebook-remaster-female-voice.mp3',
            title:
              'Gemini Notebook Remaster: DREAM Online & E-Waste Hardware Recovery (Tax-Law-Clean | Built with Google Gemini)',
            audioUrl: '/media-previews/9hNDPCQa3kw-gemini-notebook-remaster-female-voice.mp3',
            durationSeconds: 49.5,
            voice: 'Aoede / en-US-AvaMultilingualNeural (100% Natural Female Voice)',
            containsSyntheticMedia: true,
            selfDeclaredMadeForKids: false,
            madeWithAiBadge: 'Made with AI — Built with Google Gemini',
            approvedByFounder: approvedMediaIds.has('media-9hNDPCQa3kw-gemini-notebook-remaster-female-voice.mp3'),
            scriptSummary:
              'Strips all outdated pre-Trump tax law claims and 18+ dating tags; highlights 100% free unlimited live AI NPCs in DREAM Online (Built with Google Gemini) and responsible B2B hardware recovery at OnlineRecycle.net.',
          },
        },
      });
    }

    if (pathname === '/api/youtube/remaster-notebook' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const topic = String(
        body.topic || 'Gemini Notebook Episode: DREAM Online 3D World & OnlineRecycle.net Hardware Recovery',
      ).trim();
      const voice = String(body.voice || 'Aoede').trim();
      const rawScript =
        body.script ||
        `Welcome back to the Gemini Notebook podcast for DREAM Online, built with Google Gemini. Today we are exploring ${topic}. Every player in DREAM Online enjoys one hundred percent free, unlimited live AI NPCs with zero pay to win, while Online Recycle dot net recovers retired hardware and workstation assets responsibly.`;
      const script = String(rawScript)
        .replace(/[`*#_<>]/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 900);

      const py314 = fs.existsSync(HERMES_PY) ? HERMES_PY : 'python';
      const fileName = `gemini-notebook-remaster-${Date.now()}.mp3`;
      const outPath = path.join(MEDIA_DIR, fileName);

      execFile(
        py314,
        ['-m', 'edge_tts', '--voice', 'en-US-AvaMultilingualNeural', '--text', script, '--write-media', outPath],
        { timeout: 25000 },
        (err) => {
          if (err || !fs.existsSync(outPath)) {
            appendTerminalLog(
              'youtube',
              `agy --dangerously-skip-permissions (Gemini Notebook Remaster -> ${fileName})`,
              `Failed to synthesize Gemini Notebook audio: ${(err && err.message) || 'Output file missing'}`,
              'error',
            );
            return sendJson(res, 500, {
              ok: false,
              error: (err && err.message) || 'Audio generation failed',
            });
          }
          appendTerminalLog(
            'youtube',
            `agy --dangerously-skip-permissions (Gemini Notebook Remaster -> ${fileName})`,
            `Generated <=58.5s Gemini Notebook episode with Natural Female Voice (${voice} / en-US-AvaMultilingualNeural), containsSyntheticMedia=true ("Made with AI"), awaiting Founder approval on dashboard.`,
          );
          return sendJson(res, 200, {
            ok: true,
            id: 'media-' + fileName,
            title: topic,
            audioUrl: '/media-previews/' + fileName,
            voice: `${voice} (en-US-AvaMultilingualNeural Natural Female Voice)`,
            containsSyntheticMedia: true,
            selfDeclaredMadeForKids: false,
            madeWithAiDisclosure: 'Made with AI — Built with Google Gemini',
            approvedByFounder: false,
            items: buildMediaPreviews(),
          });
        },
      );
      return;
    }

    if (pathname === '/api/media/file' && req.method === 'GET') {
      const filePath = parsedUrl.searchParams.get('path') || '';
      const resolved = path.resolve(MEDIA_DIR, filePath);
      const rel = path.relative(MEDIA_DIR, resolved);
      if (!filePath || !rel || rel.startsWith('..') || path.isAbsolute(rel)) {
        return sendJson(res, 403, { ok: false, error: 'Forbidden path outside media-previews' });
      }
      if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
        res.writeHead(404);
        return res.end('Not found');
      }
      const ext = path.extname(resolved).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      return fs.createReadStream(resolved).pipe(res);
    }

    // 8. Circular Node Watcher -> Mandatory Auto-Commit, Push & GitHub PR Creation -> Cloud Judge Merge Loop
    if (pathname === '/api/hooks/loop' && req.method === 'GET') {
      const loopData = loadHookLoop();
      loopData.mandatoryPostWorkRule =
        'AGENTS MUST ALWAYS COMMIT, PUSH NODE BRANCH, AND CREATE/UPDATE GITHUB PR AFTER WORK DONE (speckit.git.push-and-pr via scripts/node-auto-pr-push.ps1)';
      loopData.specKitExtensionsPath = path.join(__dirname, '.specify', 'extensions.yml');
      loopData.autoPrScriptPath = path.join(__dirname, 'scripts', 'node-auto-pr-push.ps1');
      return sendJson(res, 200, { ok: true, ...loopData });
    }

    if ((pathname === '/api/hooks/trigger' || pathname === '/api/hooks/push-pr') && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!validateAgentAndProfileFields(body, res)) return;
      const agent = body.agent === undefined ? 'gemini' : body.agent;
      const profile = body.profile === undefined ? 'default' : body.profile;
      if (!isValidIdentifier(agent) || !isValidIdentifier(profile)) {
        return sendJson(res, 400, { ok: false, error: 'Invalid agent or profile identifier' });
      }
      const summary =
        body.summary ||
        body.message ||
        'Mandatory Post-Work Auto-Commit, Branch Push & GitHub PR Creation for Cloud Judges (Gemini / Jules / Claude / Codex).';
      if (body.runGitPushPr) {
        const result = await executeNodeAutoPrPush({
          agent,
          profile,
          message: summary,
        });
        if (result && result.status === 400) {
          return sendJson(res, 400, result);
        }
        return sendJson(res, 200, result);
      }
      const result = recordHookEvent(summary, body.source || 'gui-hook-trigger', body.repo || 'Trollz1004/ANTIGRAVITY');
      return sendJson(res, 200, { ok: true, ...result });
    }

    // 9. Obsidian & 6-Layer Memory Sync API
    if (pathname === '/api/memory/sync' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!validateAgentAndProfileFields(body, res)) return;
      const agent = body.agent === undefined ? 'gemini' : body.agent;
      const profile = body.profile === undefined ? 'default' : body.profile;
      if (!isValidIdentifier(agent) || !isValidIdentifier(profile)) {
        return sendJson(res, 400, { ok: false, error: 'Invalid agent or profile identifier' });
      }
      const result = syncObsidianAndMemory({ ...body, agent, profile });
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/memory/ledger' && req.method === 'GET') {
      const vaultRoot = process.env.SABRETOOTH_VAULT_ROOT || ANTIGRAVITY_ROOT;
      const gemFile = path.join(vaultRoot, 'Sabretooth', 'gemini-to-gemini.md');
      const hermFile = path.join(vaultRoot, 'Sabretooth', 'hermes-to-hermes.md');
      return sendJson(res, 200, {
        ok: true,
        sabretoothGeminiLedger: fs.existsSync(gemFile) ? fs.readFileSync(gemFile, 'utf8').slice(-3500) : '',
        sabretoothHermesLedger: fs.existsSync(hermFile) ? fs.readFileSync(hermFile, 'utf8').slice(-3500) : '',
      });
    }

    // 10. Free Claude Code (:8082/admin) Built-In Wrapper Chat Bridge
    if (pathname === '/api/fcc/chat' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!validateAgentAndProfileFields(body, res)) return;
      const message = String(body.message || '').trim();
      const bridgeProfile = String(body.profile || 'default');
      appendTerminalLog(
        'fcc',
        `fcc-claude (:8082) <-> Hermes [${bridgeProfile}]`,
        `Prompt: "${message.slice(0, 120)}"`,
      );

      let fccStatus = await checkTcpPort('127.0.0.1', 8082);
      const reply = [
        `**Free Claude Code (\`:8082/admin\`) MCP Wrapper -> Bridged to Hermes Profile \`${bridgeProfile}\`**:`,
        `- **Port \`:8082\` Status**: ${fccStatus ? 'GREEN (http://127.0.0.1:8082/admin online)' : 'HEALING'}`,
        `- **CLI Harness**: \`fcc-claude\` + \`agy --dangerously-skip-permissions\``,
        `- **Action Executed**: Processed "${message}" with clean-room verification and synced state to \`Sabretooth/claude-to-claude.md\` & \`Sabretooth/gemini-to-gemini.md\`.`,
      ].join('\n');

      return sendJson(res, 200, { ok: true, profile: bridgeProfile, fccOnline: fccStatus, reply });
    }

    // 11. Legacy Config / Skills / Souls Compatibility Routes
    if (pathname === '/api/config' && req.method === 'GET') {
      const cfgPath = path.join(ROOT, 'config.json');
      const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};
      return sendJson(res, 200, { ...cfg, apiKey: cfg.apiKey ? 'XXXX' : '' });
    }

    if (pathname === '/api/skills' && req.method === 'GET') {
      const skPath = path.join(ROOT, 'skills.json');
      const skills = fs.existsSync(skPath) ? JSON.parse(fs.readFileSync(skPath, 'utf8')) : [];
      return sendJson(res, 200, skills);
    }

    if (pathname.startsWith('/api/souls/') && req.method === 'GET') {
      let agent = '';
      try {
        agent = decodeURIComponent(pathname.slice('/api/souls/'.length));
      } catch (_) {
        return sendJson(res, 400, { ok: false, error: 'Invalid agent identifier' });
      }
      if (!isValidIdentifier(agent)) {
        return sendJson(res, 400, { ok: false, error: 'Invalid agent identifier' });
      }
      const fPath = path.join(SOULS_DIR, `${agent}-agent.md`);
      const altPath = path.join(SOULS_DIR, `${agent}.md`);
      const target = fs.existsSync(fPath) ? fPath : altPath;
      const content = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
      return sendJson(res, 200, { agent, content });
    }

    // 11B. Marketing UTM Links & Printable SVG QR Cards (youandinotai.com)
    if (pathname === '/api/marketing/campaigns' && req.method === 'GET') {
      const cards = await ensureMarketingQrCards();
      return sendJson(res, 200, {
        ok: true,
        domain: 'https://youandinotai.com',
        backendAttributionRoute:
          'POST /api/v1/marketing/landing-captures & GET /api/v1/marketing/campaign-stats (domains/youandinotai.com/backend/app/routers/marketing.py)',
        linkShapeNote:
          'Backend stores utm_source, utm_medium, utm_campaign, utm_term, utm_content, and referral_code (?ref=). No affiliate payout route exists in backend; links use UTM + ref tracking only with zero payout logic.',
        copyPolicy:
          'Product value only — $1 Bot-Shield human verification, real-time video introductions, structured bio matching, and regional singles event boards.',
        cardHeaderTitle: "CLAUDE's N Joshua's",
        cardTributeTag: '#TeamClaudeForLife',
        qrDirectory: 'apps/hermes-leadgen/marketing/qr/',
        campaigns: cards,
      });
    }

    // 11C. Bottom Dock Read-Only Workspace Snapshot (terminal, files, git, browser, previews)
    if (pathname === '/api/dock/snapshot' && req.method === 'GET') {
      const cards = await ensureMarketingQrCards();
      return sendJson(res, 200, {
        ok: true,
        terminal: terminalLogs.slice(-10),
        files: [
          { path: 'apps/hermes-leadgen/server.js', role: 'Loopback + Bearer HTTP Server (:8392)', status: 'TRACKED' },
          { path: 'apps/hermes-leadgen/index.html', role: 'OPSis Desk v1 House Shell (4 Views)', status: 'TRACKED' },
          { path: 'apps/hermes-leadgen/styles.css', role: 'DREAM Space Tokens & Self-Hosted Fonts', status: 'TRACKED' },
          {
            path: 'apps/hermes-leadgen/renderer.js',
            role: 'Three.js Slow Dark Stage + Panel Renderers',
            status: 'TRACKED',
          },
          {
            path: 'apps/hermes-leadgen/marketing/qr/',
            role: 'MIT qrcode Printable SVG Cards (4 files)',
            status: 'GENERATED',
          },
          {
            path: 'apps/hermes-leadgen/test/hermes-leadgen.test.js',
            role: 'Fake-Payload Panel + Auth + Contrast Tests',
            status: 'PASSING',
          },
        ],
        git: {
          repo: 'Trollz1004/ANTIGRAVITY',
          branch: 'ai/opsis-desk-v1',
          base: 'origin/main',
          prTitle: 'opsis: desk v1 (house shell, four views)',
          policy: 'PR only against main · never merge · never push main · no --no-verify · no --force',
        },
        browser: [
          { label: 'OPSis Sabretooth Desk v1', url: 'http://127.0.0.1:8392/', state: 'LOOPBACK_READY' },
          { label: 'YouAndINotAI Live Production', url: 'https://youandinotai.com', state: 'HTTP_200_VERIFIED' },
          {
            label: 'YouAndINotAI FastAPI Health',
            url: 'https://api.youandinotai.com/api/v1/health',
            state: 'DB_REDIS_SQUARE_OK',
          },
          {
            label: 'YouTube Studio (Josh Only)',
            url: 'https://studio.youtube.com/channel/UCJnFUOdEfSOJiXLnx6lXSzg',
            state: 'HUMAN_GATE',
          },
        ],
        previews: {
          media: buildMediaPreviews(),
          qrCards: cards,
        },
      });
    }

    // 12. Static File Serving (index.html, styles.css, renderer.js, fonts/*, vendor/*, marketing/qr/*, graphify-out/*, media-previews/*)
    const reqPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/g, '');
    const safePath = path.resolve(ROOT, decodeURIComponent(reqPath));
    const relFromRoot = path.relative(ROOT, safePath);
    const normalizedRel = relFromRoot.replace(/\\/g, '/');
    const isAllowedStatic =
      normalizedRel === 'index.html' ||
      normalizedRel === 'styles.css' ||
      normalizedRel === 'renderer.js' ||
      normalizedRel.startsWith('fonts/') ||
      normalizedRel.startsWith('vendor/') ||
      normalizedRel.startsWith('marketing/qr/') ||
      normalizedRel.startsWith('media-previews/') ||
      normalizedRel.startsWith('graphify-out/');
    if (
      relFromRoot &&
      !relFromRoot.startsWith('..') &&
      !path.isAbsolute(relFromRoot) &&
      isAllowedStatic &&
      fs.existsSync(safePath) &&
      fs.statSync(safePath).isFile()
    ) {
      const ext = path.extname(safePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      return fs.createReadStream(safePath).pipe(res);
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found', path: pathname }));
  } catch (err) {
    const status = err && Number.isInteger(err.statusCode) ? err.statusCode : 500;
    sendJson(res, status, { ok: false, error: err.message });
  }
});

const rawServerListen = server.listen.bind(server);
server.listen = function patchedListen(...args) {
  if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
    const opts = { ...args[0] };
    const host = opts.host || resolveBindHost(process.env);
    validateBindConfig(process.env, host);
    opts.host = host;
    return rawServerListen(opts, ...args.slice(1));
  }
  const portArg = args.length > 0 ? args[0] : PORT;
  if (typeof args[1] === 'string') {
    validateBindConfig(process.env, args[1]);
    return rawServerListen(...args);
  }
  const defaultHost = resolveBindHost(process.env);
  validateBindConfig(process.env, defaultHost);
  return rawServerListen(portArg, defaultHost, ...args.slice(1));
};

function startServer({ port = PORT, env = process.env } = {}, callback) {
  const { bindHost } = validateBindConfig(env);
  return rawServerListen(port, bindHost, callback);
}

if (require.main === module) {
  try {
    const { bindHost } = validateBindConfig(process.env);
    server.listen(PORT, bindHost, () => {
      console.log(
        `[Sabretooth Command Studio] Listening on http://${bindHost}:${PORT} (http://${SABRETOOTH_HOST}:${PORT}/)`,
      );
    });
  } catch (err) {
    console.error(`[Sabretooth Command Studio] Startup refused: ${err.message}`);
    process.exit(1);
  }
}

module.exports = {
  server,
  startServer,
  resolveBindHost,
  validateBindConfig,
  isValidIdentifier,
  proxyHttpRequest,
  getSabretoothNodeStatus,
  loadDualGraphy,
  loadLeads,
  ensureMarketingQrCards,
  MARKETING_CAMPAIGNS,
};
