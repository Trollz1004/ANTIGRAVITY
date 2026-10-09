#!/usr/bin/env node
// agy-gemini shim (2026-10-09)
//
// Paperclip's gemini_local adapter speaks gemini-cli. Joshua's Gemini Ultra subscription
// is reached through the Antigravity CLI (`agy`), signed in with his Google account
// (OAuth, never an API key). This shim lets Paperclip agents set
//   command = C:\ANTIGRAVITY\ops\paperclip\agy-gemini.cmd
// and run on agy unchanged.
//
// In:  gemini-cli flags from the adapter  -> translated to agy flags
// Out: agy stream-json events             -> gemini-cli stream-json events the adapter parses
//
//   --approval-mode yolo   -> --dangerously-skip-permissions
//   --resume <id>          -> --conversation <id>
//   --sandbox=none         -> (dropped; agy default is no sandbox)
//   --sandbox              -> --sandbox
//   --prompt/-p, --model, --output-format pass through
//
// agy events:  init | step_update{step_type, state, text_delta} | result{status, response, usage}
// emitted:     {type:"init"} | {type:"message",role:"assistant"} | {type:"tool_use"} | {type:"result"}
// Every emitted event carries session_id = agy conversation_id so Paperclip can resume.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import readline from "node:readline";

const AGY_CANDIDATES = [
  process.env.AGY_BIN,
  join(process.env.LOCALAPPDATA || "", "Microsoft", "WinGet", "Links", "agy.exe"),
  "agy",
].filter(Boolean);
const AGY = AGY_CANDIDATES.find((p) => p === "agy" || existsSync(p));

const inArgs = process.argv.slice(2);
const out = [];
let streamJson = false;
let printMode = false;
for (let i = 0; i < inArgs.length; i++) {
  const a = inArgs[i];
  const next = () => inArgs[++i];
  if (a === "--approval-mode") { const m = next(); if (m === "yolo") out.push("--dangerously-skip-permissions"); continue; }
  if (a.startsWith("--approval-mode=")) { if (a.endsWith("=yolo")) out.push("--dangerously-skip-permissions"); continue; }
  if (a === "--yolo" || a === "-y") { out.push("--dangerously-skip-permissions"); continue; }
  if (a === "--resume" || a === "-r") { out.push("--conversation", next()); continue; }
  if (a.startsWith("--resume=")) { out.push("--conversation", a.slice(9)); continue; }
  if (a === "--sandbox=none" || a === "--sandbox=false") continue;
  if (a.startsWith("--sandbox=")) { out.push("--sandbox"); continue; }
  if (a === "--output-format") { const f = next(); streamJson = f === "stream-json"; out.push("--output-format", f); continue; }
  if (a.startsWith("--output-format=")) { streamJson = a.endsWith("=stream-json"); out.push(a); continue; }
  if (a === "--prompt" || a === "-p" || a === "--print") { printMode = true; out.push("--print", next()); continue; }
  if (a === "--version" || a === "-v") { out.push("--version"); continue; }
  // gemini-cli-only flags agy does not know: drop with their values
  if (a === "--checkpointing" || a === "--debug" || a === "-d") continue;
  if (a === "--include-directories") { for (const d of String(next()).split(",")) out.push("--add-dir", d); continue; }
  out.push(a);
}
if (printMode && !out.includes("--print-timeout")) out.push("--print-timeout", "0s");

const child = spawn(AGY, out, { stdio: ["inherit", streamJson ? "pipe" : "inherit", "inherit"], windowsHide: true });
child.on("error", (e) => {
  const msg = `agy-gemini shim: cannot start agy (${AGY}): ${e.message}`;
  if (streamJson) process.stdout.write(JSON.stringify({ type: "result", status: "error", is_error: true, error: msg }) + "\n");
  else process.stderr.write(msg + "\n");
  process.exit(127);
});
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { try { child.kill(sig); } catch {} });

if (streamJson) {
  const emit = (o) => process.stdout.write(JSON.stringify(o) + "\n");
  let sessionId = null;
  const stepText = new Map();
  let sawResult = false;
  const rl = readline.createInterface({ input: child.stdout });
  rl.on("line", (line) => {
    let ev;
    try { ev = JSON.parse(line); } catch { if (line.trim()) emit({ type: "system", subtype: "log", message: line, session_id: sessionId }); return; }
    const kind = ev.event;
    if (kind === "init") {
      sessionId = ev.conversation_id || sessionId;
      emit({ type: "init", session_id: sessionId, cwd: ev.init?.cwd, tools: ev.init?.tools, model: ev.init?.model });
      return;
    }
    if (kind === "step_update") {
      const s = ev.step_update || {};
      sessionId = s.conversation_id || sessionId;
      const idx = s.step_index;
      if (s.step_type === "agent_response") {
        stepText.set(idx, (stepText.get(idx) || "") + (s.text_delta || ""));
        if (s.state === "DONE") {
          const text = (stepText.get(idx) || "").trim();
          stepText.delete(idx);
          if (text) emit({ type: "message", role: "assistant", content: text, session_id: sessionId });
        }
        return;
      }
      if (s.state === "DONE" && s.step_type && !["user_input", "unknown"].includes(s.step_type)) {
        emit({ type: "tool_use", tool_name: s.step_type, tool_id: `${sessionId}:${idx}`, parameters: s.tool_input ?? {}, session_id: sessionId });
      }
      return;
    }
    if (kind === "result") {
      sawResult = true;
      const r = ev.result || {};
      sessionId = r.conversation_id || sessionId;
      const ok = String(r.status || "").toUpperCase() === "SUCCESS";
      const u = r.usage || {};
      emit({
        type: "result",
        status: ok ? "success" : "error",
        is_error: !ok,
        response: r.response || "",
        error: ok ? undefined : (r.error || r.response || `agy status ${r.status}`),
        session_id: sessionId,
        usage: { input_tokens: u.input_tokens || 0, output_tokens: (u.output_tokens || 0), cached_input_tokens: u.cache_read_tokens || 0 },
        duration_ms: Math.round((r.duration_seconds || 0) * 1000),
        num_turns: r.num_turns,
      });
      return;
    }
    if (kind === "error") { emit({ type: "error", error: ev.error || ev.message || line, session_id: sessionId }); return; }
  });
  child.on("close", (code) => {
    if (!sawResult && code !== 0) emit({ type: "result", status: "error", is_error: true, error: `agy exited ${code}`, session_id: sessionId });
    process.exit(code ?? 1);
  });
} else {
  child.on("close", (code) => process.exit(code ?? 1));
}
