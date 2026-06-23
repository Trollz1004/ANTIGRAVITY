# Contributor Onboarding Runbook

Welcome to ANTIGRAVITY! This guide walks you from zero to a fully running local environment, step by step. If you get stuck, check [Common Issues](#common-issues--troubleshooting) or open an issue.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1: Clone the Repository](#step-1-clone-the-repository)
- [Step 2: Install Dependencies](#step-2-install-dependencies)
- [Step 3: Environment Setup](#step-3-environment-setup)
- [Step 4: Start Embedded PostgreSQL (for Paperclip)](#step-4-start-embedded-postgresql-for-paperclip)
- [Step 5: Start Paperclip Core](#step-5-start-paperclip-core)
- [Step 6: Start Mission Control Frontend](#step-6-start-mission-control-frontend)
- [Step 7: Start Backend Services (FastAPI)](#step-7-start-backend-services-fastapi)
- [Step 8: Verify Everything Is Running](#step-8-verify-everything-is-running)
- [Where to Find Things (Directory Map)](#where-to-find-things-directory-map)
- [How to Run Tests](#how-to-run-tests)
- [How to Submit Changes](#how-to-submit-changes)
- [Common Issues & Troubleshooting](#common-issues--troubleshooting)

---

## Prerequisites

Before you begin, make sure you have the following installed:

| Tool | Minimum Version | Purpose |
|------|----------------|---------|
| **Node.js** | 20+ | Frontend apps, pnpm workspace |
| **pnpm** | 9.x (9.15.4 recommended) | Monorepo package manager |
| **Python** | 3.10+ | Backend FastAPI services |
| **Git** | Any recent version | Source control |
| **PostgreSQL** | 14+ (or use embedded) | Paperclip data layer |

### Quick Install Commands

**macOS (Homebrew):**
```bash
brew install node@20 pnpm python@3.14 postgresql@14 git
```

**Ubuntu / Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs python3.14 python3.14-venv postgresql git
npm install -g pnpm@9.15.4
```

**Windows (WSL2 recommended):**
```bash
# In WSL2 Ubuntu terminal:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs python3 python3-venv postgresql git
npm install -g pnpm@9.15.4
```

Verify your versions:
```bash
node --version    # v20.x.x or higher
pnpm --version    # 9.x.x
python3 --version # 3.10 or higher
git --version     # any recent version
```

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/Trollz1004/ANTIGRAVITY.git
cd ANTIGRAVITY
```

If you plan to submit changes, fork the repo first on GitHub, then clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/ANTIGRAVITY.git
cd ANTIGRAVITY
git remote add upstream https://github.com/Trollz1004/ANTIGRAVITY.git
```

---

## Step 2: Install Dependencies

This is a pnpm monorepo. One command installs everything:

```bash
pnpm install
```

This installs dependencies for all workspace packages across `apps/`, `services/`, `packages/`, and `tools/`.

If you only need a subset of the workspace, you can scope the install:
```bash
pnpm install --filter @antigravity/web
```

---

## Step 3: Environment Setup

Most services require environment variables. Copy the example files and fill in your values:

```bash
# From the repo root:
cp .env.example .env
```

### Key Environment Variables

| Variable | Required By | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | Paperclip, FastAPI | PostgreSQL connection string |
| `JWT_SECRET` | FastAPI services | Secret key for JWT membership record signing |
| `SQUARE_ACCESS_TOKEN` | Payment flows | Square API access membership record |
| `SQUARE_ENVIRONMENT` | Payment flows | `sandbox` or `production` |
| `GOOGLE_API_KEY` | Gemini integrations | Google AI Studio API key |
| `ANTHROPIC_API_KEY` | Claude integrations | Anthropic API key |
| `OLLAMA_BASE_URL` | Local AI routing | Ollama server URL (default: `http://localhost:11434`) |
| `HERMES_ROUTER_URL` | AI orchestration | Hermes router (default: `http://localhost:11435`) |
| `PORT` | Various services | Override default port per service |

### Service-Specific `.env` Files

Some services have their own `.env` files. Check these locations:

- `services/mission-control-api/.env`
- `apps/mission-control/.env`
- `backend/fastapi-app/.env`

If a `.env.example` exists in any of these directories, copy it:
```bash
cp services/mission-control-api/.env.example services/mission-control-api/.env
```

---

## Step 4: Start Embedded PostgreSQL (for Paperclip)

Paperclip requires a PostgreSQL database. If you don't have a running instance, you can use the embedded option or start one locally.

### Option A: Local PostgreSQL (Recommended)

```bash
# Start PostgreSQL service
sudo service postgresql start    # Linux
brew services start postgresql   # macOS

# Create the database
sudo -u postgres createdb paperclip
sudo -u postgres createuser --interactive  # Create a user if needed
```

Set your `DATABASE_URL`:
```bash
export DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/paperclip"
```

### Option B: Docker PostgreSQL

```bash
docker run -d \
  --name paperclip-db \
  -e POSTGRES_DB=paperclip \
  -e POSTGRES_USER=antigravity \
  -e POSTGRES_PASSWORD=antigravity \
  -p 5432:5432 \
  postgres:14
```

Then set:
```bash
export DATABASE_URL="postgresql://antigravity:antigravity@localhost:5432/paperclip"
```

### Run Migrations

Once PostgreSQL is running, apply the database schema:

```bash
cd services/paperclip  # or wherever migrations live
python manage.py migrate
# or
alembic upgrade head
```

---

## Step 5: Start Paperclip Core

Paperclip is the orchestration and issue-tracking layer. It runs on `localhost:3100` by default.

```bash
# From the repo root:
paperclipai run
```

Or if running from source:
```bash
cd services/paperclip
python -m paperclipai run
```

Paperclip will be available at:
- **API:** `http://localhost:3100/api`
- **Dashboard:** `http://localhost:3100`

Verify it's running:
```bash
curl http://localhost:3100/api/health
# Expected: {"status": "ok"} or similar
```

---

## Step 6: Start Mission Control Frontend

Mission Control is the React/Vite frontend for the operator dashboard.

```bash
pnpm --filter mission-control dev
```

This starts the Vite dev server, typically at:
- **Frontend:** `http://localhost:5173` (Vite default)
- **Alternative:** Check the terminal output for the exact URL

The dev server supports hot module replacement (HMR), so changes to React components are reflected instantly.

### Other Frontend Apps

```bash
# Dashboard app
pnpm --filter @antigravity/dashboard dev

# OpenClaw desktop app (Electron)
pnpm --filter @antigravity/openclaw dev
```

---

## Step 7: Start Backend Services (FastAPI)

The backend services are Python/FastAPI applications.

### Mission Control API

```bash
cd services/mission-control-api
python -m uvicorn mission_control_api.main:app --reload --port 8000
```

Available at:
- **API:** `http://localhost:8000`
- **Docs (Swagger UI):** `http://localhost:8000/docs`
- **Docs (ReDoc):** `http://localhost:8000/redoc`

### Main FastAPI App (YouAndINotAI API)

```bash
cd backend/fastapi-app
python -m uvicorn main:app --reload --port 8001
```

### Setting Up the Python Virtual Environment

It's recommended to use a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate    # Linux/macOS
# .venv\Scripts\activate     # Windows

pip install -r requirements.txt
```

### CEO Service

The CEO service runs on `localhost:5555`:

```bash
cd services/ceo
python -m uvicorn main:app --reload --port 5555
```

---

## Step 8: Verify Everything Is Running

Run these health checks to confirm all services are up:

```bash
# Paperclip (issue tracker / orchestration)
curl http://localhost:3100/api/health

# Mission Control API
curl http://localhost:8000/docs

# CEO service
curl http://localhost:5555/docs

# Frontend (should return HTML)
curl -I http://localhost:5173
```

### Expected Running Services Summary

| Service | URL | Purpose |
|---------|-----|---------|
| Paperclip | `http://localhost:3100` | Orchestration, issue tracking |
| Mission Control API | `http://localhost:8000` | Backend API |
| CEO | `http://localhost:5555` | Executive operations |
| Mission Control Frontend | `http://localhost:5173` | React dashboard |
| FastAPI App | `http://localhost:8001` | YouAndINotAI API |

---

## Where to Find Things (Directory Map)

```
ANTIGRAVITY/
├── apps/                          # Deployable applications
│   ├── mission-control/           # React/Vite operator dashboard
│   ├── antigravity-cockpit/       # Cockpit app
│   ├── opuspawclaw/              # Vite + Electron desktop AI workstation
│   ├── command-center/            # Social content approval dashboard
│   └── dashboard/                 # Operator dashboard
│
├── services/                      # Long-running backend servers
│   ├── mission-control-api/       # FastAPI mission control API
│   ├── mission-mcp/              # MCP server for mission control
│   └── paperclip/                # Paperclip orchestration layer
│
├── backend/                       # Backend applications
│   └── fastapi-app/              # FastAPI + SQLAlchemy (YouAndINotAI API)
│
├── frontend/                      # Frontend applications
│   └── react-app/                # Shared React frontend
│
├── packages/                      # Shared libraries and utilities
│
├── infra/                         # Infrastructure as code
│   └── paperclip-worker/         # Cloudflare Worker for Paperclip HQ
│
├── tools/                         # Internal developer tools
│
├── scripts/                       # Operations, deployment, automation scripts
│
├── briefings/                     # Operational briefings, runbooks, doctrine
│
├── memory/                        # Persistent agent memory
│
├── docs/                          # Documentation (you are here!)
│   ├── contributing.md            # Contribution guidelines
│   ├── architecture.md            # System architecture overview
│   ├── workflows.md               # Business workflow documentation
│   └── onboarding.md              # This file
│
├── package.json                   # Root package.json (pnpm@9.15.4, Node >=20)
├── pnpm-workspace.yaml            # Workspace definition
└── README.md                      # Project overview
```

---

## How to Run Tests

### Backend Tests (Python)

```bash
# Run all backend tests
cd backend/fastapi-app
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run a specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v
```

### Frontend Tests (JavaScript/TypeScript)

```bash
# From repo root, run all workspace tests
pnpm -r test

# Run tests for a specific app
pnpm --filter mission-control test

# Run with coverage
cd apps/mission-control
pnpm test -- --coverage
```

### Linting & Type Checking

```bash
# Format all code
pnpm format

# Type check all TypeScript packages
pnpm -r typecheck

# Python linting
cd backend/fastapi-app
ruff check .
black --check .
```

### Pre-commit Hooks

Pre-commit hooks run automatically on `git commit`. Install them with:

```bash
pre-commit install
```

---

## How to Submit Changes

### Branch Naming

| Prefix | Use For |
|--------|---------|
| `feature/` | New features |
| `bugfix/` | Bug fixes |
| `hotfix/` | Urgent production fixes |
| `docs/` | Documentation updates |
| `chore/` | Maintenance, dependencies |

### Workflow

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit with clear messages:
   ```bash
   git add .
   git commit -m "feat: add user profile editing"
   ```

   Commit message format: `type: description` where type is `feat`, `fix`, `docs`, `chore`, `refactor`, or `test`.

3. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Open a Pull Request** on GitHub with:
   - Clear title describing the change
   - Description of what and why
   - Testing steps
   - Related issue references (e.g., `Fixes #123`)

5. **Request review** from a maintainer.

### PR Checklist

- [ ] Tests pass locally
- [ ] Code is formatted (Prettier for JS/TS, Black for Python)
- [ ] Linting passes (ESLint, Ruff)
- [ ] Documentation updated if needed
- [ ] No secrets or credentials committed

---

## Common Issues & Troubleshooting

### `pnpm install` fails

**Symptom:** Errors during `pnpm install`.

**Solutions:**
```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check Node version
node --version  # Must be >= 20
```

### PostgreSQL connection refused

**Symptom:** `Connection refused` or `could not connect to server`.

**Solutions:**
```bash
# Check if PostgreSQL is running
sudo service postgresql status    # Linux
brew services list | grep postgres # macOS

# Start PostgreSQL
sudo service postgresql start
# or
brew services start postgresql@14

# Verify the DATABASE_URL matches your local setup
echo $DATABASE_URL
```

### Port already in use

**Symptom:** `EADDRINUSE` or `Port 3100/5173/8000 already in use`.

**Solutions:**
```bash
# Find the process using the port
lsof -i :3100    # macOS/Linux
netstat -ano | findstr :3100  # Windows

# Kill the process
kill -9 <PID>    # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use a different port
PORT=3101 paperclipai run
```

### Python import errors

**Symptom:** `ModuleNotFoundError` or `ImportError`.

**Solutions:**
```bash
# Ensure virtual environment is active
source .venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt

# Check Python version
python --version  # Must be 3.10+
```

### CORS errors in the browser

**Symptom:** Frontend can't reach the API, CORS errors in browser console.

**Solutions:**
- Ensure the backend service is running
- Check that the API URL in the frontend `.env` matches the running backend
- Verify CORS origins are configured in the FastAPI app

### Paperclip won't start

**Symptom:** Paperclip exits immediately or hangs.

**Solutions:**
```bash
# Check if the database is accessible
psql $DATABASE_URL -c "SELECT 1"

# Check Paperclip logs
paperclipai run --verbose

# Verify required env vars are set
env | grep -i paperclip
```

### Vite dev server shows blank page

**Symptom:** `http://localhost:5173` loads but shows nothing.

**Solutions:**
- Check the browser console for errors
- Verify the app's `.env` file has the correct API URLs
- Try a hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on macOS)
- Clear browser cache

### Git pre-commit hook fails

**Symptom:** Commit is rejected by pre-commit hooks.

**Solutions:**
```bash
# Run hooks manually to see detailed output
pre-commit run --all-files

# Auto-fix formatting issues
pnpm format
cd backend/fastapi-app && black . && ruff check . --fix

# Skip hooks in emergencies (not recommended)
git commit --no-verify
```

---

## Next Steps

Once your environment is running:

1. Read [contributing.md](./contributing.md) for coding standards and PR guidelines
2. Read [architecture.md](./architecture.md) for system design context
3. Read [workflows.md](./workflows.md) for business logic documentation
4. Check open issues on Paperclip (`http://localhost:3100`) for tasks to pick up
5. Say hi in a GitHub issue — we're happy to help you get started!

---

*This is a living document. If something is wrong or missing, please open an issue or submit a PR to update it.*
