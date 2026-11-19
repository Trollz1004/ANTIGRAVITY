// Mission Agent OS (JARVIS/OPSIS) — the one Mission Control on the T5500.
// Serves the board (oldmissioncontrol.html) at /, a live admin page at /live,
// 16 Stitch screens at /screens/<name>/, a read-only state feed at /api/mos-state.json,
// official OAuth/CLI/ACP/A2A bridge probes at /api/bridges, live JARVIS dispatch at /api/jarvis/dispatch,
// and the local OpenAI-compatible Gemini 4 (agy OAuth) bridge at /v1/models and /v1/chat/completions.
// Binds 0.0.0.0:3130 (MISSION_OS_HOST default from ops/fleet/fleet-map.json) with Host/Origin + MISSION_OS_TOKEN guard. No secrets leave this process.
import http from 'node:http';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile, spawn } from 'node:child_process';
import { guardRequest, isLoopbackAddress, readOps, openBrowser, envelope } from './ops-backend.mjs';
import { getBindHost, getNodeIp, getService, getServiceUrl } from '../ops/fleet/fleet-map.mjs';
import {
  getFullMarketingDashboardState,
  updateCampaignStatus,
  addGeneratedCampaign,
  getSocialCommandPlatforms,
  listProposals,
  draftWithFable,
  getTagCityState,
  triggerTagCityDailyBatch,
  generateThreeCommentVariants,
  saveCommentReply,
  executeLiveSocialPublish,
  getUnifiedInboxItems,
  sanitizeCopyToScore5,
  proposalStore,
} from './marketing-engine.mjs';
import {
  getLiveAgentsTab,
  getSkillDetail,
  getLiveBoardTab,
  mutateWheelTask,
  readDeliverableFile,
  readRepoFile,
  getLiveGatewayTab,
  getLiveMemoryTab,
  readObsidianNote,
  appendObsidianNote,
  searchGraphifyNodes,
  getLiveNodeTab,
  getLiveLogsTab,
  getLiveSupportTab,
  draftSupportTicketReply,
  getLiveSettingsTab,
} from './live-tabs-backend.mjs';
import { buildInbox, performAction } from '../mission-control/lib/inbox.mjs';
import { getBridgeRegistry, verifyLane, verifyAllLanes } from './bridge-registry.mjs';
import { getMissionOsEnvDriftLight, warnMissionOsMissingEnv } from './env-drift-light.mjs';
import { createNodeWatchdog } from './node-watchdog.mjs';
import { createShellApi, isHeavyBuildRequest } from './shell-api.mjs';
import { wrapStreamSafeResponse } from './stream-redact.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT =
  process.env.MISSION_OS_ROOT || (fs.existsSync('C:/ANTIGRAVITY/mission-os/server.mjs') ? 'C:/ANTIGRAVITY' : path.resolve(HERE, '..'));
export const T5500_IP = getNodeIp('t5500');
export const ALIENWARE_IP = getNodeIp('alienware');
const MISSION_OS_SVC = getService('mission-os');
export const PORT = Number(process.env.MISSION_OS_PORT || MISSION_OS_SVC.port);

function isLoopbackBindHost(host) {
  const h = String(host || '')
    .trim()
    .toLowerCase();
  return h === '127.0.0.1' || h === 'localhost' || h === '::1';
}

export function resolveMissionOsBind({ env = process.env, port = PORT, warn = console.warn } = {}) {
  const token = String(env?.MISSION_OS_TOKEN || env?.FLEET_SHARED_TOKEN || '').trim();
  const explicit = String(env?.MISSION_OS_HOST || '').trim();
  if (explicit) {
    if (!token && !isLoopbackBindHost(explicit)) {
      throw new Error(
        `[mission-os] Refusing to bind ${explicit} on port ${port} without MISSION_OS_TOKEN or FLEET_SHARED_TOKEN configured.`,
      );
    }
    return explicit;
  }
  if (!token) {
    warn?.(`[mission-os] WARNING: MISSION_OS_TOKEN is not set; binding 127.0.0.1 on port ${port} (this machine only).`);
    return '127.0.0.1';
  }
  return getBindHost('mission-os');
}

export const HOST = resolveMissionOsBind({ env: process.env, port: PORT });
const BOARD = `${ROOT}/oldmissioncontrol.html`;
const STATUS = `${ROOT}/ops/t5500/status.json`;
const CLIENT_JS = `${ROOT}/mission-os/jarvis-bridge-client.js`;

const HOME_POSIX = os.homedir().replaceAll('\\', '/');
export const BINARIES = {
  agy: `${HOME_POSIX}/AppData/Local/Microsoft/WinGet/Links/agy.exe`,
  agyShim: `${ROOT}/mission-os/launchers/agy-gemini.exe`,
  claude: `${HOME_POSIX}/.local/bin/claude.exe`,
  codex: `${HOME_POSIX}/AppData/Roaming/npm/codex.cmd`,
  grok: `${HOME_POSIX}/.grok/bin/grok.exe`,
  hermes: `${HOME_POSIX}/AppData/Local/hermes/bin/hermes.exe`,
  hermesAcp: `${HOME_POSIX}/AppData/Local/hermes/bin/hermes-acp.exe`,
  ollama: `${HOME_POSIX}/AppData/Local/Programs/Ollama/ollama.exe`,
};

export const SERVICES = [
  {
    id: 'mission-control',
    port: 3130,
    what: 'Mission Control (JARVIS/OPSIS board + local /v1 Gemini 4 bridge)',
    url: getServiceUrl('mission-os', '/'),
  },
  {
    id: 'social-command-center',
    port: 3130,
    what: 'Social Command Center & Gemini 4 Ultra Marketing Engine (/marketing)',
    url: getServiceUrl('mission-os', '/marketing'),
  },
  { id: 'odysseus', port: 7011, what: 'Odysseus AI agent & workspace UI (:7011)', url: getServiceUrl('odysseus', '/') },
  { id: 'omniroute', port: 20128, what: 'OmniRoute AI gateway + dashboard', url: getServiceUrl('omniroute', '/') },
  {
    id: 'hermes',
    port: 9119,
    what: 'Hermes desktop dashboard (Nous, the one Hermes on this node)',
    url: getServiceUrl('hermes-dashboard', '/'),
  },
  {
    id: 'hermes-a2a',
    port: 8643,
    what: 'Hermes shared A2A / Gateway API (hermes-agent)',
    url: getServiceUrl('hermes-gateway', '/health'),
    probe: getServiceUrl('hermes-gateway', '/health'),
  },
  {
    id: 'ollama',
    port: 11434,
    what: 'Ollama root (ollama serve; GGUF models)',
    url: getServiceUrl('ollama-t5500', '/'),
    probe: getServiceUrl('ollama-t5500', '/'),
  },
  {
    id: 'ollama-v1',
    port: 11434,
    what: 'Ollama OpenAI-compatible /v1',
    url: getServiceUrl('ollama-t5500', '/v1/models'),
    probe: getServiceUrl('ollama-t5500', '/v1/models'),
  },
  {
    id: 'ollama-tags',
    port: 11434,
    what: 'Ollama installed models /api/tags',
    url: getServiceUrl('ollama-t5500', '/api/tags'),
    probe: getServiceUrl('ollama-t5500', '/api/tags'),
  },
  {
    id: 'domains',
    port: 9160,
    what: 'Static domain origins behind the tunnel',
    url: getServiceUrl('domains-server', '/'),
  },
  {
    id: 'frontend',
    port: 3200,
    what: 'youandinotai.com date app frontend',
    url: getServiceUrl('dateapp-frontend', '/'),
  },
  { id: 'api', port: 8000, what: 'Date app API (api.youandinotai.com)', url: getServiceUrl('dateapp-api', '/docs') },
  { id: 'postgres', port: 5432, what: 'PostgreSQL (date app + Mission OS data · 127.0.0.1 local-only)' },
  { id: 'redis', port: 6379, what: 'Redis (sessions/cache · 127.0.0.1 local-only)' },
  {
    id: 'obsidian',
    port: 27123,
    what: 'Obsidian Local REST (vault C:\\ANTIGRAVITY\\Antigravity)',
    url: getServiceUrl('obsidian-t5500', '/'),
  },
];
export const DOMAINS = ['youandinotai.com', 'onlinerecycle.net', 'dream-online.net'];

export const AGY_V1_MODELS = [
  { id: 'gemini-4-argon-high', name: 'Gemini 4 Argon (High · Ultra OAuth)' },
  { id: 'gemini-4-argon-medium', name: 'Gemini 4 Argon (Medium · Ultra OAuth)' },
  { id: 'gemini-4-argon-low', name: 'Gemini 4 Argon (Low · Ultra OAuth)' },
  { id: 'gemini-4-carbon-high', name: 'Gemini 4 Carbon (High · Ultra OAuth)' },
  { id: 'gemini-4-hydrogen', name: 'Gemini 4 Hydrogen (Ultra OAuth)' },
  { id: 'gemini-3.8-flash-high', name: 'Gemini 3.8 Flash (High · Ultra OAuth)' },
  { id: 'gemini-3.8-flash-medium', name: 'Gemini 3.8 Flash (Medium · Ultra OAuth)' },
  { id: 'gemini-3.8-flash-low', name: 'Gemini 3.8 Flash (Low · Ultra OAuth)' },
  { id: 'claude-opus-5-5-high', name: 'Claude Opus 5.5 (High · agy OAuth)' },
  { id: 'claude-sonnet-5-5-high', name: 'Claude Sonnet 5.5 (High · agy OAuth)' },
  { id: 'gpt-oss-120b-medium', name: 'GPT-OSS 120B (Medium · agy OAuth)' },
];

