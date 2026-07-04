# Agent Hub — ANTIGRAVITY Task Orchestration

In-house replacement for Paperclip. All code in `Trollz1004/ANTIGRAVITY`.
Runs on **T5500 at `:3130`** — the ONE location every AI sends work to.

## Architecture

```
T5500 :3130 (Agent Hub) ← ALL AI sends work HERE
       │
       ├── Routes to T5500 services: Hermes, FCC-Claude, OpenCode, Ollama, ClawX, Pi
       ├── Routes to 9020 (browser-auth): Claude Max, Codex, Grok, Gemini, ChatGPT, Perplexity
       ├── Routes to Sabretooth (DREAM ONLY): 1min.ai cloud for fast game events
       ├── Slack notifications (#antigravity-platform, #dream-online, #fcc-claude)
       ├── GitHub issue sync
       └── PostgreSQL (T5500 local)
```

## Node Roles (FINAL)

| Node | Role | What runs there |
|---|---|---|
| **T5500** | Gateway + all orchestration | Agent Hub :3130, Hermes :11435, FCC :8082, Ollama :11434, ClawX :3110, GitHub API, Slack API |
| **Sabretooth** | DREAM ONLINE ONLY | GPU 1070 8GB = game rendering. Cloud AI (Claude Max + 1min.ai) for fast real-time events. NO local models for DREAM. |
| **9020** | Joshua workspace | Browser sign-in platforms (Claude, Codex, Grok, Gemini, ChatGPT, Perplexity, Cursor) |

## Quick Start (on T5500)

```powershell
cd C:\antigravity\services\agent-hub
copy .env.example .env     # fill in Slack + GitHub tokens
npm install
npm run migrate            # creates PostgreSQL tables
npm start                  # listens on :3130
```

## Platforms (20)

| Platform | Node | Auth | Access |
|---|---|---|---|
| `hermes` | T5500 | none (localhost) | Hermes router :11435 |
| `fcc-claude` | T5500 | none (FCC proxy) | FCC :8082 |
| `opencode` | T5500 | none (NVIDIA free) | OpenCode CLI via Hermes |
| `ollama` | T5500 | none (localhost) | Ollama :11434 — light models, NOT for DREAM |
| `cloud` | T5500 | openrouter key | OpenRouter via Hermes |
| `clawx` | T5500 | gateway token | ClawX/OpenClaw :3110 |
| `pi` | T5500 | none | Pi via Hermes router |
| `github` | T5500 | PAT token | GitHub API |
| `slack` | T5500 | bot token | Slack API |
| `1minai` | Sabretooth | cloud subscription | 1min.AI — fast cloud for DREAM events |
| `claude` | 9020 | browser sign-in | Claude Max (cloud subscription) |
| `codex` | 9020 | browser sign-in | OpenAI Codex desktop |
| `openai` | 9020 | browser sign-in | OpenAI API |
| `grok` | 9020 | browser sign-in | xAI Grok desktop |
| `gemini` | 9020 | browser sign-in | Google Gemini desktop |
| `chatgpt` | 9020 | browser sign-in | ChatGPT web/desktop |
| `perplexity` | 9020 | browser sign-in | Perplexity Pro |
| `cursor` | 9020 | desktop app | Cursor IDE |
| `desktop` | 9020 | manual | Any GUI desktop tool |
| `commander` | 9020 | none | Windows Terminal tasks |

## Auth Model (what the hub holds)

| Secret | Env var | Purpose |
|---|---|---|
| Hub internal API key | AGENT_HUB_API_KEY | Agents calling the hub REST API |
| Slack bot token | SLACK_BOT_TOKEN | Post notifications to channels |
| GitHub PAT | GITHUB_TOKEN | Issue sync with Trollz1004/ANTIGRAVITY |

Browser-auth platforms (claude, codex, grok, gemini, chatgpt, openai, perplexity) — the hub TRACKS tasks but never calls their APIs. They're desktop apps with browser sign-in.

## DREAM ONLINE — Sabretooth

Sabretooth's GPU (1070 8GB) is reserved for game rendering ONLY.
AI for DREAM uses **cloud** inference:
- **Claude Max** (cloud subscription) — via 9020 browser
- **1min.ai** (cloud subscription) — fast API on Sabretooth for real-time events

NO local Ollama models for DREAM. Open world sandbox with no instances needs fast cloud, not slow GPU inference competing with game rendering.

DREAM may keep Paperclip on Sabretooth for game-specific task orchestration separate from Agent Hub.

## Queue Rules

- Max 100 tasks in active states (todo, in_progress, review) at any time
- Tasks beyond cap automatically land in backlog
- FIFO promotion when a task closes (oldest backlog by priority → todo)
- This enforces focus, not a limitation

## API

```
GET    /api/entities/AgentTask              list (filters: ?q=, ?status=, ?platform=, ?limit=, ?skip=, ?sort_by=)
POST   /api/entities/AgentTask              create one
POST   /api/entities/AgentTask/bulk         bulk create array
GET    /api/entities/AgentTask/:id          get one
PUT    /api/entities/AgentTask/:id          update one
DELETE /api/entities/AgentTask/:id          soft delete one
PUT    /api/entities/AgentTask/:id/restore  restore deleted
DELETE /api/entities/AgentTask              bulk delete by filter (?status=, ?platform=, ?before=)
POST   /api/functions/syncGitHubTasks       sync GitHub issues → task status
GET    /api/mcp/tools                       MCP tool definitions for FCC-Claude
POST   /api/mcp/call                        MCP tool execution endpoint
GET    /api/dispatch/routes                 all platform routing info
GET    /api/dispatch/route/:platform        routing for specific platform
POST   /api/dispatch/health                 check which platforms are reachable
GET    /health                              health check (no auth)
```

## MCP Integration (FCC-Claude)

FCC-Claude accesses tasks via the MCP interface:
- `GET /api/mcp/tools` — returns tool definitions
- `POST /api/mcp/call` — executes tools: list_tasks, create_task, update_task, get_queue_status

## Slack Channels

| Channel | Receives |
|---|---|
| #antigravity-platform | All task events (default) |
| #dream-online | Tasks with platform: 1minai (DREAM events) |
| #fcc-claude | Tasks with platform: claude or fcc-claude |

## Replacing Paperclip (on T5500 + 9020)

1. Agent Hub replaces Paperclip for ANTIGRAVITY orchestration
2. Sabretooth keeps Paperclip for DREAM-specific game orchestration
3. All other AI work routes through T5500 :3130
