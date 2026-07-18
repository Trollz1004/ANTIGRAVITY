# AGENT PLATFORM HANDOFF — $5K CASH SPRINT — 2026-07-18

**Authority:** Joshua Coleman  
**Repo:** `Trollz1004/ANTIGRAVITY` · branch **`main`** only  
**Product:** youandinotai.com (Square only)  
**Goal:** fastest path to **$5,000** completed Square volume  

**Do not** re-litigate payments, charity splits, tokens, or AI company partnerships.  
**Do not** use donate/donation/charity/charitable/tax-deductible on customer surfaces.  
**Do not** put founder spotlight on Joshua. Engineering credit stays silent on product surfaces.

---

## 1. Live money rails (already validated 22/22)

| Surface | URL | Notes |
|---------|-----|--------|
| Home / membership | https://youandinotai.com/#membership | Square SKUs |
| Affiliate program | https://youandinotai.com/affiliate/ | 25/35/50% first payment · apply mailto |
| Tracked founder link | https://youandinotai.com/go/josh | cookie `yni_aff` + UTM → `#membership` |
| Member Council | https://youandinotai.com/dao/ | product roadmap signals · not investment |
| Share sheet | https://youandinotai.com/affiliate-links.html | |
| Legal pack | /privacy.html /terms.html /safety.html /child-safety.html /community-guidelines.html /delete-account.html | live |

**Square production links**

| SKU | Price | Link |
|-----|------:|------|
| Bot-Shield | $1 | https://square.link/u/Qc5mxUy7 |
| Founding Member | $14.99/mo | https://square.link/u/cxwjcn0s |
| 3-Month Prepaid | $39.99 | https://square.link/u/oY7qEfRM |
| 12-Month Prepaid | $99.99 | https://square.link/u/6GHpbvvl |
| Royalty Card | $2,500 | https://square.link/u/CafhorUS |

**$5k math:** 2× Royalty = $5k · or ~50× annual · or mix.

**Runtime host:** T5500 `C:\ANTIGRAVITY\frontend\react-app` on **:3200** (public via cloudflared).  
Laptop `C:\antigravity` is control/repo. Do not confuse nodes.

**Outreach pack (ready to send):**  
`content/outreach/CASH-SPRINT-5K-OUTREACH-PACK-2026-07-18.md` (~100 blocks)

**Owner private treasury (INTERNAL ONLY — not customer copy):**  
`briefings/OWNER-PRIVATE-TREASURY-DOCTRINE-2026-07-18.md`

---

## 2. Platform research (Grok / X — 2026 signal)

### What works for verified dating
- Lead with **real humans only / verification that beats bots + deepfakes** — not swipe volume.  
- Market **process + outcomes** (safe, real people, real dates), not empty “verified” badges.  
- **Women-first safety trust** improves balance and male willingness to pay.  
- Authentic, low-polish short video outperforms glossy ads.  
- Niche / polarizing “anti-bot dating” positioning beats generic romance ads.  
- Education content (why basic verification fails in the AI era) builds authority.  
- IRL / community / niche groups still convert trust better than pure cold ads.

### Affiliate / creator rules that matter
- **FTC:** clear conspicuous disclosure every placement (`#ad` / “affiliate link”) **before** the click; video = on-screen + spoken; pin comment where relevant.  
- Code/link alone is **not** disclosure.  
- Scale via many creators + competitive % + leaderboard; repurpose winners as ads.  
- No guaranteed-dates claims, no fake testimonials, no brand-bid on search (our affiliate rules already say this).

### Channel fit for this product
| Channel | Role | Primary CTA |
|---------|------|-------------|
| **Meta (FB/IG/Reels/WhatsApp)** | paid + organic trust + creator seeding | `/go/josh` or affiliate links · Royalty to warm |
| **YouTube (Shorts + long)** | authority + SEO + reviews | membership + Bot-Shield explainers |
| **X** | real-time bot/catfish discourse · founder ops voice optional | product one-liners + affiliate recruit |
| **TikTok** | discovery / POV skits (if account exists) | same as Reels |
| **Email / SMS / warm DM** | highest ROI for Royalty $2,500 | Square Royalty link |

---

## 3. Agent lane assignments (no AI hierarchy — Joshua assigns)

### MANUS — Meta platforms (Facebook, Instagram, WhatsApp, Threads if used)
**Own:** Meta organic + ads + creator seeding on IG/FB.

**Ship this week**
1. IG/FB profile bio → `https://youandinotai.com/go/josh`  
2. 14 Reels/short scripts from themes below (caption includes disclosure when affiliate).  
3. Warm Story series: 5 frames → Royalty / annual / verify $1.  
4. If ads budget exists **and Joshua approves spend**: 2 ad sets only  
   - A: women 25–44 interest dating-safety / catfish education → Bot-Shield + Founding  
   - B: lookalike/warm engagers → annual + Royalty  
