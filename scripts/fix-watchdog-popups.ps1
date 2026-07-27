<#
.SYNOPSIS
Fix watchdog popup storm using native PowerShell scheduled-task cmdlets.
Requires: elevated PowerShell 5.1+ or 7+.
#>
param([switch]$DryRun)
$ErrorActionPreference = 'Continue'
$repo = 'E:\ANTIGRAVITY'

function L($m){ Write-Host "[fix-watchdogs] $m" }

# --- 1. remove ALL existing target tasks ---
$kill = @('PaperclipDateAppWatchdog','MissionControlWatchdog','ANTIGRAVITY-T5500-RuntimeOps-Health30m','PaperclipDateAppLoopback','ANTIGRAVITY-T5500-RuntimeOps')
foreach ($n in $kill) {
  $ts = Get-ScheduledTask -TaskName $n -ErrorAction SilentlyContinue
  if ($ts) {
    foreach ($t in $ts) {
      L "removing existing task: $($t.TaskName)"
      if (-not $DryRun) {
        Unregister-ScheduledTask -TaskName $t.TaskName -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
      }
    }
  }
}

# --- 2. ensure scripts exist ---
$ensure = @(
  "$repo\ops\paperclip-runtime\watchdog-paperclip-loopback.ps1",
  "$repo\scripts\mission-control-watchdog.ps1",
  "$repo\scripts\start-mission-control.ps1",
  "$repo\scripts\t5500\Start-T5500-RuntimeOps.ps1",
  "$repo\scripts\start-t5500-dateapp-cloudflared.ps1"
)
foreach ($p in $ensure) {
  if (-not (Test-Path $p)) { L "MISSING script: $p" }
}

# --- 3. register clean tasks using native cmdlets ---
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 2 -RestartInterval (New-TimeSpan -Minutes 5)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Limited

$tasks = @(
  @{
    Name = 'PaperclipDateAppWatchdog'
    Action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$repo\ops\paperclip-runtime\watchdog-paperclip-loopback.ps1`""
    Triggers = @((New-ScheduledTaskTrigger -AtStartup),(New-ScheduledTaskTrigger -AtLogOn))
  },
  @{
    Name = 'MissionControlWatchdog'
    Action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -File `"$repo\scripts\mission-control-watchdog.ps1`" -RepoRoot `"$repo`" -Port 8787"
    Triggers = @((New-ScheduledTaskTrigger -AtStartup),(New-ScheduledTaskTrigger -AtLogOn))
  },
  @{
    Name = 'ANTIGRAVITY-T5500-RuntimeOps-Health30m'
    Action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$repo\scripts\t5500\Start-T5500-RuntimeOps.ps1`" -RepoRoot `"$repo`""
    Triggers = @((New-ScheduledTaskTrigger -AtStartup))
  }
)

foreach ($t in $tasks) {
  L "registering task: $($t.Name)"
  if (-not $DryRun) {
    try {
      Register-ScheduledTask -TaskName $t.Name -Action $t.Action -Trigger $t.Triggers -Settings $settings -Principal $principal -Force | Out-Null
      L "registered: $($t.Name)"
    } catch {
      L "FAILED to register $($t.Name): $_"
    }
  }
}

L 'done. Reboot when ready.'
