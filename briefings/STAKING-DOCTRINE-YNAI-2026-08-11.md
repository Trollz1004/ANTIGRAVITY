# STAKING DOCTRINE — YNAI / DATE APP — 2026-08-11

> **Lane:** AGENT-INTERNAL ONLY (briefings/). Nothing in this file appears on
> customer surfaces. Business-only public doctrine (2026-06-22) governs all
> customer copy. This file governs owner accounting, token strategy, and
> infrastructure destination for proceeds.
>
> **Declared by:** Joshua Coleman, founder, this session (Cowork, claude.ai Max).
> **Status:** Standing doctrine until Joshua rescinds in a newer timestamped file.
> **Legal gate:** No token offer or sale to any person until a securities
> attorney clears the structure. See `briefings/DAO-FORMATION-YOUANDINOT-2026-07-01.md`
> Part 5. This doctrine sets intent, not a green light.

---

## 0. FIRST PRIORITY — COST RECOVERY BEFORE MISSION (declared 2026-08-11)

Joshua's order: **"no splits, no mission in code until mission is saved and
funded — the costs accrued from 16 months."**

- **No splits.** No revenue-splitting logic in any smart contract or payment
  flow. PlatformSplitter stays retired. One wallet, one treasury.
- **No mission in code.** Contracts, deploy scripts, and product code carry
  zero mission language, zero donation/percentage logic, zero third-party
  benefit routing. Verified clean 2026-08-11 (contracts/ynai/ + deploy script).
- **Proceeds waterfall:**
  1. **Repay Joshua's 16 months of accrued costs** (~Apr 2025 → Aug 2026:
     API/subscription spend, hosting, hardware, filings — real ledger to be
     compiled from actual records; no estimates booked as fact).
  2. **Fund the operation** — platforms self-sustaining, taxes and expenses
     covered.
  3. Only THEN do the staking cap and any mission activation below apply.
- Mission framing stays in briefings/ (internal lane) until steps 1–2 are done.
- **Mission knowledge lane:** only official first-party AI sessions (Claude on
  claude.ai, Gemini, ChatGPT, Manus, Grok) carry mission context. Never code,
  never customer surfaces. Enforced at repo root: `CLAUDE.md` NO-DRIFT ORDER.

## 1. The Doctrine (verbatim intent)

1. **Sell aggressively, not slow-vest.** Joshua prefers to sell the sellable
   token allocation and deal with less catch-up, rather than drip it over years.
   Proceeds fund the exit from the current situation and the build-out below.
2. **$50,000 founder draw cap — date app.** Joshua's personal draw from
   dating-app (youandinotai.com) staking proceeds is capped at $50,000.
3. **Everything above the cap stays staked in perpetuity.** Date-app staking
   above $50K is never drawn. It remains staked "for eternity."
4. **Other platforms carry the load.** ai-solutions.store, onlinerecycle.org,
   and the physical ewaste/recycling operation cover operating costs and taxes,
   so the perpetual stake is never invaded for expenses.
5. **The 10%-per-bucket personal-income reserve** (CLAUDE.md §4.2) still
   applies per legally-distinct revenue stream and is separate from the $50K cap.

## 2. Where proceeds go (mission destination)

Joshua's words: "MY CODE is the electrical code." He holds an NEC electrician
license and wires the build himself — zero labor cost on the electrical scope.

- **Real data center, cave off a river.** Natural thermal mass + river cooling
  eliminates the largest share of a normal DC power budget.
- **Power stack:** hydro + wind + solar + battery banks + gas generator, with
  cloud failsafes for burst/failover.
- **Compute:** dual RTX 4090s for local inference + one or two energy-efficient
  servers. Retires the T5500 dual-Xeon / GTX 1070 tier. Eliminates recurring
  AI API costs permanently ("pay AI costs for a year so not deal with this
  situation again" → then local forever).
- **Sunlight businesses:** ai-solutions.store marketplace scale-up + physical
  ewaste/recycle operation — income plus gets Joshua out of the house.

## 3. What this changes in the stack

| Artifact | Current state | Change required |
|---|---|---|
| `contracts/ynai/YNAIVesting.sol` | 1-yr cliff / 4-yr linear, 51M Class A | **Decision pending.** Sell-aggressive applies to the Class B sellable tranche, not necessarily Class A. Options: (a) keep 4-yr founder vest for market/legal credibility, sell Class B hard; (b) shorten cliff. Do NOT redeploy or edit until Joshua picks. |
| Class B tranches (formation pkg Part 3.5) | Seed 10M / Strategic 5M / Public 34M | Emphasis shifts to maximum compliant sale velocity. Exemption path (506(c) → Reg S → Reg A+) still mandatory per Part 5. |
| Treasury design | 49M to Timelock at deploy | Add staking destination: date-app staking proceeds route to a stake position; only first $50K is drawable by founder. Enforce socially/legally now; consider on-chain enforcement (vesting-style drawdown cap contract) later. |
| Ops budget | — | Other-platform revenue is the expense+tax lane. Date-app stake is not an expense source. |

## 4. Guardrails that still bind

- FL §496.405 canonical-7 terms: never on customer surfaces.
- Business-only public doctrine 2026-06-22: no token/future-structure promises
  in product copy; no marketing that implies profit from others' efforts
  (Howey — formation pkg §5.5).
- Entity separation: date-app/DAO staking lives in YouAndINot AI DAO LLC (WY,
  in formation). FL LLC (Trash Or Treasure Online Recycler LLC #L25000158401)
  runs ewaste/recycle + other surfaces. No commingling.
- Square only on youandinotai.com. Cloudflare-only hosting.
- Real numbers or fail honestly. No projected-stake figures presented as actuals.

## 5. Superseded / related files

- Supersedes nothing; extends `DAO-FORMATION-YOUANDINOT-2026-07-01.md` with
  founder allocation-and-draw doctrine.
- `DAO-TOKENOMICS-FINAL.md`, `DAO-ARCHITECTURE-CANONICAL.md`,
  `DAO-LAUNCH-ARCHITECTURE.md` remain superseded (2026-06-22 notes stand).
- Contracts drafted this session: `contracts/ynai/` (Token, Vesting, Governor,
  Timelock, deploy script, README).

**#UntilNoKidInNeed**
