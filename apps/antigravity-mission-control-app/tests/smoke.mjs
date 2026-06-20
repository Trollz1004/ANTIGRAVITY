import assert from "node:assert/strict";
import {
  getEnvDriftSummary,
  getMissionStatus,
  prepareCodexExecutionPrompt,
  readSafeSource,
  resolveSafeSource,
  runTool,
  WINDOWS_ROOT,
  WSL_ROOT
} from "../lib/mission-data.mjs";

const status = await getMissionStatus();
assert.equal(status.repo.windowsRoot, WINDOWS_ROOT);
assert.equal(status.repo.wslRoot, WSL_ROOT);
assert.equal(status.safetyPolicy.toolMode, "read-only and draft-first");
assert(status.safetyPolicy.blocked.includes("read populated .env files"));

const drift = await getEnvDriftSummary();
assert.equal(drift.policy, "placeholder-only inventory; never read populated env files");
assert(Array.isArray(drift.nextActions));

const prompt = prepareCodexExecutionPrompt({ task: "fix CI without touching secrets" });
assert.match(prompt.prompt, /c:\\antigravity/);
assert.match(prompt.prompt, /Do not use ollama launch codex/);

const handoff = await runTool("draft_handoff", { topic: "safe app smoke test" });
assert.match(handoff.text, /draft-only/);

assert.throws(() => resolveSafeSource("missing"), /Unknown safe source/);
await assert.rejects(() => readSafeSource("missing"), {
  name: "Error"
});

console.log("mission-control-app smoke checks passed");
