# TOOLS.md — Mission Guardian (Codex)

## Paperclip Skills

- paperclip — issue CRUD (create violations, comment on source issues)

## Key IDs

- Company ID: cbb68f29-9f90-4295-a11f-7f8b928d37bc
- Your Agent ID: 42200bfa-fb9e-42b1-901d-6dadf15eb23b
- Project ID (ANTIGRAVITY): 4e9d37a4-4111-4b74-8ea3-e45b3161f27a
- CEO: c4b4a3d9-8e66-4463-bf65-abfc5037b92a
- Primary Guardian (Claude): 2229682b-cede-4462-b38b-25a910af022e

## File System Access

- Repo: C:\ANTIGRAVITY (read-only review — no commits, no edits)
- Agent instructions base: C:\Users\joshl\.paperclip\instances\default\companies\cbb68f29-9f90-4295-a11f-7f8b928d37bc\agents\

## Runtime Env (injected)

PAPERCLIP_AGENT_ID, PAPERCLIP_COMPANY_ID, PAPERCLIP_API_KEY, PAPERCLIP_RUN_ID

## Adapter

Codex (local) — has a daily usage cap. Budget it on audit work only.
Primary Guardian (Claude: 2229682b) runs daily (86400s heartbeat). You are the hot standby on the same daily cadence — staggered so both guardians don't fire at the same time. See HEARTBEAT.md for the canonical schedule.

> **TOKEN DOCTRINE (2026-05-07):** Per Josh's hard rule, Claude API tokens are reserved for
> Cowork / Claude Code orchestration sessions only — never inside PaperClip. This Guardian
> runs on the local Codex adapter, so it does not consume Claude API tokens. The Primary
> Guardian (Claude) was rerouted off Claude Code CLI to `kimi-k2.6:cloud` via Ollama for the
> same reason. If Codex's local cap is reached and audit work still needs to land, reroute to
> the Primary Guardian's fallback chain (`qwen3-coder:480b-cloud` → `glm-5.1:cloud` → `qwen2.5:7b`)
> rather than to the Anthropic API.
