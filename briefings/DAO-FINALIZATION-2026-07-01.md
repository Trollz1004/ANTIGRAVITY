# DAO FINALIZATION — 2026-07-01

> **Authority:** Joshua Coleman (direct assignment, claude.ai Max session, 2026-07-01)
> **Finalized by:** Claude (Opus-grade session) — Joshua explicitly delegated finalization
> of the DAO/token question from the 2026-07-01 Sonnet drafting session to this session.
> **Status:** ACTIVE internal doctrine. Internal briefing only — never customer-facing.
> **Reconciles:** `DAO-TOKENOMICS-FINAL` (Opus, 2026-04-26 rev 2026-06-01),
> `archive/business-only-retired-2026-06-22/DATE-APP-SELF-HOST-OPS-FUNDING-2026-06-19.md`,
> `BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md`, and the `contracts/ynai/` draft set (2026-07-01).

---

## 1. The Founder Waterfall Is Reaffirmed (Not New)

The money order Joshua restated on 2026-07-01 is the SAME waterfall already written in
`DATE-APP-SELF-HOST-OPS-FUNDING-2026-06-19.md`. That file was archived in the 2026-06-22
business-only sweep, but its financial waterfall was never rescinded. It is restated here
as active internal doctrine so no session misses it again:

For date-app sale proceeds, in order:

1. Taxes, processor settlement obligations, refunds, required reserves.
2. Founder household and platform survival bills (Joshua + brother's living costs
   that keep the work alive).
