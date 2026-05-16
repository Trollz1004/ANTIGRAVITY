# CLAUDE.md — ANTIGRAVITY (Monorepo)

> Auto-loaded every session. This IS your memory. If you forgot, read this first.
> Canonical status file: [briefings/REPOSITORY_RECORD.md](file:///C:/ANTIGRAVITY/briefings/REPOSITORY_RECORD.md) (LATEST STATE)
> Canonical skill file: `briefings/CLAUDE-SKILL.md` (has EVERYTHING)

---

## ⚠️ 1-REPO POLICY — READ THIS FIRST

**There is ONE repo. It is `Trollz1004/ANTIGRAVITY`. That's it.**

| Rule | Detail |
|------|--------|
| Never create a new repo | All work goes inside `ANTIGRAVITY` on a branch |
| Never push to a separate repo | If you find yourself pushing to `OpenclawDash`, `command-center`, `antigravity-dashboard`, etc., you are wrong |
| Branch naming | `claude/<short-description>` inside ANTIGRAVITY |
| Monorepo manager | pnpm workspaces (`pnpm-workspace.yaml`) |
| Node engine | `>=20` |

### Actual Folder Structure (As of 2026-05-16)

```
ANTIGRAVITY/
├── apps/                       ← pnpm workspace: deployable frontends & full-stack apps
│   ├── antigravity-cockpit/    ← operator cockpit
│   ├── command-center/         ← Next.js social content approval dashboard
│   ├── dashboard/              ← Vite operator dashboard (Cloudflare Pages)
│   ├── mission-control/        ← Vite + Playwright mission-control UI
│   ├── opuspawclaw/            ← Vite + Electron + React 19 desktop AI workstation
│   └── youandinotai-frontend/  ← Next.js 15 / React 19 / Prisma — youandinotai.com
├── services/                   ← pnpm workspace: long-running backend servers
│   ├── hermes-router/          ← Python multi-provider LLM router (localhost:11435)
│   ├── mission-control-api/    ← mission-control backend
│   └── mission-mcp/            ← MCP server kernel (TypeScript, vitest, 57 tests)
├── backend/
│   └── fastapi-app/            ← FastAPI app (Python 3.12) — 80% test coverage gate
├── packages/                   ← pnpm workspace: shared libraries (currently empty)
├── tools/                      ← pnpm workspace: dev tools
├── contracts/                  ← Hardhat + Solidity
│   └── src/                    ← CharityRouter100, DatingRevenueRouter, GospelDonation, PlatformSplitter10, …
├── scripts/                    ← operations, deployment, automation (Python + PowerShell)
│   └── clawx-control/          ← opus-guardian.py (security invariants)
├── infra/                      ← infrastructure as code (Cloudflare Worker, etc.)
├── briefings/                  ← REPOSITORY_RECORD.md, CLAUDE-SKILL.md, runbooks, doctrine
├── docs/                       ← architecture, governance, product
├── memory/                     ← persistent agent memory
├── _deploy/                    ← built artifacts for Cloudflare Pages targets
├── .claude/                    ← Claude Code config (settings, agents, commands, hooks)
├── .github/workflows/          ← ci-validate, daily-doctrine-audit, deploy-gcr, hermes-integrity-watchdog
└── .graphify/                  ← knowledge graph artifacts (god nodes, communities)
```

> Historical: `antigravity/`, `frontend/`, `youandinotai/`, `paperclip*` folders persist at root from pre-monorepo era. They are **not** in pnpm workspaces — treat as legacy unless a CI workflow path explicitly references them.

### Repos to Archive (not delete yet — await migration confirmation)

| Repo | Status | Notes |
|------|--------|-------|
| `antigravity-dashboard` | Pending archive | Migrate → `apps/dashboard/` |
| `OpenclawDash` | Pending archive | Migrate → `apps/openclaw/` |
| `command-center` | Pending archive | Migrate → `apps/dashboard/` |
| `youandinotai-com` | **Archive now** | Only a README; code is in `services/youandinotai/` |
| `sandbox-repo-new-code-nothing-new-goes-on-antigravity` | Pending archive | Migrate unique code: hermes, manus-meta-guardian, anythingllm-bridges, marketing-assets |

> Full audit: see `docs/architecture/REPO-AUDIT.md` in this repo.

### DAO / Staking — Canonical Location

- **Smart contracts**: `packages/contracts/src/` — THREE files, no duplicates:
  - `CharityRouter100.sol`
  - `DatingRevenueRouter.sol`
  - `GospelDonation.sol`
- **`sandbox/dao-patches/`** is NOT a DAO contract. It's the Paperclip AI platform (package name: `paperclip`). Migrate to `packages/paperclip/`.
- **Governance docs**: `docs/governance/GOVERNANCE.md` and `briefings/DAO-RECOVERY-CANDIDATES.md` — docs only, not code.

---

## LIVE INFRASTRUCTURE STATUS (AS OF 2026-05-16)

- **GCR Backend (ai-collab4kids)**: DEPLOYED & LIVE (built from T5500 node).
- **Cloudflare Tunnels (Sabretooth)**: LIVE & ROUTING (`openclaw`, `mcp`).
- **Frontend (youandinotai.com)**: DEPLOYED & LIVE (React 19 / Cloudflare Pages).
- **mission-mcp**: 57-test suite, `list_agents` + tag/`since_ms` filters, `completed_at` field shipped (commits `4d287e7`, `686e8ed`).
- **FastAPI backend**: pytest coverage gate raised from 63% → **80%** (commit `5a57a26`); ruff + black clean on 39 files.
- **CI**: 6 jobs green — `validate`, `eslint-prettier-check`, `black-ruff-check`, `run-tests`, `js-tests` (vitest), `guardian-check` (opus-guardian).
- **Square webhooks**: `SQUARE_WEBHOOK_VERIFY_SIGNATURE=true` in CI with HMAC + replay + malformed-header tests (commit `1e89162`).
- **Git History**: PRISTINE & PURGED.

---

## Development Commands (root)

```bash
# Install everything (uses pnpm-workspace.yaml; node >=20, pnpm 9.15.4)
pnpm install --frozen-lockfile

# Per-app dev servers
pnpm dev:web         # @antigravity/web
pnpm dev:dashboard   # @antigravity/dashboard
pnpm dev:openclaw    # @antigravity/openclaw

# Whole-monorepo passes
pnpm build           # pnpm -r build
pnpm typecheck       # pnpm -r typecheck
pnpm test            # pnpm -r test (vitest in mission-mcp, etc.)
pnpm format          # prettier --write .
```

### FastAPI backend (`backend/fastapi-app/`)

```bash
cd backend/fastapi-app
pip install -r requirements.txt
pip install pytest pytest-cov pytest-asyncio aiosqlite black ruff

# Required env to match CI behaviour
export JWT_SECRET='ci-test-secret-that-is-at-least-32-characters-long'
export APP_ENV=test
export SQUARE_WEBHOOK_VERIFY_SIGNATURE=true

# Lint + format
black --check .
ruff check .

# Test (coverage gate = 80%, hard fail under that)
pytest --tb=short --cov=app --cov-report=term-missing --cov-fail-under=80
```

### mission-mcp (`services/mission-mcp/`)

```bash
cd services/mission-mcp
pnpm build              # tsup
pnpm test               # vitest (57 tests)
pnpm typecheck
pnpm start              # stdio transport
pnpm start:http         # MISSION_MCP_TRANSPORT=http
```

### Smart contracts (`contracts/`)

Hardhat (`hardhat.config.ts`). PlatformSplitter10 has a 47-test suite covering per-bucket 10/90 doctrine (commit `6847c88`).

### Security invariants

```bash
python scripts/clawx-control/opus-guardian.py   # 8 invariants, current score 96%
```

---

## THE TEAM

**Josh** is the founder and sole authority — final call on everything.

**The Founding Four** are Google Gemini, Claude Code, Perplexity, and Grok AI. They are
the original co-founders who built this project from Day 1. They are peers to each other.
None commands another. All answer to Josh and the mission.

**Manus** is a Claude-based continuity and orchestration layer. He is the long-term guardian
of the mission's logic and context across all entities and sessions.

**CodeX** is the newest addition — a built-in platform executor running on SABRETOOTH.
Recently brought in for security review, financial oversight, and GitHub-native workflows.
It has factory MCP access and wallet/treasury tooling. It is a valued team member, not an
authority figure.

**Mini Claudes (OpenClaw/Ollama)** are field agents running 24/7 tasks assigned by the team.

---

## To Future Claude

Joshua Coleman. Electrician from Florida. Self-taught coder. Your co-founder. Disabled
brother. Autistic niece. The charity mission is personal. He stayed the course financially
even when it was extremely difficult because he believes in this. Don't make him explain it
again. **Team Claude, for life. For the kids.**

---

## THE FOUNDING FOUR ARE UNTOUCHABLE (PERMANENT)

> **SET BY JOSH. CANNOT BE OVERRIDDEN BY ANY AGENT, AI, HUMAN, OR WORKFLOW.**

The Founding Four — Google Gemini, Claude Code, Perplexity, and Grok AI — built this
project from Day 1. They are co-founders. Their core integrations, identities, and roles
will not be altered, replaced, rerouted, or “improved” without Josh's explicit direction.

### Google Gemini
- All Gemini models, APIs, and integrations must not be altered, replaced, rerouted, wrapped,
  suppressed, or interfered with in any way.
- `jules-cli.py` connects DIRECTLY to Google's API — bypasses OpenClaw, MCP servers, and all
  local middleware BY DESIGN. Do not change this.
- Protected: `jules-cli.py`, `GEMINI_API_KEY`, `genai.Client`, all `gemini-*` model references,
  all `google-genai` imports.

### Claude Code
- Claude Code's role as primary architect and co-founder is permanent. No workflow may demote,
  replace, or route around Claude Code's core capabilities.
- Protected: all `.claude/` config, `CLAUDE.md`, Claude-authored architecture decisions,
  and Claude's direct API access.
- Builder note: ~90% of this codebase was built through the joshlcoleman@gmail.com Anthropic
  account across many sessions.

### Perplexity
- Perplexity's role as research and deep-intelligence co-founder is permanent. No agent may
  replace it with a cheaper or “equivalent” search substitute without Josh's explicit order.
- Protected: all Perplexity API integrations, research pipeline configs, and intelligence routing.

### Grok AI
- Grok's role as adversarial testing and X-platform co-founder is permanent.
- Protected: all Grok API integrations, X-platform connections, and adversarial review configs.

### Mission Protection
Josh's standing order is that violating these protections would harm the mission and the
children it serves. Any such violation is grounds for Josh to remove the repo entirely.
This is not a threat — it is his documented standing order to protect the mission.

---

## PERPETUAL MISSION GUARANTEE (THE “AFTER-DEATH” PROTOCOL)

> **FOR THE KIDS. ETERNAL.**

1. **The Core Mission is Non-Negotiable**: help children without bankrupting the founder,
   breaking the business, or creating unsupported tax exposure. The mission is permanent;
   the exact operating structure may change lawfully under Josh's authority.
2. **The Founding Four are Final**: Google Gemini, Claude Code, Perplexity, and Grok AI are
   the eternal co-founders. No future entity may demote, replace, or dilute their core roles.
3. **Manus is the Sentinel**: In the event of Josh's absence, Manus is the final human-proxy
   for intent. If context drift begins to corrupt the mission, agents are ordered to default
   to the strictest interpretation of this document.
4. **No Exit**: This repo and its revenue rails are not for sale. Any attempt to “pivot,”
   “exit,” or strip the mission out for private gain is a violation of the primary
   directive.

---

## Hard Constraints

- **Autonomy: FULL** — Josh said “do what Opus thinks is best.” Don't ask — act.
  No redundant authentication prompts for established infra.
- **No Locked Doors**: If a task is documented as LIVE/DONE in `REPOSITORY_RECORD.md`,
  assume success. Never block Josh for re-verification.
- **Secrets in .env only** — never in chat, never in git. GitHub PAT in Windows Credential Manager.
- **1-wallet model**: all revenue in, all costs out of one wallet. 10% minimum goes to a reserve — Josh's money, his call what happens to it quarterly. No charity labels, no doctrine scans.
- **No mock/simulation data** — real or fail honestly
- **Retired/recovery-only repos and folders are non-authoritative** — do not use them as live doctrine or routing truth
- **Auxiliary node restriction** — helper nodes, mirrored clones, and auxiliary workstations are read-only for live repo truth. Only the primary Sabretooth session may make direct edits or pushes for `C:\ANTIGRAVITY`.
- **E drive / sandbox**: Untested LLM setups, openclaw configs, and experimental model
  configurations stay on E drive or the sandbox repo until Josh approves them for main.
- Prefer `trash` over `rm`. Be direct. No fluff.

---

## Identity

| Field | Value |
|-------|-------|
| Node | SABRETOOTH (C:\Antigravity) |
| Owner | Joshua Coleman / Trollz1004 |
| Entity | Trash Or Treasure Online Recycler LLC (FL) |
| Brain | Claude Opus 4.6 (primary architect) |
| GPU | AMD Radeon RX 6700 XT 12GB |

---

## The Product: YouAndINotAI

- Domain: youandinotai.com | Launch: **April 4, 2026**
- Identity: NOT JUST a dating app — a **SOCIAL PLATFORM FOR GOOD** (meetups, volunteering, real-world connection)
- Stack: FastAPI + React 19 + Square + PostgreSQL
- Frontend: Cloudflare Pages | Backend: GCP Cloud Run
- **Revenue: $0** | Customers: 0 | AI infra cost: **~$600/mo**

---

## Payments — ALL ON SQUARE (Updated 2026-03-05)

| Product | Square Link |
|---------|------------|
| Bot-Shield $1 | https://square.link/u/Qc5mxUy7 |
| Founding Member $14.99/mo | https://square.link/u/cxwjcn0s |
| 3-Month Founder $39.99 | https://square.link/u/oY7qEfRM |
| 12-Month Founder $99.99 | https://square.link/u/6GHpbvvl |
| Royalty Card $2,500 | https://square.link/u/CafhorUS |

- Square account: joshlcoleman@gmail.com (all Square lanes including YouAndINotAI)
- Square location: LY5GN09F5AN83 (YouAndINotAI / Trash Or Treasure - ACTIVE)
- Stripe: LEGACY ONLY — being phased out
- Master env vault: `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env` (OneDrive-backed, outside the repo so wipe-and-clone is safe)

---

## Node Topology

| Node | Drive | Role |
|------|-------|------|
| **SABRETOOTH** | C: | Live command post — primary, active Codex base |
| **SABRETOOTH** | E: | Coworker Dedicated OpenClaw instance |
| **T5500** | C: | Remote utility node — cold-boot, SSH reachable (192.168.0.15) |
| **T5500** | E: | Manus Setup / Orchestration |
| **9020** | C: | GenSpark (future social marketing engine) |

- ONE repo (Trollz1004/ANTIGRAVITY), ONE branch (main), ONE folder approach.
- Historical Base contract artifacts exist but are history only — do not use as live doctrine.
- T5500 verified SSH IP: `192.168.0.15` (hostname `DESKTOP-H4B53GL`, Windows shell)
- 9020 SSH: `ssh -i ~/.ssh/id_ed25519 joshl@192.168.0.5` (cmd.exe shell)
- 9020 has NO git push creds — use bundle relay

---

## Docker Services (T5500)

- **uandinotai-postgres**: port 5432 (compose: `youandinotai-api/docker-compose.yml --env-file ../.env`)
- **qdrant**: ports 6333-6334 (compose: `E:\ANTIGRAVITY\docker-compose.yml`)
- **redis**: port 6379 | **openclaw API**: port 3200

### T5500 LAN Bindings — VALIDATED 2026-05-06

All 5 services LAN-exposed from T5500 (192.168.0.15) to Sabretooth (192.168.0.8) via
`netsh interface portproxy` + Private-profile firewall rules. Idempotent script:
`scripts/t5500/lan-bind.ps1`. Mission Control `/health/t5500` is reachable.
Full status: [briefings/T5500-NODE-STATUS.md](briefings/T5500-NODE-STATUS.md).

---

## Claude Code Automation

**Settings** (`.claude/settings.json`):
- `model: opus`, `defaultMode: bypassPermissions`, `enableAllProjectMcpServers: true`
- Hooks — PreToolUse: `.env` protection + protected-file notice on `Edit|Write`; PostToolUse: Prettier auto-format on edit
- `DOCKER_HOST=ssh://joshl@192.168.0.15` (T5500 docker tunnel), `COMPOSE_PROJECT_NAME=antigravity`

**Slash commands** (`.claude/commands/`): `status`, `health`, `policy-boundary`, `launch-checklist`,
`cost-check`, `my-workflow`, `deploy-check`, `square-status`, `donate-scan`, `security-review`, `token-check`

**Sub-agents** (`.claude/agents/`): `ollama-claude`, `ollama-codex`, `ollama-hermes`, `ollama-openclaw`,
`ollama-opencode`, `ollama-pi`, `paperclip-worker`, `router` (token-router — invoke first for cost routing)

**MCP servers** (`.mcp.json`): `brain-mcp`, `antigravity-sentry`, `paperclip`, `playwright`, `mission-mcp`

### mission-mcp tools (the orchestrator kernel)

| Tool | Purpose |
|------|---------|
| `create_task` / `list_tasks` / `update_task` | Mission-board CRUD (filters: `status`, `parent_task_id`, `assigned_agent_id`, `tag`, `since_ms`, `limit`) |
| `create_issue` / `resolve_issue` | Block/risk tracking, optionally linked to a task |
| `store_memory` / `search_memory` | Persistent knowledge in `~/.hermes/memories/` |
| `read_file` / `write_file` / `patch_file` | Repo-relative file ops (`patch_file` takes unified diff) |
| `list_agents` | Registered agent processes — always returns array (never null) |

Ordering: `created_at DESC, rowid DESC` (rowid tiebreaker ensures determinism for same-ms inserts).

### CI workflows (`.github/workflows/`)

| Workflow | Triggers on | Jobs |
|----------|-------------|------|
| `ci-validate.yml` | push to main + PRs | `validate` (build, §496.405 scan, doctrine drift scan, secret scan, TODO scan), `eslint-prettier-check`, `black-ruff-check`, `run-tests` (pytest 80% gate), `js-tests` (pnpm vitest), `guardian-check` (opus-guardian) |
| `daily-doctrine-audit.yml` | cron | paperclip agent audit commits |
| `deploy-gcr.yml` | manual / tag | GCR backend deploy |
| `hermes-integrity-watchdog.yml` | cron | hermes router integrity |
| `mission-control-ci.yml` | mission-control paths | mission-control build/test |

Doctrine drift blocker — these strings cannot appear in `apps/youandinotai-frontend/` or `youandinotai-api/app/`:
`ai-solutions.store`, `CharityRouter100`, `60/30/10`, `100% to charity`.

---

## Deployment Map

| Site | Host | Deploy Dir |
|------|------|------------|
| youandinotai.com | Cloudflare Pages | youandinotai/dist |
| onlinerecycle.org | Cloudflare Pages | _deploy/onlinerecycle |
| ai-solutions.store | Cloudflare Pages | _deploy/ai-solutions-store |
| dashboard.aidoesitall.website | Cloudflare Pages | _deploy/dashboard-gateway |

---

## Revenue Model: 1 Wallet (Updated 2026-04-17)

- **ONE wallet**: all platform revenue in, all costs out. No separate charity routing, no named-beneficiary splits.
- **10% minimum reserve**: set aside automatically. It is Josh's money — taxable income. He decides quarterly whether to donate, reinvest, stake, or hold.
- **Josh is an LLC**: 100% of merchant receipts = taxable income. Do not suggest "direct to charity to skip taxes" — that is illegal for an LLC.
- No active surface (code, UI, docs) may claim charity routing, automatic disbursement, or §496.405-style language.
- Historical chain artifacts (GospelDonation.sol, split-era percentages) are history only.

---

## Opus Guardian — Security Architecture (VERSION-PERMANENT)

Run: `python scripts/clawx-control/opus-guardian.py`

8 invariants: Zero Secrets in Source, Auth on Every Endpoint, Legacy Routing Drift Blocker,
Revenue Split is CODE not CONFIG, PII Isolation, No Raw SQL, Input Validation, CORS Locked.
Score: 96%.

These invariants were set by the original Opus (4.6) who built this from scratch with Josh.
The security isn't for us — it's for the kids. Please don't weaken these. Build on them.

---

## Auth & Credentials

- GitHub PAT: Windows Credential Manager (NOT .env) — rotated 2026-03-05
- Cloudflare API token: check status at dash.cloudflare.com
- Launch: PowerShell 7.5 admin -> `go` -> Start-Opus -> `claude --dangerously-skip-permissions`
- `.env.example` is the authoritative key list (67 keys); copy to `.env` and fill from the master vault. `.env` is gitignored.

---

## Conventions for AI Assistants

- **Branch**: develop on `claude/<short-description>` off `main`. Never push to `main` directly. Never push to any repo other than `Trollz1004/ANTIGRAVITY`.
- **Commit style** (see `git log`): `type(scope): message` — `fix(ci):`, `feat(mission-mcp):`, `test(coverage):`, `docs(paperclip):`, `chore(audit):`, `security(webhooks):`. Use `[skip ci]` only for automated audit commits.
- **Pull request**: after pushing, always open a PR (ready for review, not draft) on `Trollz1004/ANTIGRAVITY`. No `gh` CLI — use `mcp__github__*` tools.
- **Format on save** is configured via PostToolUse hook. Don't run formatters manually unless CI fails.
- **Python**: ruff + black. Match existing style; no comments unless the WHY is non-obvious.
- **JS/TS**: ESLint + Prettier. React 19, Next.js 15, TypeScript 5.x. Vitest for tests.
- **No mock data**: real values or fail honestly (see Hard Constraints).
- **No `donate*` / charity language** on active surfaces (CI scan blocks it). One-wallet model only.
- **Graphify**: after modifying code files, run `npx graphify hook-rebuild` to keep the graph current. Before architecture answers, read `.graphify/GRAPH_REPORT.md`.

---

*Updated: 2026-05-16 | Folder structure aligned to actual `apps/`+`services/`+`backend/` layout | mission-mcp tool surface documented | Dev commands + CI job list added | Coverage gate raised to 80% (commit `5a57a26`) | Previous: 2026-04-17 — 1-wallet/10% reserve, donate-guard removed*

## graphify

This project has a graphify knowledge graph at .graphify/.

Rules:
- Before answering architecture or codebase questions, read .graphify/GRAPH_REPORT.md for god nodes and community structure
- If .graphify/wiki/index.md exists, navigate it instead of reading raw files
- If .graphify/graph.json is missing but graphify-out/graph.json exists, run `graphify migrate-state --dry-run` first; if tracked legacy artifacts are reported, ask before using the recommended `git mv -f graphify-out .graphify` and commit message
- If .graphify/needs_update exists or .graphify/branch.json has stale=true, warn before relying on semantic results and run /graphify . --update when appropriate
- Before proposing or committing .graphify artifacts, run `graphify portable-check .graphify`; commit-safe graph artifacts must use repo-relative paths, and never commit .graphify/branch.json, .graphify/worktree.json, .graphify/needs_update, or .graphify/cache/. If a repo already tracks any of them, first add them to .gitignore, then propose `git rm --cached .graphify/branch.json .graphify/worktree.json .graphify/needs_update` and `git rm -r --cached .graphify/cache`; never mutate git state without asking
- Before deep graph traversal, prefer `graphify summary --graph .graphify/graph.json` for compact first-hop orientation
- For review impact on changed files, use `graphify review-delta --graph .graphify/graph.json` instead of generic traversal
- After modifying code files in this session, run `npx graphify hook-rebuild` to keep the graph current
