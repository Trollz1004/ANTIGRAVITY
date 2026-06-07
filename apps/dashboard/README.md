# ANTIGRAVITY Mission Control Dashboard

**Secured personal dashboard. GitHub OAuth + Cloudflare Pages deployment.**

## Quick Start

```bash
cd apps/dashboard
npm install
npm run dev
```

Runs on `http://localhost:8788`

## Deployment

Deploy to Cloudflare Pages:

```bash
npm run deploy
```

## Secrets Setup

Set in Cloudflare Pages dashboard:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `SESSION_SECRET`

## For Kids' Long-Term Sustainment

This dashboard is isolated on T5500 nodes. No profit-stack dependencies.
