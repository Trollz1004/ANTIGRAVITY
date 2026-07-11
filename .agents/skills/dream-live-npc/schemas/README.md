# Live-NPC schema stubs (TRO-87)

Machine-readable contracts for the DREAM Live-NPC bridge.

| File | Role |
|---|---|
| `live-npc-webhook.schema.json` | JSON Schema draft 2020-12 — trigger envelope, agent wake, agent response |
| `samples/player_enter_zone.json` | Sample `player.enter_zone` (alias `player_enter_zone`) |
| `samples/need_spend.json` | Sample `need.spend` (alias `need_spend`) |
| `samples/npc_spoken_to.json` | Sample `npc.spoken_to` (primary T1 demo trigger) |
| `samples/agent_wake.json` | Orchestrator → agent wake body |
| `samples/agent_response.json` | Agent → orchestrator response body |

Canonical human doc: `docs/dream/live-npc-trigger-vocabulary.md`  
Canonical schema (docs tree): `docs/dream/schemas/live-npc-webhook.schema.json`

Keep skill stubs in sync with the docs-tree schema when bumping `schema_version`.
