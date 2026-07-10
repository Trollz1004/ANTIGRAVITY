# ROSTER — PaperclipAI + Agent Hub Architecture

> Updated 2026-07-05. PaperclipAI stays as the visible board/CEO cockpit.
> Agent Hub is the backend task-routing bridge every AI can target.
> Joshua's Law: every agent reads STATE.md on start, writes on exit. See .agents/BOOT.md.

## Repo

**ONE repo**: `https://github.com/Trollz1004/ANTIGRAVITY`
- `main` — ANTIGRAVITY (everything)
- DREAM ONLINE files live on the portable E: drive, not a long-lived repo branch.

## Node Assignment (FINAL)

| Node | IP | Role | Orchestration |
|---|---|---|---|
| Sabretooth C: | 192.168.0.8 | Dev/control plane: first-party Mission Control :3110, Agent Hub :3130, official Codex/OpenAI work, repo authority | Mission Control + Agent Hub |
| Sabretooth E: | portable drive | DREAM ONLINE root: `E:\CLAUDE's-N-Joshua's-Dream-Online-MMORPG` | Agent Hub tasks, local DREAM memory |
| T5500 | 192.168.0.15 | Front door/dateapp/Hermes workbench/OmniRouter/node balancer. No Agent Hub authority. | Cloudflared + Hermes + OmniRouter |
| 9020 | 192.168.0.5 | Legacy support only unless Joshua explicitly changes it | none |
| worker-web-1 | pending | i5-6600 web/API replica worker | none |
| worker-ai-1 | pending | i5-6600 AI adapter worker for OmniRouter/FCC/OpenCode/Ollama/OpenClaw | none |
| mini-asus | pending | Thin display/manual check-in only | none |

## Platforms - routed by Agent Hub, not all running on Sabretooth

| Platform | Auth | Use |
|---|---|---|
| hermes | T5500/dashboard | Hermes workbench lane: growth, support, research, leads |
| fcc-claude | FCC proxy | Claude helper lane: code, compliance, PR/payment gates |
| claude | Max subscription | Sup@ user guide sphere (DREAM) |
| opencode | NVIDIA free | Code tasks |
| ollama | localhost | Local models |
| cloud | openrouter | Cloud relay via Hermes |
| omni-router | node env | Token-saving/API routing for worker tasks |
| 1minai | desktop app | DREAM NPC AI |
| odysseus | localhost :7000 | Odysseus AI |
| clawx | local GUI/gateway | Hands-on operator/orchestration peer; approved keyboard tools and task-scoped subagents assigned to explicit nodes by Joshua |
| anythingllm | local knowledge workspace | Preferred customer-support and grounded retrieval lane |
| pi | localhost | Conversational |
| github | PAT | Issue sync |
| slack | bot token | Notifications |
| codex | browser | OpenAI Codex |
| openai | browser | OpenAI API |
| grok | browser | xAI Grok |
| gemini | browser | Google Gemini |
| chatgpt | browser | ChatGPT |
| perplexity | browser | Perplexity Pro |
| cursor | desktop | Cursor IDE |
| desktop | manual | Any GUI tool |
| commander | none | Terminal tasks |

## Skills

201 skills in `.agents/skills/` at the 2026-07-10 verified index. Every agent loads skills on demand.
Every platform session reads `.agents/BOOT.md` first. No exceptions.

## Slack Channels

| Channel | Receives |
|---|---|
| #antigravity-platform | All task events (default) |
| #dream-online | DREAM tasks (platform: 1minai) |

## Agent Hub API (Sabretooth :3130)

```
http://192.168.0.8:3130/api/entities/AgentTask    — CRUD
http://192.168.0.8:3130/api/mcp/tools             — MCP for FCC-Claude
http://192.168.0.8:3130/api/dispatch/routes       — Platform routing
http://192.168.0.8:3130/health                    — Health check
```
