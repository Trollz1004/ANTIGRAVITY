# Paperclip + Cloudflare Workers Deployment Guide

## Prerequisites
- Node.js 20+
- pnpm 9.15+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account
- Cloudflare D1 Database (SQLite) or external Postgres

## Architecture

```
Cloudflare Workers (Vite + Paperclip)
├── D1 Database (embedded SQLite)
├── R2 Storage (optional, for file storage)
└── Workers AI (optional)
```

## Step 1: Clone and Setup Paperclip

```bash
# Clone Paperclip
git clone https://github.com/paperclipai/paperclip.git
cd paperclip

# Install dependencies
pnpm install

# Build the project
pnpm build
```

## Step 2: Configure Cloudflare

```bash
# Login to Cloudflare
wrangler login

# Create D1 Database
wrangler d1 create paperclip-db

# Note the database_id from output
```

## Step 3: Create wrangler.toml for Cloudflare Workers

Create `wrangler.toml` in the server directory:

```toml
name = "paperclip-hq"
main = "dist/worker.js"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist/public"

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "paperclip-db"
database_id = "YOUR_DATABASE_ID"

# Environment variables
[vars]
PAPERCLIP_ENV = "production"
PAPERCLIP_API_URL = "https://paperclip-hq.youandinotai.com"

# Secrets (set via wrangler secret)
# DIGITALOCEAN_ACCESS_TOKEN
# OPENAI_API_KEY
# ANTHROPIC_API_KEY
```

## Step 4: Configure Vite for Cloudflare

Create `vite.config.ts` for Cloudflare Workers adapter:

```typescript
import { defineConfig } from 'vite';
import cloudflare from 'vite-plugin-cloudflare';

export default defineConfig({
  plugins: [cloudflare()],
  build: {
    target: 'esnext',
    minify: true,
  },
  server: {
    port: 8787,
  },
});
```

## Step 5: Build and Deploy

```bash
# Build Paperclip
pnpm build

# Deploy to Cloudflare Workers
wrangler deploy
```

## Step 6: Setup Custom Domain

```bash
# Get Zone ID
curl -s "https://api.cloudflare.com/client/v4/zones?name=youandinotai.com" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result[0].id'

# Attach Worker to domain
curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/workers/domains" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "hostname": "paperclip-hq.youandinotai.com",
    "service": "paperclip-hq",
    "environment": "production",
    "zone_id": "YOUR_ZONE_ID"
  }' | jq .
```

## Hermes Adapter Setup

```bash
# Install Hermes Paperclip Adapter
cd paperclip
npm install hermes-paperclip-adapter

# Register in server/src/adapters/registry.ts
```

```typescript
import * as hermesLocal from "hermes-paperclip-adapter";

registry.set("hermes_local", {
  ...hermesLocal,
  execute,
  testEnvironment,
  detectModel,
  listSkills,
  syncSkills,
  sessionCodec,
});
```

## Environment Variables for Cloudflare

```bash
# Set secrets
wrangler secret put DIGITALOCEAN_ACCESS_TOKEN
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put PAPERCLIP_MASTER_KEY
```

## Database Schema (D1)

Paperclip will auto-migrate on first run. For manual control:

```bash
# Generate migrations
pnpm db:generate

# Apply to D1
wrangler d1 execute paperclip-db --file=./drizzle/migrations/001_init.sql
```

## Monitoring & Logs

```bash
# View live logs
wrangler tail

# Check deployment status
wrangler deployments list
```

## Auto-Start on Boot (Systemd for Local Dev)

```ini
[Unit]
Description=Paperclip Server
After=network.target

[Service]
Type=simple
User=joshl
WorkingDirectory=/home/joshl/paperclip
ExecStart=/home/joshl/.local/bin/paperclip server
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## External Database Option (Recommended for Production)

For production with external Postgres:

```toml
[env.production]
vars = { DATABASE_URL = "postgresql://user:pass@host:5432/paperclip" }
```

Set `DATABASE_URL` as a Wrangler secret for Cloudflare Workers with Hyperdrive.