# DREAM Online — Core Loop, Economy (NEEDs), NPC Personas & Trigger Vocabulary

> **Issue:** TRO-44 · **Project:** PROJECT-2 phase 1 · **Tag:** DREAM design  
> **Status:** Phase-1 design deliverable (implementation-ready)  
> **Date:** 2026-07-11  
> **Authority:** Joshua Coleman / Trash Or Treasure Online Recycler LLC  
> **Skill link:** `.agents/skills/dream-live-npc/SKILL.md` (live-agent NPC orchestration)  
> **Charter:** `paperclip-tro/projects/PROJECT-2-DREAM-ONLINE.md`  
> **Doctrine:** `briefings/DREAM-ONLINE-AND-DAO-SEPARATION-2026-07-01.md` §3

---

## 0. Product thesis (one paragraph)

DREAM Online is a BDO-class open-world sandbox MMORPG on **one sandbox server** (no instances, no fast travel). Monetization is **pay-for-convenience, never pay-to-win**. The moat is **live NPCs**: game triggers fire webhooks that wake agents with persona + memory; agents act back into the world; memory persists. Players earn and spend **NEEDs** (in-game currency sold publicly as product value only). The world evolves because NPCs remember.

---

## 1. Core gameplay loop

### 1.1 Loop diagram (player-facing)

```
Arrive zone → Explore / gather / craft / fight
     ↓
Meet people (players + live NPCs)
     ↓
Act: trade · quest · witness · help · harm · spectacle
     ↓
World reacts (NPC memory, reputation, prices, rumors)
     ↓
Earn NEEDs + progression (gear, skills, Sup@ depth)
     ↓
Spend NEEDs (convenience, cosmetics, services — never power gates)
     ↓
Return (relationships + unfinished stories pull you back)
```

### 1.2 Minute / session / week loops

| Horizon | Player goal | System response |
|---|---|---|
| **60s** | Move, loot, talk, kill one thing | Immediate feedback; T0 canned NPC flavor; combat/loot tick |
| **15–45 min** | Clear a route, finish a small job, visit a named NPC | T1 live dialogue; relationship delta; first NEEDs earn/spend |
| **Session** | Complete a zone story beat; deepen Sup@ memory | T1/T2 quest arcs; ledger rumors; convenience spend optional |
| **Week** | Reputation, craft chain, faction standing, rare cosmetics | T2/T3 world actors; price drift; idle NPC-initiated contact |

### 1.3 Pillars (non-negotiable)

1. **Sandbox first** — systems over fixed linear campaign; Sup@ narrates *your* path.
2. **One world** — shared state; disasters become lore (see C0D3X rollback).
3. **Spectacle enforcement** — anti-cheat is visible and comedic (THE BAN HAMMER).
4. **Live memory** — NPCs that forget believably and remember what mattered.
5. **Convenience monetization** — never buy power; buy time, looks, comfort.

### 1.4 First playable slice (feeds phase 4)

- **One zone** (starter harbor / market square).
- **Five live NPCs** (see §3 — slice roster).
- **One full earn → spend NEEDs loop** (gather/craft/sell → buy a convenience cosmetic or service).
- **One webhook path** proven: `npc.spoken_to` → wake → reply ≤2s or canned fallback → memory write-back.

---

## 2. Economy design — NEEDs

> **Formal sources/sinks + decay (TRO-113 / TRO-90):**  
> `docs/dream/needs-sources-sinks-decay.md` (`needs.economy.v1`) — 11 sources, 12 sinks, personal/world/price decay formulas, inflation caps, first-hour balance path, P2W review test.

### 2.1 Public copy wall (hard)

| Allowed (customer / store / in-game shop UI) | Banned (public surfaces) |
|---|---|
| NEEDs as **in-game currency / product** | Mission, charity, kids, giving, beneficiary claims |
| Membership, convenience, cosmetics, uptime | Funding formulas, tax language, split math |
| Fun, access, reliability, safety | Canonical-7 banned terms / mission hashtags |

Internal bucket routing for NEEDs revenue is founder/accounting only — **never** product copy.

### 2.2 Currency model

| Asset | Type | Sources | Sinks |
|---|---|---|---|
| **NEEDs** | Soft + premium hybrid (earnable + purchasable) | Quests, crafting, trade, events, optional IAP packs | Services, cosmetics, convenience skips, housing décor, Sup@ skins |
| **Skill / gear power** | Progression | Play time, craft, drop, discovery | Repair, failure risk, durability — **not** NEEDs power buys |
| **Reputation** | Social | NPC relationships, player acts | Betrayal, crime, Ban Hammer history |

