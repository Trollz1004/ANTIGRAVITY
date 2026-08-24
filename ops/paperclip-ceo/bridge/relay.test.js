#!/usr/bin/env node
/**
 * Judge-push relay safety tests (per Codex Judge REJECTs on bd3722d2/c6fe7e70).
 *
 * Imports the PRODUCTION helpers from bridge.js via the PAPERCLIP_BRIDGE_NO_LISTEN
 * test seam (no duplicated implementations, no production/test drift). Tests:
 *   1. strict literal sentinel parsing — exact ^JUDGE-PUSH [0-9a-f]{40}$,
 *      case-sensitive, no trimming; negatives for leading/trailing whitespace,
 *      lowercase command, tab, embedded newline, embedded paragraph;
 *   2. commit binding — approved sha must equal local refs/heads/main HEAD;
 *   3. authorization — relay only accepts comments authored by configured
 *      judges on judge-owned issues (end-to-end via stub API + injected git).
 *
 * Run: node relay.test.js   (exit 0 = all pass)
 */
const assert = require("assert");
const http = require("http");
const path = require("path");
const fs = require("fs");

process.env.PAPERCLIP_BRIDGE_NO_LISTEN = "1";
process.env.PAPERCLIP_JUDGE_AGENT_IDS =
  "32375fe9-c3a3-46bf-ad46-4126d1c3d49e,d254fb31-abec-42f7-8cc2-bad261fbdf48";

const bridge = require("./bridge.js");
const {
  parseJudgePushSentinel,
  sentinelBindsToHead,
  extractWakeIssueId,
  buildWatchdogSummary,
  WATCHDOG_TITLE_PREFIX,
  JUDGE_PUSH_SENTINEL,
} = bridge;

const CODEX_JUDGE = "32375fe9-c3a3-46bf-ad46-4126d1c3d49e";
const WORKER = "55461934-f04b-4397-be78-b81bd353d110"; // Freebuff CEO, NOT a judge
const SHA = "e5c0fa536cc38236309f8a4e0313ff4951cfa8af";

let failures = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`PASS  ${name}`);
  } catch (err) {
    failures += 1;
    console.error(`FAIL  ${name}`);
    console.error(`      ${err.message}`);
  }
}

// Async-aware variant: returns the promise so the caller (the async IIFE)
// can await it. Without this, an async test's rejection is an unhandled
// promise error and never increments `failures` — a silent-failure trap.
function testAsync(name, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      console.log(`PASS  ${name}`);
    })
    .catch((err) => {
      failures += 1;
      console.error(`FAIL  ${name}`);
      console.error(`      ${err.message}`);
    });
}

// -------------------------------------------------------------------------
// 0. Wake issue-scope extraction (heartbeat escalation)
// -------------------------------------------------------------------------
test("extractWakeIssueId: top-level taskId wins", () => {
  assert.strictEqual(
    extractWakeIssueId({ taskId: "t1", context: { taskId: "t2" } }),
    "t1"
  );
});
test("extractWakeIssueId: falls back to context.taskId when top-level null", () => {
  assert.strictEqual(
    extractWakeIssueId({ taskId: null, context: { taskId: "ctx-id" } }),
    "ctx-id"
  );
});
test("extractWakeIssueId: reads paperclipWake.issue.id from context", () => {
  assert.strictEqual(
    extractWakeIssueId({
      taskId: null,
      context: { paperclipWake: { issue: { id: "issue-9", identifier: "ANT-9" } } },
    }),
    "issue-9"
  );
});
test("extractWakeIssueId: reads paperclipIssue.id from context", () => {
  assert.strictEqual(
    extractWakeIssueId({
      context: { paperclipIssue: { id: "issue-71" } },
    }),
    "issue-71"
  );
});
test("extractWakeIssueId: bare timer heartbeat (no issue) returns null", () => {
  assert.strictEqual(
    extractWakeIssueId({ context: { wakeReason: "heartbeat_timer", reason: "interval_elapsed" } }),
    null
  );
});
test("extractWakeIssueId: empty body and null body return null", () => {
  assert.strictEqual(extractWakeIssueId({}), null);
  assert.strictEqual(extractWakeIssueId(null), null);
});