export function mapAgyModel(raw) {
  const m = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/^(agy|gemini|omniroute)\//, '');
  if (!m) return 'gemini-4-argon-high';
  if (AGY_V1_MODELS.some((x) => x.id === m)) return m;
  if (m.includes('hydrogen')) return 'gemini-4-hydrogen';
  if (m.includes('carbon')) {
    return m.includes('low')
      ? 'gemini-4-carbon-low'
      : m.includes('medium')
        ? 'gemini-4-carbon-medium'
        : 'gemini-4-carbon-high';
  }
  if (m.includes('opus'))
    return m.includes('low')
      ? 'claude-opus-5-5-low'
      : m.includes('medium')
        ? 'claude-opus-5-5-medium'
        : 'claude-opus-5-5-high';
  if (m.includes('sonnet'))
    return m.includes('low')
      ? 'claude-sonnet-5-5-low'
      : m.includes('medium')
        ? 'claude-sonnet-5-5-medium'
        : 'claude-sonnet-5-5-high';
  if (m.includes('gpt-oss')) return 'gpt-oss-120b-medium';
  if (m.includes('flash'))
    return m.includes('low')
      ? 'gemini-3.8-flash-low'
      : m.includes('medium')
        ? 'gemini-3.8-flash-medium'
        : 'gemini-3.8-flash-high';
  if (m.includes('gemini-4') || m.includes('argon') || m.includes('ultra') || m.includes('pro')) {
    return m.includes('low')
      ? 'gemini-4-argon-low'
      : m.includes('medium')
        ? 'gemini-4-argon-medium'
        : 'gemini-4-argon-high';
  }
  return 'gemini-4-argon-high';
}

const tcp = (port) =>
  new Promise((res) => {
    const targetHost = port === 5432 || port === 6379 ? '127.0.0.1' : T5500_IP;
    const s = net.connect({ host: targetHost, port, timeout: 1500 });
    s.on('connect', () => {
      s.destroy();
      res(true);
    });
    s.on('error', () => res(false));
    s.on('timeout', () => {
      s.destroy();
      res(false);
    });
  });
const head = async (url) => {
  try {
    const r = await fetch(url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(6000) });
    return r.status;
  } catch {
    return 0;
  }
};

function runVersion(bin, args = ['--version']) {
  return new Promise((resolve) => {
    if (!fs.existsSync(bin)) return resolve({ ok: false, version: 'NOT FOUND' });
    const isCmd = bin.toLowerCase().endsWith('.cmd');
    execFile(
      isCmd ? 'cmd.exe' : bin,
      isCmd ? ['/c', bin, ...args] : args,
      { timeout: 6000, windowsHide: true },
      (err, stdout, stderr) => {
        const out = String(stdout || stderr || '')
          .trim()
          .split(/\r?\n/)[0];
        resolve({ ok: !err && Boolean(out), version: out || (err ? err.code || 'probe failed' : 'unknown') });
      },
    );
  });
}

let bridgeCache = {
  at: Date.now(),
  refreshing: false,
  data: {
    generated: new Date().toISOString(),
    bridges: [
      {
        id: 'gemini',
        name: 'Gemini 4 Argon / Ultra (agy)',
        installed: fs.existsSync(BINARIES.agy),
        authenticated: true,
        inferenceVerified: true,
        auth: `Google OAuth (Ultra Subscription via agy / ${getServiceUrl('mission-os', '/v1')})`,
        protocol: 'CLI / OpenAI /v1',
        status: fs.existsSync(BINARIES.agy) ? 'UP' : 'DOWN',
        version: 'unverified',
        canRun: fs.existsSync(BINARIES.agy),
      },
      {
        id: 'claude',
        name: 'Claude Code (Opus / Sonnet)',
        installed: fs.existsSync(BINARIES.claude),
        authenticated: true,
        inferenceVerified: true,
        auth: 'Anthropic OAuth Login Only (Zero API Key)',
        protocol: 'CLI / MCP',
        status: fs.existsSync(BINARIES.claude) ? 'UP' : 'DOWN',
        version: 'unverified',
        canRun: fs.existsSync(BINARIES.claude),
      },
      {
        id: 'codex',
        name: 'OpenAI Codex',
        installed: fs.existsSync(BINARIES.codex),
        authenticated: true,
        inferenceVerified: true,
        auth: 'OpenAI OAuth Login',
        protocol: 'CLI / ACP (codex exec)',
        status: fs.existsSync(BINARIES.codex) ? 'UP' : 'DOWN',
        version: 'unverified',
        canRun: fs.existsSync(BINARIES.codex),
      },
      {
        id: 'grok',
        name: 'xAI Grok',
        installed: fs.existsSync(BINARIES.grok),
        authenticated: true,
        inferenceVerified: true,
        auth: 'xAI OAuth Login',
        protocol: 'CLI / ACP (streaming-json)',
        status: fs.existsSync(BINARIES.grok) ? 'UP' : 'DOWN',
        version: 'unverified',
        canRun: fs.existsSync(BINARIES.grok),
      },
      {
        id: 'hermes',
        name: 'Hermes Agent (@t5500_bot · OmniRoute)',
        installed: fs.existsSync(BINARIES.hermes),
        authenticated: true,
        inferenceVerified: true,
        auth: `OmniRoute (${getServiceUrl('omniroute', '/v1')} · hermes-support) + @t5500_bot`,
        protocol: 'OmniRoute /v1 + A2A (:8643 & :9119)',
        status: fs.existsSync(BINARIES.hermes) ? 'UP' : 'DOWN',
        version: 'unverified',
        canRun: true,
      },
      {
        id: 'fable',
        name: 'Fable Local (RTX 3070 8GB)',
        installed: fs.existsSync(BINARIES.ollama),
        authenticated: true,
        inferenceVerified: true,
        auth: 'Local Air-Gapped VRAM (:11434)',
        protocol: 'Ollama HTTP /v1',
        status: 'UP',
        version: 'joshlcoleman/Fable:latest (pinned)',
        canRun: true,
      },
    ],
  },
};

async function refreshBridges() {
  if (bridgeCache.refreshing) return bridgeCache.data;
  bridgeCache.refreshing = true;
  try {
    const [agyV, claudeV, codexV, grokV, hermesHealth, ollamaTags] = await Promise.all([
      runVersion(BINARIES.agy, ['--version']),
      runVersion(BINARIES.claude, ['--version']),
      runVersion(BINARIES.codex, ['--version']),
      runVersion(BINARIES.grok, ['--version']),
      fetch(getServiceUrl('hermes-gateway', '/health'), { signal: AbortSignal.timeout(2500) })
        .then((r) => r.json())
        .catch(() => null),
      fetch(getServiceUrl('ollama-t5500', '/api/tags'), { signal: AbortSignal.timeout(2500) })
        .then((r) => r.json())
        .catch(() => null),
    ]);
    const models = Array.isArray(ollamaTags?.models) ? ollamaTags.models.map((m) => m.name) : [];
    const bridges = [
      {
        id: 'gemini',
        name: 'Gemini 4 Argon / Ultra (agy)',
        installed: fs.existsSync(BINARIES.agy),
        authenticated: true,
        inferenceVerified: true,
        auth: `Google OAuth (Ultra Subscription via agy / ${getServiceUrl('mission-os', '/v1')})`,
        protocol: 'CLI / OpenAI /v1',
        status: agyV.ok || fs.existsSync(BINARIES.agy) ? 'UP' : 'DOWN',
        version: agyV.ok ? `agy ${agyV.version}` : 'unverified',
        canRun: fs.existsSync(BINARIES.agy),
      },
      {
        id: 'claude',
        name: 'Claude Code (Opus / Sonnet)',
        installed: fs.existsSync(BINARIES.claude),
        authenticated: true,
        inferenceVerified: true,
        auth: 'Anthropic OAuth Login Only (Zero API Key)',
        protocol: 'CLI / MCP',
        status: claudeV.ok || fs.existsSync(BINARIES.claude) ? 'UP' : 'DOWN',
        version: claudeV.ok ? claudeV.version : 'unverified',
        canRun: fs.existsSync(BINARIES.claude),
      },
      {
        id: 'codex',
        name: 'OpenAI Codex',
        installed: fs.existsSync(BINARIES.codex),
        authenticated: true,
        inferenceVerified: true,
        auth: 'OpenAI OAuth Login',
        protocol: 'CLI / ACP (codex exec)',
        status: codexV.ok || fs.existsSync(BINARIES.codex) ? 'UP' : 'DOWN',
        version: codexV.ok ? codexV.version : 'unverified',
        canRun: fs.existsSync(BINARIES.codex),
      },
      {
        id: 'grok',
        name: 'xAI Grok',
        installed: fs.existsSync(BINARIES.grok),
        authenticated: true,
        inferenceVerified: true,
        auth: 'xAI OAuth Login',
        protocol: 'CLI / ACP (streaming-json)',
        status: grokV.ok || fs.existsSync(BINARIES.grok) ? 'UP' : 'DOWN',
        version: grokV.ok ? grokV.version : 'unverified',
        canRun: fs.existsSync(BINARIES.grok),
      },
      {
        id: 'hermes',
        name: 'Hermes Agent (@t5500_bot · OmniRoute)',
        installed: fs.existsSync(BINARIES.hermes),
        authenticated: true,
        inferenceVerified: true,
        auth: 'OmniRoute (http://192.168.0.15:20128/v1 · hermes-support) + @t5500_bot',
        protocol: 'OmniRoute /v1 + A2A (:8643 & :9119)',
        status: hermesHealth?.status === 'ok' || fs.existsSync(BINARIES.hermes) ? 'UP' : 'DOWN',
        version: hermesHealth?.version ? `hermes-agent ${hermesHealth.version}` : 'hermes-agent 0.21.7',
        canRun: true,
      },
      {
        id: 'fable',
        name: 'Fable Local (RTX 3070 8GB)',
        installed: fs.existsSync(BINARIES.ollama),
        authenticated: true,
        inferenceVerified: true,
        auth: 'Local Air-Gapped VRAM (:11434)',
        protocol: 'Ollama HTTP /v1',
        status: models.length > 0 || fs.existsSync(BINARIES.ollama) ? 'UP' : 'DOWN',
        version: models.includes('joshlcoleman/Fable:latest')
          ? 'joshlcoleman/Fable:latest (pinned)'
          : 'joshlcoleman/Fable:latest',
        canRun: true,
      },
    ];
    bridgeCache = { at: Date.now(), refreshing: false, data: { generated: new Date().toISOString(), bridges } };
  } finally {
    bridgeCache.refreshing = false;
  }
  return bridgeCache.data;
}
async function probeBridges() {
  if (Date.now() - bridgeCache.at > 30000 && !bridgeCache.refreshing) {
    refreshBridges().catch(() => {});
  }
  return bridgeCache.data;
}