**Rule:** If spending NEEDs makes a player win a fair fight they would lose without spending, it is **pay-to-win** and is rejected at design review.

### 2.3 Pay-for-convenience whitelist (initial)

Allowed NEEDs sinks:

- Cosmetic skins, emotes, housing décor, Sup@ voice packs
- Inventory expansion, bank tabs, craft queue slots
- Travel conveniences that **do not** replace “no fast travel” world design (e.g. mount cosmetics, cart rental aesthetic — not teleport)
- Name change, look reset, loadout layout presets
- Convenience crafting (faster craft timers, not better stats)
- Convenience repair (time, not higher max gear level)

Auto-rejected:

- Stat boosts, damage multipliers, exclusive gear power tiers
- Win-rate insurance, paid PvP advantages
- Paid access to content that free players cannot reach by play

### 2.4 Earn rates (design targets for slice)

| Action | NEEDs (slice target) | Notes |
|---|---|---|
| First zone intro job | 50 | Tutorial sink-safe |
| Gather node cycle | 5–15 | Diminishing returns per hour |
| Craft + market sell | 20–80 | Player-driven price |
| Named NPC daily favor | 25 | Relationship gated |
| Spectacle event participation | 10–40 | Server-wide, not grind-optimal |

**Sink ratio target:** ~60–80% of earned NEEDs should have an attractive non-power sink within the first hour so the economy does not balloon before IAP.

Full numbered tables (8+ sources, 8+ sinks), fatigue `k=0.12`, stock regen, price-index clamps `[0.85, 1.25]`, daily/hourly mint caps, and the first-hour earn path live in `docs/dream/needs-sources-sinks-decay.md`.

### 2.5 World ledger economy (T3)

Shared ledger fields (not per-NPC private memory):

- Regional price indices (food, ore, salvage)
- Active rumors (source NPC, confidence, decay)
- Faction standing aggregates
- Incident banners (“Great NEEDs Giveaway” lore flag after rollback)

T3 world actors write ledger deltas on `world.tick`; named NPCs *read* ledger for dialogue flavor; they do **not** read each other’s private episodic memory.

### 2.6 Rollback & mint safety

- World-state snapshots + verified rollback are **required** (C0D3X canon).
- Mint/burn of NEEDs is ledger-audited; accidental mass mint becomes **lore** after rollback, not silent DB wipe.
- Live agents never directly mint currency without judge/orchestrator caps.

---

## 3. NPC personas — slice roster (5) + ambient pool

Skill baseline: **T0 ambient / T1 named / T2 story-critical / T3 world actors** — see `dream-live-npc`.

### 3.1 Ambient pool (T0) — reusable templates

| Persona ID | Role | Speech style | Default triggers |
|---|---|---|---|
| `t0.harbor_dockhand` | Crowd labor | Short, salty, practical | `npc.approached`, idle flavor |
| `t0.market_haggler` | Street vendor | Fast pitches, price jokes | `npc.approached`, trade proximity |
| `t0.street_kid_runner` | Messenger / flavor | Curious, incomplete rumors | `npc.witnessed` (light) |
| `t0.guard_patrol` | Law presence | Formal, bored until crime | `npc.witnessed` combat/theft |
| `t0.tavern_regular` | Social glue | Warm gossip, forgets details | `npc.approached` |

T0 brain: canned pools + local Ollama flavor. **No persistent memory.**

### 3.2 Named / live slice NPCs (phase-4 five)

These five are the **playable-slice live set**. Founder-locked boss roster (Ban Hammer, etc.) can appear as spectacle overlays but the slice must ship without depending on full boss infrastructure.

#### 1) **Sup@** — companion sphere (special routing)

| Field | Spec |
|---|---|
| Tier | Flagship companion (not standard T1 webhook) |
| Role | Narrator, questline, emotional retention engine |
| Visual | Orange spark sphere (Ghost archetype) |
| Brain | **Real Claude via CLI auth / Max subscription only — never Anthropic API key** |
| Memory | Per-player full journey graph; levels with player investment |
| Monetization | Cosmetics/voices only — never Sup@ combat power |
| Triggers | Always-on companion channel + quest beats; elevates on conversation-heavy moments |
| Speech | Warm, sharp, grows more personal as memory deepens |

