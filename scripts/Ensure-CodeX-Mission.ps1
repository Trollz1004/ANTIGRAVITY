[CmdletBinding()]
param(
    [string]$RepoRoot = "E:\ANTIGRAVITY",
    [string]$LauncherPath = "E:\ANTIGRAVITY\scripts\Launch-CodeX-Mission.ps1",
    [string]$LogPath = "E:\ANTIGRAVITY\CodeX\logs\codex-mission-guardian.log"
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

$missionProcess = Get-CimInstance Win32_Process -Filter "Name='pwsh.exe'" -ErrorAction SilentlyContinue |
    Where-Object {
        $_.ProcessId -ne $PID -and
        $_.CommandLine -match "Launch-CodeX-Mission\.ps1" -and
        $_.CommandLine -notmatch "Ensure-CodeX-Mission\.ps1"
    } |
    Select-Object -First 1

if ($null -ne $missionProcess) {
    exit 0
}

Write-GuardianLog "CodeX Mission not detected. Launching a new mission terminal."
Start-Process -FilePath "pwsh.exe" `
    -ArgumentList @("-NoExit", "-ExecutionPolicy", "Bypass", "-File", $LauncherPath) `
    -WorkingDirectory $RepoRoot `
    -WindowStyle Normal | Out-Null

exit 0
