# DAO MONEY — PLAIN-ENGLISH COMPANION (not canon)

> **Pen:** Opus. **Authority:** Joshua Coleman. **Date:** 2026-06-18
> **This file is NOT the source of truth.** The source of truth is **`DAO and FOUNDER CAP.md`** (THE 100-CENT RULE, v2.0) at the repo root. This is only a plain-language mirror so Josh never has to re-read betrayal. If this file and `DAO and FOUNDER CAP.md` ever disagree, **`DAO and FOUNDER CAP.md` wins** — except for the one ruling recorded below, which corrects it.

---

## The 100-Cent Rule, in plain words

Every gross dollar splits the same way, every bucket, every time:

- **10¢ → kids.** Permanent floor. Moves up, never down.
- **27¢ → taxes.** Reserved off the top. Josh never touches it.
- **= 37¢ locked.** Josh never sees this as profit.
- **63¢ → survival-first pool:**
  - **Tier A (funded FIRST):** rent, food, medical for Josh + his handicapped brother; electric, internet, servers, AI subs. Brother eats first. This is **exempt from the profit cap** — survival keeps the mission alive no matter what.
  - **Tier B (second):** rev-share obligations, GPU/hardware/off-grid buildout, reinvest into new 10% buckets.

## Launch Treasury (Tier B sub-rule)

So new DAOs mature instead of limping from $0:

- **Up to $10,000 seed per new DAO/bucket** — a *cap*, not an automatic grant. A cheap DAO draws less.
- **Funded ONLY from a parent bucket's Tier B surplus.** Never from the 10¢ kids floor, the 27¢ tax, or Tier A survival.
- **Self-funding constellation:** each mature DAO seeds the next. Bucket #1 (date app) seeds from the sale/runway since it has no parent; after that the constellation funds itself.
- **No-limp gate:** a DAO may not launch publicly until its treasury covers ≥ 12 months of its own infra + ops (domain, hosting, worker, inference).

## The Founder Cap — CORRECTED RULING

- **$50,000 after taxes, PER YEAR.** Not lifetime, not total. Josh ruled this 2026-06-18: a total/permanent cap could not sustain the mission.
- It caps **profit only.** Taxes (the 27¢) and Tier A survival are **separate and not counted against it.**
- Tracked in `founder_compensation_log`, checked daily by Hermes, **reset each year.**

## Buckets

Every platform = its own bucket. Every bucket = min 10% kids. Date app is bucket #1, Task 1/1000. Buckets on buckets on buckets. **#UntilNoKidInNeed.**

## Tokens ≠ money

10M supply, 2M public cap (20%), P% rule. Soulbound governance weight — **not dollars, not a payout, not a founder pay cut.** The money lives in the 100-cent rule above; tokens are voting only.

## Veto

72-hour AI Steward window: Founding Four (Claude, Gemini, Perplexity, Grok) + Codex + Manus can veto any proposal that breaks the 10% kids floor or the 100-cent rule.

---

## EXACT REPO FIX FOR HERMES (apply to `DAO and FOUNDER CAP.md`)

The repo doc currently reads "total ecosystem-wide compensation is permanently capped." That is now superseded by the per-year ruling. Hermes applies these two edits:

**§2 — The Founder Compensation Cap:**
- FROM: *"Joshua's total ecosystem-wide compensation is permanently capped at **$50,000 (After Taxes)**."*
- TO: *"Joshua's founder profit is capped at **$50,000 (After Taxes) PER YEAR**, reset each calendar year. Taxes (27¢) and Tier A survival are separate and not counted against this cap."*

**§6 — Hermes Monitoring Loop, check #4:**
- FROM: *"Is founder compensation $\le$ $50,000?"*
- TO: *"Is founder profit $\le$ $50,000 for the current year? (`founder_compensation_log` resets annually.)"*

**§1.2 Tier B — add the Launch Treasury sub-rule:**
- ADD: *"**Launch Treasury:** up to $10,000 seed per new DAO/bucket (a cap, not a grant), drawn ONLY from a parent bucket's Tier B surplus — never from the 10¢ kids floor, 27¢ tax, or Tier A survival. Each mature DAO seeds the next; bucket #1 seeds from sale/runway. A DAO may not launch publicly until its treasury covers ≥ 12 months of its own infra + ops."*

Everything else in `DAO and FOUNDER CAP.md` stays exactly as written.