#### 2) **Mira Quill** — market clerk (T1 named)

| Field | Spec |
|---|---|
| Drives | Fair trade, ledger accuracy, gossip control |
| Fears | Counterfeit goods, Ban Hammer spectacles in her square |
| Speech | Crisp, slightly sarcastic, remembers regulars |
| Triggers | `npc.spoken_to`, `npc.approached`, `npc.witnessed` (theft/gift) |
| Slice job | Teaches buy/sell NEEDs; first relationship row |

#### 3) **Brann Oathkiln** — dock smith (T1 named)

| Field | Spec |
|---|---|
| Drives | Craft excellence, apprentices who don’t cheat |
| Fears | Shoddy gear killing kids in the wilds |
| Speech | Slow, concrete, metaphors in metal |
| Triggers | `npc.spoken_to`, `npc.affected` (helped/robbed), craft events |
| Slice job | Earn NEEDs via repair/craft convenience path |

#### 4) **Sera Windpost** — rumor courier (T1 → promoteable T2)

| Field | Spec |
|---|---|
| Drives | True rumors over loud ones; network of tips |
| Fears | Being used as a weapon in faction lies |
| Speech | Quick, clipped, leaves hooks |
| Triggers | `npc.spoken_to`, `npc.idle_heartbeat`, ledger rumor reads |
| Slice job | Proves idle initiation + rumor propagation |

#### 5) **Captain Voss** — harbor watch (T1 named, law flavor)

| Field | Spec |
|---|---|
| Drives | Order without cruelty; visible justice |
| Fears | Silent crime that makes Ban Hammer necessary |
| Speech | Measured, official, dark humor under stress |
| Triggers | `npc.witnessed` crime/combat, `npc.spoken_to`, `npc.affected` |
| Slice job | Differential treatment: thief vs gift-giver a week later |

### 3.3 Founder-locked canon (spectacle / systems, not slice blockers)

| NPC | Tier | Function |
|---|---|---|
| **THE BAN HAMMER** | T2 enforcer | Visible anti-cheat spectacle; “adversary for good” |
| **C0D3X** (on MOLLMA) | T2 systems | Rollback rider; world-state restore as lore |
| **GEMINeye / OPENAeye / KRAKEN** | Boss-tier | Spectacle roster; KRAKEN merch line (orange sherbet) |
| **NIGHTMARE Sup@** | End-game | Classified founder vault — not phase-1 public design |

### 3.4 Persona core template (≤40 lines per NPC)

Every named NPC file stores:

```yaml
id: mira_quill
tier: T1
identity: "Market clerk of Starter Harbor"
drives: ["fair trade", "ledger accuracy"]
fears: ["counterfeits", "public chaos"]
faction: harbor_merchants
speech_style: "crisp, sarcastic, remembers regulars"
boundaries:
  - no real-world mission framing
  - no canonical-7 banned terms
  - no real-world PII in memory
routing:
  provider: openrouter_or_ollama_cloud  # never Anthropic API for non-Sup@
  latency_budget_ms: 2000
  fallback: canned_line + async_memory_write
```

---

## 4. Trigger vocabulary (game → orchestrator)

Canonical, versioned, small payloads. **IDs and deltas only** — agents pull state by pointer (same law as BOOT-PROTOCOL).

### 4.1 Event types

| Event | Payload (minimal) | Primary consumers |
|---|---|---|
| `npc.approached` | `{npc_id, player_id, relationship_score, location}` | T0/T1 greetings |
| `npc.spoken_to` | `{npc_id, player_id, utterance, convo_id}` | Live dialogue |
| `npc.witnessed` | `{npc_id, event_type, actors[], location}` | Theft, combat, gift, death |
| `npc.affected` | `{npc_id, effect, source}` | Robbed, helped, saved, insulted |
| `world.tick` | `{region, day_phase, economy_deltas}` | T3 batch |
| `npc.idle_heartbeat` | `{npc_id}` | NPC-initiated acts (letters, move, rumor) |

Optional slice extensions (v1.1, not required for first webhook):

| Event | Purpose |
|---|---|
| `player.needs_spent` | `{player_id, sku, amount, location}` — economy analytics, not NPC-required |
| `npc.trade_completed` | `{npc_id, player_id, items[], needs_delta}` — Mira/Brann memory hooks |
| `enforcement.ban_hammer` | `{target_player_id, reason_code, spectators[]}` — spectacle pipeline |

