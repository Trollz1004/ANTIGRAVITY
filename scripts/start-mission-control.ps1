# Starts the Mission Control GUI + shared memory server.
# Intended for Windows Task Scheduler and safe to run manually.

[CmdletBinding()]
param(
    [string]$RepoRoot = 'C:\antigravity',
    [int]$Port = 8787,
    [switch]$ForceRestart,
    [switch]$Rebuild,
    [switch]$Foreground
)

$ErrorActionPreference = 'Stop'

$AppDir = Join-Path $RepoRoot 'apps\mission-control'
$DistIndex = Join-Path $AppDir 'dist\index.html'
$LogDir = Join-Path $RepoRoot 'logs'
$OutLog = Join-Path $LogDir 'mission-control-memory.out.log'
$ErrLog = Join-Path $LogDir 'mission-control-memory.err.log'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-MissionLog {
    param([string]$Message)
    $line = "[{0}] {1}" -f (Get-Date -Format o), $Message
    Add-Content -LiteralPath (Join-Path $LogDir 'mission-control-start.log') -Value $line
    Write-Output $line
}

function Test-MissionControlHealthy {
    param([int]$HealthPort)
    try {
        $response = Invoke-RestMethod -Uri "http://127.0.0.1:$HealthPort/health" -Method Get -TimeoutSec 3
        return ($response.ok -eq $true -and $response.app -eq 'mission-control-memory-gui')
    } catch {
        return $false
    }
}

function Get-PortOwner {
    param([int]$LocalPort)
    $connection = Get-NetTCPConnection -LocalPort $LocalPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $connection) { return $null }
    return Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)" -ErrorAction SilentlyContinue
}

function Stop-KnownMissionControlListener {
    param([int]$LocalPort)

    $owner = Get-PortOwner -LocalPort $LocalPort
    if (-not $owner) { return }

    $commandLine = [string]$owner.CommandLine
    $knownMissionControlProcess =
        $commandLine -match 'memory-server\.mjs' -or
        $commandLine -match 'mission_control_api\.main' -or
        $commandLine -match 'apps[\\/]+mission-control'

    if (-not $knownMissionControlProcess) {
        throw "Port $LocalPort is already used by PID $($owner.ProcessId), not a known Mission Control process: $commandLine"
    }

    Write-MissionLog "stopping existing Mission Control listener PID $($owner.ProcessId) on port $LocalPort"
    Stop-Process -Id $owner.ProcessId -Force
    Start-Sleep -Seconds 2
}

if (-not (Test-Path -LiteralPath $AppDir)) {
    throw "Mission Control app directory not found: $AppDir"
}

if ((Test-MissionControlHealthy -HealthPort $Port) -and -not $ForceRestart) {
    Write-MissionLog "Mission Control already healthy on http://127.0.0.1:$Port/"
    exit 0
}

if ($ForceRestart -or (Get-PortOwner -LocalPort $Port)) {
    Stop-KnownMissionControlListener -LocalPort $Port
}

$npm = Get-Command npm.cmd -ErrorAction Stop
$node = Get-Command node.exe -ErrorAction Stop

if ($Rebuild -or -not (Test-Path -LiteralPath $DistIndex)) {
    $tscCmd = Join-Path $AppDir 'node_modules\.bin\tsc.cmd'
    if (-not (Test-Path -LiteralPath $tscCmd)) {
        Write-MissionLog "Mission Control dependencies missing; running npm ci in $AppDir"
        $install = Start-Process -FilePath $npm.Source -ArgumentList @('ci') -WorkingDirectory $AppDir -Wait -NoNewWindow -PassThru
        if ($install.ExitCode -ne 0) {
            throw "Mission Control dependency install failed with exit code $($install.ExitCode)"
        }
    }

    Write-MissionLog "building Mission Control GUI in $AppDir"
    $build = Start-Process -FilePath $npm.Source -ArgumentList @('run', 'build') -WorkingDirectory $AppDir -Wait -NoNewWindow -PassThru
    if ($build.ExitCode -ne 0) {
        throw "Mission Control build failed with exit code $($build.ExitCode)"
    }
} else {
    Write-MissionLog "using existing Mission Control build at $DistIndex"
}

Write-MissionLog "starting Mission Control memory server on http://127.0.0.1:$Port/"
$envBlock = @{
    PORT = [string]$Port
}

foreach ($key in $envBlock.Keys) {
    [System.Environment]::SetEnvironmentVariable($key, $envBlock[$key], 'Process')
}

if ($Foreground) {
    Write-MissionLog "running Mission Control memory server in foreground for Task Scheduler"
    Push-Location $AppDir
    try {
        & $node.Source 'memory-server.mjs' >> $OutLog 2>> $ErrLog
        exit $LASTEXITCODE
    } finally {
        Pop-Location
    }
}

$process = Start-Process -FilePath $node.Source `
    -ArgumentList @('memory-server.mjs') `
    -WorkingDirectory $AppDir `
    -RedirectStandardOutput $OutLog `
    -RedirectStandardError $ErrLog `
    -WindowStyle Hidden `
    -PassThru

for ($i = 0; $i -lt 30; $i++) {
    if (Test-MissionControlHealthy -HealthPort $Port) {
        Write-MissionLog "Mission Control healthy on http://127.0.0.1:$Port/ with PID $($process.Id)"
        exit 0
    }
    Start-Sleep -Seconds 1
}

throw "Mission Control did not become healthy on http://127.0.0.1:$Port/ after start"
