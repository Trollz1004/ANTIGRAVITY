$ErrorActionPreference = 'Stop'

$RepoRoot = 'C:\antigravity'
$AppDir = Join-Path $RepoRoot 'apps\business-exchange'
$LogDir = Join-Path $RepoRoot 'logs'
$LogFile = Join-Path $LogDir 'business-exchange-9020.log'
$StartupLogFile = Join-Path $LogDir 'business-exchange-9020-startup.log'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-Log {
    param([string]$Message)
    try {
        Add-Content -Path $StartupLogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ErrorAction Stop
    } catch {
        Write-Output "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    }
}

function Test-BusinessExchangeHealthy {
    param([string]$Port = '3050')

    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$Port/api/health" -TimeoutSec 3 -MaximumRedirection 0
        return $response.StatusCode -eq 200 -and $response.Content -match '"service"\s*:\s*"business-exchange"'
    } catch {
        return $false
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

Write-Log '=== Start-BusinessExchange-9020 ==='

if (Test-BusinessExchangeHealthy -Port '3050') {
    Write-Log 'Business Exchange already healthy on 127.0.0.1:3050'
    exit 0
}

$envCandidates = @(
    'C:\Users\joshl\OneDrive\JOSHUA''s-DO-NOT-COMMIT-TO-GITHUB\JOSHUAS.ENV',
    'C:\Users\joshl\OneDrive\Personal Vault\ENV-AUTHORITY-20260608-082127\derived-platform-envs\runtime-misc.env',
    'C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env',
    'C:\antigravity\briefings\MASTER-UNIVERSAL-ENV-TROLLZ1004.env',
    (Join-Path $AppDir '.env')
)

$loaded = $false
foreach ($candidate in $envCandidates) {
    if (Import-EnvFile -Path $candidate) {
        $loaded = $true
        break
    }
}
if (-not $loaded) {
    Write-Log 'WARN: no env handoff file found; app will use safe local defaults where coded.'
}

$env:NODE_ENV = 'production'
$env:PORT = '3050'
$env:APP_URL = if ($env:APP_URL) { $env:APP_URL } else { 'http://localhost:3050' }
$env:NEXT_TELEMETRY_DISABLED = '1'

Set-Location $AppDir

if (-not (Test-Path -LiteralPath (Join-Path $AppDir 'node_modules'))) {
    Write-Log 'installing npm dependencies'
    npm install *>> $LogFile
}

Write-Log 'generating Prisma client'
npm run db:generate *>> $LogFile

$buildOk = Test-Path -LiteralPath (Join-Path $AppDir '.next\BUILD_ID')
if (-not $buildOk -or $env:BUSINESS_EXCHANGE_REBUILD_ON_START -eq '1') {
    Write-Log 'building Business Exchange'
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    npm run build -- --no-lint *>> $LogFile
    $buildExit = $LASTEXITCODE
    $ErrorActionPreference = $oldPreference
    $buildOk = $buildExit -eq 0 -and (Test-Path -LiteralPath (Join-Path $AppDir '.next\BUILD_ID'))
    if (-not $buildOk) {
        Write-Log "production build unavailable; falling back to next dev on 0.0.0.0:3050"
    }
}

if ($buildOk) {
    Write-Log 'starting Business Exchange production server on 0.0.0.0:3050'
    npm run start *>> $LogFile
} else {
    $env:NODE_ENV = 'development'
    Write-Log 'starting Business Exchange dev server on 0.0.0.0:3050'
    npx next dev -H 0.0.0.0 -p 3050 *>> $LogFile
}
