# DateApp (`youandinotai.com`) — Creator Terms and Canonical Creator Link Policy (Draft)

> **STATUS: DRAFT FOR JUDGE GO-GATE — NOT PUBLISHED, NOT ADVERTISED**

This document defines the single canonical creator referral link policy and internal draft creator program terms for `youandinotai.com`. Every rule below reflects the implemented attribution and accounting behavior in `domains/youandinotai.com/frontend/src/lib/partnerAttribution.ts`, `domains/youandinotai.com/frontend/src/lib/auth.ts`, `domains/youandinotai.com/backend/app/routers/auth.py`, `domains/youandinotai.com/backend/app/revenue_allocation.py`, and `domains/youandinotai.com/backend/app/routers/metrics.py` (with payment ledger boundaries documented in `docs/PAYMENTS-TRUTH.md` and `docs/reports/affiliate-50-scout-2026-11-14.md`).

This draft is held for the Judge go-gate and is not published on any customer-facing surface or advertised externally.

The payout numbers in sections 2.2 to 2.4 (rate, $25 minimum, monthly settlement, 30-day notice) are proposals for Josh to rule on. They are not commitments until he does.

---

## 1. One Canonical Creator Link Policy

### 1.1 Single Canonical URL Format
All creator referral traffic must use the canonical query-parameter format on `youandinotai.com`:

- `https://youandinotai.com/?ref=<code>`
- `https://youandinotai.com/register?ref=<code>`

(The frontend also supports the first-party short path `https://youandinotai.com/c/<name>` where `<name>` matches `^[a-z0-9-]{3,30}$`, which stores the code into the identical browser attribution key before rendering the home route.)

### 1.2 Code Validation and Normalization Rule
In accordance with `normalizeRef()` in `domains/youandinotai.com/frontend/src/lib/partnerAttribution.ts`:

- Incoming `ref` values are trimmed of leading/trailing whitespace and normalized to lowercase.
- Normalized creator codes must match the regular expression:
  ```text
  ^[a-z0-9_-]{1,64}$
  ```
- Any empty string, string longer than 64 characters, or string containing characters outside ASCII letters, digits, underscores (`_`), and hyphens (`-`) is rejected (`null`) and ignored.
- On the backend (`domains/youandinotai.com/backend/app/schemas.py`, `domains/youandinotai.com/backend/app/models.py`, and `domains/youandinotai.com/backend/app/routers/metrics.py`), `users.referral_code` is stored as `VARCHAR(64)` and aggregated via `lower(trim(users.referral_code))`.

### 1.3 Capture and First-Touch Account Attribution
- **Browser capture:** When a visitor lands on `youandinotai.com` with a valid `?ref=<code>`, `capturePartnerId(window.location.search)` stores the normalized code in `localStorage` under the key `antigravity_partner_id`.
- **Persistence on new account creation:**
  - **Email & password registration (`POST /api/v1/auth/register`):** `Register.tsx` and `auth.ts` read the captured code from `?ref=` or `localStorage['antigravity_partner_id']`, submit it as `referral_code`, persist it to `users.referral_code` on the newly created `User` record, and clear `antigravity_partner_id` from `localStorage`.
  - **Google Sign-In (`POST /api/v1/auth/google`):** `auth.ts` (`googleLogin`) resolves the captured code via `capturePartnerId(window.location.search)`, sends `referral_code` with the Google credential payload, persists `users.referral_code` when creating a new `User` row (`routers/auth.py`), and clears `antigravity_partner_id` from `localStorage`.
- **Immutable first-touch account binding:** Attribution is recorded only when a new `User` row is created. Subsequent logins (whether via email/password or Google Sign-In on an existing account) never overwrite or modify an existing user's `users.referral_code`.

### 1.4 Prohibited Link Types
Creators and internal campaigns must never distribute or route traffic through:

1. **Raw payment processor links:** Raw `square.link` or `checkout.square.site` URLs are strictly prohibited. Direct checkout links bypass `youandinotai.com` account creation, strip or drop referral query parameters on redirect, and create unattributed payment events with no `users.referral_code`.
2. **Static `/go/*` redirect bypasses:** Legacy static HTML redirect folders (`/go/*`) and dead static landing targets (`/founding.html`, `/affiliate-links.html`) are retired and must not be shared.
3. **Unverified third-party pages or external link hubs:** External intermediate pages (including legacy `github.io` link-builder pages) that send visitors directly to payment processor checkouts instead of `https://youandinotai.com/?ref=<code>` or `https://youandinotai.com/register?ref=<code>` are prohibited.

