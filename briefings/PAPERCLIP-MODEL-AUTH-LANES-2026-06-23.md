# Paperclip model auth lanes - 2026-06-23

Scope: T5500 Paperclip date-app/customer-support ops package at
`C:\antigravity-paperclip-dateapp-ops`.

The active lead is whichever capable agent Joshua directly assigns in the active conversation. Paperclip, Hermes, Codex, Claude, Gemini, Meta/Llama, Manus, FCC, OpenCode, Ollama, and other lanes may lead only when Joshua directly assigns them or when their role map already covers the task. Otherwise they collect evidence, draft proposals, and report to the active lead.

There is no permanent AI boss. The guardrails restrict autonomous or delegated model behavior, not Joshua's direct instruction. When Joshua directly assigns a task to Claude, Codex/OpenAI, Gemini, Meta/Llama, Manus, Hermes, Paperclip, FCC, OpenCode, Ollama, or another capable system, that named system becomes the active lead for that task.

Secret source:

- `C:\Users\joshl\.fcc\.env` is loaded by
  `C:\antigravity-paperclip-dateapp-ops\scripts\load-fcc-provider-env.ps1`.
- The loader is called with the absolute Joshua path so scheduled tasks running
  as SYSTEM do not miss provider auth.
- Secret values must not be printed, committed, or copied into docs.

Private Paperclip access:

- Auth proxy: `127.0.0.1:3110`.
- Paperclip upstream: `127.0.0.1:3100`.
- Proxy accepts Codex bearer auth and Basic auth with user `codex` plus the
  Codex token.
- Proxy strips external `Authorization` before forwarding to Paperclip so
  upstream API calls do not reject valid proxy auth.
- Old `codex/codex` Basic auth is rejected.

Model lanes registered/tracked:

- OpenCode Ollama Worker: `opencode_local`, executable model
  `ollama/minimax-m2.5:cloud`, Joshua-facing alias `Ollama.minimax3.cloud`.
- OpenCode Free Cloud Worker: `opencode_local`, executable model
  `opencode/big-pickle`.
- OpenRouter OpenAI Codex Worker: `process`, executable model
  `openrouter/openai/gpt-5.1-codex-codex-max`.
- OpenRouter OpenAI Regular Worker: `process`, executable model
  `openrouter/openai/gpt-5.5`, worker-only fallback.
- OpenRouter NVIDIA Worker: `process`, executable model
  `openrouter/nvidia/nemotron-3-super-120b-a12b`.
- OpenRouter Grok Worker: `process`, executable model
  `openrouter/x-ai/grok-4.20`.
- Gemini Cloud Worker: `gemini_local`, executable model
  `openrouter/google/gemini-2.5-pro`.
- Pi Worker: `pi_local`, executable model `google/gemini-2.5-pro`, with
  `Ollama.minimax3.cloud` retained as desired/display alias until Pi lists or
  custom-defines that Ollama/minimax model.
- Official OpenClaw Support: support-only, no policy/payment/doctrine/control
  authority.

Important implementation detail:

Paperclip's native `opencode_local` adapter currently validates only the built-in
OpenCode UI model list. OpenRouter Codex, OpenAI regular, NVIDIA, and Grok lanes
therefore run as process-backed OpenCode workers with command metadata equivalent
to `opencode run -m <provider/model>` after loading the FCC provider env.

Heartbeat and memory files:

- Every ops agent has `SOUL.md`, `SKILL.md`, `TOOLS.md`, `HEARTBEAT.md`,
  `SELF_IMPROVEMENT.md`, and `MEMORY.md`.
- Heartbeats append compact timestamped JSONL with file locations to
  `heartbeats/`, `logs/heartbeats/`, `memory/timeline.jsonl`, and `graphy/`.

Runtime checks performed on T5500:

- `PaperclipDateAppLoopback` restarted.
- `PaperclipPrivateAuthProxy` restarted.
- Proxy checks: health 200, unauth 401, old Basic auth 401, bearer token 200,
  Basic token 200.
- OpenCode provider catalog showed Ollama/minimax cloud, OpenRouter OpenAI
  Codex, OpenRouter NVIDIA, OpenRouter Grok/xAI, and OpenRouter Gemini model
  IDs after FCC env load.
- Pi now returns a provider model table; executable Pi model set to
  `google/gemini-2.5-pro` because Pi requires an exact provider/model ID from
  `pi --list-models`.