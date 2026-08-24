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

process.env.PAPERCLIP_BRIDGE_NO_LISTEN = "1";
process.env.PAPERCLIP_JUDGE_AGENT_IDS =
  "32375fe9-c3a3-46bf-ad46-4126d1c3d49e,d254fb31-abec-42f7-8cc2-bad261fbdf48";

const bridge = require("./bridge.js");
const { parseJudgePushSentinel, sentinelBindsToHead, JUDGE_PUSH_SENTINEL } = bridge;

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
      const out = route();
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

  if (failures) {
    console.error(`\nRELAY TESTS FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log("\nRELAY TESTS PASSED — strict parser + binding + authorization (all green)");
  }
})().catch((err) => {
  console.error("RELAY TESTS ERRORED:", err);
  process.exit(1);
});
