#!/usr/bin/env node
"use strict";

/**
 * CodeX Task Sentry (Node)
 * ------------------------
 * Persistent queue dispatcher for Sabretooth:
 * - Task queue lifecycle in JSON
 * - Dispatch to codex/openclaw/ollama
 * - Auto-spawn follow-up tasks
 * - Export runtime TASK-QUEUE-100.md snapshot
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const { spawnSync } = require("child_process");

const SCRIPT_DIR = __dirname;
const PROJECT_DIR = path.resolve(SCRIPT_DIR, "..");
const DATA_DIR = path.join(PROJECT_DIR, "data");
const LOGS_DIR = path.join(PROJECT_DIR, "CodeX", "logs");

const DEFAULTS = {
  queueFile: path.join(DATA_DIR, "codex-task-queue.json"),
  stateFile: path.join(DATA_DIR, "codex-task-sentry-state.json"),
  markdownFile: path.join(PROJECT_DIR, "CodeX", "state", "runtime", "TASK-QUEUE-100.md"),
  openclawUrl: process.env.OPENCLAW_URL || "http://127.0.0.1:3200",
  ollamaUrl: process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
  ollamaModel: process.env.OLLAMA_MODEL || "qwen2.5:7b",
  intervalMinutes: 5,
  maxResultChars: 4000,
  fallbackChainRaw: process.env.CODEX_SENTRY_FALLBACK_CHAIN || "ollama,codex",
  allowCodexFallback: process.env.CODEX_SENTRY_ALLOW_CODEX_FALLBACK !== "0",
};

const VALID_STATUSES = new Set(["pending", "in_progress", "done", "failed"]);
const VALID_EXECUTORS = new Set(["codex", "openclaw", "ollama"]);

function utcNow() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function safeTruncate(text, maxChars) {
  if (typeof text !== "string") {
    text = String(text ?? "");
  }
  if (text.length <= maxChars) {
    return text;
  }
  return text.slice(0, Math.max(0, maxChars - 3)) + "...";
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath, fallbackValue) {
  try {
    if (!fs.existsSync(filePath)) {
      return fallbackValue;
    }
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallbackValue;
  }
}

function writeJson(filePath, payload) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

function defaultQueue() {
  return {
    version: "1.0",
    updated_at: utcNow(),
    tasks: [],
  };
}

function normalizeTask(task) {
  const now = utcNow();
  const normalized = Object.assign({}, task);
  normalized.id = normalized.id || `task-${Date.now()}`;
  normalized.title = normalized.title || normalized.id;
  normalized.description = normalized.description || "";
  normalized.executor = normalized.executor || "codex";
  normalized.priority = Number.isFinite(Number(normalized.priority)) ? Number(normalized.priority) : 50;
  normalized.status = normalized.status || "pending";
  normalized.retries = Number.isFinite(Number(normalized.retries)) ? Number(normalized.retries) : 0;
  normalized.max_retries = Number.isFinite(Number(normalized.max_retries)) ? Number(normalized.max_retries) : 2;
  normalized.tags = Array.isArray(normalized.tags) ? normalized.tags : [];
  normalized.created_at = normalized.created_at || now;
  normalized.updated_at = normalized.updated_at || now;
  normalized.spawn_on_done = Array.isArray(normalized.spawn_on_done) ? normalized.spawn_on_done : [];
  normalized.prompt = normalized.prompt || normalized.description || normalized.title;
  if (!VALID_STATUSES.has(normalized.status)) {
    normalized.status = "pending";
  }
  return normalized;
}

function loadQueue(queueFile) {
  const queue = readJson(queueFile, defaultQueue());
  const tasks = Array.isArray(queue.tasks) ? queue.tasks : [];
  queue.version = queue.version || "1.0";
  queue.updated_at = queue.updated_at || utcNow();
  queue.tasks = tasks.filter((t) => t && typeof t === "object").map(normalizeTask);
  return queue;
}

function saveQueue(queueFile, queue) {
  queue.updated_at = utcNow();
  writeJson(queueFile, queue);
}

function queueCounts(queue) {
  const counts = { pending: 0, in_progress: 0, done: 0, failed: 0 };
  for (const task of queue.tasks || []) {
    if (counts[task.status] !== undefined) {
      counts[task.status] += 1;
    }
  }
  return counts;
}

function taskExists(queue, taskId) {
  return (queue.tasks || []).some((task) => task.id === taskId);
}

function renderTemplateString(value, context) {
  return value.replace(/\{([^{}]+)\}/g, (_match, key) => {
    return Object.prototype.hasOwnProperty.call(context, key) ? context[key] : `{${key}}`;
  });
}

function renderTemplates(value, context) {
  if (typeof value === "string") {
    return renderTemplateString(value, context);
  }
  if (Array.isArray(value)) {
    return value.map((item) => renderTemplates(item, context));
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = renderTemplates(v, context);
    }
    return out;
  }
  return value;
}

function appendTask(queue, task) {
  const normalized = normalizeTask(task);
  if (taskExists(queue, normalized.id)) {
    return false;
  }
  queue.tasks.push(normalized);
  queue.updated_at = utcNow();
  return true;
}

function dayToken() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function seedEwasteTasks(queue) {
  const day = dayToken();
  const seedTasks = [
    {
      id: `EW-INTAKE-${day}`,
      title: "Create e-waste intake and triage sheet for inbound PCs/servers/laptops",
      description: "Build reusable templates for inventory, grading, testing, and value estimates.",
      executor: "codex",
      priority: 100,
      tags: ["ewaste", "intake", "ebay", "cashflow"],
      prompt:
        "In E:/ANTIGRAVITY, set up an operational intake workflow for inbound e-waste devices (PCs, servers, laptops). " +
        "Create practical templates under data/ or briefings/ for inventory intake, condition grading, testing status, " +
        "estimated resale value, and ebay listing readiness. Keep it revenue-first, #ForTheKids compliant, and ready for fast resale.",
      spawn_on_done: [
        {
          id: `EW-LISTINGS-${day}`,
          title: "Generate eBay listing templates with mission-safe messaging",
          description: "Prepare title/description templates for desktop, laptop, and server listings.",
          executor: "ollama",
          priority: 95,
          tags: ["ewaste", "ebay", "copy"],
          prompt:
            "Create high-converting but policy-safe ebay listing templates for inbound desktops, laptops, and servers. " +
            "Include concise title patterns, honest condition language, shipping notes, and a short #ForTheKids impact line.",
          spawn_on_done: [
            {
              id: `EW-OUTREACH-${day}`,
              title: "Create business outreach messages to source more e-waste inventory",
              description: "Write outreach templates for businesses, schools, and community groups.",
              executor: "ollama",
              priority: 75,
              tags: ["ewaste", "outreach", "inventory"],
              prompt:
                "Write concise outreach templates to source surplus e-waste from businesses and schools. " +
                "Tone must be transparent, respectful, local, and focused on fast intake plus #ForTheKids impact without donation language.",
            },
            {
              id: `EW-RESPONSES-${day}`,
              title: "Draft OnlineRecycle intake reply templates",
              description: "Prepare concise responses for drop-off, pickup, and bulk inventory leads.",
              executor: "ollama",
              priority: 78,
              tags: ["ewaste", "responses", "onlinerecycle"],
              prompt:
                "Draft concise email reply templates for OnlineRecycle.org intake leads: drop-off confirmation, pickup lead confirmation, business bulk inventory response, scheduling follow-up, and decline/unsupported items. " +
                "Keep them direct, respectful, local to Central Florida, and free of donation language. Mention Square booking only where useful.",
            },
          ],
        },
        {
          id: `EW-QA-${day}`,
          title: "Generate testing + photo checklist before eBay publishing",
          description: "Standardize pre-listing QA and photo capture.",
          executor: "ollama",
          priority: 90,
          tags: ["ewaste", "qa", "ebay"],
          prompt:
            "Generate a practical checklist for testing inbound PCs/servers/laptops before resale, plus a photo shot-list " +
            "that improves buyer trust on ebay.",
        },
        {
          id: `EW-LEDGER-${day}`,
          title: "Build impact ledger for sold e-waste items",
          description: "Map sold items to impact and contractual revenue disbursement records.",
          executor: "codex",
          priority: 92,
          tags: ["ewaste", "impact", "ledger"],
          prompt:
            "Set up an impact ledger format in this repo that maps sold ebay items to #ForTheKids impact and contractual revenue disbursement evidence. " +
            "Keep fields practical for weekly reporting and auditing.",
          spawn_on_done: [
            {
              id: `EW-WEEKLY-REPORT-${day}`,
              title: "Draft weekly impact report template for internal review and supporters",
              description: "Summarize inbound inventory, sales, net proceeds, and impact outcomes.",
              executor: "codex",
              priority: 70,
              tags: ["ewaste", "reporting", "impact"],
              prompt:
                "Create a weekly report template summarizing inbound inventory, sold items, gross revenue, net proceeds, and #ForTheKids impact for OnlineRecycle.",
            },
          ],
        },
      ],
    },
  ];

  let added = 0;
  for (const task of seedTasks) {
    if (appendTask(queue, task)) {
      added += 1;
    }
  }
  return added;
}

function selectNextTask(queue) {
  const pending = (queue.tasks || []).filter((task) => task.status === "pending");
  if (pending.length === 0) {
    return null;
  }
  pending.sort((a, b) => {
    const p = Number(b.priority || 50) - Number(a.priority || 50);
    if (p !== 0) {
      return p;
    }
    const c = String(a.created_at || "").localeCompare(String(b.created_at || ""));
    if (c !== 0) {
      return c;
    }
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
  return pending[0];
}

function httpJson(urlString, payload, timeoutMs) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlString);
    const isHttps = parsed.protocol === "https:";
    const transport = isHttps ? https : http;
    const body = JSON.stringify(payload);

    const req = transport.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: `${parsed.pathname}${parsed.search}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        timeout: timeoutMs,
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          const status = Number(res.statusCode || 0);
          if (status < 200 || status >= 300) {
            const err = new Error(`HTTP ${status}: ${safeTruncate(data, 800)}`);
            err.statusCode = status;
            reject(err);
            return;
          }
          try {
            resolve(data.trim() ? JSON.parse(data) : {});
          } catch (parseError) {
            reject(new Error(`Invalid JSON response: ${parseError.message}`));
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
    });
    req.on("error", (err) => reject(err));
    req.write(body);
    req.end();
  });
}

function runCodexTask(task, maxResultChars) {
  const prompt = String(task.prompt || "").trim();
  if (!prompt) {
    return { ok: false, result: "Task has no prompt." };
  }

  const model = String(task.model || "").trim();
  const timeoutSeconds = Number(task.timeout_seconds || 1800);
  const timeoutMs = Math.max(1, timeoutSeconds) * 1000;

  const safeTaskId = String(task.id || "task").replace(/[^a-zA-Z0-9_-]/g, "_");
  const outputFile = path.join(DATA_DIR, `codex-task-output-${safeTaskId}-${Date.now()}.txt`);

  const fullAccessByDefault = process.env.CODEX_SENTRY_FULL_ACCESS !== "0";
  const useFullAccess =
    task.dangerously_bypass === undefined ? fullAccessByDefault : Boolean(task.dangerously_bypass);

  const args = [];
  if (useFullAccess) {
    args.push("--dangerously-bypass-approvals-and-sandbox");
  } else {
    args.push("--ask-for-approval", "never");
  }
  if (model) {
    args.push("--model", model);
  }
  if (task.web_search === true) {
    args.push("--search");
  }
  args.push(
    "exec",
    "--cd",
    PROJECT_DIR,
    "--sandbox",
    "workspace-write",
    "--skip-git-repo-check",
    "--output-last-message",
    outputFile,
    prompt
  );

  const argsFile = path.join(DATA_DIR, `codex-task-args-${safeTaskId}-${Date.now()}.json`);
  const runnerFile = path.join(DATA_DIR, `codex-task-runner-${safeTaskId}-${Date.now()}.ps1`);
  writeJson(argsFile, args);

  const escapedArgsPath = argsFile.replace(/'/g, "''");
  const runnerScript =
    "$ErrorActionPreference = 'Stop'\n" +
    `$argsList = Get-Content -Raw -LiteralPath '${escapedArgsPath}' | ConvertFrom-Json\n` +
    "& codex @argsList\n" +
    "exit $LASTEXITCODE\n";
  fs.writeFileSync(runnerFile, runnerScript, "utf8");

  let result;
  try {
    result = spawnSync("pwsh.exe", ["-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", runnerFile], {
      cwd: PROJECT_DIR,
      encoding: "utf8",
      timeout: timeoutMs,
      maxBuffer: 12 * 1024 * 1024,
    });
  } catch (err) {
    return { ok: false, result: `codex exec failed: ${err.message}` };
  } finally {
    try {
      fs.unlinkSync(runnerFile);
    } catch {}
    try {
      fs.unlinkSync(argsFile);
    } catch {}
  }

  if (result.error) {
    if (result.error.code === "ENOENT") {
      return { ok: false, result: "codex CLI not found in PATH." };
    }
    if (result.error.code === "ETIMEDOUT") {
      return { ok: false, result: `codex exec timed out after ${timeoutSeconds} seconds.` };
    }
    return { ok: false, result: `codex exec error: ${result.error.message}` };
  }

  let lastMessage = "";
  try {
    if (fs.existsSync(outputFile)) {
      lastMessage = fs.readFileSync(outputFile, "utf8").trim();
    }
  } catch {
    lastMessage = "";
  }

  const stdoutText = result.stdout ? safeTruncate(String(result.stdout).trim(), 1200) : "";
  const stderrText = result.stderr ? safeTruncate(String(result.stderr).trim(), 1200) : "";
  const parts = [];
  if (lastMessage) {
    parts.push(lastMessage);
  }
  if (stdoutText) {
    parts.push(`[stdout]\n${stdoutText}`);
  }
  if (stderrText) {
    parts.push(`[stderr]\n${stderrText}`);
  }
  if (parts.length === 0) {
    parts.push(`codex exit code: ${result.status}`);
  }

  const combined = safeTruncate(parts.join("\n\n"), maxResultChars);
  const lower = combined.toLowerCase();
  const writeBlocked =
    lower.includes("workspace is read-only") ||
    lower.includes("policy-blocked") ||
    lower.includes("couldn't write files") ||
    lower.includes("could not write files") ||
    lower.includes("i couldn’t write files");

  if (result.status === 0 && writeBlocked) {
    return { ok: false, result: `Codex reported write-blocked execution.\n\n${combined}` };
  }

  return { ok: result.status === 0, result: combined };
}

async function runOpenClawTask(task, openclawUrl, maxResultChars) {
  const prompt = String(task.prompt || "").trim();
  if (!prompt) {
    return { ok: false, result: "Task has no prompt." };
  }
  const timeoutSeconds = Number(task.timeout_seconds || 60);
  const endpoint = `${openclawUrl.replace(/\/+$/, "")}/chat`;
  const payload = { sessionId: `sentry-${task.id}`, message: prompt };

  try {
    const response = await httpJson(endpoint, payload, Math.max(1, timeoutSeconds) * 1000);
    const message = String(response.response || "").trim();
    if (!message) {
      return { ok: false, result: `OpenClaw response missing 'response' field: ${JSON.stringify(response)}` };
    }
    return { ok: true, result: safeTruncate(message, maxResultChars) };
  } catch (err) {
    return { ok: false, result: `OpenClaw request failed: ${err.message}` };
  }
}

async function runOllamaTask(task, ollamaUrl, maxResultChars) {
  const prompt = String(task.prompt || "").trim();
  if (!prompt) {
    return { ok: false, result: "Task has no prompt." };
  }
  const timeoutSeconds = Number(task.timeout_seconds || 90);
  const model = String(task.model || DEFAULTS.ollamaModel).trim() || DEFAULTS.ollamaModel;
  const endpoint = `${ollamaUrl.replace(/\/+$/, "")}/api/generate`;
  const payload = { model, prompt, stream: false };

  try {
    const response = await httpJson(endpoint, payload, Math.max(1, timeoutSeconds) * 1000);
    const message = String(response.response || "").trim();
    if (!message) {
      return { ok: false, result: `Ollama response missing 'response' field: ${JSON.stringify(response)}` };
    }
    return { ok: true, result: safeTruncate(message, maxResultChars) };
  } catch (err) {
    return { ok: false, result: `Ollama request failed: ${err.message}` };
  }
}

async function dispatchTask(task, forceExecutor, openclawUrl, ollamaUrl, maxResultChars) {
  const executor = String(forceExecutor || task.executor || "codex").toLowerCase().trim();
  if (executor === "codex") {
    const out = runCodexTask(task, maxResultChars);
    return { ok: out.ok, result: out.result, executor };
  }
  if (executor === "openclaw") {
    const out = await runOpenClawTask(task, openclawUrl, maxResultChars);
    return { ok: out.ok, result: out.result, executor };
  }
  if (executor === "ollama") {
    const out = await runOllamaTask(task, ollamaUrl, maxResultChars);
    return { ok: out.ok, result: out.result, executor };
  }
  return { ok: false, result: `Unknown executor '${executor}'.`, executor };
}

function buildFallbackChain(raw, allowCodexFallback, strict) {
  if (raw === null || raw === undefined) {
    return [];
  }
  const value = String(raw).trim().toLowerCase();
  if (!value || value === "none") {
    return [];
  }

  const items = value
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  const chain = [];
  for (const item of items) {
    if (!VALID_EXECUTORS.has(item)) {
      if (strict) {
        throw new Error(`Unknown fallback executor '${item}'. Valid: codex, openclaw, ollama`);
      }
      continue;
    }
    if (item === "codex" && !allowCodexFallback) {
      continue;
    }
    if (!chain.includes(item)) {
      chain.push(item);
    }
  }
  return chain;
}

function spawnFollowups(task, queue) {
  if (!Array.isArray(task.spawn_on_done) || task.spawn_on_done.length === 0) {
    return 0;
  }
  const today = new Date().toISOString().slice(0, 10);
  const context = {
    date: dayToken(),
    today,
    parent_id: String(task.id || ""),
    parent_title: String(task.title || ""),
  };
  let added = 0;
  for (const candidate of task.spawn_on_done) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }
    const rendered = renderTemplates(candidate, context);
    if (appendTask(queue, rendered)) {
      added += 1;
    }
  }
  return added;
}

function exportMarkdown(queue, markdownFile) {
  const groups = {
    pending: [],
    in_progress: [],
    done: [],
    failed: [],
  };
  for (const task of queue.tasks || []) {
    const status = task.status || "pending";
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(task);
  }

  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => {
      const p = Number(b.priority || 50) - Number(a.priority || 50);
      if (p !== 0) {
        return p;
      }
      const c = String(a.created_at || "").localeCompare(String(b.created_at || ""));
      if (c !== 0) {
        return c;
      }
      return String(a.id || "").localeCompare(String(b.id || ""));
    });
  }

  const counts = queueCounts(queue);
  const lines = [
    "# TASK QUEUE 100",
    "",
    `Generated: ${utcNow()}`,
    "",
    "## Summary",
    "",
    `- Pending: ${counts.pending}`,
    `- In Progress: ${counts.in_progress}`,
    `- Done: ${counts.done}`,
    `- Failed: ${counts.failed}`,
    "",
  ];

  const sections = [
    ["Pending", "pending", "[ ]"],
    ["In Progress", "in_progress", "[~]"],
    ["Done", "done", "[x]"],
    ["Failed", "failed", "[!]"],
  ];

  for (const [label, status, marker] of sections) {
    lines.push(`## ${label}`);
    lines.push("");
    const items = groups[status] || [];
    if (items.length === 0) {
      lines.push("- (none)");
      lines.push("");
      continue;
    }
    for (const task of items) {
      lines.push(
        `- ${marker} \`${task.id}\` ${task.title} | executor=${task.executor} priority=${task.priority} retries=${task.retries} updated=${task.updated_at}`
      );
    }
    lines.push("");
  }

  ensureDir(path.dirname(markdownFile));
  fs.writeFileSync(markdownFile, lines.join("\n").trim() + "\n", "utf8");
}

function writeState(stateFile, queue, lastTaskId, lastTaskStatus, lastError) {
  const state = {
    updated_at: utcNow(),
    last_task_id: lastTaskId,
    last_task_status: lastTaskStatus,
    last_error: lastError,
    counts: queueCounts(queue),
  };
  writeJson(stateFile, state);
}

function printStatus(queue) {
  const counts = queueCounts(queue);
  const nextTask = selectNextTask(queue);
  console.log("CODEX TASK SENTRY STATUS");
  console.log("========================");
  console.log(`Pending     : ${counts.pending}`);
  console.log(`In Progress : ${counts.in_progress}`);
  console.log(`Done        : ${counts.done}`);
  console.log(`Failed      : ${counts.failed}`);
  console.log("");
  if (!nextTask) {
    console.log("Next Task   : none");
    return;
  }
  console.log(`Next Task   : ${nextTask.id} (${nextTask.executor})`);
  console.log(`Title       : ${nextTask.title}`);
}

function createLogger(logFile) {
  ensureDir(path.dirname(logFile));
  const append = (level, msg) => {
    const line = `${new Date().toISOString()} [SENTRY] ${level.padEnd(5)} ${msg}`;
    fs.appendFileSync(logFile, `${line}\n`, "utf8");
    console.log(line);
  };
  return {
    info: (msg) => append("INFO", msg),
    warn: (msg) => append("WARN", msg),
    error: (msg) => append("ERROR", msg),
  };
}

async function runOneCycle(options, logger) {
  const queue = loadQueue(options.queueFile);
  const nextTask = selectNextTask(queue);

  if (!nextTask) {
    logger.info("No pending tasks.");
    writeState(options.stateFile, queue, null, "idle", null);
    if (options.exportMarkdown) {
      exportMarkdown(queue, options.markdownFile);
    }
    return false;
  }

  const taskId = String(nextTask.id);
  logger.info(`Dispatching task: ${taskId}`);
  nextTask.status = "in_progress";
  nextTask.started_at = utcNow();
  nextTask.updated_at = utcNow();
  saveQueue(options.queueFile, queue);

  let dispatch = await dispatchTask(
    nextTask,
    options.forceExecutor,
    options.openclawUrl,
    options.ollamaUrl,
    options.maxResultChars
  );

  if (!dispatch.ok && Array.isArray(options.fallbackChain) && options.fallbackChain.length > 0) {
    const attempts = [dispatch];
    for (const fallbackExec of options.fallbackChain) {
      if (!fallbackExec) {
        continue;
      }
      if (attempts.some((a) => a.executor === fallbackExec)) {
        continue;
      }
      logger.warn(`Executor '${attempts[attempts.length - 1].executor}' failed for ${taskId}; trying '${fallbackExec}'.`);
      const fallbackAttempt = await dispatchTask(
        nextTask,
        fallbackExec,
        options.openclawUrl,
        options.ollamaUrl,
        options.maxResultChars
      );
      attempts.push(fallbackAttempt);
      if (fallbackAttempt.ok) {
        break;
      }
    }

    const successful = attempts.find((a) => a.ok);
    if (successful) {
      dispatch = {
        ok: true,
        executor: attempts.map((a) => a.executor).join("->"),
        result: attempts.length > 1 ? `[fallback via ${successful.executor}]\n${successful.result}` : successful.result,
      };
    } else if (attempts.length > 1) {
      dispatch = {
        ok: false,
        executor: attempts.map((a) => a.executor).join("->"),
        result: attempts.map((a, idx) => `Attempt ${idx + 1} (${a.executor}) failed: ${a.result}`).join("\n\n"),
      };
    }
  }

  nextTask.executor_used = dispatch.executor;
  nextTask.updated_at = utcNow();

  if (dispatch.ok) {
    nextTask.status = "done";
    nextTask.completed_at = utcNow();
    nextTask.last_result = dispatch.result;
    delete nextTask.last_error;
    const added = spawnFollowups(nextTask, queue);
    logger.info(`Task complete: ${taskId} (followups added: ${added})`);
    writeState(options.stateFile, queue, taskId, "done", null);
  } else {
    nextTask.retries = Number(nextTask.retries || 0) + 1;
    const maxRetries = Number(nextTask.max_retries || 2);
    nextTask.last_error = dispatch.result;
    nextTask.last_result = dispatch.result;
    if (nextTask.retries > maxRetries) {
      nextTask.status = "failed";
      logger.error(`Task failed permanently: ${taskId} | ${dispatch.result}`);
      writeState(options.stateFile, queue, taskId, "failed", dispatch.result);
    } else {
      nextTask.status = "pending";
      logger.warn(`Task failed (will retry): ${taskId} retry=${nextTask.retries}/${maxRetries} | ${dispatch.result}`);
      writeState(options.stateFile, queue, taskId, "retrying", dispatch.result);
    }
  }

  saveQueue(options.queueFile, queue);
  if (options.exportMarkdown) {
    exportMarkdown(queue, options.markdownFile);
  }
  return true;
}

function parseArgs(argv) {
  const opts = Object.assign({}, DEFAULTS, {
    initEwaste: false,
    status: false,
    runOnce: false,
    loop: false,
    exportMarkdown: false,
    forceExecutor: null,
    fallbackExecutor: null, // legacy single-fallback option
    fallbackChainRaw: DEFAULTS.fallbackChainRaw,
    fallbackChain: [],
    noCodexFallback: false,
  });

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--queue-file" && next) {
      opts.queueFile = path.resolve(next);
      i += 1;
      continue;
    }
    if (arg === "--state-file" && next) {
      opts.stateFile = path.resolve(next);
      i += 1;
      continue;
    }
    if (arg === "--markdown-file" && next) {
      opts.markdownFile = path.resolve(next);
      i += 1;
      continue;
    }
    if (arg === "--openclaw-url" && next) {
      opts.openclawUrl = next;
      i += 1;
      continue;
    }
    if (arg === "--ollama-url" && next) {
      opts.ollamaUrl = next;
      i += 1;
      continue;
    }
    if (arg === "--force-executor" && next) {
      opts.forceExecutor = next.toLowerCase();
      i += 1;
      continue;
    }
    if (arg === "--fallback-executor" && next) {
      opts.fallbackExecutor = next.toLowerCase();
      i += 1;
      continue;
    }
    if (arg === "--fallback-chain" && next) {
      opts.fallbackChainRaw = next;
      i += 1;
      continue;
    }
    if (arg === "--no-codex-fallback") {
      opts.noCodexFallback = true;
      continue;
    }
    if (arg === "--interval-minutes" && next) {
      opts.intervalMinutes = Number(next);
      i += 1;
      continue;
    }
    if (arg === "--max-result-chars" && next) {
      opts.maxResultChars = Number(next);
      i += 1;
      continue;
    }
    if (arg === "--init-ewaste") {
      opts.initEwaste = true;
      continue;
    }
    if (arg === "--status") {
      opts.status = true;
      continue;
    }
    if (arg === "--run-once") {
      opts.runOnce = true;
      continue;
    }
    if (arg === "--loop") {
      opts.loop = true;
      continue;
    }
    if (arg === "--export-markdown") {
      opts.exportMarkdown = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (!["codex", "openclaw", "ollama", null].includes(opts.forceExecutor)) {
    throw new Error("--force-executor must be one of: codex, openclaw, ollama");
  }
  if (opts.fallbackExecutor !== null && !["codex", "openclaw", "ollama", "none"].includes(opts.fallbackExecutor)) {
    throw new Error("--fallback-executor must be one of: codex, openclaw, ollama, none");
  }

  const allowCodexFallback = DEFAULTS.allowCodexFallback && !opts.noCodexFallback;
  if (opts.fallbackExecutor && opts.fallbackExecutor !== "none") {
    opts.fallbackChain = buildFallbackChain(opts.fallbackExecutor, allowCodexFallback, true);
  } else if (opts.fallbackExecutor === "none") {
    opts.fallbackChain = [];
  } else {
    opts.fallbackChain = buildFallbackChain(opts.fallbackChainRaw, allowCodexFallback, false);
  }

  if (!Number.isFinite(opts.intervalMinutes) || opts.intervalMinutes <= 0) {
    opts.intervalMinutes = DEFAULTS.intervalMinutes;
  }
  if (!Number.isFinite(opts.maxResultChars) || opts.maxResultChars <= 100) {
    opts.maxResultChars = DEFAULTS.maxResultChars;
  }

  return opts;
}

function printHelp() {
  console.log("CodeX Task Sentry (Node)");
  console.log("");
  console.log("Usage:");
  console.log("  node scripts/codex-task-sentry.js --init-ewaste --export-markdown");
  console.log("  node scripts/codex-task-sentry.js --status");
  console.log("  node scripts/codex-task-sentry.js --run-once --export-markdown");
  console.log("  node scripts/codex-task-sentry.js --run-once --fallback-chain ollama,codex");
  console.log("  node scripts/codex-task-sentry.js --run-once --fallback-chain ollama --no-codex-fallback");
  console.log("  node scripts/codex-task-sentry.js --loop --interval-minutes 5 --export-markdown");
}

async function main() {
  ensureDir(DATA_DIR);
  ensureDir(LOGS_DIR);
  const options = parseArgs(process.argv.slice(2));
  const logger = createLogger(path.join(LOGS_DIR, "codex-task-sentry.log"));

  logger.info("CodeX Task Sentry started.");

  let queue = loadQueue(options.queueFile);
  let changed = false;

  if (options.initEwaste) {
    const added = seedEwasteTasks(queue);
    changed = changed || added > 0;
    logger.info(`Seeded e-waste tasks: ${added} added`);
  }

  if (changed) {
    saveQueue(options.queueFile, queue);
    queue = loadQueue(options.queueFile);
  }

  if (options.exportMarkdown) {
    exportMarkdown(queue, options.markdownFile);
  }

  if (options.status && !options.runOnce && !options.loop) {
    printStatus(queue);
    return;
  }

  if (options.runOnce) {
    await runOneCycle(options, logger);
    return;
  }

  if (options.loop) {
    const intervalMs = Math.max(30000, Number(options.intervalMinutes) * 60 * 1000);
    logger.info(`Loop mode enabled. Interval: ${intervalMs / 1000}s`);
    for (;;) {
      try {
        await runOneCycle(options, logger);
      } catch (err) {
        logger.error(`Loop cycle error: ${err.message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  printStatus(queue);
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