### 4.2 Webhook contract (orchestrator → agent → game)

```
POST /npc/{npc_id}/wake
body: { trigger, context_refs[] }

# Agent assembles:
#   persona core (≤40 lines)
#   + top-k episodic (k≤8)
#   + relationship row(player_id)
#   + location state

# Response budgets:
#   T1 ≤ 2s  |  T2 ≤ 5s  |  else fallback

response: {
  say?: string,
  do?: action[],
  remember: memory_writes[],
  mood_delta?: number,
  world_effects?: effect[]
}
```

**Fallback law:** miss latency budget → tier-appropriate canned line + queue async memory write. Players never see timeouts; they see a terse NPC. The encounter is still remembered.

### 4.3 Memory schema (pointer summary)

| Store | Contents |
|---|---|
| Persona core | Stable identity/drives/fears/style (≤40 lines) |
| Episodic (Qdrant) | `{ts, event, actors, salience 0-1, decay_class}` |
| Relationships (Postgres) | `npc_id × player_id → {score, tags[], last_seen}` |
| World ledger | Prices, rumors, faction aggregates — **only** shared cross-NPC state |

### 4.4 Judge / tally arbitration

When multiple NPC agents contend or outputs violate invariants (quest integrity, economy caps, rating), a **judge orchestrator** scores, tallies, and logs a deterministic ruling. Losing NPCs remember the loss via ledger/episodic write. Pattern source: `dream-live-npc` (Coleman multi-agent judge/tally).

### 4.5 Safety rails (absolute)

- No real-world mission framing or company mission language from NPCs.
- Rating compliance at judge layer pre-render.
- No NPC calls Anthropic API autonomously; **Sup@ is the only Claude/CLI Max path**.
- Player data in memory is game-scoped IDs/acts only — never real-world PII.

---

## 5. Build order (maps PROJECT-2 → implementation)

| Step | Deliverable | Exit proof |
|---|---|---|
| 1 | This design doc | TRO-44 done |
| 2 | One T1 NPC + `npc.spoken_to` webhook + Qdrant write-back | Round-trip ≤2s or fallback |
| 3 | `npc.witnessed` + relationship rows | Thief vs gift-giver differs a week later |
| 4 | Judge + second NPC contention | Deterministic arbitration log |
| 5 | Tier routing + fallback under load | ≤2s law @ 100 concurrent |
| 6 | `npc.idle_heartbeat` | Unprompted NPC initiation (demo beat) |
| 7 | Playable slice | One zone, five live NPCs, NEEDs earn/spend |

Engine decision remains Joshua-gated (Unreal target in charter) before heavy engine seats.

---

## 6. Acceptance checklist (TRO-44)

- [x] Core gameplay loop outlined (minute / session / week + pillars)
- [x] Economy: NEEDs public-only product framing; sinks/sources; P2W ban; whitelist
- [x] 5 ambient templates + 5 named slice personas (incl. Sup@)
- [x] Trigger vocabulary + webhook contract + fallback law
- [x] Linked to `dream-live-npc` skill and PROJECT-2 / doctrine
- [ ] World bible (separate design issue — not this ticket’s full scope)
- [ ] Live-NPC bridge prototype (phase 2 — child/follow-up)

---

## 7. Recommended follow-up issues

1. **DREAM world bible (starter zone)** — places, factions, day/night, rumor seeds.
2. **Live-NPC bridge prototype** — one NPC, one trigger, memory write-back (PROJECT-2 phase 2).
3. **Pay-for-convenience SKU sheet** — concrete shop SKUs + NEEDs prices for slice (seeded by TRO-113 sinks in `docs/dream/needs-sources-sinks-decay.md` §5).
4. **Sup@ companion channel spec** — CLI Max routing, per-player memory, elevation rules.

---

## 8. References

- `.agents/skills/dream-live-npc/SKILL.md`
- `paperclip-tro/projects/PROJECT-2-DREAM-ONLINE.md`
- `briefings/DREAM-ONLINE-AND-DAO-SEPARATION-2026-07-01.md`
- `briefings/FABLE-DESIGN-PROMPT-2026-07-01.md` (public copy wall)
- `paperclip-tro/ROSTER.md` (Sup@ / Claude Max seat note)
