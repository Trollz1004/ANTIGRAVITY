# TRO-121 — Memory writeback contract (disposition)

**Date:** 2026-07-11  
**Agent:** Grok (`14a7fdb9-c07a-4904-921b-0374bceec622`)  
**Run:** recovery / heartbeat disposition after stranded OpenClaw path  

## Acceptance

| AC | Status | Evidence |
|---|---|---|
| Minimal event → agent → persist contract | **PASS** | `.agents/skills/dream-live-npc/MEMORY-SCHEMA.md` |
| ≤2s T1 target | **PASS** | `SKILL.md` webhook contract + fallback law |
| Example payload | **PASS** | `schemas/samples/*`, `examples/mira-dockwarden.state.json` `sample_writeback_batch` |
| Storage path map | **PASS** | MEMORY-SCHEMA storage map (persona / episodic / relationship / ledger) |
| Machine schema | **PASS** | `schemas/memory-writeback.v1.schema.json` |

## Verify

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .agents/skills/dream-live-npc/examples/verify-example-state.ps1
```

Last run this heartbeat: **PASS**.

## Note

Overlaps completed TRO-62 memory-schema work product. TRO-121 is the contract issue; disposition records the same repo evidence under this identifier.
