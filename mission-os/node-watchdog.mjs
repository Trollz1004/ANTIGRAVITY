// Mission OS D1 Node Lights & 5-Minute Telegram Watchdog.
// Monitors ONLY t5500 (192.168.0.15) and alienware (192.168.0.40) from ops/fleet/fleet-map.json.
// Never opens environment files on disk; reads token/chat configuration strictly from process.env by variable name.
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_FLEET_MAP_PATH,
  getNode,
  getServiceTokenEnv,
  isMachineLocalScope,
  listServicesByNode,
  loadFleetMap,
} from '../ops/fleet/fleet-map.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = process.env.MISSION_OS_ROOT || path.resolve(HERE, '..');
const LOOPBACK_HOST = '127.0.0.1';

export const MONITORED_NODE_IDS = Object.freeze(['t5500', 'alienware']);
export const DEFAULT_LOCAL_NODE_ID = 't5500';
export const DEFAULT_POLL_INTERVAL_MS = 60000;
export const DEFAULT_RED_ALERT_AFTER_MS = 300000;
export const DEFAULT_INCIDENTS_PATH =
  process.env.MISSION_OS_INCIDENTS_PATH || path.join(DEFAULT_ROOT, 'ops/t5500/watchdog-incidents.json');
export const DEFAULT_KEEPALIVE_STATUS_PATH = path.join(DEFAULT_ROOT, 'ops/t5500/status.json');

const SECRET_ENV_NAMES = [
  'TELEGRAM_BOT_TOKEN',
  'ORC_NOTIFY_TELEGRAM_TOKEN',
  'FLEET_SHARED_TOKEN',
  'MISSION_OS_TOKEN',
  'OLLAMA_GUARD_TOKEN',
  'OMNIROUTE_API_KEY',
  'OBSIDIAN_API_KEY',
  'OBSIDIAN_REST_API_KEY',
  'AI_MEMORY_TOKEN',
  'SWARM_COMMAND_TOKEN',
  'FCC_GUARD_TOKEN',
  'PANDA_ROUTER_TOKEN',
  'DREAM_ENGINE_TOKEN',
  'HERMES_LEADGEN_TOKEN',
  'API_SERVER_KEY',
  'POSTGRES_PASSWORD',
  'OFFICIAL_VOTE_TOKEN',
  'MISSION_MCP_TOKEN',
  'ONEMIN_SHIM_TOKEN',
];

export function redactSecrets(rawText, env = process.env) {
  let out = String(rawText ?? '');
  if (!out) return out;
  out = out.replace(/\/bot\d+:[^/\s]+/g, '/bot[redacted]');
  if (!env) return out;
  for (const name of SECRET_ENV_NAMES) {
    const val = String(env[name] || '').trim();
    if (val && out.includes(val)) {
      out = out.split(val).join('[redacted]');
    }
  }
  return out;
}

function extractErrorMessage(err) {
  if (!err) return '';
  const msg = String(err?.message || err || '').trim();
  const causeMsg = err?.cause ? String(err.cause?.message || err.cause?.code || err.cause || '').trim() : '';
  const nestedMsg = Array.isArray(err?.cause?.errors)
    ? String(err.cause.errors[0]?.message || err.cause.errors[0]?.code || '').trim()
    : '';
  const bestCause = causeMsg || nestedMsg;
  if (bestCause && (!msg || /^fetch failed$/i.test(msg))) {
    return bestCause;
  }
  const code = String(err?.code || err?.cause?.code || '').trim();
  if (code && !msg.includes(code)) {
    return `${msg} (${code})`.trim();
  }
  return msg || bestCause;
}

function isConnectionRefusedError(err) {
  const candidates = [
    err?.code,
    err?.message,
    err?.cause?.code,
    err?.cause?.message,
    ...(Array.isArray(err?.cause?.errors) ? err.cause.errors.flatMap((e) => [e?.code, e?.message]) : []),
  ];
  return candidates.some((part) => /ECONNREFUSED|refused/i.test(String(part || '')));
}

export function singleLineError(rawError, env = process.env) {
  if (rawError === null || rawError === undefined || rawError === '') return null;
  const firstLine = String(rawError).split(/\r?\n/)[0] || '';
  const collapsed = firstLine.replace(/\s+/g, ' ').trim();
  const redacted = redactSecrets(collapsed, env);
  return redacted.length > 240 ? `${redacted.slice(0, 237)}...` : redacted;
}

