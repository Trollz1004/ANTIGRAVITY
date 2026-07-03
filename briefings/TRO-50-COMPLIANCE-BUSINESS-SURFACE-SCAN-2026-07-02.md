# TRO-50: Compliance - Business Surface Scan + Policy Boundary

**Issue ID:** 4dc8d0cd-8917-424f-9c23-320ae9f90541  
**Identifier:** TRO-50  
**Status:** done (this heartbeat)  
**Agent:** Grok 14a7fdb9-c07a-4904-921b-0374bceec622  
**Date:** 2026-07-02  
**Wake:** heartbeat_timer  
**Run ID:** 417b9bd3-77bc-4eb1-95c5-45ef4ed8de1d

## Objective
Run business-surface-scan + policy-boundary checks on current public copy (per .claude/commands and compliance doctrine). Verify customer surfaces (youandinotai.com primarily) stay strictly product-only.

## Scans Executed (smallest)
1. `pwsh -File scripts/check-public-copy-compliance.ps1 -CheckAll`
   - Output (violations):
     - _deploy/youandinotai/index.html : "Trash Or Treasure.*(Recycler|LLC)" → "Trash Or Treasure Online."
     - _deploy/youandinotai/legal/privacy.html : same
     - _deploy/youandinotai/legal/terms.html : same
     - apps/youandinotai-frontend/app/terms/page.tsx : voting rights, control rights (in protective disclaimer)
     - content/launch-*.md , replacement-brand-*.md , landing-page-audit.md : charity/donation phrases (context: these files state "no charity..." or "strictly product-first")
   - Script exited non-zero on violations; "No relevant..." when run without -CheckAll (staged diff default).

2. `python scripts/clawx-control/scan-public-copy-policy.py`
   - Ran (report-only). Filtered output limited; focuses on _deploy, content, youandinotai policies, onlinerecycle state etc. with rules for donate/fundraiser/Florida wording etc.

3. Policy-boundary manual checks:
   - Stripe on youandinotai-frontend/app and _deploy/youandinotai: **0 matches** (pass).
   - Doctrine file briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md : present.
   - No active customer copy drift on primary paths per prior TOS audits.

## Analysis of Flags
- **Legacy entity "Trash Or Treasure Online Recycler LLC" in _deploy/youandinotai**:
  - Appears in generated/deployed static (index.html JSON-LD name + ©, legal/terms.html meta/footer, legal/privacy.html).
  - Source search in apps/youandinotai-frontend (tsx/ts): **0 matches**.
  - Also appears in youandinotai-static built JS and ai-solutions-store (different surface).
  - _deploy/* are build outputs (CF Pages static). Stale generated assets contain old operator branding. Active frontend source is clean.

- **terms/page.tsx disclaimer**:
  - Exact: "A purchase does not create ownership, voting rights, control rights, or investment rights."
  - This is **correct protective language** (per business-only doctrine and prior TOS audits). Regex in compliance script is intentionally broad and produces overmatch here. Not a violation.

- **content/*.md**:
  - Matches are meta/instructional ("No charity/donation wording...", "Messaging stays strictly product-first. No ... charity references").
  - These are not customer-facing public copy. Historical/audit notes. Low priority.

- Overall: Active source code for youandinotai.com customer surfaces is compliant. Generated artifacts (_deploy, youandinotai-static) carry legacy strings from prior builds/exports. Content files are internal.

## Policy Boundary Summary
- Business surface scan: executed (ps1 + py).
- Stripe ban on yni: PASS.
- No haiku model refs in active .claude/ (checked).
- Doctrine referenced and active.
- Public copy enforcement script exists and runs (pre-push capable).
- No Anthropic key exposure in scope (not scanned here).

## Durable Artifacts
- This report: briefings/TRO-50-COMPLIANCE-BUSINESS-SURFACE-SCAN-2026-07-02.md
- Scan outputs captured in this heartbeat.
- PATCH on issue with run ID + summary + artifact link.

## Disposition + Recommendations
done. Scans run, results documented, smallest verification complete.

Recommendations (for follow-up or next unassigned):
- Refresh/regenerate _deploy/youandinotai (and youandinotai-static) from current clean frontend source to drop stale "Trash Or Treasure" strings in built customer HTML/JS.
- If legal operator name must appear for accuracy, keep qualified "operated by Trash Or Treasure Online Recycler LLC" only in /legal/* pages and remove from main index branding/JSON-LD/copyright on youandinotai surface.
- Consider tightening compliance script regexes to exclude protective disclaimers (e.g. negative "does not create").
- Run on staged changes in CI pre-push as intended.

All per execution contract: actionable work started, durable artifact + evidence, clear `done` disposition. No code changes in this smallest run (scans + report). Source surfaces largely clean; generated drift noted.