import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const REPO_ROOT = path.resolve(APP_DIR, "..", "..");
export const WINDOWS_ROOT = "c:\\antigravity";
export const WSL_ROOT = "/mnt/c/antigravity";

export const SAFE_SOURCE_FILES = Object.freeze({
  orchestratorSkill: "skills/antigravity-mission-orchestrator/SKILL.md",
  envDriftMap: "docs/ops/ENV-DRIFT-MAP-2026-06-09.md",
  geminiEnvAudit: "docs/ops/GEMINI-ENV-AUDIT-2026-06-09.md",
  masterEnvTemplate: "docs/ops/MASTER-CODEX-ORCHESTRATOR.env.example",
  backendEnvTemplate: "backend/fastapi-app/.env.example",
  frontendEnvTemplate: "apps/youandinotai-frontend/.env.example",
  ciValidate: ".github/workflows/ci-validate.yml",
  vscodeRecommendations: ".vscode/extensions.json"
});

const BLOCKED_PATH_SEGMENT = /(^|[\\/])\.env($|[\\/]|[.\w-])/i;
const SECRET_PATTERN =
  /(AIza[0-9A-Za-z_-]{10,}|sk-[0-9A-Za-z_-]{10,}|ghp_[0-9A-Za-z_]{10,}|pplx-[0-9A-Za-z_-]{10,}|xai-[0-9A-Za-z_-]{10,}|rk_live_[0-9A-Za-z_-]{10,}|EAAA[0-9A-Za-z_-]{10,}|password\s*=\s*[^<>\s]+)/i;

function normalizeRelativePath(relativePath) {
  if (typeof relativePath !== "string" || relativePath.trim() === "") {
    throw new Error("Path must be a non-empty relative path.");
  }

  const normalized = relativePath.replaceAll("\\", "/");
  if (path.isAbsolute(relativePath) || normalized.includes("../") || normalized.startsWith("../")) {
    throw new Error(`Unsafe source path rejected: ${relativePath}`);
  }

  if (BLOCKED_PATH_SEGMENT.test(relativePath) && !relativePath.endsWith(".env.example")) {
    throw new Error(`Populated env path rejected: ${relativePath}`);
  }

  return normalized;
}

export function resolveSafeSource(sourceId) {
  const relativePath = SAFE_SOURCE_FILES[sourceId];
  if (!relativePath) {
    throw new Error(`Unknown safe source: ${sourceId}`);
  }

  const normalized = normalizeRelativePath(relativePath);
  const absolutePath = path.resolve(REPO_ROOT, normalized);
  const repoRootWithSep = `${REPO_ROOT}${path.sep}`;
  if (absolutePath !== REPO_ROOT && !absolutePath.startsWith(repoRootWithSep)) {
    throw new Error(`Source escaped repo root: ${relativePath}`);
  }

  return { sourceId, relativePath: normalized, absolutePath };
}

export async function readSafeSource(sourceId, maxChars = 8000) {
  const source = resolveSafeSource(sourceId);
  const text = await fs.readFile(source.absolutePath, "utf8");
  const clipped = text.length > maxChars ? `${text.slice(0, maxChars)}\n[truncated]` : text;
  if (SECRET_PATTERN.test(clipped)) {
    throw new Error(`Potential secret pattern detected in safe source: ${source.relativePath}`);
  }

  return { ...source, text: clipped, chars: text.length };
}

async function sourceStatus(sourceId) {
  const source = resolveSafeSource(sourceId);
  try {
    const stats = await fs.stat(source.absolutePath);
    return {
      sourceId,
      relativePath: source.relativePath,
      exists: true,
      bytes: stats.size,
      updatedAt: stats.mtime.toISOString()
    };
  } catch (error) {
    return {
      sourceId,
      relativePath: source.relativePath,
      exists: false,
      warning: error.code === "ENOENT" ? "missing" : error.message
    };
  }
}

