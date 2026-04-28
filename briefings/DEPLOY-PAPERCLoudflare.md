# Paperclip + Hermes + Cloudflare Workers Deployment

## Quick Deploy (Run in WSL)

```bash
# 1. Install Wrangler globally
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Create D1 database
wrangler d1 create paperclip-db

# 4. Create KV namespace for sessions
wrangler kv:namespace create PAPERCLIP_KV

# 5. Deploy
wrangler deploy
```

## Hermes Agent Setup (WSL)

```bash
# Install Hermes
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

# Configure API keys
hermes setup

# Set default model (e.g., openrouter with claude)
hermes model set openrouter:anthropic/claude-sonnet-4
```

## Cloudflare Worker Deployment Steps

### Step 1: Get Zone ID
```bash
curl -s "https://api.cloudflare.com/client/v4/zones?name=youandinotai.com" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result[0].id'
```

### Step 2: Deploy Worker
```bash
# Build Paperclip
pnpm build

# Deploy
wrangler deploy
```

### Step 3: Attach Custom Domain
```bash
curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/workers/domains" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "hostname": "paperclip-hq.youandinotai.com",
    "service": "paperclip",
    "environment": "production",
    "zone_id": "ZONE_ID"
  }'
```

## Environment Variables Needed

```bash
# Core
PAPERCLIP_ENV=production
PAPERCLIP_API_URL=https://paperclip-hq.youandinotai.com

# API Keys (set via wrangler secret)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
OPENROUTER_API_KEY=sk-or-...

# Database
DATABASE_URL=postgresql://... (if using external Postgres)
```

## For 24/7 Uptime

1. **Cloudflare Workers** - Always-on by default
2. **Hermes Agent** - Run via systemd service:
   ```bash
   sudo systemctl enable hermes-agent
   sudo systemctl start hermes-agent
   ```

## Ollama Cloud Models on Hermes

Hermes supports Ollama Cloud via OpenRouter adapter:
```
hermes model set openrouter:kimi/k2.6
hermes model set openrouter:anthropic/claude-sonnet-4-20250514
hermes model set openrouter:mistralai/mistral-7b-instruct
```

## Self-Hosted Ollama (Local GPU)

```bash
# Connect Hermes to local Ollama
hermes model set ollama:llama3
hermes model set ollama:mistral
hermes model set ollama:codellama
```

## Verify Deployment

```bash
# Check Worker status
curl -s https://paperclip-hq.youandinotai.com/api/health | jq .

# View logs
wrangler tail
```