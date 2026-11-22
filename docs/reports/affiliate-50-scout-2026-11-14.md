# Scout Report: 50% Creator Affiliate Offer on YouAndINotAI (`domains/youandinotai.com`)

**Outcome:** The date app (`domains/youandinotai.com`) captures a `?ref=<code>` URL parameter in browser `localStorage` and stores it on `users.referral_code` in PostgreSQL **only** when a member signs up with email and password on `/register`. It drops the referral code completely on Google Sign-In, does not record the referral code on payment or revenue ledger rows, has zero endpoints or pages that count sign-ups or payments per code, and has zero calculation or display of what a creator is owed. Meanwhile, several repo docs, campaign drafts, and agent skill files already state a 50 percent or 15-to-50 percent recurring payout. Nothing should be advertised until the gaps below are closed.

---

## 1. Where a Referral or Affiliate Code Enters, Where It Is Stored, and Whether It Survives Google Sign-Up and the $1 Check

### Where the code enters and how it is stored in the browser
- **URL query parameter (`?ref=<slug>`) on any React SPA page:** When the React app boots (`domains/youandinotai.com/frontend/src/main.tsx:103`), it runs `capturePartnerId(window.location.search)` (`domains/youandinotai.com/frontend/src/lib/partnerAttribution.ts:28-39`). That function reads the `ref` query parameter, trims and lowercases it, validates that it is 1 to 64 characters matching `^[A-Za-z0-9_-]+$` (`partnerAttribution.ts:12-26`), and saves it in browser `localStorage` under the key `'antigravity_partner_id'` (`partnerAttribution.ts:10,33`). Unit tests in `domains/youandinotai.com/frontend/src/lib/partnerAttribution.test.ts:1-93`, `domains/youandinotai.com/frontend/src/lib/landingCapture.test.ts:1-62`, and `domains/youandinotai.com/frontend/src/main.wiring.test.tsx:1-74` verify this `localStorage` capture across client-side navigation.
- **Sign-up form (`/register`):** There is no text input on the sign-up form where a user can type a referral code manually (`domains/youandinotai.com/frontend/src/app/pages/Register.tsx:159-353`). Instead, `Register.tsx:33` reads `const [partnerId] = useState(() => capturePartnerId(location.search))` from either `?ref=` or `localStorage['antigravity_partner_id']`. When the user submits the email/password form, `Register.tsx:63-73` passes `referralCode: partnerId` to `register()` (`domains/youandinotai.com/frontend/src/lib/auth.ts:89-119`), which sends `referral_code` in the JSON body to `POST /api/v1/auth/register` (`auth.ts:113`), and `Register.tsx:73` clears `'antigravity_partner_id'` from `localStorage`.
- **Database storage (`users.referral_code`):** In `domains/youandinotai.com/backend/app/routers/auth.py:139-150`, `POST /api/v1/auth/register` accepts `payload.referral_code` (`AuthRegisterRequest` in `domains/youandinotai.com/backend/app/schemas.py:22`, max length 64) and writes it into the PostgreSQL `users.referral_code` column (`VARCHAR(64)`, nullable, indexed via `ix_users_referral_code`, defined in `domains/youandinotai.com/backend/app/models.py:63-67`, `domains/youandinotai.com/backend/app/database.py:121,154,253`, and `domains/youandinotai.com/backend/alembic/versions/a1b2c3d4e5f6_add_referral_code_to_users.py:1-64`). Backend tests in `domains/youandinotai.com/backend/tests/test_referral_attribution.py:1-86` verify that `POST /api/v1/auth/register` persists `users.referral_code`.
- **Broken growth-engine hook inside `POST /api/v1/auth/register`:** Immediately after saving the user, `domains/youandinotai.com/backend/app/routers/auth.py:152-169` attempts to add `C:/ANTIGRAVITY/ops/growth-engine` to `sys.path` and run `from growth_engine import create_user as create_growth_user`. No `growth_engine.py` file exists in `ops/growth-engine/`, so this import always fails and logs a warning (`auth.py:167-169`). Separately, `ops/growth-engine/referral_links.py:12-43` writes `LOVE-XXXXXXXX` codes to a local SQLite file (`C:\ANTIGRAVITY\ops\growth-engine\growth.db`), which is completely disconnected from the FastAPI backend.
- **Unused `affiliate_id` script:** A standalone script at `domains/youandinotai.com/backend/add_affiliate_tracking.py:1-42` adds an `affiliate_id VARCHAR(255)` column to `users`, but `affiliate_id` is not declared in `models.py` and is never read or written anywhere in `domains/youandinotai.com/backend/app/`.
- **Broken or disconnected QR, vanity, and static redirect entry points:**
  - **QR generator (`ops/growth-engine/generate_qr_promos.py:20-23`):** Encodes `https://youandinotai.com` with no `?ref=` parameter.
  - **Static `/go/` redirect pages (`domains/youandinotai.com/frontend/public/go/index.html:1-64`, `public/go/josh/index.html:1-64`, `public/go/launch/index.html:1-64`, `public/go/partner/index.html:1-64`):** These read `?ref=` (defaulting to `josh`, `launch`, or `partner`), set a browser cookie named `yni_aff` (`lines 20-25`) that no frontend or backend code ever reads, and redirect to `/founding.html?ref=<code>&utm_source=affiliate&utm_medium=link&utm_campaign=<code>` (`lines 26-31`). However, `domains/youandinotai.com/frontend/public/founding.html` and `public/affiliate-links.html` are 0-byte empty files, and `/founding.html` is not a registered React route in `main.tsx:110-480`.
  - **PreOrder affiliate link builder (`domains/youandinotai.com/frontend/src/app/pages/PreOrder.tsx:8-9,79,174-201` and `PayMethods.tsx:263-269`):** Generates links to `https://trollz1004.github.io/youandinotai-links/?ref=<code>` (mirrored in `ops/sales/public-surface/index.html:139-159`). Those external landing pages send visitors straight to static `checkout.square.site` links with `?ref=` appended, bypassing `youandinotai.com/register` so no user account or `users.referral_code` is ever created first.
  - **Vanity URLs (`youandinotai.com/:partnerId`):** Promised in `.agents/skills/affiliate-offer-of-offers/SKILL.md:15`, but no `:partnerId` route exists in `domains/youandinotai.com/frontend/src/main.tsx:110-480`.

