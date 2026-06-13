# HER-25 Stripe Dating-Surface Audit — 2026-06-13

Context: PR-A1 for Phase 3 consolidation. Stripe is live for the AI-solutions / business-exchange side, so the dating surface must have a hard guard against any Stripe SDK or Stripe checkout path.

## Audit command summary

Ran a full tracked-source search for `stripe` across the repo, excluding generated dependency/build directories:

```bash
git grep -n -i -I 'stripe' -- . \
  ':(exclude)**/node_modules/**' \
  ':(exclude)**/.next/**' \
  ':(exclude)**/dist/**' \
  ':(exclude)**/build/**'
```

Result:

- Total matching lines: 593
- Total files: 187

The high count is mostly historical documentation, archives, backend legacy schema compatibility, AI-solutions/business-exchange references, scripts, and non-dating surfaces.

## Live wiring search

Ran targeted search for active Stripe wiring patterns:

```bash
git grep -n -I -E 'Stripe\(|stripe\.PaymentIntent\.create|stripe\.checkout\.Session\.create|stripe\.Customer\.create|STRIPE_SECRET_KEY|import stripe|js\.stripe\.com|stripe-buy-button' -- .
```

Relevant active/live-looking hits were outside the dating app surface:

- Documentation and briefings naming Stripe env vars.
- `scripts/dashboard-aidoesitall/social_engine/stripe_monitor.py` consuming `STRIPE_SECRET_KEY` for monitoring.
- `services/health-aggregator/app/probes/revenue.py` checking whether a Stripe secret exists.
- `mcp-server/.env.example` placeholder key names.

## Dating-surface search

Targets checked:

- `apps/youandinotai-frontend`
- `backend/fastapi-app/app`
- `apps/mission-control-public` if present

Targeted prohibited-pattern scan:

```bash
PATTERN='import[[:space:]]+stripe|from[[:space:]]+stripe|Stripe\(|stripe\.PaymentIntent\.create|stripe\.checkout\.Session\.create|stripe\.Customer\.create|STRIPE_SECRET_KEY|js\.stripe\.com|stripe-buy-button'
grep -RInE --exclude-dir=.next --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build --exclude-dir=.turbo --exclude-dir=coverage "$PATTERN" apps/youandinotai-frontend backend/fastapi-app/app apps/mission-control-public
```

Result: zero prohibited active wiring hits.

## Classification

### OK

- `apps/business-exchange/**` and AI-solutions/business-exchange product surfaces.
- Documentation and briefings that discuss Stripe by key name or historical context.
- Archived historical files under archive paths.
- Backend legacy database fields and compatibility migrations such as old `stripe_event_id` columns.
- Retired backend webhook endpoint `POST /api/v1/webhooks/stripe`, which returns HTTP 410 and does not initialize the Stripe SDK.

### Needs scrub

- None found in active dating-surface code.

### Unclear / future review

- Provider/monitoring scripts that reference Stripe may be legitimate for AI-solutions/business-exchange, but they should remain outside any dating route or dating deployment path.

## Change made in PR-A1

Added a GitHub Actions CI guard in `.github/workflows/ci-validate.yml`:

- Job section: `validate`
- Step name: `Block Stripe wiring on dating surfaces`
- Targets:
  - `apps/youandinotai-frontend`
  - `backend/fastapi-app/app`
  - `apps/mission-control-public` if present
- Fails CI on:
  - `import stripe`
  - `from stripe`
  - `Stripe(`
  - `stripe.PaymentIntent.create`
  - `stripe.checkout.Session.create`
  - `stripe.Customer.create`
  - `STRIPE_SECRET_KEY`
  - `js.stripe.com`
  - `stripe-buy-button`

## Verdict

HER-25 PR-A1 audit verdict: no active Stripe SDK/checkout wiring was found on the youandinotai dating surface. CI now prevents re-introduction of active Stripe wiring in dating-surface paths.
