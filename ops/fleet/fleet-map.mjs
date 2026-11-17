import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_FLEET_MAP_PATH = path.join(HERE, 'fleet-map.json');

const SERVICE_ALIASES = {
  postgres: ['t5500-postgres'],
  't5500-postgres': ['postgres'],
  redis: ['t5500-redis'],
  't5500-redis': ['redis'],
  'dateapp-frontend': ['date-app-web'],
  'date-app-web': ['dateapp-frontend'],
  'dateapp-api': ['date-app-api'],
  'date-app-api': ['dateapp-api'],
  'hermes-gateway': ['hermes-api'],
  'hermes-api': ['hermes-gateway'],
  'hermes-dashboard': ['t5500-hermes-dashboard'],
  't5500-hermes-dashboard': ['hermes-dashboard'],
  'ollama-t5500': ['t5500-ollama'],
  't5500-ollama': ['ollama-t5500'],
  'obsidian-t5500': ['t5500-obsidian-rest'],
  't5500-obsidian-rest': ['obsidian-t5500'],
  'leadgen-desk': ['hermes-leadgen'],
  'hermes-leadgen': ['leadgen-desk'],
  'npc-lab': ['live-npc-lab'],
  'live-npc-lab': ['npc-lab'],
  'ollama-alienware': ['alienware-ollama'],
  'alienware-ollama': ['ollama-alienware'],
  'obsidian-alienware': ['alienware-obsidian-rest', 'obsidian-rest'],
  'alienware-obsidian-rest': ['obsidian-alienware', 'obsidian-rest'],
  'obsidian-rest': ['obsidian-alienware', 'alienware-obsidian-rest'],
  governance: ['official-vote', 'official-vote-service'],
  'official-vote': ['governance', 'official-vote-service'],
  'official-vote-service': ['governance', 'official-vote'],
};

/**
 * ANTIGRAVITY repo-auxiliary services not tracked in the canonical cross-repo fleet-map.json.
 * Looked up ONLY by single-service resolution (getService/getServiceUrl/getBindHost) when
 * absent from fleet-map.json; never injected into listAllServices/listServicesByNode.
 */
export const REPO_FALLBACK_SERVICES = {
  odysseus: {
    id: 'odysseus',
    name: 'Odysseus Workspace UI',
    node: 't5500',
    port: 7011,
    protocol: 'http',
    scope: 'lan-guarded',
    bind: '0.0.0.0',
    tokenEnv: 'MISSION_OS_TOKEN',
    healthPath: '/',
  },
  governance: {
    id: 'governance',
    name: 'Official Vote Service',
    node: 't5500',
    port: 9134,
    protocol: 'http',
    scope: 'lan-guarded',
    bind: '0.0.0.0',
    tokenEnv: 'OFFICIAL_VOTE_TOKEN',
    healthPath: '/health',
  },
  'mission-mcp': {
    id: 'mission-mcp',
    name: 'Mission MCP',
    node: 't5500',
    port: 3901,
    protocol: 'http',
    scope: 'lan-guarded',
    bind: '0.0.0.0',
    tokenEnv: 'MISSION_MCP_TOKEN',
    healthPath: '/health',
  },
  'onemin-shim': {
    id: 'onemin-shim',
    name: '1min.ai OpenAI Shim',
    node: 't5500',
    port: 20130,
    protocol: 'http',
    scope: 'lan-guarded',
    bind: '0.0.0.0',
    tokenEnv: 'ONEMIN_SHIM_TOKEN',
    healthPath: '/health',
  },
};

let cachedDefaultMap = null;

export function isMachineLocalScope(scope) {
  const normalized = String(scope || '').trim().toLowerCase();
  return normalized === 'this machine only' || normalized === 'local-only';
}

export function getServiceTokenEnv(svc) {
  if (!svc || typeof svc !== 'object') return null;
  if (svc.tokenEnv !== undefined && svc.tokenEnv !== null && String(svc.tokenEnv).trim()) {
    return String(svc.tokenEnv).trim();
  }
  if (svc.authTokenEnv !== undefined && svc.authTokenEnv !== null && String(svc.authTokenEnv).trim()) {
    return String(svc.authTokenEnv).trim();
  }
  return null;
}

function normalizeNodeEntry(node, fallbackId = '') {
  const id = String(node?.id || fallbackId || '').trim();
  const ip = String(node?.ip || node?.host || '').trim();
  const host = String(node?.host || node?.ip || '').trim();
  return { ...node, id, ip, host };
}

function normalizeServiceEntry(svc, fallbackId = '') {
  const id = String(svc?.id || fallbackId || '').trim();
  const tokenEnv = getServiceTokenEnv(svc);
  const authTokenEnv =
    svc?.authTokenEnv !== undefined && svc?.authTokenEnv !== null
      ? String(svc.authTokenEnv)
      : tokenEnv || '';
  const localOnly = isMachineLocalScope(svc?.scope);
  const host = String(svc?.host || (localOnly ? '127.0.0.1' : '')).trim();
  const bind = localOnly ? '127.0.0.1' : String(svc?.bind || '0.0.0.0').trim();
  return {
    ...svc,
    id,
    host,
    bind,
    tokenEnv,
    authTokenEnv,
  };
}

