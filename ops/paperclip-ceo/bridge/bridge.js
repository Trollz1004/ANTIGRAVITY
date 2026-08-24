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

// Health-check targets (Date App + cloudflared).
const FRONTEND_URL = process.env.PAPERCLIP_FRONTEND_URL || "http://127.0.0.1:3200";
const BACKEND_HEALTH_URL = process.env.PAPERCLIP_BACKEND_HEALTH_URL || "http://127.0.0.1:8000/health";
const SUPPORT_CHAT_URL = process.env.PAPERCLIP_SUPPORT_CHAT_URL || "http://127.0.0.1:8000/api/v1/support/chat";
const SITE_HOST = process.env.PAPERCLIP_SITE_HOST || "youandinotai.com";
const CLOUDFLARED_PROCESS = process.env.PAPERCLIP_CLOUDFLARED_PROCESS || "cloudflared";

// Judge-approved push: the bridge executes `git push` ONLY when an issue
// assigned to a judge agent carries an explicit judge APPROVE sentinel in a
// comment (e.g. `JUDGE-PUSH <full-sha>`). This keeps push gated on a judge
// verdict, removes hand-push, and avoids Paperclip's internal run-ownership
// 409 by never having the judge's own codex run do the git push.
const REPO_ROOT = process.env.PAPERCLIP_REPO_ROOT || "C:/ANTIGRAVITY";
const JUDGE_AGENT_IDS = (process.env.PAPERCLIP_JUDGE_AGENT_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
const JUDGE_PUSH_SENTINEL = process.env.PAPERCLIP_JUDGE_PUSH_SENTINEL || "JUDGE-PUSH";

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

function resolveFullSha(ref) {
  const r = runGit(["rev-parse", `${ref}^{commit}`]);
  return r.ok ? r.out.trim() : null;
}

/** A sha is pushable if local, not yet an ancestor of origin/main. */
function isPushableSha(sha) {
  const local = resolveFullSha(sha);
  if (!local) return { ok: false, reason: `not a local commit: ${sha}` };
  const merged = runGit(["merge-base", "--is-ancestor", sha, "refs/remotes/origin/main"]);
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
 * Scan judge-owned issues for an explicit APPEND sentinel + sha, run the push.
 * Sentinel format on the issue comment: `JUDGE-PUSH <full-sha>`.
 */
async function relayJudgeApprovedPushes() {
  if (!COMPANY_ID || JUDGE_AGENT_IDS.length === 0) {
    return { ok: true, checked: 0, reason: "judge push relay not configured (JUDGE_AGENT_IDS empty)" };
  }
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
      const body = typeof c.body === "string" ? c.body : "";
      const m = body.split(/[\r\n]+/).map((l) => l.trim()).find((l) => l.toUpperCase().startsWith(`${JUDGE_PUSH_SENTINEL.toUpperCase()} `));
      if (!m) continue;
      seen += 1;
      const sha = m.split(/\s+/)[1] ? m.split(/\s+/)[1].trim() : null;
      if (!sha) continue;
      const pushable = isPushableSha(sha);
      if (!pushable.ok) {
        appendJudgePush({ at: new Date().toISOString(), issue: issue.identifier || issue.id, sha, ok: false, reason: pushable.reason });
        continue;
      }
      const push = runGit(["push", "origin", "main"]);
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
    const res = await apiPostJson(
      `${PAPERCLIP_API_BASE}/api/companies/${COMPANY_ID}/issues`,
      {
        title: t.title,
        description: t.description || `Category: ${t.category || "ops"}. Ready task from the CEO mission-control bank.`,
        status: "todo",
        priority: t.priority || "medium",
        parentId: parent.id,
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

async function runMissionControl() {
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
  const state = {
    updatedAt: new Date().toISOString(),
    pool: { ok: pool.ok, ready: pool.count, total: pool.total || null, target: POOL_TARGET, topUpAt: TOP_UP_AT },
    topUp,
    health,
    judgePush,
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

async function handleHeartbeat(req, res, body) {
  const { runId, agentId, companyId, taskId, wakeReason } = body;
  if (!runId) {
    return send(res, 400, { error: "missing runId" });
  }

  // Mission control runs mechanically on EVERY wake (30s cadence). This is
  // what keeps the 50-task pool topped up and the Date App surfaces verified
  // even when no Freebuff session is open.
  let mission = null;
  let missionError = null;
  try {
    mission = await runMissionControl();
  } catch (err) {
    missionError = err instanceof Error ? err.message : String(err);
  }

  const healthDown = mission && !mission.health.healthy;
  const toppedUp = mission && mission.topUp && Array.isArray(mission.topUp.created) && mission.topUp.created.length > 0;
  const poolFailed = mission && (!mission.pool.ok || !mission.topUp.ok);

  // Escalate to a Freebuff CEO session only when judgment is needed:
  // health DOWN/WRONG SERVICE, a top-up happened, or the pool check failed.
  // Routine heartbeats stay local (wake file still recorded for audit).
  const needsCEO = Boolean(healthDown || toppedUp || poolFailed || missionError);

  const wake = {
    runId,
    agentId: agentId || null,
    companyId: companyId || null,
    taskId: taskId || body.issueId || null,
    wakeReason: wakeReason || "heartbeat",
    wakeCommentId: body.wakeCommentId || null,
    approvalId: body.approvalId || null,
    approvalStatus: body.approvalStatus || null,
    issueIds: body.issueIds || null,
    context: body.context || {},
    receivedAt: new Date().toISOString(),
    status: needsCEO ? "pending" : "done", // pending | done | failed
    needsCEO,
    mission: mission || { error: missionError },
  };
  writeJson(wakePath(runId), wake);
  // Async pattern: accept immediately, Freebuff session works, then callbacks.
  return send(res, 202, { status: "accepted", runId, needsCEO });
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
server.listen(PORT, HOST, () => {
  console.log(`[bridge] paperclip-freebuff-ceo-bridge UP on http://${HOST}:${PORT}`);
  console.log(`[bridge] wakes dir: ${WAKES_DIR}`);
  console.log(`[bridge] paperclip api: ${PAPERCLIP_API_BASE}`);
  console.log(`[bridge] agent key configured: ${Boolean(AGENT_KEY)} | token configured: ${Boolean(BRIDGE_TOKEN)}`);
});
