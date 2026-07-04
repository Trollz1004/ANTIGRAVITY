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
| Sabretooth | 192.168.0.8 | ALL services + Agent Hub :3130 + DREAM on D:\ | Agent Hub + Paperclip |
| T5500 | gateway | Gateway only — Cloudflare tunnels for youandinotai.com | none |
| 9020 | 192.168.0.5 | Inactive — nothing running | none |

## Platforms (20) — ALL on Sabretooth, routed by Agent Hub

| Platform | Auth | Use |
|---|---|---|
| hermes | localhost | Co-CEO, routing, research |
| fcc-claude | FCC proxy | Co-CEO, code, compliance |
| claude | Max subscription | Sup@ user guide sphere (DREAM) |
| opencode | NVIDIA free | Code tasks |
| ollama | localhost | Local models |
| cloud | openrouter | Cloud relay via Hermes |
| 1minai | desktop app | DREAM NPC AI |
| clawx | gateway | ClawX/OpenClaw |
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

279 skills in `.agents/skills/`. Every agent loads skills on demand.
Every platform session reads `.agents/BOOT.md` first. No exceptions.

## Slack Channels

| Channel | Receives |
|---|---|
| #antigravity-platform | All task events (default) |
| #dream-online | DREAM tasks (platform: 1minai) |
| #fcc-claude | Claude tasks (platform: claude, fcc-claude) |

## Agent Hub API (Sabretooth :3130)

```
http://192.168.0.8:3130/api/entities/AgentTask    — CRUD
http://192.168.0.8:3130/api/mcp/tools             — MCP for FCC-Claude
http://192.168.0.8:3130/api/dispatch/routes       — Platform routing
http://192.168.0.8:3130/health                    — Health check
```
