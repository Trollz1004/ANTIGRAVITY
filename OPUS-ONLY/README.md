# YouAndINotAI Backend — FastAPI + Docker

AI-powered dating platform with human verification, Stripe payments, and Gemini AI integration.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git
- Python 3.11+ (for local development)

### Local Development

1. **Clone and setup:**
```bash
git clone <repo-url>
cd youandinotai-backend
cp .env.example .env
```

2. **Edit `.env` with your credentials:**
```bash
POSTGRES_PASSWORD=your_secure_password
REDIS_PASSWORD=your_redis_password
STRIPE_SECRET_KEY=sk_live_...
GEMINI_API_KEY=AIza...
```

3. **Start the stack:**
```bash
docker compose up
```

4. **Access the API:**
- API Docs: http://localhost:80/api/v1/docs
- Health check: http://localhost:80/api/v1/health

### Production Deployment

```bash
docker compose -f docker-compose.prod.yml up -d
```

Automatic backups run daily to the `backups/` directory with 7-day retention.

## 📦 Architecture

```
┌─────────────────────────────────┐
│   Cloudflare Pages (Frontend)   │
└────────────┬────────────────────┘
             │
┌────────────▼──────────────────────┐
│   Nginx (Reverse Proxy + SSL)     │
│   - Rate limiting                 │
│   - CORS headers                  │
│   - WebSocket support             │
└────────────┬──────────────────────┘
             │
┌────────────▼──────────────────────┐
│   FastAPI 3.11 (Port 8000)        │
│   - User auth + Bot-Shield        │
│   - Matching algorithm            │
│   - Stripe webhooks               │
│   - Gemini AI integration         │
└────────┬──────────┬──────────┬────┘
         │          │          │
    ┌────▼──┐  ┌───▼──┐  ┌───▼────┐
    │  PG   │  │Redis │  │ Stripe │
    │ 16    │  │  7   │  │ API    │
    └───────┘  └──────┘  └────────┘
```

## 🗄️ Services

### FastAPI (Port 8000)
- Main application server
- Runs with `uvicorn`
- Health check: `/api/v1/health`
- API docs: `/api/v1/docs`

### PostgreSQL (Port 5432)
- Database: `uandinotai_dating`
- User: `uandinotai`
- Tables:
  - `users` - User accounts & Bot-Shield verification
  - `profiles` - User profiles & photos
  - `matches` - Match connections
  - `messages` - Direct messages
  - `subscriptions` - Subscription status
  - `payments` - Payment history
  - `webhook_events` - Stripe webhooks

### Redis (Port 6379)
- Session management
- Caching layer
- Queue for async tasks (future)

### Nginx (Ports 80/443)
- Reverse proxy to FastAPI
- SSL termination (Let's Encrypt)
- Rate limiting:
  - `/api/v1/users/register`: 10 req/min
  - `/api/*`: 100 req/min
- Security headers
- Gzip compression

## 📝 API Endpoints

### Health & Status
- `GET /api/v1/health` - Service health check

### Users
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/users/me` - Current user profile

### Webhooks
- `POST /webhooks/stripe` - Stripe events

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | DB password | `SecurePass123!` |
| `REDIS_PASSWORD` | Redis password | `RedisPass456!` |
| `STRIPE_SECRET_KEY` | Stripe API key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `APP_URL` | Production URL | `https://youandinotai.com` |
| `CORS_ORIGINS` | Allowed origins | `https://youandinotai.com,http://localhost:3000` |
| `LOG_LEVEL` | Log level | `info` |

## 📊 Database Schema

All tables include:
- `id` (UUID primary key)
- `created_at` (timestamp)
- `updated_at` (auto-updated timestamp)

**Users Table:**
- Email (unique)
- Display name
- Password hash
- Bot-Shield verification status
- Stripe customer ID
- Subscription tier & status

**Profiles Table:**
- Bio, age, gender, interests
- Photos & avatar URL
- Location
- Verification status

**Matches Table:**
- User pairs
- Compatibility score
- Status (pending, matched, declined)
- Like status from each user
- Match timestamp

**Messages Table:**
- Match ID reference
- Sender ID reference
- Message content
- Read status & timestamp

## 🚀 Deployment

### GCP Cloud Run
```bash
# Build image
docker build -t us-east1-docker.pkg.dev/project/dateapp/backend:latest .

# Push to Artifact Registry
docker push us-east1-docker.pkg.dev/project/dateapp/backend:latest

# Deploy
gcloud run deploy backend \
  --image us-east1-docker.pkg.dev/project/dateapp/backend:latest \
  --platform managed \
  --region us-east1 \
  --set-env-vars DATABASE_URL=...,STRIPE_SECRET_KEY=...
```

### Docker Compose Production
```bash
docker compose -f docker-compose.prod.yml up -d
```

Features:
- Auto-restart on failure
- Resource limits (512MB RAM, 1 CPU)
- Daily backups with 7-day retention
- Nginx with SSL/TLS
- Security headers

## 📋 Backups

Automatic daily backups to `backups/` directory:
- Filename: `uandinotai_YYYYMMDD_HHMMSS.sql.gz`
- Retention: 7 days (auto-cleanup)
- Command: `pg_dump | gzip`

Restore:
```bash
gunzip < backups/uandinotai_20240120_030000.sql.gz | psql -U uandinotai -d uandinotai_dating
```

## 🔗 Integration Checklist

- [ ] Stripe account configured (live keys)
- [ ] Stripe webhook endpoint registered (`/webhooks/stripe`)
- [ ] Google Gemini API enabled
- [ ] Bot-Shield integration implemented
- [ ] CORS origins updated for production domain
- [ ] SSL certificates provisioned (Let's Encrypt)
- [ ] Database backups configured
- [ ] Monitoring/alerting set up
- [ ] Rate limiting tested
- [ ] Load testing completed

## 🐛 Troubleshooting

### Container won't start
```bash
docker compose logs app
docker compose logs postgres
docker compose logs redis
```

### Database connection errors
```bash
# Check PostgreSQL
docker exec uandinotai-postgres psql -U uandinotai -d uandinotai_dating -c "SELECT 1;"

# Check Redis
docker exec uandinotai-redis redis-cli ping
```

### Port conflicts
```bash
# Find processes using ports
lsof -i :8000
lsof -i :5432
lsof -i :6379
```

## 📚 Documentation

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Google Gemini API](https://ai.google.dev/)

## 📄 License

Proprietary - YouAndINotAI

## 👥 Team

- **CTO**: Joshua Coleman
- **Entity**: Trash Or Treasure Online Recycler LLC

---

**Ready to launch?** Run `docker compose up` and visit http://localhost:80/api/v1/docs
