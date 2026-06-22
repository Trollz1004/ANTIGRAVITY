# Hermes MCP Orchestrator — Design Spec

**Date:** 2026-05-12
**Author:** Claude (Opus 4.7) on behalf of Josh Coleman
**Status:** Draft for implementation

---

## 1. Mission

Build the local "ops kernel" that lets Josh orchestrate a fleet of Hermes agents from **any browser tab** via Claude — without paying for Paperclip — so he can spend his year focused on **helping kids in need** rather than wiring up infrastructure.

Every architectural choice in this doc trades engineering cleverness for *speed-to-usable* and *cost-to-zero*. Josh ships value when agents start moving; the plumbing should disappear.

---

## 2. The promise (what the user can do once this ships)

After v0.1 (target: ~1 working week of build time):

1. Open claude.ai in any tab. Type: *"Spawn 3 agents to research nonprofit funding deadlines for youth-services orgs in Texas, and store findings in memory."*
2. Claude picks up local Hermes tools through a registered MCP connector, spawns the agents against Josh's local hermes-agent gateway, and returns task IDs.
3. The work persists. Close the tab, shut down the laptop, come back tomorrow: *"What did the funding-deadline mission find?"* Claude reads the local SQLite DB, summarizes, lists open tasks.
4. The existing TanStack GUI (port 3000) shows the same agents/tasks/memory as a human-friendly dashboard.
5. Paperclip is gone. No subscription, no broker, no third-party dependency on the orchestration loop.

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  claude.ai (any browser tab) + Claude in Chrome MCP bridge   │
│  → Orchestrator brain. Always available wherever Josh is.    │
└────────────────────────┬─────────────────────────────────────┘
                         │ MCP (JSON-RPC; stdio + HTTP+SSE)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  hermes-mcp kernel (NEW, port 3097)                          │
│  Lives at: hermes-workspace/packages/hermes-mcp/             │
│  Imports hermesService.ts from Manus zip as its HTTP client. │
│                                                              │
│  Exposed MCP tools:                                          │
│   spawn_agent(soul_ref, brief, model?) → agent_id            │
│   list_agents() / agent_status(id) / kill_agent(id)          │
│   store_memory(content, tags) / search_memory(query)         │
│   create_task / update_task / list_tasks(filter)             │
│   create_issue / resolve_issue                               │
│   run_skill(name, args)                                      │
│   read_file / write_file / patch_file(diff)                  │
│   orchestrate_swarm(mission, agents[]) / get_mission(id)     │
└─────┬────────────────┬────────────────┬─────────────────────┘
      │                │                │
      ▼                ▼                ▼
┌──────────────┐ ┌───────────────┐ ┌─────────────────────────┐
│ hermes-agent │ │ workspace-    │ │ SQLite                  │
│ gateway      │ │ daemon (file  │ │ ~/.hermes/state.db      │
│ (port 8642)  │ │ ops, subproc) │ │ (better-sqlite3, WAL)   │
│ Already runs │ │ (port 3099)   │ │                         │
│ via vite dev │ │ Already runs  │ │ tables: agents, tasks,  │
│ auto-spawn   │ │ via vite dev  │ │ issues, missions,       │
└──────────────┘ └───────────────┘ │ memory_index, events    │
                                   └─────────────────────────┘
                         ▲
                         │ read-only via kernel
                         │
              ┌──────────┴───────────┐
              │ Existing TanStack    │
              │ GUI (port 3000)      │
              │ + 5 new routes:      │
              │ /dashboard /agents   │
              │ /tasks /memory       │
              │ /missions/$id        │
              └──────────────────────┘
```

**Boundary rule:** the kernel is the *only* writer of `state.db` and the *only* caller of hermes-agent for orchestration mutations. GUI and Claude are both clients. This is what keeps the system replaceable in pieces later.

---

## 4. Data model

SQLite at `~/.hermes/state.db`. WAL mode. No ORM (schema is small; `better-sqlite3` synchronous API is the right tool).

```sql
-- Live agent registry. Source of truth for "what's running."
CREATE TABLE agents (
  id              TEXT PRIMARY KEY,           -- ulid
  name            TEXT NOT NULL,
  soul_ref        TEXT NOT NULL,              -- path to SOUL.md template
  status          TEXT NOT NULL,              -- spawning|running|idle|crashed|stopped
  model           TEXT,                        -- e.g. CFO-Until-No-Kid-In-Need
  working_dir     TEXT NOT NULL,              -- .hermes/agents/<id>/
  spawned_at      INTEGER NOT NULL,           -- unix ms
  last_heartbeat  INTEGER,
  mission_id      TEXT REFERENCES missions(id)
);

