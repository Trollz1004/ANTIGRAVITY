# DREAM Online — NEED Sources, Sinks & Decay Mechanics

> **Issue:** TRO-113 · **Project:** PROJECT-2 phase 1 · **Tag:** DREAM design  
> **Status:** design-complete (implementation-ready list)  
> **Date:** 2026-07-11  
> **Depends on:** [TRO-44](/TRO/issues/TRO-44) core loop/economy design · `dream-live-npc` skill  
> **Public copy:** NEEDs = in-game currency / product value only. No mission, charity, or funding language on customer surfaces.

---

## 1. Purpose

List **8+** concrete NEED **sources** (faucets) and **sinks** (drains) with explicit **decay / anti-balloon** mechanics so slice economy tuning has a shared table before engine wiring.

Aligned rules from `DREAM-CORE-LOOP-ECONOMY-DESIGN.md`:

- Soft + premium hybrid (earn + optional purchase packs)
- Pay-for-convenience only — never pay-to-win
- Sink ratio target: **60–80%** of earned NEEDs should find an attractive non-power sink in the first hour
- Live agents never mint NEEDs without judge/orchestrator caps

---

## 2. Decay classes (shared vocabulary)

| Class | Applies to | Behavior |
|---|---|---|
| `session` | Burst rewards, intro bonuses | Caps reset each play session (or 4h idle) |
| `hourly` | Gather/farm cycles | Soft DR after N actions/hour; hard floor never zero |
| `daily` | Named NPC favors, dailies | One full payout / day / NPC; partial refresh next day |
| `weekly` | Spectacle jackpots, prestige cosmetics | Caps + rotating sink catalog |
| `sticky` | Purchased pack balances | No auto-decay of owned balance; only spend sinks |
| `ledger` | Regional prices, rumor confidence | T3 `world.tick` drifts prices; confidence decays over days |

NPC memory decay (`ephemeral` / `normal` / `sticky` in write-back schema) is **orthogonal** — it forgets story, not currency. Currency decay lives in this table only.

---

## 3. NEED sources (≥8 faucets)

| # | Source ID | Slice rate (NEEDs) | Decay / anti-inflation | Zone bias |
|---|---|---|---|---|
| 1 | `src.intro_job` | 50 once | `session` — tutorial only; cannot re-farm | harbor_pier |
| 2 | `src.gather_node` | 5–15 / cycle | `hourly` — −25% after 20 cycles/hr; −50% after 40 | all |
| 3 | `src.craft_market_sell` | 20–80 / sale | Player price discovery; fee 5% burn (`snk.market_fee`) | market_row |
| 4 | `src.npc_daily_favor` | 25 / day / named NPC | `daily` — relationship gate ≥0.1 | pier / market |
| 5 | `src.spectacle_participate` | 10–40 / event | `weekly` event pool; not optimal vs gather | server |
| 6 | `src.quest_beat` | 15–60 / beat | Story-gated; no infinite repeat without new beat | quest chain |
| 7 | `src.courier_contract` | 12–35 / run | `hourly` soft DR; destination diversity bonus | market_row |
| 8 | `src.night_watch` | 20–40 / shift | `daily` one shift; hazard risk can fail payout | harbor_pier |
| 9 | `src.iap_pack` (optional) | pack SKU | `sticky` balance; never grants power | shop UI |

**Rules:**

- Sources 1–8 are pure play. Source 9 is optional convenience funding only.
- No source may scale with real-money spend into combat power.
- Mass mint from bugs becomes **lore + rollback** (C0D3X), not silent wipe.

---

## 4. NEED sinks (≥8 drains)

| # | Sink ID | Typical cost | Decay / pressure role | P2W gate |
|---|---|---|---|---|
| 1 | `snk.cosmetic_skin` | 100–2000 | `weekly` catalog rotate; vanity pressure | pass |
| 2 | `snk.emote_pack` | 50–400 | low; social vanity | pass |
| 3 | `snk.housing_decor` | 25–1500 | long-tail sink; sticky ownership | pass |
| 4 | `snk.inventory_expand` | 200–800 | `session` convenience; diminishing slots cost↑ | pass |
| 5 | `snk.craft_queue_slot` | 150–600 | convenience timer only; no better stats | pass |
| 6 | `snk.craft_speed` | 10–80 / craft | burns excess farm NEEDs; never quality | pass |
| 7 | `snk.repair_time` | 5–40 | time convenience, not higher max gear | pass |
| 8 | `snk.market_fee` | 5% of sale | automatic burn on `src.craft_market_sell` | pass |
| 9 | `snk.name_look_reset` | 300–1000 | rare vanity | pass |
| 10 | `snk.cart_rental_aesthetic` | 20–100 | travel flavor — **not** teleport/fast travel | pass |

**Auto-reject sinks (never ship):**

- Stat boosts, exclusive power gear tiers, PvP win insurance, paid content locks free players cannot reach by play.

---

## 5. Combined anti-balloon loop

```
Play sources (hourly/daily caps)
        ↓
Attractive sinks in first hour (cosmetics + inventory + craft convenience)
        ↓
Market fee burn (5%) on player trade
        ↓
Ledger price drift (T3 world.tick) softens overfarmed nodes
        ↓
Optional IAP tops convenience only — never power
```

**First-hour target:** player earns ~80–150 NEEDs from intro + 1–2 jobs; sees ≥3 sinks under 100 NEEDs so balance does not idle-stack.

**Session overflow:** if balance > 5× mean hourly earn after 2h, surface a cosmetic spotlight (UI only) — no forced tax, no power sale.

---

## 6. Decay schedule (implementation notes)

| Tick | System | Action |
|---|---|---|
| Per action | Gather/courier counters | Apply `hourly` DR multipliers |
| Session start / 4h idle | Intro + session bonuses | Reset `session` flags only |
| Daily rollover (region TZ) | NPC favors, night watch | Reset `daily` payout flags |
| `world.tick` | Ledger prices + rumor confidence | ±small drift; confidence ×0.9/day if unreinforced |
| Weekly | Spectacle pool + cosmetic spotlight | Rotate non-power catalog |

Agent memory `decay_class` on write-back does **not** burn NEEDs. Currency and memory clocks are separate.

---

## 7. Acceptance (TRO-113)

- [x] ≥8 NEED sources listed with rates
- [x] ≥8 NEED sinks listed with costs and P2W gate
- [x] Explicit decay classes and tick schedule
- [x] Linked to TRO-44 economy design + public-copy boundary
- [ ] Engine telemetry hooks (phase 2 — follow-up)

---

## 8. References

- `paperclip-tro/projects/DREAM-CORE-LOOP-ECONOMY-DESIGN.md`
- `paperclip-tro/projects/PROJECT-2-DREAM-ONLINE.md`
- `.agents/skills/dream-live-npc/SKILL.md`
- `briefings/DREAM-ONLINE-AND-DAO-SEPARATION-2026-07-01.md`
- `docs/dream/world-bible-stub.md` (zone-level NEED flavor)
