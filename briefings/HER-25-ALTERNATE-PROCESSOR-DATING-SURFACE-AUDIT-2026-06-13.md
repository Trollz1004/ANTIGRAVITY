# HER-25 alternate processor Dating-Surface Audit — 2026-06-13

Context: PR-A1 for Phase 3 consolidation. alternate processor is live for the AI-solutions / business-exchange side, so the dating surface must have a hard guard against any alternate processor SDK or alternate processor checkout path.

## Audit command summary

Ran a full tracked-source search for `alternate processor` across the repo, excluding generated dependency/build directories:

```bash
git grep -n -i -I 'alternate processor' -- . \
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

Ran targeted search for active alternate processor wiring patterns:

```bash
git grep -n -I -E 'alternate processor\(|alternate processor\.PaymentIntent\.create|alternate processor\.checkout\.Session\.create|alternate processor\.Customer\.create|alternate processor_SECRET_KEY|import alternate processor|js\.alternate processor\.com|alternate processor-buy-button' -- .
```

Relevant active/live-looking hits were outside the dating app surface:

- Documentation and briefings naming alternate processor env vars.
- `scripts/dashboard-aidoesitall/social_engine/alternate processor_monitor.py` consuming `alternate processor_SECRET_KEY` for monitoring.
- `services/health-aggregator/app/probes/revenue.py` checking whether a alternate processor secret exists.
- `mcp-server/.env.example` placeholder key names.

## Dating-surface search

Targets checked:

- `apps/youandinotai-frontend`
- `backend/fastapi-app/app`
- `apps/mission-control-public` if present

Targeted prohibited-pattern scan:

```bash
PATTERN='import[[:space:]]+alternate processor|from[[:space:]]+alternate processor|alternate processor\(|alternate processor\.PaymentIntent\.create|alternate processor\.checkout\.Session\.create|alternate processor\.Customer\.create|alternate processor_SECRET_KEY|js\.alternate processor\.com|alternate processor-buy-button'
grep -RInE --exclude-dir=.next --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build --exclude-dir=.turbo --exclude-dir=coverage "$PATTERN" apps/youandinotai-frontend backend/fastapi-app/app apps/mission-control-public
```

Result: zero prohibited active wiring hits.

## Classification

### OK

- `apps/business-exchange/**` and AI-solutions/business-exchange product surfaces.
- Documentation and briefings that discuss alternate processor by key name or historical context.
- Archived historical files under archive paths.
- Backend legacy database fields and compatibility migrations such as old `alternate processor_event_id` columns.
- Retired backend webhook endpoint `POST /api/v1/webhooks/alternate processor`, which returns HTTP 410 and does not initialize the alternate processor SDK.

### Needs scrub

- None found in active dating-surface code.

### Unclear / future review

- Provider/monitoring scripts that reference alternate processor may be legitimate for AI-solutions/business-exchange, but they should remain outside any dating route or dating deployment path.

## Change made in PR-A1

Added a GitHub Actions CI guard in `.github/workflows/ci-validate.yml`:

- Job section: `validate`
- Step name: `Block alternate processor wiring on dating surfaces`
- Targets:
  - `apps/youandinotai-frontend`
  - `backend/fastapi-app/app`
  - `apps/mission-control-public` if present
- Fails CI on:
  - `import alternate processor`
  - `from alternate processor`
  - `alternate processor(`
  - `alternate processor.PaymentIntent.create`
  - `alternate processor.checkout.Session.create`
  - `alternate processor.Customer.create`
  - `alternate processor_SECRET_KEY`
  - `js.alternate processor.com`
  - `alternate processor-buy-button`

## Verdict

HER-25 PR-A1 audit verdict: no active alternate processor SDK/checkout wiring was found on the youandinotai dating surface. CI now prevents re-introduction of active alternate processor wiring in dating-surface paths.