### Does the referral code survive Google sign-up?
- **No.** `domains/youandinotai.com/frontend/src/components/auth/GoogleSignInButton.tsx:33` and `GoogleSignInButton.tsx:126` call `googleLogin()` in `domains/youandinotai.com/frontend/src/lib/auth.ts:58-71`, which sends only `id_token` (and optional `date_of_birth`) to `POST /api/v1/auth/google`. Neither `GoogleSignInButton.tsx` nor `googleLogin()` reads `getStoredPartnerId()` from `localStorage`. On the backend, `GoogleLoginRequest` (`domains/youandinotai.com/backend/app/schemas.py:46-48`) has no `referral_code` field, and `google_login` (`domains/youandinotai.com/backend/app/routers/auth.py:235-288`) creates the new `User` row at lines 261-269 without setting `referral_code`. Every Google sign-up saves `referral_code = NULL`. (The same is true for `POST /api/v1/auth/beta-access` in `routers/auth.py:291-356` and legacy `POST /api/v1/users/register` in `routers/users.py:44-123`.)

### Does the referral code survive the $1 Bot-Shield check?
- **Yes, if the member registered with email and password first; no, if they signed up with Google or paid through an external static Square link.** Once `users.referral_code` is stored on the `users` row during email/password registration (`routers/auth.py:146`), the $1 Bot-Shield challenge, submission, Square checkout link generation, Square webhook handler, and confirmation endpoints (`domains/youandinotai.com/backend/app/routers/verify.py:118-458` and `domains/youandinotai.com/backend/app/routers/webhooks.py:552-655`) update `users.bot_shield_verified`, `users.bot_shield_paid`, and `users.verification_payment_id` on that same `User` row without overwriting `users.referral_code`.

---

## 2. Whether a Paid Event ($1 Check, Subscription, Royalty Purchase) Is Ever Tied Back to the Code That Brought the Member

