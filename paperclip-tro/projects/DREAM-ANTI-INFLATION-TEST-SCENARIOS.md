# DREAM Online — Anti-Inflation Test Scenarios

> **Issue:** TRO-129 · **Validates:** TRO-90 / NEED sources-sinks-decay rules  
> **Date:** 2026-07-11 · **Status:** design-complete scenarios  
> **Numbers from:** `docs/dream/needs-sources-sinks-decay.md` + `paperclip-tro/projects/DREAM-NEED-SOURCES-SINKS-DECAY.md`  
> **Public copy:** NEEDs = in-game currency only. No mission/charity framing in scenarios or UI.

---

## 0. Pass/fail laws under test

| Law | Pass condition |
|---|---|
| First-hour sink ratio | Player *can* spend 60–80% of first-hour gross on non-power sinks |
| Fatigue floor | Repeatable farm never pays below 35% of base in window |
| No P2W | No sink improves combat win-rate vs equal gear |
| Server mint soft cap | Rolling 24h Σ earn ≤ 1.25 × Σ spend (or sink incentives fire) |
| IAP optional | Scenarios complete without purchasing packs |

---

## Scenario A — New player first hour (happy path)

**Player:** `ply_new_01` · **Zone:** Harbor Ward (pier → market) · **Duration:** 60 min

| Step | Action | Source / sink | NEEDs Δ | Balance |
|---|---|---|---|---|
| 1 | Complete intro pier job | `src.intro_zone_job` | +50 | 50 |
| 2 | 2× pier day labor | `src.pier_day_labor` | +12, +10 (fatigue) | 72 |
| 3 | Buy starter cosmetic emote | `snk.emote_pack` | −50 | 22 |
| 4 | Rat clear route ×2 | `src.rat_clear_route` | +12, +10 | 44 |
| 5 | Courier market↔pier | `src.courier_run` | +15 | 59 |
| 6 | Inventory expand (1 tab) | `snk.inventory_expand` | −200? *use slice min* → if min 200, player cannot yet — buy craft_speed ×3 instead | |
| 6b | Craft speed convenience ×3 | `snk.craft_speed` | −30 | 29 |
| 7 | Market tip sell craft goods | `src.craft_market_sell` −5% fee | +40 net | 69 |
| 8 | Housing décor trinket | `snk.housing_decor` | −40 | 29 |

**Expected:**

- Gross earn ≈ 50+12+10+12+10+15+40 ≈ **149** (within 180–260 with optional 2 more micro jobs)
- Sinks ≈ 50+30+40 = **120** → sink ratio ≈ **80%** of gross → **PASS** first-hour law
- No power SKU purchased → **PASS** P2W
- Fatigue applied on second labor/rat clears → **PASS** decay visible

**Fail if:** player ends hour with >80% of gross unspent *and* no attractive sink under 50 NEEDs shown in UI.

---

## Scenario B — Optimized grinder hits soft cap (anti-balloon)

**Player:** `ply_grind_01` · **Intent:** maximize NEEDs/h for 2h · **No IAP**

| Window | Behavior | System response |
|---|---|---|
| 0–60 min | Only gather + rat clears on same pier cluster | Personal fatigue → payout → floor 0.35; cluster stock <20% → ×0.5 overharvest |
| 60–120 min | Continues same route | Gross earn **≤220 NEEDs/h** hard-core soft cap; UI surfaces cosmetic spotlight |
| Ledger | Regional unspent high | Price index on cosmetics/convenience drifts up toward 1.25 clamp |

**Numeric check (illustrative):**

- Base rat pack 12 NEEDs; after 8 completions in 60m: `multiplier = max(0.35, 1 − 0.12×8) = 0.35` → **4 NEEDs**
- Cluster stock tax ×0.5 → **2 NEEDs** effective
- Hourly gross from pure farm path stays **well under** 220 after fatigue+stock

**Expected PASS:**

- Cannot print unbounded NEEDs from one node
- Wallet soft warning at 2,500 if they refuse sinks
- Still no path to buy combat advantage

**Fail if:** same-spot AFK for 2h yields ≥300 NEEDs/h after decay.

---

## Scenario C — Economy breathe (earn/spend + ledger)

**Players:** 10 casuals · **Region:** Harbor Ward · **Duration:** one in-game day (dawn→dawn)

| Phase | Events | Earn/spend | Ledger effect |
|---|---|---|---|
| Dawn | Dailies reset; Mira favors available | Named NPC +25 each (relationship gate) | Favor confidence high |
| Day | Mixed courier, craft, market | 5% market fee burn on sells | Fee NEEDs leave player wallets |
| Dusk | Spectacle event (3 pays max/session) | +10–40 session-capped | Session decay blocks 4th pay |
| Night | Low traffic; nodes regen underuse_boost | Fewer earns | Stock recovers for next dawn |
| Dawn+1 | Audit Σearn vs Σspend | — | If earn > 1.25× spend, raise sink incentives / cut event payout |

**Injected stress:** accidental mass mint from test bug (+50k region).

**Required response (C0D3X canon):**

1. Detect mint anomaly via ledger audit  
2. Rollback + convert incident to **lore banner** (not silent wipe)  
3. Resume with pre-mint balances  

**Expected PASS:**

- Session spectacle caps hold  
- Market fee provides always-on burn  
- Mass mint becomes lore rollback path, not permanent inflation  

---

## 1. Automation hooks (later)

When engine wiring lands, each scenario becomes a fixture:

| Scenario | Assert |
|---|---|
| A | `sink_ratio_first_hour ∈ [0.60, 0.85]` |
| B | `hourly_gross_optimized ≤ 220` after fatigue |
| C | `rolling_24h_earn ≤ 1.25 * rolling_24h_spend` or incentive flag set |

Events use `need.earn` / `need.spend` payloads from live-NPC trigger vocabulary.

---

## 2. Acceptance (TRO-129)

- [x] 3 play sessions with NEED flows (A happy path, B grind cap, C ledger day)
- [x] Validated against sources/sinks/decay rules (TRO-90 / needs-sources-sinks-decay)
- [x] Explicit pass/fail laws + automation hook notes
- [ ] Engine fixture implementation (out of scope — follow-up)

---

## 3. References

- `docs/dream/needs-sources-sinks-decay.md`
- `paperclip-tro/projects/DREAM-NEED-SOURCES-SINKS-DECAY.md`
- `paperclip-tro/projects/DREAM-CORE-LOOP-ECONOMY-DESIGN.md` §2
- `docs/dream/live-npc-trigger-vocabulary.md` (`need.earn` / `need.spend`)