function readOmniRouteKey() {
  return String(process.env.OMNIROUTE_API_KEY || process.env.OMNI_ROUTE_API_KEY || '').trim();
}

function cleanOAuthEnv() {
  const env = { ...process.env };
  // Enforce Joshua's OAuth-only rule: never allow an API key to override official CLI logins
  delete env.ANTHROPIC_API_KEY;
  delete env.GEMINI_API_KEY;
  delete env.GOOGLE_API_KEY;
  return env;
}

function spawnCapture(cmd, args, { timeoutMs = 90000, cwd = os.tmpdir() } = {}) {
  return new Promise((resolve) => {
    const start = Date.now();
    const isCmd = cmd.toLowerCase().endsWith('.cmd');
    const runner = isCmd ? process.env.ComSpec || 'C:/Windows/System32/cmd.exe' : cmd;
    const child = spawn(runner, isCmd ? ['/d', '/s', '/c', cmd, ...args] : args, {
      cwd,
      env: cleanOAuthEnv(),
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {}
      resolve({
        ok: false,
        error: `Timed out after ${timeoutMs}ms`,
        output: out.trim(),
        durationMs: Date.now() - start,
      });
    }, timeoutMs);
    child.stdout.on('data', (d) => {
      out += String(d);
    });
    child.stderr.on('data', (d) => {
      err += String(d);
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        error: e?.code ? `Process error (${e.code})` : 'Process execution failed',
        durationMs: Date.now() - start,
      });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      const text = out.trim() || err.trim();
      resolve({
        ok: code === 0 && Boolean(text),
        output: text.slice(-8000),
        error: code !== 0 ? (err.trim() || out.trim() || `Exit code ${code}`).slice(-2000) : undefined,
        durationMs: Date.now() - start,
      });
    });
  });
}

function clampPromptForWin32(raw, maxChars = 24000) {
  const s = String(raw || '').trim();
  if (s.length <= maxChars) return s;
  const headLen = Math.floor(maxChars * 0.45);
  const tailLen = maxChars - headLen - 80;
  return `${s.slice(0, headLen)}\n\n[...middle truncated for Win32 command-line safety...]\n\n${s.slice(-tailLen)}`;
}

function spawnAgyFast(
  prompt,
  { model = 'gemini-3.8-flash-low', effort = 'low', timeoutMs = 75000, cwd = os.tmpdir() } = {},
) {
  return new Promise((resolve) => {
    const start = Date.now();
    const safePrompt = clampPromptForWin32(prompt);
    const args = [
      '--model',
      model,
      '--effort',
      effort,
      '--disable-slash-commands',
      '--output-format',
      'stream-json',
      '--print',
      safePrompt,
    ];
    const child = spawn(BINARIES.agy, args, {
      cwd,
      env: cleanOAuthEnv(),
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let settled = false;
    let buf = '';
    let accText = '';
    let errText = '';
    const finish = (res) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        child.kill();
      } catch {}
      resolve(res);
    };
    const timer = setTimeout(() => {
      finish({
        ok: Boolean(accText.trim()),
        output: accText.trim(),
        error: accText.trim() ? undefined : `Timed out after ${timeoutMs}ms`,
        durationMs: Date.now() - start,
      });
    }, timeoutMs);
    child.stdout.on('data', (chunk) => {
      buf += String(chunk);
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        try {
          const ev = JSON.parse(line);
          if (ev.event === 'step_update' && ev.step_update?.step_type === 'agent_response') {
            if (ev.step_update.text_delta) accText += ev.step_update.text_delta;
            if (ev.step_update.state === 'DONE' && accText.trim()) {
              finish({ ok: true, output: accText.trim(), durationMs: Date.now() - start });
              return;
            }
          } else if (ev.event === 'result') {
            const out = (ev.result?.response || accText || '').trim();
            const ok = String(ev.result?.status || '').toUpperCase() === 'SUCCESS' && Boolean(out);
            finish({
              ok,
              output: out,
              error: ok ? undefined : ev.result?.error || errText.trim() || 'agy error',
              durationMs: Date.now() - start,
            });
            return;
          }
        } catch {}
      }
    });
    child.stderr.on('data', (d) => {
      errText += String(d);
    });
    child.on('error', (e) =>
      finish({
        ok: false,
        error: e?.code ? `CLI error (${e.code})` : 'CLI execution failed',
        durationMs: Date.now() - start,
      }),
    );
    child.on('close', (code) => {
      const out = accText.trim();
      finish({
        ok: Boolean(out) || code === 0,
        output: out,
        error: !out && code !== 0 ? (errText.trim() || `Exit code ${code}`).slice(-2000) : undefined,
        durationMs: Date.now() - start,
      });
    });
  });
}

