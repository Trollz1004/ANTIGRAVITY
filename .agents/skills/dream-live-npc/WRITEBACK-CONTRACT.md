# Live-NPC Memory Write-Back Contract (minimal)

**Issue:** TRO-121  
**Status:** contract-complete (implementation-aligned)  
**Latency target:** **≤2000 ms** player-visible wake (T1)  
**Aligns with:** TRO-87 trigger/webhook `schema_version` **1.0.0**, TRO-62 memory schema, TRO-48 router roundtrip  
**Skill:** `.agents/skills/dream-live-npc/`  
**Machine schema:** [`schemas/memory-writeback.v1.schema.json`](./schemas/memory-writeback.v1.schema.json)  
**Detailed field design:** [`MEMORY-SCHEMA.md`](./MEMORY-SCHEMA.md)

## One sentence

A game event wakes an NPC agent; the agent returns `remember[]`; the orchestrator expands that into a durable write-back batch and persists it under a fixed storage path — all within the T1 **&lt;2s** budget for the player-visible reply (memory may finish async only when the budget is already spent).

```
game event (TRO-87)
    → agent_wake (orchestrator)
    → agent_response.remember[]  (≤2s T1, else canned + still remember)
    → writeback_batch            (idempotent by event_id)
    → stores                     (persona / episodic / relationship / ledger)
    → next wake context_refs
```

## Latency law

| Phase | Budget (T1) | On miss |
|---|---|---|
| Full player-visible path (wake → `say`/`do`) | **≤2000 ms** | Canned line immediately; `fallback_used: true` |
| Memory write on success path | Prefer in-budget; count toward 2s | — |
| Memory write on budget miss | **Async allowed** | Still queue minimal `remember` (fallback law) |
| T2 story-critical | ≤5000 ms | Same fallback law |

Default budget fields:

```json
"budget": { "max_latency_ms": 2000, "fallback": "canned_line" }
```

Idempotency key for persist: **`(npc_id, event_id)`**. Replay of the same event must not double-insert episodic rows.

---

## Stage 1 — Game event (input)

Envelope (owned by TRO-87):  
`.agents/skills/dream-live-npc/schemas/samples/npc_spoken_to.json`

Minimal fields the write-back path needs:

| Field | Use |
|---|---|
| `event_id` | Idempotency + lineage |
| `event_type` | Trigger class + canned fallback selection |
| `occurred_at` | Memory `ts` |
| `actor.npc_id` / `actor.player_id` | Storage keys |
| `payload` | Pointers only (IDs/deltas), not full world state |

---

## Stage 2 — Agent wake (orchestrator → agent)

Sample: [`schemas/samples/agent_wake.json`](./schemas/samples/agent_wake.json)

```json
{
  "schema_version": "1.0.0",
  "wake_id": "wk_demo_001",
  "npc_id": "npc.vendor.harbor_quartermaster",
  "tier": "T1",
  "trigger": {
    "event_id": "c3333333-3333-4333-8333-333333333333",
    "event_type": "npc.spoken_to",
    "occurred_at": "2026-07-11T14:03:00.000Z"
  },
  "context_refs": [
    { "kind": "persona", "id": "npc.vendor.harbor_quartermaster" },
    { "kind": "relationship", "id": "npc.vendor.harbor_quartermaster:ply_1001" },
    { "kind": "episode_query", "id": "top_k=8" }
  ],
  "budget": { "max_latency_ms": 2000, "fallback": "canned_line" }
}
```

Agent assembles prompt from **pointers only** (persona ≤40 lines, top-k episodic ≤8, relationship row).

---

## Stage 3 — Agent response (agent → orchestrator)

Sample: [`schemas/samples/agent_response.json`](./schemas/samples/agent_response.json)

Wire memory unit is `remember[]` (not full storage rows):

```json
{
  "schema_version": "1.0.0",
  "wake_id": "wk_demo_001",
  "npc_id": "npc.vendor.harbor_quartermaster",
  "ok": true,
  "latency_ms": 840,
  "say": "Harbor blue suits you. Wear it where the salt can see it.",
  "do": [{ "action": "emote", "name": "nod" }],
  "remember": [
    {
      "kind": "episodic",
      "event": "player_asked_about_stock",
      "actors": ["ply_1001"],
      "salience": 0.4,
      "decay_class": "normal"
    }
  ],
  "fallback_used": false
}
```

| `remember[].kind` | Destination store |
|---|---|
| `episodic` | Vector / episodic store |
| `relationship` | Relational npc×player row |
| `world_ledger` | Shared world ledger (T3-writable; filtered read) |

Provider-internal shape used by `dream-npc-router` (`NpcResponse.memory_writeback`) is **not** the public skill wire. Router maps:

`importance` → `salience`, `summary` → `event` slug, `tags` → expanded row tags.

---

## Stage 4 — Write-back batch (orchestrator expand + persist)