- **Paid events are never stamped with `referral_code` directly, and no affiliate commission share is ever computed; they can only be linked back to `users.referral_code` indirectly by joining on `user_id` when the payment is attached to an authenticated user.**
- **Checkout creation (`verify.py` and `billing.py`):**
  - When a logged-in member starts the $1 Bot-Shield check (`POST /api/v1/verify/challenge` or `/verify/checkout` in `domains/youandinotai.com/backend/app/routers/verify.py:118-145,210-257`) or starts a Founding Member ($14.99/mo), 3-Month ($39.99), 12-Month ($99.99), or Royalty Card ($2,500) checkout (`POST /api/v1/billing/checkout-link` in `domains/youandinotai.com/backend/app/routers/billing.py:109-195`), the backend creates a `VerificationEvent` row (`domains/youandinotai.com/backend/app/models.py:456-486`) with `user_id=user.id` and signs a `checkout_ref` token via `build_checkout_reference()` (`domains/youandinotai.com/backend/app/payment_truth.py:132-156`).
  - `build_checkout_reference()` (`payment_truth.py:144-149`) packs only `u` (`user_id`), `e` (`event_id`), `t` (`tier`), and `iat`. It does not include `referral_code`.
  - `VerificationEvent` (`models.py:456-486`) has `user_id` (foreign key to `users.id`), `tier`, `amount_cents`, `status`, `payment_id`, and `order_id`, but no `referral_code` column.
- **Webhook processing and revenue ledger (`webhooks.py` and `revenue_allocation.py`):**
  - When Square sends a `payment.created` or `payment.updated` (`COMPLETED`) webhook to `POST /api/v1/webhooks/square` or `/webhooks/square-payment` (`domains/youandinotai.com/backend/app/routers/webhooks.py:498-682`), `_process_square_payment_event` resolves the `User` row from the signed `checkout_ref` (`user_id` and `event_id`), or falls back to `square_customer_id` or `buyer_email_address` (`webhooks.py:529-545`).
  - At `domains/youandinotai.com/backend/app/routers/webhooks.py:565-572`, the webhook handler calls `reserve_revenue_allocation()` (`domains/youandinotai.com/backend/app/revenue_allocation.py:146-194`), which inserts a row into `revenue_allocations` (`domains/youandinotai.com/backend/app/models.py:252-311`) with `user_id=user.id if user else None`, `payment_tier=tier`, `gross_amount_cents=amount`, `reserve_amount_cents=0`, and `operating_amount_cents=amount` (`revenue_allocation.py:15,171-189`).
  - Neither `webhooks.py` nor `revenue_allocation.py` ever reads `user.referral_code`. `RevenueAllocation` (`models.py:252-311`) has no `referral_code`, `affiliate_code`, or `affiliate_amount_cents` column.
  - **Where the indirect link breaks:**
    1. If a customer pays through an unauthenticated static Square link (such as the links on `ops/sales/public-surface/index.html` or `domains/youandinotai.com/frontend/public/join.html`) using an email address that does not already match a row in `users`, `user` is `None` (`webhooks.py:567,665-674`), so `revenue_allocations.user_id` is saved as `NULL` and no link to any referral code exists.
    2. If the customer signed up with Google OAuth before paying, `users.referral_code` is `NULL`, so even though `revenue_allocations.user_id` points to the user, the referral code was already lost at sign-up.
    3. PayPal (`billing.py:225-315`) and Cash App (`billing.py:318-400`) create pending `VerificationEvent` rows, but `webhooks.py` has no PayPal or Cash App completion webhook handler to record a `RevenueAllocation` row.

---

## 3. Whether Anything Counts Sign-Ups or Revenue Per Code, Shows a Creator Their Numbers, or Records What Is Owed

- **Nothing in `domains/youandinotai.com` counts sign-ups per code, counts revenue per code, shows a creator their numbers, or records what is owed.**
- **What exists:**
  - `users.referral_code` sits in the `users` table (`models.py:65-67`), and `revenue_allocations.user_id` + `gross_amount_cents` + `status` sit in the `revenue_allocations` table (`models.py:252-311`).
  - `domains/youandinotai.com/backend/app/routers/metrics.py:1-181` exposes `/api/v1/metrics`, `/api/v1/metrics/impact`, `/api/v1/metrics/founding-members`, and `/api/v1/metrics/security-audit`. None of those endpoints query or group by `users.referral_code`.
  - `domains/youandinotai.com/backend/app/routers/marketing.py:1-200` has no referral or affiliate counting routes.
