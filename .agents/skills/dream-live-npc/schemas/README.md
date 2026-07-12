# Live-NPC schema stubs (TRO-87 + TRO-62 + TRO-121)

Machine-readable contracts for the DREAM Live-NPC bridge.

| File | Role | Owner issue |
|---|---|---|
| `live-npc-webhook.schema.json` | Trigger envelope, agent wake, agent response | TRO-87 |
| `memory-writeback.v1.schema.json` | Orchestrator expansion of `remember[]` → durable batch | TRO-62 / TRO-121 |
| `npc-memory-artifact.v1.schema.json` | Read-optimized NPC memory artifact (id, zone, last_seen, sentiment, history[]) | TRO-286 |
| `samples/player_enter_zone.json` | Sample `player.enter_zone` | TRO-87 |
| `samples/need_spend.json` | Sample `need.spend` | TRO-87 |
| `samples/npc_spoken_to.json` | Sample `npc.spoken_to` (primary T1 demo) | TRO-87 |
| `samples/agent_wake.json` | Orchestrator → agent wake body | TRO-87 |
| `samples/agent_response.json` | Agent → orchestrator response body | TRO-87 |
| `samples/memory_writeback_batch.json` | Expanded write-back batch example | TRO-121 |
| `samples/npc_memory_artifact.json` | Sample NPC memory artifact (Mira Dockwarden) | TRO-286 |

| Human docs | Path |
|---|---|
| Trigger vocabulary | `docs/dream/live-npc-trigger-vocabulary.md` |
| **Minimal write-back contract (≤2s + storage paths)** | `.agents/skills/dream-live-npc/WRITEBACK-CONTRACT.md` |
| Memory field design | `.agents/skills/dream-live-npc/MEMORY-SCHEMA.md` |
| Trigger pointer in skill | `.agents/skills/dream-live-npc/TRIGGER-VOCABULARY.md` |
| Example persisted state | `.agents/skills/dream-live-npc/examples/mira-dockwarden.state.json` |
| Docs-tree pointer | `docs/dream/live-npc-memory-writeback-contract.md` |

Canonical webhook schema (docs tree): `docs/dream/schemas/live-npc-webhook.schema.json`  
Keep skill stubs in sync with the docs-tree schema when bumping `schema_version`.
