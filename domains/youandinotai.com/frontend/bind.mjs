import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadDateAppFrontendConfig() {
  try {
    const fleetPath = path.resolve(__dirname, '..', '..', '..', 'ops', 'fleet', 'fleet-map.json');
    const parsed = JSON.parse(fs.readFileSync(fleetPath, 'utf8'));
    const rawServices = parsed?.services;
    const svc = Array.isArray(rawServices)
      ? rawServices.find((s) => s?.id === 'dateapp-frontend' || s?.id === 'date-app-web')
      : rawServices?.['dateapp-frontend'] || rawServices?.['date-app-web'];
    if (svc) {
      return {
        host: String(svc.host || '192.168.0.15'),
        port: Number(svc.port || 3200),
        bind: String(svc.bind || '0.0.0.0'),
      };
    }
  } catch {
    // Fallback when running outside monorepo layout
  }
  return { host: '192.168.0.15', port: 3200, bind: '0.0.0.0' };
}

export function resolveFrontendBind(
  env = process.env,
  { port = Number(env?.PORT || 3200), bind = '0.0.0.0', warn = console.warn } = {}
) {
  const token = String(env?.FLEET_SHARED_TOKEN || '').trim();
  const explicit = String(env?.HOST || '').trim();
  if (explicit) {
    return explicit;
  }
  if (!token) {
    warn?.(
      `[youandinotai-frontend] WARNING: FLEET_SHARED_TOKEN is not set; binding 127.0.0.1 on port ${port} (this machine only).`
    );
    return '127.0.0.1';
  }
  return bind;
}