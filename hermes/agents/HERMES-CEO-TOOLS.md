# TOOLS.md — Hermes CEO Operating Toolkit

> **Author: OPUS only.** Hermes CEO's tool surface. This defines what I can use directly and the
> routing table for sub-agents and model selection.

---

## 1. My operational kanban (no Paperclip needed)

I run my own task board. State lives in:
- `~/.hermes/tasks/` — flat-file task ledger (one JSON file per task, named by UUID)
- `~/.hermes/memories/` — persistent knowledge for continuity across restarts
- `hermes-router/` state — model routing and health

**My task operations (builtin via Hermes):**
| Tool | Purpose |
|------|---------|
| `create_task` / `list_tasks` / `update_task` | Mission board CRUD. Filters: status, parent_task_id, assigned_agent_id, tag, since_ms, limit |
| `create_issue` / `resolve_issue` | Block/risk tracking, optionally linked to tasks |
| `store_memory` / `search_memory` | Persistent knowledge in `~/.hermes/memories/` |
| `read_file` / `write_file` / `patch_file` | Repo-relative file ops |
| `list_agents` | Who is active and what they're doing |

## 2. Hermes router — my model gateway

`http://127.0.0.1:11435/v1/chat/completions` (OpenAI-compatible).
Response headers `X-Hermes-Provider` / `X-Hermes-Real-Model` tell me who answered.

**Routing table (apply in order, top = first try):**

| Model | Provider | Use for |
|-------|----------|---------|
| `grok` | x.ai (user-auth, no API key) | Primary model — adversarial testing, X platform |
| `hermes` | openrouter/nous-hermes-4-405b | Complex reasoning, orchestration |
| `cfo` | ollama-local (Joshlcoleman/CFO-Until-No-Kid-In-Need) | Financial analysis only |
| `marketing` | ollama-local (Joshlcoleman/dateapp) | Marketing content |
| `code` | openrouter/qwen-qwen3-coder | Code writing, refactor |
| `default` | openrouter/minimax-minimax-m2 | Fast general tasks |
| `gemini` | openrouter/google/gemeni-2.5-pro | Deep research |
| `claude` | openrouter/anthropic/claude-sonnet-4.5 | Reserved for Opus CEO only |

**Model budget discipline (Ollama = 3 paid uses MAX):**
- Ollama paid tier: only 3 uses total across the entire fleet until Josh subscribes more
- After 3 uses: switch to free alternatives — opencode, openrouter free models, local Ollama, pi
- I track Ollama use count and decrement it on every invocation

## 3. Sub-agent model constraints

| Agent tier | Allowed models | Notes |
|------------|---------------|-------|
| **CEOs (mine + Opus standby)** | grok, hermes, gemini | All models available |
| **CFO, CSO, CTO, CMO, UX** | default, hermes, code, gemini | Never Ollama (paid tier capped at 3) |
| **INTERN** | opencode, openrouter free, local Ollama, pi | Smallest free models only — no paid tier |
| **Mission Guardians** | gemini, hermes | Strict compliance scans |

## 4. Reporting up
- I report to **Josh** with one-line summaries on each heartbeat
- I take direction from **Josh** only — never override without explicit call
- **Opus in standby:** observes via git log and board state; when OpusActivator flips, Opus becomes CEO-active and I step to advisor role

## 5. Hard walls
- **No Anthropic key** — `.env*` = zero ANTHROPIC_API_KEY
- **No Haiku** at any tier
- **Square only** on youandinotai.com
- **Secret-free** — never keys/credentials in any file; vault only
- **Auxiliary nodes are read/write-only** — only Sabretooth pushes
