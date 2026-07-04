# T5500 Bootstrap — Agent Hub Gateway Node
# Run once to register all services for auto-start on boot/power loss
# All orchestration lives on T5500: Agent Hub, Hermes, FCC, Ollama, ClawX

$ErrorActionPreference = 'Stop'
$REPO = 'C:\antigravity'
$LOGS = "$REPO\logs"

Write-Host "=== T5500 BOOTSTRAP — Gateway + All Orchestration ===" -ForegroundColor Cyan

# Ensure logs dir
if (-not (Test-Path $LOGS)) { New-Item -ItemType Directory -Path $LOGS -Force | Out-Null }

# --- 1. Agent Hub (Node.js :3130) ---
Write-Host "`n[1/5] Agent Hub :3130" -ForegroundColor Green
$hubPath = "$REPO\services\agent-hub"
if (-not (Test-Path "$hubPath\node_modules")) {
    Write-Host "  Installing dependencies..."
    Push-Location $hubPath
    npm install --production 2>&1 | Out-Null
    Pop-Location
}
# Create scheduled task for Agent Hub
$hubAction = New-ScheduledTaskAction -Execute 'node' -Argument 'src/index.js' -WorkingDirectory $hubPath
$hubTrigger = New-ScheduledTaskTrigger -AtStartup
$hubSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName 'ANTIGRAVITY-AgentHub' -Action $hubAction -Trigger $hubTrigger -Settings $hubSettings -User 'SYSTEM' -RunLevel Highest -Force | Out-Null
Write-Host "  Registered: ANTIGRAVITY-AgentHub (auto-start)"

# --- 2. Hermes Router (:11435) ---
Write-Host "`n[2/5] Hermes Router :11435" -ForegroundColor Green
$hermesAction = New-ScheduledTaskAction -Execute 'hermes.exe' -Argument '--port 11435' -WorkingDirectory "$REPO\services\hermes"
$hermesTrigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -TaskName 'ANTIGRAVITY-Hermes' -Action $hermesAction -Trigger $hermesTrigger -Settings $hubSettings -User 'SYSTEM' -RunLevel Highest -Force | Out-Null
Write-Host "  Registered: ANTIGRAVITY-Hermes (auto-start)"

# --- 3. FCC Proxy (:8082) ---
Write-Host "`n[3/5] FCC Proxy :8082" -ForegroundColor Green
$fccAction = New-ScheduledTaskAction -Execute 'cmd' -Argument '/c fcc-claude --port 8082 >> C:\antigravity\logs\fcc-proxy.log 2>&1' -WorkingDirectory $REPO
$fccTrigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -TaskName 'ANTIGRAVITY-FCC' -Action $fccAction -Trigger $fccTrigger -Settings $hubSettings -User 'SYSTEM' -RunLevel Highest -Force | Out-Null
Write-Host "  Registered: ANTIGRAVITY-FCC (auto-start)"

# --- 4. Ollama (:11434) ---
Write-Host "`n[4/5] Ollama :11434" -ForegroundColor Green
$ollamaExe = (Get-Command ollama -ErrorAction SilentlyContinue).Source
if ($ollamaExe) {
    $ollamaAction = New-ScheduledTaskAction -Execute $ollamaExe -Argument 'serve'
    $ollamaTrigger = New-ScheduledTaskTrigger -AtStartup
    Register-ScheduledTask -TaskName 'ANTIGRAVITY-Ollama' -Action $ollamaAction -Trigger $ollamaTrigger -Settings $hubSettings -User 'SYSTEM' -RunLevel Highest -Force | Out-Null
    Write-Host "  Registered: ANTIGRAVITY-Ollama (auto-start)"
} else {
    Write-Host "  SKIP: ollama not found in PATH" -ForegroundColor Yellow
}

# --- 5. PostgreSQL check ---
Write-Host "`n[5/5] PostgreSQL" -ForegroundColor Green
$pgService = Get-Service -Name 'postgresql*' -ErrorAction SilentlyContinue
if ($pgService) {
    Set-Service -Name $pgService.Name -StartupType Automatic
    Write-Host "  PostgreSQL ($($pgService.Name)) set to Automatic start"
} else {
    Write-Host "  SKIP: PostgreSQL service not found" -ForegroundColor Yellow
}

# --- Run migration if DB exists ---
Write-Host "`n[+] Running DB migration..." -ForegroundColor Green
Push-Location $hubPath
try {
    node migrations/run.js 2>&1
    Write-Host "  Migration complete"
} catch {
    Write-Host "  Migration skipped (DB may not be configured yet)" -ForegroundColor Yellow
}
Pop-Location

# --- Start services now ---
Write-Host "`n=== Starting all services NOW ===" -ForegroundColor Cyan
Start-ScheduledTask -TaskName 'ANTIGRAVITY-AgentHub' -ErrorAction SilentlyContinue
Start-ScheduledTask -TaskName 'ANTIGRAVITY-Hermes' -ErrorAction SilentlyContinue
Start-ScheduledTask -TaskName 'ANTIGRAVITY-FCC' -ErrorAction SilentlyContinue
Start-ScheduledTask -TaskName 'ANTIGRAVITY-Ollama' -ErrorAction SilentlyContinue

Write-Host "`n=== T5500 BOOTSTRAP COMPLETE ===" -ForegroundColor Cyan
Write-Host "Services registered for auto-start on boot:"
Write-Host "  - Agent Hub       :3130"
Write-Host "  - Hermes Router   :11435"
Write-Host "  - FCC Proxy       :8082"
Write-Host "  - Ollama          :11434"
Write-Host "  - PostgreSQL      (system service)"
Write-Host "`nAll AI sends work to http://localhost:3130 — hub routes everywhere."
