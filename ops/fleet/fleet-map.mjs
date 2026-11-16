import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_FLEET_MAP_PATH = path.join(HERE, 'fleet-map.json');

let cachedDefaultMap = null;

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
  const node = fleetMap.nodes?.[key];
  if (!node) {
    throw new Error(`Unknown fleet node "${nodeId}"`);
  }
  return node;
}

export function getNodeIp(nodeId, fleetMap = loadFleetMap()) {
  return getNode(nodeId, fleetMap).ip;
}

export function getService(serviceId, fleetMap = loadFleetMap()) {
  const key = String(serviceId || '').trim().toLowerCase();
  const svc = fleetMap.services?.[key];
  if (!svc) {
    throw new Error(`Unknown fleet service "${serviceId}"`);
  }
  return svc;
}

export function getServiceUrl(serviceId, pathSuffix = '', fleetMap = loadFleetMap()) {
  const svc = getService(serviceId, fleetMap);
  const scheme = svc.protocol === 'ws' || svc.protocol === 'wss' ? svc.protocol : 'http';
  const base = (svc.url || `${scheme}://${svc.host}:${svc.port}`).replace(/\/+$/, '');
  if (!pathSuffix) return base;
  const normalizedSuffix = String(pathSuffix).startsWith('/') ? String(pathSuffix) : `/${pathSuffix}`;
  return `${base}${normalizedSuffix}`;
}

export function getBindHost(serviceId, envOverride = '', fleetMap = loadFleetMap()) {
  const trimmed = String(envOverride || '').trim();
  if (trimmed) return trimmed;
  return getService(serviceId, fleetMap).bind;
}

export function listServicesByNode(nodeId, fleetMap = loadFleetMap()) {
  const key = String(nodeId || '').trim().toLowerCase();
  getNode(key, fleetMap);
  return Object.values(fleetMap.services || {}).filter((svc) => svc.node === key);
}
