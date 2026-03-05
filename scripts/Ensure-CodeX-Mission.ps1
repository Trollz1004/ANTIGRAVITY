[CmdletBinding()]
param(
    [string]$RepoRoot = "E:\ANTIGRAVITY",
    [string]$CodeXRoot = "E:\ANTIGRAVITY\CodeX",
    [string]$LauncherPath = "E:\ANTIGRAVITY\scripts\Launch-CodeX-Mission.ps1",
    [string]$LogPath = "E:\ANTIGRAVITY\CodeX\logs\codex-mission-guardian.log",
    [ValidateSet("docker", "host", "off")]
    [string]$Mode = $(if ($env:CODEX_MISSION_MODE) { $env:CODEX_MISSION_MODE } else { "docker" }),
    [string]$DockerContainer = $(if ($env:CODEX_DOCKER_CONTAINER) { $env:CODEX_DOCKER_CONTAINER } else { "codex-sabretooth" }),
    [switch]$AllowHostLaunch
)

$ErrorActionPreference = "Stop"

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
    Write-GuardianLog "Mission guardian mode is OFF. No launch action taken."
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
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-GuardianLog "Docker mode active but docker is not available in PATH. Host launch suppressed."
        exit 0
    }

    & docker info 1>$null 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-GuardianLog "Docker mode active but Docker engine is unavailable. Host launch suppressed."
        exit 0
    }

    $containerName = (& docker ps --filter "name=^/$DockerContainer$" --filter "status=running" --format "{{.Names}}" 2>$null | Select-Object -First 1)
    if ([string]::IsNullOrWhiteSpace($containerName)) {
        Write-GuardianLog "Docker mode active but container '$DockerContainer' is not running. Host launch suppressed."
    }

    if ($null -ne $hostMissionProcess) {
        Write-GuardianLog "Docker mode active; host mission process detected (PID=$($hostMissionProcess.ProcessId)). No relaunch needed."
    }

    exit 0
}

if (-not $AllowHostLaunch) {
    Write-GuardianLog "Host mode requested but host launch is blocked (AllowHostLaunch not set)."
    exit 0
}

if ($null -ne $hostMissionProcess) {
    exit 0
}

Write-GuardianLog "CodeX Mission not detected. Launching a new mission terminal."
Start-Process -FilePath "pwsh.exe" `
    -ArgumentList @("-NoExit", "-ExecutionPolicy", "Bypass", "-File", $LauncherPath, "-Runtime", "host", "-AllowHostFallback") `
    -WorkingDirectory $CodeXRoot `
    -WindowStyle Normal | Out-Null

exit 0
