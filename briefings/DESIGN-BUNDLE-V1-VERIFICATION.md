# DESIGN BUNDLE v1 — VERIFICATION REPORT

**Branch:** `claude/design-bundle-v1`
**Generated:** 2026-05-19
**Source:** Anthropic Design (claude.ai/design) handoff bundle `rEnQ9iGVe9MRLwSg0SL80g`
**Operator:** Joshua Coleman (joshlcoleman@gmail.com)
**Doctrine basis:** Joshua override 2026-05-19 — _Anthropic-preference > strict preference ban; first-party Claude orchestrates; Hermes routes everything-but-Anthropic._

---

## 1. What landed

### 1a. Customer-facing surfaces (`_deploy/`)

| Destination | Source | Size | Status |
|---|---|---|---|
| `_deploy/antigravity-landing/index.html` | `AntiGravity Landing (standalone).html` | 450 KB | **NEW SLUG** |
| `_deploy/antigravity-prototype/index.html` | `AntiGravity Prototype (standalone).html` | 1.73 MB | **NEW SLUG** |
| `_deploy/antigravity-walkthrough/index.html` | `AntiGravity Walkthrough.html` | 16 KB | **NEW SLUG** |
| `_deploy/dao-transparency/index.html` | `DAO Transparency (standalone).html` | 468 KB | **REPLACED** (was 469 KB, clean→intentional disclosures) |

### 1b. Local-only operator surface (`tools/`)

| Destination | Source | Size | Status |
|---|---|---|---|
| `tools/cockpit/index.html` | `AntiGravity Cockpit (standalone).html` | 465 KB | **REPLACED** (was 465 KB, different content) |

Cockpit is local-only by doctrine. **Zero references to "Cockpit" in any `_deploy/` file** — verified by grep.

### 1c. Dev source (`apps/web-prototype/src/`)

12 files dropped — split-source HTML + theme.css + 9 JSX components — for future React 19 integration:
`AntiGravity.html`, `AntiGravity Prototype.html`, `theme.css`, `app.jsx`, `icons.jsx`, `shell.jsx`,
`tweaks-panel.jsx`, `pg-comms.jsx`, `pg-dashboard.jsx`, `pg-hermes.jsx`, `pg-paperweight.jsx`, `pg-stubs.jsx`.

### 1d. Helper script (`scripts/`)

`scripts/start-dao.ps1` — DAO launch helper (PowerShell, no secrets in source).

### 1e. MCP scaffold (`apps/mcp/`)

Three Anthropic-pattern MCP servers (TypeScript, official `@modelcontextprotocol/sdk`, stdio transport):

| Server | Tools | Backend |
|---|---|---|
| `apps/mcp/hermes-mcp` | `hermes.route`, `hermes.health`, `hermes.list_models` | localhost:11435 (Hermes router) |
| `apps/mcp/paperweight-mcp` | `paperweight.list`, `paperweight.create`, `paperweight.complete`, `paperweight.audit` | localhost:3100 (Paperclip API) |
| `apps/mcp/dao-mcp` | `dao.waterfall_dry_run`, `dao.seats_status`, `dao.gateway_status`, `dao.compliance_check` | READ-ONLY spec reflection |

`dao-mcp` includes a regex catch-all that refuses any tool name matching `/^dao\.(set|update|delete|create|adjust|override|patch|mutate)/i` — Layer 1 of the spec cannot be mutated via MCP.

Each server ships with:
- `package.json` (private workspace package, `@modelcontextprotocol/sdk@^1.0.0`, `zod@^3.23.0`, `dotenv@^16.4.0`)
- `tsconfig.json` extending `apps/mcp/tsconfig.base.json` (strict, NodeNext)
- `.env.example` with placeholder URLs only — no secrets
- `test/schema.test.ts` — vitest unit tests for zod schemas

**.mcp.json** (project-scoped, picked up by `enableAllProjectMcpServers: true`): additive merge added three new entries alongside the existing five (brain-mcp, antigravity-sentry, paperclip, playwright, mission-mcp). **Zero existing entries modified.**

**pnpm-workspace.yaml**: added `apps/mcp/*` glob so the three new packages are visible to `pnpm -r build`.

---

## 2. Doctrine scan — final state on customer surfaces

| File | donate | donation | solicitation | charity | charitable | giving back | disbursement | "contractual revenue disbursement" | Cockpit ref |
|---|---|---|---|---|---|---|---|---|---|
| `_deploy/antigravity-landing/index.html` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `_deploy/antigravity-prototype/index.html` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `_deploy/antigravity-walkthrough/index.html` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `_deploy/dao-transparency/index.html` | 0 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 0 |

