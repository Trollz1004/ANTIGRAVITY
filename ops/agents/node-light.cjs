'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { checkRequiredEnv } = require('./env-required.cjs');

/**
 * Resolve the path to `agent-drift.json` using an explicit override, `AGENT_DRIFT_PATH`,
 * or `%LOCALAPPDATA%\dream-boot\agent-drift.json`.
 */
function resolveAgentDriftPath(env = process.env, overridePath = '') {
  const explicit = String(overridePath || '').trim();
  if (explicit) return explicit;
  const source = env || process.env;
  const fromEnv = String(source.AGENT_DRIFT_PATH || '').trim();
  if (fromEnv) return fromEnv;
  const localAppData = String(source.LOCALAPPDATA || '').trim();
  if (localAppData) {
    return path.join(localAppData, 'dream-boot', 'agent-drift.json');
  }
  return path.join(os.homedir(), 'AppData', 'Local', 'dream-boot', 'agent-drift.json');
}

/**
 * Read `agent-drift.json` (never throwing) and normalize `{ present, path, driftedFiles, driftedCount }`.
 */
function readAgentDriftStatus(driftPathOrOptions = '', envArg = process.env) {
  let overridePath = '';
  let env = envArg || process.env;
  if (driftPathOrOptions && typeof driftPathOrOptions === 'object') {
    overridePath = driftPathOrOptions.driftPath || driftPathOrOptions.path || '';
    env = driftPathOrOptions.env || env;
  } else {
    overridePath = driftPathOrOptions || '';
  }

  const resolved = resolveAgentDriftPath(env, overridePath);
  if (!resolved || !fs.existsSync(resolved)) {
    return {
      present: false,
      path: resolved,
      driftedFiles: [],
      driftedCount: 0,
    };
  }

  try {
    const raw = fs.readFileSync(resolved, 'utf8').replace(/^\uFEFF/, '');
    if (!raw.trim()) {
      return {
        present: true,
        path: resolved,
        driftedFiles: [],
        driftedCount: 0,
      };
    }
    const parsed = JSON.parse(raw);
    const items = parsed && Array.isArray(parsed.driftedFiles) ? parsed.driftedFiles : [];
    const driftedFiles = items
      .map((entry) => {
        if (typeof entry === 'string') {
          return { file: entry.trim(), reason: 'drifted' };
        }
        if (entry && typeof entry === 'object') {
          const fileName = String(entry.file || entry.path || '').trim();
          const reason = String(entry.reason || 'drifted').trim() || 'drifted';
          return { file: fileName, reason };
        }
        return { file: '', reason: 'drifted' };
      })
      .filter((entry) => entry.file.length > 0);
    return {
      present: true,
      path: resolved,
      driftedFiles,
      driftedCount: driftedFiles.length,
    };
  } catch {
    return {
      present: true,
      path: resolved,
      driftedFiles: [{ file: path.basename(resolved), reason: 'unreadable' }],
      driftedCount: 1,
    };
  }
}

/**
 * Build consistent `/health` env + drift + nodeLight payload from in-memory env keys and `agent-drift.json`.
 */
function buildHealthEnvLight({ manifestDir, env = process.env, driftPath = '' } = {}) {
  const envCheck = manifestDir
    ? checkRequiredEnv(manifestDir, env)
    : { missingEnv: [] };
  const missingEnv = Array.isArray(envCheck.missingEnv) ? envCheck.missingEnv : [];
  const drift = readAgentDriftStatus(driftPath, env);
  const driftedFiles = drift.driftedFiles;
  const driftedCount = driftedFiles.length;
  const nodeLight = missingEnv.length > 0 || driftedFiles.length > 0 ? 'amber' : 'green';
  return {
    missingEnv,
    driftedFiles,
    driftedCount,
    nodeLight,
  };
}

module.exports = {
  resolveAgentDriftPath,
  readAgentDriftStatus,
  buildHealthEnvLight,
};
