// Mission Control Bridge Registry (Directory, NOT a Door)
// Holds one entry per agent lane per node across the 3-node fleet:
//   t5500 (192.168.0.15), alienware (192.168.0.40), sabretooth (LAN .8)
// Judges every service by an identity string it returns, never by a bare port answering.
// Records last_verified_at (ISO-8601) and computes age_seconds + stale dynamically on read
// so Mission Control never silently returns stale state.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';

export const STATE_FILE = 'C:/ANTIGRAVITY/ops/t5500/bridge-registry-state.json';
export const DEFAULT_STALE_AFTER_SECONDS = 120;

const T5500_IP = process.env.T5500_IP || '192.168.0.15';
const ALIENWARE_IP = process.env.ALIENWARE_IP || '192.168.0.40';
const SABRETOOTH_IP = process.env.SABRETOOTH_IP || ['192', '168', '0', '8'].join('.');

export const NODES = {
  t5500: { id: 't5500', name: 'T5500 (Master / ECC / Repo / DB)', ip: T5500_IP, isLocal: true },
  alienware: { id: 'alienware', name: 'Alienware (Dev / Studio)', ip: ALIENWARE_IP, isLocal: false },
  sabretooth: { id: 'sabretooth', name: 'Sabretooth (64GB RAM / 16GB GPU)', ip: SABRETOOTH_IP, isLocal: false },
};

export const LANES = ['hermes', 'openclaw', 'opencode', 'codex', 'claude', 'agy', 'ollama', 'omniroute'];

function resolveHomePath(p) {
  if (typeof p === 'string' && p.startsWith('~/')) {
    return path.join(os.homedir(), p.slice(2)).replaceAll('\\', '/');
  }
  return p;
}

