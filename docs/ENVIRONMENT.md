# Environment Variable Documentation

> **OPU-51** — Production environment variable reference
> Last updated: 2026-05-18

## Overview

This document describes all environment variables used across the ANTIGRAVITY monorepo. For the actual values template, see `.env.example` (committed) and `.env` (gitignored, local only).

## Setup

```bash
# Copy the example file
cp .env.example .env

# Edit with your real values
# NEVER commit .env to git
```

## Variable Categories

### Core (Required)
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://user:pass@localhost:5432/antigravity` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Generate: `python -c "import secrets; print(secrets.token_urlsafe(64))"` |
| `NODE_ENV` | Application environment | `development`, `staging`, `production`, `test` |
| `APP_URL` | Application base URL | `http://localhost:3000` |

### Backend API
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `8000` |
| `LOG_LEVEL` | Logging level | `info` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |

### Database Pooling
| Variable | Description | Default |
|----------|-------------|---------|
| `DB_POOL_SIZE` | Connection pool size | `10` |
| `DB_MAX_OVERFLOW` | Max overflow connections | `20` |
| `DB_POOL_TIMEOUT` | Pool timeout (seconds) | `30` |

### External Services
- **Redis**: `REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- **Qdrant**: `QDRANT_URL`, `QDRANT_COLLECTION`, `QDRANT_API_KEY`
- **Square Payments**: `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, etc.
- **AI/LLM**: `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OLLAMA_BASE_URL`
- **Email/SMTP**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`
- **Telegram**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

### Security
| Variable | Description | Default |
|----------|-------------|---------|
| `RATE_LIMIT_ENABLED` | Enable rate limiting | `true` |
| `RATE_LIMIT_PER_MINUTE` | Requests per minute | `60` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | `7` |

### Frontend (Vite)
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000/api/v1` |
| `VITE_PAPERCLIP_URL` | Paperclip URL | `http://localhost:3100` |

## Production Checklist

Before deploying to production:
1. [ ] Generate a strong JWT_SECRET (32+ chars)
2. [ ] Set `NODE_ENV=production`
3. [ ] Configure real DATABASE_URL
4. [ ] Set up Redis and configure REDIS_URL
5. [ ] Configure Square payment tokens
6. [ ] Set up AI/LLM API keys
7. [ ] Configure SMTP for email
8. [ ] Set up monitoring (Sentry DSN, Prometheus)
9. [ ] Enable rate limiting
10. [ ] Set strong SESSION_SECRET and ENCRYPTION_KEY

## Local Development

For local development with Paperclip in `local_trusted` mode:
- Use the default values in `.env.example`
- Paperclip core runs on `http://localhost:3100`
- No external services required for basic operation
- LLM calls route through Ollama on `http://localhost:11434`
