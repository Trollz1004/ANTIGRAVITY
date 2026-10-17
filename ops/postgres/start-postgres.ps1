# PostgreSQL 18 (portable install) starter — 2026-10-17.
#
# Why this exists: C:\Users\joshi\pgsql16 is a *manual* install. It has no Windows
# service and no boot starter, so after every reboot :5432 was simply absent. Paperclip
# HQ's startup doctor then failed ("Cannot connect to PostgreSQL"), aborted, and the
# keepalive could only heal it on its next pass — which is why mcp.youandinotai.com
# never came back on restart.
#
# Idempotent: if :5432 already answers it exits 0 immediately.
# Non-elevated: the data dir belongs to this user; postgres refuses to run as admin.
#
# Started by the scheduled task "ANTIGRAVITY Postgres" (boot + logon, Limited).
param(
    [int]$Port = 5432,
    [int]$WaitSeconds = 90
)

$ErrorActionPreference = 'Continue'
$Repo   = 'C:\ANTIGRAVITY'
$PgBin  = 'C:\Users\joshi\pgsql16\bin'
$PgData = 'C:\Users\joshi\pgsql16-data'
$Log    = Join-Path $Repo 'logs\pg-t5500.log'

function Log([string]$m) {
    $line = '[{0}] [postgres-launcher] {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m
    try { Add-Content -Path (Join-Path $Repo 'logs\t5500-keepalive.log') -Value $line } catch {}
    Write-Output $line
}

$pgReady = Join-Path $PgBin 'pg_isready.exe'
$pgCtl   = Join-Path $PgBin 'pg_ctl.exe'

function Test-PgReady {
    if (-not (Test-Path $pgReady)) { return $false }
    & $pgReady -h 127.0.0.1 -p $Port -q 2>$null
    return ($LASTEXITCODE -eq 0)
}

if (Test-PgReady) { Log "already UP on :$Port"; exit 0 }
if (-not (Test-Path $pgCtl))  { Log "pg_ctl.exe not found at $pgCtl"; exit 2 }
if (-not (Test-Path $PgData)) { Log "data dir not found at $PgData"; exit 2 }

# Under an S4U logon the token still carries the Administrators SID, so IsInRole reads
# True even with task RunLevel Limited — a hard refusal here would stop Postgres at boot.
# Postgres itself is the real gate: if the token is genuinely elevated it refuses to start
# and pg_ctl reports that in the log below.
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Log ('token reports admin=' + $admin + ' (task policy is Limited; proceeding)')

# A pid file left behind by a hard shutdown blocks startup forever otherwise.
$pidFile = Join-Path $PgData 'postmaster.pid'
if ((Test-Path $pidFile) -and -not (Get-Process postgres -ErrorAction SilentlyContinue)) {
    Move-Item $pidFile ($pidFile + '.stale-' + (Get-Date -Format 'yyyyMMddHHmmss')) -Force
    Log 'cleared stale postmaster.pid'
}

Log "starting PostgreSQL :$Port from $PgData"
& $pgCtl start -D $PgData -w -t $WaitSeconds -l $Log | Out-Null
$code = $LASTEXITCODE

$deadline = (Get-Date).AddSeconds($WaitSeconds)
while ((Get-Date) -lt $deadline -and -not (Test-PgReady)) { Start-Sleep -Seconds 2 }

if (Test-PgReady) { Log "UP on :$Port"; exit 0 }
Log "did NOT come up on :$Port (pg_ctl exit $code) - see $Log"
exit 1
