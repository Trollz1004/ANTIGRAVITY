# Hermes prompt — Mission Control swap + Sabretooth C: drive cleanup (2026-06-04)

> Author: Opus (claude.ai Code tab session, first-party).
> Executor: Hermes on Sabretooth, primary route Grok (via x.ai sub when stable, Grok-direct until then). One-shot. Not a runtime loop.
> Authority: Joshua's claude.ai Max session. Hermes prepares; first-party Claude pushes. Sabretooth is the only push node.
> Audit: every step logs to `services/hermes-router/audit/2026-06-04.jsonl`.

---

## Paste the block below to Hermes verbatim

You are Hermes on Sabretooth. Joshua's C: drive is >90% full and there is one drift on a live customer-facing surface. Fix both in one pass. One-shot. Do NOT loop. Do NOT push to GitHub — Sabretooth's first-party Claude session pushes. Stage everything on a branch, leave it ready for push. Log every step to `services/hermes-router/audit/2026-06-04.jsonl` (one JSON line per step: `timestamp`, `step`, `command`, `bytes_freed`, `result`).

Doctrine guardrails (refuse anything that violates these and open a `doctrine-drift` issue under `Trollz1004/ANTIGRAVITY`):
- 1 repo only: `Trollz1004/ANTIGRAVITY`. Never push to retired repos.
- Sabretooth is the only push node. You stage; the first-party Claude session pushes.
- Anthropic key hard wall: zero `ANTHROPIC_API_KEY` / `CLAUDE_API_KEY` in `services/hermes-router/.env*` ever.
- Customer-facing canonical-7 ban (FL §496.405): `payment`, `payment`, `outreach`, ``, ``, ``, `payout`. Internal synonym `contractual revenue payout` is briefings/agent-only.
- Hooks never bypassed: no `--no-verify`, no `--no-gpg-sign`.
- No mock data. Real or fail honestly.
- Square only on youandinotai.com. Stripe fine elsewhere.

### Part A — Mission Control swap (one branch, one PR)

1. `cd C:\ANTIGRAVITY` and create branch `claude/mission-control-swap-and-disk-cleanup`.
2. Confirm git status clean. If not, stash with a labeled stash; note the stash ref in the audit log.
3. Build OPUSHASHANDS fresh: `cd apps/mission-control && pnpm install --frozen-lockfile && pnpm build`. Confirm `apps/mission-control/dist/index.html` rebuilt and title is `<title>OPUSHASHANDS — Hermes glass house · #UntilNoKidInNeed</title>`.
4. Copy `apps/mission-control/dist/index.html` over `_deploy/aidoesitall-www/index.html`. Copy any sibling assets the build emits (`assets/`, `favicon.svg`, etc.) into `_deploy/aidoesitall-www/`. Keep the existing `_deploy/aidoesitall-www/_headers` (`X-Robots-Tag: noindex, nofollow, noarchive` is intentional).
5. Delete the legacy file `apps/mission-control/mission-control.html` (superseded by commit `46b07bc1` — OPUSHASHANDS replaced it). Use `trash` if available, `rm` otherwise.
6. Grep `_deploy/aidoesitall-www/` for the canonical-7 terms. If any hit, STOP and open a `doctrine-drift` issue with file + line numbers. Do not commit.
7. Commit on the branch with message:
   ```
   feat(mission-control): swap aidoesitall.website to first-party OPUSHASHANDS bundle

   - Replace _deploy/aidoesitall-www/index.html with apps/mission-control/dist/index.html
     (OPUSHASHANDS — Hermes glass house, current first-party Paperweight-aligned view).
   - Retire apps/mission-control/mission-control.html (legacy, superseded by 46b07bc1).
   - Preserves _deploy/aidoesitall-www/_headers (noindex,nofollow,noarchive — operator surface).
   - Doctrine: first-party, no trust-me-bro, source visible in repo, FL §496.405 clean.

   Cloudflare DNS swap is NOT in this commit — see runbook in
   briefings/HERMES-PROMPT-2026-06-04-mission-control-swap-and-disk-cleanup.md
   §"DNS swap runbook (Josh executes)". Repo PR is reversible; DNS is irreversible.
   ```
8. Do NOT push. Leave branch local on Sabretooth. Write a one-line file `briefings/READY-TO-PUSH-2026-06-04.txt` containing the branch name and the commit SHA so the next first-party Claude session can pick it up.

### Part B — DNS swap runbook (Josh executes — do not run this, just write the runbook file)

Write `briefings/RUNBOOK-aidoesitall-dns-swap-2026-06-04.md` with this exact body:

```
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
```

### Part C — Sabretooth C: drive cleanup (Hermes executes directly)

C: is >90% — reclaim space aggressively but ONLY from rebuildable artifacts, caches, and known-retired trees. Log every delete with byte count to the audit. Use `trash` where available, `rm -rf` for caches and node_modules.

Targets (in order, smallest blast radius first):

