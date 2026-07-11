# DREAM Live-NPC — Trigger Vocabulary & Webhook Payload Schema

**Status:** v1.0.0 (canonical for TRO-87)  
**Date:** 2026-07-11  
**Skill:** `.agents/skills/dream-live-npc/`  
**Machine schema:** `docs/dream/schemas/live-npc-webhook.schema.json`  
**Skill stub:** `.agents/skills/dream-live-npc/schemas/`

## Purpose

Exact event names and payload shapes for the Live-NPC bridge:

```
game event → orchestrator webhook → agent wake → action + memory write-back
```

Acceptance for this contract:

1. Vocabulary and envelope documented here.
2. JSON Schema in `docs/dream/schemas/`.
3. Stub schemas + sample payloads under the `dream-live-npc` skill.

## Design laws

| Law | Rule |
|---|---|
| Pointer payloads | Carry IDs and deltas only — never full world state |
| Versioned | Every envelope includes `schema_version` |
| Small surface | Prefer a small event set; extend only when a new agent decision is required |
| Fallback | Missed budget → canned line; memory still queues async |
| Fourth wall | No real-world mission/company framing in payloads or NPC outputs |
| NEEDs product-only | `need.spend` / `need.earn` are in-game currency events, never mission/benefit framing |

## Envelope (all triggers)

Every game→orchestrator event uses this envelope:

```json
{
  "schema_version": "1.0.0",
  "event_id": "9f2c1a6e-4b0d-4c8a-9e11-2d7f0b1c3a55",
  "event_type": "player.enter_zone",
  "occurred_at": "2026-07-11T14:00:00.000Z",
  "trace_id": "trc_01JZX…",
  "source": {
    "server_id": "dream-main",
    "region_id": "zone.harbor.a1",
    "shard": "default",
    "engine": "unreal",
    "build": "0.0.0-dev"
  },
  "actor": {
    "player_id": "ply_1001",
    "npc_id": null,
    "session_id": "sess_abc"
  },
  "context_refs": [
    { "kind": "zone", "id": "zone.harbor.a1" },
    { "kind": "player", "id": "ply_1001" }
  ],
  "payload": {}
}
```

### Envelope fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `schema_version` | string (semver) | yes | Currently `1.0.0` |
| `event_id` | uuid string | yes | Idempotency key for orchestrator |
| `event_type` | enum string | yes | Canonical dotted name from vocabulary below |
| `occurred_at` | ISO-8601 UTC | yes | Game-clock or wall-clock; document which in `source` later if they diverge |
| `trace_id` | string | no | Cross-service correlation |
| `source` | object | yes | Server/region identity |
| `actor` | object | yes | At least one of `player_id` / `npc_id` depending on event |
| `context_refs` | array | yes | Pointers for agent context assembly (may be empty `[]`) |
| `payload` | object | yes | Event-specific body; schema by `event_type` |

### Naming convention

- **Canonical names** use dotted form: `domain.action` (e.g. `player.enter_zone`).
- **Snake aliases** (Unreal / blueprint exports) map 1:1 — see alias table.
- Do not invent parallel names in adapters; map aliases → canonical at the edge.

| Canonical `event_type` | Snake alias (game export) |
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

---

## Trigger vocabulary (v1)

### A. Player / zone

#### `player.enter_zone`

Fires when a player crosses into a zone/volume that can wake zone-bound NPCs.

**payload**

| Field | Type | Required | Notes |
|---|---|---|---|
| `zone_id` | string | yes | Stable zone key |
| `from_zone_id` | string \| null | no | Previous zone if known |
| `position` | `{x,y,z}` numbers | no | Approximate; agent should not depend on precision |
| `reason` | enum | no | `walk` \| `spawn` \| `teleport_denied_fallback` \| `login` |

**Sample**

