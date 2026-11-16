# ── DateApp API — api.youandinotai.com backend (:8000) ────────────────────
# FastAPI app served by uvicorn from domains\youandinotai.com\backend (moved
# from backend\fastapi-app by the repo consolidation, 2026-09-17) using the
# venv that stayed at backend\.venv (it was never inside fastapi-app).
#
# SECRETS: loaded at runtime from the local vault handoff file (outside the
# repo, never committed, never echoed). Per doctrine: env authority stays in
# the vault; this script only maps it into process env.
$ErrorActionPreference = 'Stop'

$RepoRoot = if (Test-Path 'C:\ANTIGRAVITY') { 'C:\ANTIGRAVITY' } else { (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path }
. (Join-Path $RepoRoot 'ops\fleet\Get-FleetEndpoint.ps1')
$ApiSvc      = Get-FleetService -ServiceId 'dateapp-api'
$ApiBindHost = Get-FleetBindHost -ServiceId 'dateapp-api' -EnvOverride $env:DATEAPP_API_HOST
$ApiPort     = if ($env:PORT) { [int]$env:PORT } else { [int]$ApiSvc.port }

$VaultEnv = Join-Path $env:USERPROFILE '.antigravity-vault\vault-handoff\env-stash-from-documents\.env-not-for-github.txt'
$AppDir   = Join-Path $RepoRoot 'domains\youandinotai.com\backend'
$Python   = Join-Path $RepoRoot 'backend\.venv\Scripts\python.exe'

if (-not (Test-Path $VaultEnv)) { Write-Error "vault env missing: $VaultEnv"; exit 1 }
if (-not (Test-Path $Python))   { Write-Error "backend venv missing: $Python"; exit 1 }

# Load KEY=VALUE lines into process env without printing values.
Get-Content $VaultEnv | ForEach-Object {
    if ($_ -match '^([A-Za-z_][A-Za-z09_]*)=(.*)$' -or $_ -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
        $name = $Matches[1]; $val = $Matches[2].Trim()
        if ($val.Length -gt 0) { [Environment]::SetEnvironmentVariable($name, $val, 'Process') }
    }
}

# The stash holds two DATABASE_URL lines (dating + legacy crosslist); the loop
# above lets the last win. Pin the dating one (postgresql+asyncpg → uandinotai_dating).
$dating = (Get-Content $VaultEnv | Where-Object { $_ -match '^DATABASE_URL=postgresql\+asyncpg://' } | Select-Object -First 1)
if ($dating) { [Environment]::SetEnvironmentVariable('DATABASE_URL', $dating.Substring('DATABASE_URL='.Length).Trim(), 'Process') }

# Supabase cutover: if the vault holds a Supabase DB URL, it wins over the
# local portable Postgres (127.0.0.1:5432, this machine only). Drop a single
# line DATABASE_URL=postgresql+asyncpg://... into this file to flip the app to
# cloud Postgres; delete the file to flip back.
$SupaEnv = Join-Path $env:USERPROFILE '.antigravity-vault\supabase-db-url.env'
if (Test-Path $SupaEnv) {
    $line = (Get-Content $SupaEnv | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1)
    if ($line) { [Environment]::SetEnvironmentVariable('DATABASE_URL', $line.Substring('DATABASE_URL='.Length).Trim(), 'Process') }
}

# Redis stays strictly on 127.0.0.1:6379/0 ("this machine only").
$env:REDIS_URL = 'redis://127.0.0.1:6379/0'
Remove-Item Env:REDIS_PASSWORD -ErrorAction SilentlyContinue

# The stash holds duplicate SQUARE_LOCATION_ID lines and last-wins picks a dead
# location (Square rejects it, killing every checkout link). Pin the ACTIVE
# location for merchant ML3C7FMTQS5KX, verified via Square API 2026-08-16.
$env:SQUARE_LOCATION_ID = 'LY5GN09F5AN83'

$env:APP_ENV = 'production'
$env:PORT    = [string]$ApiPort

Set-Location $AppDir
if ($ApiBindHost -eq '0.0.0.0' -and $ApiPort -eq 8000) {
    & $Python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
} else {
    & $Python -m uvicorn app.main:app --host $ApiBindHost --port $ApiPort
}
