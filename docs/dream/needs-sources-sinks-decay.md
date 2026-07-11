# DREAM Online — NEED Sources, Sinks & Decay Mechanics

| Field | Value |
|---|---|
| **Issue** | TRO-113 (implements TRO-90 formal earn/spend anti-inflation rules) |
| **Version** | `needs.economy.v1` |
| **Date** | 2026-07-11 |
| **Status** | Design-complete (implementation-ready numbers for Harbor Ward slice) |
| **Parent design** | `paperclip-tro/projects/DREAM-CORE-LOOP-ECONOMY-DESIGN.md` §2 |
| **World anchors** | `docs/dream/world-bible-stub.md` |
| **Ledger events** | `need.earn` / `need.spend` (`docs/dream/live-npc-trigger-vocabulary.md`) |

**Public-copy wall (hard):** NEEDs are sold and spoken of only as **in-game currency / product value**. No mission, charity, kids-in-need framing, tax, split, or funding language on shop UI, quest text, or NPC dialogue.

**P2W ban (hard):** If spending NEEDs lets a player win a fair fight they would lose without spending, the SKU is rejected at design review. Power comes from play time, craft skill, drops, and discovery — never from the NEED shop.

---

## 0. Acceptance checklist (this issue)

- [x] **≥8 earn sources** with base amounts, caps, and decay
- [x] **≥8 spend sinks** with prices, category, and P2W status
- [x] **Decay mechanics** (personal fatigue, regional stock, price drift, rumor confidence)
- [x] **Inflation caps** (player, zone, server hour, mint authority)
- [x] **Balance rules** with target hourly earn/spend and first-hour sink ratio
- [x] **No P2W** whitelist/blacklist with review test
- [x] Numbers tied to Harbor Ward slice zones (`harbor_pier`, `market_row`, lantern quarter)

---

## 1. Currency model (recap)

| Asset | Role | NEED shop allowed? |
|---|---|---|
| **NEEDs** | Soft+premium hybrid (play earn + optional IAP packs) | Yes — convenience/cosmetics/services only |
| **Gear / skill power** | Progression | **No** — cannot buy higher max power |
| **Reputation** | Social / access | Indirect only (cannot buy faction rank with pure NEED dump without play acts) |

Mint/burn is ledger-audited. Accidental mass mint is rolled back by C0D3X and becomes lore, not a silent DB wipe. Live agents **never** mint NEEDs without judge/orchestrator caps.

---

## 2. Global balance targets (slice)

| Metric | Target | Notes |
|---|---|---|
| New-player first-hour **gross earn** | **180–260 NEEDs** | Intro job + 2–3 micro jobs + light gather |
| First-hour **attractive sink** coverage | **60–80%** of gross earn | At least one cosmetics + one convenience buy feels good |
| Steady-state casual hour (post-tutorial) | **90–140 NEEDs/h** gross | After fatigue/decay applied |
| Hard-core optimized hour (soft cap) | **≤220 NEEDs/h** gross | Further grind hits diminishing returns |
| Wallet soft warning | **2,500 NEEDs** | UI nudge toward sinks; no hard confiscation |
| Wallet hard audit flag | **10,000 NEEDs** unspent + low spend velocity 7d | Judge/orchestrator fraud review, not auto-burn |
| Server mint rate soft cap | **Σ need.earn ≤ 1.25 × Σ need.spend** over rolling 24h per region | Else raise sink incentives / lower event payouts |
| Premium IAP packs | Optional; **never** required for content access | Same sinks as play-earned NEEDs |

**Sink ratio law:** design sinks so a motivated new player *wants* to spend most of their first-hour earn on non-power goods before IAP enters the picture.

---

## 3. Decay mechanics (shared formulas)

All sources that can be farmed apply one or more decay layers. Sinks may apply stock/price decay so the economy breathes with the world ledger.

### 3.1 Personal source fatigue (anti-grind)

For repeatable source class `S` for player `P`:

```
multiplier = max(floor, 1 − k × completions_in_window)
payout     = floor(base × multiplier × event_bonus × region_index)
```

