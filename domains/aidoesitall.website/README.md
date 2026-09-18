# aidoesitall.website

No code folder here yet — this domain has no dedicated app in this repo today.
What is known, from `docs/ops/DNS-NAMESERVER-PLAN.md` (live-verified 2026-09-03)
and `infra/cloudflare/aidoesitall-api-guard/`:

- **Apex and `www`** are on Cloudflare (nameserver pair `april`/`keenan`,
  the same pair as `ai-solutions.store`) and **VERIFIED** live: HTTP 302 to
  `https://www.ai-solutions.store/`. This is working as intended, not a
  misconfiguration.
- **`api.aidoesitall.website`** is routed to a Cloudflare Worker
  (`infra/cloudflare/aidoesitall-api-guard`, `wrangler.jsonc` route
  `api.aidoesitall.website/*`).
- **`dashboard.aidoesitall.website`** is named in the repo root `README.md`
  as "Customer Support" — authenticated access, operator workspace.
- A disabled Cloudflare redirect rule that must stay disabled: **UNVERIFIED**
  — no rule of that description was found in `CLAUDE.md` or the docs checked
  for this README; do not assume one exists or act on it without confirming
  with Joshua first.
- The domain's underlying purpose beyond the redirect is explicitly called
  **UNVERIFIED** in `docs/ops/DNS-NAMESERVER-PLAN.md` ("ask Joshua"), even
  though the root `README.md` separately labels the public surface
  "Business Exchange" — a product gateway for services, referrals, and
  business sales. Both statements are recorded here as given; they were not
  reconciled by this task.
- The sibling domains `aidoesitall.info`, `.online`, and `.store` are
  **SERVFAIL** (no live Cloudflare zone) as of the same 2026-09-03 check —
  only `.website` currently resolves.
