# Retired v1 Orchestrator State Log

> **Status: RETIRED ARCHIVE.** The legacy control plane formerly tracked in this file was permanently retired on 2026-11-09. Active session journals now live in `.agents/journals/<lane>/STATE.md` and `ops/buzz/BUZZ-NODE-LEDGER.md`.

## Active State Locations

- **Fleet state & ports**: `ops/fleet/fleet-map.json` (**Alienware** `192.168.0.40`, **T5500** `192.168.0.15`)
- **Mission OS**: `http://192.168.0.15:3130` (`.agents/skills/mission-control/SKILL.md`)
- **Lane journals**:
  - `.agents/journals/claude-judge/STATE.md`
  - `.agents/journals/codex/STATE.md`
  - `.agents/journals/hermes/STATE.md`
  - `.agents/journals/openclaw/STATE.md`
  - `.agents/journals/opencode/STATE.md`
  - `.agents/journals/emergent/STATE.md`
  - `.agents/journals/genspark/STATE.md`
- **Historical note**: Pre-retirement bridge notes (`bridge/.env.example`, `relay.test.js`) remain frozen as legacy code artifacts; no retired runtime endpoints are active.
