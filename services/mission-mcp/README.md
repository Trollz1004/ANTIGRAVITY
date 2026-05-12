# mission-mcp

ANTIGRAVITY mission orchestrator — no-Paperclip MCP server kernel.

Speaks stdio (default) and HTTP (`MISSION_MCP_TRANSPORT=http`).

## Tools

- `create_task` / `list_tasks` / `update_task` — task management
- `create_issue` / `resolve_issue` — issue tracking
- `store_memory` / `search_memory` — persistent knowledge store
- `read_file` / `write_file` / `patch_file` — scoped file operations

## Data

SQLite at `C:\Users\joshl\.hermes\state.db` (override: `MISSION_MCP_DB`).

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
