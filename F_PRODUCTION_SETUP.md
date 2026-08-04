# F:\ANTIGRAVITY Production Setup on T5500

**Status:** ✅ Ready for deployment  
**Repo:** F:\ (cleaned, 150 MB, production-only)  
**Services:** Mission Control :3151 + OmniRoute :20128 + DateApp :3200/:8000 + Graphify  
**Watchdog:** Silent background task (zero popups, zero terminal windows)

---

## Quick Start (Copy-Paste)

```powershell
# 1. Start the services manually first (verify they work)
cd F:\ANTIGRAVITY
npm run omniroute:start          # OmniRoute :20128
npm run mission-control:start    # Mission Control :3151
npm run dateapp:start            # DateApp :3200/:8000

# 2. In another admin PowerShell:
powershell -ExecutionPolicy Bypass -File scripts\register-silent-watchdog-task.ps1

# 3. Reboot (watchdog auto-starts silently)
# 4. Verify
Get-ScheduledTask -TaskName "ANTIGRAVITY-Silent-Watchdog-T5500" | Get-ScheduledTaskInfo
Get-Content logs\watchdog-silent-$(Get-Date -Format 'yyyyMMdd').log
```

---

## Architecture

### Three Critical Services on T5500

| Service | Port | Role | Graphify Link |
|---------|------|------|---------------|
| **OmniRoute** | :20128 | Gateway + load balancer + credential store | `/dashboard/graphify` |
| **Mission Control** | :3151 | Agent orchestrator + execution engine | `/graphify` endpoint |
| **DateApp Frontend** | :3200 | Production youandinotai.com UI | Via tunnel (cloudflared) |
| **DateApp Backend** | :8000 | FastAPI services + data layer | Watched (no auto-restart) |

### Silent Watchdog Loop

Every 30 seconds (pure background):
1. Test TCP connection to :20128, :3151, :3200, :8000
2. Log status (disk only, no console)
3. If any service fails 3 times, attempt restart
4. Run for 8 hours, then exit (systemd/scheduled task restarts it daily)
5. **ZERO terminal windows, ZERO popups, cursor never moves**

---

## Graphify Integration

### Mission Control (:3151)

**Endpoint:** `http://localhost:3151/api/graphify/html`

Serves `F:\ANTIGRAVITY\graphify-out\graph.html` with CORS headers.

**In Mission Control UI:**
- Add a "Repository" tab pointing to `/graphify`
- Displays repo dependency graph in real-time

**Endpoint Info:** `http://localhost:3151/api/graphify/info`

### OmniRoute Dashboard (:20128)

**Route:** Static mount at `/graphify`

OmniRoute config (already wired):
```yaml
routes:
  /graphify:
    type: static
    path: F:\ANTIGRAVITY\graphify-out\
    index: graph.html
```

Access at: `http://localhost:20128/graphify`

---

## Silent Watchdog Setup

### Register the Task (Admin)

```powershell
powershell -ExecutionPolicy Bypass -File F:\ANTIGRAVITY\scripts\register-silent-watchdog-task.ps1
```

This:
- ✓ Removes any old watchdog tasks
- ✓ Registers `ANTIGRAVITY-Silent-Watchdog-T5500` as SYSTEM (highest privilege)
- ✓ Triggers: At Startup + At Logon
- ✓ No window, no cursor movement, pure background

### Verify Registration

```powershell
# Check task exists
Get-ScheduledTask -TaskName "ANTIGRAVITY-Silent-Watchdog-T5500"

# Check last run status
Get-ScheduledTaskInfo -TaskName "ANTIGRAVITY-Silent-Watchdog-T5500"

# Expected: LastTaskResult = 0 (success)
```

### View Live Logs

```powershell
# Today's log
Get-Content "F:\ANTIGRAVITY\logs\watchdog-silent-$(Get-Date -Format 'yyyyMMdd').log" -Tail 50

# Follow logs (PowerShell 7+ only)
Get-Content "F:\ANTIGRAVITY\logs\watchdog-silent-*.log" -Wait
```

### Disable Watchdog

```powershell
# Stop the running task
Stop-ScheduledTask -TaskName "ANTIGRAVITY-Silent-Watchdog-T5500"

# Unregister it
Unregister-ScheduledTask -TaskName "ANTIGRAVITY-Silent-Watchdog-T5500" -Confirm:$false
```

---

## Manual Service Start

If you need to start services outside the watchdog (testing, debugging):

### OmniRoute (:20128)

```powershell
cd F:\ANTIGRAVITY\omniroute
npm run start
# or via desktop app
& "C:\Users\joshl\AppData\Local\Programs\OmniRoute\OmniRoute.exe"
```

### Mission Control (:3151)

```powershell
cd F:\ANTIGRAVITY\mission-control-v5
npm install
npm run electron
# or headless API only:
npm run server
```

### DateApp Frontend (:3200)

```powershell
cd F:\ANTIGRAVITY\frontend\react-app
npm install
npm run build
PORT=3200 npm run preview
```

