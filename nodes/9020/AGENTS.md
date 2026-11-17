# AGENTS.md — Retired Third-Node Record

**STATUS: RETIRED HARDWARE NODE RECORD (DO NOT RUN OR SCHEDULE WORKLOADS HERE).**

This legacy node has been permanently decommissioned. The active `Trollz1004` fleet runs on **two nodes only** as defined in `ops/fleet/fleet-map.json` and `docs/house/NODES.md`:
- **Alienware** (`192.168.0.40`): Workshop, DREAM Engine (`:9180`), Lead-Gen Studio (`:8392`), Media/TTS Worker (`:8391`), OPSis Studio (`:8390`), Free Claude Code (`:8082`).
- **T5500** (`192.168.0.15`): Front-of-House, Mission OS (`:3130`), OmniRoute (`:20128`), Hermes (`:8643` / `:9119`), Shared `ai-memory` MCP (`:49374`), Production Domains.

## Disposition & Governance

- Any active content, product marketing, or operations guidance lives under `docs/standards/AGENT-STANDARD.md`, `docs/standards/ALIENWARE-SOUL.md`, and `ops/fleet/fleet-map.json`.
- Never configure, target, mount, or restore services for this retired node.
- Product-only marketing scope applies fleet-wide (`YouAndINotAI`, `DREAM Online`, `OnlineRecycle`).
- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).
