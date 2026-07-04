# Sabretooth Bootstrap — DREAM ONLINE ONLY
# GPU 1070 8GB reserved for game rendering
# Cloud AI (1min.ai desktop app) for fast real-time events
# NO local AI models for DREAM — cloud only for speed

$ErrorActionPreference = 'Stop'
$REPO = 'C:\antigravity'
$LOGS = "$REPO\logs"

Write-Host "=== SABRETOOTH BOOTSTRAP — DREAM ONLINE ONLY ===" -ForegroundColor Magenta

if (-not (Test-Path $LOGS)) { New-Item -ItemType Directory -Path $LOGS -Force | Out-Null }

$taskSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

# --- 1. 1min.AI Desktop App (cloud AI for DREAM) ---
Write-Host "`n[1/3] 1min.AI Desktop App" -ForegroundColor Green
$oneMinPaths = @(
    "$env:LOCALAPPDATA\1minAI\1min AI.exe",
    "$env:LOCALAPPDATA\Programs\1min.ai\1min.ai.exe",
    "$env:ProgramFiles\1min.ai\1min.ai.exe",
    "${env:ProgramFiles(x86)}\1min.ai\1min.ai.exe"
)
$oneMinExe = $oneMinPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($oneMinExe) {
    $action = New-ScheduledTaskAction -Execute $oneMinExe
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    Register-ScheduledTask -TaskName 'DREAM-1minAI' -Action $action -Trigger $trigger -Settings $taskSettings -Force | Out-Null
    Write-Host "  Registered: DREAM-1minAI ($oneMinExe)"
} else {
    Write-Host "  SKIP: 1min.AI not found — install from https://1min.ai/download" -ForegroundColor Yellow
    Write-Host "  Expected paths: $($oneMinPaths -join ', ')"
}

# --- 2. DREAM Game Server (if configured) ---
Write-Host "`n[2/3] DREAM Game Server" -ForegroundColor Green
$dreamServerPath = "$REPO\services\dream-online"
if (Test-Path "$dreamServerPath\server.js") {
    $dreamAction = New-ScheduledTaskAction -Execute 'node' -Argument 'server.js' -WorkingDirectory $dreamServerPath
    $dreamTrigger = New-ScheduledTaskTrigger -AtStartup
    Register-ScheduledTask -TaskName 'DREAM-GameServer' -Action $dreamAction -Trigger $dreamTrigger -Settings $taskSettings -User 'SYSTEM' -RunLevel Highest -Force | Out-Null
    Write-Host "  Registered: DREAM-GameServer (auto-start)"
} else {
    Write-Host "  SKIP: $dreamServerPath\server.js not found yet" -ForegroundColor Yellow
}

# --- 3. Paperclip (DREAM-specific orchestration) ---
Write-Host "`n[3/3] Paperclip (DREAM orchestration)" -ForegroundColor Green
$paperclipExe = (Get-Command paperclip -ErrorAction SilentlyContinue).Source
if (-not $paperclipExe) {
    $paperclipExe = "$env:LOCALAPPDATA\Programs\paperclip\paperclip.exe"
}
if (Test-Path $paperclipExe) {
    $pcAction = New-ScheduledTaskAction -Execute $paperclipExe -Argument '--project dream-online --port 3110'
    $pcTrigger = New-ScheduledTaskTrigger -AtStartup
    Register-ScheduledTask -TaskName 'DREAM-Paperclip' -Action $pcAction -Trigger $pcTrigger -Settings $taskSettings -User 'SYSTEM' -RunLevel Highest -Force | Out-Null
    Write-Host "  Registered: DREAM-Paperclip :3110 (auto-start)"
} else {
    Write-Host "  SKIP: Paperclip not found" -ForegroundColor Yellow
}

# --- 4. Hermes Workspace Dashboard (:9119) ---
Write-Host "`n[4/4] Hermes Workspace :9119" -ForegroundColor Green
$hermesWsPath = 'C:\Users\joshl\hermes-workspace'
if (Test-Path "$hermesWsPath\package.json") {
    $hwAction = New-ScheduledTaskAction -Execute 'cmd' -Argument "/c cd /d $hermesWsPath && pnpm dev >> C:\antigravity\logs\hermes-workspace.log 2>&1" -WorkingDirectory $hermesWsPath
    $hwTrigger = New-ScheduledTaskTrigger -AtLogOn
    Register-ScheduledTask -TaskName 'HERMES-Workspace' -Action $hwAction -Trigger $hwTrigger -Settings $taskSettings -Force | Out-Null
    Write-Host "  Registered: HERMES-Workspace :9119 (auto-start on login)"
} else {
    Write-Host "  SKIP: Hermes Workspace not found at $hermesWsPath" -ForegroundColor Yellow
}

# --- Remove NON-DREAM services if they exist ---
Write-Host "`n[cleanup] Removing non-DREAM services from Sabretooth..." -ForegroundColor Yellow
$removeTasks = @('ANTIGRAVITY-AgentHub', 'ANTIGRAVITY-Hermes', 'ANTIGRAVITY-FCC', 'ANTIGRAVITY-Ollama')
foreach ($task in $removeTasks) {
    $existing = Get-ScheduledTask -TaskName $task -ErrorAction SilentlyContinue
    if ($existing) {
        Unregister-ScheduledTask -TaskName $task -Confirm:$false
        Write-Host "  Removed: $task (belongs on T5500, not here)"
    }
}

# --- Start now ---
Write-Host "`n=== Starting DREAM services NOW ===" -ForegroundColor Magenta
Start-ScheduledTask -TaskName 'DREAM-1minAI' -ErrorAction SilentlyContinue
Start-ScheduledTask -TaskName 'DREAM-GameServer' -ErrorAction SilentlyContinue
Start-ScheduledTask -TaskName 'DREAM-Paperclip' -ErrorAction SilentlyContinue

Write-Host "`n=== SABRETOOTH BOOTSTRAP COMPLETE ===" -ForegroundColor Magenta
Write-Host "This node is DREAM ONLINE ONLY:"
Write-Host "  - GPU 1070 8GB = game rendering (NOT AI inference)"
Write-Host "  - 1min.AI desktop = cloud AI for fast real-time events"
Write-Host "  - Paperclip = DREAM-specific task orchestration"
Write-Host "  - NO Ollama, NO Hermes, NO FCC, NO Agent Hub here"
Write-Host "`nAll other AI work routes through T5500 :3130 (Agent Hub)."
