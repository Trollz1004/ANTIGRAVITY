# ── DateApp API — api.youandinotai.com backend (:8000) ────────────────────
# FastAPI app served by uvicorn from backend\fastapi-app using backend\.venv.
#
# SECRETS: loaded at runtime from the local vault handoff file (outside the
# repo, never committed, never echoed). Per doctrine: env authority stays in
# the vault; this script only maps it into process env.
$ErrorActionPreference = 'Stop'

$VaultEnv = 'C:\Users\joshi\.antigravity-vault\vault-handoff\env-stash-from-documents\.env-not-for-github.txt'
$AppDir   = 'C:\ANTIGRAVITY\backend\fastapi-app'
$Python   = 'C:\ANTIGRAVITY\backend\.venv\Scripts\python.exe'

if (-not (Test-Path $VaultEnv)) { Write-Error "vault env missing: $VaultEnv"; exit 1 }
if (-not (Test-Path $Python))   { Write-Error "backend venv missing: $Python"; exit 1 }

# Load KEY=VALUE lines into process env without printing values.
Get-Content $VaultEnv | ForEach-Object {
    if ($_ -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
        $name = $Matches[1]; $val = $Matches[2].Trim()
        if ($val.Length -gt 0) { [Environment]::SetEnvironmentVariable($name, $val, 'Process') }
    }
}

# The stash holds two DATABASE_URL lines (dating + legacy crosslist); the loop
# above lets the last win. Pin the dating one (postgresql+asyncpg → uandinotai_dating).
$dating = (Get-Content $VaultEnv | Where-Object { $_ -match '^DATABASE_URL=postgresql\+asyncpg://' } | Select-Object -First 1)
if ($dating) { [Environment]::SetEnvironmentVariable('DATABASE_URL', $dating.Substring('DATABASE_URL='.Length).Trim(), 'Process') }

# The stash's REDIS_URL points at the retired stack's Redis; this node runs a
# local portable Redis (see scripts\sabretooth-stack-up.cmd).
$env:REDIS_URL = 'redis://localhost:6379/0'
Remove-Item Env:REDIS_PASSWORD -ErrorAction SilentlyContinue

$env:APP_ENV = 'production'
$env:PORT    = '8000'

Set-Location $AppDir
& $Python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
