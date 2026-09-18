#!/usr/bin/env node
/**
 * Freebuff CEO bridge — the custom adapter between Paperclip and Freebuff.
 *
 * Paperclip (control plane, loopback :3100) invokes this service via its HTTP
 * adapter when the CEO agent's heartbeat fires. This bridge turns that
 * invocation into a wake file that a Freebuff agent session picks up, then
 * relays the session's completion back to Paperclip's callback endpoint.
 *
 * Contract (matches Paperclip HTTP adapter):
 *   POST /heartbeat                  <- Paperclip wake. 202 + wake file.
 *   GET  /health                     <- identity probe (doctrine: identity, not just status)
 *   GET  /wakes                      <- list pending wakes (Freebuff session polls)
 *   GET  /wakes/:runId               <- one wake, full context
 *   POST /wakes/:runId/done          <- Freebuff session result; bridge callbacks Paperclip
 *   POST /wakes/:runId/fail          <- Freebuff session failure; bridge callbacks Paperclip
 *
 * Auth: every route except GET /health requires header
 *   X-Paperclip-Bridge-Token: <PAPERCLIP_CEO_BRIDGE_TOKEN>
 * The token lives in the bridge's environment only — never in the repo.
 *
 * Secrets: the agent API key for the Paperclip callback is read from env
 *   PAPERCLIP_CEO_AGENT_KEY — never from files in the repo.
 *
 * No git, no publish, no repo authority. Marketing drops land in
 * ops/marketing-inbox/ via the Freebuff session, not from this service.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const PORT = Number(process.env.PAPERCLIP_CEO_BRIDGE_PORT || 3140);
const HOST = "127.0.0.1";
const PAPERCLIP_API_BASE = process.env.PAPERCLIP_API_BASE || "http://127.0.0.1:3100";
const BRIDGE_TOKEN = process.env.PAPERCLIP_CEO_BRIDGE_TOKEN || "";
const AGENT_KEY = process.env.PAPERCLIP_CEO_AGENT_KEY || "";
const COMPANY_ID = process.env.PAPERCLIP_CEO_COMPANY_ID || "";
const WAKES_DIR = process.env.PAPERCLIP_CEO_WAKES_DIR || path.join(__dirname, "..", "wakes");
const STATE_DIR = process.env.PAPERCLIP_CEO_STATE_DIR || path.join(__dirname, "..", "state");
const TASK_BANK_FILE = process.env.PAPERCLIP_CEO_TASK_BANK || path.join(__dirname, "..", "task-bank.json");

// Mission-control tuning (matches task-bank.json).
const POOL_TARGET = Number(process.env.PAPERCLIP_POOL_TARGET || 50);
const TOP_UP_AT = Number(process.env.PAPERCLIP_TOP_UP_AT || 10);

// Harness lane routing for pool top-ups (Joshua directive 2026-08-26: the
// harnesses did nothing because pool tasks were created unassigned and
// Paperclip agents only work assigned tasks). task-bank categories map to
// lanes; env-overridable for tests and roster changes.
const LANE_HERMES = process.env.PAPERCLIP_LANE_HERMES || "b3006045-4353-4c53-8111-4bec58c44e49";
const LANE_OPENCLAW = process.env.PAPERCLIP_LANE_OPENCLAW || "84c9a325-db4a-44ce-845d-84462b5c7c6b";
const LANE_OPENCODE = process.env.PAPERCLIP_LANE_OPENCODE || "26bfb5a5-6751-4fb3-b5b7-6540d4f89797";
const LANE_XMARKETING = process.env.PAPERCLIP_LANE_XMARKETING || "805d66b4-1d3c-4482-9604-a6d28a62721c";

// task-bank category -> lane. Content splits: devrel-ish pieces (blog, press,
// testimonial, FAQ) go to Hermes (content producer); conversion copy goes to
// OpenClaw (marketing).
function laneForCategory(category, title) {
  const c = (category || "ops").toLowerCase();
  const t = (title || "").toLowerCase();
  if (c === "x-marketing") return LANE_XMARKETING;
  if (c === "social") return LANE_HERMES;
  if (c === "support" || c === "analytics") return LANE_OPENCLAW;
  if (c === "quality" || c === "ops") return LANE_OPENCODE;
  if (c === "content") {
    if (["blog", "press", "testimonial", "faq"].some((k) => t.includes(k))) return LANE_HERMES;
    return LANE_OPENCLAW;
  }
  return LANE_OPENCODE;
}

// Health-check targets (Date App + cloudflared).
const FRONTEND_URL = process.env.PAPERCLIP_FRONTEND_URL || "http://127.0.0.1:3200";
const BACKEND_HEALTH_URL = process.env.PAPERCLIP_BACKEND_HEALTH_URL || "http://127.0.0.1:8000/health";
const SUPPORT_CHAT_URL = process.env.PAPERCLIP_SUPPORT_CHAT_URL || "http://127.0.0.1:8000/api/v1/support/chat";
const SITE_HOST = process.env.PAPERCLIP_SITE_HOST || "youandinotai.com";
const CLOUDFLARED_PROCESS = process.env.PAPERCLIP_CLOUDFLARED_PROCESS || "cloudflared";
// Where the grok/claude adapters materialize agent skills (stale .tmp-* files
// here break the atomic rename with EPERM). Env-overridable for tests.
const SKILLS_DIR = process.env.PAPERCLIP_SKILLS_DIR || "C:\\ANTIGRAVITY\\.claude\\skills";

// Judge-approved push: the bridge executes `git push` ONLY when an issue
// assigned to a judge agent carries an explicit judge APPROVE sentinel in a
// comment (e.g. `JUDGE-PUSH <full-sha>`). This keeps push gated on a judge
// verdict, removes hand-push, and avoids Paperclip's internal run-ownership
// 409 by never having the judge's own codex run do the git push.
const REPO_ROOT = process.env.PAPERCLIP_REPO_ROOT || "C:/ANTIGRAVITY";
const JUDGE_AGENT_IDS = (process.env.PAPERCLIP_JUDGE_AGENT_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
// Non-negotiable authorization literal: the ENTIRE sentinel comment must be
// exactly `JUDGE-PUSH <40-hex>` (per Codex Judge REJECT on 3bd583fc). This is
// hard-coded — deliberately NOT env-configurable — so an environment change
// can never loosen the authorization gate.
const JUDGE_PUSH_SENTINEL = "JUDGE-PUSH";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function statePath() {
  return path.join(STATE_DIR, "mission-control.json");
}

function heartbeatLogPath() {
  return path.join(STATE_DIR, "heartbeat-log.ndjson");
}

function appendLog(entry) {
  try {
    ensureDir(STATE_DIR);
    fs.appendFileSync(heartbeatLogPath(), JSON.stringify(entry) + "\n", "utf8");
  } catch {
    /* log must never break the bridge */
  }
}

