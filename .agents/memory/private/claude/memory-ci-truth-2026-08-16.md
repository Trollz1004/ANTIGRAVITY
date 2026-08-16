---
name: ci-truth-2026-08-16
description: "How ANTIGRAVITY's GitHub Actions CI actually gates — job scopes, path-filter trap, security-clearance pattern, what was fixed 2026-08-16"
metadata: 
  node_type: memory
  type: project
  originSessionId: d12951b0-fb29-465a-a81c-12d09644ffdf
  modified: 2026-08-16T15:44:28.944Z
---

State of `Trollz1004/ANTIGRAVITY` CI after the 2026-08-16 green-up (commits
`f27dfcb5` → `21484b51` → `f6e37264`). All workflows green as of that evening.

**How CI Validate (`ci-validate.yml`) actually gates:**

- `black-ruff-check` lints **only `backend/fastapi-app`**, NOT the repo root.
  Repo-wide `ruff check .` shows 1000+ errors — irrelevant to CI; don't "fix"
  them to chase a red check. Ruff config lives in
  `backend/fastapi-app/pyproject.toml` (E/W/F/I/C/B/UP/SIM/ARG with a long
  documented ignore list).
- `owasp-dependency-check` is really FOUR gates in one job: (1) OWASP
  Dependency-Check action, CVSS ≥ 7, node audits disabled, SHA-pinned,
  docker-based; (2) `pnpm audit --audit-level high` on the **root pnpm
  workspace**; (3) `npm audit --audit-level=high` in `frontend/react-app`
  (separate npm lockfile, baseline 2 moderates); (4) `pip-audit --strict` on
  `backend/fastapi-app/requirements.txt` with PYSEC-2026-1325 (ecdsa, no fix
  released) ignored — remove that ignore when upstream patches.
- `code` is the aggregator job and the **single required status check** the
  branch ruleset gates on.

**Path-filter trap:** CI Validate's push trigger does NOT include root
`package.json` / `pnpm-lock.yaml`, so dependency-security commits there don't
trigger it. Verify green via `gh workflow run "CI Validate"` (it has
workflow_dispatch). Only Policy Guard runs on every push.

**Security-clearance pattern:** scoped `pnpm.overrides` in root
`package.json` (e.g. `"undici@7": "^7.29.0"`, `"vite@<=6.4.2": "^6.4.3"`),
then `npx -y pnpm@9.15.4 install --lockfile-only` (match the pinned
packageManager version). The 2026-08-16 pass pinned vitest, undici, vite,
hono, js-yaml, nanoid, ip-address, postcss, brace-expansion, fast-uri.
fast-uri also needed bumping in the separate `brain-mcp` and
`services/mission-mcp` npm lockfiles.

**Killed:** `daily-doctrine-audit.yml` ("Daily Paperclip Agent Audit") —
zombie calling deleted `scripts/paperclip/agent-audit.sh`, emailed a failure
daily at 06:00 UTC. Deleted per the Paperclip retirement; do not restore.

**Actions are on Node 24 majors** (checkout v7, setup-python v7, setup-node
v7, cache v6, upload-artifact v7, github-script v9, pnpm/action-setup v6,
google auth/setup-gcloud v3). Keep new workflow steps on these majors or the
node20 deprecation warnings return.

Related: [[sabretooth-reinstall-2026-08-16]] (gh CLI restored — the tool used
to drive all of this), [[judge-governance-2026-08-16]] (push rules).
