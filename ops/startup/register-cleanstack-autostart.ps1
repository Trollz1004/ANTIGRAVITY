<#
.SYNOPSIS
  Registers the single Clean Stack auto-start task and disables the old scattered
  ANTIGRAVITY Windows tasks so there is ONE source of truth (clean/ops/startup/start-stack.ps1).
  Run once (elevated) to install. Re-run to refresh.
#>
$ErrorActionPreference = 'Stop'
$stackScript = 'E:\clean\ops\startup\start-stack.ps1'
$taskName = 'ANTIGRAVITY-CleanStack-Bootstrap'
$healName  = 'ANTIGRAVITY-CleanStack-Heal'

if (-not (Test-Path $stackScript)) { throw "missing $stackScript" }

# --- main bootstrap task: AtStartup, runs the stack once ---
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$stackScript`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Write-Host "Registered task: $taskName (AtStartup)"

# --- heal task: every 15 min, re-runs stack in heal mode (idempotent) ---
$healAction = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$stackScript`" -HealIntervalSec 0"
$healTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 15) -RepetitionDuration ([TimeSpan]::MaxValue)
Register-ScheduledTask -TaskName $healName -Action $healAction -Trigger $healTrigger -Settings $settings -Force | Out-Null
Write-Host "Registered task: $healName (every 15 min heal)"

# --- disable old scattered tasks so only the clean harness drives the stack ---
$oldTasks = @(
  'ANTIGRAVITY-T5500-RuntimeOps',
  'ANTIGRAVITY-T5500-RuntimeOps-Health30m',
  'PaperclipDateAppLoopback',
  'PaperclipDateAppWatchdog',
  'ANTIGRAVITY-T5500-DateApp-Cloudflared',
  'Hermes_Cloudflared_Tunnel',
  'Hermes_Cloudflared_Tunnel_SYSTEM'
)
foreach ($t in $oldTasks) {
  try {
    $exists = Get-ScheduledTask -TaskName $t -ErrorAction SilentlyContinue
    if ($exists) {
      Disable-ScheduledTask -TaskName $t -ErrorAction SilentlyContinue | Out-Null
      Write-Host "Disabled old task: $t"
    }
  } catch { Write-Host "skip $t : $_" }
}
Write-Host "=== done. Single source of truth: $stackScript ==="
