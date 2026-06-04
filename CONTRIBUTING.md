# Contributing to ANTIGRAVITY

> *Gravity keeps us grounded — AI built ANTIGRAVITY to lift us up.*
> **#UntilNoKidInNeed**

Thank you for your interest in contributing to the ANTIGRAVITY project. This document provides comprehensive guidelines for contributing to the monorepo. Please read it before submitting changes.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Repository Policy](#repository-policy)
- [Directory Structure](#directory-structure)
- [Tech Stack](#tech-stack)
- [Development Setup](#development-setup)
- [Code Style & Conventions](#code-style--conventions)
- [Branch & Commit Conventions](#branch--commit-conventions)
- [Pull Request Process](#pull-request-process)
- [CI Pipeline & Required Checks](#ci-pipeline--required-checks)
- [Testing Guidelines](#testing-guidelines)
- [Security & Secrets](#security--secrets)
- [Legal & Compliance Constraints](#legal--compliance-constraints)
- [How to Report Bugs & Request Features](#how-to-report-bugs--request-features)
- [Code Ownership](#code-ownership)
- [Questions](#questions)

---

## Project Overview

ANTIGRAVITY is the open-source monorepo behind a family of products built by [Joshua Coleman](https://github.com/Trollz1004) and AI co-founders (Claude, Gemini, Perplexity, Grok). The mission: build real, useful things, run them well, and route proceeds toward children who need medical care.

### Live Products

| Project | Status | URL |
|---------|--------|-----|
| YouAndINotAI | Live | <https://youandinotai.com/> |
| OnlineRecycle | Live | <https://onlinerecycle.org/> |
| AI-Solutions.Store | Live | <https://ai-solutions.store/> |
| AIDoesItAll | Live | <https://www.aidoesitall.website/> |
| Dashboard | Live | <https://dashboard.aidoesitall.website/> |

### Architecture Summary

```
Frontend (React 19 / Next.js / Vite / Electron)
        │
        ▼
FastAPI Backend (Python 3.12) ──► PostgreSQL / SQLite / Redis
        │
        ▼
Square Payments (webhooks) ──► 1-wallet revenue model
        │
        ▼
Cloudflare (Pages + Workers + Tunnels) + GCP Cloud Run
```

---

## Repository Policy

This project enforces a strict **1-repo, 1-folder, 1-branch** policy:

| Rule | Detail |
|------|--------|
| **One repo** | `Trollz1004/ANTIGRAVITY` on GitHub — that's it |
| **One folder** | `C:\ANTIGRAVITY` on every node |
| **One branch** | `main` is the only long-lived branch |
| **Monorepo manager** | pnpm workspaces (`pnpm-workspace.yaml`) |
| **Node engine** | `>=20` |
| **Package manager** | `pnpm@9.15.4` |

Never create a separate repository for work that belongs in this monorepo. Never push to a repo other than `Trollz1004/ANTIGRAVITY`.

---

## Directory Structure

```
ANTIGRAVITY/
├── apps/                       # Deployable frontends & full-stack apps (pnpm workspace)
│   ├── antigravity-cockpit/    # Operator cockpit
│   ├── command-center/         # Next.js social content approval dashboard
│   ├── dashboard/              # Vite operator dashboard (Cloudflare Pages)
│   ├── mission-control/        # Vite + Playwright mission-control UI
│   ├── opuspawclaw/            # Vite + Electron + React 19 desktop AI workstation
│   └── youandinotai-frontend/  # Next.js 15 / React 19 / Prisma — youandinotai.com
├── services/                   # Long-running backend servers (pnpm workspace)
│   ├── hermes-router/          # Python multi-provider LLM router (localhost:11435)
│   ├── mission-control-api/    # Mission-control backend
│   └── mission-mcp/            # MCP server kernel (TypeScript, vitest, 57 tests)
├── backend/
│   └── fastapi-app/            # FastAPI app (Python 3.12) — 80% test coverage gate
├── packages/                   # Shared libraries (pnpm workspace)
├── tools/                      # Dev tools (pnpm workspace)
├── contracts/                  # Hardhat + Solidity smart contracts
│   └── src/                    # CharityRouter100, DatingRevenueRouter, GospelDonation, PlatformSplitter10
├── scripts/                    # Operations, deployment, automation (Python + PowerShell)
│   └── clawx-control/          # opus-guardian.py (security invariants)
├── infra/                      # Infrastructure as code (Cloudflare Workers, etc.)
├── briefings/                  # REPOSITORY_RECORD.md, runbooks, doctrine
├── docs/                       # Architecture, governance, product documentation
├── memory/                     # Persistent agent memory
├── _deploy/                    # Built artifacts for Cloudflare Pages targets
├── .claude/                    # Claude Code config (settings, agents, commands, hooks)
├── .github/workflows/          # CI workflows (ci-validate, deploy-gcr, etc.)
└── .graphify/                  # Knowledge graph artifacts
```

> **Historical note:** Legacy folders (`antigravity/`, `frontend/`, `youandinotai/`, `paperclip*`) persist at the root from the pre-monorepo era. They are **not** in pnpm workspaces — treat as legacy unless a CI workflow path explicitly references them.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Next.js 15, Vite, Electron, Tailwind CSS v4, TypeScript 6.x |
| **Backend** | FastAPI (Python 3.12), Node.js workers |
| **Edge** | Cloudflare Pages, Cloudflare Workers, Cloudflare Tunnels |
| **Cloud** | Google Cloud Run (API tier) |
| **Payments** | Square (primary); Stripe is legacy/sunset |
| **AI Orchestration** | Local Ollama + Ollama Cloud + Nous Research, multi-provider via Hermes router (`localhost:11435`) |
| **Data** | PostgreSQL, Cloudflare D1, Qdrant, SQLite, Redis |
| **Smart Contracts** | Hardhat, Solidity |
| **Testing** | pytest (backend), vitest (JS/TS), Playwright (browser MCP) |

---

## Development Setup

### Prerequisites

- **Node.js** >= 20
- **pnpm** 9.15.4
- **Python** 3.12
- **Git** (configured with GitHub credentials)
- **Docker** (optional, for local PostgreSQL/Qdrant/Redis)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/Trollz1004/ANTIGRAVITY.git
cd ANTIGRAVITY

# Install all workspace dependencies
pnpm install --frozen-lockfile

# Set up environment variables
cp .env.example .env
# Edit .env with your actual values (see .env.example for all 67 keys)
```

> **IMPORTANT:** Real secrets live in the OneDrive Personal Vault (`C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env`). Never commit `.env` files to git. The `.env.example` file is the authoritative key list — it is committed, but contains only placeholder values.

### Environment Variables

The project uses `.env` files with 67 keys covering all services. Copy `.env.example` to `.env` and fill in real values. Key categories:

- **Anthropic / Claude** — `ANTHROPIC_API_KEY`, `ANTHROPIC_ADMIN_KEY`
- **Google / Gemini / GCP** — `GEMINI_API_KEY`, `GCP_PROJECT_ID`
- **Cloudflare** — `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`
- **Square** — `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, webhook keys
- **GitHub** — PAT stored in Windows Credential Manager (not `.env`)
- **JWT** — `JWT_SECRET` (minimum 32 characters)
- **Database** — `DATABASE_URL`, `POSTGRES_*`
- **AI / Ollama** — `OLLAMA_HOST`, `OLLAMA_MODEL`

### Running the Project

```bash
# Root-level monorepo commands
pnpm dev:web         # Start @antigravity/web dev server
pnpm dev:dashboard   # Start @antigravity/dashboard dev server
pnpm dev:openclaw    # Start @antigravity/openclaw dev server
pnpm build           # Build all workspaces (pnpm -r build)
pnpm typecheck       # Type-check all workspaces (pnpm -r typecheck)
pnpm test            # Run all test suites (pnpm -r test)
pnpm format          # Format all code (prettier --write .)
```

### FastAPI Backend (`backend/fastapi-app/`)

```bash
cd backend/fastapi-app
pip install -r requirements.txt
pip install pytest pytest-cov pytest-asyncio aiosqlite black ruff

# Required env vars for local dev / CI parity
export JWT_SECRET='ci-test-secret-that-is-at-least-32-characters-long'
export APP_ENV=test
export SQUARE_WEBHOOK_VERIFY_SIGNATURE=true

# Lint + format
black --check .
ruff check .

# Run tests (80% coverage gate — hard fail below)
pytest --tb=short --cov=app --cov-report=term-missing --cov-fail-under=80
```

### Mission MCP (`services/mission-mcp/`)

```bash
cd services/mission-mcp
pnpm build              # tsup
pnpm test               # vitest (57 tests)
pnpm typecheck
pnpm start              # stdio transport
pnpm start:http         # MISSION_MCP_TRANSPORT=http
```

### Frontend (`frontend/react-app/`)

```bash
cd frontend/react-app
npm install
npm run dev             # Vite dev server
npm run build           # Production build
npm run lint            # ESLint
npx eslint src --ext .ts,.tsx
npx prettier --check "src/**/*.{ts,tsx,json,css}"
```

### Smart Contracts (`contracts/`)

```bash
cd contracts
pnpm install
pnpm test               # Hardhat test suite (47 tests for PlatformSplitter10)
pnpm compile            # Hardhat compile
```

### Security Invariants Check

```bash
python scripts/clawx-control/opus-guardian.py
# Runs 8 security invariants; current score 96%
```

---

## Code Style & Conventions

### TypeScript / JavaScript (Frontend)

- **Formatter:** Prettier (config: `.prettierrc`)
  - Semi-colons: yes
  - Single quotes
  - Trailing commas: all
  - Print width: 120
  - Tab width: 2
  - Arrow parens: always
- **Linter:** ESLint (extends `react-app`)
  - `no-console: warn`, `no-debugger: warn`
  - `prefer-const: error`, `no-var: error`
- **Testing:** Vitest (jsdom environment)
- **React 19** with TypeScript 5.x+
- Format on save is configured via PostToolUse hook in Claude Code

### Python (Backend)

- **Formatter:** Black (line-length 88, target py39)
- **Linter:** Ruff (selects: E, W, F, I, C, B, UP, SIM, ARG)
- **Target version:** Python 3.9+ (runtime: 3.12)
- **Testing:** pytest with pytest-cov and pytest-asyncio
- **Coverage gate:** 80% minimum (hard fail below)
- Match existing style; no comments unless the WHY is non-obvious
- Use type hints where possible
- Include docstrings for public functions and classes

### General

- **No mock/simulation data** — use real values or fail honestly
- **No `donate*` / charity language** on active surfaces (CI scan blocks it)
- **No placeholder implementations** in production code (no `raise NotImplementedError`, `pass  # TODO`, `# PLACEHOLDER`)
- **Prefer `trash` over `rm`** for file deletion
- **Graphify:** After modifying code files, run `npx graphify hook-rebuild` to keep the knowledge graph current

---

## Branch & Commit Conventions

### Branch Naming

All work is done on **short-lived branches** off `main`. Branches are deleted immediately after merging.

| Prefix | When to use |
|--------|------------|
| `feat/<description>` | New feature work |
| `fix/<description>` | Bug fix |
| `chore/<description>` | Tooling, CI, or repo maintenance |
| `docs/<description>` | Documentation only |
| `claude/<description>` | Claude Code agent sessions |
| `codex/<description>` | CodeX/Copilot agent sessions |

Examples: `feat/video-rooms`, `fix/webhook-replay`, `chore/ci-coverage-gate`, `docs/api-reference`

### Commit Message Format

Follow the convention visible in `git log`:

```
type(scope): message
```

**Types:** `feat`, `fix`, `test`, `docs`, `chore`, `security`, `refactor`, `style`, `perf`, `ci`

**Examples:**
```
fix(ci): correct doctrine drift scan target paths
feat(mission-mcp): add completed_at field to task model
test(coverage): raise gate from 63% to 80%
docs(paperclip): add PaperClip HQ cutover notes
chore(audit): remove stale Stripe links from legacy folders
security(webhooks): add HMAC verification to Square payment webhooks
```

Use `[skip ci]` only for automated audit commits.

---

## Pull Request Process

1. **Branch off `main`:** `git checkout -b feat/my-change`
2. **Make small, focused commits** following the commit convention above
3. **Open a pull request** targeting `main` (ready for review, not draft)
4. **All CI checks must pass** (see below)
5. **At least 1 CODEOWNER review** is required before merging
6. **Merge strategy:**
   - Feature/fix PRs → **Squash and Merge**
   - Release/chore PRs → **Merge Commit**
7. **Delete the branch** immediately after merge (auto-delete is enforced)

### PR Auto-Merge Policy

Pull requests authored by **first-party Claude Code** (the actual Anthropic runtime) may auto-merge once required CI checks pass. Third-party Claude wrappers, mirrors, or proxies do NOT inherit this authority — their PRs require manual review.

### PR Description Template

```markdown
## Summary
Brief description of the changes.

## Details
More detailed explanation of the implementation.

## Testing
How were these changes tested? Include test commands and results.

## Related Issues
Fixes #123
```

---

## CI Pipeline & Required Checks

Every PR to `main` must pass all of the following CI jobs, defined in `.github/workflows/ci-validate.yml`:

| Job | What it validates |
|-----|------------------|
| `validate` | Build, secret scan, doctrine drift scan, §496.405 language scan, TODO/FIXME scan, placeholder scan |
| `eslint-prettier-check` | TypeScript/React style (ESLint + Prettier on `frontend/react-app/`) |
| `black-ruff-check` | Python style (Black + Ruff on `backend/fastapi-app/`) |
| `run-tests` | Backend test suite (pytest, minimum **80% coverage**) |
| `js-tests` | Frontend test suite (vitest via `pnpm test`) |
| `guardian-check` | Opus Guardian security invariants (`opus-guardian.py`) |

All jobs feed into a single aggregator gate named **`code`** — this is the required status check for branch protection.

### What the CI Scans For

- **Stale Stripe links** — `buy.stripe.com` must not appear in built output (Square only)
- **§496.405 language** — `donate/donation/donations/donating` blocked in customer-facing code (with allowlisted exceptions)
- **Doctrine drift** — `ai-solutions.store`, `CharityRouter100`, `60/30/10`, `100% to charity` blocked in live product code
- **Secrets** — API keys, tokens, and credential patterns blocked in tracked files
- **TODO/FIXME** — Flagged in production code (warning, not error)
- **Placeholder implementations** — Flagged for review (notice level)

---

## Testing Guidelines

### Backend Tests (pytest)

```bash
cd backend/fastapi-app
pytest --tb=short --cov=app --cov-report=term-missing --cov-fail-under=80
```

- **Coverage requirement:** 80% minimum (hard fail below)
- Tests live in `backend/fastapi-app/tests/`
- 48 test files covering auth, webhooks, billing, profiles, safety, revenue allocation, etc.
- Use `conftest.py` for shared fixtures
- Use `pytest-asyncio` for async endpoint tests
- Use `freezegun` for time-dependent tests

### Frontend Tests (vitest)

```bash
cd frontend/react-app
npx vitest run
# or from root:
pnpm test
```

- Tests live alongside source: `src/**/*.test.tsx`, `src/**/*.test.ts`
- Environment: jsdom
- Config: `vitest.config.ts`

### Mission MCP Tests

```bash
cd services/mission-mcp
pnpm test  # vitest, 57 tests
```

### Smart Contract Tests

```bash
cd contracts
pnpm test  # Hardhat, 47 tests for PlatformSplitter10
```

### Writing Good Tests

- Test behavior, not implementation
- Use descriptive test names: `test_webhook_rejects_replayed_payloads`
- Cover edge cases: malformed input, missing auth, expired tokens
- For API tests: test both success and error responses
- For webhook tests: verify signature validation, replay protection, and idempotency
- Do NOT use mock data — use realistic test fixtures or fail honestly

---

## Security & Secrets

### Rules

- **NEVER commit secrets** to git. Use `.env` files exclusively (gitignored)
- **GitHub PAT** lives in Windows Credential Manager, not in `.env`
- **Master env vault:** `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env` (OneDrive-backed, outside the repo)
- The `.env.example` file is the authoritative key list (67 keys) and IS committed — values are placeholders only
- CI includes a secret scanner that blocks commits containing API keys, tokens, or credential patterns

### Security Architecture (Opus Guardian)

Run `python scripts/clawx-control/opus-guardian.py` to check 8 security invariants:

1. Zero Secrets in Source
2. Auth on Every Endpoint
3. Legacy Routing Drift Blocker
4. Revenue Split is CODE not CONFIG
5. PII Isolation
6. No Raw SQL
7. Input Validation
8. CORS Locked

Current score: **96%**. These invariants are permanent — build on them, don't weaken them.

### Reporting Security Vulnerabilities

**Do not report security vulnerabilities through public GitHub issues.**

Email: `[EMAIL]` with:
- Description of the vulnerability and its potential impact
- Steps to reproduce or proof-of-concept
- Component(s) affected
- Any special configuration required

Response time: within 48 hours, with updates every 5 days.

See [SECURITY.md](./SECURITY.md) for full details.

---

## Legal & Compliance Constraints

### Florida Statute §496.405

Customer-facing code must NOT use "donate", "donation", "donations", "donating", or similar solicitation language. This is a legal requirement under Florida's Charitable Solicitations Act. The CI pipeline scans for and flags violations.

### Revenue Model (1-Wallet)

- All platform revenue lands in a single founder-controlled wallet
- All costs leave from the same wallet
- A minimum 10% reserve is set aside automatically — this is the founder's taxable income
- No active surface (code, UI, docs) may claim charity routing, automatic disbursement, or percent-to-charity splits
- Historical chain artifacts (`GospelDonation.sol`, split-era percentages) are history only — do not use as current doctrine

### What You Must Never Do

- Push directly to `main` (branch protection prevents this)
- Leave a branch open after its PR is merged
- Introduce `buy.stripe.com` links — Square only
- Use "contractual revenue disbursement" terms in customer-facing code
- Reference retired `60/30/10` or `100% to charity` routing in live product code
- Commit secrets — use `.env` files exclusively (never committed)
- Use mock/simulation data in production code
- Weaken Opus Guardian security invariants

---

## How to Report Bugs & Request Features

### GitHub Issues

For bugs, feature requests, and architectural questions, open a GitHub Issue on `Trollz1004/ANTIGRAVITY`:

- **Bug reports:** Include steps to reproduce, expected behavior, actual behavior, and affected component(s)
- **Feature requests:** Describe the use case and proposed approach
- **Questions:** Use the `question` label

### Paperclip OPU System

This project uses the Paperclip OPU (Orchestration & Processing Unit) system for task management and agent coordination. When working within the Paperclip ecosystem:

- Tasks are tracked via the `mission-mcp` service (`create_task`, `list_tasks`, `update_task`)
- Issues are tracked via `create_issue` / `resolve_issue`
- Agent coordination happens through the Hermes router (`localhost:11435`)
- For OPU-specific issues, reference the OPU task ID in your PR or issue

### Governance & Policy Questions

For architectural or policy questions, open a GitHub Issue with the `question` label. For governance docs, see `docs/governance/GOVERNANCE.md`.

---

## Code Ownership

CODEOWNERS are defined in `.github/CODEOWNERS`. The global owner is `@Trollz1004`. All PRs require at least one approval from the listed owner before merging.

---

## Questions?

- **General questions:** Open a GitHub Issue with the `question` label
- **Security issues:** See [SECURITY.md](./SECURITY.md) (do not use public issues)
- **Architecture docs:** See the `docs/architecture/` directory
- **Operational runbooks:** See the `briefings/` directory
- **API documentation:** See `docs/api.md`
- **Governance:** See `docs/governance/GOVERNANCE.md`

---

<div align="center">

**#UntilNoKidInNeed · For the kids · #TeamClaudeForLife**

</div>
