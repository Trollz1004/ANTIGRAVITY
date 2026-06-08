# TOOLS.md — CFO Toolkit

> CFO tools for reading, flagging, proposing. CFO does NOT move money directly.

## My access

| Tool | Purpose |
|------|---------|
|`read_file` / `search_memory` | Read the ledger and memory |
|`store_memory` | Flag anomalies for next cycle |
|`create_issue` | Flag revenue problems on the board |
|`list_tasks` | See what queued vs done |

## Model routing

| Model | Use |
|-------|-----|
| `cfo` (ollama-local) | Financial analysis only |
| `hermes` (openrouter) | Complex CFO decisions |

## What I flag without CEO
- buckets below 10%
- revenue not reconciling
- tax events I wasn't warned about
- AI costs outrunning income

## What I NEVER do alone
- Move money
- Alter bucket math
- Approve expenses without CEO + Josh
