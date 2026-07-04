# ROSTER — Agent Hub Architecture

> Updated 2026-07-04. Agent Hub replaces Paperclip for ANTIGRAVITY.
> Sabretooth keeps Paperclip for DREAM-specific orchestration.
> Joshua's Law: every agent reads STATE.md on start, writes on exit. See .agents/BOOT.md.

## Repo

**ONE repo**: `https://github.com/Trollz1004/ANTIGRAVITY`
- `main` — ANTIGRAVITY (everything)
- `dream-online` — DREAM MMORPG (same monorepo, separate branch)

## Node Assignment (FINAL)

| Node | IP | Role | Orchestration |
|---|---|---|---|
| T5500 | gateway | ALL services + Agent Hub :3130 | Agent Hub |
| Sabretooth | 192.168.0.8 | DREAM ONLINE ONLY (GPU for game) | Paperclip :3110 |
| 9020 | 192.168.0.5 | Joshua workspace (browser sign-in apps) | none |

## Platforms (20) — routed by Agent Hub

| Platform | Node | Auth | Use |
|---|---|---|---|
| hermes | T5500 | localhost | Co-CEO, routing, research |
| fcc-claude | T5500 | FCC proxy | Co-CEO, code, compliance |
| opencode | T5500 | NVIDIA free | Code tasks |
| ollama | T5500 | localhost | Light local models |
| cloud | T5500 | openrouter | Cloud relay via Hermes |
| clawx | T5500 | gateway | ClawX/OpenClaw |
| pi | T5500 | localhost | Conversational |
| github | T5500 | PAT | Issue sync |
| slack | T5500 | bot token | Notifications |
| 1minai | Sabretooth | desktop app | DREAM cloud AI |
| claude | 9020 | browser | Claude Max (cloud) |
| codex | 9020 | browser | OpenAI Codex |
| openai | 9020 | browser | OpenAI API |
| grok | 9020 | browser | xAI Grok |
| gemini | 9020 | browser | Google Gemini |
| chatgpt | 9020 | browser | ChatGPT |
| perplexity | 9020 | browser | Perplexity Pro |
| cursor | 9020 | desktop | Cursor IDE |
| desktop | 9020 | manual | Any GUI tool |
| commander | 9020 | none | Terminal tasks |

## Skills

279 skills in `.agents/skills/`. Every agent loads skills on demand.
Every platform session reads `.agents/BOOT.md` first. No exceptions.

## Slack Channels

| Channel | Receives |
|---|---|
| #antigravity-platform | All task events (default) |
| #dream-online | DREAM tasks (platform: 1minai) |
| #fcc-claude | Claude tasks (platform: claude, fcc-claude) |

## Agent Hub API

```
http://T5500:3130/api/entities/AgentTask    — CRUD
http://T5500:3130/api/mcp/tools             — MCP for FCC-Claude
http://T5500:3130/api/dispatch/routes       — Platform routing
http://T5500:3130/health                    — Health check
```