- **What is plainly missing:**
  1. **No sign-up counter per code:** No backend query or API endpoint runs `COUNT(users.id) GROUP BY users.referral_code`.
  2. **No payment or revenue counter per code:** No backend query or API endpoint joins `revenue_allocations` (or `verification_events`) to `users.referral_code` to count verified $1 checks, active subscriptions, royalty purchases, or net collected cents per code.
  3. **No commission or owed-balance calculation:** `revenue_allocation.py:15` hardcodes `PLATFORM_RESERVE_PERCENT = 0` and puts 100% of `gross_amount_cents` into `operating_amount_cents` (`revenue_allocation.py:100-108`). Nothing computes a 50% creator share, subtracts processor fees or refunds (`REFUNDED` status in `webhooks.py:695-720`), or tracks how much has already been paid to a creator versus what is still owed.
  4. **No creator registry:** There is no table or config mapping a `referral_code` to a creator's name, contact/payout handle, active status, or commission rate.
  5. **No creator-facing stats view and no founder owed-summary page:** There is no page or endpoint where a creator can view their own sign-ups and paid referrals, and no admin page where Josh can see one table of every creator code, their sign-ups, their net collected payments, and the dollar amount owed.

---

## 4. Every Place the Site, Blog, AI Discovery Files, or Docs Already Promise 50 Percent or Any Payout (Word for Word, With File and Line)

### A. Live Date-App Site (`domains/youandinotai.com`), Blog (`frontend/public/blog/`), and AI Discovery Files (`frontend/public/llms.txt`, `agent.json`, `guest-agent.json`, `for-ai`, `AGENTS.md`, `.well-known/agent-card.json`)
- **Zero places in `domains/youandinotai.com` (frontend, backend, blog posts, or AI discovery files) promise 50 percent or state a payout amount.**
- The only affiliate-related lines inside `domains/youandinotai.com` are disclosure and link-sharing labels:
  - `domains/youandinotai.com/frontend/public/join.html:189-190`:
    > `Product membership only. No language. Affiliate disclosures apply when sharing (#ad).`
  - `domains/youandinotai.com/frontend/src/app/pages/PreOrder.tsx:176-182`:
    > `Elite affiliate link`
    > `Share the landing with <code>?ref=</code> — never raw square short links (query stripped on redirect).`
  - `domains/youandinotai.com/frontend/src/app/pages/PayMethods.tsx:263-268`:
    > `Affiliate traffic must enter via trollz1004.github.io/youandinotai-links/?ref=CODE — never campaign on raw square.link URLs.`

### B. Architecture & Handoff Docs (`docs/` and `ops/handoffs/`)
- `docs/arch/ATTRIBUTION-PROTOCOL.md:4`:
  > `Objective: Capture and persist influencer referrals yielding 50% revenue share.`
- `docs/arch/ATTRIBUTION-PROTOCOL.md:15`:
  > `- Revenue Hook: On successful payment, calculate the 50% share and log to the Platform Fees ledger.`
- `ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md:7`:
  > `Joshua's words, so nobody softens them later: affiliate marketing at up to 50 percent`
- `ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md:17`:
  > `| Commission | **up to 50% of net subscription revenue** from every user the affiliate refers, for the **lifetime of that user's paid subscription** (renewals included) |`
- `ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md:19`:
  > `| Tiers inside "up to 50%" | 50% on the affiliate's first 20 paying referrals and on every referral after that as long as the affiliate stays active (one referral in the trailing 90 days); 30% on renewals for an inactive affiliate. Joshua can flatten this to 50% for everyone with one line; do not invent other tiers |`
- `ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md:20`:
  > `| Minimum payout | $25 accrued, paid monthly in the first 5 business days after month-end; balances under $25 roll forward |`
- `ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md:21`:
  > `| Notice rule | If the program is ever changed or ended, every affiliate gets **30 days written notice** and is **paid in full to the cent** on every accrued commission through the end of the notice window — no clawbacks except on actual refunded/charged-back charges |`
- `ops/handoffs/FABLE-HANDOFF-2026-09-29.md:23`:
  > `| Affiliate terms | up to 50% of net subscription revenue for the life of the referred subscription; the full table is in the brief and is the only version | Emergent brief section 1 |`