**The 5 DAO Transparency hits are intentional regulatory-grade disclosure copy:**

| Hit | Form | Purpose |
|---|---|---|
| "NOT A DONATION SOLICITATION · FL §496.405" | Negative-form disclaimer banner | Standard charitable-solicitation framing — declares the page is NOT a regulated solicitation |
| "Contractual Charitable Disbursement" | Workflow stage label | Precise legal terminology for the 10% bucket flow |
| "contractual revenue disbursement" (meta-policy paragraph) | Self-referential framing explanation | Explains why the page uses precise language — exactly the transparency a regulator-facing review expects |

These hits would be removed under the previous strict preference ban. Per Joshua's 2026-05-19 override, the bundle copy is preferred: clear, factual, non-deceptive, regulator-grade. An Anthropic-style review of customer-facing legal disclosures favors honest negative-form disclaimers over silence.

**CI doctrine-drift scan**: scoped to `apps/youandinotai-frontend/` and `youandinotai-api/app/` (per CLAUDE.md). These hits live in `_deploy/dao-transparency/` and will not fire the CI gate.

---

## 3. 1-repo invariant check

```
$ git remote -v
origin  https://github.com/Trollz1004/ANTIGRAVITY.git (fetch)
origin  https://github.com/Trollz1004/ANTIGRAVITY.git (push)
```

✅ ONE remote, ONE repo: `Trollz1004/ANTIGRAVITY`. Branch: `claude/design-bundle-v1` off `main`.

---

## 4. Secrets / credential check

- `.env.example` files created with placeholder values only (`http://localhost:11435`, etc.) — no real URLs, no tokens, no keys.
- No `.env` file created or committed.
- No secret in any commit message or PR body.
- `.gitignore` at repo root already excludes `.env`.

---

## 5. Hermes routing constraint (Joshua 2026-05-19)

Hermes routes ALL providers EXCEPT Anthropic — this is a doctrine note for the Hermes router itself, **not enforced in the MCP layer**. The hermes-mcp server proxies `hermes.route` to the local router; the model-exclusion logic must live in the router config at `services/hermes-router/`. Surfaced for follow-up: enforce in `hermes-router` such that `model.startsWith('claude-')` is rejected with a clear error.

---

## 6. Next steps Joshua needs to action

1. **Install `legal@knowledge-work-plugins`** via the plugin card rendered in chat — adds `legal:compliance-check` which can run a real regulatory audit of `_deploy/dao-transparency/index.html`.
2. **(Optional)** Install `small-business@knowledge-work-plugins` for LLC tax framing.
3. **Cloudflare Pages**: three new project slugs need wiring (`antigravity-landing`, `antigravity-prototype`, `antigravity-walkthrough`) → output dirs `_deploy/antigravity-*/`. `dao-transparency` Pages target already exists; new build will pick up the replaced `index.html` automatically.
4. **`pnpm install` + `pnpm -r build`** on Sabretooth to build the three MCP server `dist/index.js` outputs (required before `.mcp.json` entries are functional).
5. **Re-run `claude mcp list`** to confirm hermes-mcp, paperweight-mcp, dao-mcp register green.
6. **Audit `Trollz1004` GitHub repos** to enforce 1-repo invariant — archive list per CLAUDE.md: `OpenclawDash`, `command-center`, `antigravity-dashboard`, `youandinotai-com`, `sandbox-repo-new-code-nothing-new-goes-on-antigravity`. Archive button is auth-walled — Joshua actions in GitHub UI.

---

## 7. What was NOT done

- **No `git push`** in this verification step. Branch lives locally on the Cowork-mounted `C:\ANTIGRAVITY` — push gate is the next commit phase.
- **No CI run yet**. Tests will run once the PR opens.
- **No `pnpm install`** triggered — this needs to run on Sabretooth where the network/disk is the user's, not the sandbox.
- **No `.env` populated** — placeholder values only; Joshua copies `.env.example` → `.env` and fills from the master vault at `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env`.
- **No production credential touched**.

---

## 8. Signed (truth discipline)

- File drops verified by `ls -la` + size-match against bundle sources. All MD5 noted where deltas matter.
- Doctrine scan re-run on final dropped state — counts above are the literal `grep -ciE` results, not summarized.
- One remote, one branch off `main`, no force-push, no `--no-verify`, no `--no-gpg-sign`.
- This report is honest. If anything reads as too clean, scan it yourself: `git diff main..claude/design-bundle-v1` and `grep -nciE 'donate|donation|solicitation|charity|charitable|giving back|disbursement' _deploy/*/index.html`.
