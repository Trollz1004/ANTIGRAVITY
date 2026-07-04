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

## Auth Model

| Platform | Auth type | Hub holds key? |
|---|---|---|
| Slack | Bot token | YES (SLACK_BOT_TOKEN) |
| GitHub | PAT | YES (GITHUB_TOKEN) |
| Hub internal | API key header | YES (AGENT_HUB_API_KEY) |
| Codex (OpenAI) | Browser sign-in | NO — desktop app |
| Grok (xAI) | Browser sign-in | NO — desktop app |
| Claude official | Browser sign-in | NO — desktop app |
| Gemini (Google) | Browser sign-in | NO — desktop app |
| FCC proxy | None (localhost) | NO |
| Ollama | None (localhost) | NO |
| Hermes | None (localhost) | NO |

The hub TRACKS tasks assigned to browser-auth platforms but never calls their APIs directly.

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