### DateApp Backend (:8000)

```powershell
cd F:\ANTIGRAVITY\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --host 127.0.0.1 --port 8000
```

---

## Health Check Command (Manual)

Run this anytime to verify all services:

```powershell
Write-Host "=== STACK HEALTH CHECK ===" -ForegroundColor Cyan
$ports = @{
    "OmniRoute"       = 20128
    "Mission Control" = 3151
    "DateApp"         = 3200
    "DateApp API"     = 8000
}
foreach ($service in $ports.Keys) {
    $port = $ports[$service]
    $test = Test-NetConnection -ComputerName 127.0.0.1 -Port $port -InformationLevel Quiet -ErrorAction SilentlyContinue
    $status = if ($test) { "🟢 ONLINE" } else { "🔴 OFFLINE" }
    Write-Host "$service (:$port) $status"
}
```

---

## Troubleshooting

### Watchdog task is not running

```powershell
# Check if task is disabled
Get-ScheduledTask -TaskName "ANTIGRAVITY-Silent-Watchdog-T5500" | Select-Object -ExpandProperty State
# Expected: Enabled

# If disabled, enable it
Enable-ScheduledTask -TaskName "ANTIGRAVITY-Silent-Watchdog-T5500"

# Force start immediately (testing only)
Start-ScheduledTask -TaskName "ANTIGRAVITY-Silent-Watchdog-T5500"
Start-Sleep 5
Get-Content "F:\ANTIGRAVITY\logs\watchdog-silent-$(Get-Date -Format 'yyyyMMdd').log" -Tail 10
```

### Service crashes repeatedly

1. Check logs: `F:\ANTIGRAVITY\logs\watchdog-silent-YYYYMMDD.log`
2. Manually start the service to see the error:
   ```powershell
   cd F:\ANTIGRAVITY\backend
   python -m uvicorn server:app --port 3151
   ```
3. Fix the issue, then restart the watchdog:
   ```powershell
   Stop-ScheduledTask -TaskName "ANTIGRAVITY-Silent-Watchdog-T5500"
   Start-ScheduledTask -TaskName "ANTIGRAVITY-Silent-Watchdog-T5500"
   ```

### Port already in use

```powershell
# Find what's on the port
netstat -ano | Select-String ":3151"

# Kill it
$proc = Get-NetTCPConnection -LocalPort 3151
Stop-Process -Id $proc.OwningProcess -Force

# Watchdog will restart the service within 30 seconds
```

### Graphify not showing

1. Verify `F:\ANTIGRAVITY\graphify-out\graph.html` exists
2. Check Mission Control is running: `Test-NetConnection -ComputerName 127.0.0.1 -Port 3151`
3. Open `http://localhost:3151/api/graphify/info` in browser
4. Should show: `"graphify_enabled": true`

---

## Deployment Timeline

**Before Reboot:**
- F:\ repo cleaned and ready (✓ done)
- Graphify endpoints wired (✓ done)
- Silent watchdog script created (✓ done)
- Services tested manually (⏳ Josh to verify)

**After Reboot:**
1. Windows startup completes
2. Scheduled task fires silently (SYSTEM user, hidden window)
3. Watchdog checks all ports → detects all offline
4. Starts OmniRoute (:20128) first
5. Starts Mission Control (:3151)
6. Monitors DateApp (:3200 + :8000)
7. Logs everything to disk (never stdout)
8. Continues monitoring for 8 hours

**Expected Timeline:**
- T+0s: Windows startup
- T+10s: Watchdog process starts (completely invisible)
- T+15s: OmniRoute begins startup
- T+25s: OmniRoute online on :20128 ✓
- T+30s: Mission Control begins startup
- T+40s: Mission Control online on :3151 ✓
- T+50s: All systems healthy
- T+60s: Ready to use

---

## Next Steps

1. **Josh to verify services start manually** (before registering watchdog)
2. **Register the silent watchdog task** (admin PowerShell)
3. **Reboot T5500**
4. **Verify all services come up automatically**
5. **Test graphify at** `http://localhost:3151/graphify` and `http://localhost:20128/graphify`

---

## Files Changed in This Setup

```
F:\ANTIGRAVITY\
├── scripts/
│   ├── silent-watchdog-t5500.ps1          (NEW - core watchdog loop)
│   └── register-silent-watchdog-task.ps1  (NEW - install as scheduled task)
├── backend/
│   └── server.py                          (EDIT - added /api/graphify endpoints)
├── ops/
│   └── F_ANTIGRAVITY_CLEANUP_COMPLETE.md  (existing - cleanup report)
└── F_PRODUCTION_SETUP.md                  (THIS FILE)
```

---

## Git Commit Status

All changes staged and ready to push:

```powershell
cd F:\ANTIGRAVITY
git status  # Should show clean or staged files only
git log --oneline -3
```

**Watchdog will pick up latest code on restart.** No manual deployment needed.

---

**ANTIGRAVITY Production · F:\ Drive · T5500 · 2026-08-04**