5. Seed 20 IG creators (dating/safety/advice) with affiliate apply link.  
6. WhatsApp/broadcast to personal network: Royalty close scripts A01–A10 from outreach pack.

**Creative themes (product-only)**
- “Every profile verified before it can message”  
- “Bots made dating loud. This is quiet.”  
- Bot-or-Not style hooks → landing membership  
- Safety pages exist (link safety.html) without charity framing  
- Side-by-side: fake vibe vs verified human product

**Forbidden:** charity/kids %, token/APY, AI-company partner claims, founder fame packaging.

**Success metric:** clicks to `/go/josh` + Square checkouts attributed that week.

---

### GEMINI — YouTube (Shorts + long-form)
**Own:** YouTube channel strategy, scripts, thumbnails direction, SEO titles.

**Ship this week**
1. Channel about + default link: membership + `/go/josh`  
2. **10 Shorts** (15–35s) batch:
   - Why dating apps feel fake in 2026  
   - What “verified before message” means  
   - $1 Bot-Shield in plain English  
   - Royalty vs monthly (product SKUs, not equity)  
   - Affiliate program explainer for creators (with #ad demo)  
3. **2 long-form (6–10 min)**
   - “How YouAndINotAI keeps bots out” (product walkthrough, no secrets)  
   - “Honest pricing” membership tiers + Member Council  
4. Titles/thumbnails: curiosity + trust, not thirst-trap scam energy.  
5. Description template always includes: site, Square tiers summary, affiliate page, legal links, disclosure line if any paid rel.

**Success metric:** Shorts views → link CTR → checkout starts.

---

### CLAUDE — Product/code/security/copy QA (on-demand lead when Joshua assigns)
**Own:** keep rails green; harden what money touches; stop doctrine drift in PRs.

**Ship this week**
1. Confirm T5500 `:3200` still serves `/affiliate` `/dao` `/go/*` after any deploy.  
2. Wire affiliate apply off pure mailto when ready (API + rate limit + ticket) — don’t break staged honesty.  
3. Server-side `/go/:slug` registry + ledger stub (IDs only).  
4. Vocab gate in CI for customer paths (donate/charity/etc. = fail).  
5. Review any Manus/Gemini copy before it hits ads if Joshua asks.  
6. No OmniRoute/provider-key drift; no second payment processor on dating.

**Success metric:** zero broken money URLs · zero surface-rule regressions.

---

### GROK / HERMES (this lane) — X + coordination + cash sprint ops
**Own:** X research, repo hygiene, outreach pack, T5500 SSH deploys when needed, handoffs.

**Done this session**
- Live affiliate + dao + go links on production  
- Outreach pack 100 blocks  
- Owner private treasury doctrine saved (internal)  
- X research folded into this handoff  
- Repo cash-sprint artifacts committed/pushed on `main`

**Ongoing**
- X posts from outreach section D (disclosure always)  
- Affiliate recruit threads  
- Re-validate public URLs after deploys

---

## 4. Content batch seeds (all agents may reuse)

**One-liners**
- Real humans only. Verified before messaging.  
- Dating without the bot noise.  
- Membership via Square. Start at $1 verify.  
- Creators: up to 50% of first payment — apply at /affiliate/

**Always-on links**
- Product: https://youandinotai.com/  
- Tracked: https://youandinotai.com/go/josh  
- Affiliate: https://youandinotai.com/affiliate/  
- Council: https://youandinotai.com/dao/

**Disclosure stamps**
- `#ad`  
- `Affiliate link — I may earn if you subscribe`  
- `Paid partnership with YouAndINotAI` (only if true paid deal)

---

## 5. What is NOT the job this week
- Token DAOs, staking APY, investor seats, Base contracts  
- Rebuilding payment processors  
- Re-testing Square charges “to be sure” (closed)  
- Mixing ai-solutions.store Stripe into dating checkout  
- Public kids-floor / tax % storytelling  

---

## 6. Definition of done for the $5k goal
Square dashboard shows **≥ $5,000** completed payment volume (any mix of live SKUs).  
Until then: goal **incomplete**. Rails can be green while cash is still zero.

---

## 7. File index for agents

| Path | Why |
|------|-----|
| `briefings/AGENT-PLATFORM-HANDOFF-2026-07-18.md` | this file |
| `content/outreach/CASH-SPRINT-5K-OUTREACH-PACK-2026-07-18.md` | send copy |
| `briefings/OWNER-PRIVATE-TREASURY-DOCTRINE-2026-07-18.md` | internal money doctrine |
| `briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md` | public copy law |
| `_deploy/youandinotai/affiliate/` `dao/` `go/` legal html | static deploy pack |
| `AGENTS.md` | operating rules |

**Manus:** start §3 MANUS.  
**Gemini:** start §3 GEMINI.  
**Claude:** start §3 CLAUDE.  
**All:** read §1 links before creating assets.
