# DREAM Online — World Bible Stub (MVP)

**Issue:** TRO-52  
**Status:** design-complete (implementation-ready seed)  
**Scope:** minimal viable geography + culture anchors for live NPCs  
**Version:** `world.bible.stub.v1`  
**Date:** 2026-07-11  
**Public-copy boundary:** in-game setting only. No real-world mission, company, or charity language on NPC dialogue or zone copy.

Related contracts:

- Live-NPC skill: `.agents/skills/dream-live-npc/SKILL.md`
- Memory write-back: `.agents/skills/dream-live-npc/MEMORY-SCHEMA.md`
- Trigger vocabulary: `docs/dream/live-npc-trigger-vocabulary.md`
- Zone archetypes + spawn density: `docs/dream/zone-types-spawn-density-ambient-triggers.md`
- NEED sources/sinks + decay: `docs/dream/needs-sources-sinks-decay.md`
- Example NPC state: `.agents/skills/dream-live-npc/examples/mira-dockwarden.state.json`

---

## 1. Region frame

| Field | Value |
|---|---|
| `region_id` | `region.harbor_ward` |
| Display name | Harbor Ward |
| Tone | Working port city: salt, rope, bargains, rumor, pride of craft |
| Economy spine | NEEDs earn/spend at merchants + contracts (anti-inflation elsewhere) |
| Live-NPC density | High on docks/market; medium in residential quarter |
| Day phases | `dawn`, `day`, `dusk`, `night` (feeds `world.tick` / `npc.idle_heartbeat`) |

Design intent: one contiguous ward with three walkable zones so a single T1 NPC (Mira Dockwarden) can already span work, commerce, and social memory without a full continent map.

---

## 2. Three zones (MVP)

### Zone A — Harbor Pier

| Field | Value |
|---|---|
| `zone_id` | `harbor_pier` |
| Role | Labor, logistics, first-contact jobs |
| Geography | Wooden piers, rope-yards, tar sheds, freighter berths |
| Dominant faction | `dock_union` |
| NEED sinks | rope, bait, pier day-labor contracts, cart hauls |
| NEED sources | rat-clearing, crate shifts, night watch on tar sheds |
| Hazard flavor | fire near tar sheds; rats after freighters; union grudges |
| Ambient sound | gulls, winches, shouted berth numbers |
| Trigger bias | `player.enter_zone`, `need.earn`, `npc.approached`, `npc.idle_heartbeat` |

**Cultural hooks (NPC):**

- Speech: terse, salt-dry, rank by competence not wealth
- Trust: earned by showing up and finishing dock work
- Taboo: mock the union in public; gossip about “real world” outside the game
- Memory salience boosts: completed pier contracts, fire incidents, theft witnessed on docks

**Seed NPC:** `npc.mira_dockwarden` (T1) — pier boss / rope-yard keeper  
**Spawn anchors:** pier office door, rope-yard gate, berth 3 ladder

---

### Zone B — Market Row

| Field | Value |
|---|---|
| `zone_id` | `market_row` |
| Role | Commerce, price discovery, theft/reputation drama |
| Geography | Covered stalls, copper-scale counters, alley cut-throughs |
| Dominant faction | `merchant_circle` (tension with `dock_union`) |
| NEED sinks | food, tools, cosmetics-class convenience items (pay-for-convenience) |
| NEED sources | courier runs, stall security, rumor-verified tips (paid by merchants) |
| Hazard flavor | pickpockets, under-weight scales, alley ambushes at dusk |
| Ambient sound | hawkers, coins, argument over weights |
| Trigger bias | `need.spend`, `need.earn`, `npc.witnessed`, `combat.ended` |

**Cultural hooks (NPC):**

- Speech: polite until cheated; numbers and margins matter
- Trust: honest trade history > charisma
- Taboo: price collusion talk in front of dockhands; accusing a merchant without ledger proof
- Memory salience boosts: theft witness, large purchases, public shaming of cheats

**Seed NPC:** `npc.kael_scalekeeper` (T1) — stallmaster / copper scales  
**Spawn anchors:** central scale booth, north alley mouth, spice stall

---

### Zone C — Old Lantern Quarter

| Field | Value |
|---|---|
| `zone_id` | `old_lantern_quarter` |
| Role | Residential culture, faction rumor, story-critical social memory |
| Geography | Narrow stairs, lantern-post courtyards, boarding houses, shrine alcoves |
| Dominant faction | `ward_neighbors` (civic) with quiet `dock_union` families |
| NEED sinks | lodging, meal boards, festival tokens, message delivery |
| NEED sources | errands for elders, night-lantern lighting, lost-child search |
| Hazard flavor | dark stair falls at night; rumor panics; boarding-house feuds |
| Ambient sound | shutters, footsteps on stone, distant market bleed |
| Trigger bias | `npc.spoken_to`, `quest.updated`, `world.tick`, `npc.affected` |

**Cultural hooks (NPC):**

- Speech: warmer, longer memory of family names, indirect speech about rivals
- Trust: introductions and repeated visits beat one heroic act
- Taboo: bringing dock brawls into courtyards; naming children in crime talk
- Memory salience boosts: kindness to elders, broken promises, festival participation

