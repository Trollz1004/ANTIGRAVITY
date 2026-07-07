# Start Paperclip HQ on :3110.
# IMPORTANT: This script must be run from a NON-ELEVATED shell. Paperclip's
# embedded PostgreSQL refuses to start under a Windows account with
# administrative privileges. Running it as admin will fail.
#
# Primary env source:
#   C:\Users\joshl\OneDrive\JOSHUA's-DO-NOT-COMMIT-TO-GITHUB\MASTER-ANTIGRAVITY-ENV-2026-06-29T041901Z.env
# Stable repo-local override:
#   C:\antigravity\.env.paperclip
#
# Public exposure is handled externally (Port Warp / Cloudflare tunnel), so
# Paperclip stays in local_trusted/private mode on loopback only.
# The active instance lives at C:\Users\joshl\.paperclip\instances\default.

$ErrorActionPreference = 'Continue'
$LogDir  = 'c:\antigravity\logs'
$LogFile = "$LogDir\paperclip.log"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
    Write-Output $line
}

# Guard: refuse to run with an elevated/administrator token.
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdmin) {
    Log 'ERROR: Running as administrator. Paperclip embedded PostgreSQL will refuse to start.'
    Log 'Run this script from a normal (non-elevated) PowerShell or Command Prompt.'
    exit 1
}

# Parse a bash-style env file and inject into the current process environment.
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

# Priority: real master env > repo-local override > vault > briefings
$envPaths = @(
    'C:\Users\joshl\OneDrive\JOSHUA''s-DO-NOT-COMMIT-TO-GITHUB\MASTER-ANTIGRAVITY-ENV-2026-06-29T041901Z.env',
    'c:\antigravity\.env.paperclip',
    'C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env',
    'c:\antigravity\briefings\MASTER-UNIVERSAL-ENV-TROLLZ1004.env'
)
$loaded = $false
foreach ($p in $envPaths) {
    if (Import-EnvFile $p) { $loaded = $true }
}
if (-not $loaded) {
    Log 'WARN: no env file found - Paperclip may fail without API keys etc.'
}

# Paperclip's local_trusted instance is configured for embedded PostgreSQL.
# Some machine-wide env files use DATABASE_URL for unrelated apps such as
# AnythingLLM. Clear inherited DATABASE_URL unless explicitly allowed so
# Paperclip does not silently try the wrong database.
if ($env:DATABASE_URL -and $env:PAPERCLIP_ALLOW_EXTERNAL_DATABASE_URL -ne '1') {
    $dbSummary = 'set'
    try {
        $dbUri = [uri]$env:DATABASE_URL
        $dbSummary = if ($dbUri.Host) { "$($dbUri.Scheme)://$($dbUri.Host):$($dbUri.Port)$($dbUri.AbsolutePath)" } else { "$($dbUri.Scheme):$($dbUri.AbsolutePath)" }
    } catch {
        $dbSummary = 'set but unparseable'
    }
    Remove-Item -Path 'Env:DATABASE_URL' -ErrorAction SilentlyContinue
    Log "cleared inherited DATABASE_URL ($dbSummary) so Paperclip uses embedded Postgres"
}
if (-not $env:DATABASE_URL) {
    Log 'DATABASE_URL not set; Paperclip will use configured embedded Postgres'
}

# Keep Paperclip bound to the local loopback port the tunnel/Port Warp expects.
$env:PORT = '3110'
if (-not $env:PAPERCLIP_PUBLIC_URL) {
    $env:PAPERCLIP_PUBLIC_URL = 'http://localhost:3110'
}
if (-not $env:BETTER_AUTH_TRUSTED_ORIGINS) {
    $env:BETTER_AUTH_TRUSTED_ORIGINS = 'http://localhost:3110,http://127.0.0.1:3110'
}

Log "Starting Paperclip HQ on port $env:PORT (env loaded=$loaded)"

try {
    $paperclipCmd = Get-Command paperclipai.cmd -ErrorAction SilentlyContinue
    if (-not $paperclipCmd) {
        $paperclipCmd = Get-Command paperclipai -ErrorAction SilentlyContinue
    }

    if ($paperclipCmd) {
        Log "Using PaperclipAI command: $($paperclipCmd.Source)"
        & $paperclipCmd.Source run *>> $LogFile 2>&1
    } else {
        $npxCmd = Get-Command npx.cmd -ErrorAction SilentlyContinue
        if (-not $npxCmd) {
            $npxCmd = Get-Command npx -ErrorAction SilentlyContinue
        }
        if (-not $npxCmd) {
            throw 'paperclipai is not on PATH and npx was not found.'
        }
        Log "paperclipai command not found; falling back to npx: $($npxCmd.Source)"
        & $npxCmd.Source --yes paperclipai run *>> $LogFile 2>&1
    }
} catch {
    Log "ERROR: $($_.Exception.Message)"
    exit 1
}
