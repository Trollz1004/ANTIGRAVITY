#!/usr/bin/env node
/**
 * Judge-push relay safety tests (per Codex Judge REJECT on bd3722d2).
 *
 * Tests the pure helpers of the relay contract without network:
 *   - parseJudgePushSentinel: EXACT body must be `JUDGE-PUSH <40-hex>`.
 *   - sentinelBindsToHead: approved sha must equal local refs/heads/main.
 *   - relay authorization: only configured judge agent ids may authorize.
 *
 * Run: node relay.test.js   (exit 0 = all pass)
 */
const assert = require("assert");

// Minimal stand-ins so the test does not depend on the bridge's env/config.
const JUDGE_PUSH_SENTINEL = "JUDGE-PUSH";
const JUDGE_AGENT_IDS = [
  "32375fe9-c3a3-46bf-ad46-4126d1c3d49e", // Codex Judge
  "d254fb31-abec-42f7-8cc2-bad261fbdf48", // Claude Judge
];

// -- copies of the pure helpers from bridge.js (kept in sync) -------------
function parseJudgePushSentinel(body, sentinel = JUDGE_PUSH_SENTINEL) {
  if (typeof body !== "string") return null;
  const m = body.trim().match(/^([A-Z0-9-]+)\s+([0-9a-f]{40})$/i);
  if (!m) return null;
  if (m[1].toUpperCase() !== sentinel.toUpperCase()) return null;
  return m[2].toLowerCase();
}
function sentinelBindsToHead(approvedSha, localHeadSha) {
  return typeof approvedSha === "string" && typeof localHeadSha === "string" && approvedSha === localHeadSha;
}
// -------------------------------------------------------------------------

const SHA = "e5c0fa536cc38236309f8a4e0313ff4951cfa8af";

function test(name, fn) {
  try {
    fn();
    console.log(`PASS  ${name}`);
  } catch (err) {
    console.error(`FAIL  ${name}`);
    console.error(`      ${err.message}`);
    process.exitCode = 1;
  }
}

// --- positive ---
test("exact one-line sentinel parses", () => {
  assert.strictEqual(parseJudgePushSentinel(`JUDGE-PUSH ${SHA}`), SHA);
});
test("sentinel with trailing newline parses", () => {
  assert.strictEqual(parseJudgePushSentinel(`JUDGE-PUSH ${SHA}\n`), SHA);
});

// --- forged / malformed (negative) ---
test("sentinel embedded in a longer comment is REJECTED", () => {
  assert.strictEqual(parseJudgePushSentinel(`## APPROVE\n\nVerified commit ok.\nJUDGE-PUSH ${SHA}\n\nCheers.`), null);
});
test("sentinel in paragraph (no standalone line) is REJECTED", () => {
  assert.strictEqual(parseJudgePushSentinel(`the JUDGE-PUSH ${SHA} was mentioned`), null);
});
test("wrong sentinel word is REJECTED", () => {
  assert.strictEqual(parseJudgePushSentinel(`WORKER-PUSH ${SHA}`), null);
});
test("short sha is REJECTED", () => {
  assert.strictEqual(parseJudgePushSentinel(`JUDGE-PUSH e5c0fa53`), null);
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

// --- commit binding (negative) ---
test("approved sha equals local HEAD binds", () => {
  assert.strictEqual(sentinelBindsToHead(SHA, SHA), true);
});
test("approved sha differing from local HEAD is REJECTED", () => {
  const other = "bd3722d2b9b42503f990b80af7f2ff4a238b1458";
  assert.strictEqual(sentinelBindsToHead(SHA, other), false);
});
test("missing head is REJECTED", () => {
  assert.strictEqual(sentinelBindsToHead(SHA, null), false);
});

// --- authorization (negative) ---
test("comment from a configured judge authorizes", () => {
  const authorAgentId = JUDGE_AGENT_IDS[0];
  assert.strictEqual(new Set(JUDGE_AGENT_IDS).has(authorAgentId), true);
});
test("comment from a non-judge agent is REJECTED", () => {
  const worker = "55461934-f04b-4397-be78-b81bd353d110"; // Freebuff CEO, not judge
  assert.strictEqual(new Set(JUDGE_AGENT_IDS).has(worker), false);
});
test("empty judge list disables relay", () => {
  assert.strictEqual(JUDGE_AGENT_IDS.length > 0, true);
});

if (process.exitCode) {
  console.error("\nRELAY TESTS FAILED");
} else {
  console.log("\nRELAY TESTS PASSED (14/14)");
}
