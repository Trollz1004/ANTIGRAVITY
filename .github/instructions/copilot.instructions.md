---
    description: Copilot instructions for effective work in the ANTIGRAVITY monorepo
    applyTo: '**'
---

# Copilot Instructions for ANTIGRAVITY

This file helps Copilot sessions work effectively in the ANTIGRAVITY monorepo. Refer to authoritative docs (`AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`) for current operating rules.

---

## Build, Test, and Lint Commands

### Monorepo Overview
- **Package Manager:** pnpm 9.15.4 (required)
- **Node.js:** ≥20
- **Workspace Definition:** `pnpm-workspace.yaml` defines app, services, and tools folders

### Common Commands

```bash
# Monorepo-wide
pnpm install              # Install all workspace dependencies
pnpm build                # Build all apps/services
pnpm test                 # Run all test suites (JS/TS + Python)
pnpm typecheck            # TypeScript type-check all packages
pnpm format               # Prettier format (write)
pnpm format --check       # Prettier check (no write)

# Frontend: YouAndINotAI React App
cd frontend/react-app
npm install               # Install local deps
npm run build             # Production build → outputs to apps/youandinotai-static
npm run dev               # Local dev server
npx eslint src            # Lint TypeScript/React
npx prettier --check src  # Format check

# Backend: FastAPI
cd backend/fastapi-app
pip install -r requirements.txt
pytest                    # Run all tests with coverage
pytest tests/test_<name>.py::test_<fn>  # Single test
python -m black --check .  # Format check
python -m ruff check .     # Lint check

# Mission Control Dashboard
cd apps/mission-control
pnpm install
pnpm build                # Build dashboard
pnpm dev                  # Dev server

# Single App Tests (vitest)
cd apps/youandinotai-frontend
pnpm test                 # Run Vitest suite
pnpm test --watch         # Watch mode
pnpm test <filename>      # Single file
```

### CI Gates (Local Run Before Commit)
The GitHub Actions CI runs these gates on `main` branch. Run them locally to catch failures:

```bash
# CI Validate suite
python apps/paperweight/test_paperweight.py  # Unit tests
cd apps/youandinotai-frontend && npm ci && npm run build  # Build check

# Black + Ruff (Python)
cd backend/fastapi-app
python -m black --check .
python -m ruff check .

# ESLint + Prettier (JavaScript/TypeScript)
cd frontend/react-app
npx eslint src --ext .ts,.tsx
npx prettier --check "src/**/*.{ts,tsx,json,css}"
```

---

## High-Level Architecture

### Product Ecosystem
ANTIGRAVITY operates four customer-facing products:

- **YouAndINotAI** (`youandinotai.com`) — Dating platform with Bot-Shield verification, membership, events
- **Business Exchange** (`aidoesitall.website`) — B2B marketplace for services and referrals
- **AI-Solutions Store** (`ai-solutions.store`) — Digital products and automation tools
- **OnlineRecycle** (`onlinerecycle.org`) — Central Florida electronics recycling and resale

All are built in this single repository.

### Node Roles
The ecosystem runs across three nodes:

| Node | IP | Role | Services |
|------|-----|------|----------|
| **Sabretooth** | 192.168.0.8 | Primary orchestrator | Hermes agent execution, Paperclip HQ, API routing, local model workloads |
| **T5500** | 192.168.0.15 | Public front door | Cloudflare tunnels, domains, payments (Square), static assets, Wrangler deployments |
| **9020** | 192.168.0.5 | Dev/support (standby) | Development checkout, support workflows |

### Technology Stack

**Frontend:** React 19, Next.js, Vite, TypeScript, Tailwind CSS v4, Electron

**Backend:** FastAPI / Python, Node.js workers, Express

**Data:** PostgreSQL, Redis, Qdrant, SQLite, Cloudflare D1

**AI & Orchestration:** Hermes router, Paperclip HQ, FCC Claude adapter, Ollama, Google GenAI

**Commerce:** Square (primary, live), Stripe (legacy, prohibited on dating surfaces)

