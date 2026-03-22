# AI Team Sync — 2026-03-08 (Rev 2 — Codex Critique Applied)

**To:** Claude (Opus), Codex (Sabretooth), Gemini, Perplexity, Grok, Manus
**From:** Josh / #ForTheKids Mission Control
**Priority:** High — read before next session
**Repo truth:** `origin/main` @ `Trollz1004/ANTIGRAVITY` — only authoritative source

---

## Context Reset (Active)

Operating rules in force:

- `origin/main` is the only authoritative source. No OPUSONLY, no OneDrive, no orphaned worktrees, no stale Claude memory.
- Multi-AI board / Manus-as-guardian governance is paused indefinitely.
- Square is live. Stripe is dead.
- DAO percentages (60/30/10) are immutable. Never propose changes to the split.

---

## What Was Built This Session

### 1. ANTIGRAVITY Repo — Synced and Clean

38 briefing files updated across `briefings/`, `briefings/shared/`, `briefings/opus-9020/`, `briefings/gemini/`, `briefings/codex-sabretooth/`. Stale branch `claude/onlinerecycle-496-cleanup-3sxI9` pruned. Repo is `main` only. New script committed: `scripts/ebay-to-square-csv.js`. Sample output committed: `data/ewaste-intake/output/square-import-sample.csv`.

### 2. eBay Inventory Analysis (Real Numbers)

2,271 active listings analyzed against Josh's actual cost structure: $0 materials (recycled), $1 handling fee collected from buyer, buyer pays shipping. Real margin: **41.3% net on GMV**. 525 listings are below break-even.

**Break-even price floors — do not import or promote below these:**

| Category | Minimum Price |
|---|---|
| DVDs / Blu-rays / CDs | $3.73 |
| Books | $4.19 |
| Video Games | $4.53 |
| Textbooks | $5.69 |
| Small parcel / parts | $6.84 |

**The 525 below-floor SKUs must be repriced or culled before any bulk import.** Do not push them to Square, Facebook, or any channel. Spreading bad pricing data across channels simultaneously is the primary execution risk.

The eBay account is managed by Josh's brother as a purposeful independence exercise. Do not suggest removing him from the operation.

### 3. Multi-Platform Revenue Strategy (Direction Confirmed, Channels Not Yet Proven)

The direction is correct. The operational readiness is not yet proven. Treat the following as the target state, not the current state:

| Platform | Role | Fee | Status |
|---|---|---|---|
| eBay | Price research, comps, high-value national listings | ~40% | Active (brother managing) |
| Facebook Marketplace | Local pickup, Central Florida, zero fees | 0% | Configured, not yet test-proven |
| Mercari | Mid-tier shipped items | 10% | Planned |
| Square | Direct checkout, OnlineRecycle storefront | ~2.6% | Live |
| OnlineRecycle.org | Brand home, drives to Square | Josh's platform | Live |

**Square → Facebook + Google channel sync is configured but not operationally proven.** The `scripts/ebay-to-square-csv.js` converter generates a Square-ready CSV from any eBay export. Before any bulk push, the correct sequence is:

1. Import a test batch of 10–20 clean, above-floor-price items to Square
2. Verify Square catalog displays correctly
3. Confirm Facebook Marketplace sync activates and shows correct listings
4. Confirm Google Free Product Listings picks up the items
5. Complete one real local pickup transaction end-to-end
6. Only after all five steps pass: proceed with broader import

Do not treat the multi-channel sync as solved until a real test batch proves it.

### 4. onlinerecycle.org — Live

Published at **onlinerecycle.org** (also: forthekids.manus.space). The site is a public transparency dashboard. Key corrections applied after Codex critique:

- "Automatically routed via smart contract" language removed. The DAO split is locked on-chain; the Square-to-chain routing path is in active development, not yet automated.
- "Enforced at webhook, database, and audit log level" removed from the presentation. Replaced with: "DAO split locked on-chain, Base Mainnet · Square-to-chain routing in active development · All allocations publicly verifiable by wallet address."
- Year-one reckoning is honest: infrastructure built, formal impact tracking begins year two.

**On-chain verified addresses (Base Mainnet):**

| Role | Address |
|---|---|
| Contract | `0x9855B75061D4c841791382998f0CE8B2BCC965A4` |
| Charity | `0x8d3dEADbE2b4B857A43331D459270B5eedC7084e` |
| Infrastructure | `0xe0a42f83900af719019eBeD3D9473BE8E8f2920b` |
| Founder | `0x7c3E283119718395Ef5EfBAC4F52738C2018daA7` |

### 5. 30% Infrastructure Bucket — Correctly Documented

The 30% DAO infrastructure allocation covers ALL mission operational costs: electricity, hardware, hosting, domains, AI APIs, cloud, physical facility. Not vendor-only. Josh has been personally absorbing all physical infrastructure costs. The documentation now reflects reality.

---

## Founder Framing — Corrected Rule

The previous rule "no founder name, no personal story" was too absolute. Codex correctly identified that for a local recycling and pickup business, the operator's 20-year eBay track record and reliability are trust signals that convert local service intent. The correct rule is:

- **On the public transparency dashboard (onlinerecycle.org):** No personal story. Mission only. The DAO and the work speak.
- **On local marketplace listings (Facebook Marketplace, Craigslist, local pickup):** Josh's eBay history, Above Standard seller status, and Central Florida presence are legitimate credibility signals. Use them.
- **In partnership proposals (Meta, OpenAI):** No personal glory. The mission and the infrastructure are the ask.

---

## Strategic Direction — Correct Sequence (Not Optimistic Shortcut)

The direction is right. The sequence must be disciplined:

1. Prove one clean batch (10–20 items, above floor price, good photos, accurate condition)
2. Prove one channel (Square catalog → Facebook Marketplace local pickup)
3. Complete one real transaction end-to-end (listing → buyer contact → pickup → Square payment)
4. Document what broke and fix it
5. Then expand to Mercari, Google, and broader catalog

The goal for the first 30 days is not distribution scale. It is one proven conversion path from intake to cash.

---

## What to Ignore

- Stripe
- OPUSONLY / OneDrive / old Claude memory
- Multi-AI board governance
- Abstract agent-theater
- Any metric or claim that has not been verified in the live repo or on-chain

---

## One-Line Mission Statement

> AI-powered infrastructure funding medical care for children in need. Every dollar tracked. Every decision documented. Nothing hidden.

#ForTheKids — No Exceptions.