| Param | Default | Meaning |
|---|---|---|
| `window` | rolling **60 minutes** | Resets gradually, not daily cliff only |
| `k` | **0.12** | −12% per completion in window for same source class |
| `floor` | **0.35** | Never below 35% of base (play still pays; not zeroed) |
| Daily hard cap | source-specific | Absolute NEEDs/day from that source |

Daily soft reset at region `dawn` (not real-world midnight) so RP day cycle matters.

### 3.2 Node / contract stock decay (world)

Gather nodes and posted micro-contracts have stock:

```
stock_t+1 = clamp(stock_t − harvest + regen, 0, stock_max)
regen     = regen_base × (1 + weather_bonus) × underuse_boost
```

| Param | Typical | Notes |
|---|---|---|
| `stock_max` | 8–20 per node cluster | Prevents infinite same-spot AFK |
| `regen_base` | 1 unit / 8–12 min | Slow enough to force route variety |
| `underuse_boost` | up to +40% if untouched 45 min | World recovers when players leave |
| Overharvest tax | if cluster stock < 20%, payout × **0.5** | Visible “stripped docks / empty stalls” flavor |

### 3.3 Price index drift (sink-side inflation control)

T3 world actors write regional indices on `world.tick`:

```
price = base_price × price_index[category]
price_index ∈ [0.85, 1.25] for slice (hard clamp)
```

- High unspent NEEDs + low sink velocity → **index up** (cosmetics/convenience get pricier).
- High sink velocity + low mint → **index down** (sales / surplus).
- Indices never open power SKUs; only convenience/cosmetic/service categories.

### 3.4 Rumor / favor confidence decay (indirect economy)

Paid tips and daily favor require confidence or relationship score:

```
confidence_t+1 = confidence_t × e^(−λ Δt)   // λ ≈ 0.08 / day for normal
```

Low confidence → lower NEED tip payouts and fewer merchant contracts offered. High relationship slows decay (`λ` cut by up to 50%).

### 3.5 Decay classes (ledger tags)

| `decay_class` | Used for | Half-life / policy |
|---|---|---|
| `none` | One-shot story pays, IAP credit | No fatigue |
| `session` | Spectacle participation | Resets each login session (max N pays) |
| `hourly` | Gather, courier, micro-jobs | Personal fatigue §3.1 |
| `daily` | Named NPC favor, zone dailies | 1 full payout / dawn; partial refresh mid-day ×0.4 |
| `stock` | Nodes, stall supply | World stock §3.2 |
| `index` | Shop prices | Price drift §3.3 |

---

## 4. NEED sources (≥8)

Amounts are **slice targets** for Harbor Ward. Engine may ±10% for feel; judge rejects permanent +25% without design review.

| # | `source_id` | Zone bias | Base NEEDs | Window / cap | Decay | Trigger |
|---|---|---|---|---|---|---|
| 1 | `src.intro_zone_job` | any starter | **50** once | 1× character lifetime | `none` | `quest.updated` complete |
| 2 | `src.pier_day_labor` | `harbor_pier` | **12** / contract | 15/day; fatigue k=0.12/h | `hourly` + `stock` | `need.earn` / quest |
| 3 | `src.rat_clear_route` | `harbor_pier` | **8–18** by pack size | 20 packs/day; overfarm floor 0.35 | `hourly` | `combat.ended` + turn-in |
| 4 | `src.gather_node_cycle` | pier / outskirts | **5–15** | stock per cluster; soft 40 nodes/h | `hourly` + `stock` | gather complete |
| 5 | `src.craft_market_sell` | `market_row` | **20–80** net | player price; tax 5% | market index (not personal grind) | trade settle |
| 6 | `src.courier_run` | market ↔ pier | **10–22** by distance/risk | 12/day | `hourly` | `quest.updated` |
| 7 | `src.named_npc_daily_favor` | named T1 (e.g. Mira) | **25** | 1 full / dawn; optional 0.4× mid-day | `daily` + relationship | `npc.spoken_to` + quest |
| 8 | `src.stall_security_shift` | `market_row` | **15–30** | 6 shifts/day | `hourly` + `session` | duty complete |
| 9 | `src.spectacle_event` | region | **10–40** | 3 pays / session; diminishing | `session` | event participation |
| 10 | `src.rumor_verified_tip` | market | **6–16** | confidence-gated; 8/day | `daily` + confidence decay | merchant pays after verify |
| 11 | `src.iap_need_pack` | shop (meta) | pack size SKU | real-money; ledger credit | `none` | purchase webhook |

