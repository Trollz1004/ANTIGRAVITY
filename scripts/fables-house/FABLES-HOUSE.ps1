# ═══════════════════════════════════════════════════════════════════════════
#  FABLE'S HOUSE — Sabretooth full-stack bootstrap, validation-gated, self-healing
#  Built for the Shriners presentation window. 2026-08-16.
#
#  Rules of the House:
#   - A stage does NOT start until every stage before it has VALIDATED (not
#     just launched — answered a real probe).
#   - A required stage that fails is retried forever with backoff. The window
#     NEVER closes on error; it tells you exactly which brick is loose.
#   - After full bring-up it becomes a watchdog: re-validates every stage every
#     60s and heals anything that fell.
#   - Optional stages (Ollama, Stack Health) warn and continue if absent.
#
#  Run:  FABLES-HOUSE.cmd            (repo root — console stays open)
#        powershell -File scripts\fables-house\FABLES-HOUSE.ps1 -Once   (single pass, no watchdog)
# ═══════════════════════════════════════════════════════════════════════════
param([switch]$Once, [switch]$Watchdog)

$ErrorActionPreference = 'Continue'
$Repo = 'C:\ANTIGRAVITY'
$LogFile = Join-Path $Repo 'logs\fables-house.log'
New-Item -ItemType Directory -Force -Path (Split-Path $LogFile) | Out-Null

function Log($msg, $color = 'Gray') {
    $line = "[{0}] {1}" -f (Get-Date -Format 'HH:mm:ss'), $msg
    # Watchdog mode is SILENT: file only — no console output, no window, no
    # cursor theft, ever (Joshua's rule). Interactive mode prints normally.
    if (-not $Watchdog) { Write-Host $line -ForegroundColor $color }
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
}

function Test-Port($port) {
    try { (Test-NetConnection 127.0.0.1 -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue) } catch { $false }
}

function Test-Http($url, $timeoutSec = 10, $mustContain = $null) {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec $timeoutSec
        if ($r.StatusCode -ne 200) { return $false }
        if ($mustContain -and ($r.Content -notmatch [regex]::Escape($mustContain))) { return $false }
        return $true
    } catch { return $false }
}