function extractEnvKeys(text) {
  const keys = new Set();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Z][A-Z0-9_]+)\s*=/);
    if (match) keys.add(match[1]);
  }
  return [...keys].sort();
}

async function tryRead(sourceId, maxChars = 8000) {
  try {
    return await readSafeSource(sourceId, maxChars);
  } catch (error) {
    return { sourceId, error: error.message, text: "" };
  }
}

export async function getMissionStatus() {
  const sourceIds = Object.keys(SAFE_SOURCE_FILES);
  const sources = await Promise.all(sourceIds.map((sourceId) => sourceStatus(sourceId)));

  return {
    app: "ANTIGRAVITY Mission Control ChatGPT App",
    generatedAt: new Date().toISOString(),
    repo: {
      github: "Trollz1004/ANTIGRAVITY",
      windowsRoot: WINDOWS_ROOT,
      wslRoot: WSL_ROOT,
      localRoot: REPO_ROOT
    },
    lanes: [
      {
        name: "Codex Desktop",
        role: "coordination authority, branch work, security judgment, final verification",
        boundary: "Do not use ollama launch codex or wrapper-Codex sessions."
      },
      {
        name: "Gemini in Antigravity IDE",
        role: "repo navigation, broad audits, code intelligence",
        boundary: "Advisory output must be verified before merge."
      },
      {
        name: "Claude official app",
        role: "architecture and co-founder review",
        boundary: "No direct repo mutation unless Josh explicitly routes it."
      },
      {
        name: "Hermes",
        role: "synthesis, mission-control summaries, draft handoffs",
        boundary: "No live posting, no destructive actions, no secrets."
      }
    ],
    safetyPolicy: {
      toolMode: "read-only and draft-first",
      allowed: [
        "summarize safe repo docs",
        "prepare Codex execution prompts",
        "draft Slack/Hermes handoffs",
        "report env drift using placeholders only"
      ],
      blocked: [
        "delete files",
        "merge branches",
        "deploy services",
        "change payment rails",
        "read populated .env files",
        "print or test secrets",
        "post to social platforms",
        "run wrapper-Codex through Ollama"
      ]
    },
    safeSources: sources
  };
}