Schema: [`schemas/memory-writeback.v1.schema.json`](./schemas/memory-writeback.v1.schema.json)  
Example: [`schemas/samples/memory_writeback_batch.json`](./schemas/samples/memory_writeback_batch.json)

```json
{
  "schema_version": "1.0.0",
  "kind": "writeback_batch",
  "npc_id": "npc.vendor.harbor_quartermaster",
  "wake_id": "wk_demo_001",
  "event_id": "c3333333-3333-4333-8333-333333333333",
  "writes": [
    {
      "kind": "episodic",
      "event": "player_asked_about_stock",
      "actors": ["ply_1001"],
      "salience": 0.4,
      "decay_class": "normal",
      "tags": ["stock", "harbor"],
      "location_id": "zone.harbor.pier"
    }
  ]
}
```

Apply rules:

1. Expand each `writes[]` item with `memory_id`, `ts`, `npc_id`, `wake_id`, `event_id`.
2. Transaction/idempotency scope: `(npc_id, event_id)`.
3. Never store real-world PII — game IDs only (`ply_*`, `npc.*`).
4. No Anthropic provider on any tier route.
5. On budget miss: still write at least one episodic row with low salience + tags `["fallback","async_memory"]`.

---

## Storage paths

### Logical keys (stable across backends)

| Store | Key pattern | Example |
|---|---|---|
| Persona core | `npc/{npc_id}/persona` | `npc/npc.vendor.harbor_quartermaster/persona` |
| Episodic row | `npc/{npc_id}/episodic/{memory_id}` | `npc/npc.vendor.harbor_quartermaster/episodic/mem_e1a9` |
| Relationship | `npc/{npc_id}/rel/{player_id}` | `npc/npc.vendor.harbor_quartermaster/rel/ply_1001` |
| World ledger slice | `world/{region_id}/ledger` | `world/zone.harbor.a1/ledger` |
| Write-back audit | `npc/{npc_id}/writeback/{event_id}` | `npc/npc.vendor.harbor_quartermaster/writeback/c333…` |

### Concrete backends

| Environment | Backend | Path / location |
|---|---|---|
| **Dev / sim (now)** | Process memory + skill fixtures | Router: `services/dream-npc-router/src/memory.ts` (Map) · Fixture proof: `.agents/skills/dream-live-npc/examples/mira-dockwarden.state.json` |
| **Dev file snapshot (optional)** | Workspace JSON under DREAM root | `{DREAM_ROOT}/npc-memory/{npc_id}/…` (discover mount; do not assume drive letter) |
| **Prod target** | Dream Supabase (Postgres + pgvector) | Project authority stays Dream-owned; tables sketched in MEMORY-SCHEMA.md — never vendor memory/thread features |
| **Episodic vector (prod)** | Qdrant or pgvector | Collection/table keyed by `npc_id`; filter `event_id` unique |

Router verification endpoints (local service, default `:8090`):

- `POST /npc/{npc_id}/wake` — full wake → remember → write
- `POST /webhooks/events?dispatch=1` — game event → same path
- `GET /npc/{npc_id}/memory?playerId=` — read back rows after write

---

## Example end-to-end timeline (&lt;2s)

| t (ms) | Step |
|---|---|
| 0 | Game posts `npc.spoken_to` envelope |
| 5 | Orchestrator builds `agent_wake`, loads context_refs |
| 20–1500 | Provider returns dialogue + memory_writeback |
| 1510 | Map to `agent_response.remember[]`, expand `writeback_batch` |
| 1520–1600 | Persist episodic (+ optional relationship delta) |
| 1600 | Return `say`/`do`/`remember`/`latency_ms` to game |

If provider still running at **2000 ms**: return canned `say`, set `fallback_used`, enqueue async writeback with `async_memory_queue:{event_type}`.

---

## Acceptance checklist (TRO-121)

| # | Criterion | Evidence |
|---|---|---|
| 1 | Minimal event → agent → persist stages documented | this file |
| 2 | ≤2s T1 budget named with fallback law | Latency law section |
| 3 | Example payloads for wake, response, writeback batch | `schemas/samples/*` |
| 4 | Storage path map (logical + concrete) | Storage paths section |
| 5 | Idempotency via `(npc_id, event_id)` | Stage 4 rules |
| 6 | Router implements wake + write + read-back | `services/dream-npc-router` TRO-48 path |

## Non-goals (deferred)

- Production Supabase migration SQL (follow-on)
- Full Qdrant index tuning
- Cross-NPC private memory sharing (forbidden; ledger only)
- Anthropic routes (forbidden)

## Related

- Triggers: `TRIGGER-VOCABULARY.md` / `docs/dream/live-npc-trigger-vocabulary.md`
- Memory field design: `MEMORY-SCHEMA.md`
- Router: `services/dream-npc-router/README.md` (TRO-48 / TRO-114)
- Persisted sim state: `examples/mira-dockwarden.state.json`