# ── Stage definitions ─────────────────────────────────────────────────────
# Each: Name, Required, Probe (must return $true = healthy), Heal (start it)
$Stages = @(
    @{ Name = 'PostgreSQL :5432'; Required = $true
       Probe = { (& 'C:\Users\joshi\pgsql16\bin\pg_isready.exe' -h 127.0.0.1 -p 5432 -q 2>$null); $LASTEXITCODE -eq 0 }
       Heal  = { & 'C:\Users\joshi\pgsql16\bin\pg_ctl.exe' -D 'C:\Users\joshi\pgsql16-data' -l 'C:\Users\joshi\pgsql16-data.log' start 2>$null | Out-Null } }

    @{ Name = 'Redis :6379'; Required = $true
       Probe = { (& 'C:\Users\joshi\redis-win\redis-cli.exe' -h 127.0.0.1 ping 2>$null) -eq 'PONG' }
       Heal  = { Start-Process 'C:\Users\joshi\redis-win\redis-server.exe' -ArgumentList '--bind','127.0.0.1','--port','6379','--maxmemory','256mb','--maxmemory-policy','allkeys-lru' -WindowStyle Hidden } }

    @{ Name = 'OmniRoute :20128'; Required = $true
       Probe = { Test-Port 20128 }
       Heal  = { $env:DATA_DIR = "$env:USERPROFILE\.omniroute\data"
                 $omni = "$env:APPDATA\npm\omniroute.cmd"
                 if (Test-Path $omni) { Start-Process -FilePath $omni -WindowStyle Hidden }
                 else { Log '  OmniRoute npm-global missing — npm i -g omniroute needed' 'Red' } } }

    @{ Name = 'Frontend :3200 (production bundle)'; Required = $true
       Probe = { Test-Http 'http://127.0.0.1:3200/' 10 'assets/index-' }
       Heal  = { Start-Process cmd -ArgumentList '/c','C:\ANTIGRAVITY\mission-control-v5\scripts\tab-dateapp.cmd' -WindowStyle Hidden } }

    @{ Name = 'Backend API :8000 (db connected)'; Required = $true
       Probe = { Test-Http 'http://127.0.0.1:8000/api/v1/health' 30 '"db_connected":true' }
       Heal  = { Start-Process powershell -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','C:\ANTIGRAVITY\mission-control-v5\scripts\tab-dateapp-api.ps1' -WindowStyle Hidden } }

    @{ Name = 'Cloudflared tunnel (site PUBLIC)'; Required = $true
       Probe = { Test-Http 'https://youandinotai.com' 20 'assets/index-' }
       Heal  = { if (-not (Get-Process cloudflared -ErrorAction SilentlyContinue)) {
                     Start-Process 'C:\Program Files (x86)\cloudflared\cloudflared.exe' -ArgumentList 'tunnel','--config','C:\Users\joshi\.cloudflared\config.yml','run','sabretooth-main' -WindowStyle Hidden
                 } else { Log '  cloudflared runs but public probe failed — check Cloudflare edge / DNS' 'Yellow' } } }

    @{ Name = 'Mission Control :3151'; Required = $true
       Probe = { Test-Http 'http://127.0.0.1:3151/' 10 }
       Heal  = { Start-Process cmd -ArgumentList '/c','C:\ANTIGRAVITY\mission-control-v5\scripts\tab-mission-control.cmd' -WindowStyle Hidden } }

    @{ Name = 'Stack Health :8787'; Required = $false
       Probe = { Test-Http 'http://127.0.0.1:8787/' 8 }
       Heal  = { $t = 'C:\ANTIGRAVITY\mission-control-v5\scripts\tab-mission-control-v6.cmd'
                 if (Test-Path $t) { Start-Process cmd -ArgumentList '/c',$t -WindowStyle Hidden } } }

    @{ Name = 'Ollama :11434'; Required = $false
       Probe = { Test-Port 11434 }
       Heal  = { $o = Get-Command ollama -ErrorAction SilentlyContinue
                 if ($o) { Start-Process $o.Source -ArgumentList 'serve' -WindowStyle Hidden }
                 else { Log '  Ollama not installed on this node (optional — RTX 3070 8GB can host it; winget install Ollama.Ollama)' 'DarkYellow' } } }
)

function Invoke-Stage($stage, [int]$maxAttempts = 0) {
    # maxAttempts 0 = forever (required stages during bring-up)
    $attempt = 0
    while ($true) {
        $attempt++
        $ok = $false
        try { $ok = & $stage.Probe } catch { $ok = $false }
        if ($ok) { Log ("  OK  {0}" -f $stage.Name) 'Green'; return $true }

        if ($attempt -eq 1) { Log ("  DOWN {0} - healing..." -f $stage.Name) 'Yellow' }
        try { & $stage.Heal } catch { Log ("  heal error: {0}" -f $_.Exception.Message) 'Red' }

        # give it time to come up, then re-probe inside the loop
        Start-Sleep -Seconds ([Math]::Min(5 + $attempt * 3, 30))
        try { $ok = & $stage.Probe } catch { $ok = $false }
        if ($ok) { Log ("  HEALED {0} (attempt {1})" -f $stage.Name, $attempt) 'Green'; return $true }

        if (-not $stage.Required) {
            Log ("  SKIP {0} (optional, not up after attempt {1})" -f $stage.Name, $attempt) 'DarkYellow'
            return $false
        }
        if ($maxAttempts -gt 0 -and $attempt -ge $maxAttempts) { return $false }
        Log ("  RETRY {0} (attempt {1} failed - the House does not advance past a broken stage)" -f $stage.Name, $attempt) 'Red'
    }
}

# ── Bring-up: strictly ordered, gated ────────────────────────────────────
Log '=== FABLE''S HOUSE - bring-up start ===' 'Cyan'
foreach ($s in $Stages) { Invoke-Stage $s | Out-Null }

Log '=== HOUSE IS UP - public verification ===' 'Cyan'
$pubApi = Test-Http 'https://api.youandinotai.com/api/v1/health' 30 '"db_connected":true'
Log ("  public api.youandinotai.com: {0}" -f ($(if ($pubApi) {'OK'} else {'FAILED'}))) ($(if ($pubApi) {'Green'} else {'Red'}))

if (-not $Watchdog) {
    Log 'Bring-up complete. This window is done talking - it will not print again.' 'Cyan'
    Log 'The silent watchdog (hidden, log-file only) guards the House from Startup.' 'Cyan'
    exit 0
}

# ── Watchdog: hidden + silent. Heals forever, logs to file only. ─────────
Log '=== WATCHDOG (silent) - revalidating every 60s ===' 'Cyan'
while ($true) {
    Start-Sleep -Seconds 60
    foreach ($s in $Stages) {
        $ok = $false; try { $ok = & $s.Probe } catch {}
        if (-not $ok) {
            Log ("WATCHDOG: {0} fell - healing" -f $s.Name) 'Yellow'
            Invoke-Stage $s -maxAttempts 3 | Out-Null
        }
    }
}
