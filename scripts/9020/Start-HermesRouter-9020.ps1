$ErrorActionPreference = 'Stop'

$RepoRoot = 'C:\antigravity'
$ServiceDir = Join-Path $RepoRoot 'services\hermes-router'
$VenvDir = Join-Path $ServiceDir '.venv-win'
$LogDir = Join-Path $RepoRoot 'logs'
$LogFile = Join-Path $LogDir 'hermes-router-9020.log'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-Log {
    param([string]$Message)
    Add-Content -Path $LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
}

function Import-EnvFile {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return $false
    }

    $count = 0
    Get-Content -LiteralPath $Path -ErrorAction Stop | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq '' -or $line.StartsWith('#')) { return }
        if ($line -match '^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
            $name = $matches[1]
            $value = $matches[2].Trim()
            if ($value.StartsWith("'") -and $value.EndsWith("'")) {
                $value = $value.Substring(1, $value.Length - 2)
            } elseif ($value.StartsWith('"') -and $value.EndsWith('"')) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            Set-Item -Path "Env:$name" -Value $value
            $count++
        }
    }

    Write-Log "loaded $count env vars from $Path"
    return $true
}

function Resolve-Python {
    $cmd = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $py = Get-Command py.exe -ErrorAction SilentlyContinue
    if ($py) { return $py.Source }

    throw 'python.exe or py.exe is required for Hermes Router on 9020.'
}

Write-Log '=== Start-HermesRouter-9020 ==='

$envCandidates = @(
    'C:\Users\joshl\OneDrive\JOSHUA''s-DO-NOT-COMMIT-TO-GITHUB\JOSHUAS.ENV',
    'C:\Users\joshl\OneDrive\Personal Vault\ENV-AUTHORITY-20260608-082127\derived-platform-envs\runtime-misc.env',
    'C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env',
    'C:\antigravity\briefings\MASTER-UNIVERSAL-ENV-TROLLZ1004.env'
)

$loaded = $false
foreach ($candidate in $envCandidates) {
    if (Import-EnvFile -Path $candidate) {
        $loaded = $true
        break
    }
}
if (-not $loaded) {
    Write-Log 'WARN: no env handoff file found; local Ollama aliases can still run, hosted aliases may lack API keys.'
}

$env:PYTHONIOENCODING = 'utf-8'
$env:PYTHONUNBUFFERED = '1'
$env:HERMES_ROUTER_PORT = if ($env:HERMES_ROUTER_PORT) { $env:HERMES_ROUTER_PORT } else { '11435' }
$env:HERMES_ROUTER_CONFIG = Join-Path $ServiceDir 'config.yaml'

$python = Resolve-Python
$venvPython = Join-Path $VenvDir 'Scripts\python.exe'

if (-not (Test-Path -LiteralPath $venvPython)) {
    Write-Log "creating Windows venv at $VenvDir"
    if ((Split-Path -Leaf $python) -ieq 'py.exe') {
        & $python -3 -m venv $VenvDir *>> $LogFile
    } else {
        & $python -m venv $VenvDir *>> $LogFile
    }
}

Write-Log 'installing Hermes Router dependencies'
& $venvPython -m pip install --quiet -r (Join-Path $ServiceDir 'requirements.txt') *>> $LogFile

Write-Log "starting Hermes Router on 0.0.0.0:$env:HERMES_ROUTER_PORT"
Set-Location $ServiceDir
& $venvPython (Join-Path $ServiceDir 'hermes_router.py') *>> $LogFile

