[CmdletBinding()]
param(
    [string]$AgentId = "",
    [switch]$StopGateway = $true,
    [switch]$StartGateway = $true
)

$ErrorActionPreference = "Stop"

function Stop-PortListeners {
    param([int]$Port)

    $lines = cmd /c ("netstat -ano | findstr {0}" -f $Port)
    if ($LASTEXITCODE -ne 0 -or -not $lines) {
        return
    }

    $pids = @($lines -split "`r?`n" | Where-Object { $_.Trim() } |
        ForEach-Object { ($_ -split "\s+")[-1] } |
        Where-Object { $_ -match "^\d+$" } |
        Select-Object -Unique)

    foreach ($pidText in $pids) {
        try {
            Stop-Process -Id ([int]$pidText) -Force -ErrorAction Stop
        } catch {
        }
    }
}

function Ensure-Directory {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

$openclawRoot = Join-Path $env:USERPROFILE ".openclaw"
$agentsRoot = Join-Path $openclawRoot "agents"
$backupRoot = Join-Path $env:USERPROFILE (".codex\tmp\openclaw-session-reset-" + (Get-Date -Format "yyyy-MM-dd-HHmmss"))
Ensure-Directory -Path $backupRoot

if ($StopGateway) {
    Stop-PortListeners -Port 18789
    Start-Sleep -Seconds 1
}

$agentDirs = @()
if ($AgentId) {
    $agentPath = Join-Path $agentsRoot $AgentId
    if (Test-Path $agentPath) {
        $agentDirs = @(Get-Item $agentPath)
    }
} elseif (Test-Path $agentsRoot) {
    $agentDirs = @(Get-ChildItem $agentsRoot -Directory)
}

foreach ($agentDir in $agentDirs) {
    $sessionsPath = Join-Path $agentDir.FullName "sessions"
    if (-not (Test-Path $sessionsPath)) {
        continue
    }

    $target = Join-Path $backupRoot ($agentDir.Name + "-sessions")
    Move-Item $sessionsPath $target -Force
    Ensure-Directory -Path $sessionsPath
    '[]' | Set-Content (Join-Path $sessionsPath "sessions.json") -Encoding UTF8
    Write-Output ("RESET_SESSIONS: {0}" -f $agentDir.Name)
    Write-Output ("BACKUP: {0}" -f $target)
}

if ($StartGateway) {
    Start-Process powershell -WindowStyle Hidden -ArgumentList "-NoProfile", "-Command", "openclaw gateway --port 18789" | Out-Null
    Start-Sleep -Seconds 4
}