export function plainWordsReason(errorText) {
  const msg = String(errorText || '').trim();
  if (!msg) return 'Service did not answer health check';
  if (/ECONNREFUSED|refused/i.test(msg)) return 'Connection refused';
  if (/ETIMEDOUT|TimeoutError|AbortError|timed?\s*out/i.test(msg)) return 'Timed out waiting for response';
  if (/EHOSTUNREACH|ENETUNREACH|unreachable/i.test(msg)) return 'Host unreachable on LAN';
  if (/ENOTFOUND/i.test(msg)) return 'Host address could not be resolved';
  if (/ECONNRESET|socket hang up/i.test(msg)) return 'Connection reset by service';
  const httpMatch = msg.match(/\bHTTP\s+(\d{3})\b/i);
  if (httpMatch) return `Service returned HTTP ${httpMatch[1]}`;
  return 'Service did not answer health check';
}

export function defaultTcpProbe(host, port, timeoutMs = 2500) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    const socket = net.connect({ host, port: Number(port), timeout: timeoutMs });
    socket.on('connect', () => {
      socket.destroy();
      finish({ ok: true });
    });
    socket.on('timeout', () => {
      socket.destroy();
      finish({ ok: false, error: `connect ETIMEDOUT ${host}:${port}` });
    });
    socket.on('error', (err) => {
      socket.destroy();
      finish({ ok: false, error: String(err?.message || err || `TCP connect failed ${host}:${port}`) });
    });
  });
}

function normalizeHealthSuffix(svc) {
  const suffix = String(svc?.healthPath || '/');
  return suffix.startsWith('/') ? suffix : `/${suffix}`;
}

function buildServiceProbeUrl(svc) {
  const proto = svc.protocol === 'https' ? 'https' : 'http';
  const host = isMachineLocalScope(svc?.scope) ? svc.bind || LOOPBACK_HOST : svc.host;
  const base = String(svc.url || `${proto}://${host}:${svc.port}`).replace(/\/+$/, '');
  return `${base}${normalizeHealthSuffix(svc)}`;
}

function buildLoopbackProbeUrl(svc) {
  const proto = svc.protocol === 'https' ? 'https' : 'http';
  const base = `${proto}://${LOOPBACK_HOST}:${Number(svc.port)}`;
  return `${base}${normalizeHealthSuffix(svc)}`;
}

function resolveServiceToken(svc, env) {
  const tokenEnv = getServiceTokenEnv(svc);
  if (!tokenEnv || !env) return { tokenEnv, token: '' };
  let token = String(env[tokenEnv] || '').trim();
  if (!token && tokenEnv === 'FLEET_SHARED_TOKEN' && String(svc?.id || '').toLowerCase() === 'mission-os') {
    token = String(env.MISSION_OS_TOKEN || '').trim();
  }
  if (!token && tokenEnv === 'OBSIDIAN_API_KEY') {
    token = String(env.OBSIDIAN_REST_API_KEY || '').trim();
  }
  return { tokenEnv, token };
}

