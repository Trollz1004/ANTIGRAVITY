# OmniRouter Migration: Sabretooth → T5500 (ANTIGRAVITY Local Stack)

## Current State

- **Sabretooth:** OmniRouter running at `C:\paperclip\omniroute` (ports 20128, 20129)
- **T5500 (Local Stack):** Dockerfile + docker-compose template ready at `C:\ANTIGRAVITY\omniroute/`

## Step 1: Prepare Source on Sabretooth

Run this on sabretooth to zip the full OmniRouter setup:

```powershell
# Compress the repo
$source = "C:\paperclip\omniroute"
$dest = "C:\omniroute-backup-$(Get-Date -Format yyyyMMdd-HHmmss).zip"
Compress-Archive -Path $source -DestinationPath $dest -Force
Write-Host "✓ Created: $dest"

# Also backup .env if secrets are there
if (Test-Path "$source\.env") {
  Copy-Item "$source\.env" "C:\omniroute.env.backup"
  Write-Host "✓ Backed up .env"
}
```

## Step 2: Transfer to T5500

**Option A: USB/External Drive**

```powershell
# On sabretooth:
Copy-Item "C:\omniroute-backup-*.zip" "E:\" -Force

# On T5500:
Expand-Archive -Path "E:\omniroute-backup-*.zip" -DestinationPath "C:\ANTIGRAVITY\" -Force
```

**Option B: Network Copy (if both on same LAN)**

```powershell
# On sabretooth:
New-SmbShare -Name "omniroute" -Path "C:\paperclip\omniroute" -FullAccess "Everyone"

# On T5500:
net use \\sabretooth\omniroute
Copy-Item "\\sabretooth\omniroute\*" "C:\ANTIGRAVITY\omniroute\" -Recurse -Force
```

**Option C: SCP (if SSH is configured)**

```bash
scp -r joshl@sabretooth:C:/paperclip/omniroute/* C:\ANTIGRAVITY\omniroute\
```

## Step 3: Update Configuration on T5500

Edit `.env.docker`:

```env
# OmniRouter (from sabretooth .env, update secrets for security)
JWT_SECRET=NEW-JWT-SECRET-FOR-T5500
API_KEY_SECRET=NEW-API-KEY-SECRET-FOR-T5500
INITIAL_PASSWORD=NEW-PASSWORD-FOR-T5500

# Provider keys
OPENROUTER_API_KEY=sk-or-v1-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
```

If sabretooth `.env` has secrets you want to reuse:

```powershell
# Copy from sabretooth (secure transfer only):
Copy-Item "\\sabretooth\omniroute\.env" "C:\ANTIGRAVITY\.env.omniroute.backup"
# Then manually extract the JWT_SECRET, API_KEY_SECRET values
```

## Step 4: Build & Start OmniRouter on T5500

```powershell
cd C:\ANTIGRAVITY

# Build the image
docker compose build omni-router

# Start OmniRouter + dependencies (redis auto-starts)
docker compose up -d omni-router

# Verify
docker compose ps
curl http://192.168.0.8:20128/health   # Dashboard health
curl http://127.0.0.1:20129/health   # API health
```

## Step 5: Verify Full Stack Integration

```powershell
# Check all services
docker compose ps

# Expected running:
# - omni-router        :20128, :20129 ✓
# - hermes-agent       :8642 ✓
# - hermes-workspace   :3000 ✓
# - hermes-mcp         :8700 ✓
# - redis              :6379 ✓
# - qdrant             :6333 ✓

# Access dashboard
Start-Process "http://192.168.0.8:20128"

# Test API endpoint
curl http://127.0.0.1:20129/api/status
```

## Step 6: Wire Hermes Agent → OmniRouter

Once OmniRouter is running, configure Hermes Agent to use it as upstream:

```powershell
# Inside hermes-agent container:
docker compose exec hermes-agent bash -c "
  hermes config set provider=omni-router
  hermes config set omni-router-url=http://omni-router:20129
  hermes config set omni-router-key=\${API_KEY_SECRET}
"
```

Or manually edit Hermes config in the volume:

```powershell
# Find Hermes config (in hermes-data volume)
docker inspect hermes-agent --format='{{json .Mounts}}' | ConvertFrom-Json | Where {$_.Destination -eq "/root/.hermes"} | Select Source
```

## Step 7: Test Chat Flow

```
T5500 Hermes Workspace (:3000)
  → Hermes Agent (:8642)
    → OmniRouter API (:20129)
      → OpenRouter (or other provider)
        → LLM → response
```

Test:

1. Open http://127.0.0.1:3000 (Hermes Workspace)
2. Send a chat message
3. Monitor: `docker compose logs -f omni-router`
4. Check OmniRouter dashboard: http://192.168.0.8:20128 (usage, routing, costs)

## Troubleshooting

### OmniRouter won't start

```powershell
docker compose logs omni-router | tail -50
# Check Node version, memory limits, port conflicts
```

### Redis connection failed

```powershell
docker compose ps | grep redis
docker compose logs redis
```

### Hermes Agent can't reach OmniRouter

```powershell
# Test from hermes-agent container
docker compose exec hermes-agent curl -v http://omni-router:20129/health

# Check Docker network
docker network inspect antigravity_default
```

### Port 20128/20129 already in use

```powershell
Get-NetTCPConnection -LocalPort 20128,20129
# Kill conflicting process or change ports in docker-compose.yml
```

## Rollback

If needed, revert to sabretooth-only setup:

```powershell
# Stop T5500 OmniRouter
docker compose stop omni-router

# Keep sabretooth OmniRouter running, update Hermes Agent config to point back
```

---

**Status:** Ready to migrate full OmniRouter source from sabretooth.
