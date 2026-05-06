# Start Paperclip HQ on :3100 with all required env vars loaded from the
# OneDrive-backed master env vault. The active instance lives at
# C:\Users\joshl\.paperclip\instances\default.
#
# Postgres is the docker container `paperclip-postgres` on 127.0.0.1:5432
# (started by scripts/autostart-mission.ps1 phase 2).

$ErrorActionPreference = 'Continue'
$LogDir  = 'C:\Antigravity\logs'
$LogFile = "$LogDir\paperclip.log"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
}

# Parse a bash-style env file (`KEY=value`, `export KEY=value`, with optional quotes)
# and inject into the current process environment.
function Import-EnvFile($path) {
    if (-not (Test-Path $path)) { return $false }
    $count = 0
    Get-Content $path -ErrorAction SilentlyContinue | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq '' -or $line.StartsWith('#')) { return }
        if ($line -match '^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
            $name  = $matches[1]
            $value = $matches[2].Trim()
            if ($value.StartsWith("'") -and $value.EndsWith("'")) {
                $value = $value.Substring(1, $value.Length - 2)
            } elseif ($value.StartsWith('"') -and $value.EndsWith('"')) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            Set-Item -Path "Env:$name" -Value $value -ErrorAction SilentlyContinue
            $count++
        }
    }
    Log "loaded $count env vars from $path"
    return $true
}

Log '=== start-paperclip.ps1 ==='

# Try the OneDrive vault first, then a repo-local fallback.
$envPaths = @(
    'C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env',
    'C:\Antigravity\briefings\MASTER-UNIVERSAL-ENV-TROLLZ1004.env'
)
$loaded = $false
foreach ($p in $envPaths) {
    if (Import-EnvFile $p) { $loaded = $true; break }
}
if (-not $loaded) {
    Log 'WARN: no env vault found — Paperclip may fail without DATABASE_URL etc.'
}

# Sanity defaults — only set if env vault didn't already provide them.
if (-not $env:DATABASE_URL) {
    $env:DATABASE_URL = 'postgres://paperclip:paperclip_local_only@localhost:5432/paperclip'
    Log 'DATABASE_URL not in vault; defaulting to local docker postgres'
}
if (-not $env:PAPERCLIP_PUBLIC_URL) {
    $env:PAPERCLIP_PUBLIC_URL = 'http://localhost:3100'
}
if (-not $env:BETTER_AUTH_TRUSTED_ORIGINS) {
    $env:BETTER_AUTH_TRUSTED_ORIGINS = 'http://localhost:3100,http://127.0.0.1:3100'
}
if (-not $env:PORT) {
    $env:PORT = '3100'
}

Log "Starting Paperclip HQ on port $env:PORT (DATABASE_URL set, env loaded=$loaded)"

try {
    & 'C:\Users\joshl\AppData\Roaming\npm\paperclipai.cmd' run *>> $LogFile 2>&1
} catch {
    Log "ERROR: $($_.Exception.Message)"
    exit 1
}