```json
{
  "schema_version": "1.0.0",
  "event_id": "a1111111-1111-4111-8111-111111111111",
  "event_type": "player.enter_zone",
  "occurred_at": "2026-07-11T14:01:00.000Z",
  "source": { "server_id": "dream-main", "region_id": "zone.harbor.a1", "shard": "default", "engine": "unreal", "build": "0.0.0-dev" },
  "actor": { "player_id": "ply_1001", "npc_id": null, "session_id": "sess_abc" },
  "context_refs": [
    { "kind": "zone", "id": "zone.harbor.a1" },
    { "kind": "player", "id": "ply_1001" }
  ],
  "payload": {
    "zone_id": "zone.harbor.a1",
    "from_zone_id": "zone.road.north",
    "position": { "x": 120.5, "y": 2.0, "z": -44.1 },
    "reason": "walk"
  }
}
```

#### `player.leave_zone`

Symmetric leave event. Same payload shape; `from_zone_id` is the zone left, `zone_id` may be destination if known.

---

### B. Economy (NEEDs — product currency only)

#### `need.spend`

Player spends NEEDs (convenience / catalog purchase). Not a control/ownership signal.

**payload**

| Field | Type | Required | Notes |
|---|---|---|---|
| `amount` | number (int ≥ 1) | yes | Units spent |
| `balance_after` | number (int ≥ 0) | no | Pointer convenience for UI; agent may re-fetch |
| `sku` | string | yes | Product/catalog key (cosmetic, convenience, etc.) |
| `merchant_npc_id` | string \| null | no | If spend is at an NPC vendor |
| `location_id` | string | no | Zone or stall id |
| `tx_id` | string | yes | Ledger idempotency id |

**Sample**

```json
{
  "schema_version": "1.0.0",
  "event_id": "b2222222-2222-4222-8222-222222222222",
  "event_type": "need.spend",
  "occurred_at": "2026-07-11T14:02:00.000Z",
  "source": { "server_id": "dream-main", "region_id": "zone.harbor.a1", "shard": "default", "engine": "unreal", "build": "0.0.0-dev" },
  "actor": { "player_id": "ply_1001", "npc_id": null, "session_id": "sess_abc" },
  "context_refs": [
    { "kind": "player", "id": "ply_1001" },
    { "kind": "npc", "id": "npc.vendor.harbor_quartermaster" },
    { "kind": "sku", "id": "cosmetic.cloak.harbor_blue" }
  ],
  "payload": {
    "amount": 50,
    "balance_after": 450,
    "sku": "cosmetic.cloak.harbor_blue",
    "merchant_npc_id": "npc.vendor.harbor_quartermaster",
    "location_id": "stall.harbor.q1",
    "tx_id": "need_tx_7781"
  }
}
```

#### `need.earn`

Player earns NEEDs (quest reward, salvage convenience credit, etc.). Same fields as spend except `amount` is credit; `sku` may be reward package id.

---

### C. NPC interaction (core live loop)

#### `npc.approached`

Player enters NPC interaction radius.

**payload:** `{ "npc_id", "player_id", "relationship_score"?: number, "location_id"?: string, "distance_m"?: number }`

#### `npc.spoken_to`

Player sends an utterance to an NPC (primary T1 demo trigger).

**payload:** `{ "npc_id", "player_id", "utterance": string, "convo_id": string, "channel"?: "say"|"whisper"|"emote" }`

#### `npc.witnessed`

NPC observes a world act (theft, combat, gift, death, cheat_flag).

**payload:** `{ "npc_id", "event_kind": string, "actors": string[], "location_id"?: string, "salience"?: number }`

#### `npc.affected`

NPC is directly affected (robbed, helped, saved, insulted, gifted).

**payload:** `{ "npc_id", "effect": string, "source_player_id"?: string, "source_npc_id"?: string, "magnitude"?: number }`

#### `npc.idle_heartbeat`

Low-frequency wake so NPC may initiate (letters, move, rumors).

**payload:** `{ "npc_id", "day_phase"?: string, "idle_seconds"?: number }`

---

### D. World / systems

#### `world.tick`

Region batch input for T3 world actors.

**payload:** `{ "region_id", "day_phase", "economy_deltas"?: object, "tick_index": number }`

#### `quest.updated`

Quest state change that may involve a quest-giver NPC.

**payload:** `{ "quest_id", "player_id", "from_state", "to_state", "npc_id"?: string }`

#### `combat.ended`

Useful for witness memory and Ban Hammer / safety spectacles (game-side resolution already done).

