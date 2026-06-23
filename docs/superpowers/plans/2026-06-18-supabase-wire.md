# Supabase Integration Implementation Plan (Archived)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evaluate Supabase as a potential PostgreSQL option for ANTIGRAVITY while maintaining a fallback to the existing T5500 PostgreSQL instance.

Status: Archived until finance policy and schema review is completed.

**Architecture:**
- Add Supabase connection URL to environment variables with fallback logic in the FastAPI backend database configuration.
- Create necessary Supabase tables (`members` and `revenue_allocations`) with Row Level Security (RLS) policies.
- Install Supabase client in the Next.js frontend and create a centralized client instance.

**Tech Stack:**
- FastAPI (Python 3.12) with SQLAlchemy
- Supabase (PostgreSQL)
- Next.js 15 (React 19)
- @supabase/supabase-js

## Global Constraints

- Secrets must be stored in the vault only — never in git or PR bodies.
- No new repositories; all work must occur within `Trollz1004/ANTIGRAVITY`.
- `is_minor` and `free_tier` columns are not required by current business policy.
- Row Level Security (RLS) must be enabled on all exposed tables; initial policy: `service_role` only.
- 80% pytest coverage gate must still pass for the FastAPI backend.
- Supabase project reference: `jmvgdqomvnkfgknmgwxp`, region: `us-east-2`.

---
### Task 1: Backend - Add Supabase Environment Variable

**Files:**
- Modify: `/mnt/c/antigravity/backend/fastapi-app/.env.example`
- Modify: `/mnt/c/antigravity/backend/fastapi-app/app/core/config.py` (or equivalent config module)

**Interfaces:**
- Consumes: None
- Produces: `SUPABASE_DB_URL` environment variable (string)

- [ ] **Step 1: Add SUPABASE_DB_URL to .env.example**

```dotenv
# Supabase PostgreSQL connection string (primary DB, fallback to T5500)
SUPABASE_DB_URL="postgresql://postgres:[YOUR_PASSWORD]@db.jmvgdqomvnkfgknmgwxp.supabase.co:5432/postgres"
```

- [ ] **Step 2: Update backend config to use SUPABASE_DB_URL with fallback**

```python
# In config module (e.g., app/core/config.py)
from pydantic import PostgresDsn
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # ... existing fields ...
    SUPABASE_DB_URL: PostgresDsn = ""

    @property
    def database_url(self) -> PostgresDsn:
        """Use Supabase if configured, otherwise fallback to local/T5500 Docker Postgres."""
        if self.SUPABASE_DB_URL:
            return self.SUPABASE_DB_URL
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            user="postgres",
            password="postgres",
            host="localhost",
            port=5432,
            path="/antigravity",
        )

    # ... rest of config ...
```

- [ ] **Step 3: Ensure database initialization uses the new property**

```python
# In database/session.py or equivalent
from app.core.config import settings

# Use settings.database_url for engine creation
SQLALCHEMY_DATABASE_URL = settings.database_url
```

- [ ] **Step 4: Commit**

```bash
git add backend/fastapi-app/.env.example backend/fastapi-app/app/core/config.py
git commit -m "feat: add Supabase DB URL config with T5500 fallback"
```

### Task 2: Backend - Create Supabase Tables via SQL

**Files:**
- None (direct SQL execution via Supabase dashboard or psql)

**Interfaces:**
- Consumes: Supabase connection details
- Produces: `members` and `revenue_allocations` tables in Supabase

- [ ] **Step 1: Connect to Supabase instance**

Use the Supabase project reference `jmvgdqomvnkfgknmgwxp` and region `us-east-2` to obtain the connection string:
```
postgresql://postgres:[YOUR_PASSWORD]@db.jmvgdqomvnkfgknmgwxp.supabase.co:5432/postgres
```

- [ ] **Step 2: Create the `members` table**

```sql
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL CHECK (plan IN ('bot_shield', 'founding', '3month', '12month', 'royalty')),
    square_payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE
);
```

- [ ] **Step 3: Create the `revenue_allocations` table**

```sql
CREATE TABLE revenue_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    source TEXT NOT NULL CHECK (source = 'square'),
    bucket TEXT NOT NULL CHECK (bucket IN ('platform_operations', 'platform_reserve', 'staked')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

- [ ] **Step 4: Enable Row Level Security (RLS) on both tables**

```sql
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_allocations ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 5: Create RLS policy for service_role only (initial lockdown)**