export async function probeFleetService(
  svc,
  {
    env = process.env,
    localNodeId = env?.MISSION_OS_NODE_ID || DEFAULT_LOCAL_NODE_ID,
    fetchImpl = globalThis.fetch,
    tcpProbeImpl = defaultTcpProbe,
    timeoutMs = 4000,
  } = {},
) {
  const proto = String(svc?.protocol || 'tcp')
    .trim()
    .toLowerCase();
  const scope = String(svc?.scope || 'lan')
    .trim()
    .toLowerCase();
  const machineLocal = isMachineLocalScope(scope);
  const svcNode = String(svc?.node || '')
    .trim()
    .toLowerCase();
  const normalizedLocalNode = String(localNodeId || DEFAULT_LOCAL_NODE_ID)
    .trim()
    .toLowerCase();
  const isLocalNode = !svcNode || svcNode === normalizedLocalNode;

  if (machineLocal && !isLocalNode) {
    return {
      up: true,
      status: 'UP',
      reason: 'Machine-local service on remote node (not probed across LAN)',
      lastError: null,
    };
  }

  if (proto === 'http' || proto === 'https') {
    const probeUrl = buildServiceProbeUrl(svc);
    const { tokenEnv, token } = resolveServiceToken(svc, env);
    const isGuarded = scope === 'lan-guarded' || Boolean(tokenEnv);
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      if (tokenEnv === 'MISSION_OS_TOKEN' || tokenEnv === 'FLEET_SHARED_TOKEN') {
        headers['X-Mission-OS-Token'] = token;
        headers['X-Fleet-Token'] = token;
      }
    }

    const interpretHttpStatus = (code, { loopbackFallback = false } = {}) => {
      if (code >= 200 && code < 400) {
        return {
          up: true,
          status: 'UP',
          reason: loopbackFallback ? 'Healthy (loopback fallback)' : 'Healthy',
          lastError: null,
        };
      }
      if ((code === 401 || code === 403) && isGuarded) {
        return {
          up: true,
          status: 'UP',
          reason: `Guarded endpoint active (HTTP ${code})`,
          lastError: null,
        };
      }
      if (code === 401 || code === 403) {
        return {
          up: false,
          status: 'AUTH REQUIRED',
          reason: `Authentication required (HTTP ${code})`,
          lastError: singleLineError(`HTTP ${code} on ${svc.healthPath || '/'}`, env),
        };
      }
      const errLine = singleLineError(`HTTP ${code || 0} on ${svc.healthPath || '/'}`, env);
      return {
        up: false,
        status: 'DOWN',
        reason: plainWordsReason(errLine),
        lastError: errLine,
      };
    };

    try {
      const res = await fetchImpl(probeUrl, {
        method: 'GET',
        headers,
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
      });
      return interpretHttpStatus(Number(res?.status || 0));
    } catch (err) {
      const primaryHost = String(svc?.host || '')
        .trim()
        .toLowerCase();
      const canLoopbackFallback =
        isLocalNode &&
        !machineLocal &&
        !token &&
        isConnectionRefusedError(err) &&
        primaryHost !== LOOPBACK_HOST &&
        primaryHost !== 'localhost';

      if (canLoopbackFallback) {
        try {
          const fbRes = await fetchImpl(buildLoopbackProbeUrl(svc), {
            method: 'GET',
            headers,
            redirect: 'manual',
            signal: AbortSignal.timeout(timeoutMs),
          });
          return interpretHttpStatus(Number(fbRes?.status || 0), { loopbackFallback: true });
        } catch (fbErr) {
          const fbErrLine = singleLineError(extractErrorMessage(fbErr), env);
          return {
            up: false,
            status: 'DOWN',
            reason: plainWordsReason(fbErrLine),
            lastError: fbErrLine,
          };
        }
      }

      const errLine = singleLineError(extractErrorMessage(err), env);
      return {
        up: false,
        status: 'DOWN',
        reason: plainWordsReason(errLine),
        lastError: errLine,
      };
    }
  }

  const targetHost = machineLocal ? svc.bind || LOOPBACK_HOST : svc.host;
  const tcpRes = await tcpProbeImpl(targetHost, Number(svc.port), Math.min(timeoutMs, 2500));
  if (tcpRes?.ok) {
    return { up: true, status: 'UP', reason: 'Port accepting connections', lastError: null };
  }
  const errLine = singleLineError(tcpRes?.error || `TCP connect failed ${targetHost}:${svc.port}`, env);
  return {
    up: false,
    status: 'DOWN',
    reason: plainWordsReason(errLine),
    lastError: errLine,
  };
}

export function readKeepaliveSummary(statusPath = DEFAULT_KEEPALIVE_STATUS_PATH) {
  try {
    if (!statusPath || !fs.existsSync(statusPath)) {
      return { updated: null, stagesUp: 0, stagesTotal: 0 };
    }
    const raw = fs.readFileSync(statusPath, 'utf8').replace(/^\uFEFF/, '');
    const parsed = JSON.parse(raw);
    const stages = Array.isArray(parsed?.stages) ? parsed.stages : [];
    const stagesTotal = stages.length;
    const stagesUp = stages.filter((s) => s && (s.status === 'UP' || s.status === 'HEALED')).length;
    return {
      updated: parsed?.updated ? String(parsed.updated) : null,
      stagesUp,
      stagesTotal,
    };
  } catch {
    return { updated: null, stagesUp: 0, stagesTotal: 0 };
  }
}

