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
- Confirmed live backend verification path: Square payment link plus Square webhook
- Confirmed live receipt evidence so far: the March 5, 2026 $1 Square Bot-Shield charge path worked
- Google Pay status: still separate and unproven until a Google Pay receipt is located

## Live Code Evidence

### Backend

- `youandinotai-api/app/config.py`
  - Stripe settings are commented as removed.
  - Active runtime settings are `square_access_token`, `square_bot_shield_payment_link`, `square_subscription_payment_link`, `square_webhook_signature_key`, `square_webhook_notification_url`, and `square_webhook_verify_signature`.

- `youandinotai-api/app/routers/verify.py`
  - Declares Square as the sole payment processor.
  - Creates the Bot-Shield checkout URL from `square_bot_shield_payment_link`.
  - Appends `user_id` and `event_id` query params to the checkout URL.
  - `/verify/confirm` requires both a passed liveness event and a completed payment event.

- `youandinotai-api/app/routers/webhooks.py`
  - Implements `POST /webhooks/square-payment`.
  - Verifies the Square webhook signature.
  - Resolves the user from Square customer ID or buyer email.
  - Creates a completed `VerificationEvent` for payments.
  - Sets `user.bot_shield_verified = True` for Bot-Shield and Royalty flows.

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

- the verification flow appends `user_id` and `event_id` to the Square checkout URL
- the webhook currently resolves users from Square customer ID or buyer email
- if Square does not reliably preserve enough user identity for the webhook path, verification can still drift even though payment succeeds

When auditing future payment bugs, check identity correlation before questioning the Square rail itself.

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
