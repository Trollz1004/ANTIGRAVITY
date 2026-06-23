# Deployment Runbook — ANTIGRAVITY

> **Audience**: DevOps engineers, on-call developers, and automated deployment agents.
> **Goal**: Anyone should be able to deploy the platform using only this document.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Environment Variables](#3-environment-variables)
4. [Pre-Deployment Checks](#4-pre-deployment-checks)
5. [Deployment Steps](#5-deployment-steps)
6. [Staging Deployment](#6-staging-deployment)
7. [Blue-Green Deployment](#7-blue-green-deployment)
8. [Post-Deployment Verification](#8-post-deployment-verification)
9. [Rollback Procedure](#9-rollback-procedure)
10. [Monitoring & Alerting](#10-monitoring--alerting)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Architecture Overview

| Service | Technology | Port | Dockerfile |
|---------|-----------|------|------------|
| **Backend API** | FastAPI (Python 3.11) | 8000 | `backend/fastapi-app/Dockerfile` |
| **Frontend** | React 19 + Vite | 3000 | `frontend/react-app/Dockerfile` |
| **Redis** | redis:alpine | 6379 | Docker Hub |
| **Qdrant** | qdrant/qdrant | 6333-6334 | Docker Hub |
| **OpenClaw** | Node.js | 3200 | `../openclaw/Dockerfile` |
| **LiteLLM Proxy** | Python | 11436 | Config only |
| **Paperclip Core** | Node.js | 3100 | Paperclip repo |

**Dependency chain**: Redis + Qdrant → OpenClaw → Backend API → Frontend

---

## 2. Prerequisites

### Required Software
- **Docker** >= 24.0 and **Docker Compose** >= 2.20
- **Node.js** >= 20 (for local development and Paperclip)
- **Python** >= 3.10 (for backend local development)
- **Git** (for pulling latest code)

### Infrastructure
- PostgreSQL database (embedded Paperclip PG or external)
- Domain configured with DNS pointing to server
- SSL certificate (Let's Encrypt or Cloudflare)

### Access
- GitHub repository access (PAT or SSH)
- Server SSH access
- Environment variable values (from secure vault)

---

## 3. Environment Variables

Copy `.env.example` to `.env` and fill in all required values:

```bash
cp .env.example .env
```

### Critical Variables (must be set for any deployment)

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `JWT_SECRET` | Backend | JWT signing key (min 32 chars) |
| `SQUARE_ACCESS_TOKEN` | Backend | Square payment processor membership record |
| `SQUARE_LOCATION_ID` | Backend | Square location ID |
| `REDIS_HOST` | All | Redis hostname |
| `REDIS_PORT` | All | Redis port (default: 6379) |
| `NODE_ENV` | All | `production` or `development` |
| `LOG_LEVEL` | All | `info`, `debug`, `warn`, `error` |

### Optional Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `CDN_BASE_URL` | Frontend | Static asset CDN URL |
| `CDN_ENABLED` | Frontend | Enable CDN asset serving |
| `RATE_LIMIT_ENABLED` | Backend | Enable rate limiting |
| `REDIS_CACHE_ENABLED` | Backend | Enable Redis caching |
| `LITELLM_PORT` | LiteLLM | Proxy port (default: 11436) |

See `.env.example` for the complete list of 67 configuration keys.

---

## 4. Pre-Deployment Checks

Run these commands before every deployment:

```bash
# 1. Verify Docker is running
docker info > /dev/null 2>&1 || echo "ERROR: Docker not running"

# 2. Check disk space (need at least 5GB free)
df -h / | awk 'NR==2 {if ($4+0 < 5) print "WARNING: Low disk space:", $4}'

# 3. Verify environment file exists and is populated
test -f .env || echo "ERROR: .env file missing"
grep -q "JWT_SECRET=your-super-secret" .env && echo "WARNING: JWT_SECRET still has placeholder value"

# 4. Check current migration state
cd backend/fastapi-app && alembic current 2>/dev/null || echo "WARNING: Cannot check migrations"

# 5. Verify network connectivity
curl -fsS http://localhost:6379 > /dev/null 2>&1 || echo "WARNING: Redis not reachable"
```

---

## 5. Deployment Steps

### Standard Deployment (Production)

```bash
# Step 1: Navigate to repository
cd /mnt/c/ANTIGRAVITY

# Step 2: Pull latest code
git pull origin main

# Step 3: Build all Docker images
docker compose build

# Step 4: Run database migrations
docker compose run --rm backend alembic upgrade head

# Step 5: Start all services in detached mode
docker compose up -d

# Step 6: Wait for services to initialize
sleep 15

# Step 7: Verify all services are healthy
docker compose ps
```

### Service-Specific Deployments

**Backend only:**
```bash
docker compose build backend
docker compose up -d backend
docker compose run --rm backend alembic upgrade head
```

**Frontend only:**
```bash
docker compose build frontend
docker compose up -d frontend
```

---

## 6. Staging Deployment

Staging uses `docker-compose.staging.yml` with isolated configuration:

```bash
# Deploy to staging
docker compose -f docker-compose.staging.yml build
docker compose -f docker-compose.staging.yml up -d

# Run staging migrations
docker compose -f docker-compose.staging.yml run --rm backend alembic upgrade head

# Verify staging
docker compose -f docker-compose.staging.yml ps
```

**Staging differences:**
- Uses separate database (different `POSTGRES_DB`)
- `NODE_ENV=staging`
- Different webhook notification URLs
- Reduced resource limits

---

## 7. Blue-Green Deployment

Blue-green deployment uses `docker-compose.blue-green.yml`:

```bash
# Determine current active color
CURRENT=$(docker compose -f docker-compose.blue-green.yml ps --format json | jq -r '.[0].Name' | grep -o 'blue\|green')
NEXT=$([ "$CURRENT" = "blue" ] && echo "green" || echo "blue")

echo "Current: $CURRENT, Deploying to: $NEXT"

# Build and start the next color
docker compose -f docker-compose.blue-green.yml build "${NEXT}-backend" "${NEXT}-frontend"
docker compose -f docker-compose.blue-green.yml up -d "${NEXT}-backend" "${NEXT}-frontend"

# Run migrations on next color
docker compose -f docker-compose.blue-green.yml run --rm "${NEXT}-backend" alembic upgrade head

# Verify next color is healthy
curl -fsS http://localhost:8001/api/v1/health || echo "ERROR: Next color unhealthy"

# Switch traffic (update load balancer / reverse proxy)
# ... switch upstream to next color ...

# Stop old color after verification period
# docker compose -f docker-compose.blue-green.yml stop "${CURRENT}-backend" "${CURRENT}-frontend"
```

---

## 8. Post-Deployment Verification

### Health Check All Services

```bash
# Backend API
curl -fsS http://localhost:8000/api/v1/health
# Expected: {"status":"ok", ...}

# Frontend
curl -fsS -o /dev/null -w "%{http_code}" http://localhost:3000
# Expected: 200

# Redis
docker compose exec redis redis-cli ping
# Expected: PONG

# Qdrant
curl -fsS http://localhost:6333/healthz
# Expected: {"title":"qdrant - vector search engine","version":"..."}

# OpenClaw
curl -fsS http://localhost:3200/health || echo "OpenClaw not running (optional)"
```

### Smoke Tests

```bash
# Test user registration
curl -fsS -X POST http://localhost:8000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"TestPass123!","display_name":"Test User","date_of_birth":"1990-01-01","accepted_terms":true,"accepted_cookie_policy":true,"confirmed_over_18":true}'

# Test login
curl -fsS -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"TestPass123!"}'

# Test health endpoint
curl -fsS http://localhost:8000/api/v1/health
```

### Log Check

```bash
# Check for errors in all services
docker compose logs --tail=50 | grep -i "error\|fatal\|panic" || echo "No errors found"

# Check specific service
docker compose logs --tail=50 backend | grep -i error
docker compose logs --tail=50 frontend | grep -i error
```

---

## 9. Rollback Procedure

### Quick Rollback (last known good version)

```bash
# Step 1: Identify last good commit
git log --oneline -10

# Step 2: Revert to last good commit
git revert --no-commit HEAD
# OR for hard reset (DANGEROUS - only if no data loss risk):
# git reset --hard <last-good-commit>

# Step 3: Rebuild and redeploy
docker compose build
docker compose up -d

# Step 4: Rollback database if needed
docker compose run --rm backend alembic downgrade -1

# Step 5: Verify
curl -fsS http://localhost:8000/api/v1/health
```

### Service-Specific Rollback

```bash
# Rollback only backend
docker compose build backend
docker compose up -d backend

# Rollback only frontend
docker compose build frontend
docker compose up -d frontend
```

### Database Rollback

```bash
# Downgrade one migration
docker compose run --rm backend alembic downgrade -1

# Downgrade to specific revision
docker compose run --rm backend alembic downgrade <revision-hash>

# View migration history
docker compose run --rm backend alembic history --verbose
```

---

## 10. Monitoring & Alerting

### Log Locations

| Service | Log Location |
|---------|-------------|
| Backend | `docker compose logs backend` or `/mnt/c/ANTIGRAVITY/logs/backend.log` |
| Frontend | `docker compose logs frontend` |
| Redis | `docker compose logs redis` |
| Qdrant | `docker compose logs qdrant` |
| OpenClaw | `docker compose logs openclaw` |
| System | `/mnt/c/ANTIGRAVITY/logs/` |

### Key Metrics to Watch

| Metric | Warning Threshold | Critical Threshold |
|--------|------------------|-------------------|
| API response time | > 500ms | > 2000ms |
| Error rate | > 1% | > 5% |
| CPU usage | > 70% | > 90% |
| Memory usage | > 80% | > 95% |
| Disk usage | > 70% | > 85% |
| Database connections | > 80% of max | > 95% of max |

### Health Check Endpoints

| Endpoint | Service | Expected Response |
|----------|---------|------------------|
| `GET /api/v1/health` | Backend | `{"status":"ok"}` |
| `GET /health` | Frontend | HTTP 200 |
| `redis-cli ping` | Redis | `PONG` |
| `GET /healthz` | Qdrant | `{"title":"qdrant..."}` |

---

## 11. Troubleshooting

### Container Won't Start

```bash
# Check container logs
docker compose logs <service>

# Check container status
docker compose ps -a

# Restart specific service
docker compose restart <service>

# Rebuild from scratch
docker compose build --no-cache <service>
docker compose up -d <service>
```

### Database Connection Issues

```bash
# Test database connectivity
docker compose run --rm backend python -c "
import asyncio
from app.database import engine
async def test():
    async with engine.connect() as conn:
        print('Database connection: OK')
asyncio.run(test())
"

# Check migration state
docker compose run --rm backend alembic current
docker compose run --rm backend alembic history
```

### Port Conflicts

```bash
# Check what's using a port
ss -tlnp | grep <port>

# Kill process on port (if safe)
# fuser -k <port>/tcp
```

### High Memory Usage

```bash
# Check container memory usage
docker stats --no-stream

# Restart memory-heavy services
docker compose restart backend qdrant
```

### SSL/Certificate Issues

```bash
# Check certificate expiry
openssl s_client -connect youandinotai.com:443 -servername youandinotai.com 2>/dev/null | openssl x509 -noout -dates

# Renew Let's Encrypt (if using certbot)
certbot renew --dry-run
```

### Frontend Build Failures

```bash
# Clear node_modules and reinstall
cd frontend/react-app
rm -rf node_modules package-lock.json
npm install
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### Backend Import Errors

```bash
# Verify Python environment
cd backend/fastapi-app
python -c "from app.main import app; print('App imports OK')"

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start all | `docker compose up -d` |
| Stop all | `docker compose down` |
| View logs | `docker compose logs -f` |
| Restart service | `docker compose restart <service>` |
| Run migrations | `docker compose run --rm backend alembic upgrade head` |
| Check health | `curl http://localhost:8000/api/v1/health` |
| View processes | `docker compose ps` |
| Shell into backend | `docker compose exec backend sh` |
| Shell into frontend | `docker compose exec frontend sh` |

---

*Last updated: 2026-05-18. For issues not covered here, check `docs/architecture.md` and `docs/workflows.md`.*