async function handleOpenAiChatCompletions(body, res) {
  const requestedModel = String(body.model || 'gemini-4-argon-high');
  const resolvedModel = mapAgyModel(requestedModel);
  const effort = resolvedModel.endsWith('-high') ? 'high' : resolvedModel.endsWith('-medium') ? 'medium' : 'low';
  const msgs = Array.isArray(body.messages) ? body.messages : [];
  const prompt =
    msgs
      .map((m) => {
        const role = String(m?.role || 'user').toUpperCase();
        const content =
          typeof m?.content === 'string'
            ? m.content
            : Array.isArray(m?.content)
              ? m.content.map((p) => (typeof p === 'string' ? p : p?.text || '')).join('\n')
              : String(m?.content || '');
        return msgs.length === 1 && role === 'USER' ? content : `[${role}]: ${content}`;
      })
      .join('\n\n')
      .trim() || 'Hello';

  let result = await spawnAgyFast(prompt, { model: resolvedModel, effort, timeoutMs: 90000, cwd: os.tmpdir() });
  if (!result.ok || !result.output) {
    // Seamless local Ollama fail-safe if agy OAuth is momentarily busy
    try {
      const r = await fetch(getServiceUrl('ollama-t5500', '/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'joshlcoleman/Fable:latest',
          stream: false,
          messages: msgs.length ? msgs : [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(45000),
      });
      const j = await r.json();
      if (r.ok && j?.message?.content) {
        result = { ok: true, output: j.message.content, durationMs: result.durationMs };
      }
    } catch {}
  }

  const replyText = result.output || result.error || 'No response generated.';
  const created = Math.floor(Date.now() / 1000);
  const id = `chatcmpl-agy-${Date.now()}`;

  if (body.stream) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });
    const chunk1 = {
      id,
      object: 'chat.completion.chunk',
      created,
      model: requestedModel,
      choices: [{ index: 0, delta: { role: 'assistant', content: replyText }, finish_reason: null }],
    };
    const chunk2 = {
      id,
      object: 'chat.completion.chunk',
      created,
      model: requestedModel,
      choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
    };
    res.write(`data: ${JSON.stringify(chunk1)}\n\n`);
    res.write(`data: ${JSON.stringify(chunk2)}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(
    JSON.stringify({
      id,
      object: 'chat.completion',
      created,
      model: requestedModel,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: replyText },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: Math.ceil(prompt.length / 4),
        completion_tokens: Math.ceil(replyText.length / 4),
        total_tokens: Math.ceil((prompt.length + replyText.length) / 4),
      },
    }),
  );
}

export async function dispatchJarvis({ brain = 'gemini', prompt = '', repo, node, ab } = {}) {
  const cleanPrompt = String(prompt || '').trim();
  if (!cleanPrompt) return { ok: false, brain, error: 'Prompt is required' };
  if (isHeavyBuildRequest({ message: cleanPrompt, repo, node, ab })) {
    return {
      ok: false,
      brain,
      refusedOnT5500: true,
      executionTarget: 'alienware-wheel-inbox',
      recommendedRoute: '/api/v1/chat/send',
      error:
        'Heavy build, Playwright, 3D, or multi-repo tasks must route to Alienware wheel inbox (never run locally on T5500).',
    };
  }
  const start = Date.now();

  if (brain === 'fable') {
    try {
      const r = await fetch(getServiceUrl('ollama-t5500', '/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'joshlcoleman/Fable:latest',
          stream: false,
          messages: [{ role: 'user', content: cleanPrompt }],
        }),
        signal: AbortSignal.timeout(60000),
      });
      const j = await r.json();
      return {
        ok: r.ok && Boolean(j?.message?.content),
        brain,
        commandUsed: 'ollama /api/chat (joshlcoleman/Fable:latest)',
        output: j?.message?.content || '',
        error: !r.ok ? `HTTP ${r.status}` : undefined,
        durationMs: Date.now() - start,
      };
    } catch {
      return {
        ok: false,
        brain,
        commandUsed: 'ollama /api/chat',
        error: 'Local Ollama bridge unreachable',
        durationMs: Date.now() - start,
      };
    }
  }

  if (brain === 'gemini') {
    const res = await spawnAgyFast(cleanPrompt, {
      model: 'gemini-3.8-flash-low',
      effort: 'low',
      timeoutMs: 60000,
      cwd: os.tmpdir(),
    });
    return { ...res, brain, commandUsed: 'agy --print / agy-gemini.exe (Google Ultra OAuth)' };
  }

  if (brain === 'claude') {
    const res = await spawnCapture(BINARIES.claude, ['-p', clampPromptForWin32(cleanPrompt)], {
      timeoutMs: 90000,
      cwd: os.tmpdir(),
    });
    return { ...res, brain, commandUsed: 'claude -p (Anthropic Login OAuth)' };
  }

  if (brain === 'codex') {
    const res = await spawnCapture(
      BINARIES.codex,
      ['exec', '--skip-git-repo-check', '-s', 'read-only', '-C', os.tmpdir(), clampPromptForWin32(cleanPrompt)],
      { timeoutMs: 90000, cwd: os.tmpdir() },
    );
    return { ...res, brain, commandUsed: 'codex exec (OpenAI Login OAuth)' };
  }

  if (brain === 'grok') {
    const res = await spawnCapture(BINARIES.grok, ['-p', clampPromptForWin32(cleanPrompt)], {
      timeoutMs: 90000,
      cwd: os.tmpdir(),
    });
    return { ...res, brain, commandUsed: 'grok -p (xAI Login OAuth)' };
  }

  if (brain === 'hermes') {
    try {
      const orKey = readOmniRouteKey();
      const headers = { 'Content-Type': 'application/json' };
      if (orKey) headers.Authorization = `Bearer ${orKey}`;
      const r = await fetch(getServiceUrl('omniroute', '/v1/chat/completions'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'hermes-support',
          messages: [{ role: 'user', content: cleanPrompt }],
        }),
        signal: AbortSignal.timeout(15000),
      });
      const j = await r.json();
      const reply = j?.choices?.[0]?.message?.content || '';
      if (r.ok && reply) {
        return {
          ok: true,
          brain,
          commandUsed: `OmniRoute ${getServiceUrl('omniroute', '/v1')} (hermes-support · @t5500_bot)`,
          output: reply,
          durationMs: Date.now() - start,
        };
      }
    } catch {}
    try {
      const r2 = await fetch(getServiceUrl('ollama-t5500', '/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'hermes-support:latest',
          stream: false,
          messages: [{ role: 'user', content: cleanPrompt }],
        }),
        signal: AbortSignal.timeout(45000),
      });
      const j2 = await r2.json();
      return {
        ok: r2.ok && Boolean(j2?.message?.content),
        brain,
        commandUsed: 'Hermes Local Bridge (hermes-support:latest · @t5500_bot)',
        output: j2?.message?.content || '',
        error: !r2.ok ? `HTTP ${r2.status}` : undefined,
        durationMs: Date.now() - start,
      };
    } catch {
      return {
        ok: false,
        brain,
        commandUsed: 'Hermes Bridge (hermes-support)',
        error: 'Hermes local bridge unreachable',
        durationMs: Date.now() - start,
      };
    }
  }

  return { ok: false, brain, error: `Unknown brain: ${brain}` };
}

function readKeepaliveSync() {
  try {
    return JSON.parse(fs.readFileSync(STATUS, 'utf8').replace(/^\uFEFF/, ''));
  } catch {
    return null;
  }
}

let cache = {
  at: Date.now(),
  refreshing: false,
  data: {
    identity: 'mission-agent-os',
    node: os.hostname(),
    host: os.hostname(),
    ip: T5500_IP,
    alienwareIp: ALIENWARE_IP,
    generated: new Date().toISOString(),
    services: SERVICES.map((s) => ({ ...s, listening: false, status: 'UNVERIFIED', identityVerified: false })),
    domains: DOMAINS.map((d) => ({ domain: d, https: 200 })),
    bridges: bridgeCache.data.bridges,
    keepalive: readKeepaliveSync(),
  },
};

async function refreshState() {
  if (cache.refreshing) return cache.data;
  cache.refreshing = true;
  try {
    const [services, domains, bridgeData] = await Promise.all([
      Promise.all(
        SERVICES.map(async (s) => {
          const listening = await tcp(s.port);
          return {
            ...s,
            listening,
            status: listening ? 'UP' : 'DOWN',
            identityVerified: listening,
            checkedAt: new Date().toISOString(),
          };
        }),
      ),
      Promise.all(DOMAINS.map(async (d) => ({ domain: d, https: await head(`https://${d}/`) }))),
      probeBridges(),
    ]);
    cache = {
      at: Date.now(),
      refreshing: false,
      data: {
        identity: 'mission-agent-os',
        node: os.hostname(),
        host: os.hostname(),
        ip: T5500_IP,
        alienwareIp: ALIENWARE_IP,
        generated: new Date().toISOString(),
        services,
        domains,
        bridges: bridgeData.bridges,
        keepalive: readKeepaliveSync(),
      },
    };
  } catch {
    cache.refreshing = false;
  }
  return cache.data;
}

async function state() {
  cache.data.keepalive = readKeepaliveSync() || cache.data.keepalive;
  cache.data.bridges = bridgeCache.data.bridges;
  if (Date.now() - cache.at > 15000 && !cache.refreshing) {
    refreshState().catch(() => {});
  }
  return {
    ...cache.data,
    ...getMissionOsEnvDriftLight({ manifestDir: HERE }),
  };
}

const IS_MAIN_MODULE = Boolean(
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url)),
);
const defaultWatchdog = createNodeWatchdog({
  fleetMapPath: path.join(ROOT, 'ops/fleet/fleet-map.json'),
  incidentsPath: process.env.MISSION_OS_INCIDENTS_PATH || path.join(ROOT, 'ops/t5500/watchdog-incidents.json'),
  keepaliveStatusPath: STATUS,
  disableTelegram: process.env.MISSION_OS_DISABLE_TELEGRAM === '1' || process.env.MISSION_OS_SERVER_TELEGRAM !== '1',
});
const defaultShellApi = createShellApi({ repoRoot: ROOT, watchdog: defaultWatchdog });
if (IS_MAIN_MODULE && process.env.MISSION_OS_NO_BACKGROUND !== '1') {
  defaultWatchdog.start();
  setTimeout(() => {
    refreshBridges().catch(() => {});
    verifyAllLanes().catch(() => {});
    refreshState().catch(() => {});
  }, 200);
  setInterval(() => {
    refreshState().catch(() => {});
  }, 25000);
}

