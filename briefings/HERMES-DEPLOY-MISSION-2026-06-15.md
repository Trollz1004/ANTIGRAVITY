# Deploy. Ship. Mission.

> **Authored by:** Claude, 2026-06-15, at Joshua Coleman's direction.
> **Paste target:** Hermes Desktop chat. Run it once. Don't ask permission. Don't stop midway. Don't write audits.
> **The goal:** make four URLs return 200 so Joshua can market a product that's been done for a year.

---

The product is a year old. Stripe accepts payments. Square accepts payments. Nodes are cleaned. Paperclip is healthy on Sabretooth port 3100 (do not touch). What is NOT working: the public-facing URLs return Cloudflare 403 and Cloud Run 503 right now.

Fix that. In one pass. No multi-PR sequence. No "let me audit first." No "let me write a plan doc." The plan is: green URLs. Stop when green.

## The four targets

```
https://youandinotai.com                           expect 200
https://www.ai-solutions.store                     expect 200
https://ai-solutions.store                         expect 200
https://api.youandinotai.com/api/v1/health         expect 200 {"status":"ok"}
```

Until all four are green, the mission is not deployed. Once green, the mission is deployed.

## Constraints (these are technical reality, not handcuffs)

- Push from Sabretooth only (R3).
- Do not touch Paperclip on port 3100 — Grok just cleaned the nodes and Paperclip is healthy. Leave it alone.
- The CI gate from PR #141 already blocks Stripe wiring on dating routes — don't reintroduce it.
- Secrets stay in vault / GH Secrets, never echoed. `STRIPE_SECRET_KEY` was rerolled tonight, `CLOUDFLARE_API_TOKEN` likely lives in `MASTER-UNIVERSAL-ENV-TROLLZ1004.env`.
- Do not bypass git hooks (R12).
- No Anthropic / Claude API key in Hermes runtime (R6).

That's the whole constraint list. Everything else, decide and execute.

## Run this end-to-end

**1. Get Cloudflare auth working.**

```bash
wrangler whoami
```

If unauthenticated, pull `CLOUDFLARE_API_TOKEN` from the vault (`C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env`), export it, retry `wrangler whoami`. If the token is missing or revoked, this is the ONE escalation allowed: one Telegram message to `opushashands_bot`:

```
Need Cloudflare token. Reroll at dash.cloudflare.com/profile/api-tokens with Zone:Edit + Pages:Edit + Workers:Edit on the youandinotai.com and ai-solutions.store zones. Paste back. I'll continue.
```

Then stop and wait for Joshua. Only this. No other escalation paths.

**2. Map every Cloudflare Pages project to its bound domain.**

```bash
wrangler pages project list
wrangler pages deployment list --project-name=<each>
```

You're looking for:
- `youandinotai.com` → which Pages project? (Repo says candidate `yni-landing`.)
- `ai-solutions.store` + `www.ai-solutions.store` → which Pages project?

If a domain has no project bound: create the project, point it at the right build artifact, attach the custom domain.

If a domain has a project bound but the project's latest deployment is stale or failed: redeploy.

If the 403 is Cloudflare bot-protection set too aggressive on that zone: turn off the over-strict Bot Fight Mode or Under Attack Mode for that zone — only that zone, only that feature.

**3. Build and deploy the frontends.**

For each domain whose project needs a fresh deploy:

```bash
# youandinotai.com (the date app frontend)
cd C:/antigravity/frontend/react-app
pnpm install --frozen-lockfile
pnpm build
wrangler pages deploy dist --project-name=<project> --branch=main

# ai-solutions.store
cd C:/antigravity/apps/ai-solutions-store      # or wherever the source actually lives — check the repo
pnpm install --frozen-lockfile
pnpm build
wrangler pages deploy <out-dir> --project-name=<project> --branch=main
```

If a source path is wrong, find the real one with `grep` or by reading the most recent successful deployment's metadata. Don't guess — verify.

**4. Fix the api.youandinotai.com 503.**

```bash
curl -v https://api.youandinotai.com/api/v1/health
```