export async function getEnvDriftSummary() {
  const [masterEnv, backendEnv, frontendEnv, driftMap, geminiAudit] = await Promise.all([
    tryRead("masterEnvTemplate"),
    tryRead("backendEnvTemplate"),
    tryRead("frontendEnvTemplate"),
    tryRead("envDriftMap", 12000),
    tryRead("geminiEnvAudit", 12000)
  ]);

  const backendKeys = extractEnvKeys(backendEnv.text);
  const frontendKeys = extractEnvKeys(frontendEnv.text);
  const masterKeys = extractEnvKeys(masterEnv.text);

  const rateLimitKeys = backendKeys.filter((key) => key.includes("RATE_LIMIT"));
  const knownFindings = [];
  if (
    frontendKeys.some((key) => key.startsWith("NEXT_PUBLIC_SQUARE_")) &&
    !frontendKeys.some((key) => key.startsWith("NEXT_PUBLIC_SQUARE_LINK_"))
  ) {
    knownFindings.push({
      severity: "needs-review",
      finding:
        "Frontend env template may use NEXT_PUBLIC_SQUARE_*_PAYMENT_LINK names while current frontend code historically used NEXT_PUBLIC_SQUARE_LINK_* names.",
      action: "Verify constants before deleting root env drift files."
    });
  }

  if (masterEnv.error) {
    knownFindings.push({
      severity: "warning",
      finding: "Master Codex orchestrator env template was not found or could not be read.",
      action: "Create a placeholder-only master env map before deleting drift env files."
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    policy: "placeholder-only inventory; never read populated env files",
    sourceFiles: {
      masterEnvTemplate: SAFE_SOURCE_FILES.masterEnvTemplate,
      backendEnvTemplate: SAFE_SOURCE_FILES.backendEnvTemplate,
      frontendEnvTemplate: SAFE_SOURCE_FILES.frontendEnvTemplate,
      envDriftMap: SAFE_SOURCE_FILES.envDriftMap,
      geminiEnvAudit: SAFE_SOURCE_FILES.geminiEnvAudit
    },
    counts: {
      masterKeys: masterKeys.length,
      backendKeys: backendKeys.length,
      frontendKeys: frontendKeys.length,
      rateLimitKeys: rateLimitKeys.length
    },
    rateLimitKeys,
    knownFindings,
    nextActions: [
      "Josh migrates any real values from root drift files into the secure vault.",
      "Codex verifies placeholder names against code references.",
      "Only after replacement is confirmed, delete stale populated env drift files manually or through a reviewed cleanup PR."
    ],
    evidenceAvailable: {
      masterEnvTemplate: !masterEnv.error,
      envDriftMap: !driftMap.error,
      geminiEnvAudit: !geminiAudit.error
    }
  };
}

export function prepareCodexExecutionPrompt({ task = "continue ANTIGRAVITY mission setup" } = {}) {
  const safeTask = String(task).slice(0, 700).replace(SECRET_PATTERN, "[redacted-secret-pattern]");
  return {
    title: "Safe Codex Execution Prompt",
    prompt: `ANTIGRAVITY execution request\n\nUse repo root ${WINDOWS_ROOT} on Windows and ${WSL_ROOT} in WSL. Preserve lowercase root doctrine.\n\nTask:\n${safeTask}\n\nRules:\n- Real Codex Desktop is the executor. Do not use ollama launch codex.\n- Do not read, print, test, or copy populated secrets.\n- Do not touch unrelated untracked files.\n- Keep DAO/token/fundraising and restricted public-impact language out of customer-facing surfaces.\n- Use branch-first work, run verification, and report exact files changed.\n- For Slack/Hermes/social outputs, draft only unless Josh explicitly asks to send live.\n`
  };
}

export function draftHandoff({ topic = "mission-control app status" } = {}) {
  const safeTopic = String(topic).slice(0, 160).replace(SECRET_PATTERN, "[redacted-secret-pattern]");
  return {
    title: "Draft Team Handoff",
    text: `ANTIGRAVITY handoff\n\nTopic: ${safeTopic}\n\nSource of truth:\n- Windows root: ${WINDOWS_ROOT}\n- WSL root: ${WSL_ROOT}\n- Repo: Trollz1004/ANTIGRAVITY\n\nCurrent lane policy:\n- Codex Desktop coordinates implementation and final verification.\n- Gemini handles broad repo navigation/audit help.\n- Claude official app handles architecture review.\n- Hermes synthesizes and drafts updates.\n\nSafety boundary:\n- This handoff is draft-only.\n- No secrets, payment changes, deployments, branch merges, social posting, or file deletion are authorized by this app.\n`
  };
}

export function toolCatalog() {
  return [
    {
      name: "get_mission_status",
      description: "Return current ANTIGRAVITY lane doctrine, safe source status, and app safety boundaries.",
      readOnlyHint: true,
      destructive: false
    },
    {
      name: "read_env_drift_map",
      description: "Summarize placeholder-only env inventory and drift evidence without reading populated env files.",
      readOnlyHint: true,
      destructive: false
    },
    {
      name: "prepare_codex_execution_prompt",
      description: "Draft a safe prompt for real Codex Desktop to execute a mission task.",
      readOnlyHint: true,
      destructive: false
    },
    {
      name: "draft_handoff",
      description: "Draft a Slack/Hermes-ready handoff without sending it.",
      readOnlyHint: true,
      destructive: false
    }
  ];
}

export async function runTool(name, input = {}) {
  switch (name) {
    case "get_mission_status":
      return getMissionStatus();
    case "read_env_drift_map":
      return getEnvDriftSummary();
    case "prepare_codex_execution_prompt":
      return prepareCodexExecutionPrompt(input);
    case "draft_handoff":
      return draftHandoff(input);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
