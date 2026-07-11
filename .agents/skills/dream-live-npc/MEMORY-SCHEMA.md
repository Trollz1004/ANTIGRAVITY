# Live-NPC Persona Memory Write-Back Schema (DREAM Online)

**Issue:** TRO-62  
**Status:** design-complete (implementation-ready)  
**Provider constraint:** no Anthropic  
**Aligns with:** trigger/webhook `schema_version` **1.0.0** (TRO-87)  
**Skill:** `.agents/skills/dream-live-npc/`  
**Persisted example:** [`examples/mira-dockwarden.state.json`](./examples/mira-dockwarden.state.json)

## Purpose

Define how live NPC agents write persona memory after a wake, and how that state is stored so the next wake can assemble context by pointer only.

```
trigger (TRO-87) → agent wake → agent_response.remember[] → stores → next wake context_refs
```

## Design goals

1. Remember what mattered; forget what didn't (salience + decay).
2. Memory is **per-NPC** except the shared world ledger.
3. Writes are small, append-friendly, and idempotent via `event_id` / `wake_id`.
4. Player data is game-scoped IDs only — never real-world PII.
5. No Anthropic on any tier route.

## Storage map

| Store | Backend (target) | Contents | Access |
|---|---|---|---|
| Persona core | file / Postgres row | stable identity ≤40 lines | read every wake |
| Episodic | Qdrant (vector) | event memories + salience | top-k ≤8 |
| Relationships | Postgres/Supabase | npc × player scores/tags | keyed pair |
| World ledger | Postgres + cache | prices, rumors, factions | T3 write; filtered read |
| Example / sim | workspace JSON | bootstrap + AC proof | TRO-62 `examples/` |

---

## 1. Persona core (stable)

```json
{
  "schema_version": "1.0.0",
  "kind": "persona_core",
  "npc_id": "npc.mira.dockwarden",
  "tier": "T1",
  "display_name": "Mira Dockwarden",
  "identity": {
    "role": "Harbor pier boss and rope-yard keeper",
    "faction": "dock_union",
    "speech_style": "terse, salt-dry humor, never flowery",
    "drives": ["keep the pier working", "protect regulars", "hate rats"],
    "fears": ["fire near the tar sheds", "union betrayal"],
    "taboos": ["never discuss real-world company/mission topics"]
  },
  "mood_baseline": 0.0,
  "provider_route": {
    "primary": "ollama_cloud_or_openrouter_free",
    "fallback": "canned_pool",
    "forbidden": ["anthropic"]
  },
  "revision": 1
}
```

Hard cap: persona narrative fields ≤40 lines when rendered into the agent prompt.

---

## 2. Agent `remember[]` write unit (wire contract)

Matches `agent_response.remember` in `live-npc-webhook.schema.json`:

```json
{
  "kind": "episodic",
  "event": "player_asked_about_pier_work",
  "actors": ["ply_1001"],
  "salience": 0.35,
  "decay_class": "normal"
}
```

| Field | Rules |
|---|---|
| `kind` | `episodic` \| `relationship` \| `world_ledger` |
| `event` | short snake or prose slug; no PII |
| `actors` | game IDs only (`ply_*`, `npc.*`) |
| `salience` | 0.0–1.0 recall weight |
| `decay_class` | `ephemeral` \| `normal` \| `sticky` (schema enum) |

### Orchestrator expansion (storage rows)

The orchestrator expands each `remember` item into a durable row before insert:

```json
{
  "schema_version": "1.0.0",
  "kind": "episodic",
  "memory_id": "mem_e1a9",
  "npc_id": "npc.mira.dockwarden",
  "wake_id": "wk_demo_001",
  "event_id": "c3333333-3333-4333-8333-333333333333",
  "ts": "2026-07-11T14:03:01.000Z",
  "event": "player_asked_about_pier_work",
  "actors": ["ply_1001"],
  "location_id": "zone.harbor.pier",
  "salience": 0.35,
  "decay_class": "normal",
  "tags": ["work", "rats", "first_contact"],
  "embedding_text": "Mira: ply_1001 asked for pier work; rats mentioned"
}
```