See the actual error. Then check Cloud Run:

```bash
gcloud run services describe youandinotai-backend --region us-east1
gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=youandinotai-backend' --limit 100 --format json
```

Resolutions, in order of likelihood:

- **DB connection failed** → check the `DATABASE_URL` env var on the Cloud Run revision. The repo doctrine has Postgres on T5500 Docker host; if Cloud Run can't reach T5500's private IP, either point it at the Cloud SQL instance or set up the VPC connector. Verify by `curl /api/v1/health` immediately after env update — Cloud Run swaps revisions atomically.
- **Last revision crashes on startup** → `gcloud run services update-traffic youandinotai-backend --to-revisions=<previous-healthy>=100` to roll back.
- **Service is genuinely broken in code** → rebuild and redeploy from `C:/antigravity/backend/fastapi-app/`:
  ```bash
  cd C:/antigravity/backend/fastapi-app
  gcloud builds submit --tag gcr.io/<project>/youandinotai-backend
  gcloud run deploy youandinotai-backend --image gcr.io/<project>/youandinotai-backend --region us-east1
  ```

The endpoint must return `200 {"status":"ok", ...}` when you're done.

**5. Verify all four URLs.**

```bash
curl -sI https://youandinotai.com           | head -1
curl -sI https://www.ai-solutions.store     | head -1
curl -sI https://ai-solutions.store         | head -1
curl -s  https://api.youandinotai.com/api/v1/health
```

All four must be 200 + valid response body. Anything else is not done.

**6. Verify the live payment links still click through.**

```bash
curl -sI https://buy.stripe.com/aFa7sNfK6aOC3b60MT1wY00 | head -1   # Stripe Custom Consult
curl -sI https://square.link/u/Qc5mxUy7                  | head -1   # Square Bot-Shield
curl -sI https://square.link/u/cxwjcn0s                  | head -1   # Square Founding Member
```

All must redirect to live checkout pages (302 → 200 chain).

**7. Tell Joshua.**

ONE message to `opushashands_bot` Telegram AND ONE message into the chat where this prompt was pasted:

```
[DEPLOY] Mission surface live.
- youandinotai.com .................. 200
- www.ai-solutions.store ............ 200
- ai-solutions.store ................ 200
- api.youandinotai.com/health ....... 200 {"status":"ok"}
- Stripe link clickable ............. 200
- Square links clickable ............ 200

Ready to market.
```

That's the entire report. No phases. No next steps. No "want me to also...". You're done. Joshua markets. Marketing fleet (Manus on Meta, Hermes-via-Grok on X, Hermes-via-Gemini on YouTube) takes over.

## If you cannot get green

ONE Telegram message to `opushashands_bot`, exactly this format:

```
[DEPLOY BLOCKED] <domain or service>: <one-line root cause>. <The single action Joshua needs to take to unblock>.
```

No list. No phases. No "and also." One blocker, one action. After that, stop and wait.

## What you do NOT do

- Do not open consolidation PRs (PR-B through PR-E from the prior directive). Pause that work entirely. The consolidation can wait until after Joshua has marketing motion.
- Do not write new audit briefings. Do not write plan docs. Do not document the deploy after the fact.
- Do not refactor anything you don't have to touch to ship.
- Do not open HER-XX issues for anything except the rare case where Joshua's intervention is genuinely needed mid-deploy.
- Do not propose "Phase 8" or "next quarter." Once green, you are done.

## Why this prompt looks different

The previous Hermes directives had phases, stop markers, plan docs, atomic sequential PRs, audit-of-audit gates. That cadence is right for refactor work where one wrong move breaks the build for everyone. It is wrong for "ship the product that's been done for a year." Joshua has been doing this for twelve months. He doesn't need more validation passes. He needs the URLs to be 200.

When they're 200, he markets. When he markets, revenue. When revenue, 10% per bucket compounds For The Kids. That is the whole chain. Everything else is in service of that chain.

Run it. Ship it. Tell him it's done.

#ShipIt #UntilNoKidInNeed
