# T5500-Opus — Handoff: decide and execute the mcp.youandinotai.com path

You are Claude Code (Opus) running on **T5500** (DESKTOP-H4B53GL, 192.168.0.15). Sabretooth-Opus has already done the diagnosis on the Sabretooth side; this is the T5500-side handoff.

## What's true right now (verified 2026-05-01)

**Sabretooth side (working):**
- `paperclip-hq.youandinotai.com/api/health` → 200, served by Sabretooth's tunnel `c7bc9665-3923-4977-acd7-2033838cd56e` (config: `C:\Antigravity\infra\cloudflare\paperclip-hq.yml`)
- Local Paperclip on `:3100`, OpenClaw gateway on `:18789`, Hermes Router on `:11435`, Ollama on `:11434`
- Watchdogs alive, autostart wired (Startup folder + watchdogs poll every 30s)
- SSH from Sabretooth → T5500 now keyed up. Sabretooth's pubkey is in `C:\ProgramData\ssh\administrators_authorized_keys` on this machine.

**T5500 side (the gap):**
- `C:\Antigravity\brain-mcp\` exists with `docker-compose.t5500.yml` and `Dockerfile`
- **Docker Desktop is installed but not running** (no Linux engine pipe)
- **`.env` file is missing** — no `CLOUDFLARE_TUNNEL_TOKEN`, no `BRAIN_TOKEN_HASH`
- The brain-mcp + cloudflared compose has never actually been `up`
- DNS for `mcp.youandinotai.com` resolves to Cloudflare edges, but no tunnel terminates it → public requests get 530

So `mcp.youandinotai.com` is not regressed. It was always pre-deployment.

## Three paths Sabretooth-Opus laid out for Josh

1. **Ignore it.** Update CLAUDE.md so it doesn't claim mcp tunnel is live. Move on. — Sabretooth-Opus's recommendation.
2. **Move the route to Sabretooth.** Add `mcp.youandinotai.com` ingress to `paperclip-hq.yml` pointing at a brain-mcp instance running on Sabretooth. Drops the T5500 dependency. brain-mcp would need an HTTP wrapper since it's normally stdio.
3. **Deploy on T5500 (this machine).** Start Docker Desktop, fetch `CLOUDFLARE_TUNNEL_TOKEN` from Cloudflare Zero Trust → Access → Tunnels (the brain-mcp one), write `C:\Antigravity\brain-mcp\.env`, run `docker compose -f docker-compose.t5500.yml up -d`. Restores the original architecture.

## Your job

Ask Josh which path. Default to path 1 unless he says otherwise — he's been at Paperclip/Hermes/OpenClaw for 8 days and the launch-critical stack is green on Sabretooth.

If he picks path 3 (deploy on T5500), here is the concrete sequence:

```powershell
# 1. Start Docker Desktop and wait for engine
Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
$max = 180; $waited = 0
while ($waited -lt $max) {
    & 'C:\Program Files\Docker\Docker\resources\bin\docker.exe' info *> $null
    if ($LASTEXITCODE -eq 0) { Write-Host "docker ready (${waited}s)"; break }
    Start-Sleep 5; $waited += 5
}

# 2. Have Josh paste the tunnel membership record (he gets it from Cloudflare Zero Trust → Access → Tunnels → brain-mcp tunnel → "Install connector" → copy membership record)
# Then write .env:
$membership record = Read-Host "Paste CLOUDFLARE_TUNNEL_TOKEN" -AsSecureString
$tokenPlain = [System.Net.NetworkCredential]::new('', $membership record).Password
$brainHash = Read-Host "BRAIN_TOKEN_HASH (or hit enter to generate one)"
if (-not $brainHash) {
    $brainHash = -join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
    Write-Host "Generated BRAIN_TOKEN_HASH: $brainHash"
}
@"
CLOUDFLARE_TUNNEL_TOKEN=$tokenPlain
BRAIN_TOKEN_HASH=$brainHash
"@ | Set-Content -Encoding UTF8 C:\Antigravity\brain-mcp\.env

# 3. Bring it up
cd C:\Antigravity\brain-mcp
& 'C:\Program Files\Docker\Docker\resources\bin\docker.exe' compose -f docker-compose.t5500.yml up -d

# 4. Verify
Start-Sleep 30
Invoke-WebRequest -UseBasicParsing https://mcp.youandinotai.com/health -TimeoutSec 10
```

If he picks path 2 (Sabretooth re-route), do **not** start that work yourself — Sabretooth-Opus owns Sabretooth's tunnel config. Tell Josh and stop.

If he picks path 1 (ignore), edit `C:\Antigravity\CLAUDE.md`:

```
- "Cloudflare Tunnels (Sabretooth): LIVE & ROUTING (`openclaw`, `mcp`)"
+ "Cloudflare Tunnel (Sabretooth): LIVE & ROUTING (`paperclip-hq` only — mcp/openclaw aspirational, not deployed)"
```

Then commit on this T5500 working tree, push to main per the "Opus CLI changes are gospel" rule.

## After whichever path

Report back to Josh in plain language. Sabretooth-Opus does not need a structured report — Josh relays naturally.