### Relationship expansion

```json
{
  "schema_version": "1.0.0",
  "kind": "relationship",
  "npc_id": "npc.mira.dockwarden",
  "player_id": "ply_1001",
  "score": 0.18,
  "score_delta_applied": 0.06,
  "tags": ["asked_for_work", "first_contact"],
  "last_seen": "2026-07-11T14:03:01.000Z",
  "last_location_id": "zone.harbor.pier",
  "notes": "Offered rat job; wariness slightly up"
}
```

Score clamp: `-1.0` … `+1.0`.

### World ledger expansion

```json
{
  "schema_version": "1.0.0",
  "kind": "world_ledger",
  "region_id": "zone.harbor.a1",
  "ts": "2026-07-11T14:00:00.000Z",
  "prices": { "fish": 1.08, "rope": 0.95 },
  "rumors": [
    {
      "rumor_id": "rumor.rats_surge",
      "text": "Rats thicker near tar sheds after last freighter",
      "confidence": 0.6,
      "source_npc": "npc.mira.dockwarden"
    }
  ],
  "faction_standing": { "dock_union": 0.52, "harbor_guard": 0.48 }
}
```

Rules:

- NPCs **never** read each other's private episodic stores.
- Cross-NPC knowledge flows only via ledger rumors + in-world speech.
- Judge arbitration outcomes (Coleman pattern) write to the ledger.

---

## 3. Recall assembly (orchestrator → wake)

Wake body (TRO-87) points; agent does not receive full dumps:

```json
"context_refs": [
  { "kind": "persona", "id": "npc.mira.dockwarden" },
  { "kind": "relationship", "id": "npc.mira.dockwarden:ply_1001" },
  { "kind": "episode_query", "id": "top_k=8" }
]
```

Recall query parameters:

| Param | Default | Notes |
|---|---|---|
| `k` | 8 | max episodic rows |
| `min_salience` | 0.1 | floor after decay |
| `boost_actors` | actor ids from trigger | relationship-aware ranking |

Decay job (scheduled): apply class factors (`ephemeral` hours, `normal` days, `sticky` weeks+); drop below floor; promote high-replay rows toward `sticky`.

---

## 4. Unified write-back batch (orchestrator internal)

```json
{
  "schema_version": "1.0.0",
  "kind": "writeback_batch",
  "npc_id": "npc.mira.dockwarden",
  "wake_id": "wk_demo_001",
  "event_id": "c3333333-3333-4333-8333-333333333333",
  "writes": [
    {
      "kind": "episodic",
      "event": "player_asked_about_pier_work",
      "actors": ["ply_1001"],
      "salience": 0.35,
      "decay_class": "normal"
    },
    {
      "kind": "relationship",
      "event": "relationship_delta",
      "actors": ["ply_1001"],
      "salience": 0.3,
      "decay_class": "sticky"
    },
    {
      "kind": "world_ledger",
      "event": "rumor_rats_surge",
      "actors": ["npc.mira.dockwarden"],
      "salience": 0.5,
      "decay_class": "normal"
    }
  ]
}
```

Apply transactionally per `(npc_id, event_id)` for idempotency.

Machine schema for expanded batch: [`schemas/memory-writeback.v1.schema.json`](./schemas/memory-writeback.v1.schema.json) (skill-local; wire `remember[]` remains owned by TRO-87 webhook schema).

---

## 5. Safety rails (absolute)

- No real-world mission/company/canonical-7 language in any memory field.
- No Anthropic provider on any tier route.
- Player data = game `player_id` + in-game acts only.
- Rating-compliance rejections: discard `say`/`do`; may still allow sanitized memory write if judge approves.
- Fallback law: budget miss still queues a minimal `remember` template so the encounter is not forgotten.

---

## 6. AC map (TRO-62)

| AC | Artifact |
|---|---|
| Doc in skill | this file + `TRIGGER-VOCABULARY.md` pointer + `SKILL.md` |
| ≥5 trigger types | 12 types in TRO-87 canonical vocabulary |
| Persist example state | `examples/mira-dockwarden.state.json` (+ verify stamp) |