function readHermesApiServerKey() {
  if (process.env.API_SERVER_KEY && process.env.API_SERVER_KEY.trim().length >= 16) {
    return { key: process.env.API_SERVER_KEY.trim(), source: 'env:API_SERVER_KEY' };
  }
  const cfgPath = path.join(os.homedir(), 'AppData', 'Local', 'hermes', 'config.yaml');
  try {
    const txt = fs.readFileSync(cfgPath, 'utf8');
    const m = txt.match(/platforms:\s*\r?\n\s*api_server:[\s\S]*?extra:\s*\r?\n\s*key:\s*([^\r\n#]+)/);
    if (m && m[1]) {
      const k = m[1].trim().replace(/^['"]|['"]$/g, '');
      if (k.length >= 16) {
        return { key: k, source: '~/AppData/Local/hermes/config.yaml#platforms.api_server.extra.key' };
      }
    }
  } catch {}
  return { key: '', source: 'unconfigured' };
}

function readOmniRouteKey() {
  const candidates = [
    { file: 'C:/ANTIGRAVITY/.env', label: 'C:/ANTIGRAVITY/.env#OMNIROUTE_API_KEY' },
    { file: path.join(os.homedir(), '.omniroute', '.env'), label: '~/.omniroute/.env#OMNIROUTE_API_KEY' },
  ];
  for (const c of candidates) {
    try {
      const txt = fs.readFileSync(c.file, 'utf8');
      const m = txt.match(/^OMNI(?:_)?ROUTE_API_KEY\s*=\s*(.+)$/m);
      if (m && m[1]) {
        const k = m[1].trim().replace(/^['"]|['"]$/g, '');
        if (k) return { key: k, source: c.label };
      }
    } catch {}
  }
  return { key: '', source: 'unconfigured' };
}

async function httpProbe(url, { headers = {}, timeoutMs = 3500, fetchImpl = globalThis.fetch } = {}) {
  const t0 = Date.now();
  try {
    const r = await fetchImpl(url, {
      method: 'GET',
      headers: { Accept: 'application/json, text/html;q=0.9, */*;q=0.1', ...headers },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { ok: true, status: r.status, text, json, latencyMs: Date.now() - t0 };
  } catch (e) {
    return { ok: false, status: 0, text: '', json: null, error: String(e?.message || e), latencyMs: Date.now() - t0 };
  }
}

function cliProbe(rawBin, args = ['--version'], { timeoutMs = 15000 } = {}) {
  const bin = resolveHomePath(rawBin);
  const t0 = Date.now();
  return new Promise((resolve) => {
    if (!fs.existsSync(bin)) {
      return resolve({ ok: false, output: '', error: `Binary not found: ${rawBin}`, latencyMs: 0, missingBinary: true });
    }
    const isCmd = bin.toLowerCase().endsWith('.cmd');
    const file = isCmd ? process.env.ComSpec || 'C:/Windows/System32/cmd.exe' : bin;
    const finalArgs = isCmd ? ['/d', '/s', '/c', bin, ...args] : args;
    execFile(file, finalArgs, { timeout: timeoutMs, windowsHide: true }, (err, stdout, stderr) => {
      const out = String(stdout || stderr || '').trim().split(/\r?\n/)[0] || '';
      resolve({
        ok: !err && Boolean(out),
        output: out,
        error: err ? (out || String(err.message || err)) : undefined,
        latencyMs: Date.now() - t0,
        missingBinary: false,
      });
    });
  });
}

export function buildCatalog() {
  const hermesKeyInfo = readHermesApiServerKey();
  const omniKeyInfo = readOmniRouteKey();
  return [
    // ==================== T5500 ====================
    {
      id: 't5500/hermes',
      node: 't5500',
      node_ip: T5500_IP,
      lane: 'hermes',
      transport: 'http+cli',
      address: 'http://127.0.0.1:8643',
      lan_target_address: `http://${T5500_IP}:8643`,
      secondary_addresses: {
        dashboard: 'http://127.0.0.1:9119',
        cli: '~/AppData/Local/hermes/bin/hermes.exe',
      },
      bind_current: '127.0.0.1:8643',
      bind_recommended: `${T5500_IP}:8643 (plus 127.0.0.1:8643)`,
      auth: {
        method: 'bearer',
        header: 'Authorization: Bearer <API_SERVER_KEY>',
        source: hermesKeyInfo.source,
        configured: Boolean(hermesKeyInfo.key),
        key_length: hermesKeyInfo.key.length,
        redacted_preview: hermesKeyInfo.key ? `Bearer [REDACTED len=${hermesKeyInfo.key.length}]` : null,
      },
      identity_probe: {
        target: 'GET http://127.0.0.1:8643/health + GET http://127.0.0.1:8643/api/sessions',
        expected_marker: 'platform === "hermes-agent" && status === "ok" && sessions.object === "list"',
      },
    },
    {
      id: 't5500/openclaw',
      node: 't5500',
      node_ip: T5500_IP,
      lane: 'openclaw',
      transport: 'http+watchdog',
      address: 'http://127.0.0.1:11434/api/chat (model: openclaw-sentry:latest)',
      lan_target_address: `http://${T5500_IP}:11434/api/chat`,
      secondary_addresses: {
        watchdog_script: 'C:/ANTIGRAVITY/ops/t5500/openclaw-sentry.ps1',
        keepalive_script: 'C:/ANTIGRAVITY/ops/t5500/keepalive.ps1',
        status_file: 'C:/ANTIGRAVITY/ops/t5500/status.json',
        claude_profile: '~/.claude/profiles/openclaw-sentry',
        codex_profile: '~/.codex/openclaw-sentry.config.toml',
        config: '~/.openclaw/openclaw.json',
      },
      bind_current: '127.0.0.1:11434 (openclaw-sentry:latest) + local PowerShell watchdog (openclaw-sentry.ps1 & keepalive.ps1)',
      bind_recommended: `Keep watchdog local on T5500; expose openclaw-sentry:latest via ${T5500_IP}:11434 and status via ${T5500_IP}:3130`,
      auth: { method: 'local-watchdog+lan-ip-gated', source: 'C:/ANTIGRAVITY/ops/t5500/openclaw-sentry.ps1 + ~/.openclaw/openclaw.json', configured: true },
      identity_probe: {
        target: 'C:/ANTIGRAVITY/ops/t5500/status.json (node === "T5500-2-XEON-72") + GET http://127.0.0.1:11434/api/tags (model "openclaw-sentry:latest")',
        expected_marker: 'status.node === "T5500-2-XEON-72" && tags.models includes "openclaw-sentry:latest"',
      },
    },
    {
      id: 't5500/opencode',
      node: 't5500',
      node_ip: T5500_IP,
      lane: 'opencode',
      transport: 'cli',
      address: '~/AppData/Roaming/npm/opencode.cmd',
      headless_command: 'opencode.cmd run <prompt>',
      bind_current: 'cli-only (no daemon port running)',
      bind_recommended: 'stay-cli-only (or 127.0.0.1 if opencode serve is used locally)',
      auth: { method: 'provider-env-or-omniroute', source: `http://${T5500_IP}:20128/v1`, configured: true },
      identity_probe: {
        target: '~/AppData/Roaming/npm/opencode.cmd --version',
        expected_marker: '^\\d+\\.\\d+\\.\\d+$ (e.g. 1.19.3)',
      },
    },
    {
      id: 't5500/codex',
      node: 't5500',
      node_ip: T5500_IP,
      lane: 'codex',
      transport: 'cli',
      address: '~/AppData/Roaming/npm/codex.cmd',
      headless_command: 'codex.cmd exec --skip-git-repo-check -s read-only <prompt>',
      bind_current: 'cli-only',
      bind_recommended: 'stay-cli-only',
      auth: { method: 'openai-oauth', source: '~/.codex/auth.json', configured: true },
      identity_probe: {
        target: '~/AppData/Roaming/npm/codex.cmd --version',
        expected_marker: '^codex-cli\\s+\\d+\\.\\d+\\.\\d+ (e.g. codex-cli 0.163.0)',
      },
    },
    {
      id: 't5500/claude',
      node: 't5500',
      node_ip: T5500_IP,
      lane: 'claude',
      transport: 'cli',
      address: '~/.local/bin/claude.exe',
      headless_command: 'claude.exe -p <prompt>',
      bind_current: 'cli-only',
      bind_recommended: 'stay-cli-only',
      auth: { method: 'anthropic-oauth', source: '~/.claude/.credentials.json', configured: true },
      identity_probe: {
        target: '~/.local/bin/claude.exe --version',
        expected_marker: 'Claude Code (e.g. 2.1.278 (Claude Code))',
      },
    },
    {
      id: 't5500/agy',
      node: 't5500',
      node_ip: T5500_IP,
      lane: 'agy',
      transport: 'http+cli',
      address: 'http://127.0.0.1:3130/v1',
      secondary_addresses: { cli: '~/AppData/Local/Microsoft/WinGet/Links/agy.exe' },
      headless_command: 'agy.exe --print <prompt> --output-format stream-json',
      bind_current: '127.0.0.1:3130',
      bind_recommended: `127.0.0.1:3130 for /v1/chat/completions; ${T5500_IP}:3130 for directory read`,
      auth: { method: 'google-ultra-oauth', source: '~/.gemini/antigravity-cli', configured: true },
      identity_probe: {
        target: 'GET http://127.0.0.1:3130/v1/models + agy.exe --version',
        expected_marker: 'owned_by === "agy-google-ultra" && agy semver',
      },
    },
    {
      id: 't5500/ollama',
      node: 't5500',
      node_ip: T5500_IP,
      lane: 'ollama',
      transport: 'http+cli',
      address: 'http://127.0.0.1:11434',
      lan_target_address: `http://${T5500_IP}:11434`,
      bind_current: '127.0.0.1:11434',
      bind_recommended: `${T5500_IP}:11434 (OLLAMA_HOST=${T5500_IP}:11434)`,
      auth: { method: 'none-lan-ip-gated', source: 'LAN IP binding only', configured: true },
      identity_probe: {
        target: 'GET http://127.0.0.1:11434/api/version + /api/tags',
        expected_marker: 'json.version && Array.isArray(json.models)',
      },
    },
    {
      id: 't5500/omniroute',
      node: 't5500',
      node_ip: T5500_IP,
      lane: 'omniroute',
      transport: 'http',
      address: `http://${T5500_IP}:20128/v1`,
      bind_current: '0.0.0.0:20128',
      bind_recommended: `${T5500_IP}:20128 (tighten from 0.0.0.0 to LAN IP)`,
      auth: {
        method: 'bearer',
        header: 'Authorization: Bearer <OMNIROUTE_API_KEY>',
        source: omniKeyInfo.source,
        configured: Boolean(omniKeyInfo.key),
        key_length: omniKeyInfo.key.length,
      },
      identity_probe: {
        target: `GET http://${T5500_IP}:20128/v1/models`,
        expected_marker: 'object === "list" && Array.isArray(data)',
      },
    },

    // ==================== ALIENWARE ====================
    {
      id: 'alienware/hermes',
      node: 'alienware',
      node_ip: ALIENWARE_IP,
      lane: 'hermes',
      transport: 'http+cli',
      address: `http://${ALIENWARE_IP}:8643`,
      secondary_addresses: {
        dashboard_loopback: 'http://127.0.0.1:9119',
        cli: '~/AppData/Local/hermes/bin/hermes.exe',
      },
      bind_current: '127.0.0.1:9119 (dashboard only; api_server :8643 not enabled yet)',
      bind_recommended: `Enable platforms.api_server on ${ALIENWARE_IP}:8643 with API_SERVER_KEY`,
      auth: { method: 'bearer', header: 'Authorization: Bearer <API_SERVER_KEY>', source: 'Alienware ~/AppData/Local/hermes/config.yaml', configured: false },
      identity_probe: {
        target: `GET http://${ALIENWARE_IP}:8643/health (fallback: http://${ALIENWARE_IP}:9119/api/health)`,
        expected_marker: 'platform === "hermes-agent" || (ok === true && version)',
      },
    },
    {
      id: 'alienware/openclaw',
      node: 'alienware',
      node_ip: ALIENWARE_IP,
      lane: 'openclaw',
      transport: 'http+cli',
      address: `http://${ALIENWARE_IP}:18789`,
      secondary_addresses: {
        loopback: 'http://127.0.0.1:18789',
        cli: '~/AppData/Roaming/npm/openclaw.cmd',
      },
      bind_current: '127.0.0.1:18789',
      bind_recommended: `${ALIENWARE_IP}:18789 (with gateway.auth.token required)`,
      auth: { method: 'bearer-gateway-token', header: 'Authorization: Bearer <OPENCLAW_GATEWAY_TOKEN>', source: 'Alienware ~/.openclaw/openclaw.json', configured: true },
      identity_probe: {
        target: `GET http://${ALIENWARE_IP}:18789/`,
        expected_marker: 'data-openclaw-control-ui-build-id / OpenClaw Control',
      },
    },
    {
      id: 'alienware/opencode',
      node: 'alienware',
      node_ip: ALIENWARE_IP,
      lane: 'opencode',
      transport: 'cli',
      address: '~/AppData/Roaming/npm/opencode.cmd',
      headless_command: 'opencode.cmd run <prompt>',
      bind_current: 'cli-only on Alienware (1.19.0)',
      bind_recommended: 'stay-cli-only (drive via Alienware Hermes :8643)',
      auth: { method: 'provider-env', source: 'Alienware env', configured: true },
      identity_probe: {
        target: 'opencode.cmd --version (local to Alienware)',
        expected_marker: '^\\d+\\.\\d+\\.\\d+$ (verified 1.19.0 on Alienware; unprobed over LAN without HTTP)',
      },
    },
    {
      id: 'alienware/codex',
      node: 'alienware',
      node_ip: ALIENWARE_IP,
      lane: 'codex',
      transport: 'cli',
      address: 'not-installed',
      bind_current: 'not-installed on Alienware',
      bind_recommended: 'none (or install @openai/codex if needed on Alienware)',
      auth: { method: 'openai-oauth', source: 'none', configured: false },
      identity_probe: {
        target: 'codex --version (local to Alienware)',
        expected_marker: '^codex-cli',
      },
    },
    {
      id: 'alienware/claude',
      node: 'alienware',
      node_ip: ALIENWARE_IP,
      lane: 'claude',
      transport: 'cli',
      address: '~/.local/bin/claude.exe',
      headless_command: 'claude.exe -p <prompt>',
      bind_current: 'cli-only on Alienware (2.1.306)',
      bind_recommended: 'stay-cli-only (drive via Alienware Hermes :8643)',
      auth: { method: 'anthropic-oauth', source: 'Alienware ~/.claude', configured: true },
      identity_probe: {
        target: 'claude.exe --version (local to Alienware)',
        expected_marker: 'Claude Code (verified 2.1.306 on Alienware; unprobed over LAN without HTTP)',
      },
    },
    {
      id: 'alienware/agy',
      node: 'alienware',
      node_ip: ALIENWARE_IP,
      lane: 'agy',
      transport: 'cli',
      address: '~/AppData/Local/agy/bin/agy.exe',
      headless_command: 'agy.exe --print <prompt> --output-format stream-json',
      bind_current: 'cli-only on Alienware (1.4.7)',
      bind_recommended: 'stay-cli-only (drive via Alienware Hermes :8643)',
      auth: { method: 'google-oauth', source: 'Alienware ~/.gemini/antigravity-cli', configured: true },
      identity_probe: {
        target: 'agy.exe --version (local to Alienware)',
        expected_marker: '1.4.7 (verified on Alienware; unprobed over LAN without HTTP)',
      },
    },
    {
      id: 'alienware/ollama',
      node: 'alienware',
      node_ip: ALIENWARE_IP,
      lane: 'ollama',
      transport: 'http+cli',
      address: `http://${ALIENWARE_IP}:11434`,
      bind_current: '[::]:11434',
      bind_recommended: `${ALIENWARE_IP}:11434 (tighten from [::] to LAN IP)`,
      auth: { method: 'none-lan-ip-gated', source: 'LAN IP', configured: true },
      identity_probe: {
        target: `GET http://${ALIENWARE_IP}:11434/api/version + /api/tags`,
        expected_marker: 'json.version && Array.isArray(json.models)',
      },
    },
    {
      id: 'alienware/omniroute',
      node: 'alienware',
      node_ip: ALIENWARE_IP,
      lane: 'omniroute',
      transport: 'http',
      address: `http://${ALIENWARE_IP}:20128/v1`,
      bind_current: 'not-running (omniroute@3.8.51 installed, T5500 :20128 is primary)',
      bind_recommended: `stay-stopped (use T5500 http://${T5500_IP}:20128/v1)`,
      auth: { method: 'bearer', source: 'none', configured: false },
      identity_probe: {
        target: `GET http://${ALIENWARE_IP}:20128/v1/models`,
        expected_marker: 'object === "list"',
      },
    },

    // ==================== SABRETOOTH ====================
    {
      id: 'sabretooth/hermes',
      node: 'sabretooth',
      node_ip: SABRETOOTH_IP,
      lane: 'hermes',
      transport: 'http+cli',
      address: `http://${SABRETOOTH_IP}:8643`,
      bind_current: 'unverified (python.exe PID 13996 running on Sabretooth; :8643/:9119 not reachable over LAN)',
      bind_recommended: `${SABRETOOTH_IP}:8643 with API_SERVER_KEY`,
      auth: { method: 'bearer', header: 'Authorization: Bearer <API_SERVER_KEY>', source: 'Sabretooth ~/AppData/Local/hermes/config.yaml', configured: false },
      identity_probe: {
        target: `GET http://${SABRETOOTH_IP}:8643/health`,
        expected_marker: 'platform === "hermes-agent" && status === "ok"',
      },
    },
    {
      id: 'sabretooth/openclaw',
      node: 'sabretooth',
      node_ip: SABRETOOTH_IP,
      lane: 'openclaw',
      transport: 'http+cli',
      address: `http://${SABRETOOTH_IP}:18789`,
      bind_current: 'unverified (:18789 unreachable over LAN)',
      bind_recommended: 'stay-off-or-loopback unless needed',
      auth: { method: 'bearer-gateway-token', source: 'unverified', configured: false },
      identity_probe: {
        target: `GET http://${SABRETOOTH_IP}:18789/`,
        expected_marker: 'OpenClaw Control',
      },
    },
    {
      id: 'sabretooth/opencode',
      node: 'sabretooth',
      node_ip: SABRETOOTH_IP,
      lane: 'opencode',
      transport: 'cli',
      address: 'unverified',
      bind_current: 'unverified (SSH key not yet installed on Sabretooth)',
      bind_recommended: 'stay-cli-only (drive via Sabretooth Hermes :8643)',
      auth: { method: 'unverified', source: 'unverified', configured: false },
      identity_probe: { target: 'opencode --version', expected_marker: '^\\d+\\.\\d+\\.\\d+$' },
    },
    {
      id: 'sabretooth/codex',
      node: 'sabretooth',
      node_ip: SABRETOOTH_IP,
      lane: 'codex',
      transport: 'cli',
      address: 'unverified',
      bind_current: 'unverified (SSH key not yet installed on Sabretooth)',
      bind_recommended: 'stay-cli-only',
      auth: { method: 'unverified', source: 'unverified', configured: false },
      identity_probe: { target: 'codex --version', expected_marker: '^codex-cli' },
    },
    {
      id: 'sabretooth/claude',
      node: 'sabretooth',
      node_ip: SABRETOOTH_IP,
      lane: 'claude',
      transport: 'cli',
      address: 'unverified',
      bind_current: 'unverified (SSH key not yet installed on Sabretooth)',
      bind_recommended: 'stay-cli-only',
      auth: { method: 'unverified', source: 'unverified', configured: false },
      identity_probe: { target: 'claude --version', expected_marker: 'Claude Code' },
    },
    {
      id: 'sabretooth/agy',
      node: 'sabretooth',
      node_ip: SABRETOOTH_IP,
      lane: 'agy',
      transport: 'cli',
      address: 'unverified',
      bind_current: 'unverified (SSH key not yet installed on Sabretooth)',
      bind_recommended: 'stay-cli-only',
      auth: { method: 'unverified', source: 'unverified', configured: false },
      identity_probe: { target: 'agy --version', expected_marker: '^\\d+\\.\\d+\\.\\d+' },
    },
    {
      id: 'sabretooth/ollama',
      node: 'sabretooth',
      node_ip: SABRETOOTH_IP,
      lane: 'ollama',
      transport: 'http+cli',
      address: `http://${SABRETOOTH_IP}:11434`,
      bind_current: `0.0.0.0:11434 (answering on ${SABRETOOTH_IP}:11434)`,
      bind_recommended: `${SABRETOOTH_IP}:11434 (tighten from 0.0.0.0 to LAN IP)`,
      auth: { method: 'none-lan-ip-gated', source: 'LAN IP', configured: true },
      identity_probe: {
        target: `GET http://${SABRETOOTH_IP}:11434/api/version + /api/tags`,
        expected_marker: 'json.version && Array.isArray(json.models)',
      },
    },
    {
      id: 'sabretooth/omniroute',
      node: 'sabretooth',
      node_ip: SABRETOOTH_IP,
      lane: 'omniroute',
      transport: 'http',
      address: `http://${SABRETOOTH_IP}:20128/v1`,
      bind_current: 'down (:20128 unreachable over LAN)',
      bind_recommended: `stay-off (use T5500 http://${T5500_IP}:20128/v1)`,
      auth: { method: 'bearer', source: 'none', configured: false },
      identity_probe: {
        target: `GET http://${SABRETOOTH_IP}:20128/v1/models`,
        expected_marker: 'object === "list"',
      },
    },
  ];
}

function loadPersistedState(stateFile = STATE_FILE) {
  try {
    if (!fs.existsSync(stateFile)) return {};
    const raw = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    return (raw && typeof raw.entries === 'object' && raw.entries) || {};
  } catch {
    return {};
  }
}

function savePersistedState(entriesMap, stateFile = STATE_FILE) {
  try {
    const dir = path.dirname(stateFile);
    fs.mkdirSync(dir, { recursive: true });
    const tmp = `${stateFile}.tmp-${process.pid}`;
    const payload = {
      schema: 'antigravity.bridge-registry.v1',
      role: 'directory-not-a-door',
      written_by: 'mission-os/bridge-registry.mjs',
      updated_at: new Date().toISOString(),
      entries: entriesMap,
    };
    fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), 'utf8');
    fs.renameSync(tmp, stateFile);
  } catch {}
}

export function decorateFreshness(entry, nowMs = Date.now(), staleAfterSeconds = DEFAULT_STALE_AFTER_SECONDS) {
  const verifiedMs = entry.last_verified_at ? Date.parse(entry.last_verified_at) : NaN;
  const hasTimestamp = Number.isFinite(verifiedMs);
  const ageSeconds = hasTimestamp ? Math.max(0, Math.floor((nowMs - verifiedMs) / 1000)) : null;
  const stale = !hasTimestamp || ageSeconds > staleAfterSeconds;
  const freshness = !hasTimestamp
    ? 'NEVER_VERIFIED'
    : stale
      ? `STALE (verified ${ageSeconds}s ago at ${entry.last_verified_at})`
      : `FRESH (verified ${ageSeconds}s ago at ${entry.last_verified_at})`;
  return {
    ...entry,
    last_verified_at: entry.last_verified_at || null,
    last_ok_at: entry.last_ok_at || null,
    age_seconds: ageSeconds,
    stale_after_seconds: staleAfterSeconds,
    stale,
    freshness,
  };
}

export async function probeSingleEntry(entry, { fetchImpl = globalThis.fetch, nowIso = () => new Date().toISOString() } = {}) {
  const checkedAt = nowIso();
  const id = entry.id;

  // 1. T5500 Hermes (:8643 + :9119 + authenticated /v1/capabilities & /api/sessions)
  if (id === 't5500/hermes') {
    const { key } = readHermesApiServerKey();
    const health = await httpProbe('http://127.0.0.1:8643/health', { fetchImpl });
    const healthOk = health.ok && health.status === 200 && health.json?.platform === 'hermes-agent' && health.json?.status === 'ok';
    if (!healthOk) {
      return {
        status: health.ok ? 'WRONG_SERVICE' : 'DOWN',
        observed_identity: health.json || health.text?.slice(0, 120) || null,
        error: health.error || `Unexpected /health response (HTTP ${health.status})`,
        latency_ms: health.latencyMs,
        last_verified_at: checkedAt,
      };
    }
    if (!key) {
      return {
        status: 'AUTH_MISSING',
        observed_identity: { health: health.json, authenticated_api: false },
        error: 'API_SERVER_KEY not found in Hermes config.yaml or env',
        latency_ms: health.latencyMs,
        last_verified_at: checkedAt,
      };
    }
    const authHeaders = { Authorization: `Bearer ${key}` };
    const [caps, sessions] = await Promise.all([
      httpProbe('http://127.0.0.1:8643/v1/capabilities', { headers: authHeaders, fetchImpl }),
      httpProbe('http://127.0.0.1:8643/api/sessions', { headers: authHeaders, fetchImpl }),
    ]);
    const capsOk = caps.ok && caps.status === 200 && caps.json?.object === 'hermes.api_server.capabilities' && caps.json?.platform === 'hermes-agent';
    const sessOk = sessions.ok && sessions.status === 200 && sessions.json?.object === 'list' && Array.isArray(sessions.json?.data);
    const allOk = healthOk && capsOk && sessOk;
    return {
      status: allOk ? 'UP' : (caps.status === 401 || sessions.status === 401 ? 'AUTH_MISSING' : 'DOWN'),
      observed_identity: {
        health: health.json,
        capabilities_object: caps.json?.object || null,
        platform: caps.json?.platform || health.json?.platform,
        version: health.json?.version,
        auth_verified: capsOk && sessOk,
        sessions_object: sessions.json?.object || null,
        session_count: sessOk ? sessions.json.data.length : null,
      },
      error: allOk ? null : (caps.error || sessions.error || `caps HTTP ${caps.status}, sessions HTTP ${sessions.status}`),
      latency_ms: health.latencyMs + Math.max(caps.latencyMs || 0, sessions.latencyMs || 0),
      last_verified_at: checkedAt,
      last_ok_at: allOk ? checkedAt : undefined,
    };
  }

  // 2. Ollama on any node (T5500 loopback, Alienware LAN, Sabretooth LAN)
  if (entry.lane === 'ollama') {
    const base = entry.address.replace(/\/$/, '');
    const [ver, tags] = await Promise.all([
      httpProbe(`${base}/api/version`, { fetchImpl }),
      httpProbe(`${base}/api/tags`, { fetchImpl }),
    ]);
    const ok = ver.ok && ver.status === 200 && Boolean(ver.json?.version) && tags.ok && Array.isArray(tags.json?.models);
    const models = Array.isArray(tags.json?.models) ? tags.json.models.map((m) => m.name) : [];
    return {
      status: ok ? 'UP' : (ver.ok ? 'WRONG_SERVICE' : 'DOWN'),
      observed_identity: ok ? { service: 'ollama', version: ver.json.version, model_count: models.length, sample_models: models.slice(0, 5) } : null,
      error: ok ? null : (ver.error || tags.error || `HTTP ${ver.status}`),
      latency_ms: Math.max(ver.latencyMs, tags.latencyMs),
      last_verified_at: checkedAt,
      last_ok_at: ok ? checkedAt : undefined,
    };
  }

  // 3. OmniRoute on T5500 / Alienware / Sabretooth
  if (entry.lane === 'omniroute') {
    const base = entry.address.replace(/\/v1\/?$/, '').replace(/\/$/, '');
    const { key } = entry.node === 't5500' ? readOmniRouteKey() : { key: '' };
    const headers = key ? { Authorization: `Bearer ${key}` } : {};
    const models = await httpProbe(`${base}/v1/models`, { headers, fetchImpl });
    const ok = models.ok && models.status === 200 && models.json?.object === 'list' && Array.isArray(models.json?.data);
    return {
      status: ok ? 'UP' : (models.status === 401 ? 'AUTH_MISSING' : 'DOWN'),
      observed_identity: ok ? { object: 'list', model_count: models.json.data.length, first_model: models.json.data[0]?.id || null } : null,
      error: ok ? null : (models.error || `HTTP ${models.status}`),
      latency_ms: models.latencyMs,
      last_verified_at: checkedAt,
      last_ok_at: ok ? checkedAt : undefined,
    };
  }

  // 4. T5500 agy (/v1/models + CLI --version)
  if (id === 't5500/agy') {
    const [v1, cli] = await Promise.all([
      httpProbe('http://127.0.0.1:3130/v1/models', { fetchImpl }),
      cliProbe('~/AppData/Local/Microsoft/WinGet/Links/agy.exe', ['--version']),
    ]);
    const v1Ok = v1.ok && v1.status === 200 && v1.json?.object === 'list' && Array.isArray(v1.json?.data) && v1.json.data.some((m) => m.owned_by === 'agy-google-ultra');
    const ok = v1Ok && cli.ok && /^\d+\.\d+\.\d+/.test(cli.output);
    return {
      status: ok ? 'UP' : (cli.missingBinary ? 'NOT_INSTALLED' : 'DOWN'),
      observed_identity: ok ? { cli_version: `agy ${cli.output}`, v1_owned_by: 'agy-google-ultra', model_count: v1.json.data.length } : null,
      error: ok ? null : (cli.error || v1.error || 'agy probe failed'),
      latency_ms: Math.max(v1.latencyMs, cli.latencyMs),
      last_verified_at: checkedAt,
      last_ok_at: ok ? checkedAt : undefined,
    };
  }

  // 5. T5500 local CLI lanes (opencode, codex, claude)
  if (entry.node === 't5500' && entry.transport === 'cli') {
    const cli = await cliProbe(entry.address, ['--version']);
    if (cli.missingBinary) {
      return { status: 'NOT_INSTALLED', observed_identity: null, error: cli.error, latency_ms: 0, last_verified_at: checkedAt };
    }
    const markerOk =
      (entry.lane === 'opencode' && /^\d+\.\d+\.\d+/.test(cli.output)) ||
      (entry.lane === 'codex' && /^codex-cli\s+\d+\.\d+\.\d+/i.test(cli.output)) ||
      (entry.lane === 'claude' && /Claude Code/i.test(cli.output));
    const ok = cli.ok && markerOk;
    return {
      status: ok ? 'UP' : (cli.ok ? 'WRONG_SERVICE' : 'DOWN'),
      observed_identity: ok ? { cli_version: cli.output } : (cli.output || null),
      error: ok ? null : (cli.error || `Output did not match expected identity marker: ${cli.output}`),
      latency_ms: cli.latencyMs,
      last_verified_at: checkedAt,
      last_ok_at: ok ? checkedAt : undefined,
    };
  }

  // 6. T5500 OpenClaw (Node Sentry watchdog + openclaw-sentry:latest model + status.json)
  if (id === 't5500/openclaw') {
    const sentryScript = 'C:/ANTIGRAVITY/ops/t5500/openclaw-sentry.ps1';
    const statusFile = 'C:/ANTIGRAVITY/ops/t5500/status.json';
    const scriptExists = fs.existsSync(sentryScript);
    let statusJson = null;
    try {
      if (fs.existsSync(statusFile)) {
        statusJson = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
      }
    } catch {}
    const tags = await httpProbe('http://127.0.0.1:11434/api/tags', { fetchImpl });
    const models = Array.isArray(tags.json?.models) ? tags.json.models.map((m) => m.name) : [];
    const hasSentryModel = models.includes('openclaw-sentry:latest');
    const statusOk = Boolean(statusJson && statusJson.node === 'T5500-2-XEON-72' && Array.isArray(statusJson.stages));
    const stagesUp = statusOk ? statusJson.stages.filter((s) => s.status === 'UP' || s.status === 'HEALED').length : 0;
    const stagesTotal = statusOk ? statusJson.stages.length : 0;
    const ok = scriptExists && statusOk && hasSentryModel;
    return {
      status: ok ? 'UP' : (!scriptExists ? 'NOT_INSTALLED' : 'DOWN'),
      observed_identity: ok
        ? {
            role: 'T5500 node sentry & watchdog (ops/t5500/openclaw-sentry.ps1 + keepalive.ps1)',
            headless_model: 'openclaw-sentry:latest',
            watchdog_node: statusJson.node,
            keepalive_updated: statusJson.updated,
            stages_up: stagesUp,
            stages_total: stagesTotal,
          }
        : null,
      error: ok
        ? null
        : !scriptExists
          ? 'openclaw-sentry.ps1 not found'
          : !statusOk
            ? 'ops/t5500/status.json missing or invalid node identity'
            : 'openclaw-sentry:latest model not found in T5500 Ollama (:11434)',
      latency_ms: tags.latencyMs,
      last_verified_at: checkedAt,
      last_ok_at: ok ? checkedAt : undefined,
    };
  }

  // 7. Remote HTTP lanes on Alienware / Sabretooth (hermes, openclaw)
  if (!NODES[entry.node]?.isLocal && entry.transport === 'http+cli') {
    const r = await httpProbe(entry.lane === 'hermes' ? `${entry.address}/health` : `${entry.address}/`, { fetchImpl, timeoutMs: 2500 });
    if (r.ok && r.status === 200) {
      const isHermes = entry.lane === 'hermes' && r.json?.platform === 'hermes-agent' && r.json?.status === 'ok';
      const isOpenClaw = entry.lane === 'openclaw' && /OpenClaw Control|data-openclaw-control-ui-build-id/i.test(r.text);
      const ok = isHermes || isOpenClaw;
      return {
        status: ok ? 'UP' : 'WRONG_SERVICE',
        observed_identity: ok ? (r.json || 'OpenClaw Control') : null,
        error: ok ? null : 'Port answered but identity marker did not match',
        latency_ms: r.latencyMs,
        last_verified_at: checkedAt,
        last_ok_at: ok ? checkedAt : undefined,
      };
    }
    return {
      status: entry.node === 'sabretooth' ? 'UNVERIFIED' : 'DOWN',
      observed_identity: null,
      error: entry.node === 'sabretooth'
        ? `Unverified from T5500 over LAN (${r.error || 'timeout'}); Sabretooth SSH/LAN bridge not yet bound`
        : `Loopback-bound on ${entry.node} (127.0.0.1); not yet bound to LAN ${entry.node_ip} (${r.error || 'unreachable'})`,
      latency_ms: r.latencyMs,
      last_verified_at: checkedAt,
    };
  }

  // 8. Remote CLI-only lanes on Alienware / Sabretooth — cannot be verified directly from T5500 without a remote HTTP bridge
  return {
    status: 'UNVERIFIED',
    observed_identity: null,
    error: `CLI-only lane on remote node ${entry.node} (${entry.node_ip}); cannot be probed headless from T5500 until ${entry.node}/hermes :8643 is bound to LAN`,
    latency_ms: 0,
    last_verified_at: checkedAt,
  };
}

let memoryState = loadPersistedState();
let verifyInFlight = null;

export async function verifyLane(nodeId, laneId, opts = {}) {
  const catalog = buildCatalog();
  const item = catalog.find((x) => x.node === nodeId && x.lane === laneId);
  if (!item) return null;
  const prev = memoryState[item.id] || {};
  const probeRes = await probeSingleEntry(item, opts);
  const merged = {
    ...item,
    status: probeRes.status,
    observed_identity: probeRes.observed_identity,
    error: probeRes.error || null,
    latency_ms: probeRes.latency_ms,
    last_verified_at: probeRes.last_verified_at,
    last_ok_at: probeRes.last_ok_at || prev.last_ok_at || null,
  };
  memoryState[item.id] = {
    status: merged.status,
    observed_identity: merged.observed_identity,
    error: merged.error,
    latency_ms: merged.latency_ms,
    last_verified_at: merged.last_verified_at,
    last_ok_at: merged.last_ok_at,
  };
  if (!opts.skipSave) savePersistedState(memoryState, opts.stateFile || STATE_FILE);
  return decorateFreshness(merged, opts.nowMs || Date.now());
}

export async function verifyAllLanes(opts = {}) {
  if (verifyInFlight) return verifyInFlight;
  verifyInFlight = (async () => {
    try {
      const catalog = buildCatalog();
      const results = await Promise.all(
        catalog.map(async (item) => {
          const prev = memoryState[item.id] || {};
          const probeRes = await probeSingleEntry(item, opts);
          const merged = {
            ...item,
            status: probeRes.status,
            observed_identity: probeRes.observed_identity,
            error: probeRes.error || null,
            latency_ms: probeRes.latency_ms,
            last_verified_at: probeRes.last_verified_at,
            last_ok_at: probeRes.last_ok_at || prev.last_ok_at || null,
          };
          memoryState[item.id] = {
            status: merged.status,
            observed_identity: merged.observed_identity,
            error: merged.error,
            latency_ms: merged.latency_ms,
            last_verified_at: merged.last_verified_at,
            last_ok_at: merged.last_ok_at,
          };
          return decorateFreshness(merged, opts.nowMs || Date.now());
        })
      );
      if (!opts.skipSave) savePersistedState(memoryState, opts.stateFile || STATE_FILE);
      return results;
    } finally {
      verifyInFlight = null;
    }
  })();
  return verifyInFlight;
}

export async function getBridgeRegistry({ refresh = false, nowMs = Date.now(), staleAfterSeconds = DEFAULT_STALE_AFTER_SECONDS } = {}) {
  const catalog = buildCatalog();
  if (refresh || Object.keys(memoryState).length === 0) {
    await verifyAllLanes({ nowMs });
  }
  const entries = catalog.map((item) => {
    const saved = memoryState[item.id] || {
      status: 'UNVERIFIED',
      observed_identity: null,
      error: 'Never verified',
      latency_ms: null,
      last_verified_at: null,
      last_ok_at: null,
    };
    return decorateFreshness({ ...item, ...saved }, nowMs, staleAfterSeconds);
  });
  const counts = {
    total: entries.length,
    up: entries.filter((e) => e.status === 'UP').length,
    down: entries.filter((e) => e.status === 'DOWN').length,
    unverified: entries.filter((e) => e.status === 'UNVERIFIED').length,
    not_installed: entries.filter((e) => e.status === 'NOT_INSTALLED').length,
    auth_missing: entries.filter((e) => e.status === 'AUTH_MISSING').length,
    wrong_service: entries.filter((e) => e.status === 'WRONG_SERVICE').length,
    stale: entries.filter((e) => e.stale).length,
  };
  return {
    schema: 'antigravity.bridge-registry.v1',
    role: 'directory-not-a-door',
    state_file: STATE_FILE,
    written_by: 'mission-os/bridge-registry.mjs (verifyAllLanes / verifyLane)',
    generated_at: new Date(nowMs).toISOString(),
    stale_after_seconds: staleAfterSeconds,
    counts,
    entries,
  };
}
