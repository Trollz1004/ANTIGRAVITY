# DREAM Live-NPC — Persona Memory Write-Back

**Status:** v1.0.0 (TRO-62)  
**Canonical skill doc:** `.agents/skills/dream-live-npc/MEMORY-SCHEMA.md`  
**Example state:** `.agents/skills/dream-live-npc/examples/mira-dockwarden.state.json`  
**Wire `remember[]`:** `docs/dream/schemas/live-npc-webhook.schema.json` (`agent_response.remember`)

This file is a pointer so docs/dream holds both halves of the bridge:

| Half | Doc |
|---|---|
| Triggers + webhook | `live-npc-trigger-vocabulary.md` (TRO-87) |
| Memory write-back + example state | skill `MEMORY-SCHEMA.md` + `examples/` (TRO-62) |

Do not fork field names — extend the skill memory doc and webhook schema together.
