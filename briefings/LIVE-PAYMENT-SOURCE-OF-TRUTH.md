# Live Payment Source Of Truth

Updated: 2026-03-10

Scope: live payment truth for `C:\ANTIGRAVITY` only.

## Authoritative Read Order

When payment questions come up, check these in order before using pasted chat history, PR emails, or exported folders:

1. `C:\ANTIGRAVITY\youandinotai-api\app\routers\verify.py`
2. `C:\ANTIGRAVITY\youandinotai-api\app\routers\webhooks.py`
3. `C:\ANTIGRAVITY\youandinotai-api\app\config.py`
4. `C:\ANTIGRAVITY\youandinotai-api\app\routers\health.py`
5. `C:\ANTIGRAVITY\youandinotai\src\App.tsx`
6. `C:\ANTIGRAVITY\square_catalog.json`

If a claim is not grounded in the files above, treat it as unverified until re-checked.

## Current Live Truth

- Live repo root: `C:\ANTIGRAVITY`
- Live git truth: `origin/main`
- Confirmed live payment rail for YouAndINotAI: Square
- Confirmed live backend verification path: Square checkout plus Square webhook
- Confirmed live receipt evidence so far: the March 5, 2026 $1 Square Bot-Shield charge path worked
- Square merchant settings were re-checked live from T5500 on 2026-03-10:
  - Apple Pay enabled
  - Google Pay enabled
  - Afterpay/Clearpay disabled
  - Cash App Pay not configured in the merchant-settings response
- Apple Pay / Google Pay remain unproven as receipt evidence until a real wallet receipt is located

## Live Code Evidence

### Backend

- `youandinotai-api/app/config.py`
  - Stripe settings are commented as removed.
  - Active runtime settings now include endpoint-specific Square webhook config (`square_payment_webhook_*`, `square_booking_webhook_*`) with the legacy single webhook fields kept only as fallback.
  - Dynamic Bot-Shield checkout requires `square_access_token`, `square_location_id`, and `app_url`.

- `youandinotai-api/app/routers/verify.py`
  - Declares Square as the sole payment processor.
  - Prefers a per-user Square Checkout API payment link for Bot-Shield.
  - Signs a checkout reference that binds `user_id`, `event_id`, and tier into the Square order note/reference.
  - Falls back to the static Bot-Shield payment link only when live Square API credentials are missing.
  - `/verify/confirm` requires both a passed liveness event and a completed payment event.

- `youandinotai-api/app/routers/webhooks.py`
  - Implements `POST /webhooks/square-payment`.
  - Verifies the Square payment and booking webhook signatures against endpoint-specific URL/key settings.
  - Resolves the user from the signed Square checkout reference before falling back to Square customer ID or buyer email.
  - Creates a completed `VerificationEvent` for payments and only promotes verification once liveness and payment both exist.
  - Uses canonical tier inference that fails closed on stale catalog-only plan names like Basic/Premium/Elite monthly subscriptions.

- `youandinotai-api/app/routers/health.py`
  - Marks Square health as ready only when the payment link is present and, when signature checking is enabled, the Square signature key and notification URL are also present.

### Frontend

- `youandinotai/src/App.tsx`
  - Bot-Shield: `https://square.link/u/Qc5mxUy7`
  - Founding Member: `https://square.link/u/cxwjcn0s`
  - 3-Month Founder: `https://square.link/u/oY7qEfRM`
  - 12-Month Founder: `https://square.link/u/6GHpbvvl`
  - Royalty Card: `https://square.link/u/CafhorUS`

- `youandinotai/src/components/MerchStore.tsx`
  - Merch storefront link: `https://square.link/u/wjJfoKhF`

## Known Identity-Binding Reality

The current technical question is not whether Square can charge $1.

That is already proven.

The real operational dependency is clean identity binding:

- the verification flow now prefers a signed checkout reference embedded into the Square checkout order and payment note
- the payment webhook resolves that signed reference before trying customer ID or buyer email fallback
- user verification is no longer supposed to activate from payment alone; the webhook should only promote once both liveness and payment exist

When auditing future payment bugs, check identity correlation before questioning the Square rail itself.

## Current Payment Method Truth

- Bot-Shield is still the easiest payment path: card entry works by default in Square-hosted checkout.
- Apple Pay is currently enabled in the live Square merchant settings.
- Google Pay is currently enabled in the live Square merchant settings.
- Cash App Pay is not configured in the current merchant-settings response, so do not promise it in user-facing copy.
- Afterpay/Clearpay is currently disabled in the live Square merchant settings, so do not promise it in user-facing copy.
- Apple Pay / Google Pay remain enabled-setting evidence, not receipt evidence.

## T5500 Runtime Reality

- `T5500` is reachable over SSH.
- `C:\DateApp` is not present on `T5500`.
- `C:\ANTIGRAVITY\.env` on `T5500` contains a valid Square access token and location ID, but not the checkout-link or webhook env keys.
- `C:\ANTIGRAVITY\youandinotai-api\docker-compose.yml` on `T5500` was still carrying stale Stripe-era environment wiring when re-checked on 2026-03-10.
- Docker was not running on `T5500` during that check, so stale Docker files there were not the active live payment runtime.

## `square_catalog.json` Use Rules

`C:\ANTIGRAVITY\square_catalog.json` is useful, but it is not the first source to consult for live app truth.

Use it for:

- Square catalog inventory discovery
- finding additional Square products or plans already present in the account
- recovering product IDs, plan names, and hidden links for later evaluation

Do not use it alone for:

- current app checkout truth
- current verification truth
- deciding which links are actually exposed in the live UI

Important findings currently visible in the catalog:

- multiple older OnlineRecycle items and legacy wording exist there
- a weekly subscription link appears there: `https://square.link/u/cic2fnIG`
- monthly plan objects also exist there:
  - Basic Monthly Subscription
  - Premium Monthly Subscription
  - Elite Monthly Subscription

Those catalog entries are inventory evidence, not proof that the current live YouAndINotAI frontend is using them.

## Historical Or Recovery Only

These are not live payment truth unless re-promoted into the live codebase:

- `C:\ANTIGRAVITY\ClawX\src\_manus-export\ai-solutions-store\paymentwall.service.ts`
- old PR review emails
- old Copilot comments
- exported or retired folders under `ClawX`

The Paymentwall file is real and may be mined for recovery ideas, but it is not live payment wiring.

## Operational Answers To Reuse

- "Does the repo still use Stripe for live YouAndINotAI verification?"
  - No. Live backend code is Square-based.

- "Is Square currently confirmed live?"
  - Yes for the charge path and live code wiring.

- "Is Google Pay confirmed?"
  - No. Not until the Google Pay receipt is located.

- "Do we have payment data saved locally?"
  - Yes. The live code paths, the live frontend links, and the Square catalog snapshot are all present in `C:\ANTIGRAVITY`.

## Future No-Drift Rule

Before answering any payment architecture question:

1. read this file
2. re-open the live backend payment files
3. re-open the live frontend payment links
4. only then consult Square catalog or historical recovery files

If there is any conflict, the live backend and live frontend files win.
