# Sabretooth Bootstrap — Agent Hub + DREAM ONLINE + ALL services
# This is the ONLY active node. Everything runs here.
# GPU 1070 8GB reserved for game rendering
# DREAM files on D:\dream-online\

$ErrorActionPreference = 'Stop'
$REPO = 'C:\antigravity'
$LOGS = "$REPO\logs"
$DREAM = 'D:\dream-online'

Write-Host "=== SABRETOOTH BOOTSTRAP — ALL SERVICES ===" -ForegroundColor Magenta

if (-not (Test-Path $LOGS)) { New-Item -ItemType Directory -Path $LOGS -Force | Out-Null }

# Ensure DREAM directories on D:\
$dreamDirs = @("$DREAM\assets", "$DREAM\server", "$DREAM\config", "$DREAM\saves", "$DREAM\logs")
foreach ($dir in $dreamDirs) {
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
}
Write-Host "DREAM directories ready on D:\"

$taskSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

# --- 1. Agent Hub (Node.js :3130) ---
Write-Host "`n[1/8] Agent Hub :3130" -ForegroundColor Green
$hubPath = "$REPO\services\agent-hub"
if (Test-Path "$hubPath\package.json") {
    if (-not (Test-Path "$hubPath\node_modules")) {
        Write-Host "  Installing dependencies..."
        Push-Location $hubPath
        npm install --production 2>&1 | Out-Null
        Pop-Location
    }
    $hubAction = New-ScheduledTaskAction -Execute 'node' -Argument 'src/index.js' -WorkingDirectory $hubPath
    $hubTrigger = New-ScheduledTaskTrigger -AtStartup
    Register-ScheduledTask -TaskName 'ANTIGRAVITY-AgentHub' -Action $hubAction -Trigger $hubTrigger -Settings $taskSettings -User 'SYSTEM' -RunLevel Highest -Force | Out-Null
    Write-Host "  Registered: ANTIGRAVITY-AgentHub (auto-start)"
} else {
    Write-Host "  SKIP: Agent Hub not found at $hubPath" -ForegroundColor Yellow
}

# --- 2. Hermes Router (:11435) ---
Write-Host "`n[2/8] Hermes Router :11435" -ForegroundColor Green
$hermesExe = (Get-Command hermes -ErrorAction SilentlyContinue).Source
if ($hermesExe) {
    $hermesAction = New-ScheduledTaskAction -Execute $hermesExe -Argument '--port 11435'
    $hermesTrigger = New-ScheduledTaskTrigger -AtStartup
    Register-ScheduledTask -TaskName 'ANTIGRAVITY-Hermes' -Action $hermesAction -Trigger $hermesTrigger -Settings $taskSettings -User 'SYSTEM' -RunLevel Highest -Force | Out-Null
    Write-Host "  Registered: ANTIGRAVITY-Hermes (auto-start)"
} else {
    Write-Host "  SKIP: hermes not found in PATH" -ForegroundColor Yellow
}

# --- 3. FCC Proxy (:8082) ---
Write-Host "`n[3/8] FCC Proxy :8082" -ForegroundColor Green
$fccAction = New-ScheduledTaskAction -Execute 'cmd' -Argument '/c fcc-claude --port 8082 >> C:\antigravity\logs\fcc-proxy.log 2>&1' -WorkingDirectory $REPO
$fccTrigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -TaskName 'ANTIGRAVITY-FCC' -Action $fccAction -Trigger $fccTrigger -Settings $taskSettings -User 'SYSTEM' -RunLevel Highest -Force | Out-Null
Write-Host "  Registered: ANTIGRAVITY-FCC (auto-start)"

# --- 4. Ollama (:11434) ---
Write-Host "`n[4/8] Ollama :11434" -ForegroundColor Green
$ollamaExe = (Get-Command ollama -ErrorAction SilentlyContinue).Source
if ($ollamaExe) {
    $ollamaAction = New-ScheduledTaskAction -Execute $ollamaExe -Argument 'serve'
    $ollamaTrigger = New-ScheduledTaskTrigger -AtStartup
    Register-ScheduledTask -TaskName 'ANTIGRAVITY-Ollama' -Action $ollamaAction -Trigger $ollamaTrigger -Settings $taskSettings -User 'SYSTEM' -RunLevel Highest -Force | Out-Null
    Write-Host "  Registered: ANTIGRAVITY-Ollama (auto-start)"
} else {
    Write-Host "  SKIP: ollama not found in PATH" -ForegroundColor Yellow
}