3. Core operating costs: electric, internet, hosting, storage, AI tools, subscriptions.
4. Dev equipment and hardware upgrades needed to ship faster. This tier now explicitly
   includes (2026-07-01 addition, leveraging Joshua's electrical license):
   - Dual RTX 4090 compute (replacing T5500 dual-Xeon / GTX 1070 class hardware).
   - One or two energy-efficient servers.
   - Self-generation infrastructure buildout as capital allows: river/hydro, solar,
     wind, battery banks, gas generator backup, cloud failsafes, and thermal-mass
     (cave) siting for the mission data center. Joshua designs and wires to code
     under his own license — labor cost is zero.
5. One-year prepay of AI platform access (Claude Max, Codex, Gemini, Perplexity, Grok
   at current tiers) — so this funding situation never recurs.
6. One-year prepay of electric and core infrastructure where practical.
7. **Founder compensation cap: $50,000/year post-tax** from ANTIGRAVITY code revenue.
8. **All remaining date-app proceeds stay staked in perpetuity** (wheel funding).
9. If AI-Solutions, Business Exchange, and OnlineRecycle cover the founder cap plus
   expenses, the date-app staking principal is NEVER drawn — maximum compounding
   toward the kids mission.

## 2. Token Structure Ruling

Two incompatible designs exist:

| | Opus FINAL (2026-04-26, locked) | YNAI draft (Sonnet, 2026-07-01) |
|---|---|---|
| Supply | 2.5M per DAO × 4 DAOs | 100M single token |
| Transferability | Soulbound at launch | Freely transferable |
| Distribution | Follows Square product purchases | 51M founder vest / 49M public sale |
| Legal posture | Product sale (memberships) — clean | Public sale of transferable governance tokens — securities exposure |

**Ruling: the Opus FINAL tokenomics stands.** The Financial Protection Rule in that
document ("no changes to token allocation... unless Josh has received revenue OR
Opus AND Joshua explicitly approve") has not been satisfied for the YNAI redesign,
and the YNAI public-sale structure creates SEC exposure the soulbound design was
deliberately built to avoid.

Joshua's actual goal — "sell it all, fund the buildout, stop drowning" — is served by
the Opus design plus the waterfall: customers buy real memberships/verification through
Square (the live business-only lane), tokens follow purchases as the loyalty/governance
layer, and hardware/prepay/founder-cap funding flows from product revenue through the
waterfall above. That path needs no securities offering, no token-sale counsel gate,
and no delay: it is already the current repo priority ("get YouAndINotAI selling real
memberships and verification through Square").

## 2b. Seat-Sale Posture (Joshua, 2026-07-02 — the Coleman doctrine)

When investor seats sell (per the v1.0 spec's 10-seat structure), the posture is:

- **Plain-language risk disclosure, founder's voice, bold print, on every seat
  agreement:** you can lose every dollar; invest only if you choose to and can
  afford the loss. No hedging, no fine print doing the work.
- **High minimum buy-in** — threshold set to weed out tourists; entry at $2,500+
  and adjustable upward at founder discretion. Self-selects for buyers who can
  absorb loss.
- **Staking alignment:** founder stakes near-all, multi-year. Seat holders accept
  lockups on the same clock. No flippers; everyone eats from the waterfall together.
- **Private, never public:** seats are offered through direct relationships —
  never advertised, never generally solicited, never sold to strangers off a
  public post. Max 10, KYC'd, signed agreements. This keeps the raise in
  standard private-placement territory.
- Memberships/subscriptions/product sales carry NONE of this — ordinary commerce,
  no gate, sell freely.

## 3. Status of contracts/ynai/

`contracts/ynai/` (YNAIToken, YNAIVesting, YNAIGovernor, YNAITimelock,
`scripts/deploy-ynai.js`) is retained as **DRAFT — NOT DOCTRINE, DO NOT DEPLOY**.
It is clean OZ v5 reference work and may be reused if Joshua later approves a
transferable-token path with counsel review. Deployment of ANY token contract still
requires the existing gas-deployment checklist gates: smart-contract audit, CPA review
of token sale tax treatment, Joshua's explicit gas-spend approval.

## 4. Public Copy Boundary (unchanged)

Nothing in this file touches customer surfaces. Business-only public doctrine
(2026-06-22) remains fully in force: sell membership, verification, safety, support,
uptime. No split math, no tax mechanics, no beneficiary claims, no token promises,
none of the canonical 7 terms on any customer surface.

## 5. v1.0 ARCHITECTURE SPEC RECONCILIATION (added 2026-07-01, Joshua directive)

`archive/business-only-retired-2026-06-22/DAO-ARCHITECTURE-SPEC-v1.0-2026-05-01.md`
(Coleman + Claude, May 2026; reviewed by Gemini and OpenAI, but per Joshua's
standing rule — since Claude first explained what a DAO is — **Claude holds final
say on all DAO design, regardless of any other platform's opinion**; an Emergent
Opus "v1.2" improvement pass exists as a PDF not yet recovered) is CONFIRMED as
the canonical future-DAO architecture. This finalization, written by Claude Fable
under Joshua's direct delegation, is that final word as of 2026-07-01. It
supersedes the 51/49 token-governance model for governance design because it
eliminates founder politics structurally:

**Survives into the future DAO (when counsel gate opens):**
- Three-layer architecture: immutable Mission Engine / max-10-seat investment
  governance / zero-power community layer. No token-holder mob to moderate.
- Distribution waterfall: taxes → mission floor → ops → investors → founder LAST.
- Dead-man's switch (180-day heartbeat → autonomous mode → Founding Four succession).
- Founder veto transferring to unanimous Founding Four; seat-not-brand succession.
- Seat mechanics: $2,500 entry, founder-approved transfers, 5% transfer fee to
  mission fund, revocation for child-harm convictions.
- Mission Lock contract reverting floor cuts, mission edits, dissolution.

**Superseded / must update in v1.2+:**
- "Contractual revenue disbursement" as CUSTOMER-FACING language (spec §2.3) —
  outdated. Current doctrine: that phrase is internal-only; customer surfaces sell
  product value with zero mission framing (BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22).
- Public Transparency Dashboard (§3.3) — internal/member framing must be
  business-only compliant before anything renders publicly.
- Entity: architecture now lands under the separate Wyoming DAO LLC
  (DREAM-ONLINE-AND-DAO-SEPARATION-2026-07-01), not the FL LLC.
- Founder economics: $50K/yr post-tax cap + perpetual staking of date-app
  proceeds (§1 waterfall of this file) layer on top of the spec's "founder last" rule.
- Tax framing ("stack multiple qualifying 10% buckets") — pending CPA validation
  per the 2026-07-01 tax discussion; buckets are accounting hygiene, not a
  deduction multiplier, until a CPA says otherwise.

## 6. One-Line Version

Sell memberships now (Square). Waterfall pays taxes → bills → ops → 4090s and the
cave/hydro buildout → 1-year AI + electric prepay → $50K founder cap → everything
else staked forever. Tokens stay soulbound per Opus FINAL. YNAI draft parked until
counsel says otherwise.

#UntilNoKidInNeed
