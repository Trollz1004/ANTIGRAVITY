[CmdletBinding()]
param(
    [string]$RepoRoot,
    [string]$CodeXRoot,
    [string]$LauncherPath,
    [string]$LogPath,
    [ValidateSet("docker", "host", "off")]
    [string]$Mode = $(if ($env:CODEX_MISSION_MODE) { $env:CODEX_MISSION_MODE } else { "off" }),
    [string]$DockerContainer = $(if ($env:CODEX_DOCKER_CONTAINER) { $env:CODEX_DOCKER_CONTAINER } else { "codex-sabretooth" }),
    [switch]$AllowHostLaunch
)

$ErrorActionPreference = "Stop"

if (-not $RepoRoot) {
    $RepoRoot = Split-Path -Parent $PSScriptRoot
}
if (-not $CodeXRoot) {
    $CodeXRoot = Join-Path $RepoRoot "CodeX"
}
if (-not $LauncherPath) {
    $LauncherPath = Join-Path $RepoRoot "scripts\Launch-CodeX-Mission.ps1"
}
if (-not $LogPath) {
    $LogPath = Join-Path $RepoRoot "CodeX\logs\codex-mission-guardian.log"
}

function Write-GuardianLog {
    param([string]$Message)

    $logDir = Split-Path -Path $LogPath -Parent
    if (-not (Test-Path -LiteralPath $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }

    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$ts] $Message" | Add-Content -Path $LogPath
}

if (-not (Test-Path -LiteralPath $LauncherPath)) {
    Write-GuardianLog "Launcher missing at $LauncherPath"
    exit 1
}

if ($Mode -eq "off") {
    exit 0
}

$hostMissionProcess = Get-CimInstance Win32_Process -Filter "Name='pwsh.exe'" -ErrorAction SilentlyContinue |
    Where-Object {
        $_.ProcessId -ne $PID -and
        $_.CommandLine -match "Launch-CodeX-Mission\.ps1" -and
        $_.CommandLine -notmatch "Ensure-CodeX-Mission\.ps1"
    } |
    Select-Object -First 1

if ($Mode -eq "docker") {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { exit 0 }

    & docker info 1>$null 2>$null
    if ($LASTEXITCODE -ne 0) { exit 0 }

    $containerName = (& docker ps --filter "name=^/$DockerContainer$" --filter "status=running" --format "{{.Names}}" 2>$null | Select-Object -First 1)
    if ([string]::IsNullOrWhiteSpace($containerName)) {
        # Desktop-app-first operation on Sabretooth no longer relies on a dedicated Codex shell container.
        # If the old mission container is absent, treat that as a normal state and stay quiet.
        exit 0
    }

    if ($null -ne $hostMissionProcess) {
        Write-GuardianLog "Docker mode active; host mission process detected (PID=$($hostMissionProcess.ProcessId)). No relaunch needed."
    }

    exit 0
}

if ($null -ne $hostMissionProcess) {
    exit 0
}

Write-GuardianLog "CodeX Mission not detected. Launching a new mission terminal."
Start-Process -FilePath "pwsh.exe" `
    -ArgumentList @("-NoExit", "-ExecutionPolicy", "Bypass", "-File", $LauncherPath, "-Runtime", "host") `
    -WorkingDirectory $CodeXRoot `
    -WindowStyle Normal | Out-Null

exit 0