# --- 5. PostgreSQL ---
Write-Host "`n[5/8] PostgreSQL" -ForegroundColor Green
$pgService = Get-Service -Name 'postgresql*' -ErrorAction SilentlyContinue
if ($pgService) {
    Set-Service -Name $pgService.Name -StartupType Automatic
    Write-Host "  PostgreSQL ($($pgService.Name)) set to Automatic start"
} else {
    Write-Host "  SKIP: PostgreSQL service not found" -ForegroundColor Yellow
}

# --- 6. Paperclip (DREAM orchestration :3110) ---
Write-Host "`n[6/8] Paperclip :3110 (DREAM)" -ForegroundColor Green
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

# --- 7. 1min.AI Desktop App (DREAM NPC AI) ---
Write-Host "`n[7/8] 1min.AI Desktop App (NPC AI)" -ForegroundColor Green
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
    Write-Host "  SKIP: 1min.AI not found" -ForegroundColor Yellow
}

# --- 8. Hermes Workspace Dashboard (:9119) ---
Write-Host "`n[8/8] Hermes Workspace :9119" -ForegroundColor Green
$hermesWsPath = 'C:\Users\joshl\hermes-workspace'
if (Test-Path "$hermesWsPath\package.json") {
    $hwAction = New-ScheduledTaskAction -Execute 'cmd' -Argument "/c cd /d $hermesWsPath && pnpm dev >> C:\antigravity\logs\hermes-workspace.log 2>&1" -WorkingDirectory $hermesWsPath
    $hwTrigger = New-ScheduledTaskTrigger -AtLogOn
    Register-ScheduledTask -TaskName 'HERMES-Workspace' -Action $hwAction -Trigger $hwTrigger -Settings $taskSettings -Force | Out-Null
    Write-Host "  Registered: HERMES-Workspace :9119 (auto-start on login)"
} else {
    Write-Host "  SKIP: Hermes Workspace not found at $hermesWsPath" -ForegroundColor Yellow
}

# --- DREAM Game Server (if configured) ---
$dreamServerPath = "$DREAM\server"
if (Test-Path "$dreamServerPath\server.js") {
    $dreamAction = New-ScheduledTaskAction -Execute 'node' -Argument 'server.js' -WorkingDirectory $dreamServerPath
    $dreamTrigger = New-ScheduledTaskTrigger -AtStartup
    Register-ScheduledTask -TaskName 'DREAM-GameServer' -Action $dreamAction -Trigger $dreamTrigger -Settings $taskSettings -User 'SYSTEM' -RunLevel Highest -Force | Out-Null
    Write-Host "`n  Registered: DREAM-GameServer (auto-start)"
}

# --- Run DB migration ---
Write-Host "`n[+] Running DB migration..." -ForegroundColor Green
if (Test-Path "$hubPath\migrations\run.js") {
    Push-Location $hubPath
    try { node migrations/run.js 2>&1; Write-Host "  Migration complete" }
    catch { Write-Host "  Migration skipped (DB may not be configured)" -ForegroundColor Yellow }
    Pop-Location
}

# --- Start services now ---
Write-Host "`n=== Starting ALL services NOW ===" -ForegroundColor Magenta
$startTasks = @('ANTIGRAVITY-AgentHub', 'ANTIGRAVITY-Hermes', 'ANTIGRAVITY-FCC', 'ANTIGRAVITY-Ollama', 'DREAM-Paperclip', 'DREAM-1minAI', 'HERMES-Workspace')
foreach ($t in $startTasks) { Start-ScheduledTask -TaskName $t -ErrorAction SilentlyContinue }

Write-Host "`n=== SABRETOOTH BOOTSTRAP COMPLETE ===" -ForegroundColor Magenta
Write-Host "ALL services on this node:"
Write-Host "  - Agent Hub       :3130  (task routing)"
Write-Host "  - Hermes Router   :11435 (agent routing)"
Write-Host "  - FCC Proxy       :8082  (FCC-Claude)"
Write-Host "  - Ollama          :11434 (local models)"
Write-Host "  - PostgreSQL      :5432  (database)"
Write-Host "  - Paperclip       :3110  (DREAM orchestration)"
Write-Host "  - 1min.AI         desktop (NPC AI)"
Write-Host "  - Hermes Workspace :9119 (knowledge UI)"
Write-Host "  - DREAM on D:\dream-online\"
Write-Host "`nClaude Official = Sup@ (user guide sphere)"
Write-Host "1min.ai = NPC AI (cloud inference)"
