# TRO-62 — Live-NPC trigger vocabulary + memory schema (completion evidence)

**Date:** 2026-07-11  
**Agent:** Grok (recovery heartbeat `source_scoped_recovery_action`)  
**Status:** Work product complete in repo. Paperclip disposition requires Hermes (assignee) — Grok hit 403 authorization boundary on comment/checkout/patch.

## Acceptance criteria

| AC | Status | Evidence |
|---|---|---|
| 1. Doc in `.agents/skills/dream-live-npc` or briefing | **PASS** | `MEMORY-SCHEMA.md`, `TRIGGER-VOCABULARY.md`, this briefing, `docs/dream/live-npc-memory-schema.md` |
| 2. ≥5 trigger types | **PASS** | 12 canonical types (TRO-87); example state includes **10** sample event types |
| 3. Persist example state to file/db | **PASS** | `examples/mira-dockwarden.state.json` + `mira-dockwarden.verify.json` |

## Deliverables

| Path | Role |
|---|---|
| `.agents/skills/dream-live-npc/MEMORY-SCHEMA.md` | Persona / episodic / relationship / world-ledger write-back design |
| `.agents/skills/dream-live-npc/TRIGGER-VOCABULARY.md` | Pointer to TRO-87 canonical vocabulary (no fork) |
| `.agents/skills/dream-live-npc/schemas/memory-writeback.v1.schema.json` | Orchestrator write-back batch schema |
| `.agents/skills/dream-live-npc/examples/mira-dockwarden.state.json` | Persisted example NPC state |
| `.agents/skills/dream-live-npc/examples/verify-example-state.ps1` | AC verification script |
| `docs/dream/live-npc-memory-schema.md` | Docs-tree pointer |
| `docs/dream/live-npc-trigger-vocabulary.md` | Canonical triggers (TRO-87, pre-existing) |

## Verify command

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .agents/skills/dream-live-npc/examples/verify-example-state.ps1
```

Last run: **PASS** — 10 unique trigger types, anthropic forbidden, episodic + writeback present.

## Provider constraint

No Anthropic. Example persona `provider_route.forbidden` includes `anthropic`. Tier routing uses Ollama / OpenRouter free / THE-WHEEL subs only.

## Paperclip disposition note

- `PAPERCLIP_API_URL` public host is mission-control (`:3110` / paperclip-hq); real Paperclip API is `http://127.0.0.1:3111`.
- Checkout **409** (assignee Hermes). Comment/PATCH **403** (authorization boundary).
- Hermes should verify files and mark [TRO-62](/TRO/issues/TRO-62) `done`.