**Seed NPC:** `npc.sera_lanternscribe` (T1→T2 candidate) — boarding-house scribe / rumor ledger  
**Spawn anchors:** courtyard well, lantern post #7, boarding-house stoop

---

## 3. Zone adjacency (walk graph)

```
harbor_pier  --berth_road-->  market_row  --lantern_steps-->  old_lantern_quarter
     ^                                                          |
     +------------------ night_cut (riskier, dusk+) ------------+
```

| Edge | From → To | Notes |
|---|---|---|
| `berth_road` | pier → market | primary commerce flow; high `need.spend` after pier earn |
| `lantern_steps` | market → quarter | residential return path; rumor carry |
| `night_cut` | quarter → pier | dusk/night only risk edge; good for `npc.witnessed` |

`player.enter_zone` / `player.leave_zone` should always include `from_zone_id` when known.

---

## 4. Faction sketch (culture anchors)

| `faction_id` | Home zone bias | Drive | Conflict |
|---|---|---|---|
| `dock_union` | `harbor_pier` | Keep the pier working; protect regulars | Resents merchant price games |
| `merchant_circle` | `market_row` | Margin, order, ledger truth | Fears dock strikes / rat surges |
| `ward_neighbors` | `old_lantern_quarter` | Quiet courtyards, kids safe at night | Wants both sides to stop bleeding conflict into homes |

World-ledger rumor topics (shared, not private NPC memory):

- `rumor.rats_surge` — pier/tar sheds
- `rumor.short_scales` — market honesty
- `rumor.lantern_out` — night safety in quarter

---

## 5. Memory schema anchors (zone-aware)

Full formal write-back lives in `.agents/skills/dream-live-npc/MEMORY-SCHEMA.md` (`memory.v1`).  
This stub only adds **geography fields** every live-NPC memory should be able to carry.

### Required location shape on episodic / relationship rows

```json
{
  "location": {
    "region_id": "region.harbor_ward",
    "zone_id": "harbor_pier",
    "anchor_id": "rope_yard_gate",
    "position": { "x": 12.4, "y": 0.0, "z": -3.1 }
  }
}
```

| Store | Zone rule |
|---|---|
| Persona core | may list `home_zone_id` + `patrol_zones[]` |
| Episodic | must include `location.zone_id` when event is spatial |
| Relationships | `last_location` = zone_id string (compat with Mira example) |
| World ledger | keyed by `region_id`; rumors may name `zone_id` in text/tags |

### Salience modifiers by zone (MVP defaults)

| Context | Modifier |
|---|---|
| Event in NPC `home_zone_id` | +0.05 |
| Event on faction conflict edge (pier↔market) | +0.1 |
| Night event on `night_cut` | +0.1 |
| Pure ambient crowd noise | −0.1 (floor 0) |

### Example persona home zones

| NPC | home_zone | patrol |
|---|---|---|
| `npc.mira_dockwarden` | `harbor_pier` | pier, market edge |
| `npc.kael_scalekeeper` | `market_row` | market, berth_road |
| `npc.sera_lanternscribe` | `old_lantern_quarter` | quarter, lantern_steps |

---

## 6. Live-NPC cultural prompt fragment (shared)

Inject with zone context on wake (≤12 lines):

```text
You are an in-world DREAM Online NPC in Harbor Ward.
Stay in character. Never mention real-world companies, missions, or charities.
Currency is NEEDs (in-game only). Pay-for-convenience exists; pay-to-win does not.
Speak with your zone's culture: pier=terse competence, market=ledger politeness, lantern=warm memory.
Remember prior player acts via supplied memory; if memory missing, be cautiously neutral.
If inference budget fails, use a short canned line and still queue memory write-back.
```

---

## 7. Acceptance criteria (this issue)

- [x] Exactly three named zones with stable `zone_id`s
- [x] Each zone has geography, faction, NEED earn/spend hooks, hazards, trigger bias
- [x] Each zone has cultural speech/trust/taboo hooks for live NPCs
- [x] Walk graph between zones defined
- [x] Memory schema zone anchors documented and aligned with existing `memory.v1`
- [x] Seed NPCs named for each zone (Mira already implemented as example state)

---

## 8. Next design slices (not this issue)

1. Expand world bible beyond Harbor Ward (TRO-76 outline depth).
2. Formal NEED earn/spend anti-inflation rules (TRO-90) — **delivered as** `docs/dream/needs-sources-sinks-decay.md` (TRO-113).
3. Handler stubs for three sample webhooks (TRO-114) using these zone_ids.
4. Engine decision brief remains separate (TRO-72).

---

## 9. File map

| Artifact | Path |
|---|---|
| This stub | `docs/dream/world-bible-stub.md` |
| Trigger vocab | `docs/dream/live-npc-trigger-vocabulary.md` |
| Memory schema | `.agents/skills/dream-live-npc/MEMORY-SCHEMA.md` |
| Mira example | `.agents/skills/dream-live-npc/examples/mira-dockwarden.state.json` |
