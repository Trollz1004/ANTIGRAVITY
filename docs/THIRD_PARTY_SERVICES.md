# Third-Party Services

Catalog of all third-party services used by the ANTIGRAVITY platform.

## Payment Processing

### Stripe
- **Purpose**: Payment processing, subscriptions, billing
- **Data shared**: Customer email, payment tokens, billing address
- **Config**: `backend/fastapi-app/app/routers/billing.py`
- **API keys**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (env vars)

## Authentication

### Google OAuth 2.0
- **Purpose**: User authentication via Google accounts
- **Data shared**: Email, name, profile picture URL
- **Config**: `backend/fastapi-app/app/routers/google_auth.py`
- **API keys**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (env vars)

## Error Monitoring

### Sentry
- **Purpose**: Error tracking and performance monitoring
- **Data shared**: Stack traces, environment info, request context
- **Config**: `backend/fastapi-app/app/monitoring.py`
- **API keys**: `SENTRY_DSN` (env var)

## Infrastructure

### Cloudflare
- **Purpose**: CDN, DNS, DDoS protection, tunnel hosting
- **Data shared**: Traffic metadata, request headers
- **Config**: `cloudflare-tunnel-*.json`
- **API keys**: `CLOUDFLARE_API_TOKEN` (env var)

### Google Cloud Run
- **Purpose**: Container hosting for backend API
- **Data shared**: Container images, environment variables
- **Config**: `deploy-gcr.yml` workflow
- **API keys**: `GCP_SERVICE_ACCOUNT_KEY` (GitHub secret)

## Local Inference

### Ollama
- **Purpose**: Local LLM inference (no cloud dependency)
- **Data shared**: None (fully local)
- **Config**: `litellm-config.yaml`
- **API keys**: None required

## Analytics (if enabled)

### Google Analytics (potential)
- **Purpose**: Web analytics and user behavior tracking
- **Data shared**: Page views, session data, user agent
- **Config**: Check frontend HTML templates for GA tracking IDs
- **API keys**: `GA_TRACKING_ID` (env var, if used)
