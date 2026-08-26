/**
 * Adapter contract tests — the wake-status bridge protocol:
 *
 *   1. execute() writes `<runId>.json` with `status: "pending"` (the session
 *      only lists pending wakes), then polls that same field.
 *   2. The session reports through the bridge; the bridge writes
 *      `status: "done"|"failed"` into the wake file (bridge.js handleDone).
 *   3. execute() maps that onto AdapterExecutionResult, then removes its own
 *      wake file. On timeout it reports an honest failure and leaves the wake
 *      in place. Missing prompt = clean error, no wake written.
 *
 * Run: node ops/paperclip-ceo/adapter-freebuff/adapter.test.js
 */
import { createServerAdapter } from "./index.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

let failures = 0;
function assert(cond, label) {
  if (cond) {
    console.log(`  ok: ${label}`);
  } else {
    failures++;
    console.error(`  FAIL: ${label}`);
  }
}

const adapter = createServerAdapter();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "freebuff-adapter-"));
const wakeFile = (runId) => path.join(tmp, `${runId}.json`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Start execute(), wait for its wake to land, then mutate the wake as the
 *  bridge would. Returns the resolved AdapterExecutionResult. */
async function runWithBridge(runId, mutate) {
  const pending = adapter.execute({
    runId,
    agent: { id: "test", name: "Test" },
    config: { wakesDir: tmp, timeoutSec: 15 },
    context: { prompt: "say hi" },
    onLog: async () => {},
  });
  const deadline = Date.now() + 5000;
  while (!fs.existsSync(wakeFile(runId)) && Date.now() < deadline) await sleep(20);
  assert(fs.existsSync(wakeFile(runId)), `${runId}: wake written while run in flight`);
  assert(
    JSON.parse(fs.readFileSync(wakeFile(runId), "utf8")).status === "pending",
    `${runId}: wake starts as pending`,
  );
  if (mutate) {
    const wake = JSON.parse(fs.readFileSync(wakeFile(runId), "utf8"));
    mutate(wake);
    fs.writeFileSync(wakeFile(runId), JSON.stringify(wake, null, 2), "utf8");
  }
  return pending;
}

console.log("1. export shape");
assert(typeof adapter.type === "string" && adapter.type.length > 0, "module has type");
assert(typeof adapter.execute === "function", "execute is a function");
assert(typeof adapter.testEnvironment === "function", "testEnvironment is a function");
assert(typeof adapter.getConfigSchema === "function", "getConfigSchema is a function");

console.log("2. execute — bridge wake-status resolution");
const resolveCases = [
  {
    runId: "done",
    mutate: (w) => {
      w.status = "done";
      w.completedAt = new Date().toISOString();
    },
    expectExit: 0,
    expectTimedOut: false,
    expectResult: null,
    label: "status done → success, wake cleaned up",
  },
  {
    runId: "failed",
    mutate: (w) => {
      w.status = "failed";
      w.errorMessage = "session hit a red";
    },
    expectExit: 1,
    expectTimedOut: false,
    expectErr: /red/,
    label: "status failed → failure with errorMessage, wake cleaned up",
  },
];
for (const c of resolveCases) {
  const exec = await runWithBridge(c.runId, c.mutate);
  assert(exec.exitCode === c.expectExit, c.label);
  assert(exec.timedOut === c.expectTimedOut, `${c.runId}: timedOut = ${c.expectTimedOut}`);
  if (c.expectErr) assert(c.expectErr.test(String(exec.errorMessage)), `${c.runId}: errorMessage carried`);
  assert(!fs.existsSync(wakeFile(c.runId)), `${c.runId}: wake removed after resolution`);
}

console.log("3. execute — timeout is an honest failure, wake left in place");
const short = await adapter.execute({
  runId: "timeout-short",
  agent: { id: "test", name: "Test" },
  config: { wakesDir: tmp, timeoutSec: 2 },
  context: { prompt: "say hi" },
  onLog: async () => {},
});
assert(short.timedOut === true, "timedOut true");
assert(short.exitCode === 1, "exitCode 1");
assert(typeof short.errorMessage === "string" && short.errorMessage.length > 0, "errorMessage present");
assert(fs.existsSync(wakeFile("timeout-short")), "wake left in place on timeout");

console.log("4. execute — missing prompt, clean error, no wake written");
const noPrompt = await adapter.execute({
  runId: "no-prompt",
  agent: { id: "test", name: "Test" },
  config: { wakesDir: tmp, timeoutSec: 3 },
  context: {},
  onLog: async () => {},
});
assert(noPrompt.exitCode === 1, "exitCode 1");
assert(!fs.existsSync(wakeFile("no-prompt")), "no wake written for missing prompt");

console.log("5. testEnvironment (live)");
const env = await adapter.testEnvironment({ companyId: "test", adapterType: adapter.type, config: {} });
assert(env.adapterType === adapter.type, "adapterType echoed");
assert(["pass", "warn", "fail"].includes(env.status), `status valid (${env.status})`);
assert(Array.isArray(env.checks) && env.checks.length > 0, "checks present");
console.log("  checks:", env.checks.map((c) => `${c.code}:${c.level}`).join(", "));

fs.rmSync(tmp, { recursive: true, force: true });

console.log(failures === 0 ? "ALL ADAPTER CHECKS PASSED" : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
