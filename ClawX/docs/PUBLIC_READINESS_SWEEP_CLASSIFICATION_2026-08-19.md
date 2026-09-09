# Public-Readiness Sweep Classification

> **Status:** Evidence-gathering and proposal only. This branch does not publish the repository, start services, alter Git history, reveal credentials, or modify external DNS or payment configuration.

## Controlled Baseline

| Item | Recorded state |
|---|---|
| Working branch | `manus/public-readiness-sweep`, created from `origin/main` at `b1117999` |
| Pre-existing unrelated worktree modifications | `scripts/jules-cli.py` and `scripts/verify_implementation.py`; excluded from this sweep |
| Prior controlled implementation branch | Not available in the current sandbox; its latest uncommitted helper edits cannot be included or claimed as verified |
| Schedule state | The business-only schedule wording was verified separately and the schedule remains paused |

## Task Classification

| Fable task | Classification | Safe action on this branch | Decision or blocker |
|---|---|---|---|
| Tracked configuration-file risk and history scan | **Blocking, but content-restricted** | Record tree and commit metadata; prepare an operator-facing history-purge plan without retrieving, printing, or copying blob contents. | The file is tracked and has one observed history commit. Credential contents and provider identity are intentionally not inspected in this sweep; Joshua must rotate any credential that may have been present before the judge performs a history purge. |
| README truth pass | **Safe branch remediation, after verification** | Correct stale claims, public status wording, and product-first copy while preserving the explicitly protected meme, Team credits, Contributing section, and AI-commit statement. | Commerce provider truth requires Joshua’s explicit ruling. |
| Internal-posture sanitation | **Safe branch remediation, evidence first** | Scan selected public documentation for local paths, bind/auth details, LAN exposure notes, and credential-location references; propose keep/redact/move changes. | History rewriting remains judge-only. |
| AIDoesItAll domain repair | **Read-only diagnosis now; external change later** | Diagnose public DNS and domain ownership/attachment state without changing Cloudflare configuration. | Any Pages/Worker attachment, DNS, or domain modification requires a separate explicit confirmation immediately before the change. |
| Publication | **Out of scope** | Provide a judge-ready bundle and factual report. | Joshua alone decides whether or when to make the repository public. |

## Verified Corrections to Apply Before Editing

The incoming prompt calls port `20128` the OmniRoute gateway. Prior controlled verification distinguishes it as the dashboard/admin surface, while the OpenAI-compatible gateway base is `http://localhost:20129/v1`. Public documentation must not repeat the `20128` gateway claim without a fresh, non-sensitive verification.

The current README also makes unverified live-status assertions and contains review-gated internal operating language. The first safe change is to replace those assertions with concise product-first wording that does not promise financial handling, future routing, governance rights, or unpublished legal structures.

## Secret-Safety Boundary

The repository tree confirms a tracked root configuration file named `.ao.env` (blob metadata only; no contents retrieved). Its tracked history reports one commit. No file contents, provider identifier, token, connection string, or environment value was inspected or copied.

The judge-facing history-purge plan, if authorized after credential rotation, is:

```text
# Run only in a fresh clone after rotation and owner confirmation.
git filter-repo --path .ao.env --invert-paths
git log --all -- .ao.env
git fsck --full
```

This plan is not executed by this branch. A successful purge changes commit identities and requires a coordinated force-update by the repository owner or judge lane.

## Immediate Questions for Joshua

1. Is the intended commerce provider wording for `onlinerecycle.net` and `ai-solutions.store` **Square**, **Stripe**, or a different current arrangement? No change will be made until confirmed.
2. Should public README status call `aidoesitall.website` and `youandinotai.com` **unverified / pending**, or should their claims be omitted entirely until the domain diagnosis is complete?
3. After any suspected credential rotation is completed, should the judge lane receive the history-purge plan for execution?

## Payment-Truth Evidence

The repository contains a dedicated FastAPI payment-truth module at `backend/fastapi-app/app/payment_truth.py`. It is explicitly a Square checkout and webhook helper and defines product checkout construction through Square. This supports the owner-confirmed rule that public Date App wording must not claim Stripe.

No equivalent current, product-scoped truth record was identified in this pass for the other public storefronts. Therefore, the README remediation must use provider-neutral commerce wording for those products rather than preserving or inventing a payment-provider claim. No account identifier, payment credential, webhook secret, or payment-access detail was read or recorded.