### Monorepo Structure
```
C:\antigravity\
├── apps/                           # Deployable applications
│   ├── youandinotai-frontend/      # Dating app React frontend
│   ├── mission-control/            # Dashboard
│   ├── opuspawclaw/                # Support interface
│   └── youandinotai-static/        # Build output (CF Pages)
├── services/                       # Long-running services
│   ├── hermes-router/              # Orchestration engine
│   ├── mission-control-api/        # Backend API (Python)
│   └── mission-mcp/                # MCP server
├── backend/fastapi-app/            # FastAPI primary app
├── frontend/react-app/             # React dev source
├── hermes/agents/                  # Agent contracts
├── brain-mcp/                      # BRAIN MCP server
├── AGENTS.md                       # Operating rules (2026-06-22)
├── CLAUDE.md                       # Claude guidance
├── CONTRIBUTING.md                 # Contribution rules
└── briefings/                      # Doctrine files
```

---

## Key Conventions

### Authority & Doctrine
- **Current rule set:** `AGENTS.md` (2026-06-22)
- **Claude-specific:** `CLAUDE.md`
- **Public copy:** `briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md`

### Secrets & Environment
- Never commit secrets; do not print, paste, or infer sensitive keys
- Env authority is local handoff, not in repo (`.env.example` only)
- Do not read `.fcc\.env`

### Payment & Commerce
- **Primary rail:** Square (live, production)
- **Prohibited on dating surfaces:** Stripe (legacy, sunset path)
- **Payment copy rule:** Describe only the product being bought; no legal structure or control-rights language

### Code Quality & Policy Checks
1. **No Stripe on YouAndINotAI:** CI enforces regex scan for Stripe patterns
2. **Doctrine boundary:** CI scans for stale routing references
3. **Secrets scan:** CI detects API key patterns
4. **TODO detection:** CI flags `TODO`, `FIXME`, `TEMPORARY` comments
5. **Florida §496.405:** CI warns about donation language

### Test & Linting Standards
- **Python:** Black (formatter), Ruff (linter), pytest (test runner)
- **JavaScript/TypeScript:** ESLint, Prettier, Vitest
- Use only existing tools in the workflow

### Build Output
- **Frontend build:** `apps/youandinotai-static/` (committed for Cloudflare Pages)
- Remove stale assets when refreshing

### Hermes & Paperclip
- **Hermes Workspace:** `http://127.0.0.1:3000`
- **Hermes Dashboard:** `http://127.0.0.1:9119`
- **Paperclip HQ:** `http://127.0.0.1:3110`
- **FCC Claude:** `http://127.0.0.1:8082/admin`
- **Start/repair:** `powershell -NoProfile -ExecutionPolicy Bypass -File c:\antigravity\scripts\start-paperclip-hermes.ps1`

### Deployment & Verification
- Before claiming done: verify git status, run relevant build/test, check public URLs, review changes, push to `origin/main`
- After node-level changes: sync T5500 and 9020 if edit affects node behavior

### Drift Quarantine
`C:\Users\joshl\OneDrive\Microsoft Copilot Chat Files\` is historical export drift — do not use as reference. Repo files (`AGENTS.md`, `CLAUDE.md`) take precedence.

---

## MCP Servers

Configuration in `.mcp.json`:

- **brain-mcp** — Operational context and versioning
- **playwright** — Web automation and cross-browser testing
- **mission-mcp** — Mission control API integration
- **youandinotai-paperclip-memory** — Paperclip memory for date app ops

Playwright is useful for testing YouAndINotAI, AI-Solutions Store, and other customer surfaces.

---

## Quick Reference

| Task | Command |
|------|---------|
| Build monorepo | `pnpm build` |
| Run all tests | `pnpm test` |
| Lint frontend | `cd frontend/react-app && npx eslint src` |
| Lint backend | `cd backend/fastapi-app && python -m ruff check .` |
| Format code | `pnpm format` |
| Build YouAndINotAI | `cd apps/youandinotai-frontend && npm run build` |
| Start Hermes | `powershell -NoProfile -ExecutionPolicy Bypass -File c:\antigravity\scripts\start-paperclip-hermes.ps1` |

---

## Authority

For current operating context, refer to:
- `AGENTS.md` (primary operating brief)
- `CLAUDE.md` (Claude-specific)
- `agent.md` (Hermes universal prompt)
- `CONTRIBUTING.md` (contribution rules)
- `briefings/` (authoritative doctrine and setup files)

Joshua Coleman is the sole human authority for this repository.