### C. Agent Skills (`.agents/skills/`)
- `.agents/skills/affiliate-offer-of-offers/SKILL.md:3`:
  > `description: The Super Saiyan Marketing Strategy. 50% lifetime revenue share protocol for Tier-1 influencers via custom vanity URLs.`
- `.agents/skills/affiliate-offer-of-offers/SKILL.md:14`:
  > `- **The Hook:** Standard corporate affiliate links (Amazon, Pepsi) pay a 2-5% one-time breadcrumb. We offer **50% of the subscriber's monthly fee for the lifetime of the account**.`
- `.agents/skills/affiliate-offer-of-offers/SKILL.md:23`:
  > `"Hey look at this qr code its youandinotai.com branded for real humans 50% for you if you share math sells itself see ya."`
- `.agents/skills/gemini-perpetual-wheel/SKILL.md:27`:
  > `1. **youandinotai.com (18+ Human-Verified Dating)**: Square-only checkout ($1 Bot-Shield verification + memberships) + **Link Forge ("Offer of Offers")** 50% lifetime monthly revenue share for creators via vanity URLs (youandinotai.com/:partnerId).`
- `.agents/skills/gemini-perpetual-wheel/SKILL.md:79`:
  > `> "Hey look at this qr code its youandinotai.com branded for real humans 50% for you if you share math sells itself see ya."`

### D. Campaign Directives, Marketing Inbox, and Sales HTML/Markdown Files (`ops/campaigns/`, `ops/marketing-inbox/`, `ops/sales/campaigns/`)
- `ops/campaigns/offer-of-offers/MASTER-CAMPAIGN-README.md:10`:
  > `**50% of subscriber revenue. Every month. For life.**`
- `ops/campaigns/offer-of-offers/GROK-X-DIRECTIVE.md:6`:
  > `Attack the standard "affiliate code" grift. Big creators are being scammed by corporations giving them 5% kickbacks. We are offering 50% lifetime revenue. Sell the math.`
- `ops/campaigns/offer-of-offers/GROK-X-DIRECTIVE.md:11`:
  > `3. **The Pitch:** We built a bot-shielded dating app (youandinotai). We give creators clean vanity URLs (/mkbhd). We pay you 50% of the subscriber's fee every month forever.`
- `ops/campaigns/offer-of-offers/EMERGENT-REDDIT-DIRECTIVE.md:12`:
  > `4. **The Math Drop:** Mention the creator payout. "dude the dev is giving creators 50% lifetime sub revenue to promote a bot-free app. math is wild."`
- `ops/campaigns/offer-of-offers/MUSE-META-DIRECTIVE.md:12`:
  > `4. **For Creators (B2B):** We need visuals that pitch the 50% lifetime revenue share to influencers in a way that looks like an exclusive club invite, not a corporate ad.`
- `ops/marketing-inbox/WHEEL-META-REEL-01.json:5-6`:
  > `"title": "Reel Hook: 50% Lifetime Rev-Share vs Standard Affiliate Grifts",`
  > `"body": "[0-3s] Stop promoting platforms that pay you a one-time $5 bounty and keep the subscription forever. [3-10s] YouAndINotAI.com gives creators a custom vanity URL — youandinotai.com/yourname — and 50% of every verified member's subscription every month for life. [10-15s] Scan the QR code, claim your vanity route, let the math work.",`
- `ops/marketing-inbox/FULL_CAMPAIGN_PACKAGE.md:196`:
  > `- Affiliate commission on any users you refer`
- `ops/sales/campaigns/affiliate-program.md:4`:
  > `15-50% recurring commission on every subscription referral. No caps, no expiry — as long as they pay, you earn.`
- `ops/sales/campaigns/affiliate-program.md:6`:
  > `**This is the real offer:** 1 million followers → 10k signups at $9.99 → $50k/month recurring for the creator. No brand on YouTube/FB/X matches this.`
- `ops/sales/campaigns/affiliate-program.md:11-16`:
  > `| Bronze | 1+ referrals | 15% ($1.50/subs) | $150,000/month |`
  > `| Silver | 10k+ total subs | 30% ($3/subs) | $300,000/month |`
  > `| Gold | 50k+ total subs | 40% ($4/subs) | $400,000/month |`
  > `| Platinum | 100k+ total subs | 50% ($5/subs) | $500,000/month |`
  > `**No brand pays 50%. This is the offer nobody else makes. Hard to say no.**`