export function loadFleetMap(mapPath = DEFAULT_FLEET_MAP_PATH) {
  const resolved = path.resolve(mapPath);
  if (resolved === path.resolve(DEFAULT_FLEET_MAP_PATH) && cachedDefaultMap) {
    return cachedDefaultMap;
  }
  const raw = fs.readFileSync(resolved, 'utf8').replace(/^\uFEFF/, '');
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || !parsed.nodes || !parsed.services) {
    throw new Error(`Invalid fleet map structure in ${resolved}`);
  }
  if (resolved === path.resolve(DEFAULT_FLEET_MAP_PATH)) {
    cachedDefaultMap = parsed;
  }
  return parsed;
}

export function getNode(nodeId, fleetMap = loadFleetMap()) {
  const key = String(nodeId || '').trim().toLowerCase();
  const rawNodes = fleetMap?.nodes;
  let found = null;
  if (Array.isArray(rawNodes)) {
    const match = rawNodes.find((n) => n && String(n.id || '').trim().toLowerCase() === key);
    if (match) found = normalizeNodeEntry(match, key);
  } else if (rawNodes && typeof rawNodes === 'object') {
    const direct = rawNodes[key];
    if (direct) {
      found = normalizeNodeEntry(direct, key);
    } else {
      const entry = Object.entries(rawNodes).find(
        ([k, v]) => k.toLowerCase() === key || String(v?.id || '').trim().toLowerCase() === key
      );
      if (entry) found = normalizeNodeEntry(entry[1], entry[0]);
    }
  }
  if (!found) {
    throw new Error(`Unknown fleet node "${nodeId}"`);
  }
  return found;
}

export function getNodeIp(nodeId, fleetMap = loadFleetMap()) {
  return getNode(nodeId, fleetMap).ip;
}

export function listAllServices(fleetMap = loadFleetMap()) {
  const rawServices = fleetMap?.services;
  if (Array.isArray(rawServices)) {
    return rawServices
      .filter((svc) => svc && typeof svc === 'object')
      .map((svc, idx) => normalizeServiceEntry(svc, `service-${idx}`));
  }
  if (rawServices && typeof rawServices === 'object') {
    return Object.entries(rawServices)
      .filter(([, svc]) => svc && typeof svc === 'object')
      .map(([k, svc]) => normalizeServiceEntry(svc, k));
  }
  return [];
}

function resolveFallbackService(candidate, fleetMap) {
  const fb = REPO_FALLBACK_SERVICES[candidate];
  if (!fb) return null;
  const host = isMachineLocalScope(fb.scope) ? '127.0.0.1' : getNode(fb.node, fleetMap).ip;
  return normalizeServiceEntry({ ...fb, host }, fb.id);
}

export function getService(serviceId, fleetMap = loadFleetMap()) {
  const key = String(serviceId || '').trim().toLowerCase();
  const allServices = listAllServices(fleetMap);
  const candidates = [key, ...(SERVICE_ALIASES[key] || [])];
  for (const candidate of candidates) {
    const match = allServices.find((svc) => svc.id.toLowerCase() === candidate);
    if (match) return match;
  }
  if (!Array.isArray(fleetMap?.services) && fleetMap?.services && typeof fleetMap.services === 'object') {
    for (const candidate of candidates) {
      if (fleetMap.services[candidate]) {
        return normalizeServiceEntry(fleetMap.services[candidate], candidate);
      }
    }
  }
  for (const candidate of candidates) {
    const fallback = resolveFallbackService(candidate, fleetMap);
    if (fallback) return fallback;
  }
  throw new Error(`Unknown fleet service "${serviceId}"`);
}

export function getServiceUrl(serviceId, pathSuffix = '', fleetMap = loadFleetMap()) {
  const svc = getService(serviceId, fleetMap);
  const scheme = svc.protocol === 'ws' || svc.protocol === 'wss' || svc.protocol === 'https' ? svc.protocol : 'http';
  const host = isMachineLocalScope(svc.scope) ? '127.0.0.1' : svc.host;
  const base = (svc.url || `${scheme}://${host}:${svc.port}`).replace(/\/+$/, '');
  if (!pathSuffix) return base;
  const normalizedSuffix = String(pathSuffix).startsWith('/') ? String(pathSuffix) : `/${pathSuffix}`;
  return `${base}${normalizedSuffix}`;
}

export function getBindHost(serviceId, envOverride = '', fleetMap = loadFleetMap()) {
  const trimmed = String(envOverride || '').trim();
  if (trimmed) return trimmed;
  const svc = getService(serviceId, fleetMap);
  if (isMachineLocalScope(svc.scope)) return '127.0.0.1';
  return svc.bind;
}

export function listServicesByNode(nodeId, fleetMap = loadFleetMap()) {
  const key = String(nodeId || '').trim().toLowerCase();
  getNode(key, fleetMap);
  return listAllServices(fleetMap).filter((svc) => String(svc.node || '').trim().toLowerCase() === key);
}
