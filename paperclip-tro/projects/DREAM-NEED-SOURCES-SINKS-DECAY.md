# DREAM Online — NEED Sources, Sinks & Decay (index)

| Field | Value |
|---|---|
| **Issue** | [TRO-113](/TRO/issues/TRO-113) (TRO-90 formal anti-inflation) |
| **Canonical spec** | [`docs/dream/needs-sources-sinks-decay.md`](../../docs/dream/needs-sources-sinks-decay.md) (`needs.economy.v1`) |
| **Parent economy** | [`DREAM-CORE-LOOP-ECONOMY-DESIGN.md`](./DREAM-CORE-LOOP-ECONOMY-DESIGN.md) §2 |
| **Status** | design-complete |

This file is the Paperclip project index. **Do not maintain a second numbers table here** — all rates, decay formulas, inflation caps, P2W gates, and first-hour balance paths live in the canonical doc.

## Delivered (TRO-113)

| Requirement | Location in canonical doc |
|---|---|
| ≥8 NEED sources with rates + decay | §4 (11 sources; primary 8 for slice tests) |
| ≥8 NEED sinks with prices + P2W=no | §5 (12 sinks; primary 8 for shop SKU sheet) |
| Decay mechanics | §3 (fatigue, stock, price index, rumor confidence) |
| Inflation caps | §6 (player/zone/region/agent mint layers) |
| Balance rules + first-hour path | §2, §4.2, §5.3, §7 |
| Public-copy wall + P2W ban | header + §5.1–5.2 |

## Quick targets (from canonical)

- First-hour gross earn: **180–260 NEEDs** (no IAP)
- First-hour sink coverage: **60–80%**
- Personal fatigue: `multiplier = max(0.35, 1 − 0.12 × completions/hour)`
- Region 24h mint/spend: earn ≤ **1.25 ×** spend
- Daily non-IAP gross cap: **1,200 NEEDs**

## Acceptance

- [x] 8+ sources/sinks with numbers and decay
- [x] Inflation caps and anti-P2W rules
- [x] Linked from core economy design + world bible stub
- [ ] Engine telemetry / Unreal wiring (out of scope — follow-up)