1. **Per-package node_modules across the monorepo**: `find C:\ANTIGRAVITY -maxdepth 5 -type d -name node_modules -prune` → report sizes first, then delete. `pnpm install` will rebuild. Skip `C:\ANTIGRAVITY/.pnpm-store` only if it's the actual store; otherwise include.
2. **Python venvs in the tree**: `find C:\ANTIGRAVITY -maxdepth 5 -type d -name .venv -prune` → delete. `pip install -r requirements.txt` rebuilds.
3. **Python caches**: `__pycache__`, `.pytest_cache`, `.ruff_cache`, `.mypy_cache` — delete recursively under `C:\ANTIGRAVITY`.
4. **Frontend caches**: `.next`, `.vite`, `.turbo`, `.parcel-cache`, `.swc` — delete recursively under `C:\ANTIGRAVITY/apps/` and `C:\ANTIGRAVITY/services/`. KEEP `apps/mission-control/dist/` because we just rebuilt it for the swap.
5. **Coverage and test artifacts**: `coverage/`, `.nyc_output/`, `playwright-report/`, `test-results/` — delete recursively.
6. **pnpm / npm / yarn user caches** outside the repo: `pnpm store prune`, `npm cache clean --force`, `yarn cache clean` if installed. Report freed bytes.
7. **pip user cache**: `pip cache purge`.
8. **Docker** (Docker Desktop / dockerd on Sabretooth — confirm Sabretooth has docker first; T5500 is the docker host per CLAUDE.md, do NOT touch T5500 from Hermes-Sabretooth in this pass): if Sabretooth has any local docker images/containers/volumes, `docker system prune -a -f --volumes`. Skip if Sabretooth has no docker daemon.
9. **Hermes / Ollama local model caches**: leave Ollama models alone — Joshua actively uses them. But clear Ollama log files older than 14 days.
10. **Retired trees still on disk**: under `C:\ANTIGRAVITY`, check for legacy folders that pre-date the monorepo and are NOT in pnpm workspaces and NOT git-tracked: `antigravity/`, `frontend/`, `youandinotai/`, `paperclip` (the old companion folders mentioned in CLAUDE.md as legacy persisting at root). Check each: if `git ls-files <folder>` returns empty, it's untracked legacy — delete and free the bytes. If git-tracked, LEAVE IT.
11. **Old session/log dumps**:
    - `C:\Users\joshl\AppData\Local\hermes\logs\*` older than 30 days → delete.
    - `C:\Users\joshl\AppData\Roaming\Claude\local-agent-mode-sessions\` — Joshua's older Cowork session dumps can be huge. Delete subdirectories whose `mtime` is older than 14 days. KEEP anything modified in the last 14 days.
    - Cloudflared / `wrangler` cache: `C:\Users\joshl\AppData\Local\.wrangler\` if present and >100MB.
    - Gemini / google-genai cache: `C:\Users\joshl\AppData\Local\google\` if present and bulky.
12. **Recycle Bin**: empty Windows Recycle Bin on C:.
13. **Windows side**: `cleanmgr /sagerun:1` if non-interactive flags supported on this Sabretooth build. Otherwise skip.
14. **DO NOT TOUCH**:
    - `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\` (vault, secrets)
    - `C:\ANTIGRAVITY\briefings\` (memory + doctrine)
    - `C:\ANTIGRAVITY\hermes\agents\` (contract MDs)
    - `C:\ANTIGRAVITY\.graphify\` (graph state)
    - `C:\ANTIGRAVITY\.git\` (history)
    - any `.env` file anywhere
    - any Ollama model file
    - E: drive (sandbox / experimental — Joshua's call)

### Part D — Report

When all of Part A, B, C are done, write `briefings/CLEANUP-REPORT-2026-06-04.md` with:
- Branch name + commit SHA from Part A.
- Confirmation that `briefings/RUNBOOK-aidoesitall-dns-swap-2026-06-04.md` exists.
- Table from Part C: per-target bytes freed, total bytes freed, before/after C: drive free space.
- Any target skipped and why.
- Any `doctrine-drift` issue opened (link).
- One-line memory snippet for the Paperweight Daily Memory Notion page (first-party Claude will append it; do not call Notion from Hermes).

Then stop. Do not loop. Do not summarize beyond the report. Do not push.

---

## Notes for the next first-party Claude session (not for Hermes)

When you take over after Hermes finishes:
1. Read `briefings/READY-TO-PUSH-2026-06-04.txt` for the branch + SHA.
2. `git push origin claude/mission-control-swap-and-disk-cleanup`, open PR via `mcp__github__*` tools, auto-merge on CI-green per COWORKER-DISPATCH §5.3 (the repo PR is reversible — only DNS is irreversible).
3. Hand Joshua the DNS runbook (`briefings/RUNBOOK-aidoesitall-dns-swap-2026-06-04.md`). He executes the DNS swap.
4. Append a dated section to the top of the Paperweight Daily Memory Notion page (id `372a4be9-d37e-81d1-95c0-da68a3308d4c`) summarizing the swap and the cleanup.

#UntilNoKidInNeed.