**Primary eight for implementation tests:** #1–#8. #9–#11 are required for full economy spine (events, tips, premium).

### 4.1 Source rules

1. **Content access never locked** behind IAP-only sources.
2. **No source pays for PvP kills of players** as NEED farm (anti-gank economy abuse). PvE/spectacle only.
3. **Craft+sell** is player-driven; orchestrator taxes 5% burn to sinks pool; rejects bot-like cancel/repost loops (>30 failed listings/h → cool-down).
4. Every `need.earn` writes `{source_id, amount, decay_class, balance_after, tx_id, location_id}` for audit.

### 4.2 Example first-hour path (target ~220 gross)

| Step | Source | NEEDs |
|---|---|---|
| Intro job | `src.intro_zone_job` | 50 |
| 3× pier labor | `src.pier_day_labor` | 12+11+9 ≈ 32 (fatigue) |
| 2× rat route | `src.rat_clear_route` | ~28 |
| 4× gather | `src.gather_node_cycle` | ~40 |
| 1 courier | `src.courier_run` | 16 |
| Mira favor | `src.named_npc_daily_favor` | 25 |
| Craft flip | `src.craft_market_sell` | ~30 |
| **Total** | | **~221** |

---

## 5. NEED sinks (≥8)

All sinks below are **pay-for-convenience / cosmetics / services**. Prices use `price_index` clamps from §3.3.

| # | `sink_id` | Category | Base price (NEEDs) | P2W? | Notes |
|---|---|---|---|---|---|
| 1 | `snk.cosmetic_emote` | cosmetic | **40** | No | Emotes, dances, pier gestures |
| 2 | `snk.housing_decor_small` | cosmetic | **60–120** | No | Stall banners, cabin trinkets |
| 3 | `snk.sup_at_voice_pack` | cosmetic | **150** | No | Sup@ voice; never AI tier power |
| 4 | `snk.inventory_expand_row` | convenience | **80** (row 1), **120** (row 2) | No | Storage only; no combat bag power |
| 5 | `snk.bank_tab` | convenience | **200** | No | Account bank tab |
| 6 | `snk.craft_queue_slot` | convenience | **100** | No | Parallel craft slots; **same recipes/stats** |
| 7 | `snk.craft_timer_boost` | convenience | **25** / boost | No | Faster craft clock only; output quality unchanged |
| 8 | `snk.repair_express` | convenience | **15–45** by item tier | No | Time save; **not** higher max durability tier |
| 9 | `snk.cart_rental_aesthetic` | convenience | **30** / day | No | Haul flavor/cosmetics — **not** teleport / fast travel |
| 10 | `snk.name_or_look_reset` | service | **100** look / **250** name | No | Cooldown 7d name |
| 11 | `snk.loadout_layout_preset` | convenience | **50** | No | UI/hotbar presets only |
| 12 | `snk.merchant_priority_list` | convenience | **35** | No | Listings sort priority 24h; no price advantage algorithm |

**Primary eight for slice shop SKU sheet:** #1–#8.

### 5.1 Auto-rejected sink classes (blacklist)

- Stat boosts, damage/defense multipliers, exclusive power gear tiers
- Win-rate insurance, paid matchmaking advantages, PvP power
- Teleport / fast travel (world design invariant)
- Paid access to story zones or questlines free players cannot reach by play
- Buying faction rank without corresponding play acts
- Paying to skip Ban Hammer / enforcement outcomes

### 5.2 Sink review test (one sentence)

> “Would two equal-skill players still have the same combat outcome if only one bought this?”  
> If **no** → reject. If **yes** and it only saves time or changes looks → allow.

### 5.3 First-hour attractive sink basket (example)

| Buy | Cost | Role |
|---|---|---|
| Emote | 40 | Identity dopamine |
| Craft timer boost ×2 | 50 | Feel of progression convenience |
| Small decor | 60 | Housing/stall fantasy |
| Inventory row | 80 | Quality-of-life |
| **Basket** | **230** | ~matches first-hour earn → healthy burn |

---

## 6. Inflation caps (layered)

