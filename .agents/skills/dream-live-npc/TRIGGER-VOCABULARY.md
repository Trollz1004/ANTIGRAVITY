# Trigger Vocabulary — pointer (do not fork)

**Canonical human doc:** [`docs/dream/live-npc-trigger-vocabulary.md`](../../../docs/dream/live-npc-trigger-vocabulary.md)  
**Canonical JSON Schema:** [`docs/dream/schemas/live-npc-webhook.schema.json`](../../../docs/dream/schemas/live-npc-webhook.schema.json)  
**Skill stubs + samples:** [`schemas/`](./schemas/)  
**Issue of record for envelope/webhook:** TRO-87

## v1 event types (12)

| Canonical | Snake alias |
|---|---|
| `player.enter_zone` | `player_enter_zone` |
| `player.leave_zone` | `player_leave_zone` |
| `need.spend` | `need_spend` |
| `need.earn` | `need_earn` |
| `npc.approached` | `npc_approached` |
| `npc.spoken_to` | `npc_spoken_to` |
| `npc.witnessed` | `npc_witnessed` |
| `npc.affected` | `npc_affected` |
| `npc.idle_heartbeat` | `npc_idle_heartbeat` |
| `world.tick` | `world_tick` |
| `quest.updated` | `quest_updated` |
| `combat.ended` | `combat_ended` |

## Envelope (summary)

```json
{
  "schema_version": "1.0.0",
  "event_id": "uuid",
  "event_type": "npc.spoken_to",
  "occurred_at": "2026-07-11T14:00:00.000Z",
  "source": { "server_id": "dream-main", "region_id": "zone.harbor.a1", "shard": "default", "engine": "unreal", "build": "0.0.0-dev" },
  "actor": { "player_id": "ply_1001", "npc_id": "npc.mira.dockwarden", "session_id": "sess_abc" },
  "context_refs": [],
  "payload": {}
}
```

TRO-62 owns **persona memory write-back + persisted example state** — see `MEMORY-SCHEMA.md` and `examples/`.
Do not invent parallel trigger field names here; extend the canonical doc + schema instead.
