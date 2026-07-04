# T5500 Bootstrap — Gateway Only
# Cloudflare tunnels for youandinotai.com
# NO Agent Hub, NO Hermes, NO FCC, NO Ollama — all on Sabretooth

$ErrorActionPreference = 'Stop'

Write-Host "=== T5500 BOOTSTRAP — Gateway Only ===" -ForegroundColor Cyan

# --- Remove services that don't belong here ---
Write-Host "`n[1/2] Removing misplaced services..." -ForegroundColor Yellow
$removeTasks = @('ANTIGRAVITY-AgentHub', 'ANTIGRAVITY-Hermes', 'ANTIGRAVITY-FCC', 'ANTIGRAVITY-Ollama', 'DREAM-GameServer', 'DREAM-Paperclip', 'DREAM-1minAI', 'HERMES-Workspace')
foreach ($task in $removeTasks) {
    $existing = Get-ScheduledTask -TaskName $task -ErrorAction SilentlyContinue
    if ($existing) {
        Unregister-ScheduledTask -TaskName $task -Confirm:$false
        Write-Host "  Removed: $task (belongs on Sabretooth)"
    }
}

# --- Ensure Cloudflared is running ---
Write-Host "`n[2/2] Cloudflared tunnel" -ForegroundColor Green
$cfService = Get-Service -Name 'cloudflared*' -ErrorAction SilentlyContinue
if ($cfService) {
    Set-Service -Name $cfService.Name -StartupType Automatic
    Write-Host "  Cloudflared ($($cfService.Name)) set to Automatic"
} else {
    Write-Host "  Cloudflared not found as service — may be running as user" -ForegroundColor Yellow
}

Write-Host "`n=== T5500 BOOTSTRAP COMPLETE ===" -ForegroundColor Cyan
Write-Host "This node is gateway only:"
Write-Host "  - Cloudflared tunnel for youandinotai.com"
Write-Host "`nAll AI work routes through Sabretooth :3130 (Agent Hub)."
