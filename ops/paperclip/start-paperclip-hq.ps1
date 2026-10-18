# Paperclip HQ launcher — THE single Paperclip instance on this node (2026-10-17).
#
#   process : upstream npm paperclipai (`%APPDATA%\npm\paperclipai.cmd run`)
#   port    : 4747   (cloudflared proxies mcp.youandinotai.com -> 127.0.0.1:4747)
#   home    : C:\Users\joshi\.paperclip-hermes
#   database: embedded Postgres in that home (fresh; old paperclip_hq is not used)
#   mode    : local_trusted / private, port 4747, hostname mcp.youandinotai.com allowed
#
# Two restart defects this file exists to fix:
#   1. The startup doctor aborts ("Cannot connect to PostgreSQL") if it runs before the
#      portable Postgres on :5432 is ready — so wait for pg_isready and retry.
#   2. Task Scheduler kills the whole process tree when the task's script returns. The
#      old version exited as soon as the server answered, so ~4 minutes later the server
#      was killed and the tunnel returned 502. This version never returns while the
#      server is healthy: it blocks and monitors, and only falls through to a relaunch
#      when the server actually stops answering.
#
# Never run elevated: the task "ANTIGRAVITY Paperclip" is registered RunLevel Limited.
param(
    [int]$Port = 4747,
    [int]$PgWaitSeconds = 240,
    [int]$MaxAttempts = 3,
    [int]$PollSeconds = 30
)

$ErrorActionPreference = 'Continue'
$Repo    = 'C:\ANTIGRAVITY'
$Home2   = Join-Path $env:USERPROFILE '.paperclip-hermes'
$LogFile = Join-Path $Repo 'logs\paperclip-hq.log'
$Exe     = Join-Path $env:APPDATA 'npm\paperclipai.cmd'
$PgBin   = 'C:\Users\joshi\pgsql16\bin'

function Log([string]$m) {
    $line = '[{0}] [paperclip-hq-launcher] {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m
    try { Add-Content -Path (Join-Path $Repo 'logs\t5500-keepalive.log') -Value $line } catch {}
    Write-Output $line
}

function Test-Hq {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/health" -UseBasicParsing -TimeoutSec 6
        return ($r.StatusCode -eq 200 -and $r.Content -match '"deploymentMode"\s*:\s*"local_trusted"')
    } catch { return $false }
}

function Test-PgReady {
    $exe = Join-Path $PgBin 'pg_isready.exe'
    if (-not (Test-Path $exe)) { return $false }
    & $exe -h 127.0.0.1 -p 5432 -q 2>$null
    return ($LASTEXITCODE -eq 0)
}

# S4U tokens keep the Administrators SID even with RunLevel Limited, so this is
# informational only — a hard refusal here silently killed every boot.
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Log ('token reports admin=' + $admin + ' (task policy is Limited; proceeding)')

if (-not (Test-Path $Exe)) { Log "paperclipai not installed ($Exe) - run: npm i -g paperclipai"; exit 2 }

$env:PORT = "$Port"
$env:PAPERCLIP_HOME = $Home2

for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    if (Test-Hq) {
        Log "already UP on :$Port - staying attached so Task Scheduler cannot kill it"
    } else {
        # Boot race: Postgres (manual portable install) may still be starting.
        if (-not (Test-PgReady)) {
            Log "waiting for PostgreSQL :5432 (up to ${PgWaitSeconds}s)"
            $deadline = (Get-Date).AddSeconds($PgWaitSeconds)
            while ((Get-Date) -lt $deadline -and -not (Test-PgReady)) { Start-Sleep -Seconds 3 }
        }
        if (-not (Test-PgReady)) {
            Log 'PostgreSQL :5432 never became ready - not starting (task "ANTIGRAVITY Postgres" owns that)'
            exit 4
        }
        Log "starting Paperclip HQ on :$Port (attempt $attempt/$MaxAttempts)"
        Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
            ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Seconds 2
        & $Exe run -d $Home2 *>> $LogFile
        Log "Paperclip HQ exited with code $LASTEXITCODE"
        if ($attempt -lt $MaxAttempts) { Start-Sleep -Seconds (10 * $attempt); continue }
        break
    }

    # Stay alive while healthy. Returning here is what let the task's job object kill
    # the server and produce the 502 on mcp.youandinotai.com.
    while (Test-Hq) { Start-Sleep -Seconds $PollSeconds }
    Log 'server stopped answering - relaunching'
}

exit 1
