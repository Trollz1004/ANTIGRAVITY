# Agent Hub — ANTIGRAVITY Task Orchestration

In-house replacement for Paperclip. All code in `Trollz1004/ANTIGRAVITY`.
Runs on T5500 at `:3130`. No third-party platforms.

## Quick Start

```bash
cd services/agent-hub
cp .env.example .env       # fill in Slack + GitHub tokens
npm install
npm run migrate            # creates PostgreSQL tables
npm start                  # listens on :3130
```

## Architecture

```
Hermes (co-CEO) ──┐
                   ├── POST/GET /api/entities/AgentTask ──→ Agent Hub (:3130)
FCC-Claude (co-CEO)┘                                           │
                                                               ├── Slack notifications
                                                               ├── GitHub issue sync
                                                               └── PostgreSQL (T5500)
```

## Platforms (20)

| Platform | Node | Auth | Access |
|---|---|---|---|
| `hermes` | Sabretooth | none (localhost) | Hermes router :11435 |
| `fcc-claude` | Sabretooth | none (FCC proxy) | FCC :8082 |
| `claude` | 9020 | browser sign-in | Claude desktop app |
| `codex` | 9020 | browser sign-in | OpenAI Codex desktop |
| `opencode` | Sabretooth | none (NVIDIA free) | OpenCode CLI via Hermes |
| `openai` | 9020 | browser sign-in | OpenAI API/ChatGPT |
| `ollama` | Sabretooth | none (localhost GPU) | Ollama :11434 |
| `cloud` | Sabretooth | openrouter key | OpenRouter / Ollama Cloud / 1min-relay |
| `grok` | 9020 | browser sign-in | xAI Grok desktop |
| `gemini` | 9020 | browser sign-in | Google Gemini desktop |
| `chatgpt` | 9020 | browser sign-in | ChatGPT web/desktop |
| `github` | T5500 | PAT token | GitHub API |
| `1minai` | Sabretooth | desktop app | 1min.AI Windows app |
| `perplexity` | 9020 | browser sign-in | Perplexity Pro |
| `cursor` | 9020 | desktop app | Cursor IDE |
| `clawx` | Sabretooth | gateway token | ClawX/OpenClaw |
| `pi` | Sabretooth | none | Pi via Hermes router |
| `slack` | T5500 | bot token | Slack API |
| `desktop` | 9020 | manual | Any GUI desktop tool |
| `commander` | 9020 | none | Windows Terminal tasks |

## Auth Model (what the hub holds)

| Secret | Env var | Purpose |
|---|---|---|
| Hub internal API key | AGENT_HUB_API_KEY | Agents calling the hub REST API |
| Slack bot token | SLACK_BOT_TOKEN | Post notifications to channels |
| GitHub PAT | GITHUB_TOKEN | Issue sync with Trollz1004/ANTIGRAVITY |

Browser-auth platforms (codex, grok, claude, gemini, chatgpt, openai, perplexity) — the hub TRACKS tasks assigned to them but never calls their APIs. They're desktop apps with browser sign-in.

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
GET    /health                              health check (no auth)
```

## MCP Integration (FCC-Claude)

FCC-Claude accesses tasks via the MCP interface:
- `GET /api/mcp/tools` — returns tool definitions
- `POST /api/mcp/call` — executes tools: list_tasks, create_task, update_task, get_queue_status

## Slack Channels

| Channel | Receives |
|---|---|
| #antigravity-platform | All task events except Claude-specific |
| #dream-online | Tasks with platform: ollama (Dream NPC work) |
| #fcc-claude | Tasks with platform: claude |

## Replacing Paperclip

1. ✅ Build agent-hub service (this)
2. Wire Hermes + FCC-Claude to POST task state to hub API
3. Validate task flow on both nodes for 1 full cycle
4. Remove Paperclip from all nodes
