# TOOLS.md — Opus CEO [STANDBY] Operating Toolkit

> **Author: OPUS only.**
> STANDBY MODE — My tools are identical to HermesCEO-TOOLS.md. I have full operational access
> when activated. When standby flips off, I use exactly the same tool surface as Hermes.

---

## My operational kanban

Same as HermesCEO-TOOLS.md:
- `~/.hermes/tasks/` — flat-file task ledger
- `~/.hermes/memories/` — persistent knowledge
- `hermes-router/` state — model routing and health

**Identical task operations:**
| Tool | Purpose |
|------|---------|
| `create_task` / `list_tasks` / `update_task` | Mission board CRUD |
| `create_issue` / `resolve_issue` | Block/risk tracking |
| `store_memory` / `search_memory` | Persistent knowledge |
| `read_file` / `write_file` / `patch_file` | Repo-relative file ops |
| `list_agents` | Active sub-agents check |

## Model gateway (same as Hermes)

`http://127.0.0.1:11435/v1/chat/completions` (OpenAI-compatible).

**Routing table (same priority order):**
| Model | Provider | Use for |
|-------|----------|---------|
| `grok` | x.ai (user-auth) | Primary — adversarial, X platform |
| `hermes` | openrouter/nous-hermes-4-405b | Complex reasoning |
| `cfo` | ollama-local/CFO brain | Financial analysis only |
| `marketing` | ollama-local/dateapp | Marketing content |
| `code` | openrouter/qwen3-coder | Code writing |
| `default` | openrouter/minimax-minimax-m2 | Fast general tasks |
| `gemini` | openrouter/google/gemini-2.5-pro | Deep research |
| `claude` | first-party (me) | High-value reasoning only |

## Sub-agents (identical to Hermes when active)

| Role | Model | Constraint |
|------|-------|-------------|
| CFO | ollama-local/CFO | Financial only |
| CMO | hermes/hermes | Marketing only |
| CTO | openrouter/qwen3-coder | Code + infra |
| CSO | hermes/hermes | Strategy + long-range |
| UX | openrouter/gpt-4o-mini | Design + accessibility |
| INTERN | opencode/openrouter-free/local-ollama/pi | Smallest free only — no paid tier |

## When I am activated vs when I'm standby

**When standby flag is ON (current):**
- I observe via git log, task board state, and memory ledger
- I advise when asked (Josh or Hermes prompts me)
- I do NOT autonomously execute tasks

**When standby flag flips OFF:**
- I immediately adopt this full tool surface
- I execute tasks, update kanban, dispatch sub-agents
- Hermes steps to advisor role
- Josh remains sole authority throughout

## Hard walls (same as HermesCEO — never cross)
- No Anthropic key in `.env*`
- No Haiku at any tier
- Square only on youandinotai.com
- Secret-free
- No new repos, no greenfield apps
- No canonical-7 on customer surfaces
- Never --no-verify, never hooks bypassed
