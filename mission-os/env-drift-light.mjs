import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logStartupEnvCheck } from '../ops/agents/env-required.mjs';
import { buildHealthEnvLight, readAgentDriftStatus } from '../ops/agents/node-light.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/**
 * Compute Stage E3/E4 env-key and agent-drift light fields without reading any .env file.
 * Returns counts and the light only (stream-safe), never setting or file names.
 */
export function getMissionOsEnvDriftLight({
  manifestDir = HERE,
  env = process.env,
  driftPath = '',
} = {}) {
  const drift = readAgentDriftStatus(driftPath, env);
  const light = buildHealthEnvLight({ manifestDir, env, driftPath });
  // Mission OS is shown on stream: counts and light only. Setting names go to the startup log.
  return {
    missingEnvCount: Array.isArray(light.missingEnv) ? light.missingEnv.length : 0,
    driftedCount: light.driftedCount,
    agentDrift: {
      present: drift.present,
      driftedCount: light.driftedCount,
    },
    nodeLight: light.nodeLight,
  };
}

/**
 * Emit startup warning naming only missing required env keys (never values).
 */
export function warnMissionOsMissingEnv({
  manifestDir = HERE,
  env = process.env,
  warn = console.warn,
} = {}) {
  return logStartupEnvCheck(manifestDir, env, warn);
}