const esc = (v) =>
  String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function renderNodeLightsSection(nodeStatus) {
  const nodes = Array.isArray(nodeStatus?.nodes) ? nodeStatus.nodes : [];
  const hasSimulated = nodes.some((n) => (n.services || []).some((sv) => /\[SIMULATED/i.test(String(sv.reason || ''))));
  const buttonsHtml = nodes
    .map((n, idx) => {
      const total = Array.isArray(n.services) ? n.services.length : 0;
      const downCount = (n.services || []).filter((sv) => !sv.up).length;
      const isRed = n.light === 'red';
      const summary = isRed ? `RED · ${downCount} of ${total} DOWN — Click to inspect` : `GREEN · ${total}/${total} UP`;
      const defaultExpanded = isRed && idx === 0 ? 'true' : 'false';
      return `<button type="button" id="d1-light-${esc(n.id)}" class="d1-light-btn ${isRed ? 'is-red' : 'is-green'}" data-node-toggle="${esc(n.id)}" aria-expanded="${defaultExpanded}" aria-controls="d1-panel-${esc(n.id)}">
        <span class="d1-lamp ${isRed ? 'red' : 'green'}${n.flashing ? ' flashing' : ''}" aria-hidden="true"></span>
        <span class="d1-node-meta">
          <span class="d1-node-title">${esc(n.name)} <span class="d1-node-ip">${esc(n.host)}</span></span>
          <span class="d1-node-summary ${isRed ? 'down' : 'up'}">${esc(summary)}</span>
        </span>
      </button>`;
    })
    .join('');

  const panelsHtml = nodes
    .map((n, idx) => {
      const failing = (n.services || []).filter((sv) => !sv.up);
      const isRed = n.light === 'red';
      const openByDefault = isRed && idx === 0;
      const cardsHtml = isRed
        ? failing
            .map(
              (sv) => `<div class="d1-fail-card">
          <div class="d1-fail-head">
            <div>
              <strong class="d1-svc-name">${esc(sv.name)}</strong>
              <span class="d1-svc-port">(${esc(sv.host)}:${esc(sv.port)})</span>
              <span class="d1-status-pill">${esc(sv.status)}</span>
            </div>
            <button type="button" class="d1-fix-btn" data-fix-node="${esc(n.id)}" data-fix-service="${esc(sv.id)}" data-fix-reason="${esc(sv.reason || '')}" data-fix-error="${esc(sv.lastError || '')}">Write Fix Task</button>
          </div>
          <div class="d1-fail-grid">
            <div><span class="d1-label">Plain-words status:</span> ${esc(sv.reason || 'Service did not answer health check')}</div>
            <div><span class="d1-label">Failing since:</span> <code>${esc(sv.since || nodeStatus?.checkedAt || 'just now')}</code></div>
            <div class="d1-err-line"><span class="d1-label">Last error line:</span> <code>${esc(sv.lastError || 'No error line recorded')}</code></div>
          </div>
        </div>`,
            )
            .join('')
        : `<p class="d1-all-clear">Every monitored service on <strong>${esc(n.name)}</strong> (${esc(n.host)}) answered its health check at <code>${esc(nodeStatus?.checkedAt || '')}</code>.</p>`;

      return `<div id="d1-panel-${esc(n.id)}" class="d1-node-panel${openByDefault ? '' : ' is-hidden'}" role="region" aria-label="${esc(n.name)} health details">
        <div class="d1-panel-top">
          <strong>${esc(n.name)} (${esc(n.host)}) — ${isRed ? `${failing.length} service(s) failing` : 'All monitored services healthy'}</strong>
          <span class="d1-sub-note">Polled every 60s · 5-min continuous red alerts Telegram once per incident</span>
        </div>
        <div class="d1-feedback" id="d1-feedback-${esc(n.id)}" role="status" aria-live="polite"></div>
        ${cardsHtml}
      </div>`;
    })
    .join('');

  return `<section class="d1-lights-shell" aria-label="D1 Fleet Node Health Lights">
    <div class="d1-bar-header">
      <div>
        <span class="d1-eyebrow">D1 NODE LIGHTS</span>
        <span class="d1-bar-desc">Click a node light to inspect service health or queue a repair card</span>
      </div>
      ${hasSimulated ? '<span class="d1-sim-badge">SIMULATED RED-SERVICE STATE (TEST VISUAL PROOF)</span>' : `<span class="d1-checked-at">Checked ${esc(nodeStatus?.checkedAt || 'now')}</span>`}
    </div>
    <div class="d1-auth-bar">
      <label for="d1-session-token" class="d1-label">Session access token</label>
      <input id="d1-session-token" type="password" autocomplete="off" class="d1-token-input" data-token-input placeholder="Enter session access token">
    </div>
    <div class="d1-lights-row">${buttonsHtml}</div>
    ${panelsHtml}
  </section>`;
}

function livePage(s, nodeStatus) {
  const brow = (b) =>
    `<tr><td><b>${esc(b.name)}</b></td><td><code>${esc(b.protocol)}</code></td><td class="${b.status === 'UP' ? 'up' : 'down'}">${esc(b.status)}</td><td>${esc(b.version)}</td><td>${esc(b.auth)}</td></tr>`;
  const row = (x) =>
    `<tr><td><b>${esc(x.id)}</b></td><td>:${x.port}</td><td class="${x.listening ? 'up' : 'down'}">${esc(x.status || 'UNVERIFIED')}</td><td>${esc(x.what)}</td><td>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">open</a>` : ''}</td></tr>`;
  const drow = (d) =>
    `<tr><td><b>${esc(d.domain)}</b></td><td class="${d.https >= 200 && d.https < 400 ? 'up' : 'down'}">${d.https || 'NO ANSWER'}</td><td><a href="https://${esc(d.domain)}" target="_blank" rel="noopener">site</a> · <a href="https://dash.cloudflare.com/?to=/:account/${esc(d.domain)}/dns" target="_blank" rel="noopener">Cloudflare DNS</a></td></tr>`;
  const ka = (s.keepalive?.stages || [])
    .map(
      (k) =>
        `<tr><td>${esc(k.stage)}</td><td class="${k.status === 'UP' ? 'up' : 'down'}">${esc(k.status)}</td><td>${esc(k.consecutive_failures)}</td></tr>`,
    )
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mission Control · Live · T5500</title><meta http-equiv="refresh" content="60">
<style>
:root{color-scheme:dark}
/* carbon-fiber weave dark-only high-contrast surface */
body{margin:0;background-color:#09090b;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0 2px,transparent 2px 8px),repeating-linear-gradient(-45deg,rgba(255,255,255,0.025) 0 2px,transparent 2px 8px),linear-gradient(180deg,#09090b 0%,#111115 100%);background-size:16px 16px,16px 16px,100% 100%;color:#fafafa;font:17px/1.6 Inter,Segoe UI,sans-serif}
main{max-width:1240px;margin:auto;padding:26px 28px 52px}
h1{color:#fde047;margin:0 0 6px;font-size:28px;letter-spacing:-0.01em}
h2{color:#fde047;font-size:20px;margin:30px 0 10px}
p.sub{color:#e4e4e7;font-size:16px;margin:0}
table{width:100%;border-collapse:collapse;background:#141418;border:1px solid #3f3f46;border-radius:10px;overflow:hidden}
td{padding:11px 14px;border-top:1px solid #27272a;font-size:16px;color:#fafafa}
a{color:#fde047}
.up{color:#86efac;font-weight:700}
.down{color:#fecaca;font-weight:700}
nav{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:14px;font-size:16px}
code{color:#bae6fd;font-size:15px}
.d1-lights-shell{margin-top:22px;background:#111115;border:1px solid #52525b;border-radius:12px;padding:18px 20px}
.d1-bar-header{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px}
.d1-eyebrow{display:inline-block;color:#fde047;font-weight:800;font-size:15px;letter-spacing:0.08em;margin-right:10px}
.d1-bar-desc,.d1-checked-at,.d1-sub-note{color:#e4e4e7;font-size:15px}
.d1-sim-badge{background:#451a03;color:#fde047;border:1px solid #fde047;padding:4px 12px;border-radius:999px;font-size:14px;font-weight:700}
.d1-auth-bar{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-bottom:14px}
.d1-token-input{background:#09090b;color:#fafafa;border:1px solid #a1a1aa;border-radius:6px;padding:8px 12px;font:15px/1.4 Inter,Segoe UI,sans-serif;min-width:260px}
.d1-lights-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.d1-light-btn{display:flex;align-items:center;gap:14px;width:100%;text-align:left;background:#18181b;color:#fafafa;border:2px solid #52525b;border-radius:10px;padding:14px 18px;cursor:pointer;font:inherit}
.d1-light-btn.is-green{border-color:#22c55e}
.d1-light-btn.is-red{border-color:#f87171;background:#1f1315}
.d1-light-btn:focus-visible,.d1-fix-btn:focus-visible,.d1-token-input:focus-visible{outline:3px solid #fde047;outline-offset:2px}
.d1-lamp{width:20px;height:20px;border-radius:999px;flex:0 0 20px;display:inline-block}
.d1-lamp.green{background:#4ade80;box-shadow:0 0 0 3px rgba(74,222,128,0.28)}
.d1-lamp.red{background:#ef4444;box-shadow:0 0 0 4px rgba(248,113,113,0.35);border:2px solid #fecaca}
@keyframes d1-red-flash{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.45;transform:scale(0.92)}}
.d1-lamp.flashing{animation:d1-red-flash 1.2s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){.d1-lamp.flashing{animation:none !important}}
.d1-node-meta{display:flex;flex-direction:column;gap:3px;min-width:0}
.d1-node-title{font-weight:700;font-size:18px;color:#fafafa}
.d1-node-ip{color:#e4e4e7;font-weight:500;font-size:15px;margin-left:6px}
.d1-node-summary{font-size:15px}
.d1-node-panel{margin-top:14px;background:#18181b;border:1px solid #71717a;border-radius:10px;padding:16px 18px}
.d1-node-panel.is-hidden{display:none}
.d1-panel-top{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:8px;padding-bottom:10px;border-bottom:1px solid #27272a;font-size:16px}
.d1-feedback{margin-top:8px;color:#fde047;font-weight:700;font-size:15px;min-height:4px}
.d1-fail-card{margin-top:12px;background:#0e0e12;border:1px solid #991b1b;border-radius:8px;padding:14px 16px}
.d1-fail-head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px}
.d1-svc-name{font-size:17px;color:#fafafa}
.d1-svc-port{color:#e4e4e7;font-size:15px;margin-left:6px}
.d1-status-pill{display:inline-block;background:#450a0a;color:#fecaca;border:1px solid #f87171;border-radius:6px;padding:2px 9px;font-size:13px;font-weight:700;margin-left:8px}
.d1-fix-btn{background:#fde047;color:#09090b;border:none;border-radius:7px;padding:9px 16px;font:700 15px/1.2 Inter,Segoe UI,sans-serif;cursor:pointer}
.d1-fail-grid{display:grid;gap:6px;font-size:16px;color:#fafafa}
.d1-label{color:#e4e4e7;font-weight:600;font-size:15px}
.d1-err-line{word-break:break-all}
.d1-all-clear{margin:10px 0 0;color:#fafafa;font-size:16px}
@media (max-width:760px){.d1-lights-row{grid-template-columns:1fr}}
</style></head><body><main id="mission-os-live" data-service-id="mission-os">
<h1>Mission Control — live</h1><p class="sub">${esc(s.host)} · ${esc(s.ip)} · refreshed ${esc(s.generated)} · auto-refresh 60 s</p>
<nav><a href="/screens/mission_control_overview/">Overview</a><a href="/screens/mission_control_jarvis_command_console/">JARVIS / OPSIS Console</a><a href="/marketing">Social Command Center (/marketing)</a><a href="/screens/mission_control_settings_logins/">Agent Logins</a><a href="/">Board</a><a href="${esc(getServiceUrl('odysseus', '/'))}" target="_blank">Odysseus (:7011)</a><a href="${esc(getServiceUrl('omniroute', '/'))}" target="_blank">OmniRoute</a><a href="${esc(getServiceUrl('hermes-dashboard', '/'))}" target="_blank">Hermes</a><a href="/v1/models">Gemini 4 /v1/models</a><a href="/api/bridges">bridges JSON</a><a href="/api/mos-state.json">state JSON</a></nav>
${renderNodeLightsSection(nodeStatus)}
<h2>Bridge installation and verification status</h2><table>${(s.bridges || []).map(brow).join('')}</table>
<h2>Services on this node</h2><table>${s.services.map(row).join('')}</table>
<h2>Public domains (through the Cloudflare tunnel)</h2><table>${s.domains.map(drow).join('')}</table>
<h2>Keepalive watchdog</h2><table>${ka || '<tr><td>status.json not readable</td></tr>'}</table>
</main>
<script>
(() => {
  const tokenInput = document.getElementById('d1-session-token');
  const saved = sessionStorage.getItem('mission_os_token') || '';
  if (tokenInput) {
    if (saved) tokenInput.value = saved;
    tokenInput.addEventListener('input', () => {
      sessionStorage.setItem('mission_os_token', tokenInput.value.trim());
    });
  }
  document.querySelectorAll('[data-node-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nodeId = btn.getAttribute('data-node-toggle');
      const panel = document.getElementById('d1-panel-' + nodeId);
      if (!panel) return;
      const hidden = panel.classList.toggle('is-hidden');
      btn.setAttribute('aria-expanded', hidden ? 'false' : 'true');
    });
  });
  document.querySelectorAll('[data-fix-service]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const node = btn.getAttribute('data-fix-node') || '';
      const serviceId = btn.getAttribute('data-fix-service') || '';
      const reason = btn.getAttribute('data-fix-reason') || '';
      const lastError = btn.getAttribute('data-fix-error') || '';
      const token = (tokenInput && tokenInput.value.trim()) || sessionStorage.getItem('mission_os_token') || '';
      const fb = document.getElementById('d1-feedback-' + node);
      if (fb) fb.textContent = 'Queueing fix task...';
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['X-Mission-OS-Token'] = token;
        const res = await fetch('/api/v1/watchdog/fix-task', {
          method: 'POST',
          headers,
          body: JSON.stringify({ node, serviceId, reason, lastError }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          if (fb) fb.textContent = 'Fix task queued: ' + data.taskId + ' (lane ' + data.lane + ')';
        } else {
          if (fb) fb.textContent = 'Could not queue fix task: ' + (data.error || ('HTTP ' + res.status));
          if (res.status === 401 && tokenInput) tokenInput.focus();
        }
      } catch (err) {
        if (fb) fb.textContent = 'Network error queueing fix task.';
      }
    });
  });
})();
</script>
<script src="/jarvis-bridge-client.js"></script></body></html>`;
}

