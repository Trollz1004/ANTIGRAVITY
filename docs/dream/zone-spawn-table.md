# DREAM Online — Zone Spawn Table (4 Core Types)

**Issue:** TRO-284
**References:** TRO-112 (zone type definitions), TRO-52 (world bible), `.agents/skills/dream-live-npc/SKILL.md` (NPC tiers)
**Date:** 2026-07-12
**Status:** design-complete

TRO-112 maps four zone archetypes: **Whisper** (social), **Neon** (hub), **Rust** (resource), **Ember** (wild). This table specifies NPC spawn densities per tier, ambient trigger rates, and example encounter types for each.

---

## NPC Tier Reference

| Tier | Class | Notes |
|---|---|---|
| T0 | Ambient / crowd | Canned pools; no persistent memory |
| T1 | Named NPC | Persona + episodic memory; ≤2s wake |
| T2 | Story-critical | Full graph memory; budget-gated |
| T3 | World actor | Scheduled batch (economy / faction state) |

---

## Zone Spawn Table

| Zone Type | Zone Archetype | T0 Density (per zone) | T1 Named NPCs | T2 Story-Critical | T3 World Actors | Primary Triggers | Secondary Triggers | Example Encounters |
|---|---|---|---|---|---|---|---|---|
| **Whisper** | Social / residential | Low — 2–4 ambient | Medium — 2–3 named | Rare — 0–1 | None | `npc.spoken_to`, `npc.idle_heartbeat`, `quest.updated`, `npc.affected` | `player.enter_zone`, `world.tick` | Rumor exchange with elder; errand from boarding-house scribe; faction gossip chain; lost-child search; broken-promise confrontation |
| **Neon** | Hub / commerce | High — 8–12 ambient | Medium-high — 3–5 named | Low — 1–2 | 1 (economy ledger) | `need.spend`, `need.earn`, `npc.approached`, `npc.witnessed` | `player.enter_zone`, `combat.ended` | Price negotiation at stall; theft caught by merchant; courier pickup; black-market tip; scale-weight dispute; faction price war |
| **Rust** | Resource / labor | Medium — 5–8 workers | Low — 1–2 foremen | Rare — 0–1 | 1 (resource ledger) | `need.earn`, `npc.affected`, `world.tick`, `player.enter_zone` | `combat.ended`, `npc.idle_heartbeat` | Labor contract from foreman; equipment salvage; hazard response (fire / collapse); union grudge escalation; rival salvager confrontation |
| **Ember** | Wild / exploration | Sparse — 2–4 hostile/neutral | Rare — 0–1 wanderer | Rare — 0–1 outpost captain | None | `player.enter_zone`, `combat.ended`, `npc.affected` | `need.earn`, `world.tick`, `npc.witnessed` | Monster ambush on patrol path; wandering survivor with intel; faction skirmish spill; resource cache defense; distress beacon from downed NPC |

---

## Ambient Trigger Rate Bands

Trigger rate = expected fires per 10-minute active player session in zone.

| Zone Type | High-rate triggers (≥3/session) | Medium-rate (1–2/session) | Low-rate (<1/session) |
|---|---|---|---|
| **Whisper** | `npc.spoken_to`, `npc.idle_heartbeat` | `quest.updated`, `npc.affected` | `combat.ended`, `need.spend` |
| **Neon** | `need.spend`, `need.earn`, `npc.approached` | `npc.witnessed`, `player.enter_zone` | `npc.idle_heartbeat`, `npc.spoken_to` |
| **Rust** | `need.earn`, `world.tick` | `npc.affected`, `player.enter_zone` | `combat.ended`, `npc.spoken_to` |
| **Ember** | `player.enter_zone`, `combat.ended` | `npc.affected`, `world.tick` | `need.earn`, `npc.spoken_to` |

---

## Memory Salience Notes (per zone type)

| Zone Type | Salience Boost Events | Salience Reduction |
|---|---|---|
| **Whisper** | Kindness to elders (+0.1), broken promises (+0.1), festival participation (+0.05) | Pure crowd ambient (−0.1) |
| **Neon** | Theft witnessed (+0.1), large purchases (+0.05), public shaming (+0.1) | Routine small purchases (−0.05) |
| **Rust** | Fire/collapse incident (+0.15), union dispute (+0.1), completed contracts (+0.05) | Idle worker ambient (−0.1) |
| **Ember** | Combat outcome witnessed (+0.15), NPC saved/lost (+0.2), faction skirmish resolved (+0.1) | Uneventful patrol pass (−0.05) |

Global rule from `MEMORY-SCHEMA.md`: event in NPC `home_zone_id` = +0.05 base. Apply on top of zone-specific modifiers above.

---

## Zone × NPC Tier Interaction Rules

1. **T0 in Whisper** — ambient voices only; canned greeting pool varies by day phase. No memory write-back.
2. **T1 in Neon** — respond to `npc.approached` within ≤2s; track `need.spend` totals in episodic row; bump `relationship_score` on repeat trade.
3. **T1/T2 in Rust** — foreman NPCs hold labor queue state; `npc.affected` (hazard) triggers immediate T1 wake with fallback canned safety alert if budget missed.
4. **T1 in Ember** — sparse; wanderer persona may span multiple Ember sub-zones (set `patrol_zones[]` to all Ember sub-zone IDs). Always queue memory write-back even on fallback (canned "I'll remember you helped me").
5. **T2 anywhere** — budget-gated; orchestrator checks `world.budget_available` before wake. Degradation path: → T1 persona lines → T0 canned. Memory write-back is never skipped.
6. **T3 world actors** — Neon and Rust only. Fired on `world.tick`, not event-driven. Outputs update the world-ledger entries (`rumor.*`, resource supply/demand indices).

---

## Zone ID Convention

Spawn table assumes zone IDs follow the pattern `{zone_type}.{region}.{instance}`:

| Zone Type | Example zone_id |
|---|---|
| Whisper | `whisper.harbor_ward.lantern_quarter` |
| Neon | `neon.harbor_ward.market_row` |
| Rust | `rust.harbor_ward.pier_yard` |
| Ember | `ember.outskirts.tar_ridge` |

Map each zone_id to its type string so the orchestrator can look up this table at trigger time.

---

## File Map

| Artifact | Path |
|---|---|
| This table | `docs/dream/zone-spawn-table.md` |
| Zone type definitions source | TRO-112 |
| World bible (Harbor Ward zones) | `docs/dream/world-bible-stub.md` |
| Live-NPC tiers + trigger vocab | `.agents/skills/dream-live-npc/SKILL.md` |
| Memory schema | `.agents/skills/dream-live-npc/MEMORY-SCHEMA.md` |