// -------------------------------------------------------------------------
// 0b. Watchdog auto-disposition summary
// -------------------------------------------------------------------------
test("watchdog summary includes health, pool, judgePush evidence", () => {
  const s = buildWatchdogSummary(
    { healthy: true, checks: { frontend: { status: "UP" }, backend: { status: "UP" } } },
    { count: 49 },
    { created: [1, 2] },
    { checked: 3, seen: 1, pushed: 0 }
  );
  assert.ok(s.includes("healthy"), "mentions healthy");
  assert.ok(s.includes("frontend:UP"), "lists frontend:UP");
  assert.ok(s.includes("ready=49"), "lists pool ready");
  assert.ok(s.includes("pushed=0"), "lists judge push result");
  assert.ok(s.includes("AUTO-DISPOSED"), "marks auto-disposition");
});
test("watchdog summary reflects degraded health", () => {
  const s = buildWatchdogSummary(
    { healthy: false, checks: { backend: { status: "DOWN" } } },
    { count: 5 },
    { created: [] },
    { checked: 0, seen: 0, pushed: 0 }
  );
  assert.ok(s.includes("DEGRADED"), "mentions DEGRADED");
  assert.ok(s.includes("backend:DOWN"), "lists backend:DOWN");
});
test("watchdog title prefix matches the routine's issue title", () => {
  assert.strictEqual(WATCHDOG_TITLE_PREFIX, "Paperclip system-health watchdog");
});

// -------------------------------------------------------------------------
// 0c. disposeWatchdogIssues: timer-run guard (no issue-scoped run -> skip)
// -------------------------------------------------------------------------
test("disposeWatchdogIssues without issue-scoped run skips (no API calls)", async () => {
  // The guard returns before any fetch when runId is null. Injecting no API
  // stub means any unexpected network call would throw -> fail the test.
  const res = await bridge.disposeWatchdogIssues(
    { healthy: true, checks: {} },
    { count: 49 },
    { created: [] },
    { checked: 0, seen: 0, pushed: 0 },
    null
  );
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.disposed, 0);
  assert.ok(res.reason.includes("timer-only wake skips"), res.reason);
});

// disposeWatchdogIssues end-to-end coverage runs in the async IIFE at the
// bottom (stub API + fresh module require), because the sweep performs real
// fetch calls that the sync `test` harness cannot await.

// -------------------------------------------------------------------------
// 1. Strict literal sentinel parsing
// -------------------------------------------------------------------------
test("exact one-line sentinel parses", () => {
  assert.strictEqual(parseJudgePushSentinel(`JUDGE-PUSH ${SHA}`), SHA);
});
test("trailing newline is REJECTED (no trim)", () => {
  assert.strictEqual(parseJudgePushSentinel(`JUDGE-PUSH ${SHA}\n`), null);
});
test("leading space is REJECTED (no trim)", () => {
  assert.strictEqual(parseJudgePushSentinel(` JUDGE-PUSH ${SHA}`), null);
});
test("trailing space is REJECTED (no trim)", () => {
  assert.strictEqual(parseJudgePushSentinel(`JUDGE-PUSH ${SHA} `), null);
});
test("lowercase command is REJECTED (case-sensitive)", () => {
  assert.strictEqual(parseJudgePushSentinel(`judge-push ${SHA}`), null);
});
test("mixed-case command is REJECTED (case-sensitive)", () => {
  assert.strictEqual(parseJudgePushSentinel(`Judge-Push ${SHA}`), null);
});
test("tab separator is REJECTED (literal space only)", () => {
  assert.strictEqual(parseJudgePushSentinel(`JUDGE-PUSH\t${SHA}`), null);
});
test("embedded newline inside body is REJECTED", () => {
  assert.strictEqual(parseJudgePushSentinel(`JUDGE-PUSH ${SHA}\nJUDGE-PUSH ${SHA}`), null);
});
test("sentinel embedded in a longer comment is REJECTED", () => {
  assert.strictEqual(parseJudgePushSentinel(`## APPROVE\n\nVerified ok.\nJUDGE-PUSH ${SHA}\n\nCheers.`), null);
});
test("wrong sentinel word is REJECTED", () => {
  assert.strictEqual(parseJudgePushSentinel(`WORKER-PUSH ${SHA}`), null);
});
test("short sha is REJECTED", () => {
  assert.strictEqual(parseJudgePushSentinel(`JUDGE-PUSH e5c0fa53`), null);
});
test("uppercase hex is REJECTED (lowercase only)", () => {
  assert.strictEqual(parseJudgePushSentinel(`JUDGE-PUSH ${SHA.toUpperCase()}`), null);
});
test("non-hex sha is REJECTED", () => {
  assert.strictEqual(parseJudgePushSentinel(`JUDGE-PUSH zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz`), null);
});
test("empty body is REJECTED", () => {
  assert.strictEqual(parseJudgePushSentinel(""), null);
});
test("non-string body is REJECTED", () => {
  assert.strictEqual(parseJudgePushSentinel(null), null);
  assert.strictEqual(parseJudgePushSentinel(undefined), null);
});
test("sentinel constant is the literal JUDGE-PUSH", () => {
  assert.strictEqual(JUDGE_PUSH_SENTINEL, "JUDGE-PUSH");
});

