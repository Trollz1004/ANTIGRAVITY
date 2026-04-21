# DEPRECATE-OLD-PAPERCLIP.md — Retirement Plan for localhost:3100

## What

The original Paperclip instance running on Sabretooth at `localhost:3100` and
`paperclip-hq.youandinotai.com` is being retired in favor of `paperclip-9020/` — a
local-only, single-CEO instance on node 9020.

## Why

- **Drift surface**: 5+ agents (CEO, CFO, CSO, CTO, CMO, UX Designer, 2 Mission Guardians)
  on mixed cloud models (glm-5.1:cloud, qwen3-coder, dateapp-marketingtools, dateapp)
- **Compounding drift**: one agent's small drift becomes another's prompt input
- **24/7 with no supervisor**: Josh works 20-hour days; drift happens at 3am
- **Cannot go live**: first revenue dollar cannot land on a drift-prone surface

## Retirement Sequence (NOT YET — awaiting Josh's confirm)

1. **Stage 1 (current)**: `paperclip-9020/` files committed to repo. Bootstrap ready.
2. **Stage 2**: Codex (via MCP) executes `bootstrap-9020.ps1` on node 9020.
3. **Stage 3**: Josh confirms Hermes CEO is online and stable for 7 days.
4. **Stage 4**: Old Paperclip agents switched to **read-only mode** (no new issues, no
   comments, no skill execution). Mission Guardians keep running for parallel audit.
5. **Stage 5**: Old Paperclip data exported to `docs/archive/paperclip-original/`.
6. **Stage 6**: Old Paperclip container stopped, disabled from auto-start.
7. **Stage 7**: `paperclip-hq.youandinotai.com` Cloudflare tunnel removed.

## What Stays

- Repo instruction files in `paperclip/agents/` — keep as **historical reference** until
  Stage 5 export completes, then move to `docs/archive/paperclip-original/`.
- 4-DAO canonical docs in `briefings/` — unaffected, they're not Paperclip-bound.
- GitHub daily audit workflow — unaffected, runs independent of Paperclip.

## What Goes Away

- 8 agents (CEO, CFO, CSO, CTO, CMO, UX, 2 Guardians) on old Paperclip
- All mixed-model adapters (hermes_local, glm-5.1:cloud, qwen3-coder, dateapp*)
- `paperclip-hq.youandinotai.com` public tunnel (local-only going forward)

## Rollback

If `paperclip-9020/` has problems, rollback is:
1. Stop Hermes on 9020
2. Re-enable old Paperclip on Sabretooth (it's still installed, just dormant)
3. File incident issue, debug, re-attempt

No data loss — everything is version-controlled in the repo.

## Owner

Josh approves each stage transition. Hermes executes once approved.
