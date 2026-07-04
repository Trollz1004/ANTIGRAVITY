# 9020 Bootstrap — Joshua's Workspace
# Browser-auth platforms only: Claude Max, Codex, Grok, Gemini, ChatGPT, Perplexity, Cursor
# NO services to register — all are desktop apps with browser sign-in
# Just pull repo and verify connectivity to T5500 Agent Hub

$ErrorActionPreference = 'Stop'
$REPO = 'C:\antigravity'

Write-Host "=== 9020 BOOTSTRAP — Joshua Workspace ===" -ForegroundColor Blue

# --- 1. Pull latest repo ---
Write-Host "`n[1/3] Pulling latest repo..." -ForegroundColor Green
Push-Location $REPO
git pull origin main 2>&1
Pop-Location
Write-Host "  Repo up to date"

# --- 2. Verify Agent Hub connectivity ---
Write-Host "`n[2/3] Checking Agent Hub on T5500..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri 'http://192.168.0.8:3130/health' -TimeoutSec 5
    if ($response.status -eq 'ok') {
        Write-Host "  Agent Hub reachable: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green
    }
} catch {
    Write-Host "  WARNING: Agent Hub not reachable at T5500 :3130" -ForegroundColor Yellow
    Write-Host "  Run bootstrap-t5500.ps1 on T5500 first"
}

# --- 3. Remove any misplaced services ---
Write-Host "`n[3/3] Cleaning up misplaced services..." -ForegroundColor Yellow
$removeTasks = @('ANTIGRAVITY-AgentHub', 'ANTIGRAVITY-Hermes', 'ANTIGRAVITY-FCC', 'ANTIGRAVITY-Ollama', 'DREAM-GameServer', 'DREAM-Paperclip', 'DREAM-1minAI')
foreach ($task in $removeTasks) {
    $existing = Get-ScheduledTask -TaskName $task -ErrorAction SilentlyContinue
    if ($existing) {
        Unregister-ScheduledTask -TaskName $task -Confirm:$false
        Write-Host "  Removed: $task (does not belong on 9020)"
    }
}

Write-Host "`n=== 9020 BOOTSTRAP COMPLETE ===" -ForegroundColor Blue
Write-Host "This node is Joshua's workspace:"
Write-Host "  - Claude Max (browser sign-in) — cloud subscription"
Write-Host "  - Codex (OpenAI desktop) — browser sign-in"
Write-Host "  - Grok (xAI desktop) — browser sign-in"
Write-Host "  - Gemini (Google desktop) — browser sign-in"
Write-Host "  - ChatGPT (OpenAI) — browser sign-in"
Write-Host "  - Perplexity Pro — browser sign-in"
Write-Host "  - Cursor IDE — desktop app"
Write-Host "`nNo services to auto-start — all are desktop apps."
Write-Host "All AI work routes through T5500 :3130 (Agent Hub)."
