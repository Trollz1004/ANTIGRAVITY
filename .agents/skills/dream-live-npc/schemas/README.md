# Live-NPC schema stubs (TRO-87 + TRO-62)

Machine-readable contracts for the DREAM Live-NPC bridge.

| File | Role | Owner issue |
|---|---|---|
| `live-npc-webhook.schema.json` | Trigger envelope, agent wake, agent response | TRO-87 |
| `memory-writeback.v1.schema.json` | Orchestrator expansion of `remember[]` → durable batch | TRO-62 |
| `samples/player_enter_zone.json` | Sample `player.enter_zone` | TRO-87 |
| `samples/need_spend.json` | Sample `need.spend` | TRO-87 |
| `samples/npc_spoken_to.json` | Sample `npc.spoken_to` (primary T1 demo) | TRO-87 |
| `samples/agent_wake.json` | Orchestrator → agent wake body | TRO-87 |
| `samples/agent_response.json` | Agent → orchestrator response body | TRO-87 |

| Human docs | Path |
|---|---|
| Trigger vocabulary | `docs/dream/live-npc-trigger-vocabulary.md` |
| Memory write-back | `.agents/skills/dream-live-npc/MEMORY-SCHEMA.md` |
| Trigger pointer in skill | `.agents/skills/dream-live-npc/TRIGGER-VOCABULARY.md` |
| Example persisted state | `.agents/skills/dream-live-npc/examples/mira-dockwarden.state.json` |

Canonical webhook schema (docs tree): `docs/dream/schemas/live-npc-webhook.schema.json`  
Keep skill stubs in sync with the docs-tree schema when bumping `schema_version`.