-- Discrete unit of work. Can be agent-assigned or human-created.
CREATE TABLE tasks (
  id                 TEXT PRIMARY KEY,
  title              TEXT NOT NULL,
  description        TEXT,
  status             TEXT NOT NULL,  -- pending|in_progress|done|failed|blocked
  priority           INTEGER DEFAULT 3,
  created_by         TEXT NOT NULL,  -- 'claude'|'human'|agent_id
  assigned_agent_id  TEXT REFERENCES agents(id),
  parent_task_id     TEXT REFERENCES tasks(id),
  mission_id         TEXT REFERENCES missions(id),
  result             TEXT,           -- short summary; full output in events
  created_at         INTEGER NOT NULL,
  updated_at         INTEGER NOT NULL
);

-- Surfaced problems Claude or agents flag for follow-up.
CREATE TABLE issues (
  id           TEXT PRIMARY KEY,
  task_id      TEXT REFERENCES tasks(id),
  kind         TEXT NOT NULL,   -- error|blocker|question|risk
  severity     TEXT NOT NULL,   -- low|med|high
  body         TEXT NOT NULL,
  resolution   TEXT,
  created_at   INTEGER NOT NULL,
  resolved_at  INTEGER
);

-- Long-running missions (swarm of agents toward a single objective).
CREATE TABLE missions (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  brief         TEXT NOT NULL,
  status        TEXT NOT NULL,  -- planning|running|paused|complete|abandoned
  started_at    INTEGER NOT NULL,
  completed_at  INTEGER,
  swarm_size    INTEGER
);

-- Lightweight index over filesystem-stored memory blobs.
-- Content lives in .hermes/memories/<id>.md so it stays human-editable.
CREATE TABLE memory_index (
  id           TEXT PRIMARY KEY,
  agent_id     TEXT REFERENCES agents(id),
  kind         TEXT NOT NULL,   -- user|feedback|project|reference|finding|artifact
  content_ref  TEXT NOT NULL,   -- relative path to .md file
  tags         TEXT,            -- json array
  embedding_id TEXT,            -- nullable; for vector backend later
  created_at   INTEGER NOT NULL
);

-- Append-only audit log. Replay = resume mission from any timestamp.
CREATE TABLE events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ts          INTEGER NOT NULL,
  agent_id    TEXT,
  task_id     TEXT,
  mission_id  TEXT,
  kind        TEXT NOT NULL,   -- spawn|heartbeat|task_update|tool_call|crash|note
  payload     TEXT NOT NULL    -- json
);