- `ops/sales/campaigns/affiliate-program.md:23`:
  > `5. Monthly commissions auto-paid via Square payouts`
- `ops/sales/campaigns/affiliate-program.md:37-39`:
  > `- Monthly via Square (direct deposit or PayPal)`
  > `- Minimum payout: $5`
  > `- Auto-withdraw enabled for amounts ≥$100`
- `ops/sales/campaigns/affiliate-dashboard.html:7-9`:
  > `<meta name="description" content="Join the YouAndINotAI affiliate program. Earn 15-50% recurring commission on every subscription referral. No caps, no expiry.">`
  > `<meta property="og:title" content="YouAndINotAI Affiliate Program — Up to 50% Recurring Commission">`
  > `<meta property="og:description" content="15-50% recurring commission on dating app subscriptions. 1M followers = $500K/month potential. No other brand pays this.">`
- `ops/sales/campaigns/affiliate-dashboard.html:46`:
  > `<p class="subtitle">Earn <span class="highlight">15-50% recurring commission</span> on every dating app subscription you refer. No caps. No expiry.</p>`
- `ops/sales/campaigns/affiliate-dashboard.html:55-58`:
  > `<li class="youandinotai">✅ YouAndINotAI: <span class="highlight">15-50% of EVERY recurring subscription</span> — for life</li>`
  > `<p><strong>1 million followers → 10,000 subscribers at $9.99 = $150K-$500K/month.</strong></p>`
  > `<p>No brand on Earth pays 50% recurring. <span class="highlight">This is the offer they can't refuse.</span></p>`
- `ops/sales/campaigns/affiliate-dashboard.html:120`:
  > `<p>Get paid 15-50% of EVERY subscription for as long as they stay. No expiry. No caps.</p>`
- `ops/sales/campaigns/affiliate-dashboard.html:140`:
  > `"Pepsi pays influencers 5% one-time. Amazon pays up to 10%. But this dating app pays up to <span class="highlight">50% recurring</span> — for life. 1 million followers means $500K/month just for sharing a link. Here's why no other brand does this..."`
- `ops/sales/campaigns/affiliate-dashboard.html:154`:
  > `<p>Yes. Dating app LTV is ~$200/year per subscriber. Paying 50% commission ($50) still leaves $150 profit. No brand with this margin cap exists — the math doesn't work for product companies with thin margins.</p>`
- `ops/sales/campaigns/affiliate-dashboard.html:158`:
  > `<p>Monthly via Square direct deposit. Minimum payout: $5. Auto-withdraw for amounts ≥$100.</p>`
- `ops/sales/campaigns/affiliate-join.html:7,24,49`:
  > `<meta name="description" content="Join the YouAndINotAI affiliate program. Earn 15-50% recurring commission on dating app subscriptions.">`
  > `<p>Earn 15-50% recurring commission on every dating app subscription you refer.</p>`
  > `By submitting, you agree to the affiliate terms. Payouts via Square/PayPal monthly. Minimum $5.`
- `ops/sales/campaigns/affiliate-landing.html:44,51`:
  > `<p>Earn 15-50% recurring by sharing this page. <a href="#" onclick="showAffiliateInfo()">Learn how</a></p>`
  > `<p><strong>15-50% recurring commission</strong> on every subscription you refer.</p>`
- `ops/sales/campaigns/affiliates/tracking-config.json:8,13,18,23,47-50,72`:
  > `"description": "15% recurring on all referred subscriptions"`
  > `"description": "30% recurring on all referred subscriptions"`
  > `"description": "40% recurring on all referred subscriptions"`
  > `"description": "50% recurring on all referred subscriptions"`
  > `"schedule": "monthly", "method": "Square direct deposit or PayPal", "minimum_payout_usd": 5, "auto_withdraw_threshold_usd": 100`
  > `"note": "No brand on Earth pays 50% recurring commission. YouAndINotAI does because dating app LTV (~$200/year) supports it. Product brands with thin margins cannot match."`
