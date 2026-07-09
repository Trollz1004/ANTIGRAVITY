# Square Sandbox Payment Verification - 2026-07-09

Purpose: stop wasting live charges while payment/webhook routing is being fixed.

## Rule

Use Square Sandbox first for new payment and webhook verification. Do not use a
live $1 charge as the first proof step when API routing, webhook routing, or
ports are still being validated.

## Current safe order

1. Confirm API truth:
   - T5500 local API: `http://127.0.0.1:8000/api/v1/health`
   - Public API: `https://api.youandinotai.com/api/v1/health`
   - Both must return JSON, not HTML.
2. Confirm `:3000` is not being used as date-app API truth:
   - `http://127.0.0.1:3000/api/v1/health` may be Hermes Workspace or a frontend.
   - If it returns HTML, it is not API proof.
   - If it returns date-app API JSON, treat it as a port collision.
3. Run a Square Sandbox payment probe.
4. Check sandbox webhook delivery/processing.
5. Only then run one live production charge if Joshua approves.

## Square Sandbox values

Official Square Sandbox docs list:

- Browser/Web Payments UI card success: `4111 1111 1111 1111`
- CVV success value: `111`
- Server-side `CreatePayment` success `source_id`: `cnon:card-nonce-ok`
- ACH/Plaid sandbox credentials: `user_good` / `pass_good`
- Server-side ACH `CreatePayment` success `source_id`: `bnon:bank-nonce-ok`

Use `cnon:card-nonce-ok` for automated backend sandbox probes so nobody has to
retype card numbers during ops verification.

Use ACH/Plaid sandbox testing as the lower-card-risk lane for high-ticket or
business flows. It is useful for Business Exchange, OnlineRecycle, expensive
plans, and future bank-linked verification, but it should not block the simpler
Square card checkout path for ordinary membership/verification purchases.

## Probe command

Dry run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\payments\Invoke-SquareSandboxPaymentProbe.ps1 -Lane date-app
```

ACH/Plaid dry run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\payments\Invoke-SquareSandboxPaymentProbe.ps1 -Lane business-exchange -PaymentMethod ach
```

Execute after sandbox env vars are loaded in the current process:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\payments\Invoke-SquareSandboxPaymentProbe.ps1 -Lane date-app -Execute
```

ACH/Plaid execute:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\payments\Invoke-SquareSandboxPaymentProbe.ps1 -Lane business-exchange -PaymentMethod ach -Execute
```

Required env vars:

```text
SQUARE_SANDBOX_ACCESS_TOKEN
SQUARE_SANDBOX_LOCATION_ID
```

Optional env/config:

```text
SQUARE_API_VERSION
```

## Evidence location

Sandbox probe artifacts are written under:

```text
C:\antigravity\ops\mission-control\payment-sandbox-proofs\
```

Artifacts are redacted. They hash payment IDs, order IDs, receipt values, and
location IDs. They do not print access tokens, card numbers, buyer details, raw
receipt URLs, or raw payment IDs.

## What sandbox proves

Sandbox proof can prove:

- Square sandbox credentials work.
- Square accepts the backend payment request.
- Card or ACH/Plaid method formatting is valid for the selected lane.
- Amount/currency/reference formatting is valid.
- A payment object can be created without spending real money.

Sandbox proof does not prove:

- Production Square payment completion.
- Production webhook delivery.
- External customer revenue.
- A real live receipt.

Live payment proof still follows:

```text
briefings\LIVE-PAYMENT-SOURCE-OF-TRUTH.md
briefings\FUTURE-EXTERNAL-CUSTOMER-PAYMENT-EVIDENCE-GUARDRAIL.md
```
