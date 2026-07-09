# T5500 Bootstrap - Front Door + Hermes Workbench
# Cloudflare tunnels, date-app public stack, node balancer, Hermes dashboard/workspace,
# support gateway, and OmniRouter belong here.
# Mission Control and Agent Hub authority stay on Sabretooth.

$ErrorActionPreference = 'Stop'

$RepoRoot = 'C:\antigravity'
$Autostart = Join-Path $RepoRoot 'scripts\node-t5500-autostart.bat'

Write-Host "=== T5500 BOOTSTRAP - Front Door + Workbench ===" -ForegroundColor Cyan

Write-Host "`n[1/3] Removing services that do not belong on T5500..." -ForegroundColor Yellow
$removeTasks = @(
    'ANTIGRAVITY-AgentHub',
    'ANTIGRAVITY-Ollama',
    'DREAM-GameServer',
    'DREAM-Paperclip',
    'DREAM-1minAI'
)
foreach ($task in $removeTasks) {
    $existing = Get-ScheduledTask -TaskName $task -ErrorAction SilentlyContinue
    if ($existing) {
        Unregister-ScheduledTask -TaskName $task -Confirm:$false
        Write-Host "  Removed: $task"
    }
}

Write-Host "`n[2/3] Cloudflared tunnel service..." -ForegroundColor Green
$cfService = Get-Service -Name 'cloudflared*' -ErrorAction SilentlyContinue | Select-Object -First 1
if ($cfService) {
    Set-Service -Name $cfService.Name -StartupType Automatic
    Write-Host "  Cloudflared ($($cfService.Name)) set to Automatic"
} else {
    Write-Host "  Cloudflared service not found; Start-YouAndINotAI-PublicStack.ps1 can run token-mode tunnel if token exists." -ForegroundColor Yellow
}

Write-Host "`n[3/3] T5500 autostart task..." -ForegroundColor Green
if (-not (Test-Path -LiteralPath $Autostart)) {
    throw "Missing autostart script: $Autostart"
}

$taskName = 'ANTIGRAVITY-T5500-FrontDoor-Workbench'
$action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c `"$Autostart`"" -WorkingDirectory $RepoRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 2)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Write-Host "  Registered: $taskName"

Write-Host "`n=== T5500 BOOTSTRAP COMPLETE ===" -ForegroundColor Cyan
Write-Host "This node owns:"
Write-Host "  - Cloudflared/front-door routing"
Write-Host "  - Date-app public stack"
Write-Host "  - Node balancer for stateless worker pool"
Write-Host "  - Hermes dashboard/workspace"
Write-Host "  - Hermes support gateway"
Write-Host "  - OmniRouter token/API routing"
Write-Host "`nAgent Hub and Mission Control authority stay on Sabretooth."