## Public Domain Availability Evidence

On August 19, 2026, read-only browser checks found that both `https://aidoesitall.website` and `https://www.aidoesitall.website` returned Cloudflare **Error 1034: Edge IP Restricted**. The error text indicates that the hostnames resolve to an IP address unavailable to the domain owner. The separate `dashboard.aidoesitall.website` page remained reachable and directs users to an authenticated workspace.

This evidence supports changing the README’s current `Live` claim for the apex and `www` hostnames to an honest pending/unverified status until a separate, authorized Cloudflare configuration change is made and externally verified. No DNS, custom-domain, Pages, Worker, or Cloudflare setting was changed during this check.

A separate read-only browser check on August 19, 2026 found `https://youandinotai.com` returning Cloudflare **Error 1033: Tunnel error**. The response states that the hostname is configured as a Cloudflare Tunnel that Cloudflare could not resolve at the time of inspection. The README must therefore not claim this product domain is live until a subsequent independent availability check succeeds. No tunnel, Cloudflare, service, or runtime change was made.

## Scoped Public-Language Scan

A path-limited scan of `README.md`, `frontend/`, and `apps/` excluded environment files, `briefings/`, and `ops/`. The README contains three review-gated/internal operating references: review-gated economics, founder compensation, and reserve policy. Those are public-readiness remediation candidates.

The scan also found legacy prohibited public-facing taglines in multiple legacy `frontend/src/` components, including `App.js`, navigation, sign-in, sharing, chat, security, and other visual modes. These occurrences need a separate public-surface remediation pass before publication; they must not be treated as cosmetic-only because they appear in user-visible component text. The scan also found legal product documents that explicitly reject control-rights and routing promises; those constraints are protective and require a line-by-line legal-context review rather than an indiscriminate deletion.

No environment file, secret value, or private briefing was opened during this scan.

## Internal-Posture File Inventory and Proposed Disposition

The following is a file-level, non-content inventory. It is a proposal for the judge lane; no file was moved or deleted in this assessment.

| File group | Proposed disposition | Reason |
|---|---|---|
| `ops/ADAPTER-SECRET-MAP.md`, `ops/secrets-migrated-names.json` | **Move out of the public repository** | Their names and scoped scan results identify secret-management posture; public availability is unnecessary. |
| `ops/startup/fix-agent-models.cjs`, `ops/startup/register-cleanstack-autostart.ps1`, `ops/startup/seed-agents.cjs`, `ops/startup/start-stack.ps1` | **Move out or replace with non-executing public-safe notices** | The files expose local bind ports, local paths, service topology, tunnel configuration locations, and legacy launch behavior. |
| `ops/omniroute-nodes.env.example` | **Move out or replace with a generic schema document** | An example configuration file can reveal internal routing and deployment assumptions even without a credential value. |
| `ops/ceo-harness/NODES.md`, `ops/ceo-harness/ORNITH-INSTALL.md`, `ops/OMNIROUTE-OPENCODE-CONTROL.md`, `ops/T5500-*` | **Redact machine names, local addresses, ports, and operator paths; otherwise keep high-level architecture concepts** | These documents describe private node topology and local execution posture. |
| `briefings/*` matching the posture scan | **Redact selected lines or move historical/internal packets out of the public repository after individual review** | Many are dated context records, but several include local paths, service endpoints, or operating assumptions that should not become public posture. |
| `ops/sales/campaigns/sales-run-log.md`, `ops/sales/directory-submissions/2026-08-11-draft-pack.md` | **Move historical execution logs out; keep only curated public collateral** | They expose historical local paths and operational hosting details rather than current product information. |
| `ops/skills/SKILLS-HUB.md`, `ops/skills/skills-hub-reference.md` | **Redact only machine path and internal authoring-boundary specifics; preserve generic skill workflow guidance** | The general workflow can remain useful, while local-root and internal tool-boundary particulars are unnecessary publicly. |
| `ops/sales/public-surface/b2b.html`, `ops/sales/README.md` | **Review product claims line by line before keeping** | These are outward-facing business materials; they need the same product-only language review as the README. |

The scan also found legacy drive paths, loopback addresses, local database references, tunnel mentions, and credential-location vocabulary across these groups. No environment file or secret-bearing map was opened to produce this inventory.