test("env cannot alter the authorization literal (module-reload negative)", () => {
  process.env.PAPERCLIP_JUDGE_PUSH_SENTINEL = "WORKER-PUSH";
  delete require.cache[require.resolve("./bridge.js")];
  const fresh = require("./bridge.js");
  // The production constant must still be the hard-coded literal.
  assert.strictEqual(fresh.JUDGE_PUSH_SENTINEL, "JUDGE-PUSH");
  // And the parser must still accept ONLY JUDGE-PUSH, never the env value.
  assert.strictEqual(fresh.parseJudgePushSentinel(`WORKER-PUSH ${SHA}`), null);
  assert.strictEqual(fresh.parseJudgePushSentinel(`JUDGE-PUSH ${SHA}`), SHA);
  delete process.env.PAPERCLIP_JUDGE_PUSH_SENTINEL;
  delete require.cache[require.resolve("./bridge.js")];
});

// -------------------------------------------------------------------------
// 2. Commit binding
// -------------------------------------------------------------------------
test("approved sha equals local HEAD binds", () => {
  assert.strictEqual(sentinelBindsToHead(SHA, SHA), true);
});
test("approved sha differing from local HEAD is REJECTED", () => {
  assert.strictEqual(sentinelBindsToHead(SHA, "bd3722d2b9b42503f990b80af7f2ff4a238b1458"), false);
});
test("missing head is REJECTED", () => {
  assert.strictEqual(sentinelBindsToHead(SHA, null), false);
});
test("missing approved sha is REJECTED", () => {
  assert.strictEqual(sentinelBindsToHead(null, SHA), false);
});

// -------------------------------------------------------------------------
// 3. Authorization — end-to-end relay behavior with stub API + injected git
// -------------------------------------------------------------------------
function stubApi(routes) {
  // routes: { path: (req) => ({ status, json }) }
  return http
    .createServer((req, res) => {
      const route = routes[req.url];
      if (!route) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end("[]");
        return;
      }
      const out = route(req);
      res.writeHead(out.status || 200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(out.json));
    })
    .listen(0);
}

function makeComment(authorAgentId, body) {
  return { id: "c-test", authorAgentId, authorType: "agent", body };
}

async function runRelayAgainst(stub, gitInjection) {
  const port = stub.address().port;
  process.env.PAPERCLIP_API_BASE = `http://127.0.0.1:${port}`;
  process.env.PAPERCLIP_CEO_COMPANY_ID = "company-test";
  process.env.PAPERCLIP_REPO_ROOT = "C:/ANTIGRAVITY";
  // Re-require so the env above is read by the production module.
  delete require.cache[require.resolve("./bridge.js")];
  const fresh = require("./bridge.js");
  return fresh.relayJudgeApprovedPushes
    ? fresh.relayJudgeApprovedPushes({ git: gitInjection })
    : { ok: false, reason: "relayJudgeApprovedPushes not exported (test seam incomplete)" };
}

