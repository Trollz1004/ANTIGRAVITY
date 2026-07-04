# Agent Hub — ANTIGRAVITY Task Orchestration

In-house task orchestration. All code in `Trollz1004/ANTIGRAVITY`.
Runs on **Sabretooth at `:3130`** — the ONE location every AI sends work to.

## Architecture

```
Sabretooth :3130 (Agent Hub) ← ALL AI sends work HERE
       │
       ├── Local services: Hermes :11435, FCC :8082, Ollama :11434, ClawX, Pi
       ├── DREAM: Paperclip :3110, 1min.ai (NPC AI), Claude Official (Sup@)
       ├── Browser-auth: Codex, Grok, Gemini, ChatGPT, Perplexity
       ├── Slack notifications (#antigravity-platform, #dream-online, #fcc-claude)
       ├── GitHub issue sync
       └── PostgreSQL (local)
```

## Node Roles (FINAL)

| Node | Role | What runs there |
|---|---|---|
| **Sabretooth** | ALL services + DREAM | Agent Hub :3130, Hermes, FCC, Ollama, PostgreSQL, Paperclip :3110, DREAM on D:\, GPU for game |
| **T5500** | Gateway only | Cloudflare tunnels for youandinotai.com |
| **9020** | Inactive | Nothing |

## Quick Start (on Sabretooth)

```powershell
cd C:\antigravity\services\agent-hub
copy .env.example .env     # fill in Slack + GitHub tokens
npm install
npm run migrate            # creates PostgreSQL tables
npm start                  # listens on :3130
```

## Platforms (21) — ALL on Sabretooth

| Platform | Auth | Use |
|---|---|---|
| `hermes` | localhost | Co-CEO, routing, research |
| `fcc-claude` | FCC proxy | Co-CEO, code, compliance |
| `claude` | Max subscription | Sup@ user guide sphere (DREAM) |
| `opencode` | NVIDIA free | Code tasks |
| `ollama` | localhost | Local models |
| `cloud` | openrouter | Cloud relay via Hermes |
| `1minai` | desktop app | DREAM NPC AI |
| `clawx` | gateway | ClawX/OpenClaw |
| `pi` | localhost | Conversational |
| `github` | PAT | Issue sync |
| `slack` | bot token | Notifications |
| `codex` | browser | OpenAI Codex |
| `openai` | browser | OpenAI API |
| `grok` | browser | xAI Grok |
| `gemini` | browser | Google Gemini |
| `chatgpt` | browser | ChatGPT |
| `perplexity` | browser | Perplexity Pro |
| `cursor` | desktop | Cursor IDE |
| `desktop` | manual | Any GUI tool |
| `commander` | none | Terminal tasks |
| `odysseus` | admin login (local only) | Odysseus AI — sabretooth local-service :7000 |

## Auth Model (what the hub holds)

| Secret | Env var | Purpose |
|---|---|---|
| Hub internal API key | AGENT_HUB_API_KEY | Agents calling the hub REST API |
| Slack bot token | SLACK_BOT_TOKEN | Post notifications to channels |
| GitHub PAT | GITHUB_TOKEN | Issue sync with Trollz1004/ANTIGRAVITY |

Browser-auth platforms (claude, codex, grok, gemini, chatgpt, openai, perplexity) — the hub TRACKS tasks but never calls their APIs. They're desktop apps with browser sign-in.

## DREAM ONLINE

GPU 1070 8GB reserved for game rendering — NOT AI inference.
DREAM files on D:\dream-online\ (assets, server, config, saves, logs).
Paperclip :3110 handles DREAM webhooks, triggers, and game events.

### DREAM AI Roles

- **Claude Official** (Max subscription) = Sup@ — the user's floating electrical sphere guide. No TOS violations.
- **1min.ai** (desktop app) = NPC AI — cloud inference for real-time NPC behavior, world events, dialogue.

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

## Leads CRM (`src/leads/`)

Ported from the Emergent lead-gen CRM for youandinotai.com (volunteer-lead capture,
email campaigns/templates). Data lives in Supabase (project `jmvgdqomvnkfgknmgwxp`),
schema in `migrations/002_create_leads.sql`. Six tables: `leads`, `campaigns`,
`templates`, `rules`, `pages`, `platforms` — all with RLS enabled (hub connects as a
BYPASSRLS service role; there are no anon/authenticated policies, all writes route
through the Express layer).

```
GET    /api/leads                     list, paginated + filterable (?platform=, ?stage=, ?status=, ?source=, ?min_score=, ?q=, ?limit=, ?skip=)
POST   /api/leads                     create — scored via heuristic_score() if no explicit score given
GET    /api/leads/:id
PUT    /api/leads/:id
DELETE /api/leads/:id
POST   /api/leads/convert             { id | email } → stage='won', score=100, fires conversion hooks
GET    /api/leads/reports/funnel      real counts grouped by stage

GET    /api/campaigns                 CRUD
POST   /api/campaigns
GET    /api/campaigns/:id
PUT    /api/campaigns/:id
DELETE /api/campaigns/:id

GET    /api/templates                 CRUD
POST   /api/templates
GET    /api/templates/:id
PUT    /api/templates/:id
DELETE /api/templates/:id
```

**Scoring** (`src/leads/scoring.js`): `heuristic_score(lead)` is a pure, DB-free
function (unit tested in `tests/scoring.test.js`). `oneMinScore(lead)` is an optional
AI-assisted scorer behind `ONEMINAI_API_KEY` (absent from the vault as of this
writing — dead code until provisioned); it always falls back to `heuristic_score`
on missing key, timeout, or non-2xx response, and never throws.

**Hooks** (`src/leads/hooks.js`): fire-and-forget, non-blocking side effects on
lead create/convert — Slack notify, Hermes memory upsert
(`POST http://localhost:9119/memory/upsert`), Telegram broadcast. All are env-gated
and default-off; a failure in any hook is logged and swallowed, never surfaced to
the caller and never blocks the lead API response. `EMERGENT_LEDGER_URL` /
`EMERGENT_BROADCAST_URL` are legacy optional integrations, also env-gated
default-OFF, with no hard dependency on any `*.emergent*` host.

**Data provenance note**: the live source system stored `api_key` in plaintext and
served it over an unauthenticated `GET /api/platforms`. Those 4 keys should be
treated as burned/rotation-listed. This port stores `api_key_hash` (sha256) only —
plaintext values were never written to this repo or to Supabase.

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

## Architecture Notes

1. Agent Hub handles ANTIGRAVITY task routing (all 21 platforms)
2. Paperclip :3110 handles DREAM game orchestration (webhooks, triggers, events)
3. Both run on Sabretooth — the ONLY active node
4. T5500 = gateway only (Cloudflare tunnels), 9020 = inactive