| Layer | Cap | Enforcement |
|---|---|---|
| **Per-source daily** | See §4 table | Hard reject `need.earn` over cap |
| **Personal fatigue** | floor 0.35, k=0.12 | Applied before mint |
| **Player hourly gross** | soft 220; hard log 300 | Soft: UI “work tired” / fewer contracts offered; hard: orchestrator flag |
| **Player daily gross (non-IAP)** | **1,200** NEEDs | Hard cap excluding `src.iap_need_pack` |
| **Zone hourly mint** | budget per zone (pier 40k, market 55k at slice pop) | T3 throttles event payouts |
| **Region 24h mint/spend ratio** | earn ≤ 1.25 × spend | Auto: +index on sinks, −event mult |
| **IAP → wallet** | no play-cap; **same sinks only** | Cannot convert IAP into power SKUs |
| **Agent mint authority** | agents propose; judge+ledger mint | Live NPC cannot free-mint |

**C0D3X clause:** if mint invariants break (e.g. bug mass-credit), rollback to last green snapshot; surplus becomes lore banner, not permanent inflation.

---

## 7. Balance rules (operators)

1. **Earn before IAP education** — first session teaches play earn → sink; IAP packs unlock in UI after first sink purchase or 45 min, whichever first (still optional forever).
2. **Diminishing returns beat hard walls** where possible — floor 0.35 keeps low-intensity play valid.
3. **Burn ≥ 60%** of new-player hour via desirable sinks; if telemetry shows <50% for 7d, cut prices 10% or add cosmetic drop (design ticket, not silent hot-patch power).
4. **If telemetry shows >180 median NEEDs/h** at day-7 cohort, raise `k` by 0.02 or lower gather bases 10%.
5. **Craft market** is the pressure valve: tax burn + price index; do not add P2W gear to fix inflation.
6. **Events** are spectacle, not optimal infinite farm — session decay + participation caps.
7. **Judge invariants** on every `world_effects` that touch currency: amount > 0, source_id known, player under daily cap, sku on whitelist if spend.
8. **No negative NEEDs**; spends fail closed if balance insufficient.

### 7.1 Slice KPI board (design acceptance)

| KPI | Pass |
|---|---|
| ≥8 sources documented with numbers + decay | yes (§4) |
| ≥8 sinks documented with prices + P2W=no | yes (§5) |
| First-hour earn band 180–260 achievable without IAP | yes (§4.2) |
| First-hour sink basket covers ≥60% earn | yes (§5.3) |
| Explicit inflation caps | yes (§6) |
| P2W blacklist + review test | yes (§5.1–5.2) |

---

## 8. Implementation hooks

### 8.1 Ledger fields (minimum)

```text
need_tx {
  tx_id, player_id, sign: earn|spend,
  amount, balance_after,
  source_id | sink_id,
  decay_class, multipliers[],
  location_id, zone_id, region_id,
  occurred_at, actor (system|npc|iap|judge)
}
```

### 8.2 Game events

- Earn path emits `need.earn` with `source_id` in payload metadata.
- Spend path emits `need.spend` with `sink_id` / `sku`.
- `world.tick` may include `economy_deltas` for `price_index` and stock regen.

### 8.3 Config seed (engine-facing IDs)

Use stable IDs from §4 and §5 tables. Do not rename without a migration note; live NPCs and analytics key off these strings.

---

## 9. File map

| Artifact | Path |
|---|---|
| **This spec** | `docs/dream/needs-sources-sinks-decay.md` |
| Core loop / economy parent | `paperclip-tro/projects/DREAM-CORE-LOOP-ECONOMY-DESIGN.md` |
| World zone earn/spend flavor | `docs/dream/world-bible-stub.md` |
| Trigger vocab | `docs/dream/live-npc-trigger-vocabulary.md` |
| Project charter | `paperclip-tro/projects/PROJECT-2-DREAM-ONLINE.md` |

---

## 10. Out of scope (follow-ups, not this issue)

- Full global SKU sheet beyond Harbor Ward (pay-for-convenience sheet expansion).
- Live telemetry dashboards / auto-tuner implementation.
- IAP real-money price points (store ops; Square/product surface separate from DREAM design).
- Engine integration code (Unreal) — design numbers only here.
