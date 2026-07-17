# OmniRouter Setup for ANTIGRAVITY T5500

**Source:** Cloned from sabretooth `C:\paperclip\omniroute`

## Quick Setup

### 1. Copy Full Source from Sabretooth
```powershell
# On sabretooth, zip the repo:
Compress-Archive -Path C:\paperclip\omniroute -DestinationPath C:\omniroute.zip

# Transfer to T5500 (via USB, network, or SCP):
# Then on T5500:
Expand-Archive -Path C:\omniroute.zip -DestinationPath C:\ANTIGRAVITY\
```

### 2. Set Environment Variables
Edit `C:\ANTIGRAVITY\.env.docker`:
```env
# OmniRouter secrets (change these!)
JWT_SECRET=your-secure-jwt-secret
API_KEY_SECRET=your-secure-api-key
INITIAL_PASSWORD=your-secure-password

# Provider keys
OPENROUTER_API_KEY=sk-or-v1-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
```

### 3. Start OmniRouter
```powershell
cd C:\ANTIGRAVITY\omniroute
docker compose up -d
```

### 4. Access Dashboard
- **Dashboard:** http://localhost:20128
- **API:** http://localhost:20129

### 5. Wire to Hermes Agent
OmniRouter acts as upstream LLM router:
```
Hermes Workspace (:3000)
  → Hermes Agent (:8642)
    → OmniRouter (:20129 API)
      → OpenRouter (cost-optimized routing)
        → LLM response
```

## Profiles Available
```bash
docker compose --profile base up -d          # Minimal
docker compose --profile web up -d           # + Chromium/Playwright
docker compose --profile cli up -d           # + CLI tools
docker compose --profile memory up -d        # + Qdrant semantic memory
docker compose --profile bifrost up -d       # + Bifrost LLM router
```

## Ports
- **Dashboard:** 20128
- **API:** 20129
- **Redis (internal):** 6379

## Key Features
- **Turbopack builds** (9 min vs 17 min webpack)
- **SQLite + sqlite-vec** for semantic memory
- **Optional Qdrant** for distributed memory
- **JWT + API key** authentication
- **Rate limiting** via Redis

## Troubleshooting
```bash
# Check status
docker compose ps

# View logs
docker compose logs -f omniroute

# Rebuild
docker compose build --no-cache omniroute

# Full reset
docker compose down -v
docker compose up -d
```

## TODO: Full Integration
- [ ] Copy complete source from sabretooth
- [ ] Test dashboard access
- [ ] Configure Hermes Agent to route through OmniRouter API
- [ ] Set up provider failover chain (OpenRouter → OpenAI → others)