---

## 2. Creator Program Terms (Internal Draft)

### 2.1 Audience Age Gate & FTC Disclosure Rule
- **18+ Audience Restriction:** `youandinotai.com is for adults 18 and over.` Every referred member must pass the date-of-birth and 18+ confirmation gate before an account can be created (`ensure_adult` in `domains/youandinotai.com/backend/app/routers/auth.py`). Creators must not target or market to minors.
- **Mandatory FTC Disclosure:** Every social post, video, bio link, livestream read, or written placement sharing a creator referral link must include a clear, conspicuous disclosure (such as `#ad`, `#affiliate`, or an explicit statement that the creator earns a commission from qualifying sign-ups and payments) in compliance with FTC Endorsement Guides.

### 2.2 Payout Calculation
In accordance with `GET /api/v1/metrics/affiliates` in `domains/youandinotai.com/backend/app/routers/metrics.py` and `reserve_revenue_allocation()` in `domains/youandinotai.com/backend/app/revenue_allocation.py`:

- **Rate:** **50%** of collected customer payments as the code computes it today (`owed_cents = gross_cents // 2`, before any processor fee) for accounts whose `users.referral_code` matches the creator's normalized code.
- **Eligible Ledger Rows:** A payment is eligible for creator attribution if and only if the `revenue_allocations` row is joined to a `users` row (`revenue_allocations.user_id = users.id`) with a non-empty `users.referral_code` and satisfies all three conditions:
  1. `gross_amount_cents > 0`
  2. `status = 'reserved'` (`COLLECTED_PAYMENT_ALLOCATION_STATUS = "reserved"`, recorded upon confirmed Square `COMPLETED` webhook receipt)
  3. `payer_type = 'customer'`
- **Exclusions (Zero Payout):**
  - Refunded payments (`status = 'refunded'`), voided transactions, disputed charges, and chargebacks are excluded from eligible `reserved` customer totals and earn zero payout.
  - Founder, operator, and internal test charges (`payer_type != 'customer'`, as classified in `revenue_allocation.py` and documented in `docs/PAYMENTS-TRUTH.md`) are excluded and earn zero payout.
  - Unauthenticated payments that cannot be matched to a registered `users` row with a `referral_code` earn zero payout.

### 2.3 Settlement Cadence & Minimum Threshold
- **Minimum Payout Threshold:** **$25.00 USD** (`2,500` cents) in accrued, eligible `owed_cents`.
- **Monthly Settlement Window:** Accrued balances meeting or exceeding the $25.00 USD minimum at calendar month-end are settled monthly within the **first 5 business days** following month-end.
- **Roll-Forward Rule:** Accrued balances under $25.00 USD at month-end automatically roll forward to the next calendar month until the $25.00 USD threshold is reached or program termination occurs.

### 2.4 Program Modification & Termination Notice
- **30 Days Written Notice:** If the creator program terms, payout rate, or program availability are modified or terminated, participating creators receive **30 days written notice**.
- **Full Settlement to the Cent:** All valid accrued balances earned through the end of the 30-day notice window are settled in full **to the cent** (even if the final balance at termination is below the $25.00 USD monthly roll-forward threshold).
- **Zero Clawbacks:** Paid or accrued commissions are never clawed back except for verified customer refunds, voids, payment disputes, or chargebacks on the underlying transaction.

### 2.5 Prohibited Conduct
Creators participating in the program must not engage in any of the following (violation results in immediate code deactivation and forfeiture of self-referred or fraudulent balances):

1. **Spam and Unsolicited Bulk Messaging:** Automated DM blasts, comment spam, scraped email/SMS lists, or deceptive redirect cloaking.
2. **Self-Referrals and Synthetic Activity:** Creating accounts using one's own referral code, running wash transactions, or using bots/scripts to simulate sign-ups or verifications.
3. **Fabricated Product or Financial Claims:** Misrepresenting membership features, pricing, verification mechanics, or making unsubstantiated income claims.
4. **Prohibited Mission or Medical Wording:** Using cause-based marketing language, medical/therapeutic claims, or any wording prohibited by repository policy in connection with `youandinotai.com`.