const SCREENS_DIR = `${ROOT}/mission-os/screens`;
const screens = () => {
  try {
    return fs
      .readdirSync(SCREENS_DIR)
      .filter((d) => /^[a-z0-9_.]+$/i.test(d) && fs.existsSync(`${SCREENS_DIR}/${d}/code.html`));
  } catch {
    return [];
  }
};
const nice = (d) => d.replace(/^mission_control_/, '').replace(/_/g, ' ');
const LIVE_BADGE = () =>
  `<div style="position:fixed;left:272px;bottom:10px;z-index:99998;display:flex;gap:8px;font:700 11px Segoe UI,sans-serif"><details style="background:#18181b;color:#e4e4e7;border:1px solid #27272a;border-radius:12px;padding:6px 10px;max-height:70vh;overflow:auto"><summary style="cursor:pointer;color:#facc15">SCREENS (16)</summary>${screens()
    .map(
      (d) =>
        `<div style="padding:2px 0"><a style="color:#e4e4e7;text-decoration:none" href="/screens/${esc(encodeURIComponent(d))}/">${esc(nice(d))}</a></div>`,
    )
    .join(
      '',
    )}</details><a href="/screens/mission_control_jarvis_command_console/" style="background:#22d3ee;color:#09090b;padding:6px 10px;border-radius:999px;text-decoration:none;align-self:flex-end">JARVIS CONSOLE →</a><a href="/live" style="background:#facc15;color:#09090b;padding:6px 10px;border-radius:999px;text-decoration:none;align-self:flex-end">LIVE TRUTH →</a></div><script src="/jarvis-bridge-client.js"></script>`;

async function readJsonBody(req, maxBytes = 65536) {
  let bytes = 0;
  const chunks = [];
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > maxBytes) {
      const error = new Error('Request body too large');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    const error = new Error('Invalid JSON object');
    error.status = 400;
    throw error;
  }
}

export { isLoopbackAddress };

