# 9020 Bootstrap — Inactive Node
# Nothing runs here. Remove any misplaced services.

$ErrorActionPreference = 'Stop'

Write-Host "=== 9020 BOOTSTRAP — Inactive ===" -ForegroundColor Blue

# --- Remove ALL services ---
Write-Host "`n[1/1] Removing all services..." -ForegroundColor Yellow
$removeTasks = @('ANTIGRAVITY-AgentHub', 'ANTIGRAVITY-Hermes', 'ANTIGRAVITY-FCC', 'ANTIGRAVITY-Ollama', 'DREAM-GameServer', 'DREAM-Paperclip', 'DREAM-1minAI', 'HERMES-Workspace')
foreach ($task in $removeTasks) {
    $existing = Get-ScheduledTask -TaskName $task -ErrorAction SilentlyContinue
    if ($existing) {
        Unregister-ScheduledTask -TaskName $task -Confirm:$false
        Write-Host "  Removed: $task"
    }
}

Write-Host "`n=== 9020 BOOTSTRAP COMPLETE ===" -ForegroundColor Blue
Write-Host "This node is inactive. Nothing runs here."
Write-Host "All work runs on Sabretooth (192.168.0.8)."