**payload:** `{ "encounter_id", "winners": string[], "losers": string[], "location_id"?: string, "flags"?: string[] }`

---

## Orchestrator → agent wake

```
POST /npc/{npc_id}/wake
Content-Type: application/json
```

```json
{
  "schema_version": "1.0.0",
  "wake_id": "wk_01J…",
  "npc_id": "npc.vendor.harbor_quartermaster",
  "tier": "T1",
  "trigger": {
    "event_id": "b2222222-2222-4222-8222-222222222222",
    "event_type": "need.spend",
    "occurred_at": "2026-07-11T14:02:00.000Z"
  },
  "context_refs": [
    { "kind": "persona", "id": "npc.vendor.harbor_quartermaster" },
    { "kind": "relationship", "id": "npc.vendor.harbor_quartermaster:ply_1001" },
    { "kind": "episode_query", "id": "top_k=8" }
  ],
  "budget": {
    "latency_ms": 2000,
    "model_class": "T1"
  },
  "payload_ref": {
    "kind": "trigger_event",
    "id": "b2222222-2222-4222-8222-222222222222"
  }
}
```

Agent pulls persona / episodic / relationship via `context_refs` (pointer assembly). Do not embed full memory in the wake body.

### Agent response (≤2s T1, ≤5s T2)

```json
{
  "schema_version": "1.0.0",
  "wake_id": "wk_01J…",
  "npc_id": "npc.vendor.harbor_quartermaster",
  "ok": true,
  "latency_ms": 840,
  "say": "Harbor blue suits you. Wear it where the salt can see it.",
  "do": [
    { "action": "emote", "name": "nod" }
  ],
  "remember": [
    {
      "kind": "episodic",
      "event": "sold_cloak_harbor_blue",
      "actors": ["ply_1001"],
      "salience": 0.55,
      "decay_class": "normal"
    }
  ],
  "mood_delta": 0.05,
  "world_effects": [],
  "fallback_used": false
}
```

On timeout/budget miss: orchestrator plays canned line, sets `fallback_used: true` server-side, still queues `remember` from a minimal template.

---

## Routing hints (who wakes)

| Event | Typical wake target |
|---|---|
| `player.enter_zone` | Zone-bound T1 NPCs with `on_enter` subscription (cap N) |
| `need.spend` with `merchant_npc_id` | That merchant NPC |
| `npc.spoken_to` / `npc.approached` | Named `npc_id` |
| `npc.witnessed` / `npc.affected` | Named `npc_id` |
| `npc.idle_heartbeat` | Single `npc_id` |
| `world.tick` | T3 world actors for region (batch) |
| `quest.updated` | Quest-giver `npc_id` if present |
| `combat.ended` + cheat flags | Ban Hammer (T2) only when flags include enforcement triggers |

---

## Validation rules

1. Unknown `event_type` → reject 400, do not wake agents.
2. Duplicate `event_id` within retention window → ack 200, no double-wake.
3. `need.spend` / `need.earn` require `tx_id`; ledger is source of truth.
4. Payload must not include real-world PII (email, phone, legal name).
5. Payload must not include banned public-surface / mission framing terms.
6. `context_refs` are required keys even when empty.

---

## Stub locations

| Artifact | Path |
|---|---|
| This doc | `docs/dream/live-npc-trigger-vocabulary.md` |
| JSON Schema (full) | `docs/dream/schemas/live-npc-webhook.schema.json` |
| Skill index | `.agents/skills/dream-live-npc/SKILL.md` |
| Skill schema stub | `.agents/skills/dream-live-npc/schemas/live-npc-webhook.schema.json` |
| Sample events | `.agents/skills/dream-live-npc/schemas/samples/` |

## Versioning

- Breaking field removals/renames → bump `schema_version` major.
- New optional fields or new event types → minor.
- Docs-only clarifications → patch.

## Related

- Skill design: `.agents/skills/dream-live-npc/SKILL.md`
- Project phase order: `paperclip-tro/projects/PROJECT-2-DREAM-ONLINE.md`
- Separation doctrine: `briefings/DREAM-ONLINE-AND-DAO-SEPARATION-2026-07-01.md`