- `ops/sales/campaigns/affiliate-content/affiliate-content-20260813T042834Z.md:8,11,38,40,55,61` (and identical duplicate `ops/sales/campaigns/affiliate-content/affiliate-content-20260813T160008Z.md:8,11,38,40,55,61`):
  > `"Pepsi pays influencers 5% one-time. Amazon pays up to 10%. But this dating app pays up to 50% recurring — for life. 1 million followers means $500K/month just for sharing a link. Here's why no other brand does this..."`
  > `"YouAndINotAI is a verified-human dating app. They're offering 15-50% recurring commission on every subscription you refer. That's $1.50 to $5.00 per subscriber per month — forever.`
  > `2. "Pepsi pays 5%. Amazon pays 10%. This pays 50% RECURRING. 1 video, $500K/mo potential. Link in bio. #creator #fyp #hustle"`
  > `3. "The math doesn't work for most brands — but dating apps have $200/year LTV per user. 50% commission still leaves them profit. Link in bio. #affiliatepro #money"`
  > `1/ YouAndINotAI pays 15-50% recurring commission on dating app subscriptions. No other brand on Earth pays this. Here's why...`
  > `4/ Why? Dating app LTV is ~$200/year per subscriber. 50% commission = $100 payout, $100 profit. Product brands can't do this — their margins are too thin.`

---

## 5. The Smallest Honest Version (What Is Needed So a Creator Gets a Link, Sign-Ups and Payments Are Counted Per Code, and Josh Sees One Page of What Each Creator Is Owed)

1. **One canonical link format (`https://youandinotai.com/?ref=<code>` or `https://youandinotai.com/register?ref=<code>`):** Retire or redirect `/go/*/index.html` and external `trollz1004.github.io/youandinotai-links` checkout bypasses so every referred visitor enters through the React app on `youandinotai.com`, creates an account first, and then checks out while logged in.
2. **Pass `referral_code` through Google Sign-In (`GoogleSignInButton.tsx`, `auth.ts`, `schemas.py`, `routers/auth.py`):** Read `getStoredPartnerId()` in `googleLogin()` (`domains/youandinotai.com/frontend/src/lib/auth.ts:58-71`), send `referral_code` in `POST /api/v1/auth/google`, accept `referral_code: str | None` on `GoogleLoginRequest` (`schemas.py:46-48`), store it on new `User` creation in `google_login` (`routers/auth.py:261-269`), and clear `localStorage['antigravity_partner_id']` on success. Also remove the broken `C:/ANTIGRAVITY/ops/growth-engine` import block in `routers/auth.py:152-169`.
3. **Stamp `referral_code` and `affiliate_share_cents` onto `revenue_allocations` at webhook time (`models.py`, `webhooks.py`, `revenue_allocation.py`):** Add `referral_code VARCHAR(64)` and `affiliate_share_cents INTEGER NOT NULL DEFAULT 0` to `revenue_allocations` (`models.py:252-311`). In `_process_square_payment_event` (`webhooks.py:565-572`), look up `user.referral_code` when `user` is present, pass it to `reserve_revenue_allocation()`, and record `referral_code` plus the 50% share on eligible completed rows (and zero or reverse it when `mark_revenue_allocation_refunded` runs in `webhooks.py:695-720`).
4. **One read-only backend summary endpoint (`GET /api/v1/metrics/affiliates` or admin route):** Query PostgreSQL grouped by `referral_code` to return for every non-null code:
   - `referral_code`
   - `signups_count` (`COUNT(users.id)` where `users.referral_code = code`)
   - `verified_count` (`COUNT(users.id)` where `users.referral_code = code` and `users.bot_shield_verified = true`)
   - `paid_events_count` and `gross_collected_cents` (from completed, non-refunded `revenue_allocations` tied to that `referral_code`)
   - `owed_cents` (sum of `affiliate_share_cents` on completed, non-refunded rows for that `referral_code`)
   Allow filtering by `?code=<slug>` so a creator can also check their own code's numbers honestly.
5. **One plain founder page for Josh (`/app/admin/affiliates` or a single table view):** Render the JSON from that endpoint as one plain table showing each `referral_code`, total sign-ups, verified $1 checks, paid subscriptions/purchases, gross collected, and the 50% dollar amount owed so Josh can pay creators by hand from real database rows.
