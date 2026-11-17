import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logStartupEnvCheck } from '../ops/agents/env-required.mjs';
import { buildHealthEnvLight, readAgentDriftStatus } from '../ops/agents/node-light.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/**
 * Compute Stage E3/E4 env-key and agent-drift light fields without reading any .env file.
 */
export function getMissionOsEnvDriftLight({
  manifestDir = HERE,
  env = process.env,
  driftPath = '',
} = {}) {
  const drift = readAgentDriftStatus(driftPath, env);
  const light = buildHealthEnvLight({ manifestDir, env, driftPath });
  return {
    missingEnv: light.missingEnv,
    driftedFiles: light.driftedFiles,
    driftedCount: light.driftedCount,
    agentDrift: {
      present: drift.present,
      driftedFiles: light.driftedFiles,
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
