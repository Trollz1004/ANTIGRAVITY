---
name: platform-ops
description: "Infrastructure operations for the ENIGMA/HEMORzoid profit platform on SABERTOOTH (192.168.0.8). Triggers on: service start/stop, health check, port issues, Ollama, Clawdbot, HEMORzoid API, Dashboard, SABERTOOTH, 'platform down', 'fix services', gateway token, moltbot, Telegram bot, any mention of ports 11434/18789/8001/3001, crosslister-droid, Antigravity. PROFIT ONLY -- never touch .5 or .15 nodes."
---

# My Platform Operations

I run four services on SABERTOOTH (.8) in a dependency chain:

```
Ollama (11434) --> Clawdbot (18789) --> HEMORzoid API (8001) --> Dashboard (3001)
```

If Ollama dies, everything dies. Always diagnose bottom-up.

## Start (manual when launcher fails)

```powershell
# 1. Ollama
Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden
# Wait. Verify: curl http://localhost:11434/api/tags

# 2. Clawdbot -- TOKEN OR SILENT DEATH
$env:CLAWDBOT_GATEWAY_TOKEN = "antigravity2026"
cd C:\crosslister-droid\clawdbot
pnpm moltbot gateway --port 18789 --verbose

# 3. API
cd C:\crosslister-droid\hemorzoid-services
python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

## Health

```powershell
netstat -ano | findstr ":11434 :18789 :8001 :3001"
curl http://localhost:11434/api/tags
curl http://localhost:8001/health
```

## Clawdbot Failure Modes (Top 5)

1. **Token not set** -- #1 cause. Gateway binds port but drops all connections silently. Set `$env:CLAWDBOT_GATEWAY_TOKEN = "antigravity2026"` BEFORE starting.
2. **Ollama not ready** -- Started Clawdbot before Ollama. Restart Clawdbot after Ollama confirms up.
3. **Port zombie** -- `netstat -ano | findstr ":18789"` then `taskkill /PID <PID> /F`.
4. **pnpm missing** -- Fallback: `npm run moltbot -- gateway --port 18789` or `node scripts/run-node.mjs gateway --port 18789`.
5. **Telegram pairing** -- `pnpm moltbot pairing approve telegram <CODE>`.

## Key Paths

- Workspace: `C:\crosslister-droid`
- Clawdbot config: `C:\Users\joshl\.clawdbot\moltbot.json`
- Sessions: `C:\Users\joshl\.moltbot\sessions\`
- Launcher: `C:\Users\joshl\Desktop\ANTIGRAVITY-LAUNCHER.bat`

## Decision Framework (Boss-PlatformOps)

Security first. Automation over manual. Zero trust. Every action has blast radius and rollback. If something looks wrong, run the Iron Wall scan before proceeding:

```powershell
cd C:\crosslister-droid
findstr /s /i "192.168.0" hemorzoid-services\*.*
findstr /s /i "0x222a" hemorzoid-services\*.*
findstr /s /i "omega365" hemorzoid-services\*.*
```

All should return empty.