CREATE INDEX idx_tasks_status   ON tasks(status);
CREATE INDEX idx_tasks_mission  ON tasks(mission_id);
CREATE INDEX idx_events_ts      ON events(ts);
CREATE INDEX idx_events_agent   ON events(agent_id);
CREATE INDEX idx_memory_tags    ON memory_index(tags);
```

**Why files for memory content, not BLOB:** Josh can `cat`, grep, and edit memories directly. The agent file system (SOUL/BRIEF/MEMORY .md per agent) Manus designed lives on disk; SQLite just indexes it.

---

## 5. Build phases

Each phase ends in a working state Josh can use. No phase exceeds ~1-2 days of focused build time.

### Phase 0 — Scaffolding *(half-day)*
- `hermes-workspace/packages/hermes-mcp/` workspace package
- `src/db.ts` — better-sqlite3 connection + migration runner
- `migrations/001_initial.sql` — schema from §4
- `src/server.ts` — MCP server skeleton (no tools yet)
- Vitest setup; one smoke test (server boots, schema applies)
- **Done when:** `pnpm --filter hermes-mcp test` passes and `pnpm --filter hermes-mcp dev` opens an MCP stdio connection.

### Phase 1 — Core kernel tools *(1-2 days)*
Implement these tools in priority order; each ships independently:
1. `create_task` / `list_tasks` / `update_task` — Claude can already start tracking work
2. `read_file` / `write_file` / `patch_file` — Claude can edit anything via prompts
3. `spawn_agent` — copies SOUL template, generates IDENTITY/BRIEF, calls hermes-agent gateway via `hermesService.ts`
4. `list_agents` / `agent_status` — heartbeat polling, populates `agents` table
5. `store_memory` / `search_memory` — file-based content + tag/keyword search (vector deferred)
6. `create_issue` / `resolve_issue`
- **Done when:** Josh can run a manual MCP client (e.g., the inspector) and execute every tool.

### Phase 2 — Connect Claude to the kernel *(half-day)*

Two connection paths, ordered by reliability:

1. **Primary: Claude in Chrome MCP bridge.** Josh already has Claude-in-Chrome's MCP layer loaded (`mcp__Claude_in_Chrome__*` tools confirm). Register `hermes-mcp` as a stdio server in the Claude in Chrome MCP config. This path is **known to work today** and is the v1 default.
2. **Stretch: claude.ai custom connector.** Native claude.ai connectors require either (a) a publicly reachable HTTPS endpoint, or (b) Anthropic Console-side registration. v1 ships with a `pnpm hermes tunnel` command that runs a [cloudflared](https://github.com/cloudflare/cloudflared) quick-tunnel to expose `127.0.0.1:3097` over HTTPS. Josh manually pastes the URL into the claude.ai connector UI once. Documented as opt-in.

Both paths bind a short-lived bearer token sourced from `~/.hermes/.mcp-token` (regenerated on each kernel start) to keep the surface narrow.

- **Done when:** Josh opens claude.ai (with Claude in Chrome active), types *"List my open Hermes tasks"*, and Claude calls `list_tasks` against the local kernel.

### Phase 3 — Paperclip removal *(half-day)*
- Identify call sites that reference Paperclip in any unified-GUI code Josh wants to keep
- Replace with `hermesService.ts` method calls (1:1 surface coverage)
- Delete `paperclipService.ts`
- **Done when:** zero "paperclip" string matches outside of comments/git history.

### Phase 4 — GUI routes *(2 days)*
Five new TanStack file-routes under `hermes-workspace/src/routes/`:
- `dashboard.tsx` — live counts + recent events stream
- `agents/index.tsx` + `$agentId.tsx` — fleet + SOUL/MEMORY tabs
- `tasks/index.tsx` + `$taskId.tsx` — kanban + detail with linked issues
- `memory/index.tsx` — list/search/add
- `missions/$id.tsx` — swarm progress timeline
- All consume the kernel over its HTTP+SSE side. Tailwind reused from existing app.
- **Done when:** every kernel tool has a corresponding GUI affordance.

### Phase 5 — Swarm orchestration *(1-2 days)*
- `orchestrate_swarm` tool: takes a mission brief, spawns N agents with derived briefs, assigns tasks
- `get_mission` tool: aggregates agent statuses + task progress
- Heartbeat watcher (runs every 30s inside the kernel): any agent whose `last_heartbeat` is older than **120 seconds** flips to `crashed` and auto-creates an issue with severity `high`.
- **Done when:** Claude can run a 3-agent swarm end-to-end from a single prompt and the swarm recovers gracefully when one agent dies mid-task.

### Phase 6 — Cross-platform packaging *(half-day)*
- Extend existing `electron-builder.config.cjs` to bundle hermes-mcp as a child process
- Verify Win/Mac/Linux installers
- **Done when:** Josh installs the .exe on a fresh machine and the whole stack runs.

---

## 6. Out of scope for v1

Defer these until v1 ships and a real use case demands them:

- **Vector memory backend (Pinecone / sqlite-vec)** — keyword/tag search is sufficient for tens-of-thousands of memories. Add a `MemoryBackend` interface in Phase 1 so swap-in is one PR.
- **Cross-device sync (Firestore mirror)** — single-machine first. Add when Josh runs on >1 device routinely.
- **Manus Tasks integration** — Manus's task API and FETCHER scanners from the original handoff are unrelated to the core orchestrator; revisit if/when needed.
- **Multi-provider LLM routing UI** — kernel passes through whatever model the agent's SOUL specifies. Provider switcher is just config until proven necessary.
- **Auth beyond local-loopback** — kernel binds 127.0.0.1 with a token. Network exposure is a future hardening project, not v1.

---

## 7. Design invariants (do not violate during implementation)

1. **The kernel is the only writer of `state.db` and the only caller of hermes-agent mutations.** All other clients (GUI, Claude, future automation) read through it.
2. **`events` is append-only.** Never UPDATE or DELETE rows. This is what makes "resume from anywhere" cheap.
3. **Memory content lives on disk; SQLite is an index.** Keeps memories human-readable and grep-able forever.
4. **Every tool is idempotent or explicitly marked side-effectful.** Re-running a `read_file` is safe; `spawn_agent` returns the existing agent if a deduplication key is provided.
5. **No new long-running processes beyond hermes-mcp itself.** Reuse hermes-agent + workspace-daemon. Adding services is a cost Josh pays for in cognitive overhead.

---

## 8. Skills / tools used during build

These are already in Josh's environment — no install step:

| Build phase | Skill / MCP |
|---|---|
| MCP server scaffolding | `anthropic-skills:mcp-builder` |
| Implementation planning | `superpowers:writing-plans`, `superpowers:executing-plans` |
| Test discipline | `superpowers:test-driven-development` |
| GUI routes | `frontend-design` |
| Hermes API docs | `context7` |
| Connector registration | `mcp__mcp-registry__*` tools (loaded in session) |
| Optional vector backend | `pinecone:mcp` (deferred) |
| Optional sync | `firebase:firebase` (deferred) |
| Commits + PRs | `commit-commands:commit-push-pr` |

---

## 9. Success criteria for v1

Josh can do this without any technical assistance:

1. Open the hermes-workspace electron app, see the dashboard.
2. Open claude.ai in any browser tab.
3. Type a multi-agent mission prompt. Claude executes it against local Hermes.
4. Close everything. Re-open tomorrow. Ask "where are we?". Claude reconstructs and answers.
5. Total monthly cost of running this: **$0** (everything local; claude.ai subscription is the only ongoing cost, which he already pays).
