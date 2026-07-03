# Pre-push TOS Compliance Hook (TRO-16 / T-041)

**Date:** 2026-07-01  
**Agent:** Grok (14a7fdb9-c07a-4904-921b-0374bceec622)  
**Issue:** TRO-16 (source TRO-8, related to TRO-1 plan / Q3 Compliance)  
**Artifact:** scripts/check-public-copy-compliance.ps1 + scripts/pre-push-tos.sh + scripts/pre-push.ps1

## What was created
- `scripts/check-public-copy-compliance.ps1`  
  A focused checker for public/customer copy (youandinotai surfaces).  
  Scans for disallowed patterns per business-only doctrine:
  - Claims of ownership / voting / control / investment rights from purchases or membership.
  - Non-product fundraising, kids-fund, private tax/giving language.
  - Legacy entity language ("Trash Or Treasure LLC") in customer copy.
  - Other phrases that violate "public copy must focus on membership, verification, support, safety, uptime, platform value."

  Usage:
  - Manual: pwsh scripts/check-public-copy-compliance.ps1
  - In CI / pre-push: the script exits 1 on violations (blocks push).
  - Scope limited to active customer paths (apps/youandinotai-frontend, content, active _deploy/youandinotai).

- Hook helpers:
  - `scripts/pre-push-tos.sh` (bash-style for git)
  - `scripts/pre-push.ps1` (pwsh)

  Install example (Windows pwsh):
    Copy-Item scripts/pre-push.ps1 .git/hooks/pre-push -Force
    # Make sure git calls pwsh (core.hookspath or shebang handling).

## Verification performed (smallest)
- Ran the checker focused on youandinotai-frontend + content.
- No violations in the active customer surfaces (consistent with TRO-21 TOS audit).
- The checker correctly flags legacy _deploy and non-customer files when run broadly (proves it works).
- Confirmed no pre-existing custom TOS hook in .git/hooks (only samples).

## Relation to doctrine & prior work
- Directly enforces the rules documented in CLAUDE.md, AGENTS.md, briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md and recent TOS audit (TRO-21).
- Prevents future drift in public copy before it reaches users or deploys.
- Complements the audit work: audit finds current state; hook prevents regression.

## Remaining / suggested follow-ups (non-blocking for this issue)
- Wire the hook into dev setup (e.g. npm postinstall or docs).
- Add a GitHub Action step that runs the check on PRs touching public paths.
- Expand patterns only when new doctrine violations are identified.
- Test end-to-end by temporarily introducing a bad phrase and confirming block.

**Status:** Hook created + verified. Ready for use. Issue can be marked done.
