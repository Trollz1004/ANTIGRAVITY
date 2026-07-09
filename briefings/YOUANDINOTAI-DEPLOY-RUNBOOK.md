# YouAndINotAI Deploy Runbook - 2026-06-22

## Active Host Map

- Frontend: Cloudflare Pages project `youandinotai`
- Backend: T5500 self-host FastAPI stack
- Public domain: `youandinotai.com`
- API domain: `api.youandinotai.com`
- Payment rail: Square production checkout

## Frontend Build

```powershell
Set-Location C:\antigravity\frontend\react-app
npm run build
```

Cloudflare Pages direct-upload artifact:

```text
C:\antigravity\frontend\react-app\dist
```

`frontend\react-app\wrangler.toml` sets `pages_build_output_dir = "dist"`.
`apps\youandinotai-static` is a legacy snapshot and should not be redeployed
unless it is deliberately regenerated from the current source first.

## Backend Health

Expected public health endpoint:

```text
https://api.youandinotai.com/api/v1/health
```

Expected local T5500 origin:

```text
http://127.0.0.1:<configured-port>/api/v1/health
```

Call the backend green only after local T5500 health and public Cloudflare routing both return
valid JSON.

Current local API truth is T5500 `http://127.0.0.1:8000/api/v1/health`.
Do not use `http://127.0.0.1:3000/api/v1/health` as date-app API proof.
Port `3000` may be Hermes Workspace or a frontend dev server and can return
HTML for API-looking paths. If `:3000/api/v1/health` returns date-app API JSON,
treat that as a port collision that must be fixed before payment verification.

## Deployment Rules

- T5500 owns Wrangler and Cloudflare tunnel work for this app.
- Sabretooth may edit and push repo code.
- 9020 is a dev/support checkout.
- Do not expose secrets in logs or docs.
- Do not deploy public copy that goes beyond product value.

## Checkout Verification

Sandbox-first rule:

```text
briefings\SQUARE-SANDBOX-PAYMENT-VERIFICATION-2026-07-09.md
```

Use the Square Sandbox probe before spending another live dollar when webhook or
API routing is still being validated.

1. Load `https://youandinotai.com`.
2. Start membership or verification checkout.
3. Run the Square Sandbox probe and confirm sandbox payment evidence is created.
4. Confirm sandbox webhook delivery/processing where configured.
5. Complete a real Square production payment only after Joshua approves.
6. Confirm Square shows the transaction.
7. Confirm the app records or reflects the purchase state.

Report the exact failing step if checkout is not green.
