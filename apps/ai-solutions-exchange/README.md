# AI Solutions Exchange — Local Development Guide

This document explains how to run the AI Solutions Exchange app locally, including
environment setup, local PostgreSQL bootstrapping, and the minimum commands to
start the site.

## 1) Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Optional: Docker Desktop (recommended for local DB)
- `npm` or `pnpm`

## 2) Install dependencies

```bash
cd apps/ai-solutions-exchange
npm install
```

## 3) Environment variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Fill in values in `.env`:

```env
# Core app + server
NODE_ENV=development
PORT=3000
APP_BASE_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/ai_solutions_exchange?schema=public"

# Auth/session
JWT_SECRET="replace-with-strong-secret-at-least-32-chars"

# AI service (server-side only)
OPENAI_API_KEY="your_openai_api_key"
OPENAI_MODEL="gpt-4.1-mini"
```

If `.env.example` defines additional variables, keep them in sync and do not commit
real secret values.

## 4) Local PostgreSQL setup

You can use an existing local Postgres instance or run one in Docker:

```bash
docker run --name ai-solutions-exchange-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_solutions_exchange \
  -p 5432:5432 \
  -d postgres:16
```

Then create/update schema and generate client:

```bash
npm run db:generate
npm run db:push
```

If this repo uses migration flow instead of direct push, replace with:

```bash
npm run db:migrate
```

## 5) Start the app

```bash
npm run dev
```

App is typically available at:

- Frontend + API: `http://localhost:3000`

Useful local checks:

```bash
npm run lint
npm run build
```

Optional DB check:

```bash
npm run db:studio
```

## 6) Common startup issues

- **`P1001` / DB connection refused**  
  PostgreSQL is not running or `DATABASE_URL` has the wrong host/port.
- **Prisma client not found**  
  Run `npm run db:generate` after installing dependencies or updating schema.
- **Auth/token errors**  
  Ensure `JWT_SECRET` is defined and at least 32 characters.

## 7) Expected structure at a glance

```
apps/ai-solutions-exchange/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
├── package.json
├── .env.example
└── README.md
```

## 8) Deployment note

Local development should be done against the same data model as production to avoid
drift; keep migrations and env usage consistent before opening pull requests.
