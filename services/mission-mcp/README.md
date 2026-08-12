# mission-mcp

ANTIGRAVITY mission orchestrator — no-Paperclip MCP server kernel.

Speaks stdio (default) and HTTP (`MISSION_MCP_TRANSPORT=http`).

## Tools

| Tool            | Description                                                                      |
| --------------- | -------------------------------------------------------------------------------- |
| `create_task`   | Create a task on the mission board                                               |
| `list_tasks`    | List tasks, most-recent first; filterable (see params below)                     |
| `update_task`   | Update status, title, description, priority, or result on an existing task       |
| `create_issue`  | Flag a blocker, question, or risk (optionally linked to a task)                  |
| `resolve_issue` | Mark an issue resolved with a resolution note                                    |
| `store_memory`  | Persist a knowledge entry to `~/.hermes/memories/` and index it                  |
| `search_memory` | Keyword search over stored memories (content + tags)                             |
| `read_file`     | Read a file relative to the ANTIGRAVITY repo root                                |
| `write_file`    | Write a file relative to root; creates parent dirs; optional `create_only` guard |
| `patch_file`    | Apply a unified diff to a file relative to root                                  |
| `list_agents`   | List registered agent processes (see semantics below)                            |

All new params introduced in migration 002 are **optional**; existing callers work unchanged.

---

## `list_tasks` params

| Param               | Type   | Description                                                                                                                     |
| ------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `status`            | enum   | `pending` \| `in_progress` \| `done` \| `failed` \| `blocked`                                                                   |
| `parent_task_id`    | string | Only tasks with this parent                                                                                                     |
| `assigned_agent_id` | string | Only tasks assigned to this agent                                                                                               |
| `tag`               | string | Substring match against `title` and `description` (case-insensitive). Encoded as `LIKE '%tag%'` — no dedicated tags column yet. |
| `since_ms`          | number | Only tasks where `created_at >= since_ms` or `updated_at >= since_ms`. Pairs naturally with `tag` for time-windowed reporting.  |
| `limit`             | number | Max results (1–500, default 50)                                                                                                 |

**Ordering:** `created_at DESC, rowid DESC` — the `rowid` tiebreaker ensures deterministic ordering for same-millisecond inserts.

---

## `list_agents` semantics

Returns `AgentRow[]` — never `null`, always an array (possibly empty).

```ts
interface AgentRow {
  id: string;
  model: string;
  pid: number | null;
  last_heartbeat: number | null; // Unix ms; null = registered but never heartbeated
  meta: string | null; // arbitrary JSON string
  registered_at: number;
}
```

**Three distinct states:**

| Result                       | Meaning                                                             |
| ---------------------------- | ------------------------------------------------------------------- |
| `[]`                         | No agents have registered at all — honest empty state, not an error |
| `[{ last_heartbeat: null }]` | Agent registered (e.g., at startup) but has never polled            |
| `[{ last_heartbeat: <ts> }]` | Agent registered and currently sending heartbeats                   |

**`active_since_ms` filter** — optional; only returns agents with `last_heartbeat >= active_since_ms`.

---

## `completed_at` field on tasks

Added in migration 002. Type: `number | null` (Unix ms).

- Set automatically on the first transition to `status: "done"` — not overwritten by subsequent updates.
- Never set for any other status transition.
- Backfilled on existing rows: `completed_at = updated_at` where `status = 'done'`.
- **Recommended consumer pattern:** `task.completed_at ?? task.updated_at` for legacy-safe reads. New code should prefer `completed_at` directly.

---

## Data

SQLite at `C:\Users\joshl\.hermes\state.db` (override: `MISSION_MCP_DB`).

Migrations run automatically on first connect:

| ID                            | Description                                |
| ----------------------------- | ------------------------------------------ |
| `001_initial`                 | Tasks, issues, memory index, events tables |
| `002_agents_and_completed_at` | Agent registry + `completed_at` on tasks   |

---

## Usage

```sh
# stdio (MCP default)
node dist/server.js

# HTTP on port 3901
MISSION_MCP_TRANSPORT=http node dist/server.js

# custom port
MISSION_MCP_TRANSPORT=http MISSION_MCP_PORT=4000 node dist/server.js
```

## Health check

```sh
curl http://127.0.0.1:3901/health
```

## Tests

```sh
pnpm test
```

57 tests passing across 7 suites (db, events, agents, issues, memory, files, tasks).
