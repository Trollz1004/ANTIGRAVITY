# paperclip-9020 — Local-Only Paperclip (Hermes CEO)

Fresh Paperclip instance running on node 9020 (192.168.0.5). Single CEO agent.
Claude + Codex APIs only. No cloud model mixing. No 5-exec cabinet.

## Why This Exists

The original Paperclip (`localhost:3100` / `paperclip-hq.youandinotai.com`) runs 5+ agents
on cloud-routed GLM / Qwen / mixed Ollama models. Drift compounds — one agent's small
drift becomes the next agent's prompt input. Josh works 20-hour days and cannot catch
every drift in real time. Going live with first revenue dollar cannot happen on a
drift-prone surface.

This instance is the replacement forward. One agent. Two APIs. Local hardware.

## Topology

- **Node**: 9020 at `192.168.0.5`
- **GPU**: RTX 2070 8GB (being installed)
- **Paperclip port**: 5555
- **OpenClaw port**: 4444
- **Date app port**: 3100 (stays untouched on Sabretooth)
- **Postgres**: local container on 9020

## Agent Roster

| Agent | Dir | Adapters | Heartbeat |
|-------|-----|----------|-----------|
| Hermes CEO | `agents/hermes-ceo/` | claude_local + codex_local | 1h (business) / 4h (overnight) |

That's it. No CFO, CSO, CTO, CMO, UX, or Guardians in this instance. Solo by design.

## IDs

- Company ID: cbb68f29-9f90-4295-a11f-7f8b928d37bc
- ANTIGRAVITY Project ID: 4e9d37a4-4111-4b74-8ea3-e45b3161f27a
- Hermes Agent ID: assigned at bootstrap

## Model Policy (HARD RULE)

- Only `claude_local` (Claude API) and `codex_local` (Codex MCP) are authorized
- GLM / Qwen / Ollama / any other cloud model is **banned** on this instance
- If both Claude and Codex are down, Hermes stops. No fallback.

## Bootstrap

Codex executes `bootstrap-9020.ps1` on node 9020 to spin up:
1. Python 3.11+ check + install if missing
2. Node 20+ check + install if missing
3. Docker Desktop check (postgres container)
4. Paperclip install at `C:\paperclip-9020\` from source
5. OpenClaw at port 4444
6. Paperclip at port 5555
7. Hermes agent registration from `/agents/hermes-ceo/*.md`
8. GitHub MCP scoped to `trollz1004/antigravity` only
9. Claude + Codex API key injection from `.env`
10. First heartbeat

## Relationship to Old Paperclip

The old Paperclip at `localhost:3100` / `paperclip-hq.youandinotai.com` stays up in
audit-only mode until Josh confirms this instance is stable. Then it gets archived.

Mission Guardians (Claude + Codex) can remain in the old Paperclip as daily-audit-only
nodes if Josh wants a second set of eyes. Otherwise they retire when the old instance
does.

## GitHub Audit

Daily doctrine audit runs via `.github/workflows/daily-doctrine-audit.yml`. Hermes reviews
the output each morning at first heartbeat. Any violation → URGENT issue to Josh.

## Revenue-First Mandate

Every decision filters through: "does this get Josh paid this month?" If no, it waits.
Josh has ~2 weeks of runway as of 2026-04-21. Phase 1 launch ($LOVE + $AGRAV via Square)
is the only priority until first dollar clears.