export function defaultHermesBinPath(env = process.env) {
  const localAppData = String(
    env?.LOCALAPPDATA || process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  ).trim();
  return path.join(localAppData, 'hermes', 'bin', 'hermes.exe');
}

export function readTelegramConfig(
  env = process.env,
  { hermesBin = null, hermesAvailable = null, disableTelegram = false } = {},
) {
  const token = String(env?.TELEGRAM_BOT_TOKEN || env?.ORC_NOTIFY_TELEGRAM_TOKEN || '').trim();
  const chatId = String(env?.TELEGRAM_CHAT_ID || env?.TELEGRAM_HOME_CHAT || env?.ORC_NOTIFY_TELEGRAM_CHAT || '').trim();
  const directConfigured = Boolean(token && chatId);
  const resolvedHermesBin = String(hermesBin || env?.HERMES_BIN || defaultHermesBinPath(env)).trim();
  const hasHermes =
    typeof hermesAvailable === 'boolean'
      ? hermesAvailable
      : Boolean(resolvedHermesBin && fs.existsSync(resolvedHermesBin));
  const disabled = Boolean(disableTelegram) || String(env?.MISSION_OS_DISABLE_TELEGRAM || '').trim() === '1';
  const transport = disabled ? 'none' : directConfigured ? 'bot-api' : hasHermes ? 'hermes-cli' : 'none';
  return {
    configured: directConfigured || hasHermes,
    directConfigured,
    hermesAvailable: hasHermes,
    disabled,
    transport,
    token,
    chatId,
    hermesBin: resolvedHermesBin,
  };
}

export function defaultHermesSend(hermesBin, args, timeoutMs = 15000) {
  return new Promise((resolve) => {
    execFile(
      hermesBin,
      args,
      { timeout: timeoutMs, maxBuffer: 256 * 1024, windowsHide: true, shell: false },
      (error, stdout, stderr) => {
        if (error) {
          resolve({
            ok: false,
            error: String(stderr || stdout || error?.message || error || 'Hermes CLI send failed'),
          });
          return;
        }
        resolve({ ok: true, stdout: String(stdout || ''), stderr: String(stderr || '') });
      },
    );
  });
}

export function formatWatchdogTelegramMessage({ nodeName, nodeHost, redSince, failingServices, env }) {
  const lines = [
    'Mission OS Watchdog Alert — Node RED (5+ min)',
    `Node: ${nodeName} (${nodeHost})`,
    `Red since: ${redSince}`,
    `Failing services (${failingServices.length}):`,
  ];
  for (const svc of failingServices.slice(0, 8)) {
    lines.push(`- ${svc.name} (:${svc.port}) — ${svc.reason} (since ${svc.since})`);
  }
  const primaryErr = failingServices.find((s) => s.lastError)?.lastError;
  if (primaryErr) {
    lines.push(`Last error: ${redactSecrets(primaryErr, env)}`);
  }
  return redactSecrets(lines.join('\n'), env);
}

function loadPersistedIncidents(incidentsPath) {
  try {
    if (!incidentsPath || !fs.existsSync(incidentsPath)) {
      return { nodes: {}, serviceSince: {} };
    }
    const raw = fs.readFileSync(incidentsPath, 'utf8').replace(/^\uFEFF/, '');
    const parsed = JSON.parse(raw);
    return {
      nodes: parsed?.nodes && typeof parsed.nodes === 'object' ? parsed.nodes : {},
      serviceSince: parsed?.serviceSince && typeof parsed.serviceSince === 'object' ? parsed.serviceSince : {},
    };
  } catch {
    return { nodes: {}, serviceSince: {} };
  }
}