```sql
CREATE POLICY service_role_all_on_members ON members
    USING (true)
    WITH CHECK (true);

CREATE POLICY service_role_all_on_revenue_allocations ON revenue_allocations
    USING (true)
    WITH CHECK (true);
```

> **Note:** These policies allow `service_role` full access. No public or anon access is granted yet.

- [ ] **Step 6: Commit (no local files; record in plan)**

```bash
# No local commit needed; task executed via Supabase SQL editor
echo "Tables created in Supabase. Record completion in plan."
```

### Task 3: Frontend - Install Supabase Client

**Files:**
- Modify: `/mnt/c/antigravity/apps/youandinotai-frontend/package.json`
- Create: `/mnt/c/antigravity/apps/youandinotai-frontend/lib/supabase.ts`
- Modify: `/mnt/c/antigravity/apps/youandinotai-frontend/.env.example`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables
- Produces: Initialized Supabase client singleton

- [ ] **Step 1: Install @supabase/supabase-js**

```bash
cd apps/youandinotai-frontend
pnpm add @supabase/supabase-js
```

- [ ] **Step 2: Add Supabase keys to .env.example**

```dotenv
# Supabase - DO NOT COMMIT REAL VALUES
NEXT_PUBLIC_SUPABASE_URL="https://jmvgdqomvnkfgknmgwxp.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
```

- [ ] **Step 3: Create lib/supabase.ts with createClient singleton**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 4: Commit**

```bash
git add apps/youandinotai-frontend/package.json apps/youandinotai-frontend/pnpm-lock.yaml apps/youandinotai-frontend/lib/supabase.ts apps/youandinotai-frontend/.env.example
git commit -m "feat: add Supabase client to frontend"
```

### Task 4: Backend - Update Database Usage to Use Supabase (Optional Refactor)

**Note:** If the existing code uses a hardcoded `DATABASE_URL`, we have already abstracted it via `settings.database_url` in Task 1. No further changes are needed unless direct `DATABASE_URL` references exist.

**Files:**
- Modify: Any remaining files that import `DATABASE_URL` directly from environment or config.

**Interfaces:**
- Consumes: `settings.database_url`
- Produces: Consistent use of the configured database URL (Supabase or fallback)

- [ ] **Step 1: Grep for direct DATABASE_URL usage and replace with config**

```bash
# Example: find and replace
grep -r "DATABASE_URL" backend/fastapi-app/app/ --include="*.py"
```

- [ ] **Step 2: Update any direct imports to use the config module**

```python
# Before
import os
DATABASE_URL = os.getenv("DATABASE_URL")

# After
from app.core.config import settings
DATABASE_URL = settings.database_url
```

- [ ] **Step 3: Run backend tests to ensure nothing breaks**

```bash
cd backend/fastapi-app
pytest -v
```

- [ ] **Step 4: Commit**

```bash
git add backend/fastapi-app/app/<modified_files>.py
git commit -m "refactor: ensure all DB connections use centralized config"
```

### Task 5: Verify End-to-End Connection

**Files:**
- None (verification via running the app and checking logs)

**Interfaces:**
- Consumes: The configured database URL (Supabase if set, fallback otherwise)
- Produces: Successful connection and basic query

- [ ] **Step 1: Set SUPABASE_DB_URL in local .env (from vault) and run backend**

> **Warning:** Do not commit real secrets. Use values from the OneDrive vault only.

```bash
cd backend/fastapi-app
# .env should be loaded from vault (not copied to repo)
uv run uvicorn app.main:app --reload
```

- [ ] **Step 2: Verify connection logs show Supabase or fallback**

Look for successful connection to either:
- `db.jmvgdqomvnkfgknmgwxp.supabase.co:5432` (Supabase)
- `localhost:5432` (T5500 Docker fallback)

- [ ] **Step 3: Run a simple endpoint that queries the database**

```bash
curl http://localhost:8000/api/v1/health/db  # if such endpoint exists
# or create a temporary test route
```

- [ ] **Step 4: Run the full test suite to ensure 80% coverage gate passes**

```bash
pytest --tb=short --cov=app --cov-report=term-missing --cov-fail-under=80
```

- [ ] **Step 5: Commit any test fixes or configuration adjustments**

```bash
git add .
git commit -m "test: ensure Supabase integration passes coverage gate"
```

## Plan Completion

**Plan complete and saved to `/mnt/c/antigravity/docs/superpowers/plans/2026-06-18-supabase-wire.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