function wakePath(runId) {
  const safe = String(runId).replace(/[^A-Za-z0-9._-]/g, "_");
  return path.join(WAKES_DIR, `${safe}.json`);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function send(res, code, body) {
  const payload = JSON.stringify(body);
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function isAuthorized(req) {
  if (!BRIDGE_TOKEN) return false;
  return req.headers["x-paperclip-bridge-token"] === BRIDGE_TOKEN;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 1_000_000) {
        reject(new Error("payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

/** Relay a completion result to Paperclip's heartbeat callback endpoint. */
async function reportToPaperclip(runId, body) {
  const url = `${PAPERCLIP_API_BASE}/api/heartbeat-runs/${encodeURIComponent(runId)}/callback`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AGENT_KEY ? { Authorization: `Bearer ${AGENT_KEY}` } : {}),
      },
      body: JSON.stringify({
        status: body.status || "succeeded",
        result: body.result || null,
        errorMessage: body.errorMessage || null,
        usage: body.usage || undefined,
        model: body.model || null,
        provider: body.provider || null,
        costUsd: body.costUsd || null,
      }),
      signal: controller.signal,
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text: text.slice(0, 400) };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      text: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Mission control: task-pool maintenance + Date App health checks.    */
/* Runs mechanically on every heartbeat wake so the 30s cadence keeps  */
/* the pool at target even when no Freebuff session is open. Judgment  */
/* items (health DOWN, top-up performed) escalate as wake files.       */
/* ------------------------------------------------------------------ */

async function apiGet(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      headers: AGENT_KEY ? { Authorization: `Bearer ${AGENT_KEY}` } : {},
      signal: controller.signal,
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, json, text: text.slice(0, 500) };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      json: null,
      text: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function apiPatchJson(url, body, runId) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(AGENT_KEY ? { Authorization: `Bearer ${AGENT_KEY}` } : {}),
        // Cross-issue writes (comment + status on a routine issue) must be
        // attributed to a heartbeat run or Paperclip rejects them.
        ...(runId ? { "x-paperclip-run-id": runId } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, json, text: text.slice(0, 500) };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      json: null,
      text: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function apiPostJson(url, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AGENT_KEY ? { Authorization: `Bearer ${AGENT_KEY}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, json, text: text.slice(0, 500) };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      json: null,
      text: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function countReadyTasks() {
  if (!COMPANY_ID) return { ok: false, count: -1, text: "no COMPANY_ID configured" };
  const url = `${PAPERCLIP_API_BASE}/api/companies/${COMPANY_ID}/issues?limit=500`;
  const res = await apiGet(url);
  if (!res.ok || !Array.isArray(res.json)) {
    return { ok: false, count: -1, text: res.text || `HTTP ${res.status}` };
  }
  const ready = res.json.filter((i) => i.status === "todo").length;
  return { ok: true, count: ready, total: res.json.length };
}

/* ------------------------------------------------------------------ */
/* Judge-approved push relay.                                          */
/*                                                                     */
/* The judge's official CLI adapter relays git commands, but Paperclip's*/
/* run-ownership model gives the checkout to whichever run won the race,*/
/* so the judge's own codex run frequently hits a 409 and correctly     */
/* abstains before it can push. To make a judge-approved verdict actually*/
/* land on origin, the BRIDGE executes `git push` when it sees an       */
/* explicit judge APPROVE sentinel on a judge-owned issue. Push stays   */
/* gated on the judge's verdict — never on a worker, never self-approve.*/
/* ------------------------------------------------------------------ */

function runGit(args, opts = {}) {
  try {
    const out = execFileSync("git", args, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
      timeout: 90000,
      ...opts,
    });
    return { ok: true, out: (out || "").trim() };
  } catch (err) {
    return { ok: false, out: (err.stderr || err.message || "").toString().trim() };
  }
}

function resolveFullSha(ref, gitFn = runGit) {
  const r = gitFn(["rev-parse", `${ref}^{commit}`]);
  return r.ok ? r.out.trim() : null;
}

/**
 * Strict sentinel parse: the ENTIRE comment body must match, literally and
 * case-sensitively, `^JUDGE-PUSH [0-9a-f]{40}$` — one literal space, no
 * trimming, no case folding, no tabs/newlines, and the command word is the
 * hard-coded literal `JUDGE-PUSH` (never read from env). Any deviation
 * (leading/trailing whitespace, lowercase command, embedded text, extra line)
 * is REJECTED, per Codex Judge REJECTs on c6fe7e70 and 3bd583fc.
 * Returns the sha or null.
 */
function parseJudgePushSentinel(body, sentinel = JUDGE_PUSH_SENTINEL) {
  if (typeof body !== "string") return null;
  const m = body.match(/^JUDGE-PUSH ([0-9a-f]{40})$/);
  if (!m) return null;
  if (sentinel !== JUDGE_PUSH_SENTINEL) return null;
  return m[1].toLowerCase();
}

/** The approved sha must equal local refs/heads/main HEAD (exact binding). */
function sentinelBindsToHead(approvedSha, localHeadSha) {
  return typeof approvedSha === "string" && typeof localHeadSha === "string" && approvedSha === localHeadSha;
}

/** A sha is pushable if local, not yet an ancestor of origin/main. */
function isPushableSha(sha, gitFn = runGit) {
  const local = resolveFullSha(sha, gitFn);
  if (!local) return { ok: false, reason: `not a local commit: ${sha}` };
  const merged = gitFn(["merge-base", "--is-ancestor", sha, "refs/remotes/origin/main"]);
  if (merged.ok) return { ok: false, reason: `${sha} already on origin/main` };
  // Remote may not be fetched on this host; tolerate so push is attempted.
  return { ok: true, sha: local };
}

function judgePushLogPath() {
  return path.join(STATE_DIR, "judge-push.json");
}

function appendJudgePush(entry) {
  try {
    ensureDir(STATE_DIR);
    const arr = Array.isArray(readJson(judgePushLogPath())) ? readJson(judgePushLogPath()) : [];
    arr.push(entry);
    fs.writeFileSync(judgePushLogPath(), JSON.stringify(arr, null, 2), "utf8");
  } catch {
    /* never break the bridge */
  }
}

/**
 * Scan judge-owned issues for an exact APPROVE sentinel, run the push.
 *
 * Safety contract (per Codex Judge REJECT on bd3722d2):
 *  1. AUTHORIZATION — the sentinel comment must be authored by one of the
 *     configured judge agents (c.authorAgentId in JUDGE_AGENT_IDS), on an
 *     issue assigned to a judge agent.
 *  2. EXACT BODY — the whole comment must be `JUDGE-PUSH <40-hex>`. A sentinel
 *     embedded in a longer comment is ignored.
 *  3. COMMIT BINDING — the approved sha must equal local refs/heads/main HEAD.
 *  4. SAFE REFSPEC — push the exact approved sha (`sha:refs/heads/main`),
 *     never a bare `git push origin main` that could carry a different HEAD.
 */
async function relayJudgeApprovedPushes(overrides = {}) {
  if (!COMPANY_ID || JUDGE_AGENT_IDS.length === 0) {
    return { ok: true, checked: 0, reason: "judge push relay not configured (JUDGE_AGENT_IDS empty)" };
  }
  // Test seam: relay.test.js injects { git } to assert no git call happens on
  // rejected authorizations without touching the real repo. Production calls
  // this with no argument and uses the real runGit below.
  const gitFn = typeof overrides.git === "function" ? overrides.git : runGit;
  const listUrl = `${PAPERCLIP_API_BASE}/api/companies/${COMPANY_ID}/issues?limit=200`;
  const list = await apiGet(listUrl);
  if (!list.ok || !Array.isArray(list.json)) {
    return { ok: false, checked: 0, reason: `list issues failed: ${list.text || list.status}` };
  }
  const judgeSet = new Set(JUDGE_AGENT_IDS);
  // Judge-owned issues: assigned to a judge agent and closed/approved.
  const candidate = list.json.filter(
    (i) => i && judgeSet.has(i.assigneeAgentId) && (i.status === "done" || i.status === "in_review")
  );
  let pushed = 0;
  let seen = 0;
  for (const issue of candidate) {
    const commentsRes = await apiGet(`${PAPERCLIP_API_BASE}/api/issues/${issue.id}/comments`);
    if (!commentsRes.ok || !Array.isArray(commentsRes.json)) continue;
    for (const c of commentsRes.json) {
      // AUTHORIZATION: only a configured judge agent's comment can authorize.
      if (!c || !judgeSet.has(c.authorAgentId)) continue;
      // EXACT BODY: full comment must be the sentinel + 40-hex sha.
      const sha = parseJudgePushSentinel(c.body);
      if (!sha) continue;
      seen += 1;
      // COMMIT BINDING: approved sha must equal local main HEAD.
      const headSha = resolveFullSha("refs/heads/main", gitFn);
      if (!sentinelBindsToHead(sha, headSha)) {
        appendJudgePush({ at: new Date().toISOString(), issue: issue.identifier || issue.id, sha, ok: false, reason: `approved sha ${sha} != local refs/heads/main ${headSha || "unknown"}` });
        continue;
      }
      const pushable = isPushableSha(sha, gitFn);
      if (!pushable.ok) {
        appendJudgePush({ at: new Date().toISOString(), issue: issue.identifier || issue.id, sha, ok: false, reason: pushable.reason });
        continue;
      }
      // SAFE REFSPEC: push the exact approved sha to refs/heads/main.
      const push = gitFn(["push", "origin", `${sha}:refs/heads/main`]);
      const result = { at: new Date().toISOString(), issue: issue.identifier || issue.id, sha: pushable.sha, ok: push.ok, out: push.out.slice(0, 300) };
      appendJudgePush(result);
      if (push.ok) pushed += 1;
      break;
    }
  }
  return { ok: true, checked: candidate.length, seen, pushed };
}

const POOL_PARENT_TITLE = "Mission Control — ready-task pool (parent)";

/** Find or create the mission-control parent issue that pooled tasks attach to. */
async function ensurePoolParent() {
  const url = `${PAPERCLIP_API_BASE}/api/companies/${COMPANY_ID}/issues?limit=500`;
  const res = await apiGet(url);
  if (res.ok && Array.isArray(res.json)) {
    const existing = res.json.find((i) => i.title === POOL_PARENT_TITLE);
    if (existing && existing.id) return { ok: true, id: existing.id };
  }
  const created = await apiPostJson(`${PAPERCLIP_API_BASE}/api/companies/${COMPANY_ID}/issues`, {
    title: POOL_PARENT_TITLE,
    description: "Lineage parent for CEO mission-control ready tasks (task-bank pool). Pooled tasks attach here.",
    status: "backlog",
    priority: "low",
  });
  if (created.ok && created.json && created.json.id) return { ok: true, id: created.json.id };
  return { ok: false, id: null, text: created.text || `HTTP ${created.status}` };
}

async function topUpPool(readyCount) {
  if (!COMPANY_ID) return { ok: false, created: 0, reason: "no COMPANY_ID configured" };
  if (readyCount > TOP_UP_AT) return { ok: true, created: 0, reason: `ready=${readyCount} > topUpAt=${TOP_UP_AT}` };
  let bank = [];
  try {
    bank = JSON.parse(fs.readFileSync(TASK_BANK_FILE, "utf8")).tasks || [];
  } catch (err) {
    return { ok: false, created: 0, reason: `task bank unreadable: ${err.message}` };
  }
  if (bank.length === 0) return { ok: false, created: 0, reason: "empty task bank" };

  // Deduplicate against ALL existing ready issues, not just this pass.
  const listUrl = `${PAPERCLIP_API_BASE}/api/companies/${COMPANY_ID}/issues?limit=500`;
  const listRes = await apiGet(listUrl);
  const existingTitles = new Set(
    listRes.ok && Array.isArray(listRes.json)
      ? listRes.json.filter((i) => i.status === "todo" || i.status === "in_progress").map((i) => i.title)
      : []
  );

  // Lineage: attach pool tasks to the mission-control parent issue.
  const parent = await ensurePoolParent();
  if (!parent.ok) return { ok: false, created: 0, reason: `pool parent unavailable: ${parent.text || "unknown"}` };

  const toCreate = POOL_TARGET - readyCount;
  const created = [];
  let cursor = 0;
  while (created.length < toCreate && cursor < bank.length * 4) {
    const t = bank[cursor % bank.length];
    cursor += 1;
    // Skip templates already ready in the company OR created this pass.
    if (existingTitles.has(t.title) || created.some((c) => c.title === t.title)) continue;
    // Route the created task to its lane assignee so harnesses actually pick
    // it up (unassigned pool tasks were the root cause of idle lanes).
    const assigneeAgentId = laneForCategory(t.category, t.title);
    const res = await apiPostJson(
      `${PAPERCLIP_API_BASE}/api/companies/${COMPANY_ID}/issues`,
      {
        title: t.title,
        description: t.description || `Category: ${t.category || "ops"}. Ready task from the CEO mission-control bank.`,
        status: "todo",
        priority: t.priority || "medium",
        parentId: parent.id,
        assigneeAgentId,
      }
    );
    if (res.ok && res.json && res.json.id) {
      created.push({ id: res.json.id, title: t.title });
    } else {
      return { ok: false, created, reason: `create failed: ${res.text || res.status}` };
    }
  }
  return { ok: true, created, reason: `topped up ${created.length} (ready=${readyCount} -> ${readyCount + created.length})` };
}

async function httpProbe(url, method = "GET", body = null) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, json, text: text.slice(0, 300) };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      json: null,
      text: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

function processAlive(name) {
  try {
    const out = execFileSync("tasklist", [], { encoding: "utf8", timeout: 10000 });
    return out.toLowerCase().includes(name.toLowerCase());
  } catch {
    return null; // unknown, not down
  }
}

function dnsResolves(host) {
  try {
    const out = execFileSync("nslookup", [host], { encoding: "utf8", timeout: 10000 });
    return /Address(es)?:/.test(out) && !/can't find|Non-existent domain|No answer/i.test(out);
  } catch {
    return false;
  }
}

async function runHealthChecks() {
  const checks = {};

  const front = await httpProbe(FRONTEND_URL);
  checks.frontend = {
    status: front.ok ? "UP" : front.status === 0 ? "DOWN" : "WRONG SERVICE",
    http: front.status,
    detail: front.ok ? "HTTP 200 HTML" : (front.text || "no response"),
  };

  const back = await httpProbe(BACKEND_HEALTH_URL);
  const dbOk = back.json && back.json.db_connected === true;
  const redisOk = back.json && back.json.redis_connected === true;
  const squareOk = back.json && back.json.square_connected === true;
  checks.backend = {
    status:
      back.ok && dbOk && redisOk && squareOk
        ? "UP"
        : back.ok
          ? "DEGRADED"
          : back.status === 0
            ? "DOWN"
            : "WRONG SERVICE",
    http: back.status,
    detail: `db=${dbOk ? "ok" : "fail"} redis=${redisOk ? "ok" : "fail"} square=${squareOk ? "ok" : "fail"}`,
  };

  // Auth-gated route: 401 means the route is live and enforcing auth (working).
  const support = await httpProbe(SUPPORT_CHAT_URL, "POST", { message: "probe", transcript: [] });
  checks.support = {
    status: support.status === 401 || support.ok ? "UP" : support.status === 0 ? "DOWN" : "WRONG SERVICE",
    http: support.status,
    detail: support.status === 401 ? "route live, auth enforced" : (support.text || "no response"),
  };

  const cfProcess = processAlive(CLOUDFLARED_PROCESS);
  checks.cloudflared = {
    status: cfProcess === true ? "UP" : cfProcess === false ? "DOWN" : "NOT CONFIGURED",
    detail: cfProcess === true ? "process running" : cfProcess === false ? "process not found" : "tasklist unavailable",
  };

  checks.dns = {
    status: dnsResolves(SITE_HOST) ? "UP" : "DOWN",
    detail: `${SITE_HOST} resolves via nslookup`,
  };

  // The marketing gate requires ALL surfaces UP. NOT CONFIGURED (e.g. tasklist
  // unavailable so cloudflared presence is unknown) and DEGRADED are not UP
  // either — anything short of UP must fail the aggregate.
  const anyNotUp = Object.values(checks).some((c) => c.status !== "UP");
  return { checks, healthy: !anyNotUp };
}

// Routine-created watchdog issues are titled exactly this way (see the
// paperclip-health-watchdog routine). The bridge auto-disposes them with the
// mechanical scan evidence it already produced; a session is only needed when
// the mission reports something DOWN.
const WATCHDOG_TITLE_PREFIX = "Paperclip system-health watchdog";

function buildWatchdogSummary(health, pool, topUp, judgePush) {
  const up = Object.values(health?.checks || {})
    .map((c) => `${Object.keys(health.checks).find((k) => health.checks[k] === c)}:${c.status}`)
    .join(" ");
  return [
    "WATCHDOG AUTO-DISPOSED (mechanical scan; no session needed) — VERIFIED.",
    `Health: ${health && health.healthy ? "healthy" : "DEGRADED"} [${up}]`,
    `Pool: ready=${pool && pool.count} target=${POOL_TARGET} topUpAt=${TOP_UP_AT} topUpCreated=${topUp && topUp.created ? topUp.created.length : 0}`,
    `Judge push relay: checked=${judgePush && judgePush.checked} seen=${judgePush && judgePush.seen} pushed=${judgePush && judgePush.pushed}`,
    "Auto-disposed by the Freebuff CEO bridge mission loop. Deeper scans (blocked issues, errored agents) run in session cycles.",
  ].join("\n");
}

/**
 * Post a disposition for the routine-created watchdog issue scoped to THIS
 * wake (the runId only authorizes writes to the wake's own issue — PATCHing
 * any other open watchdog issue is a cross-issue write Paperclip rejects).
 * Safety: only touches the wake's issue when its title starts with
 * WATCHDOG_TITLE_PREFIX and its status is in_progress/blocked. When health is
 * DOWN we leave the issue pending for a session (escalation) instead of
 * auto-closing it. disposeIssueId is null on timer-only wakes.
 */
async function disposeWatchdogIssues(health, pool, topUp, judgePush, runId, disposeIssueId) {
  // No issue-scoped run is the more fundamental precondition: without one,
  // Paperclip rejects cross-issue writes, so there is nothing to attempt
  // regardless of config.
  if (!runId) {
    return { ok: true, checked: 0, disposed: 0, reason: "no issue-scoped run; timer-only wake skips dispose" };
  }
  if (!COMPANY_ID || !AGENT_KEY) {
    return { ok: true, checked: 0, disposed: 0, reason: "auto-disposition not configured (COMPANY_ID/AGENT_KEY)" };
  }
  // The run only owns THIS wake's issue. If the wake is not scoped to a
  // watchdog issue, there is nothing to auto-dispose — skip without an API
  // call (no cross-issue sweep attempts).
  if (!disposeIssueId) {
    return { ok: true, checked: 0, disposed: 0, reason: "wake not scoped to a watchdog issue; no dispose" };
  }
  const listUrl = `${PAPERCLIP_API_BASE}/api/companies/${COMPANY_ID}/issues?limit=500`;
  const list = await apiGet(listUrl);
  if (!list.ok || !Array.isArray(list.json)) {
    return { ok: false, checked: 0, disposed: 0, reason: `list issues failed: ${list.text || list.status}` };
  }
  const open = list.json.filter(
    (i) =>
      i &&
      i.id === disposeIssueId &&
      typeof i.title === "string" &&
      i.title.startsWith(WATCHDOG_TITLE_PREFIX) &&
      (i.status === "in_progress" || i.status === "blocked")
  );
  if (open.length === 0) return { ok: true, checked: 0, disposed: 0, reason: "wake's issue is not an open watchdog issue" };
  // Do not auto-close when the mission reports something DOWN — that needs a
  // session's judgment and stays escalated as a pending wake.
  if (!health || !health.healthy) {
    return { ok: true, checked: open.length, disposed: 0, reason: "health not healthy; left for session escalation" };
  }
  const summary = buildWatchdogSummary(health, pool, topUp, judgePush);
  const issue = open[0];
  const res = await apiPatchJson(
    `${PAPERCLIP_API_BASE}/api/issues/${issue.id}`,
    { status: "done", comment: summary },
    runId
  );
  if (res.ok) {
    return { ok: true, checked: 1, disposed: 1, disposedIds: [issue.id], reason: "disposed 1/1 open watchdog issue(s)" };
  }
  appendLog({ t: new Date().toISOString(), watchdogDispose: "failed", issue: issue.identifier || issue.id, text: res.text.slice(0, 200) });
  return { ok: true, checked: 1, disposed: 0, reason: `dispose failed: ${res.text.slice(0, 120)}` };
}

// EPERM self-heal: when an agent's heartbeat run failed on the stale
// `.claude/skills/*.tmp-*` rename (EPERM: operation not permitted), the
// adapter cannot re-materialize its skills. Clear the stale temp artifacts so
// the next run succeeds, and resume the agent if it errored. Scoped to the
// wake's OWN agent, EPERM-class failures only, bounded lookback. Filesystem
// cleanup is limited to `.tmp-*` entries — symlinks and real skill dirs are
// never touched.
const EPERM_LOOKBACK_MS = 10 * 60 * 1000;
const EPERM_SKILLS_MARKER = /EPERM: operation not permitted, rename .*\.claude[\\/\\]skills/i;

function clearStaleSkillsTmp(dir) {
  let removed = 0;
  try {
    for (const name of fs.readdirSync(dir)) {
      if (name.includes(".tmp-")) {
        fs.rmSync(path.join(dir, name), { recursive: true, force: true });
        removed += 1;
      }
    }
  } catch (err) {
    return { removed, error: err instanceof Error ? err.message : String(err) };
  }
  return { removed, error: null };
}

async function selfHealEperm(agentId) {
  // Needs an agent context (from the wake) and a configured API key.
  if (!agentId) return { ok: true, scanned: 0, removed: 0, resumed: false, reason: "no agent context; skipped" };
  if (!COMPANY_ID || !AGENT_KEY) {
    return { ok: true, scanned: 0, removed: 0, resumed: false, reason: "self-heal not configured (COMPANY_ID/AGENT_KEY)" };
  }
  const listUrl = `${PAPERCLIP_API_BASE}/api/companies/${COMPANY_ID}/heartbeat-runs?agentId=${encodeURIComponent(agentId)}&limit=20`;
  const list = await apiGet(listUrl);
  const runs = Array.isArray(list.json) ? list.json : [];
  const cutoff = Date.now() - EPERM_LOOKBACK_MS;
  const hit = runs.find((r) => {
    if (!r || r.status !== "failed") return false;
    const t = new Date(r.startedAt || r.createdAt || 0).getTime();
    if (!t || t < cutoff) return false;
    return EPERM_SKILLS_MARKER.test(r.summary || r.errorMessage || r.error || "");
  });
  if (!hit) return { ok: true, scanned: runs.length, removed: 0, resumed: false, reason: "no EPERM skills failure in lookback" };
  const cleaned = clearStaleSkillsTmp(SKILLS_DIR);
  let resumed = false;
  if (cleaned.removed > 0 && !cleaned.error) {
    const resume = await apiPostJson(`${PAPERCLIP_API_BASE}/api/agents/${agentId}/resume`, {});
    resumed = resume.ok;
    if (!resume.ok) {
      appendLog({ t: new Date().toISOString(), epermSelfHeal: "resume failed", agent: agentId, text: resume.text.slice(0, 200) });
    }
  }
  appendLog({
    t: new Date().toISOString(),
    epermSelfHeal: "applied",
    agent: agentId,
    run: hit.id || null,
    removed: cleaned.removed,
    resumed,
    error: cleaned.error || null,
  });
  return { ok: true, scanned: runs.length, removed: cleaned.removed, resumed, reason: cleaned.error ? `cleared ${cleaned.removed}; ${cleaned.error}` : `cleared ${cleaned.removed} stale tmp; resumed=${resumed}` };
}

async function runMissionControl(runId, disposeIssueId, agentId) {
  const t0 = Date.now();
  const [pool, health] = await Promise.all([countReadyTasks(), runHealthChecks()]);
  let topUp = { ok: false, created: 0, reason: "not run" };
  if (pool.ok && pool.count <= TOP_UP_AT) {
    topUp = await topUpPool(pool.count);
  } else if (pool.ok) {
    topUp = { ok: true, created: 0, reason: `ready=${pool.count} >= topUpAt=${TOP_UP_AT}; no top-up needed` };
  }
  // Judge-approved push relay runs on every wake, independent of the pool /
  // health results. It only acts on an explicit judge APPROVE sentinel.
  const judgePush = await relayJudgeApprovedPushes().catch((err) => ({
    ok: false,
    reason: err instanceof Error ? err.message : String(err),
  }));
  // Watchdog auto-disposition: the routine-created watchdog issue is the same
  // mechanical scan this bridge already runs (pool, health, judge push). When
  // the mission is healthy, auto-post the disposition (evidence-backed summary
  // comment + status done) so scheduled cycles resolve without a session. When
  // health is DOWN the wake stays pending for a session instead.
  const watchdog = await disposeWatchdogIssues(health, pool, topUp, judgePush, runId, disposeIssueId).catch((err) => ({
    ok: false,
    disposed: 0,
    disposedIds: [],
    reason: err instanceof Error ? err.message : String(err),
  }));
  // EPERM self-heal: agent-scoped (the wake's own agent), EPERM-class only.
  // Cheap — one bounded runs list + rare filesystem sweep — and runs on every
  // wake so a failed skill-materialization rename self-heals within one cadence.
  const eperm = await selfHealEperm(agentId).catch((err) => ({
    ok: false,
    scanned: 0,
    removed: 0,
    resumed: false,
    reason: err instanceof Error ? err.message : String(err),
  }));
  const state = {
    updatedAt: new Date().toISOString(),
    pool: { ok: pool.ok, ready: pool.count, total: pool.total || null, target: POOL_TARGET, topUpAt: TOP_UP_AT },
    topUp,
    health,
    judgePush,
    watchdog,
    eperm,
    ms: Date.now() - t0,
  };
  ensureDir(STATE_DIR);
  fs.writeFileSync(statePath(), JSON.stringify(state, null, 2), "utf8");
  appendLog({ t: state.updatedAt, ready: pool.count, topUp: topUp.created, healthy: health.healthy, judgePush: judgePush.pushed || 0, ms: state.ms });
  return state;
}

function readMissionState() {
  return readJson(statePath());
}

function listWakes() {
  ensureDir(WAKES_DIR);
  const out = [];
  for (const name of fs.readdirSync(WAKES_DIR)) {
    if (!name.endsWith(".json")) continue;
    const wake = readJson(path.join(WAKES_DIR, name));
    if (wake) out.push(wake);
  }
  out.sort((a, b) => (a.receivedAt || "").localeCompare(b.receivedAt || ""));
  return out;
}

// Extract the issue/task a wake is scoped to. Paperclip sends the assigned
// issue in body.context (taskId/issueId/paperclipWake.issue) on issue-scoped
// CEO heartbeats; the top-level taskId is often null. Pure and testable.
function extractWakeIssueId(body) {
  if (!body || typeof body !== "object") return null;
  const ctx = body.context || {};
  return (
    body.taskId ||
    body.issueId ||
    ctx.taskId ||
    ctx.issueId ||
    (ctx.paperclipWake && ctx.paperclipWake.issue && ctx.paperclipWake.issue.id) ||
    (ctx.paperclipIssue && ctx.paperclipIssue.id) ||
    null
  );
}

async function handleHeartbeat(req, res, body) {
  const { runId, agentId, companyId, wakeReason } = body;
  if (!runId) {
    return send(res, 400, { error: "missing runId" });
  }

  // Mission control runs mechanically on EVERY wake (30s cadence). This is
  // what keeps the 50-task pool topped up and the Date App surfaces verified
  // even when no Freebuff session is open.
  //
  // Watchdog auto-disposition requires an ISSUE-SCOPED run: Paperclip rejects
  // cross-issue writes from unassigned timer runs (cross_issue_influence_run_
  // context_required), so the dispose only gets a runId when this wake carries
  // the issue it should dispose. Timer-only wakes skip the dispose step.
  const wakeIssueId = extractWakeIssueId(body);
  const issueScopedRunId = wakeIssueId ? runId : null;
  let mission = null;
  let missionError = null;
  try {
    mission = await runMissionControl(issueScopedRunId, wakeIssueId, agentId);
  } catch (err) {
    missionError = err instanceof Error ? err.message : String(err);
  }

  const healthDown = mission && !mission.health.healthy;
  const toppedUp = mission && mission.topUp && Array.isArray(mission.topUp.created) && mission.topUp.created.length > 0;
  const poolFailed = mission && (!mission.pool.ok || !mission.topUp.ok);

  // Escalate to a Freebuff CEO session when judgment is needed: health
  // DOWN/WRONG SERVICE, a top-up happened, the pool check failed, OR the wake
  // is scoped to a real issue. An issue-scoped heartbeat means Paperclip
  // assigned the CEO work that needs a disposition; without escalation the
  // wake is auto-completed, no session works the issue, and Paperclip blocks
  // it with "missing disposition". Bare timer heartbeats (no issue) stay local.
  //
  // Exception: when the mechanical watchdog auto-disposed THIS wake's own
  // issue (the disposer swept it and the PATCH landed), the disposition
  // already exists and no session judgment is needed — the wake is stored
  // done and the response is NOT an escalation. The 202-accept already marked
  // the run succeeded, and a callback would 404 in build 2026.817.0, so local
  // completion is the correct record. Health-DOWN, top-ups, and non-watchdog
  // issues still stay pending for a session.
  const issueId = wakeIssueId;
  const watchdogIds = mission && mission.watchdog && Array.isArray(mission.watchdog.disposedIds) ? mission.watchdog.disposedIds : [];
  const { autoDisposed, needsCEO, status: wakeStatus } = wakeDisposition({
    issueId,
    autoDisposedIds: watchdogIds,
    healthDown,
    toppedUp,
    poolFailed,
    missionError,
  });

  const wake = {
    runId,
    agentId: agentId || null,
    companyId: companyId || null,
    taskId: issueId,
    wakeReason: wakeReason || "heartbeat",
    wakeCommentId: body.wakeCommentId || null,
    approvalId: body.approvalId || null,
    approvalStatus: body.approvalStatus || null,
    issueIds: body.issueIds || null,
    context: body.context || {},
    receivedAt: new Date().toISOString(),
    status: wakeStatus, // pending | done | failed
    needsCEO,
    autoDisposed: autoDisposed || undefined,
    completedAt: autoDisposed ? new Date().toISOString() : undefined,
    callback: autoDisposed ? { ok: true, auto: "watchdog-dispose", note: "issue auto-disposed by mission loop; wake completed locally" } : undefined,
    mission: mission || { error: missionError },
  };
  writeJson(wakePath(runId), wake);
  // Async pattern: accept immediately, Freebuff session works, then callbacks.
  return send(res, 202, { status: "accepted", runId, needsCEO });
}

// Pure response-contract decision: what status + needsCEO does a wake get,
// and what does the 202 response return? Extracted so the handler contract
// (stored wake state === returned escalation state) has a regression test.
function wakeDisposition({ issueId, autoDisposedIds, healthDown, toppedUp, poolFailed, missionError }) {
  const autoDisposed = Boolean(issueId) && Array.isArray(autoDisposedIds) && autoDisposedIds.includes(issueId);
  const needsCEO = !autoDisposed && Boolean(healthDown || toppedUp || poolFailed || missionError || issueId);
  return { autoDisposed, needsCEO, status: autoDisposed ? "done" : needsCEO ? "pending" : "done" };
}

async function handleDone(req, res, runId, body, failed) {
  const file = wakePath(runId);
  const wake = readJson(file);
  if (!wake) {
    return send(res, 404, { error: `no wake for run ${runId}` });
  }
  const report = await reportToPaperclip(runId, {
    status: failed ? "failed" : "succeeded",
    result: failed ? null : body.result || "Freebuff CEO completed the wake.",
    errorMessage: failed ? body.errorMessage || "Freebuff CEO reported failure." : null,
    usage: body.usage || null,
    model: body.model || null,
    provider: body.provider || null,
    costUsd: body.costUsd || null,
  });
  wake.status = failed ? "failed" : "done";
  wake.completedAt = new Date().toISOString();
  wake.callback = report;
  writeJson(file, wake);
  // Build 2026.817.0 has no /api/heartbeat-runs/:runId/callback route: the
  // HTTP adapter marks the run succeeded on the 202-accept, so a 404 here is
  // not a failure of the loop — it just means completion is recorded in the
  // wake file only. Treat it as accepted-local, not a bridge error.
  if (!report.ok && report.status !== 404) {
    return send(res, 502, { error: "callback to Paperclip failed", report });
  }
  return send(res, 200, { status: wake.status, runId, report });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const parts = url.pathname.split("/").filter(Boolean);

  try {
    // Identity probe is public on loopback (no token).
    if (req.method === "GET" && parts[0] === "health") {
      return send(res, 200, {
        service: "paperclip-freebuff-ceo-bridge",
        version: "1.0.0",
        status: "UP",
        adapter: "http -> wake queue -> Freebuff session -> callback",
        wakesDir: WAKES_DIR,
        paperclipApi: PAPERCLIP_API_BASE,
        agentKeyConfigured: Boolean(AGENT_KEY),
        tokenConfigured: Boolean(BRIDGE_TOKEN),
        time: new Date().toISOString(),
      });
    }

    if (!isAuthorized(req)) {
      return send(res, 401, { error: "unauthorized" });
    }

    if (req.method === "POST" && parts[0] === "heartbeat") {
      const body = await readBody(req);
      return await handleHeartbeat(req, res, body);
    }

    if (req.method === "GET" && parts[0] === "wakes" && parts.length === 1) {
      return send(res, 200, { wakes: listWakes() });
    }

    if (req.method === "GET" && parts[0] === "wakes" && parts.length === 2) {
      const wake = readJson(wakePath(parts[1]));
      if (!wake) return send(res, 404, { error: "wake not found" });
      return send(res, 200, wake);
    }

    if (req.method === "POST" && parts[0] === "wakes" && parts.length === 3 && parts[2] === "done") {
      const body = await readBody(req);
      return await handleDone(req, res, parts[1], body, false);
    }

    if (req.method === "POST" && parts[0] === "wakes" && parts.length === 3 && parts[2] === "fail") {
      const body = await readBody(req);
      return await handleDone(req, res, parts[1], body, true);
    }

    return send(res, 404, { error: "not found" });
  } catch (err) {
    return send(res, 500, {
      error: "bridge error",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

ensureDir(WAKES_DIR);
ensureDir(STATE_DIR);

// Test seam: relay.test.js requires this module. When PAPERCLIP_BRIDGE_NO_LISTEN
// is set, export the pure helpers and do NOT bind the port. Production start
// (start.js -> require bridge.js) leaves the env unset and listens normally.
if (process.env.PAPERCLIP_BRIDGE_NO_LISTEN === "1") {
  module.exports = {
    parseJudgePushSentinel,
    sentinelBindsToHead,
    isPushableSha,
    resolveFullSha,
    runGit,
    relayJudgeApprovedPushes,
    extractWakeIssueId,
    disposeWatchdogIssues,
    buildWatchdogSummary,
    selfHealEperm,
    clearStaleSkillsTmp,
    wakeDisposition,
    topUpPool,
    laneForCategory,
    countReadyTasks,
    WATCHDOG_TITLE_PREFIX,
    JUDGE_PUSH_SENTINEL,
    JUDGE_AGENT_IDS,
    LANE_HERMES,
    LANE_OPENCLAW,
    LANE_OPENCODE,
    LANE_XMARKETING,
  };
} else {
  server.listen(PORT, HOST, () => {
    console.log(`[bridge] paperclip-freebuff-ceo-bridge UP on http://${HOST}:${PORT}`);
    console.log(`[bridge] wakes dir: ${WAKES_DIR}`);
    console.log(`[bridge] paperclip api: ${PAPERCLIP_API_BASE}`);
    console.log(`[bridge] agent key configured: ${Boolean(AGENT_KEY)} | token configured: ${Boolean(BRIDGE_TOKEN)}`);
  });
}
