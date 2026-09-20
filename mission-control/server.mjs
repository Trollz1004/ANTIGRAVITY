#!/usr/bin/env node
/**
 * JARVIS dashboard server — serves dashboard/jarvis on the LAN and gives the page
 * REAL data with no keys in the browser.
 *
 *   node server.mjs            # http://0.0.0.0:9150  (LAN: http://<NODE_LAN_IP>:9150)
 *
 * Configuration: process.env > <repo>/.env > derived defaults (lib/config.mjs).
 * Start it from a plain shell, not from inside a Claude Code terminal.
 *
 * Routes (all JSON unless noted):
 *   GET  /                      the dashboard (static files from this folder; lib/, tests/, server.mjs are never served)
 *   GET  /api/config            where things live, computed for the caller's host
 *   ANY  /api/omni/<path>       proxy -> OmniRoute /v1/<path> with OMNI_ROUTE_API_KEY from the repo .env
 *   POST /api/ask               {bridge, question, model?} -> "omniroute" runs the Ask-JARVIS agentic tool-calling
 *                                loop (lib/ask-agent.mjs) as text/event-stream (init/delta/tool/result/error);
 *                                any other bridge id creates a bridge.run Proposal instead of executing
 *   GET  /api/ask/models        OmniRoute model picker: probes tool-call capability once/hour, {kept, dropped, builtin}
 *   ANY  /api/proxy/crosslisting/<path>  same-origin reverse proxy -> the local Crosslisting app
 *                                (keeps its iframe/embed working through a single-port tunnel)
 *   GET  /api/agents            every loadable skill (SKILL.md frontmatter) — live directory read
 *   GET  /api/speckit           Spec Kit panel: {constitution, features[]} read live from specs/ + .specify/memory/constitution.md
 *   GET  /api/speckit/<id>/<doc>  one feature's spec|plan|tasks markdown (path-sanitised, specs/ only)
 *   GET  /api/nodes             god's-eye view: both LAN nodes, every service identity-probed (lib/nodes.mjs)
 *   GET  /api/vault/graph       Obsidian vault notes + [[wikilinks]] as nodes/links
 *   GET  /api/vault/note?p=     one note's markdown (path relative to the vault)
 *   GET  /api/vault/status      is the Obsidian Local REST API answering (identity checked, https cert tolerated)
 *   GET  /api/crosslisting/status  server-side health probe of the local Crosslisting app
 *   GET  /api/house             legacy FABLE'S SENTRY snapshot shape (real service state, identity-checked; delegates to lib/sentry.mjs, kept for the dashboard tab)
 *   GET  /api/sentry            full Sentry snapshot: every target's status/latency/identity/lastChecked/group (lib/sentry.mjs, ?force=1 to bypass the 30s cache)
 *   GET  /api/sentry/summary    {up, down, total, byGroup} — the compact form for badges and the HUD preamble
 *   GET  /api/avatars           rendered avatar PNGs in ops/avatar/out
 *   GET  /avatars/<file>        those PNGs
 *   GET  /api/claude/status     Claude CLI bridge capability (lib/bridge-routes.mjs; local-only unless DASHBOARD_BRIDGE_TOKEN)
 *   POST /api/claude/chat       headless `claude -p` streamed as Server-Sent Events
 *   POST /api/claude/stop       kill the running bridge child
 *   POST /api/launch/claude     open the official Claude CLI in a console on this host
 *   GET  /api/ollama/tags       local Ollama models
 *   POST /api/ollama/chat       local Ollama chat streamed as Server-Sent Events
 *   POST /api/social/draft      draft one post in Joshua's Fable voice (youandinotai brand only); never creates a proposal
 *   POST /api/judge/reviews     Judge Lanes (Phase D): create a code.review proposal from a real `git diff --stat`
 *   GET  /api/judge/feed        Judge Lanes: proposal feed, claude/codex verdict columns, live disagreement flag
 *   POST /api/judge/:id/verdict Judge Lanes: post one lane's verdict (x-judge-token gated per lane)
 *   GET  /api/fleet             Fleet panel (Phase D): Hermes/OpenClaw/OpenCode status, current task, queue depth, token spend
 *   GET  /api/architecture.json Architecture panel (Phase E): typed JSON of the live Sabertooth stack (House stage table + health JSON)
 *   GET  /api/architecture      Architecture panel: archify-rendered HTML (same-origin), plain-text fallback on CLI failure
 *   GET  /api/architecture/diff?base=&head= before/after architecture diff for a commit range (archify compare)
 *   GET  /health                {service:"jarvis-dashboard"}  <- identity string for the wall
 *
 * Zero dependencies. Secrets are read from .env at request time and never logged or returned.
 */
