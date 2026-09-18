/**
 * Freebuff (Buffy CEO) external adapter for Paperclip.
 *
 * Contract (see @paperclipai/server/dist/adapters/plugin-loader.js):
 *   - package main entry must export createServerAdapter()
 *   - createServerAdapter() returns a ServerAdapterModule ({ type, execute, testEnvironment, ... })
 *
 * Execution model — reuses the proven wake-file bridge, no new transport:
 *   1. execute() writes `<runId>.json` into the wakes dir (same dir the CEO
 *      bridge already uses), with `status: "pending"` so the Freebuff
 *      session lists it. The wake carries the run's prompt/instructions.
 *   2. The Freebuff desktop session picks the wake up, does the work, and
 *      reports completion through the bridge: `POST /wakes/:runId/done`
 *      (or `/fail`). The bridge writes `status: "done" | "failed"` into the
 *      wake file itself (bridge.js handleDone).
 *   3. execute() polls that status field and maps it onto
 *      AdapterExecutionResult. On timeout it reports a failed run honestly —
 *      it never invents a success, and leaves the wake in place so a slow
 *      session can still report without a 404. After a resolved status it
 *      removes its own wake file so the wakes dir does not accumulate (the
 *      bridge never deletes them).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ADAPTER_TYPE = "freebuff_local";
const DEFAULT_TIMEOUT_SEC = 900;
const POLL_INTERVAL_MS = 2000;

const pkgDir = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_WAKES_DIR = path.resolve(pkgDir, "..", "wakes");

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function safeName(runId) {
  return String(runId).replace(/[^A-Za-z0-9._-]/g, "_");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function execute(ctx) {
  const config = ctx.config || {};
  const wakesDir = path.resolve(String(config.wakesDir || DEFAULT_WAKES_DIR));
  const timeoutSec = Number(config.timeoutSec || DEFAULT_TIMEOUT_SEC);
  const runId = safeName(ctx.runId);

  const prompt =
    ctx.context?.prompt ??
    ctx.context?.instructions ??
    ctx.config?.instructionsFilePath ??
    null;
  if (!prompt) {
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      errorMessage: "no prompt/instructions in execution context",
    };
  }

  const wakeFile = path.join(wakesDir, `${runId}.json`);
  fs.mkdirSync(wakesDir, { recursive: true });
  fs.writeFileSync(
    wakeFile,
    JSON.stringify(
      {
        kind: "adapter",
        // `status: "pending"` is required: the Freebuff session only picks up
        // wakes whose status is exactly "pending" (paperclip-ceo skill).
        // The bridge writes "done"/"failed" into this same field when the
        // session POSTs /wakes/:runId/done or /fail — execute() polls for it.
        status: "pending",
        runId: ctx.runId,
        agentId: ctx.agent?.id ?? null,
        agentName: ctx.agent?.name ?? null,
        prompt,
        workspace: ctx.executionTarget?.kind === "local" ? process.cwd() : null,
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    "utf8",
  );
  await ctx.onLog?.("stdout", `[freebuff-adapter] wake written: ${wakeFile}`);

  // Poll the wake file's `status` field: the bridge writes "done"/"failed"
  // when the session POSTs /wakes/:runId/done or /fail. A wake with no
  // status field yet is still pending.
  const deadline = Date.now() + timeoutSec * 1000;
  let outcome = null;
  while (Date.now() < deadline && !outcome) {
    await sleep(POLL_INTERVAL_MS);

    const wake = readJson(wakeFile);
    if (wake?.status === "done") {
      outcome = { ok: true, errorMessage: null, summary: null, resultJson: null };
    } else if (wake?.status === "failed") {
      const err = wake.errorMessage || wake.summary || "freebuff session reported failure";
      outcome = { ok: false, errorMessage: String(err), summary: wake.summary ?? null, resultJson: null };
    }
  }

  // Clean up our own wake once the run is resolved (the bridge never deletes
  // wake files, and every orphaned wake is served by GET /wakes forever). On
  // timeout, leave the wake in place so a slow session can still report
  // through the bridge without a 404.
  if (outcome) {
    try {
      fs.rmSync(wakeFile, { force: true });
    } catch {
      /* best effort */
    }
    return {
      exitCode: outcome.ok ? 0 : 1,
      signal: null,
      timedOut: false,
      errorMessage: outcome.errorMessage,
      summary: outcome.summary,
      resultJson: outcome.resultJson,
    };
  }

  return {
    exitCode: 1,
    signal: null,
    timedOut: true,
    errorMessage: `freebuff session did not complete the wake within ${timeoutSec}s (wake: ${wakeFile})`,
  };
}

async function testEnvironment(ctx) {
  const config = ctx.config || {};
  const wakesDir = path.resolve(String(config.wakesDir || DEFAULT_WAKES_DIR));
  const checks = [];

  let dirOk = true;
  try {
    fs.mkdirSync(wakesDir, { recursive: true });
    fs.accessSync(wakesDir, fs.constants.W_OK);
  } catch (err) {
    dirOk = false;
    checks.push({
      code: "WAKES_DIR",
      level: "error",
      message: `wakes dir not writable: ${wakesDir}`,
      detail: String(err?.message || err),
    });
  }
  if (dirOk) {
    checks.push({
      code: "WAKES_DIR",
      level: "info",
      message: `wakes dir writable: ${wakesDir}`,
    });
  }

  let bridge = null;
  try {
    const res = await fetch("http://127.0.0.1:3140/health", { signal: AbortSignal.timeout(4000) });
    bridge = await res.json();
  } catch {
    /* bridge optional for adapter execution */
  }
  if (bridge?.status === "UP") {
    checks.push({
      code: "BRIDGE",
      level: "info",
      message: `CEO bridge UP (${bridge.service})`,
    });
  } else {
    checks.push({
      code: "BRIDGE",
      level: "warn",
      message: "CEO bridge (:3140) not answering — wake files still work, but bridge-side automation (task top-up, push relay) is down",
    });
  }

  const status = dirOk ? (checks.some((c) => c.level === "warn") ? "warn" : "pass") : "fail";
  return { adapterType: ADAPTER_TYPE, status, checks, testedAt: new Date().toISOString() };
}

function getConfigSchema() {
  return {
    fields: [
      {
        key: "wakesDir",
        label: "Wakes directory",
        type: "string",
        required: false,
        default: DEFAULT_WAKES_DIR,
        description: "Directory the Freebuff session watches for wake files (defaults to the CEO bridge's wakes dir).",
      },
      {
        key: "timeoutSec",
        label: "Run timeout (seconds)",
        type: "number",
        required: false,
        default: DEFAULT_TIMEOUT_SEC,
        description: "How long execute() waits for the Freebuff session to complete the wake (via POST /wakes/:runId/done or /fail) before failing the run.",
      },
    ],
  };
}

export function createServerAdapter() {
  return {
    type: ADAPTER_TYPE,
    label: "Freebuff (Buffy CEO)",
    execute,
    testEnvironment,
    getConfigSchema,
    supportsInstructionsBundle: false,
    models: [{ id: "freebuff-session", label: "Freebuff session (cloud models)" }],
  };
}

export default { createServerAdapter };