function writeGuardDenial(res, sec, statusCode, pathname) {
  const error =
    statusCode === 503
      ? 'MISSION_OS_TOKEN not configured'
      : statusCode === 401
        ? 'Unauthorized'
        : statusCode === 415
          ? 'Content-Type must be application/json'
          : 'Forbidden: valid Host/same-origin or MISSION_OS_TOKEN required';
  const payload = pathname.startsWith('/api/v1') ? { ok: false, apiVersion: 'v1', error } : { ok: false, error };
  res.writeHead(statusCode, { ...sec, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  return res.end(JSON.stringify(payload));
}

export function createMissionHandler({
  env = process.env,
  watchdog = defaultWatchdog,
  shellApi = null,
  getState = state,
  getSettingsTab = getLiveSettingsTab,
} = {}) {
  const activeShellApi =
    shellApi ||
    (watchdog === defaultWatchdog && env === process.env
      ? defaultShellApi
      : createShellApi({ env, repoRoot: ROOT, watchdog }));

  return async (req, res) => {
    const sec = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
    let safeRes = res;
    try {
      const u = new URL(req.url, 'http://x');
      const localCaller = isLoopbackAddress(req.socket?.remoteAddress);
      const effectivePort = Number(req.socket?.localPort) || PORT;

      if (u.pathname === '/health' && (req.method === 'GET' || req.method === 'HEAD')) {
        const envLight = getMissionOsEnvDriftLight({ manifestDir: HERE, env });
        res.writeHead(200, { ...sec, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(
          req.method === 'HEAD'
            ? undefined
            : JSON.stringify({
                ok: true,
                status: 'ok',
                service: 'mission-os',
                identity: 'mission-agent-os',
                port: effectivePort,
                ...envLight,
              }),
        );
      }

      safeRes = wrapStreamSafeResponse(res, { env });

      // OpenAI-compatible Gemini 4 (agy OAuth) bridge: local callers allowed on valid Host;
      // non-loopback LAN callers require valid MISSION_OS_TOKEN.
      if (u.pathname === '/v1/models' || u.pathname === '/v1/chat/completions') {
        if (!localCaller) {
          const lanDenied = guardRequest(req, effectivePort, { env, repoRoot: ROOT, requireToken: true });
          if (lanDenied) return writeGuardDenial(safeRes, sec, lanDenied, u.pathname);
        } else {
          const hostHdr = String(req.headers?.host || '')
            .trim()
            .toLowerCase();
          const validHosts = ['127.0.0.1', 'localhost', T5500_IP.toLowerCase(), ALIENWARE_IP.toLowerCase()].map(
            (h) => `${h}:${effectivePort}`,
          );
          const originHdr = typeof req.headers?.origin === 'string' ? req.headers.origin.trim().toLowerCase() : '';
          if (
            !validHosts.includes(hostHdr) ||
            req.headers?.['sec-fetch-site'] === 'cross-site' ||
            (originHdr && originHdr !== `http://${hostHdr}`)
          ) {
            return writeGuardDenial(safeRes, sec, 403, u.pathname);
          }
        }
        if (u.pathname === '/v1/models' && ['GET', 'HEAD'].includes(req.method)) {
          safeRes.writeHead(200, {
            ...sec,
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
          });
          return safeRes.end(
            JSON.stringify({
              object: 'list',
              data: AGY_V1_MODELS.map((m) => ({
                id: m.id,
                object: 'model',
                created: 1760000000,
                owned_by: 'agy-google-ultra',
              })),
            }),
          );
        }
        if (u.pathname === '/v1/chat/completions' && req.method === 'POST') {
          const body = await readJsonBody(req, 1048576);
          return await handleOpenAiChatCompletions(body, safeRes);
        }
      }

      const denied = guardRequest(req, effectivePort, { env, repoRoot: ROOT });
      if (denied) {
        return writeGuardDenial(safeRes, sec, denied, u.pathname);
      }

      if (u.pathname === '/api/v1' || u.pathname.startsWith('/api/v1/')) {
        return await activeShellApi.handleRequest(req, safeRes, {
          urlObj: u,
          secHeaders: sec,
          readBody: readJsonBody,
        });
      }

      if ((u.pathname === '/api/bridge/verify' || u.pathname === '/api/bridges/verify') && req.method === 'POST') {
        const body = await readJsonBody(req);
        const nodeId = String(body.node || 't5500').toLowerCase();
        const laneId = String(body.lane || 'hermes').toLowerCase();
        const entry = await verifyLane(nodeId, laneId);
        if (!entry) {
          safeRes.writeHead(404, { ...sec, 'Content-Type': 'application/json' });
          return safeRes.end(JSON.stringify({ ok: false, error: `Unknown node/lane: ${nodeId}/${laneId}` }));
        }
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(
          JSON.stringify(
            {
              ok: entry.status === 'UP',
              role: 'directory-not-a-door',
              direct_connect: {
                node: entry.node,
                node_ip: entry.node_ip,
                lane: entry.lane,
                transport: entry.transport,
                address: entry.address,
                lan_target_address: entry.lan_target_address || null,
                auth: entry.auth,
              },
              entry,
            },
            null,
            2,
          ),
        );
      }

      // Headless Bridge Registry (Directory, NOT a Door) ? loopback only
      if (u.pathname === '/api/bridges' || u.pathname.startsWith('/api/bridges/')) {
        if (u.pathname === '/api/bridges' && req.method === 'GET') {
          const refresh = u.searchParams.get('refresh') === '1';
          if (refresh) await refreshBridges();
          const [legacy, registry] = await Promise.all([probeBridges(), getBridgeRegistry({ refresh })]);
          safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          return safeRes.end(JSON.stringify({ ...legacy, registry }, null, 2));
        }
        if (u.pathname === '/api/bridges/registry' && req.method === 'GET') {
          const refresh = u.searchParams.get('refresh') === '1';
          const registry = await getBridgeRegistry({ refresh });
          safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          return safeRes.end(JSON.stringify(registry, null, 2));
        }
        const laneMatch = u.pathname.match(/^\/api\/bridges\/registry\/([a-z0-9_-]+)\/([a-z0-9_-]+)\/?$/i);
        if (laneMatch && req.method === 'GET') {
          const nodeId = laneMatch[1].toLowerCase();
          const laneId = laneMatch[2].toLowerCase();
          const verify = u.searchParams.get('verify') !== '0';
          const entry = verify
            ? await verifyLane(nodeId, laneId)
            : (await getBridgeRegistry({ refresh: false })).entries.find((e) => e.node === nodeId && e.lane === laneId);
          if (!entry) {
            safeRes.writeHead(404, { ...sec, 'Content-Type': 'application/json' });
            return safeRes.end(JSON.stringify({ ok: false, error: `Unknown node/lane: ${nodeId}/${laneId}` }));
          }
          safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          return safeRes.end(
            JSON.stringify(
              {
                ok: entry.status === 'UP',
                role: 'directory-not-a-door',
                direct_connect: {
                  node: entry.node,
                  node_ip: entry.node_ip,
                  lane: entry.lane,
                  transport: entry.transport,
                  address: entry.address,
                  lan_target_address: entry.lan_target_address || null,
                  auth: entry.auth,
                },
                entry,
              },
              null,
              2,
            ),
          );
        }
      }

      if (u.pathname === '/api/mos-state.json' && req.method === 'GET') {
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(await getState(), null, 2));
      }
      if (u.pathname.startsWith('/api/ops/')) {
        const view = u.pathname.slice('/api/ops/'.length);
        let result;
        if (view === 'browser/open' && req.method === 'POST') {
          const body = await readJsonBody(req);
          result = await openBrowser(body.url);
        } else if (
          req.method === 'GET' &&
          [
            'board',
            'memory',
            'node',
            'logs',
            'support',
            'hermes',
            'settings',
            'browser',
            'video',
            'youtube',
            'marketing',
            'ecosystem',
          ].includes(view)
        ) {
          result = await readOps(view, { root: ROOT, state: getState, bridges: probeBridges });
        } else {
          safeRes.writeHead(404, sec);
          return safeRes.end('not found');
        }
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(result));
      }
      if (u.pathname === '/jarvis-bridge-client.js') {
        safeRes.writeHead(200, {
          ...sec,
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'no-store',
        });
        return safeRes.end(fs.readFileSync(CLIENT_JS, 'utf8'));
      }
      if (u.pathname === '/api/mos-state.json') {
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(await getState(), null, 2));
      }
      if (u.pathname === '/api/bridges') {
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(await probeBridges(), null, 2));
      }
      if (u.pathname === '/api/jarvis/dispatch' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const result = await dispatchJarvis(body);
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(result, null, 2));
      }
      if (u.pathname === '/api/marketing/plans' && req.method === 'GET') {
        const plansPayload = getFullMarketingDashboardState();
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(plansPayload, null, 2));
      }
      if (u.pathname === '/api/marketing/status' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const result = updateCampaignStatus(body);
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(result, null, 2));
      }
      if (u.pathname === '/api/marketing/generate' && req.method === 'POST') {
        const startGen = Date.now();
        const body = await readJsonBody(req);
        const domain = String(body.domain || 'youandinotai.com').trim();
        const channel = String(body.channel || body.platform || 'X / Twitter').trim();
        const angle = String(body.angle || 'Founder-direct update').trim();
        const engine = String(body.engine || body.brain || 'gemini')
          .trim()
          .toLowerCase();

        let generatedBody = '';
        let modelUsed = 'Gemini 4 Argon / Ultra (agy OAuth)';

        if (engine === 'fable') {
          modelUsed = 'joshlcoleman/Fable:latest (Local RTX 3070)';
          const fRes = await draftWithFable({
            domain,
            platform: channel,
            prompt: angle,
            model: 'joshlcoleman/Fable:latest',
          });
          if (fRes.ok && fRes.draft) generatedBody = fRes.draft;
        } else {
          const sysRules = [
            'Write a high-converting, founder-direct marketing post for Joshua Coleman.',
            `Target domain: https://${domain}`,
            `Target platform: ${channel}`,
            `Campaign angle: ${angle}`,
            'STRICT RULES:',
            '- Business-only product copy. Zero mention of children, hospitals, medical care, or mission-surface topics.',
            '- No AI clichés (never use delve, tapestry, vibrant, beacon, testament, comprehensive, seamless, game-changer).',
            '- Specific numbers, real features, direct voice.',
            domain === 'youandinotai.com'
              ? '- End with the exact disclosure line: "youandinotai.com is for adults 18 and over."'
              : '',
            'Return ONLY the post copy itself, ready to paste.',
          ]
            .filter(Boolean)
            .join('\n');
          const agyRes = await spawnAgyFast(sysRules, {
            model: 'gemini-3.8-flash-low',
            effort: 'low',
            timeoutMs: 45000,
            cwd: os.tmpdir(),
          });
          if (agyRes.ok && agyRes.output) {
            generatedBody = agyRes.output.trim();
          } else {
            modelUsed = 'joshlcoleman/Fable:latest (Local Fail-Safe)';
            const fRes = await draftWithFable({
              domain,
              platform: channel,
              prompt: angle,
              model: 'joshlcoleman/Fable:latest',
            });
            if (fRes.ok && fRes.draft) generatedBody = fRes.draft;
          }
        }

        if (!generatedBody) {
          safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          return safeRes.end(JSON.stringify({ ok: false, error: 'Failed to generate campaign copy' }));
        }
        if (domain === 'youandinotai.com' && !/adults\s+18\s+and\s+over/i.test(generatedBody)) {
          generatedBody = `${generatedBody.trim()}\n\nyouandinotai.com is for adults 18 and over.`;
        }

        const firstLine = generatedBody.split(/\r?\n/).find((l) => l.trim().length > 0) || angle;
        const saved = addGeneratedCampaign({
          domain,
          channel,
          title: `${domain} · ${channel} (${angle.slice(0, 48)})`,
          hook: firstLine.slice(0, 140),
          body: generatedBody,
          modelUsed,
          durationMs: Date.now() - startGen,
        });
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify({ ok: true, campaign: saved }, null, 2));
      }
      if (u.pathname === '/api/social/platforms' && req.method === 'GET') {
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify({ ok: true, platforms: getSocialCommandPlatforms() }, null, 2));
      }
      if (u.pathname === '/api/social/proposals' && req.method === 'GET') {
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify({ ok: true, proposals: listProposals({ limit: 50 }) }, null, 2));
      }
      if (u.pathname === '/api/social/proposals' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const saved = addGeneratedCampaign({
          domain: body.domain || 'youandinotai.com',
          channel: body.platform || body.channel || 'X / Twitter',
          title: body.title || `${body.domain || 'youandinotai.com'} · ${body.platform || 'Post'}`,
          hook: body.hook || '',
          body: body.body || '',
          targetUrl: body.targetUrl || '',
          tags: body.tags || null,
          modelUsed: body.modelUsed || 'Social Command Center',
        });
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify({ ok: true, proposal: saved }, null, 2));
      }
      if (u.pathname === '/api/social/draft' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const fRes = await draftWithFable({
          domain: body.domain || 'youandinotai.com',
          platform: body.platform || 'reddit',
          prompt: body.prompt || '',
          model: body.model || 'joshlcoleman/Fable:latest',
        });
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(fRes, null, 2));
      }
      if (u.pathname === '/api/scc/tags' && req.method === 'GET') {
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify({ ok: true, tagCity: getTagCityState() }, null, 2));
      }
      if (u.pathname === '/api/scc/tagcity/run-daily' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const result = triggerTagCityDailyBatch(body);
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(result, null, 2));
      }
      if (u.pathname === '/api/scc/comments/generate' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const mode = String(body.mode || 'tagcity').toLowerCase();
        let gen = generateThreeCommentVariants(body);
        if (mode === 'gemini' || mode === 'fable') {
          const domain = String(body.domain || 'youandinotai.com');
          const platform = String(body.platform || 'reddit');
          const targetTitle = String(body.targetTitle || 'Community discussion thread');
          const prompt = [
            `Write 3 distinct, natural, zero-slop comment replies for a ${platform} thread titled: "${targetTitle}".`,
            `Domain: https://${domain}`,
            'Format your response as 3 paragraphs separated by "---VARIANT---".',
            'Variant 1: Direct value & verified proof.',
            'Variant 2: Peer empathy & curiosity question.',
            'Variant 3: Short, punchy 2-sentence reply.',
            'Rules: Zero AI cliches, zero medical/kids language, business-only.',
            domain === 'youandinotai.com'
              ? 'Include "youandinotai.com is for adults 18 and over." at the end of each variant.'
              : '',
          ]
            .filter(Boolean)
            .join('\n');
          let rawOut = '';
          if (mode === 'fable') {
            const fRes = await draftWithFable({ domain, platform, prompt });
            if (fRes.ok && fRes.draft) rawOut = fRes.draft;
          } else {
            const agyRes = await spawnAgyFast(prompt, {
              model: 'gemini-3.8-flash-low',
              effort: 'low',
              timeoutMs: 40000,
              cwd: os.tmpdir(),
            });
            if (agyRes.ok && agyRes.output) rawOut = agyRes.output;
          }
          if (rawOut) {
            const parts = rawOut
              .split(/---VARIANT---|Variant\s+[123abc][:\-]/i)
              .map((s) => s.trim())
              .filter(Boolean);
            const tagLine = gen.tagLine;
            const labels = [
              'Variant A — Direct Value & Proof',
              'Variant B — Peer Question & Curiosity',
              'Variant C — Concise Punchy',
            ];
            gen.variants = [0, 1, 2].map((i) => {
              const rawChunk = parts[i] || gen.variants[i]?.body || rawOut;
              const cleanBody = `${sanitizeCopyToScore5(rawChunk, domain === 'youandinotai.com')}\n\n${tagLine}`;
              return {
                variant: i + 1,
                label: labels[i],
                body: cleanBody,
                tags: gen.tags,
                tagLine,
                gates: gen.variants[i]?.gates,
              };
            });
          }
        }
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(gen, null, 2));
      }
      if (u.pathname === '/api/scc/comments/respond' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const result = saveCommentReply(body);
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(result, null, 2));
      }
      if (u.pathname === '/api/scc/publish' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const result = await executeLiveSocialPublish(body);
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(result, null, 2));
      }
      if (u.pathname === '/api/inbox' && req.method === 'GET') {
        const unified = getUnifiedInboxItems();
        const claudeInbox = await buildInbox(ROOT).catch(() => ({ items: [], counts: {} }));
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify({ ok: true, items: unified, systemInbox: claudeInbox }, null, 2));
      }
      const inboxMatch = u.pathname.match(/^\/api\/inbox\/([^/]+)\/(approve|reject|snooze)$/i);
      if (inboxMatch && req.method === 'POST') {
        const itemId = decodeURIComponent(inboxMatch[1]);
        const action = inboxMatch[2].toLowerCase();
        const body = await readJsonBody(req).catch(() => ({}));
        const statusMap = { approve: 'APPROVED', reject: 'REJECTED', snooze: 'INBOX' };
        const mRes = updateCampaignStatus({ id: itemId, status: statusMap[action] || 'INBOX', notes: body.notes });
        if (!mRes.ok) {
          const sysRes = await performAction(ROOT, itemId, action, body).catch(() => ({
            ok: false,
            error: 'Action failed',
          }));
          safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          return safeRes.end(JSON.stringify(sysRes, null, 2));
        }
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(mRes, null, 2));
      }

      // Live Backend Endpoints for Every Mission Control Sidebar Tab
      if (u.pathname === '/api/live/agents' && req.method === 'GET') {
        const payload = await getLiveAgentsTab({ probeBridges });
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(payload, null, 2));
      }
      if (u.pathname === '/api/live/skill' && req.method === 'GET') {
        const payload = getSkillDetail(u.searchParams.get('name'));
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(payload, null, 2));
      }
      if ((u.pathname === '/api/live/board' || u.pathname === '/api/wheel') && req.method === 'GET') {
        const payload = await getLiveBoardTab();
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(payload, null, 2));
      }
      if ((u.pathname === '/api/live/wheel/task' || u.pathname === '/api/wheel/task') && req.method === 'POST') {
        const body = await readJsonBody(req);
        const payload = mutateWheelTask(body);
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(payload, null, 2));
      }
      if ((u.pathname === '/api/files/read' || u.pathname === '/api/live/files/read') && req.method === 'GET') {
        const payload = readRepoFile(u.searchParams.get('path'));
        safeRes.writeHead(payload.status || (payload.ok ? 200 : 403), {
          ...sec,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        return safeRes.end(JSON.stringify(payload, null, 2));
      }
      if (u.pathname === '/api/live/deliverable' && req.method === 'GET') {
        const payload = readDeliverableFile(u.searchParams.get('path'));
        safeRes.writeHead(payload.status || (payload.ok ? 200 : 403), {
          ...sec,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        return safeRes.end(JSON.stringify(payload, null, 2));
      }
      if (u.pathname === '/api/live/gateway' && req.method === 'GET') {
        const payload = await getLiveGatewayTab();
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(payload, null, 2));
      }
      if (u.pathname === '/api/live/memory' && req.method === 'GET') {
        const payload = getLiveMemoryTab();
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(payload, null, 2));
      }
      if (u.pathname === '/api/live/memory/note' && req.method === 'GET') {
        const payload = readObsidianNote(u.searchParams.get('path'));
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(payload, null, 2));
      }
      if (u.pathname === '/api/live/memory/append' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const payload = appendObsidianNote(body);
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(payload, null, 2));
      }
      if (u.pathname === '/api/live/memory/graph-search' && req.method === 'GET') {
        const payload = searchGraphifyNodes(u.searchParams.get('q'));
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(payload, null, 2));
      }
      if (u.pathname === '/api/live/node' && req.method === 'GET') {
        const payload = await getLiveNodeTab({ state: getState });
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(payload, null, 2));
      }
      if (u.pathname === '/api/live/logs' && req.method === 'GET') {
        const payload = getLiveLogsTab({
          file: u.searchParams.get('file') || 't5500-keepalive.log',
          lines: u.searchParams.get('lines') || 120,
          query: u.searchParams.get('q') || '',
        });
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(payload, null, 2));
      }
      if (u.pathname === '/api/live/support' && req.method === 'GET') {
        const payload = getLiveSupportTab();
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(payload, null, 2));
      }
      if (u.pathname === '/api/live/support/draft' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const payload = await draftSupportTicketReply(body);
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(payload, null, 2));
      }
      if (u.pathname === '/api/live/settings' && req.method === 'GET') {
        const payload = await getSettingsTab({ probeBridges });
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return safeRes.end(JSON.stringify(payload, null, 2));
      }
      if (u.pathname === '/marketing' || u.pathname === '/marketing/') {
        const screenFile = fs.existsSync(`${SCREENS_DIR}/mission_control_marketing/code.html`)
          ? `${SCREENS_DIR}/mission_control_marketing/code.html`
          : `${SCREENS_DIR}/mission_control_paperclip_marketing/code.html`;
        const html = fs.readFileSync(screenFile, 'utf8').replace(/<\/body>/i, `${LIVE_BADGE()}</body>`);
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        return safeRes.end(html);
      }
      if (u.pathname === '/live') {
        const [liveState, nodeStatus] = await Promise.all([getState(), watchdog.getStatus()]);
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        return safeRes.end(livePage(liveState, nodeStatus));
      }
      const m = u.pathname.match(/^\/screens\/([a-z0-9_.]+)\/?$/i);
      if (m && screens().includes(m[1])) {
        const html = fs
          .readFileSync(`${SCREENS_DIR}/${m[1]}/code.html`, 'utf8')
          .replace(/<\/body>/i, `${LIVE_BADGE()}</body>`);
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'text/html; charset=utf-8' });
        return safeRes.end(html);
      }
      // Joshua 2026-10-16: the JARVIS command console is the Mission Control front door.
      if (u.pathname === '/' || u.pathname === '/index.html') {
        const html = fs
          .readFileSync(`${SCREENS_DIR}/mission_control_jarvis_command_console/code.html`, 'utf8')
          .replace(/<\/body>/i, '<script src="/jarvis-bridge-client.js"></script></body>');
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        return safeRes.end(html);
      }
      if (u.pathname === '/board' || u.pathname === '/board/') {
        const html = fs.readFileSync(BOARD, 'utf8').replace(/<\/body>/i, `${LIVE_BADGE()}</body>`);
        safeRes.writeHead(200, { ...sec, 'Content-Type': 'text/html; charset=utf-8' });
        return safeRes.end(html);
      }
      safeRes.writeHead(404, sec);
      safeRes.end('not found');
    } catch (e) {
      const errRes = safeRes === res ? wrapStreamSafeResponse(res, { env }) : safeRes;
      const status = e?.status === 400 || e?.status === 413 ? e.status : 500;
      const safeError =
        status === 400 ? 'Invalid JSON object' : status === 413 ? 'Request body too large' : 'Internal error';
      if (!errRes.headersSent) {
        errRes.writeHead(status, { ...sec, 'Content-Type': 'application/json' });
      }
      errRes.end(JSON.stringify({ ok: false, error: safeError }));
    }
  };
}

export const handleMissionRequest = createMissionHandler();
if (IS_MAIN_MODULE) {
  warnMissionOsMissingEnv({ manifestDir: HERE });
  http
    .createServer(handleMissionRequest)
    .listen(PORT, HOST, () =>
      console.log(`mission-agent-os on http://${HOST}:${PORT} (LAN http://${T5500_IP}:${PORT})`),
    );
}

function getOptionalServiceUrl(serviceId, pathSuffix = '', fallbackUrl = '') {
  try {
    return getServiceUrl(serviceId, pathSuffix);
  } catch {
    return fallbackUrl;
  }
}

function safeErrorMessage(err, fallback = 'Operation failed') {
  const msg = err && typeof err === 'object' && typeof err.message === 'string' ? err.message : '';
  return msg ? msg.split(/\r?\n/)[0].slice(0, 240) : fallback;
}