import { createServer } from 'node:http';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { readFileSync, existsSync, readdirSync, statSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { spawn, execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, resolve, sep } from 'node:path';
import { resolveConfig, resolveVault, readEnvFile } from './lib/config.mjs';
import { probeAll } from './lib/nodes.mjs';
import { getSentrySnapshot, getSentrySummary } from './lib/sentry.mjs';
import { resolveClaudeBinary, killTree, runClaude, PERMISSION_MODES, PERSONAS, sse } from './lib/claude-bridge.mjs';
import { resolveHermesBinary } from './lib/bridge-routes.mjs';
import { handleBridgeRoutes } from './lib/bridge-routes.mjs';
import { buildBridges, findBridge, createBridgeRunProposal, executeBridgeRun, BRIDGE_IDS } from './lib/bridges.mjs';
import { synthesizeSpeech, EDGE_VOICES } from './lib/tts.mjs';
import { buildSkillsPanel, resolveLaunchCmdPath } from './lib/skills-panel.mjs';
import { streamOllamaChat } from './lib/ollama.mjs';
import { createNewsService } from './lib/news.mjs';
import { loadTrends } from './lib/trends.mjs';
import { readConstitution, listFeatures, resolveDoc } from './lib/speckit.mjs';
import { readMissionRibbon } from './lib/mission-ribbon.mjs';
import { listTaskCommander } from './lib/task-commander.mjs';
import { gitPanel } from './lib/git-panel.mjs';
import { sanitizeHeaders, probeService } from './lib/session-proxy.mjs';
import { readHeartbeat } from './lib/heartbeat.mjs';
import { listRunbooks, resolveRunbook } from './lib/runbooks.mjs';
import { createLedgerReader } from './lib/ledger.mjs';
import { redact } from './lib/redact.mjs';
import { createProposalStore } from './lib/proposals.mjs';
import { checkCompliance } from './lib/compliance.mjs';
import { scoreCopy } from './lib/copy-score.mjs';
import { listPlatforms, validateBrand, PLATFORM_IDS, isManualPlatform, executeManualHandoff, checkAdultVenue, checkBusinessOnly, applyRequiredFooter, DATEAPP_BRAND, BRAND_RULING } from './lib/social-adapters.mjs';
import { draftWithFable, platformLimit } from './lib/fable-draft.mjs';
import { buildInbox, performAction, readTriggers, appendAudit } from './lib/inbox.mjs';
import { reviewAndMaybeExecute, autoReviewEnabled, passesMechanicalChecks } from './lib/social-review.mjs';
import { executeRedditAdapter } from './lib/reddit-api.mjs';
import { createAgentTools } from './lib/agent-tools.mjs';
import {
  runAskAgent, refreshAskModels, DEFAULT_MODEL as ASK_DEFAULT_MODEL,
  readAgenticEvidence, recordAgenticEvidenceEntry, buildModelPicker,
} from './lib/ask-agent.mjs';
import { handleMcpRequest } from './lib/mcp-server.mjs';
import { createReviewProposal, buildJudgeFeed, postVerdict } from './lib/judge.mjs';
import { buildFleet } from './lib/fleet.mjs';
import { buildArchitecture, renderArchitectureHtml, renderArchitectureDiff } from './lib/architecture.mjs';
import { defaultExec as gitExec } from './lib/git-panel.mjs';
import { hostname, tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
// process.env > <repo>/.env > derived defaults (lib/config.mjs). The repo root is this checkout.
const CFG = resolveConfig({ here: HERE });
const REPO = CFG.repo;
const PORT = CFG.port;
const LAN_IP = CFG.lanIp;
const OMNI = CFG.omni;
// Vault resolution self-heals across machines: a configured path that does not exist
// (e.g. a Sabertooth path on Alienware) is skipped in favour of an existing candidate.
const VAULT_CFG = resolveVault({ env: process.env, readEnv: readEnvFile, envFile: CFG.envFile, candidates: [join(REPO, 'Antigravity'), 'C:\\DREAM\\AlienwareDream'] });
const VAULT = VAULT_CFG.path;
const VAULT_NAME = VAULT_CFG.name;
const VAULT_ID = VAULT_CFG.id; // stable Obsidian vault id for obsidian:// deep links
// Fable's Sentry was a separate wall service on Sabertooth :9140 until 2026-09-18,
// when it was folded into JARVIS itself (lib/sentry.mjs, called in-process — no
// HTTP hop to a separate port anymore). CFG.sentry / FABLES_SENTRY_URL are retired.
// Node-local endpoints from config (env > .env > live-verified defaults). The Obsidian
// plugin serves https with a self-signed cert, so vault probes tolerate the cert.
const OBSIDIAN_REST = CFG.obsidianRest;
const CROSSLISTING = CFG.crosslisting;
// ClawX AI Board voter: one Hermes one-shot per question (its own session, so the
// board never touches the JARVIS HUD conversation).
async function hermesBoardAsk(question) {
  const bin = resolveHermesBinary();
  const file = join(tmpdir(), `board-hermes-${randomBytes(6).toString('hex')}.txt`);
  writeFileSync(file, question, 'utf8');
  try {
    const out = await new Promise((resolve, reject) => {
      const child = spawn(bin, ['chat', '--query-file', file, '-Q', '--oneshot', '-c', 'clawx-board', '--create-if-missing'], { cwd: REPO, env: process.env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
      let o = '', e = '';
      const timer = setTimeout(() => { try { child.kill(); } catch {} reject(new Error('hermes timeout')); }, 120000);
      child.stdout.on('data', (c) => { o += String(c); });
      child.stderr.on('data', (c) => { e += String(c); });
      child.on('error', (err) => { clearTimeout(timer); reject(err); });
      child.on('close', (code) => { clearTimeout(timer); code === 0 ? resolve(o) : reject(new Error(e.trim().slice(-160) || 'hermes exit ' + code)); });
    });
    return { text: out };
  } finally { try { unlinkFileSync(file); } catch {} }
}
// Summary providers shared with the bridge so JARVIS's HUD preamble is composed
 // from exactly the data this server serves the page.
async function vaultStatusSummary() {
  const r = OBSIDIAN_REST.startsWith('https:')
    ? await getJsonInsecure(OBSIDIAN_REST + '/', 5000)
    : await getJson(OBSIDIAN_REST + '/', 5000);
  const up = r.status === 200 && /Obsidian Local REST API/.test(r.text || '');
  return { up, state: up ? 'UP' : (r.status ? 'WRONG SERVICE' : 'DOWN'), detail: up ? 'identity ok' : (r.error || 'HTTP ' + r.status) };
}
// Crosslisting health on behalf of the page: the browser cannot read :3000 cross-origin,
// so its old client probe reported a CORS failure as ONLINE. The tRPC health route is
// identity-checked server-side ({result:{data:{json:{ok:true}}}}).
async function crosslistingStatusSummary() {
  const probe = CROSSLISTING + '/api/trpc/system.health?input=' + encodeURIComponent('{"json":{"timestamp":0}}');
  const r = await getJson(probe, 5000);
  const ok = r.status === 200 && r.json && r.json.result && r.json.result.data && r.json.result.data.json && r.json.result.data.json.ok === true;
  return { up: ok, state: ok ? 'UP' : (r.status ? 'DOWN' : 'DOWN'), detail: ok ? 'health ok' : (r.error || 'HTTP ' + r.status), url: CROSSLISTING };
}
function agentsSummary() {
  const a = agents();
  return { count: a.length, source: SKILLS };
}
/**
 * Legacy shape for the dashboard tab's Services stat and the HUD preamble:
 * `up`/`total` as the aggregate counts (not a boolean — js/app.js reads
 * `${house.up}/${house.total}` directly), `groups` unchanged from the old
 * Sentry wall payload, plus a flat `services` list (name/up) for hud-context.mjs.
 * There is no separate service left to be "down" — a probe failure shows up
 * as that one target being DOWN inside `groups`, same as always.
 */
async function houseSummary({ force = false } = {}) {
  const snap = await getSentrySnapshot({ force });
  const services = snap.targets.map((t) => ({ name: t.label || t.id, up: t.up }));
  return { up: snap.up, total: snap.total, state: 'UP', groups: snap.groups, services, at: snap.at };
}
function vaultGraphSummary() {
  const g = vaultGraph();
  return { notes: (g.nodes || []).length, links: (g.links || []).length };
}
// Screensaver sources: live HN front page + the founder's real Google Trends notebook.
// Both probed server-side (no CORS, no keys in the browser) and honest when down.
const newsService = createNewsService({});
function trendsSummary() {
  const r = loadTrends(CFG.trendsPath);
  return r.ok ? { ok: true, source: r.source, summary: r.summary } : { ok: false, error: r.error, source: CFG.trendsPath };
}
// Skills tree: the classic .agents/skills layout when present, else this repo's skills/ folder.
const SKILLS = [join(REPO, '.agents', 'skills'), join(REPO, 'skills')].find((d) => existsSync(d)) || join(REPO, 'skills');
const AVATARS = join(REPO, 'ops', 'avatar', 'out');
// Spec Kit panel: specs/<feature>/{spec,plan,tasks}.md and the ratified constitution — both read live, no cache.
const SPECS_DIR = join(REPO, 'specs');
const CONSTITUTION_PATH = join(REPO, '.specify', 'memory', 'constitution.md');
// Ops tab (Phase B): mission ribbon reads CLAUDE.md + the judge journal, both live, no cache.
const CLAUDE_MD_PATH = join(REPO, 'CLAUDE.md');
const JUDGE_STATE_PATH = join(REPO, '.agents', 'journals', 'paperclip-judge', 'STATE.md');
// Git panel (Phase B): the one real checkout on this node. The hermes clone
// entry was dropped 2026-09-17 — Trollz1004/hermes is archived (folded into
// this repo under hermes/) and the ~/hermes clone is a stale leftover.
const GIT_REPOS = [
  { id: 'antigravity', path: REPO },
];
// Hermes router + OpenClaw support (Phase B): same-node services, loopback by default.
const HERMES_URL = (envValue('HERMES_URL') || 'http://127.0.0.1:9119').replace(/\/$/, '');
const OPENCLAW_URL = (envValue('OPENCLAW_URL') || 'http://127.0.0.1:18789').replace(/\/$/, '');
// System status (Phase B, merged into the Mission Control tab): the 30-minute health probe's own files.
const HEARTBEAT_JSON_PATH = join(REPO, 'ops', 'heartbeat', 'sabretooth-health.json');
const HEARTBEAT_LOG_PATH = join(REPO, 'ops', 'heartbeat', 'health.log');
// Runbook viewer (Phase B).
const RUNBOOK_DIR = join(REPO, 'ops', 'runbook');
// Ledger panel (Phase B): 60s cache, 15s timeout, one reader instance for the process lifetime.
const readLedger = createLedgerReader({ cwd: REPO });
// Social command center + approval inbox (Phase C): the compliance list lives in the
// same hook the repo already enforces at commit time; the proposal store is JSONL
// under data/ (gitignored), rebuilt into an in-memory index on this line, at start.
const COMPLIANCE_HOOK_PATH = join(REPO, '.githooks', 'pre-commit-canonical');
const MARKETING_INBOX_DIR = join(REPO, 'ops', 'marketing-inbox', 'approved');
const proposalStore = createProposalStore({ dir: join(HERE, 'data', 'proposals') });
const TRIGGERS_PATH = join(REPO, 'ops', 'heartbeat', 'TRIGGERS.jsonl');
const AUDIT_DIR = join(HERE, 'data', 'audit');
// Model review before approval (specs/010, unit 2).
const SOCIAL_REVIEW_RUBRIC_PATH = join(HERE, 'config', 'social-review-rubric.md');
// Reddit official API (specs/010, unit 3): local rate-limit cooldown state, gitignored.
const REDDIT_RATE_STATE_PATH = join(HERE, 'data', 'reddit-rate-state.json');
// Judge Lanes (Phase D, unit 1): one repo in scope this phase, reusing the
// same [{id, path}] shape as the git panel above.
const JUDGE_REPOS = GIT_REPOS;
// Fleet panel (Phase D, unit 2): each lane's own STATE.md tail + an identity
// probe target. OpenCode has none configured anywhere in this repo as of
// 2026-09-17 (checked ops/ and .agents/harness-config/) — its `probe` stays
// null, which lib/fleet.mjs reports honestly as NOT CONFIGURED.
const FLEET_HARNESSES = [
  { lane: 'hermes', stateMdPath: join(REPO, '.agents', 'journals', 'hermes', 'STATE.md'), probe: { url: HERMES_URL + '/api/health', host: '127.0.0.1', port: 9119 } },
  { lane: 'openclaw', stateMdPath: join(REPO, '.agents', 'journals', 'openclaw', 'STATE.md'), probe: { url: OPENCLAW_URL + '/healthz', host: '127.0.0.1', port: 18789 } },
  { lane: 'opencode', stateMdPath: join(REPO, '.agents', 'journals', 'opencode', 'STATE.md'), probe: null },
];
// Architecture panel (Phase E, unit 3): the House stage table + the health
// JSON, both already used elsewhere in this file (Ops tab), plus the
// vendored archify CLI (mission-control/vendor/archify — gitignored,
// third-party, see vendor/README note in mission-control/.gitignore).
const HOUSE_SCRIPT_PATH = join(REPO, 'scripts', 'fables-house', 'FABLES-HOUSE.ps1');
const ARCHIFY_BIN = join(HERE, 'vendor', 'archify', 'bin', 'archify.mjs');
const ARCHIFY_WORK_DIR = join(HERE, 'data', 'architecture');
let architectureHtmlCache = { at: 0, html: null };
const ARCHITECTURE_CACHE_MS = 5 * 60 * 1000;
// Bridge registry (Phase F, unit 1): one adapter per outside agent this node
// can reach. Each identity check reuses the same live endpoints the rest of
// this file already probes (Hermes/OpenClaw dashboards, the vault, the
// ledger) rather than opening new ones.
function resolveCodexBinary(env = process.env) {
  if (env.CODEX_BIN && existsSync(env.CODEX_BIN)) return env.CODEX_BIN;
  return 'codex';
}
const BRIDGE_DEPS_LIVE = {
  hermes: { dashboardUrl: HERMES_URL + '/', gatewayUrl: 'http://127.0.0.1:8642/health', resolveHermesBin: resolveHermesBinary },
  openclaw: { dashboardUrl: OPENCLAW_URL + '/' },
  claude: { resolveBin: () => resolveClaudeBinary() },
  codex: { resolveBin: () => resolveCodexBinary() },
  ollama: { base: envValue('JARVIS_OLLAMA_URL') || 'http://127.0.0.1:11434' },
  omniroute: { base: OMNI, key: envValue('OMNI_ROUTE_API_KEY') },
  obsidian: { vaultPath: VAULT, restUrl: OBSIDIAN_REST, restProbe: vaultStatusSummary },
  browserCdp: {},
  buzz: { readLedger },
};
// Executes an approved bridge.run proposal (only ever called from the
// founder's own /api/inbox/:id/approve click — see lib/inbox.mjs).
const bridgeExecutorAdapters = {
  execute: (proposal) => executeBridgeRun({
    proposal,
    deps: {
      cwd: REPO, resolveHermesBin: resolveHermesBinary, spawn,
      runClaudeImpl: runClaude,
      ollamaBase: envValue('JARVIS_OLLAMA_URL') || 'http://127.0.0.1:11434',
      ollamaModel: envValue('JARVIS_OLLAMA_MODEL'),
      streamOllamaChatImpl: streamOllamaChat, fetch: globalThis.fetch,
    },
  }),
};
const TTS_CACHE_DIR = join(HERE, 'data', 'tts');
const TTS_VENDOR_DIR = join(HERE, 'vendor', 'piper');
// Skills, plugins, MCP panel (Phase F, unit 3).
const CLAUDE_HOME = join((process.env.USERPROFILE || process.env.HOME || ''), '.claude');
const LAUNCH_CMD_PATH = resolveLaunchCmdPath(REPO);
// JARVIS MCP endpoint (Phase F, unit 4): read-only state_record listing,
// sandboxed the same way vaultNote() is above.
const STATE_RECORDS_DIR = join(REPO, 'docs');
function listStateRecords() {
  if (!existsSync(STATE_RECORDS_DIR)) return [];
  return readdirSync(STATE_RECORDS_DIR).filter((f) => /^NODE-STATE-.*\.md$/i.test(f)).sort();
}
function readStateRecord(name) {
  if (!name || /\.\.|[\\/]/.test(name) || !/^NODE-STATE-.*\.md$/i.test(name)) return { ok: false, error: 'bad request' };
  const full = resolve(STATE_RECORDS_DIR, name);
  if (!full.startsWith(resolve(STATE_RECORDS_DIR) + sep) || !existsSync(full)) return { ok: false, error: 'not found' };
  return { ok: true, text: readFileSync(full, 'utf8') };
}
// Approve of a social proposal runs the matching adapter. Manual-handoff platforms
// write the approved copy to ops/marketing-inbox/approved/ for the lane that posts
// it (Grok/X, Reddit, TikTok, Hermes/YouTube); syndication platforms (dev.to,
// Hashnode, WordPress, Tumblr, Blogger) are NOT auto-posted in this phase — the
// live poster (scripts/seo/post.mjs) still needs a canonical URL + slug this
// dashboard does not have, and this endpoint must never fire a real network POST
// silently. It reports FAILED with that explanation rather than faking success.
const socialAdapters = {
  execute(proposal) {
    // Reddit (specs/010, unit 3): the one manual-handoff platform promoted to
    // a real, official-API adapter. Its own NOT CONFIGURED path still falls
    // back to the same inbox file every other manual platform uses.
    if (proposal.platform === 'reddit') {
      return executeRedditAdapter({
        proposal, envValue, inboxDir: MARKETING_INBOX_DIR,
        triggersPath: TRIGGERS_PATH, rateStatePath: REDDIT_RATE_STATE_PATH,
      });
    }
    if (isManualPlatform(proposal.platform)) {
      // X (specs/010, unit 5): stays a manual handoff to the Grok lane —
      // write the approved copy and note in the inbox where it went.
      const handoff = executeManualHandoff({
        inboxDir: MARKETING_INBOX_DIR, platform: proposal.platform, id: proposal.id,
        title: proposal.title, body: proposal.body, brand: proposal.brand,
      });
      if (handoff.ok && proposal.platform === 'x') {
        return { ...handoff, note: 'handed to the Grok lane: ' + handoff.path };
      }
      return handoff;
    }
    return { ok: false, error: `syndication auto-post not wired in this phase for "${proposal.platform}" — run scripts/seo/post.mjs manually with the approved copy` };
  },
};
// Ask-JARVIS agentic loop (specs/009-jarvis-agentic-ask): every tool reuses
// the exact same live sources the rest of this file already serves — no
// second copy of node health, God's Eye, the inbox, or the bridge registry.
const ASK_TOOLS = createAgentTools({
  repo: REPO,
  getNodeHealth: () => readHeartbeat({ jsonPath: HEARTBEAT_JSON_PATH, logPath: HEARTBEAT_LOG_PATH }),
  getGodsEye: () => getSentrySnapshot(),
  getInbox: () => buildInbox({ store: proposalStore, triggersPath: TRIGGERS_PATH, heartbeat: { jsonPath: HEARTBEAT_JSON_PATH, logPath: HEARTBEAT_LOG_PATH } }),
  getSpecs: () => ({ features: listFeatures(SPECS_DIR) }),
  listRunbooksFn: () => listRunbooks(RUNBOOK_DIR),
  readRunbookFn: (name) => resolveRunbook(RUNBOOK_DIR, name),
  proposalStore,
  getBridgeRow: async (id) => { const { bridges } = await buildBridges(BRIDGE_DEPS_LIVE); return findBridge(bridges, id); },
  createBridgeRunProposalFn: createBridgeRunProposal,
});
const ASK_MODELS_CACHE_PATH = join(HERE, 'data', 'ask-models-cache.json');
function readAskModelsCache() {
  try { return JSON.parse(readFileSync(ASK_MODELS_CACHE_PATH, 'utf8')); } catch { return null; }
}
function writeAskModelsCache(data) {
  try { mkdirSync(join(HERE, 'data'), { recursive: true }); writeFileSync(ASK_MODELS_CACHE_PATH, JSON.stringify(data), 'utf8'); } catch {}
}
// Model-picker fix (specs/010, unit 6): real-run evidence, not a synthetic
// probe, is what "agentic" means now — data/ask-agentic-evidence.json,
// {model: isoTimestamp}, written only when a real tool call actually
// succeeds inside runAskAgent.
const ASK_AGENTIC_EVIDENCE_PATH = join(HERE, 'data', 'ask-agentic-evidence.json');

const STARTED_AT = new Date().toISOString(); // the House restarts this server when server.mjs is newer

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8' };

// Secrets are read from the .env at request time and never logged or returned.
function envValue(name) {
  return process.env[name] || readEnvFile(CFG.envFile)[name] || readEnvFile(join(REPO, '.env'))[name] || '';
}

// ── skills = agents (live directory read; --hash clones are Paperclip copies, skipped) ──
function agents() {
  if (!existsSync(SKILLS)) return [];
  const out = [];
  for (const d of readdirSync(SKILLS)) {
    if (/--[0-9a-f]{6,}$/.test(d)) continue;
    const f = join(SKILLS, d, 'SKILL.md');
    if (!existsSync(f)) continue;
    let name = d, description = '';
    try {
      const head = readFileSync(f, 'utf8').slice(0, 4000);
      const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(head);
      if (fm) {
        const n = /^name:\s*(.+)$/m.exec(fm[1]); if (n) name = n[1].trim().replace(/^"|"$/g, '');
        const ds = /^description:\s*([\s\S]*?)(?=\n[a-zA-Z_-]+:|\s*$)/m.exec(fm[1]);
        if (ds) description = ds[1].replace(/^[>|]-?\s*/, '').replace(/^"|"$/g, '').replace(/\s+/g, ' ').trim();
      }
    } catch {}
    const category = d.startsWith('agency-') ? 'agency'
      : d.startsWith('dateapp-') ? 'date app'
      : d.startsWith('hermes-') ? 'hermes'
      : d.startsWith('paperclip') ? 'paperclip (parked)'
      : d.startsWith('azure-') || d.startsWith('microsoft-') || d.startsWith('entra-') || d.startsWith('appinsights') ? 'azure'
      : /market|growth|seo|social|content|affiliate|copy|devrel|preorder|revenue/.test(d) ? 'marketing'
      : /judge|orchestrat|house|sabretooth|mission|omniroute|fables|self-improving|ceo|status-card|issue-triage|doc-maint|workspace-memory|para-memory|planning|verification|requesting|finishing|executing|writing-plans|subagent|dispatching|using-git|systematic|tdd|test-driven|brainstorm|find-skills|skill-creator|create-skills|caveman|adhd|reflection/.test(d) ? 'ops + method'
      : /game|unreal|godot|unity|dream|motion/.test(d) ? 'game + design'
      : /supabase|payments|browser|agent-reach|miyo|obsidian|openviking|system-connector|webapp|ui-ux|sleek|21st/.test(d) ? 'tools'
      : 'other';
    out.push({ id: d, name, description, category, path: `.agents/skills/${d}/SKILL.md` });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

// ── Obsidian vault graph (notes + wikilinks), cached 60 s ─────────────────────
let graphCache = { at: 0, data: null };
function walk(dir, base, acc) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, base, acc);
    else if (e.name.toLowerCase().endsWith('.md')) acc.push(p.slice(base.length + 1).replace(/\\/g, '/'));
  }
}
function vaultGraph() {
  if (Date.now() - graphCache.at < 60000 && graphCache.data) return graphCache.data;
  if (!existsSync(VAULT)) return { ok: false, error: 'vault not found: ' + VAULT, nodes: [], links: [] };
  const files = [];
  walk(VAULT, VAULT, files);
  const byName = new Map();
  const nodes = files.map((rel) => {
    const name = rel.replace(/\.md$/i, '');
    const short = name.split('/').pop();
    const folder = name.includes('/') ? name.split('/')[0] : '(root)';
    const n = { id: name, label: short, group: folder, out: 0, in: 0 };
    byName.set(name.toLowerCase(), n);
    if (!byName.has(short.toLowerCase())) byName.set(short.toLowerCase(), n);
    return n;
  });
  const links = [];
  const seen = new Set();
  for (const rel of files) {
    const src = byName.get(rel.replace(/\.md$/i, '').toLowerCase());
    let txt; try { txt = readFileSync(join(VAULT, rel), 'utf8'); } catch { continue; }
    for (const m of txt.matchAll(/\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g)) {
      const target = byName.get(m[1].trim().replace(/\.md$/i, '').toLowerCase());
      if (!target || target === src) continue;
      const key = src.id + '\u0000' + target.id;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({ source: src.id, target: target.id });
      src.out++; target.in++;
    }
  }
  const data = { ok: true, vault: VAULT, name: VAULT_NAME, id: VAULT_ID, notes: nodes.length, wikilinks: links.length,
    orphans: nodes.filter((n) => n.in + n.out === 0).length, nodes, links, at: new Date().toISOString() };
  graphCache = { at: Date.now(), data };
  return data;
}
function vaultNote(rel) {
  const full = resolve(VAULT, rel.endsWith('.md') ? rel : rel + '.md');
  if (!full.startsWith(resolve(VAULT) + sep)) return { ok: false, error: 'outside the vault' };
  if (!existsSync(full)) return { ok: false, error: 'not found' };
  return { ok: true, path: rel, markdown: readFileSync(full, 'utf8').slice(0, 200000) };
}

// ── Spec Kit panel (Phase A): specs/<feature>/{spec,plan,tasks}.md + the constitution ──
// Read-only, live off disk every request — no cache, no sample rows (Constitution VIII).
// Logic lives in lib/speckit.mjs (pure, path-injected) so it is unit-tested without booting this server.

// ── helpers ───────────────────────────────────────────────────────────────────
async function getJson(url, ms = 20000, headers = {}) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch(url, { signal: c.signal, headers }); const text = await r.text(); let j = null; try { j = JSON.parse(text); } catch {} return { status: r.status, json: j, text }; }
  catch (e) { return { status: 0, error: String(e.message || e) }; }
  finally { clearTimeout(t); }
}
// fetch with a self-signed certificate tolerated (node:https), same shape as getJson.
async function getJsonInsecure(url, ms = 20000) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https:') ? httpsRequest : httpRequest;
    const req = mod(url, { rejectUnauthorized: false, timeout: ms }, (r) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null; try { json = JSON.parse(text); } catch {}
        resolve({ status: r.statusCode, json, text });
      });
    });
    req.on('timeout', () => { req.destroy(new Error('timeout after ' + ms + ' ms')); });
    req.on('error', (e) => resolve({ status: 0, error: String(e.message || e) }));
    req.end();
  });
}
function readBody(req) { return new Promise((res) => { const b = []; req.on('data', (c) => b.push(c)); req.on('end', () => res(Buffer.concat(b))); }); }
// Bounded, never-throwing, non-blocking shells for the Skills panel (Phase F,
// unit 3). `claude mcp list` checks every configured server's live health
// (~180 servers, ~40s observed on this node 2026-09-17) — a *Sync exec would
// freeze the whole event loop, so this uses async execFile with a generous
// timeout instead. A slow or missing `claude` CLI must never hang the process
// or crash this route.
function spawnAsyncText(bin, args, timeoutMs = 60000) {
  return new Promise((resolve) => {
    execFile(bin, args, { encoding: 'utf8', windowsHide: true, timeout: timeoutMs, maxBuffer: 16 * 1024 * 1024 }, (err, stdout) => {
      resolve(String(stdout || ''));
    });
  });
}
async function spawnAsyncJson(bin, args, timeoutMs) {
  const text = await spawnAsyncText(bin, args, timeoutMs);
  try { return JSON.parse(text); } catch { return []; }
}
function send(res, code, body, type = 'application/json') {
  res.writeHead(code, { 'content-type': type, 'access-control-allow-origin': '*', 'cache-control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
// Same-origin reverse proxy with response headers sanitized (lib/session-proxy.mjs):
// a session/auth cookie from Hermes or OpenClaw must never reach the browser.
async function proxyStripped(req, res, url, base, prefix) {
  const target = base + url.pathname.slice(prefix.length) + url.search;
  const c = new AbortController(); const t = setTimeout(() => c.abort(), 20000);
  try {
    const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await readBody(req);
    const r = await fetch(target, { method: req.method, headers: { 'content-type': req.headers['content-type'] || 'application/json' }, body, signal: c.signal, redirect: 'manual' });
    const buf = Buffer.from(await r.arrayBuffer());
    const headers = sanitizeHeaders(r.headers);
    res.writeHead(r.status, { 'content-type': headers['content-type'] || 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    return res.end(buf);
  } catch (e) {
    const label = base.includes('9119') ? 'Hermes' : 'OpenClaw';
    return send(res, 502, { error: `${label} unreachable: ${String(e.message || e)}`, target });
  } finally { clearTimeout(t); }
}
function serveStatic(res, rel) {
  const full = resolve(HERE, '.' + rel);
  if (!full.startsWith(resolve(HERE) + sep) && full !== resolve(HERE)) return send(res, 403, { error: 'forbidden' });
  if (!existsSync(full) || statSync(full).isDirectory()) return send(res, 404, { error: 'not found' });
  res.writeHead(200, { 'content-type': MIME[extname(full).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(readFileSync(full));
}

// ── server ────────────────────────────────────────────────────────────────────
// Bridge + Ollama routes (lib/bridge-routes.mjs) run first: no wildcard CORS, origin-checked, local-only by default.
const BRIDGE_DEPS = {
  cfg: { ...CFG, vaultName: VAULT_NAME, vaultPath: VAULT, vaultId: VAULT_ID },
  envValue, spawn, killTree: (child) => killTree(child, { spawn }), resolveBinary: () => resolveClaudeBinary(), fetch: globalThis.fetch,
  probeAll, vaultStatus: vaultStatusSummary, agentsSummary, houseSummary, vaultGraph: vaultGraphSummary,
  // Durable JARVIS memory (dashboard/jarvis/data/jarvis-memory.json; /data is never served).
  jarvisMemory: { dataFile: join(HERE, 'data', 'jarvis-memory.json') },
  // FreeBuff wake bridge (wake-file protocol from ANTIGRAVITY's paperclip-ceo):
  // the dashboard writes pending wakes; the user's Freebuff desktop session watches
  // this dir and reports done/fail back through POST routes.
  wakeStore: { wakesDir: envValue('FREEBUFF_WAKES_DIR') || join(REPO, '.freebuff', 'wakes') },
  // ClawX AI Board: six free-thinking voters over real backends — Hermes plus five
  // Ollama models verified installed on this node (ollama list, 2026-09-16). A seat
  // that fails, stalls past the route's seat timeout, or answers without a clear
  // yes/no ABSTAINS — the tally never counts a dead seat as a vote.
  board: {
    seatTimeoutMs: 120000,
    brains: [
      { name: 'Hermes', ask: (q) => hermesBoardAsk(q) },
      ...['gemma4:e4b', 'ornith-1.5:9b', 'deepseek-v4-flash:cloud', 'glm-5.3-flash:cloud', 'qwen3:1.7b'].map((model) => ({
        name: 'Ollama/' + model.split(':')[0],
        ask: async (q) => streamOllamaChat({ model, messages: [{ role: 'user', content: q }], onEvent: () => {} }),
      })),
    ],
  },
};

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  if (await handleBridgeRoutes(req, res, BRIDGE_DEPS)) return;
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' }); return res.end(); }

  if (p === '/favicon.ico') { res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'max-age=86400' }); return res.end('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0d1117"/><circle cx="16" cy="16" r="9" fill="none" stroke="#58a6ff" stroke-width="3"/><circle cx="16" cy="16" r="3" fill="#3fb950"/></svg>'); }
  if (p === '/health') return send(res, 200, { status: 'ok', service: 'jarvis-dashboard', port: PORT, startedAt: STARTED_AT });

  if (p === '/api/config') {
    const host = (req.headers.host || '').replace(/:\d+$/, '') || LAN_IP;
    return send(res, 200, {
      host, lanIp: LAN_IP, omniRoute: OMNI, omniProxy: '/api/omni',
      // LAN-only "open in a new tab" links are built from LAN_IP, never req.headers.host:
      // behind a tunnel that host is the tunnel's own domain (not this LAN), so a link
      // built from it would be a silently broken URL instead of a clearly-labelled LAN one.
      missionControl: CFG.missionControl, hermesDashboard: `http://${LAN_IP}:9119/`, sentry: '/api/sentry',
      vault: { path: VAULT, name: VAULT_NAME, id: VAULT_ID, rest: OBSIDIAN_REST },
      crosslisting: { base: CROSSLISTING, status: '/api/crosslisting/status', embed: '/api/proxy/crosslisting/' },
      claude: {
        chat: '/api/claude/chat', status: '/api/claude/status', launch: '/api/launch/claude',
        command: 'claude -p --output-format stream-json (headless, account auth)',
        note: 'Chat streams from the official Claude CLI on ' + (CFG.nodeName || hostname()) + '. Loopback callers only unless DASHBOARD_BRIDGE_TOKEN is set in .env. The launch button opens an interactive window on this host.',
        personas: Object.keys(PERSONAS), permissionModes: PERMISSION_MODES,
      },
      at: new Date().toISOString(),
    });
  }

  // Local TTS voice pack manifest. The picker UI downloads this so users can register
  // a self-hosted/local voice set on this node instead of relying solely on browser/OS voices.
  // Real voice binaries live in VOICES_DIR (override in .env) and are served by the static
  // fallback below; this endpoint just describes what's available so the picker can offer them.
  if (p === '/api/voices/local-pack' || p === '/api/voices/local-pack.json') {
    const voicesDir = process.env.JARVIS_VOICES_DIR || join(HERE, 'voices');
    let voices = [];
    try {
      voices = readdirSync(voicesDir).filter((f) => /\.(wav|mp3|ogg|m4a)$/i.test(f)).map((f) => ({
        name: f.replace(/\.[^.]+$/, ''),
        uri: '/api/voices/' + encodeURIComponent(f),
        lang: 'en-US',
        local: true,
      }));
    } catch {
      // Directory missing is fine — return an empty pack so the picker still works.
      voices = [];
    }
    return send(res, 200, { voices, dir: voicesDir, note: 'Drop .wav/.mp3/.ogg/.m4a files into the voices dir and refresh the picker.' });
  }
  if (p.startsWith('/api/voices/')) {
    const voicesDir = process.env.JARVIS_VOICES_DIR || join(HERE, 'voices');
    const name = decodeURIComponent(p.slice('/api/voices/'.length));
    if (!name || name.includes('/') || name.includes('..')) return send(res, 400, { error: 'Bad voice name' });
    const file = resolve(voicesDir, name);
    if (!file.startsWith(resolve(voicesDir) + sep) || !existsSync(file) || !statSync(file).isFile()) return send(res, 404, { error: 'Voice file not found' });
    res.writeHead(200, { 'content-type': 'audio/wav', 'content-length': statSync(file).size, 'cache-control': 'max-age=3600', 'access-control-allow-origin': '*' });
    return res.end(readFileSync(file));
  }

  // Same-origin reverse proxy to the local Crosslisting app, so its iframe embed
  // (and any future "open service X in this dashboard" panel) works through a
  // single-port tunnel that can only reach JARVIS's own port. No secrets involved;
  // this just forwards bytes to a loopback service the browser otherwise cannot reach.
  if (p === '/api/proxy/crosslisting' || p.startsWith('/api/proxy/crosslisting/')) {
    const target = CROSSLISTING + p.slice('/api/proxy/crosslisting'.length) + url.search;
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 20000);
    try {
      const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await readBody(req);
      const r = await fetch(target, { method: req.method, headers: { 'content-type': req.headers['content-type'] || 'application/json' }, body, signal: c.signal });
      const buf = Buffer.from(await r.arrayBuffer());
      res.writeHead(r.status, { 'content-type': r.headers.get('content-type') || 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(buf);
    } catch (e) { return send(res, 502, { error: 'Crosslisting unreachable: ' + String(e.message || e), target: CROSSLISTING }); }
    finally { clearTimeout(t); }
  }

  if (p.startsWith('/api/omni/')) {
    const key = envValue('OMNI_ROUTE_API_KEY');
    if (!key) return send(res, 503, { error: 'AUTH MISSING: OMNI_ROUTE_API_KEY not in ' + CFG.envFile });
    const target = OMNI + p.slice('/api/omni'.length) + url.search;
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 300000);
    try {
      const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await readBody(req);
      const r = await fetch(target, { method: req.method, headers: { authorization: 'Bearer ' + key, 'content-type': req.headers['content-type'] || 'application/json' }, body, signal: c.signal });
      const buf = Buffer.from(await r.arrayBuffer());
      res.writeHead(r.status, { 'content-type': r.headers.get('content-type') || 'application/json', 'access-control-allow-origin': '*', 'cache-control': 'no-store' });
      return res.end(buf);
    } catch (e) { return send(res, 502, { error: 'OmniRoute unreachable: ' + String(e.message || e) }); }
    finally { clearTimeout(t); }
  }

  if (p === '/api/agents') { const a = agents(); return send(res, 200, { count: a.length, source: SKILLS, agents: a, at: new Date().toISOString() }); }
  // Spec Kit panel (read-only): specs/<feature>/{spec,plan,tasks}.md + the constitution.
  if (p === '/api/speckit') return send(res, 200, { constitution: readConstitution(CONSTITUTION_PATH), features: listFeatures(SPECS_DIR), at: new Date().toISOString() });
  // Ops tab (Phase B): mission ribbon (read-only, no cache).
  if (p === '/api/mission-ribbon') return send(res, 200, readMissionRibbon({ claudeMdPath: CLAUDE_MD_PATH, stateMdPath: JUDGE_STATE_PATH }));
  if (p === '/api/task-commander') return send(res, 200, { features: listTaskCommander(SPECS_DIR), at: new Date().toISOString() });
  if (p === '/api/git-panel') return send(res, 200, { repos: gitPanel(GIT_REPOS), at: new Date().toISOString() });

  // Hermes router + OpenClaw support panels: status probe (identity-checked when JSON,
  // reachable+TCP when the service only serves HTML) and a session-stripping reverse proxy
  // so an embedded view never leaks a Set-Cookie / auth header to the browser.
  if (p === '/api/hermes-status') return send(res, 200, await probeService({ url: HERMES_URL + '/api/health', host: '127.0.0.1', port: 9119 }));
  if (p === '/api/openclaw-status') return send(res, 200, await probeService({ url: OPENCLAW_URL + '/healthz', host: '127.0.0.1', port: 18789 }));
  if (p === '/api/proxy/hermes' || p.startsWith('/api/proxy/hermes/')) return proxyStripped(req, res, url, HERMES_URL, '/api/proxy/hermes');
  if (p === '/api/proxy/openclaw' || p.startsWith('/api/proxy/openclaw/')) return proxyStripped(req, res, url, OPENCLAW_URL, '/api/proxy/openclaw');
  if (p === '/api/heartbeat') return send(res, 200, readHeartbeat({ jsonPath: HEARTBEAT_JSON_PATH, logPath: HEARTBEAT_LOG_PATH }));
  if (p === '/api/runbooks') return send(res, 200, { runbooks: listRunbooks(RUNBOOK_DIR), at: new Date().toISOString() });
  { const m = /^\/api\/runbooks\/([^/]+)$/.exec(p);
    if (m) { const r = resolveRunbook(RUNBOOK_DIR, decodeURIComponent(m[1])); return send(res, r.ok ? 200 : (r.error === 'not found' ? 404 : 400), r); } }
  if (p === '/api/ledger') return send(res, 200, await readLedger());
  { const m = /^\/api\/speckit\/([^/]+)\/([^/]+)$/.exec(p);
    if (m) { const r = resolveDoc(SPECS_DIR, decodeURIComponent(m[1]), decodeURIComponent(m[2])); return send(res, r.ok ? 200 : (r.error === 'not found' ? 404 : 400), r); } }
  // God's-eye view: every LAN service probed with an identity check (lib/nodes.mjs). No sample data.
  if (p === '/api/nodes') return send(res, 200, await probeAll({ timeoutMs: 3000 }));
  if (p === '/api/vault/graph') return send(res, 200, vaultGraph());
  if (p === '/api/vault/note') return send(res, 200, vaultNote(url.searchParams.get('p') || ''));
  if (p === '/api/vault/status') {
    const r = await vaultStatusSummary();
    return send(res, 200, { ...r, url: OBSIDIAN_REST });
  }
  if (p === '/api/crosslisting/status') {
    return send(res, 200, await crosslistingStatusSummary());
  }
  if (p === '/api/news') return send(res, 200, await newsService.getTopStories());
  if (p === '/api/trends') return send(res, 200, trendsSummary());
  if (p === '/api/house') return send(res, 200, await houseSummary({ force: url.searchParams.get('force') === '1' }));
  if (p === '/api/sentry') return send(res, 200, await getSentrySnapshot({ force: url.searchParams.get('force') === '1' }));
  if (p === '/api/sentry/summary') return send(res, 200, await getSentrySummary({ force: url.searchParams.get('force') === '1' }));
  if (p === '/api/avatars') {
    const files = existsSync(AVATARS) ? readdirSync(AVATARS).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f)).map((f) => ({ file: f, url: '/avatars/' + encodeURIComponent(f), bytes: statSync(join(AVATARS, f)).size, modified: statSync(join(AVATARS, f)).mtime.toISOString() })) : [];
    return send(res, 200, { dir: AVATARS, count: files.length, files });
  }
  if (p.startsWith('/avatars/')) {
    const f = decodeURIComponent(p.slice('/avatars/'.length));
    const full = resolve(AVATARS, f);
    if (!full.startsWith(resolve(AVATARS) + sep) || !existsSync(full)) return send(res, 404, { error: 'not found' });
    res.writeHead(200, { 'content-type': MIME[extname(full).toLowerCase()] || 'application/octet-stream' });
    return res.end(readFileSync(full));
  }

  // Social command center (Phase C): adapter registry + proposal creation.
  // Every response here goes through redact() — nothing new in this phase
  // reaches the client unredacted.
  if (p === '/api/social/platforms') {
    return send(res, 200, redact({ platforms: listPlatforms({ envValue }), at: new Date().toISOString() }));
  }
  if (p === '/api/social/proposals' && req.method === 'GET') {
    return send(res, 200, redact({ proposals: proposalStore.list().filter((x) => x.source === 'social'), at: new Date().toISOString() }));
  }
  if (p === '/api/social/proposals' && req.method === 'POST') {
    let body;
    try { body = JSON.parse((await readBody(req)).toString('utf8') || '{}'); }
    catch { return send(res, 400, { error: 'invalid JSON body' }); }
    const brandCheck = validateBrand(body.brand);
    if (!brandCheck.ok) return send(res, 400, { error: brandCheck.error });
    if (!PLATFORM_IDS.includes(body.platform)) return send(res, 400, { error: 'unknown platform: ' + body.platform });
    // Required disclosure footer (2026-09-19 ruling, specs/010, unit 1):
    // applied to the youandinotai body as a template rule BEFORE any check
    // runs, on every platform, trimmed to that platform's length limit. Copy
    // that still mentions a minor stays rejected below regardless.
    let postBody = body.body;
    if (brandCheck.brand === DATEAPP_BRAND) {
      postBody = applyRequiredFooter(postBody, platformLimit(body.platform));
    }
    const composite = `${body.title || ''}\n${postBody || ''}`;
    const compliance = checkCompliance(composite, { hookPath: COMPLIANCE_HOOK_PATH });
    const copyScore = scoreCopy(composite);
    const checks = { compliance, copyScore };
    const extra = {};
    // The 2026-09-19 ruling (marketing unfrozen, features frozen, listing
    // stays) only ever unblocks youandinotai proposals that also clear these
    // two extra gates — every other brand is unaffected by them.
    if (brandCheck.brand === DATEAPP_BRAND) {
      const adultVenue = checkAdultVenue(composite);
      const businessOnly = checkBusinessOnly(composite);
      checks.adultVenue = adultVenue;
      checks.businessOnly = businessOnly;
      if (!adultVenue.pass) return send(res, 400, { error: '18-and-over check failed: ' + adultVenue.reason, checks });
      if (!businessOnly.pass) return send(res, 400, { error: 'business-only check failed: ' + businessOnly.reason, checks });
      extra.brandRuling = BRAND_RULING;
    }
    // Reddit (specs/010, unit 3): carry the subreddit through so the adapter
    // never has to guess it from free text.
    if (body.platform === 'reddit' && body.subreddit) {
      extra.subreddit = String(body.subreddit).trim().replace(/^\/?r\//, '');
    }
    const rec = proposalStore.create({
      source: 'social', kind: 'post', brand: brandCheck.brand, platform: body.platform,
      title: body.title, body: postBody, scheduledFor: body.scheduledFor || null,
      checks, ...extra,
    });
    // Model review before approval (specs/010, unit 2): fires in the
    // background, never blocks this response — the inbox reflects the
    // outcome once the CLI answers (or leaves it PROPOSED for a human).
    if (autoReviewEnabled(envValue) && passesMechanicalChecks(checks)) {
      reviewAndMaybeExecute({
        store: proposalStore, proposal: rec, rubricPath: SOCIAL_REVIEW_RUBRIC_PATH,
        execute: (p) => socialAdapters.execute(p),
        auditFn: (record) => appendAudit({ dir: AUDIT_DIR, record }),
      }).catch((e) => appendAudit({ dir: AUDIT_DIR, record: { kind: 'social-review', id: rec.id, error: String((e && e.message) || e) } }));
    }
    return send(res, 201, redact({ proposal: rec }));
  }
  if (p === '/api/social/draft' && req.method === 'POST') {
    let body;
    try { body = JSON.parse((await readBody(req)).toString('utf8') || '{}'); }
    catch { return send(res, 400, { error: 'invalid JSON body' }); }
    const r = await draftWithFable({
      brand: body.brand, platform: body.platform, brief: body.brief,
      fetch: globalThis.fetch, ollamaBase: envValue('JARVIS_OLLAMA_URL') || 'http://127.0.0.1:11434',
      hookPath: COMPLIANCE_HOOK_PATH,
    });
    return send(res, r.status, redact(r.body));
  }

  // Approval inbox (Phase C): proposals + TRIGGERS.jsonl + a synthetic RED item
  // + the always-honest sale-inbound placeholder. approve/reject/snooze require
  // x-founder-token === JARVIS_FOUNDER_TOKEN; unset env is 503, wrong/missing token is 401.
  if (p === '/api/inbox' && req.method === 'GET') {
    return send(res, 200, redact(buildInbox({
      store: proposalStore, triggersPath: TRIGGERS_PATH,
      heartbeat: { jsonPath: HEARTBEAT_JSON_PATH, logPath: HEARTBEAT_LOG_PATH },
    })));
  }
  { const m = /^\/api\/inbox\/([^/]+)\/(approve|reject|snooze)$/.exec(p);
    if (m && req.method === 'POST') {
      const id = decodeURIComponent(m[1]); const action = m[2];
      const founderToken = envValue('JARVIS_FOUNDER_TOKEN');
      const token = req.headers['x-founder-token'];
      const r = await performAction({ store: proposalStore, id, action, token, founderToken, adapters: socialAdapters, bridgeAdapters: bridgeExecutorAdapters, auditDir: AUDIT_DIR });
      return send(res, r.status, redact(r.body));
    } }

  // Judge Lanes (Phase D, unit 1): a code.review proposal reuses the same
  // proposal store as Social/Inbox; no model is called here — verdicts are
  // posted by the judges' own official-CLI sessions.
  if (p === '/api/judge/reviews' && req.method === 'POST') {
    let body;
    try { body = JSON.parse((await readBody(req)).toString('utf8') || '{}'); }
    catch { return send(res, 400, { error: 'invalid JSON body' }); }
    const r = createReviewProposal({ store: proposalStore, repos: JUDGE_REPOS, body, exec: gitExec });
    return send(res, r.status, redact(r.body));
  }
  if (p === '/api/judge/feed' && req.method === 'GET') {
    return send(res, 200, redact(buildJudgeFeed({ store: proposalStore })));
  }
  { const m = /^\/api\/judge\/([^/]+)\/verdict$/.exec(p);
    if (m && req.method === 'POST') {
      let body;
      try { body = JSON.parse((await readBody(req)).toString('utf8') || '{}'); }
      catch { return send(res, 400, { error: 'invalid JSON body' }); }
      const tokens = { claude: envValue('JARVIS_JUDGE_TOKEN_CLAUDE'), codex: envValue('JARVIS_JUDGE_TOKEN_CODEX') };
      const r = postVerdict({
        store: proposalStore, id: decodeURIComponent(m[1]), lane: body.lane, verdict: body.verdict, reasoning: body.reasoning,
        token: req.headers['x-judge-token'], tokens, auditDir: AUDIT_DIR,
      });
      return send(res, r.status, redact(r.body));
    } }

  // Fleet panel (Phase D, unit 2): identity-probed status + journal tail per
  // lane + OmniRoute usage (honestly null when no usage route answers).
  if (p === '/api/fleet') {
    const r = await buildFleet({
      harnesses: FLEET_HARNESSES, probeService, omni: { base: OMNI, key: envValue('OMNI_ROUTE_API_KEY') },
    });
    return send(res, 200, redact(r));
  }

  // Architecture panel (Phase E, unit 3): typed JSON from the House stage
  // table + the health JSON, rendered by the vendored archify CLI with a
  // 20s timeout and a 5-minute cache; a plain HTML fallback on any CLI
  // failure so this route never serves an empty frame.
  if (p === '/api/architecture.json') {
    return send(res, 200, redact(buildArchitecture({ housePath: HOUSE_SCRIPT_PATH, healthPath: HEARTBEAT_JSON_PATH })));
  }
  if (p === '/api/architecture') {
    if (architectureHtmlCache.html && Date.now() - architectureHtmlCache.at < ARCHITECTURE_CACHE_MS) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(architectureHtmlCache.html);
    }
    const built = buildArchitecture({ housePath: HOUSE_SCRIPT_PATH, healthPath: HEARTBEAT_JSON_PATH });
    const r = await renderArchitectureHtml({ json: built.archify, archifyBin: ARCHIFY_BIN, workDir: ARCHIFY_WORK_DIR });
    architectureHtmlCache = { at: Date.now(), html: r.html };
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    return res.end(r.html);
  }
  if (p === '/api/architecture/diff') {
    const base = url.searchParams.get('base'); const head = url.searchParams.get('head');
    if (!base || !head) return send(res, 400, { error: 'base and head query params are required' });
    if (!JUDGE_REPOS.find((r) => r.id === 'antigravity')) return send(res, 400, { error: 'repo not configured' });
    const r = await renderArchitectureDiff({
      repoPath: REPO, base, head, healthPath: HEARTBEAT_JSON_PATH, archifyBin: ARCHIFY_BIN,
      workDir: ARCHIFY_WORK_DIR, exec: gitExec,
    });
    if (!r.ok) return send(res, 502, { error: r.error });
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    return res.end(r.html);
  }

  // Bridge registry (Phase F, unit 1): identity-checked status for every
  // outside agent this node can reach. A run is always a bridge.run
  // Proposal — this route never executes anything itself; only a founder
  // approve through /api/inbox/:id/approve calls executeBridgeRun.
  if (p === '/api/bridges' && req.method === 'GET') {
    const r = await buildBridges(BRIDGE_DEPS_LIVE);
    return send(res, 200, redact(r));
  }
  { const m = /^\/api\/bridges\/([^/]+)$/.exec(p);
    if (m && req.method === 'GET') {
      const { bridges } = await buildBridges(BRIDGE_DEPS_LIVE);
      const row = findBridge(bridges, decodeURIComponent(m[1]));
      if (!row) return send(res, 404, { error: 'unknown bridge: ' + m[1] });
      return send(res, 200, redact(row));
    } }
  { const m = /^\/api\/bridges\/([^/]+)\/run$/.exec(p);
    if (m && req.method === 'POST') {
      let body;
      try { body = JSON.parse((await readBody(req)).toString('utf8') || '{}'); }
      catch { return send(res, 400, { error: 'invalid JSON body' }); }
      const id = decodeURIComponent(m[1]);
      const { bridges } = await buildBridges(BRIDGE_DEPS_LIVE);
      const bridgeRow = findBridge(bridges, id);
      const r = createBridgeRunProposal({ store: proposalStore, id, prompt: body.prompt, bridgeRow });
      return send(res, r.status, redact(r.body));
    } }
  if (p === '/api/ask' && req.method === 'POST') {
    let body;
    try { body = JSON.parse((await readBody(req)).toString('utf8') || '{}'); }
    catch { return send(res, 400, { error: 'invalid JSON body' }); }
    if (body.bridge === 'omniroute') {
      // Ask-JARVIS agentic loop (specs/009-jarvis-agentic-ask): streamed as SSE
      // (init/delta/tool/result/error), same vocabulary the Claude bridge already
      // uses, so the dock's existing SSE reader handles both without a fork.
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' });
      res.write(sse('init', { bridge: 'omniroute', model: body.model || ASK_DEFAULT_MODEL }));
      try {
        await runAskAgent({
          question: body.question, model: body.model, tools: ASK_TOOLS,
          base: OMNI, key: envValue('OMNI_ROUTE_API_KEY'), auditDir: AUDIT_DIR,
          onEvent: (type, data) => { try { res.write(sse(type, redact(data))); } catch {} },
          recordEvidence: (model, at) => recordAgenticEvidenceEntry(ASK_AGENTIC_EVIDENCE_PATH, model, at, {
            readFile: readFileSync, writeFile: writeFileSync, exists: existsSync, mkdir: mkdirSync, dirname,
          }),
        });
      } catch (e) {
        try { res.write(sse('error', { message: String((e && e.message) || e) })); } catch {}
      }
      try { res.end(); } catch {}
      return;
    }
    if (!BRIDGE_IDS.includes(String(body.bridge || ''))) return send(res, 400, { error: 'unknown bridge: ' + body.bridge });
    const { bridges } = await buildBridges(BRIDGE_DEPS_LIVE);
    const bridgeRow = findBridge(bridges, body.bridge);
    const r = createBridgeRunProposal({ store: proposalStore, id: body.bridge, prompt: body.question, bridgeRow });
    return send(res, r.status, redact(r.body));
  }
  if (p === '/api/ask/models' && req.method === 'GET') {
    // Model-picker fix (specs/010, unit 6): this response is built entirely
    // from disk (real-run evidence + the last background probe's cache) —
    // it NEVER waits on a network probe. The synthetic probe still runs,
    // but only afterward, in the background, with its own 20s-per-model
    // timeout, purely to refresh the cache for the NEXT request.
    const evidence = readAgenticEvidence(ASK_AGENTIC_EVIDENCE_PATH, { readFile: readFileSync, exists: existsSync });
    const probeCache = readAskModelsCache();
    const picker = buildModelPicker({ evidence, probeCache });
    const force = url.searchParams.get('force') === '1';
    const key = envValue('OMNI_ROUTE_API_KEY');
    if (key) {
      refreshAskModels({ base: OMNI, key, force, readCache: readAskModelsCache, writeCache: writeAskModelsCache })
        .catch(() => {}); // best-effort background refresh; a failure here must never surface to this request
    }
    const builtin = [{ id: 'claude-code', label: 'Claude Code (Claudian)', agentic: true, builtin: true }];
    return send(res, 200, redact({ ...picker, builtin }));
  }

  // Voice out (Phase F, unit 2): edge-tts neural voices, cached 24h; a 204
  // tells the client to fall back to its own browser speechSynthesis.
  if (p === '/api/tts' && req.method === 'POST') {
    let body;
    try { body = JSON.parse((await readBody(req)).toString('utf8') || '{}'); }
    catch { return send(res, 400, { error: 'invalid JSON body' }); }
    const r = await synthesizeSpeech({ text: body.text, voice: body.voice, cacheDir: TTS_CACHE_DIR, vendorDir: TTS_VENDOR_DIR });
    if (r.ok) {
      res.writeHead(200, { 'content-type': 'audio/mpeg', 'cache-control': 'no-store', 'x-tts-engine': r.engine, 'x-tts-cached': String(Boolean(r.cached)) });
      return res.end(r.buffer);
    }
    if (r.engine === null) { res.writeHead(204, { 'x-tts-reason': String(r.reason || '').slice(0, 200) }); return res.end(); }
    return send(res, 502, { error: r.error || 'tts failed', engine: r.engine });
  }
  if (p === '/api/tts/voices') return send(res, 200, { voices: EDGE_VOICES, default: 'en-US-GuyNeural' });

  // Skills, plugins, and MCP panel (Phase F, unit 3): everything read live
  // from ~/.claude and this repo at request time, redacted before it leaves.
  if (p === '/api/skills' && req.method === 'GET') {
    let settingsJson = null, pluginListJson = [], mcpListText = '', launchCmdText = '';
    try { settingsJson = JSON.parse(readFileSync(join(CLAUDE_HOME, 'settings.json'), 'utf8')); } catch {}
    try { pluginListJson = await spawnAsyncJson('claude', ['plugin', 'list', '--json'], 15000); } catch {}
    try { mcpListText = await spawnAsyncText('claude', ['mcp', 'list'], 60000); } catch {}
    try { launchCmdText = readFileSync(LAUNCH_CMD_PATH, 'utf8'); } catch {}
    const obsidianPlugin = (pluginListJson || []).find((pl) => String(pl.id || '').startsWith('obsidian-second-brain'));
    const r = buildSkillsPanel({
      settingsJson, pluginListJson, mcpListText, launchCmdText,
      obsidianPluginInstallPath: obsidianPlugin ? obsidianPlugin.installPath : '',
      homeDir: process.env.USERPROFILE || process.env.HOME || '', repoRoot: REPO,
    });
    return send(res, 200, redact(r));
  }

  // JARVIS MCP endpoint (Phase F, unit 4): Streamable HTTP, read-only, so the
  // Alienware node's own Claude can read this node's real state over the LAN.
  // Bearer-gated on JARVIS_MCP_TOKEN (503 unset, 401 wrong) — see lib/mcp-server.mjs.
  if (p === '/mcp' && req.method === 'POST') {
    return handleMcpRequest(req, res, {
      token: envValue('JARVIS_MCP_TOKEN'), readBody,
      deps: {
        getHealth: () => readHeartbeat({ jsonPath: HEARTBEAT_JSON_PATH, logPath: HEARTBEAT_LOG_PATH }),
        getTriggers: () => readTriggers(TRIGGERS_PATH),
        getProposals: () => proposalStore.list(),
        getBridges: () => buildBridges(BRIDGE_DEPS_LIVE),
        listRunbooks: () => listRunbooks(RUNBOOK_DIR),
        readRunbook: (name) => resolveRunbook(RUNBOOK_DIR, name),
        listStateRecords, readStateRecord,
      },
    });
  }

  if (p === '/' || p === '/index.html') return serveStatic(res, '/index.html');
  if (p === '/data/' || p.startsWith('/data/')) return send(res, 404, { error: 'not found' }); // JARVIS memory stays server-side
  if (p.startsWith('/api/')) return send(res, 404, { error: 'no such route' });
  return serveStatic(res, p);
}).listen(PORT, '0.0.0.0', () => {
  console.log(`JARVIS dashboard on http://0.0.0.0:${PORT}  (LAN: http://${LAN_IP}:${PORT})  omni=${OMNI}  vault=${VAULT}`);
});
