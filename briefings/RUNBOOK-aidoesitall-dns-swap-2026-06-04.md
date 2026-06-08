# Runbook — aidoesitall.website DNS swap (off Emergent, onto Pages)

Owner: Joshua. Hermes will NOT execute this. First-party Claude can prepare the API call but Joshua merges.

## Current state (verified 2026-06-04)
- `curl -sI https://www.aidoesitall.website/` returns 308 → `aidoesitall.website/`.
- Apex serves <title>Emergent | Fullstack App</title> via Cloudflare proxy. Emergent is a third-party app builder. Not in the repo. Drift.
- Repo bundle at `_deploy/aidoesitall-www/index.html` after the swap above = OPUSHASHANDS first-party.

## Action
1. Cloudflare dashboard → `aidoesitall.website` zone → DNS.
2. Locate the apex record currently CNAMEd / A-recorded to the Emergent host.
3. Change target to `for-the-kids-contribute.pages.dev` (the existing Cloudflare Pages project per CLAUDE.md). Proxy ON. TTL Auto.
4. Same for `www` if it's not a redirect at the zone level.
5. Confirm the Pages project's Custom Domain list still includes `aidoesitall.website` and `www.aidoesitall.website`. Re-verify if either is in error state.
6. Trigger a fresh Pages deploy of `for-the-kids-contribute` against `main` so it picks up the new `_deploy/aidoesitall-www/index.html`.
7. Wait for DNS propagation (~1-5 min).
8. Verify: `curl -sI https://aidoesitall.website/` → 200 from cloudflare. `curl -s https://aidoesitall.website/ | grep -oE '<title>[^<]+</title>'` → `OPUSHASHANDS — Hermes glass house · #UntilNoKidInNeed`.
9. If verification fails: revert DNS to Emergent target (you have it noted before the swap), reopen the issue, do not retry without Opus draft.

## Rollback
- DNS revert: change CNAME/A back to the Emergent target you noted in step 2.
- Repo revert: `git revert <SHA from RUNBOOK ready file>` on a branch, PR, merge.

## Acceptance
- 200 on apex + www, title contains OPUSHASHANDS, noindex header present, Emergent string absent in body.