// The relay reads git via runGit internally; for the auth tests we want the
// relay to decide BEFORE any git call. A forged/non-judge comment must not
// even reach git — verified by injecting a git that throws if called.
const gitThatFailsIfCalled = () => {
  throw new Error("git must not be called for rejected authorization");
};

async function closeStub(stub) {
  try {
    if (typeof stub.closeAllConnections === "function") stub.closeAllConnections();
  } catch {
    /* ignore */
  }
  await new Promise((resolve) => stub.close(resolve));
}

(async () => {
  // 3a. Comment from a WORKER (not a judge) — must be rejected, no git call.
  {
    const stub = stubApi({
      "/api/companies/company-test/issues?limit=200": () => ({
        json: [{ id: "i1", identifier: "ANT-X", assigneeAgentId: CODEX_JUDGE, status: "done" }],
      }),
      "/api/issues/i1/comments": () => ({
        json: [makeComment(WORKER, `JUDGE-PUSH ${SHA}`)],
      }),
    });
    const r = await runRelayAgainst(stub, gitThatFailsIfCalled);
    await closeStub(stub);
    test("relay rejects sentinel from a non-judge author (no git call)", () => {
      assert.strictEqual(r.ok, true);
      assert.strictEqual(r.pushed, 0);
      assert.strictEqual(r.seen, 0);
    });
  }

  // 3b. Comment from a judge but on an issue assigned to a worker — rejected.
  {
    const stub = stubApi({
      "/api/companies/company-test/issues?limit=200": () => ({
        json: [{ id: "i2", identifier: "ANT-Y", assigneeAgentId: WORKER, status: "done" }],
      }),
      "/api/issues/i2/comments": () => ({
        json: [makeComment(CODEX_JUDGE, `JUDGE-PUSH ${SHA}`)],
      }),
    });
    const r = await runRelayAgainst(stub, gitThatFailsIfCalled);
    await closeStub(stub);
    test("relay rejects judge sentinel on a non-judge-owned issue (no git call)", () => {
      assert.strictEqual(r.ok, true);
      assert.strictEqual(r.pushed, 0);
      assert.strictEqual(r.seen, 0);
    });
  }

  // 3c. Judge-owned issue, judge comment, but body is a longer verdict —
  //     rejected (exact body required), no git call.
  {
    const stub = stubApi({
      "/api/companies/company-test/issues?limit=200": () => ({
        json: [{ id: "i3", identifier: "ANT-Z", assigneeAgentId: CODEX_JUDGE, status: "done" }],
      }),
      "/api/issues/i3/comments": () => ({
        json: [makeComment(CODEX_JUDGE, `## APPROVE\n\nJUDGE-PUSH ${SHA}\n\nAll good.`)],
      }),
    });
    const r = await runRelayAgainst(stub, gitThatFailsIfCalled);
    await closeStub(stub);
    test("relay rejects sentinel embedded in a longer judge comment (no git call)", () => {
      assert.strictEqual(r.ok, true);
      assert.strictEqual(r.pushed, 0);
      assert.strictEqual(r.seen, 0);
    });
  }

  // 3d. Judge-owned issue, exact judge comment, but approved sha != local
  //     refs/heads/main — rejected at the binding check, before any push.
  //     The injected git returns a DIFFERENT local HEAD and throws on push.
  {
    const differentHead = "bd3722d2b9b42503f990b80af7f2ff4a238b1458"; // != SHA
    const gitWithDifferentHead = (args) => {
      if (args[0] === "rev-parse") {
        return { ok: true, out: differentHead }; // local main HEAD differs
      }
      if (args[0] === "merge-base") {
        return { ok: false, out: "" }; // not merged -> pushable sha path
      }
      throw new Error("git push must not be called for binding rejection");
    };
    const stub = stubApi({
      "/api/companies/company-test/issues?limit=200": () => ({
        json: [{ id: "i4", identifier: "ANT-W", assigneeAgentId: CODEX_JUDGE, status: "done" }],
      }),
      "/api/issues/i4/comments": () => ({
        json: [makeComment(CODEX_JUDGE, `JUDGE-PUSH ${SHA}`)],
      }),
    });
    const r = await runRelayAgainst(stub, gitWithDifferentHead);
    await closeStub(stub);
    test("relay rejects exact sentinel whose sha != local refs/heads/main (no push)", () => {
      assert.strictEqual(r.ok, true);
      assert.strictEqual(r.pushed, 0);
      assert.strictEqual(r.seen, 1);
    });
  }

  await testAsync("disposeWatchdogIssues disposes ONLY the wake's own watchdog issue (no cross-issue sweep)", async () => {
    const patched = {};
    const stub = stubApi({
      "/api/companies/company-test/issues?limit=500": () => ({
        json: [
          // w1 is the wake's own issue -> must be PATCHed.
          { id: "w1", identifier: "ANT-90", title: "Paperclip system-health watchdog: resolve reds and blockers", status: "in_progress" },
          // w2 is ANOTHER open watchdog issue, not this wake's -> a cross-issue
          // write; the disposer must NOT touch it (no route, would 404).
          { id: "w2", identifier: "ANT-91", title: "Paperclip system-health watchdog: resolve reds and blockers", status: "blocked" },
          // Non-watchdog issue, also not this wake's -> untouched.
          { id: "x1", identifier: "ANT-77", title: "Hermes lane: YouTube automations", status: "in_progress" },
          // w3 is this wake's issue but already done -> skipped by status.
          { id: "w3", identifier: "ANT-92", title: "Paperclip system-health watchdog: resolve reds and blockers", status: "done" },
        ],
      }),
      "/api/issues/w1": (req) => {
        patched.w1 = req.headers["x-paperclip-run-id"] || null;
        return { json: { ok: true } };
      },
    });
    const port = stub.address().port;
    const saved = {
      apiBase: process.env.PAPERCLIP_API_BASE,
      company: process.env.PAPERCLIP_CEO_COMPANY_ID,
      key: process.env.PAPERCLIP_CEO_AGENT_KEY,
      wakesDir: process.env.PAPERCLIP_CEO_WAKES_DIR,
    };
    process.env.PAPERCLIP_API_BASE = `http://127.0.0.1:${port}`;
    process.env.PAPERCLIP_CEO_COMPANY_ID = "company-test";
    process.env.PAPERCLIP_CEO_AGENT_KEY = "agent-key-test";
    process.env.PAPERCLIP_CEO_WAKES_DIR = path.join(process.env.TEMP || "/tmp", "relay-test-wakes");
    delete require.cache[require.resolve("./bridge.js")];
    const fresh = require("./bridge.js");
    const res = await fresh.disposeWatchdogIssues(
      { healthy: true, checks: { frontend: { status: "UP" } } },
      { count: 49 },
      { created: [] },
      { checked: 0, seen: 0, pushed: 0 },
      "run-123",
      "w1"
    );
    await closeStub(stub);
    Object.assign(process.env, saved);
    delete require.cache[require.resolve("./bridge.js")];
    require("./bridge.js");
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.checked, 1);
    assert.strictEqual(res.disposed, 1);
    assert.deepStrictEqual(res.disposedIds, ["w1"]);
    assert.strictEqual(patched.w1, "run-123", "PATCH carries the issue-scoped runId header");
    assert.strictEqual(patched.w2, undefined, "another open watchdog issue must NOT be swept cross-issue");
  });

  await testAsync("disposeWatchdogIssues skips (list only, no PATCH) when wake is not scoped to a watchdog issue", async () => {
    // x1 is a non-watchdog issue (harness task wake): one list fetch finds it,
    // it is not watchdog-titled, so no PATCH. The stub has no PATCH route — a
    // PATCH attempt would 404 and fail the test.
    const stub = stubApi({
      "/api/companies/company-test/issues?limit=500": () => ({
        json: [{ id: "x1", identifier: "ANT-77", title: "Hermes lane: YouTube automations", status: "in_progress" }],
      }),
    });
    const port = stub.address().port;
    const saved = {
      apiBase: process.env.PAPERCLIP_API_BASE,
      company: process.env.PAPERCLIP_CEO_COMPANY_ID,
      key: process.env.PAPERCLIP_CEO_AGENT_KEY,
    };
    process.env.PAPERCLIP_API_BASE = `http://127.0.0.1:${port}`;
    process.env.PAPERCLIP_CEO_COMPANY_ID = "company-test";
    process.env.PAPERCLIP_CEO_AGENT_KEY = "agent-key-test";
    delete require.cache[require.resolve("./bridge.js")];
    const fresh = require("./bridge.js");
    const res = await fresh.disposeWatchdogIssues(
      { healthy: true, checks: {} },
      { count: 49 },
      { created: [] },
      { checked: 0, seen: 0, pushed: 0 },
      "run-123",
      "x1" // non-watchdog issue id
    );
    await closeStub(stub);
    Object.assign(process.env, saved);
    delete require.cache[require.resolve("./bridge.js")];
    require("./bridge.js");
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.checked, 0);
    assert.strictEqual(res.disposed, 0);
    assert.ok(res.reason.includes("not an open watchdog issue"), res.reason);
  });

  await testAsync("selfHealEperm clears stale .tmp-* skills and resumes the agent on EPERM failure", async () => {
    const resumed = [];
    const now = new Date().toISOString();
    const stub = stubApi({
      "/api/companies/company-test/heartbeat-runs?agentId=ag-1&limit=20": () => ({
        json: [
          // EPERM skills failure within lookback -> must trigger cleanup+resume.
          { id: "r1", status: "failed", startedAt: now, summary: "EPERM: operation not permitted, rename 'C:\\ANTIGRAVITY\\.claude\\skills\\growth-marketer--x.tmp-14956-1'" },
          // Non-EPERM failure -> ignored.
          { id: "r2", status: "failed", startedAt: now, summary: "Gemini API key is missing or not configured." },
          // Old EPERM (outside lookback) -> ignored.
          { id: "r3", status: "failed", startedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), summary: "EPERM: operation not permitted, rename 'C:\\ANTIGRAVITY\\.claude\\skills\\x.tmp-1'" },
        ],
      }),
      "/api/agents/ag-1/resume": () => {
        resumed.push("ag-1");
        return { json: { ok: true } };
      },
    });
    const skillsDir = path.join(process.env.TEMP || "/tmp", `relay-eperm-${Date.now()}`);
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(path.join(skillsDir, "growth-marketer--x.tmp-14956-1"), "stale");
    fs.writeFileSync(path.join(skillsDir, "growth-marketer--x.tmp-14956-2"), "stale");
    fs.writeFileSync(path.join(skillsDir, "agent-browser"), "symlink-target"); // never touched
    fs.writeFileSync(path.join(skillsDir, "real-skill"), "real dir"); // never touched
    const port = stub.address().port;
    const saved = {
      apiBase: process.env.PAPERCLIP_API_BASE,
      company: process.env.PAPERCLIP_CEO_COMPANY_ID,
      key: process.env.PAPERCLIP_CEO_AGENT_KEY,
      skillsDir: process.env.PAPERCLIP_SKILLS_DIR,
    };
    process.env.PAPERCLIP_API_BASE = `http://127.0.0.1:${port}`;
    process.env.PAPERCLIP_CEO_COMPANY_ID = "company-test";
    process.env.PAPERCLIP_CEO_AGENT_KEY = "agent-key-test";
    process.env.PAPERCLIP_SKILLS_DIR = skillsDir;
    delete require.cache[require.resolve("./bridge.js")];
    const fresh = require("./bridge.js");
    const res = await fresh.selfHealEperm("ag-1");
    await closeStub(stub);
    fs.rmSync(skillsDir, { recursive: true, force: true });
    Object.assign(process.env, saved);
    delete require.cache[require.resolve("./bridge.js")];
    require("./bridge.js");
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.removed, 2, "both stale .tmp-* files cleared");
    assert.strictEqual(res.resumed, true);
    assert.deepStrictEqual(resumed, ["ag-1"], "agent resumed exactly once");
    assert.ok(!fs.existsSync(skillsDir), "temp skills dir cleaned up");
  });

  await testAsync("selfHealEperm does nothing on clean runs (no EPERM, no resume, no sweep)", async () => {
    let swept = 0;
    const now = new Date().toISOString();
    const stub = stubApi({
      "/api/companies/company-test/heartbeat-runs?agentId=ag-2&limit=20": () => ({
        json: [{ id: "r1", status: "succeeded", startedAt: now, summary: "" }],
      }),
    });
    const skillsDir = path.join(process.env.TEMP || "/tmp", `relay-eperm-ok-${Date.now()}`);
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(path.join(skillsDir, "agent-browser"), "keep");
    const port = stub.address().port;
    const saved = {
      apiBase: process.env.PAPERCLIP_API_BASE,
      company: process.env.PAPERCLIP_CEO_COMPANY_ID,
      key: process.env.PAPERCLIP_CEO_AGENT_KEY,
      skillsDir: process.env.PAPERCLIP_SKILLS_DIR,
    };
    process.env.PAPERCLIP_API_BASE = `http://127.0.0.1:${port}`;
    process.env.PAPERCLIP_CEO_COMPANY_ID = "company-test";
    process.env.PAPERCLIP_CEO_AGENT_KEY = "agent-key-test";
    process.env.PAPERCLIP_SKILLS_DIR = skillsDir;
    delete require.cache[require.resolve("./bridge.js")];
    const fresh = require("./bridge.js");
    const res = await fresh.selfHealEperm("ag-2");
    await closeStub(stub);
    const kept = fs.readdirSync(skillsDir);
    fs.rmSync(skillsDir, { recursive: true, force: true });
    Object.assign(process.env, saved);
    delete require.cache[require.resolve("./bridge.js")];
    require("./bridge.js");
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.removed, 0);
    assert.strictEqual(res.resumed, false);
    assert.strictEqual(swept, 0);
    assert.deepStrictEqual(kept, ["agent-browser"], "non-tmp entries untouched");
    assert.ok(res.reason.includes("no EPERM"), res.reason);
  });

  await testAsync("disposeWatchdogIssues skips sweep when health is DOWN (escalation)", async () => {
    const stub = stubApi({
      "/api/companies/company-test/issues?limit=500": () => ({
        json: [{ id: "w1", identifier: "ANT-90", title: "Paperclip system-health watchdog: resolve reds and blockers", status: "in_progress" }],
      }),
    });
    const port = stub.address().port;
    const saved = {
      apiBase: process.env.PAPERCLIP_API_BASE,
      company: process.env.PAPERCLIP_CEO_COMPANY_ID,
      key: process.env.PAPERCLIP_CEO_AGENT_KEY,
    };
    process.env.PAPERCLIP_API_BASE = `http://127.0.0.1:${port}`;
    process.env.PAPERCLIP_CEO_COMPANY_ID = "company-test";
    process.env.PAPERCLIP_CEO_AGENT_KEY = "agent-key-test";
    delete require.cache[require.resolve("./bridge.js")];
    const fresh = require("./bridge.js");
    const res = await fresh.disposeWatchdogIssues(
      { healthy: false, checks: { backend: { status: "DOWN" } } },
      { count: 5 },
      { created: [] },
      { checked: 0, seen: 0, pushed: 0 },
      "run-456",
      "w1"
    );
    await closeStub(stub);
    Object.assign(process.env, saved);
    delete require.cache[require.resolve("./bridge.js")];
    require("./bridge.js");
    assert.strictEqual(res.disposed, 0, "health DOWN must leave the issue for session escalation");
    assert.ok(res.reason.includes("session escalation"), res.reason);
  });

  if (failures) {
    console.error(`\nRELAY TESTS FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log("\nRELAY TESTS PASSED — strict parser + binding + authorization + watchdog dispose (all green)");
  }
})().catch((err) => {
  console.error("RELAY TESTS ERRORED:", err);
  process.exit(1);
});
