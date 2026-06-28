# Mission MCP task-pool refill loop run procedure

Scope: local mission-mcp scheduler/factory/storage loop only. Do not install a machine cron or restart external services without Josh's explicit approval.

## Build

From repo root:

```bash
pnpm --filter @antigravity/mission-mcp build
```

## One-shot cron command

The cron entry should run the compiled one-shot refill command. It opens the configured SQLite storage, checks the active task count, and refills from the deterministic factory when the active count is at or below the threshold.

```cron
* * * * * cd /mnt/c/Antigravity && MISSION_MCP_DB=/path/to/state.db TASK_POOL_REFILL_THRESHOLD=20 TASK_POOL_TARGET=100 pnpm --filter @antigravity/mission-mcp task-pool:cron >> /var/log/mission-mcp-task-pool.log 2>&1
```

Supported environment:

- `MISSION_MCP_DB`: SQLite state DB path.
- `TASK_POOL_REFILL_THRESHOLD`: default `20`.
- `TASK_POOL_TARGET`: default `100`.
- `TASK_POOL_MAX_BELOW_MS`: default `300000`.
- `TASK_POOL_BELOW_SINCE_MS`: optional epoch-ms value. If the pool is still at/below threshold after `TASK_POOL_MAX_BELOW_MS`, the command logs a critical alert event and exits with code `2`.
- `TASK_POOL_TEMPLATE_SEED`, `TASK_POOL_TITLE_PATTERN`, `TASK_POOL_BODY_PATTERN`, `TASK_POOL_TOPIC`, `TASK_POOL_ASSIGNEE`: factory template inputs.

Each refill logs one structured JSON event to stdout and to the `events` table as `task_pool_refill`:

```json
{"timestamp":"2026-06-28T07:39:01.486Z","previous_count":20,"new_count":100,"batch_id":"batch_2bae9f0417fecdb3_001","inserted":80,"threshold":20,"target":100}
```

Health/alert path:

- Refill insert failure logs `task_pool_alert` with `severity:"critical"`, `reason:"pool_refill_failed"`, and rethrows.
- A pool that remains at/below threshold longer than `TASK_POOL_MAX_BELOW_MS` logs `task_pool_alert` with `severity:"critical"`, `reason:"pool_below_threshold_too_long"`; the CLI also writes `CRITICAL` to stderr and exits non-zero.

## Verified local drain/refill cycle

Evidence file: `docs/operations/task-pool-refill-cycle.log`.

Command shape used for verification:

```bash
DB=/tmp/mission-mcp-refill-cycle.db
export MISSION_MCP_DB="$DB"
export TASK_POOL_TEMPLATE_SEED="verified-cycle"
export TASK_POOL_TOPIC="verified-refill-cycle"
export TASK_POOL_ASSIGNEE="ceo"
export TASK_POOL_REFILL_THRESHOLD=20
export TASK_POOL_TARGET=100

pnpm --filter @antigravity/mission-mcp task-pool:cron
# mark 80 active tasks done with better-sqlite3, reducing active count 100 -> 20
pnpm --filter @antigravity/mission-mcp task-pool:cron
# repeat drain 100 -> 20
pnpm --filter @antigravity/mission-mcp task-pool:cron
```

Observed result: seed refill created 100 tasks, drain-1 reduced active count 100 -> 20, refill-1 restored 20 -> 100, drain-2 reduced 100 -> 20, refill-2 restored 20 -> 100. Final active count was 100 with 3 `task_pool_refill` events.