function savePersistedIncidents(incidentsPath, data) {
  if (!incidentsPath) return;
  try {
    fs.mkdirSync(path.dirname(incidentsPath), { recursive: true });
    fs.writeFileSync(incidentsPath, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // Non-fatal if read-only filesystem
  }
}

export function createNodeWatchdog({
  fleetMap = null,
  fleetMapPath = DEFAULT_FLEET_MAP_PATH,
  incidentsPath = DEFAULT_INCIDENTS_PATH,
  keepaliveStatusPath = DEFAULT_KEEPALIVE_STATUS_PATH,
  localNodeId = null,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  redAlertAfterMs = DEFAULT_RED_ALERT_AFTER_MS,
  env = process.env,
  fetchImpl = globalThis.fetch,
  tcpProbeImpl = defaultTcpProbe,
  probeService = null,
  hermesBin = null,
  hermesAvailable = null,
  hermesSendImpl = null,
  disableTelegram = false,
  nowMs = () => Date.now(),
} = {}) {
  let latestSnapshot = null;
  let lastCheckedMs = 0;
  let inFlightPass = null;
  let timer = null;

  const resolvedLocalNodeId = String(localNodeId || env?.MISSION_OS_NODE_ID || DEFAULT_LOCAL_NODE_ID)
    .trim()
    .toLowerCase();

  function resolveFleetMap() {
    if (fleetMap && typeof fleetMap === 'object') return fleetMap;
    return loadFleetMap(fleetMapPath);
  }

  function resolveTelegramConfig() {
    const resolvedHermesAvailable =
      typeof hermesAvailable === 'boolean' ? hermesAvailable : hermesSendImpl ? true : null;
    return readTelegramConfig(env, {
      hermesBin,
      hermesAvailable: resolvedHermesAvailable,
      disableTelegram,
    });
  }

  async function sendTelegramAlert(messageText) {
    const tg = resolveTelegramConfig();
    if (tg.disabled || tg.transport === 'none') {
      return { sent: false, transport: 'none', error: null };
    }
    const safeText = redactSecrets(messageText, env);
    if (tg.transport === 'bot-api') {
      try {
        const res = await fetchImpl(`https://api.telegram.org/bot${tg.token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: tg.chatId,
            text: safeText,
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (!res || !res.ok) {
          return {
            sent: false,
            transport: 'bot-api',
            error: `Telegram send failed with HTTP ${res ? res.status : 'no response'}`,
          };
        }
        return { sent: true, transport: 'bot-api', error: null };
      } catch (err) {
        return {
          sent: false,
          transport: 'bot-api',
          error: singleLineError(extractErrorMessage(err), env) || 'Telegram request failed',
        };
      }
    }

    try {
      const sender = hermesSendImpl || defaultHermesSend;
      const res = await sender(tg.hermesBin, ['send', '--to', 'telegram', '--quiet', safeText], 15000);
      if (res && (res.ok === false || res.sent === false)) {
        return {
          sent: false,
          transport: 'hermes-cli',
          error: singleLineError(res.error || 'Hermes CLI send failed', env) || 'Hermes CLI send failed',
        };
      }
      return { sent: true, transport: 'hermes-cli', error: null };
    } catch (err) {
      return {
        sent: false,
        transport: 'hermes-cli',
        error: singleLineError(extractErrorMessage(err), env) || 'Hermes CLI send failed',
      };
    }
  }

  async function executePass() {
    const currentMs = Number(nowMs());
    const checkedAt = new Date(currentMs).toISOString();
    const map = resolveFleetMap();
    const persisted = loadPersistedIncidents(incidentsPath);
    const nextServiceSince = {};
    const nextPersistedNodes = {};
    const statusNodes = [];
    const watchdogNodes = {};
    const incidents = [];
    const tgConfig = resolveTelegramConfig();

    for (const nodeId of MONITORED_NODE_IDS) {
      const nodeInfo = getNode(nodeId, map);
      const services = listServicesByNode(nodeId, map);

      const probedList = await Promise.all(
        services.map(async (svc) => {
          const probeOpts = { env, localNodeId: resolvedLocalNodeId, fetchImpl, tcpProbeImpl };
          const rawProbe = probeService ? await probeService(svc, probeOpts) : await probeFleetService(svc, probeOpts);
          const up = Boolean(rawProbe?.up);
          const status = up ? 'UP' : rawProbe?.status === 'AUTH REQUIRED' ? 'AUTH REQUIRED' : 'DOWN';
          const lastError = up ? null : singleLineError(rawProbe?.lastError || rawProbe?.reason || 'Probe failed', env);
          const reason = up
            ? String(rawProbe?.reason || 'Healthy')
            : String(rawProbe?.reason || plainWordsReason(lastError));

          const svcKey = `${nodeId}:${svc.id}`;
          const prevSvc = persisted.serviceSince[svcKey];
          const since =
            prevSvc && Boolean(prevSvc.up) === up && typeof prevSvc.since === 'string' && prevSvc.since
              ? prevSvc.since
              : checkedAt;
          nextServiceSince[svcKey] = { up, status, since };

          return {
            id: svc.id,
            name: svc.name || svc.id,
            host: svc.host,
            port: Number(svc.port),
            scope: svc.scope || 'lan',
            up,
            status,
            since,
            reason,
            lastError,
          };
        }),
      );

      const failing = probedList.filter((s) => !s.up);
      const nodeUp = failing.length === 0;
      const light = nodeUp ? 'green' : 'red';
      const flashing = !nodeUp;

      const prevNode = persisted.nodes[nodeId] || {};
      let redSince = null;
      let alertSentAt = null;
      let lastAlertError = null;

      if (!nodeUp) {
        redSince = typeof prevNode.redSince === 'string' && prevNode.redSince ? prevNode.redSince : checkedAt;
        alertSentAt = typeof prevNode.alertSentAt === 'string' && prevNode.alertSentAt ? prevNode.alertSentAt : null;
        lastAlertError = prevNode.lastAlertError ? redactSecrets(prevNode.lastAlertError, env) : null;

        const redStartedMs = Date.parse(redSince);
        const elapsedMs = Number.isFinite(redStartedMs) ? currentMs - redStartedMs : 0;
        if (elapsedMs >= redAlertAfterMs && !alertSentAt && !tgConfig.disabled && tgConfig.configured) {
          const alertText = formatWatchdogTelegramMessage({
            nodeName: nodeInfo.name || nodeId.toUpperCase(),
            nodeHost: nodeInfo.host || nodeInfo.ip,
            redSince,
            failingServices: failing,
            env,
          });
          const sendRes = await sendTelegramAlert(alertText);
          if (sendRes.sent) {
            alertSentAt = checkedAt;
            lastAlertError = null;
          } else if (sendRes.error) {
            lastAlertError = redactSecrets(sendRes.error, env);
          }
        }
      }

      nextPersistedNodes[nodeId] = {
        light,
        flashing,
        redSince,
        alertSentAt,
        lastAlertError,
      };

      statusNodes.push({
        id: nodeId,
        name: nodeInfo.name || (nodeId === 't5500' ? 'T5500' : 'Alienware'),
        host: nodeInfo.host || nodeInfo.ip,
        up: nodeUp,
        light,
        flashing,
        services: probedList,
      });

      const failingSummary = failing.map((svc) => ({
        id: svc.id,
        serviceId: svc.id,
        name: svc.name,
        serviceName: svc.name,
        host: svc.host,
        port: svc.port,
        status: svc.status,
        since: svc.since,
        reason: svc.reason,
        lastError: svc.lastError,
      }));

      watchdogNodes[nodeId] = {
        light,
        flashing,
        redSince,
        alertSentAt,
        failingServices: failingSummary,
      };

      for (const svc of failing) {
        const dayTag = String(svc.since || checkedAt)
          .slice(0, 10)
          .replace(/-/g, '');
        incidents.push({
          incidentId: `inc-${nodeId}-${svc.id}-${dayTag}`,
          node: nodeId,
          serviceId: svc.id,
          serviceName: svc.name,
          host: svc.host,
          port: svc.port,
          status: svc.status,
          since: svc.since,
          reason: svc.reason,
          lastError: svc.lastError,
          notifiedTelegram: Boolean(alertSentAt),
          notifiedAt: alertSentAt,
        });
      }
    }

    const keepalive = readKeepaliveSummary(keepaliveStatusPath);

    savePersistedIncidents(incidentsPath, {
      schema: 'antigravity.watchdog-incidents.v1',
      updatedAt: checkedAt,
      nodes: nextPersistedNodes,
      serviceSince: nextServiceSince,
      incidents,
    });

    const pollIntervalSeconds = Math.max(1, Math.round(pollIntervalMs / 1000));
    const redAlertAfterSeconds = Math.max(1, Math.round(redAlertAfterMs / 1000));

    const statusPayload = {
      ok: true,
      apiVersion: 'v1',
      checkedAt,
      pollIntervalSeconds,
      nodes: statusNodes,
    };

    const watchdogPayload = {
      ok: true,
      apiVersion: 'v1',
      checkedAt,
      redAlertAfterSeconds,
      telegramConfigured: tgConfig.configured,
      telegramTransport: tgConfig.transport,
      nodes: watchdogNodes,
      incidents,
      keepalive,
    };

    latestSnapshot = {
      ok: true,
      checkedAt,
      status: statusPayload,
      watchdog: watchdogPayload,
    };
    lastCheckedMs = currentMs;
    return latestSnapshot;
  }

  async function runOnce() {
    if (inFlightPass) return inFlightPass;
    inFlightPass = executePass().finally(() => {
      inFlightPass = null;
    });
    return inFlightPass;
  }

  async function ensureFresh({ refresh = false } = {}) {
    const ageMs = Number(nowMs()) - lastCheckedMs;
    if (!refresh && latestSnapshot && ageMs >= 0 && ageMs < pollIntervalMs) {
      return latestSnapshot;
    }
    return runOnce();
  }

  async function getStatus(opts = {}) {
    const snap = await ensureFresh(opts);
    return snap.status;
  }

  async function getWatchdogState(opts = {}) {
    const snap = await ensureFresh(opts);
    return snap.watchdog;
  }

  function start() {
    if (timer) return;
    runOnce().catch(() => {});
    timer = setInterval(() => {
      runOnce().catch(() => {});
    }, pollIntervalMs);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  return {
    runOnce,
    getStatus,
    getWatchdogState,
    start,
    stop,
  };
}

function parseCliArgs(argv = []) {
  const opts = {
    once: false,
    json: false,
    disableTelegram: false,
    localNodeId: null,
    fleetMapPath: DEFAULT_FLEET_MAP_PATH,
    incidentsPath: DEFAULT_INCIDENTS_PATH,
    keepaliveStatusPath: DEFAULT_KEEPALIVE_STATUS_PATH,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--once') opts.once = true;
    else if (arg === '--json') opts.json = true;
    else if (arg === '--no-telegram') opts.disableTelegram = true;
    else if (arg === '--node-id' && argv[i + 1]) {
      opts.localNodeId = argv[i + 1];
      i += 1;
    } else if (arg === '--fleet-map' && argv[i + 1]) {
      opts.fleetMapPath = path.resolve(argv[i + 1]);
      i += 1;
    } else if (arg === '--incidents-file' && argv[i + 1]) {
      opts.incidentsPath = path.resolve(argv[i + 1]);
      i += 1;
    } else if (arg === '--status-file' && argv[i + 1]) {
      opts.keepaliveStatusPath = path.resolve(argv[i + 1]);
      i += 1;
    }
  }
  return opts;
}

const IS_MAIN = Boolean(
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url)),
);
if (IS_MAIN) {
  const cliOpts = parseCliArgs(process.argv.slice(2));
  const watchdog = createNodeWatchdog({
    fleetMapPath: cliOpts.fleetMapPath,
    incidentsPath: cliOpts.incidentsPath,
    keepaliveStatusPath: cliOpts.keepaliveStatusPath,
    localNodeId: cliOpts.localNodeId,
    disableTelegram: cliOpts.disableTelegram,
  });
  if (cliOpts.once) {
    watchdog
      .runOnce()
      .then((snap) => {
        if (cliOpts.json) {
          process.stdout.write(`${JSON.stringify(snap, null, 2)}\n`);
        } else {
          for (const node of snap.status.nodes) {
            const failCount = node.services.filter((s) => !s.up).length;
            const detail =
              failCount === 0
                ? `${node.services.length}/${node.services.length} services UP`
                : `${failCount} of ${node.services.length} DOWN`;
            process.stdout.write(`[watchdog] ${node.name} (${node.host}): ${node.light.toUpperCase()} — ${detail}\n`);
          }
        }
        process.exitCode = 0;
      })
      .catch((err) => {
        const safeMsg = singleLineError(err?.message || err, process.env) || 'Watchdog pass failed';
        if (cliOpts.json) {
          process.stdout.write(`${JSON.stringify({ ok: false, error: safeMsg })}\n`);
        } else {
          process.stderr.write(`[watchdog] error: ${safeMsg}\n`);
        }
        process.exitCode = 1;
      });
  } else {
    watchdog.start();
  }
}
