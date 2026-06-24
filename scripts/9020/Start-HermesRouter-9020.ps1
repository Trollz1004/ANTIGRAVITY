$ErrorActionPreference = 'Stop'

$RepoRoot = 'C:\antigravity'
$ServiceDir = Join-Path $RepoRoot 'services\hermes-router'
$RuntimeRoot = 'C:\antigravity-runtime\9020\hermes-router'
$VenvDir = Join-Path $RuntimeRoot '.venv'
$LogDir = Join-Path $RepoRoot 'logs'
$LogFile = Join-Path $LogDir 'hermes-router-9020.log'
$StartupLogFile = Join-Path $LogDir 'hermes-router-9020-startup.log'
$DepsStamp = Join-Path $VenvDir '.deps-ok'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
New-Item -ItemType Directory -Force -Path $RuntimeRoot | Out-Null

function Write-Log {
    param([string]$Message)
    try {
        Add-Content -Path $StartupLogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ErrorAction Stop
    } catch {
        Write-Output "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    }
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
    $preferred = @(
        'C:\Users\joshl\AppData\Roaming\uv\python\cpython-3.12-windows-x86_64-none\python.exe',
        'C:\Users\joshl\AppData\Roaming\uv\python\cpython-3.11.15-windows-x86_64-none\python.exe',
        'C:\Users\joshl\AppData\Roaming\uv\python\cpython-3.11-windows-x86_64-none\python.exe'
    )
    foreach ($candidate in $preferred) {
        if (Test-Path -LiteralPath $candidate) {
            return $candidate
        }
    }

    $cmd = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $py = Get-Command py.exe -ErrorAction SilentlyContinue
    if ($py) { return $py.Source }

    throw 'python.exe or py.exe is required for Hermes Router on 9020.'
}

function Test-HermesRouterHealthy {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$env:HERMES_ROUTER_PORT/healthz" -TimeoutSec 3
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
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
$env:PIP_NO_CACHE_DIR = '1'
$env:HERMES_ROUTER_PORT = if ($env:HERMES_ROUTER_PORT) { $env:HERMES_ROUTER_PORT } else { '11435' }
$env:HERMES_ROUTER_CONFIG = Join-Path $ServiceDir 'config.yaml'

if (Test-HermesRouterHealthy) {
    Write-Log "Hermes Router already healthy on 127.0.0.1:$env:HERMES_ROUTER_PORT"
    exit 0
}

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

$requirements = Join-Path $ServiceDir 'requirements.txt'
$depsCurrent = (Test-Path -LiteralPath $DepsStamp) -and ((Get-Item -LiteralPath $DepsStamp).LastWriteTimeUtc -ge (Get-Item -LiteralPath $requirements).LastWriteTimeUtc)
if (-not $depsCurrent) {
    Write-Log 'installing Hermes Router dependencies'
    $installArgs = "/c `"`"$venvPython`" -m pip install --disable-pip-version-check --no-cache-dir --quiet -r `"$requirements`" >> `"$LogFile`" 2>&1`""
    $proc = Start-Process -FilePath 'cmd.exe' -ArgumentList $installArgs -Wait -PassThru -WindowStyle Hidden
    if ($proc.ExitCode -ne 0) {
        throw "pip install failed with exit code $($proc.ExitCode)"
    }
    New-Item -ItemType File -Force -Path $DepsStamp | Out-Null
} else {
    Write-Log 'Hermes Router dependencies already current'
}

Write-Log "starting Hermes Router on 0.0.0.0:$env:HERMES_ROUTER_PORT"
Set-Location $ServiceDir

$routerScript = Join-Path $ServiceDir 'hermes_router.py'
$runArgs = "/c `"cd /d `"$ServiceDir`" && set PYTHONIOENCODING=utf-8 && set PYTHONUNBUFFERED=1 && set HERMES_ROUTER_PORT=$env:HERMES_ROUTER_PORT && set HERMES_ROUTER_CONFIG=$env:HERMES_ROUTER_CONFIG && `"$venvPython`" `"$routerScript`" >> `"$LogFile`" 2>&1`""
$process = Start-Process -FilePath 'cmd.exe' -ArgumentList $runArgs -PassThru -WindowStyle Hidden
Write-Log "spawned Hermes Router process wrapper pid=$($process.Id)"

for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    if (Test-HermesRouterHealthy) {
        Write-Log "Hermes Router healthy on 127.0.0.1:$env:HERMES_ROUTER_PORT"
        exit 0
    }
}

throw "Hermes Router did not become healthy on 127.0.0.1:$env:HERMES_ROUTER_PORT"
