/**
 * Server configuration for the JARVIS dashboard — pure functions, no side effects.
 *
 * Precedence for every setting: process.env > the repo's .env file > a derived default.
 * The repo root defaults to two levels above this server folder (dashboard/jarvis),
 * so the server works wherever the repo is checked out. The LAN IP falls back to a
 * real interface address, never to another node's hardcoded IP.
 */
import { readFileSync, existsSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { resolve, join, sep, basename } from 'node:path';

const OMNI_DEFAULT = 'http://192.168.0.8:20128/v1'; // Sabertooth router (see CLAUDE.md nodes table)

export function readEnvFile(file) {
  const out = {};
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { return out; }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    out[m[1]] = m[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  }
  return out;
}

function firstLanAddress(interfaces) {
  for (const list of Object.values(interfaces() || {})) {
    for (const i of list || []) {
      if ((i.family === 'IPv4' || i.family === 4) && !i.internal) return i.address;
    }
  }
  return '127.0.0.1';
}

/**
 * @param {object} opts
 * @param {string} opts.here        folder holding server.mjs
 * @param {object} [opts.env]       process.env (or a stand-in)
 * @param {function} [opts.readEnv] (file) => map, defaults to readEnvFile
 * @param {function} [opts.interfaces] defaults to os.networkInterfaces
 */
export function resolveConfig({ here, env = process.env, readEnv = readEnvFile, interfaces = networkInterfaces }) {
  const repoDefault = resolve(here, '..', '..');
  // The .env lives at the repo root. Read it first so ANTIGRAVITY_ROOT from .env can move the repo.
  const envFile = env.DASHBOARD_ENV_FILE || join(repoDefault, '.env');
  const file = readEnv(envFile) || {};
  const pick = (name) => (env[name] !== undefined && env[name] !== '' ? env[name] : file[name]);
  const repo = resolve(pick('ANTIGRAVITY_ROOT') || repoDefault);
  const lanIp = pick('NODE_LAN_IP') || firstLanAddress(interfaces);
  const port = Number(pick('AIRI_DASHBOARD_PORT') || 9150);
  const omni = (pick('OPENAI_COMPAT_BASE_URL') || pick('OMNIROUTE_LAN_BASE_URL') || OMNI_DEFAULT).replace(/\/$/, '');
  // Sentry lives on Sabertooth (see AGENTS.md nodes table) unless .env says otherwise.
  // Mission Control needs no endpoint: THIS dashboard is mission control.
  const sentry = (pick('FABLES_SENTRY_URL') || 'http://192.168.0.8:9140').replace(/\/$/, '');
  const missionControl = '';
  return { repo, envFile, lanIp, port, omni, sentry, missionControl, nodeName: pick('NODE_NAME') || '', file };
}

/**
 * Obsidian vault resolution, self-healing: the configured path wins only when it
 * actually exists on this node (paths migrate between machines); otherwise the
 * first existing candidate wins; otherwise the configured path is kept as the
 * default so /api/vault/graph can report exactly what is missing.
 * @param {object} opts
 * @param {object} opts.env        process.env (or a stand-in)
 * @param {function} opts.readEnv  (file) => map
 * @param {string} [opts.envFile]  repo .env location
 * @param {string[]} [opts.candidates] extra fallback folders (repo-relative defaults)
 */
export function resolveVault({ env = process.env, readEnv = readEnvFile, envFile, candidates = [] }) {
  // OBSIDIAN_VAULT is the current name; OBSIDIAN_VAULT_ANTIGRAVITY is accepted as legacy.
  const fromEnv = env.OBSIDIAN_VAULT || env.OBSIDIAN_VAULT_ANTIGRAVITY || '';
  const file = envFile ? (readEnv(envFile) || {}) : {};
  const fromFile = file.OBSIDIAN_VAULT || file.OBSIDIAN_VAULT_ANTIGRAVITY || '';
  const configured = fromEnv || fromFile;
  const fallback = join(resolve(import.meta.dirname, '..', '..'), 'Antigravity');
  const list = [configured, ...candidates, fallback].filter(Boolean);
  const existing = list.find((p) => { try { return existsSync(p); } catch { return false; } });
  const path = existing || configured || fallback;
  const exists = Boolean(existing);
  // Stable vault id from .env (Obsidian's per-vault id): obsidian:// links use
  // id when known so they survive vault renames. env beats file, '' when unset.
  const id = env.OBSIDIAN_VAULT_ID || file.OBSIDIAN_VAULT_ID || '';
  return {
    path,
    name: basename(path) || 'Antigravity',
    id,
    exists,
    source: existing ? (configured ? (existing === resolve(configured) ? 'configured' : 'auto') : 'auto') : 'default',
  };
}
