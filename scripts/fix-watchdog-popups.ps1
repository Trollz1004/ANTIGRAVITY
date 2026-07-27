<#
.SYNOPSIS
Fix watchdog popup storm: dedupe scheduled tasks, repoint to E:\ANTIGRAVITY, convert MissionControl watchdog to one-shot.
#>
param([switch]$DryRun)
$ErrorActionPreference = 'Continue'
$repo = 'E:\ANTIGRAVITY'

function L($m){ Write-Host "[fix-watchdogs] $m" }

$targets = @(
  @{ Name = 'PaperclipDateAppWatchdog'; Tr = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$repo\ops\paperclip-runtime\watchdog-paperclip-loopback.ps1`""; Triggers = @('ONSTART','ATLOGON') }
  @{ Name = 'MissionControlWatchdog'; Tr = "-NoProfile -NonInteractive -WindowStyle Hidden -File `"$repo\scripts\mission-control-watchdog.ps1`" -RepoRoot `"$repo`" -Port 8787"; Triggers = @('ONSTART','ATLOGON') }
  @{ Name = 'ANTIGRAVITY-T5500-RuntimeOps-Health30m'; Tr = "-NoProfile -ExecutionPolicy Bypass -File `"$repo\scripts\t5500\Start-T5500-RuntimeOps.ps1`" -RepoRoot `"$repo`""; Triggers = @('ONSTART') }
)

# 1. unregister ALL existing instances of these names
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

# 2. ensure canonical scripts exist
$ensure = @(
  "$repo\scripts\start-dateapp-frontend-3200.ps1",
  "$repo\scripts\start-mission-control.ps1",
  "$repo\scripts\start-t5500-dateapp-cloudflared.ps1",
  "$repo\scripts\t5500\Start-T5500-RuntimeOps.ps1"
)
foreach ($p in $ensure) {
  if (-not (Test-Path $p)) {
    L "missing script (skip auto-create): $p"
  }
}

# 3. register clean tasks, exactly ONE each
foreach ($t in $targets) {
  L "registering task: $($t.Name)"
  if (-not $DryRun) {
    schtasks.exe /Create `
      /TN $($t.Name) `
      /TR "powershell.exe $($t.Tr)" `
      /SC ONSTART `
      /RU joshl `
      /F | Out-Null
    if ($t.Triggers -contains 'ATLOGON') {
      schtasks.exe /Create `
        /TN "$($t.Name)-Logon" `
        /TR "powershell.exe $($t.Tr)" `
        /SC ATLOGON `
        /RU joshl `
        /F | Out-Null
    }
  }
}

# 4. disable minute-based repeated watchdog unless requested
#    We intentionally do NOT register a minute-scoped PaperclipDateAppWatchdog here.

L 'done. Reboot when ready.'
