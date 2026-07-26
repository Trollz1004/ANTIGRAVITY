# Agent Hub Design — 2026-07-26

## Goal
Combine OmniRoute, Hermes, agency skills, Claude Code CLI, OpenClaw, and memory MCP into one accessible agent coordination surface. Designed for ease of use, not enterprise-grade complexity.

## Current Assets (Already Live)
- OmniRoute `:20128` — free-model load balancer across 100+ providers
- Hermes Agent — Telegram/WhatsApp router, owns mission control + kanban
- Agency skills — designer, ux-master, youtube-creator, content-poster, information-architect, content-strategist
- OpenClaw — customer-service + dev instance on T5500 (`:18789`)
- Claude Code CLI — Bucket 1 only, last resort for irreversible work
- Memory MCP — Supabase MCP + local Vite cache
- Node map — T5500 (powerstation), Sabretooth (def), 9020 (standby)

## Proposed Agent Hub Layout
- **Entry point:** Hermes CLI + Telegram/WhatsApp commands
- **Skill dispatch:** Each sub-agent gets ONE skill, ONE model tier, ONE job
- **Model routing:** OmniRoute `:20128` → local Ollama first, then free-tier providers
- **Memory:** Shared `briefings/` + Supabase MCP for cross-agent state
- **Node branching:** T5500 (date app + checkout), Sabretooth (dev/Dream), 9020 (income/X/standby)
- **No Anthropic API** — hard wall holds; Claude Code CLI only via Bucket 1

## Design Principles
1. **Simple first** — no thousand-person layoff system design
2. **Free defaults** — local Ollama + OpenRouter free + Gemini CLI free tier
3. **Single repo, single branch** — `ANTIGRAVITY/main`
4. **Founder approval gates** — only critical changes need Josh sign-off
5. **No secret echo** — values never in chat/files/memory

## Next Steps (Pending Josh Approval)
1. Wire Agent Hub CLI alias to Hermes (`hermes agent hub`)
2. Map each agency skill to a runnable sub-agent template
3. Add OmniRoute failover matrix to `ops/CLI-COMMANDS-REFERENCE.md`
4. Document OpenClaw spawn/return protocol for dev lane

## Risk Notes
- Adding centralized orchestration increases blast radius if Hermes is misconfigured
- OmniRoute is a shared dependency; if it goes down, all free-model routing fails
- Claude Code CLI is Bucket 1 only — accidental invocations from weak models must be blocked at Hermes layer
