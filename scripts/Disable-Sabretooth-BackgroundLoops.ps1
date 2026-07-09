# Stops and disables local Sabretooth background loops that belong on T5500 or
# isolated workers. This does not touch Cloudflare/DNS/payment secrets.
#
# Intended use:
#   powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\Disable-Sabretooth-BackgroundLoops.ps1

[CmdletBinding(SupportsShouldProcess=$true)]
param(
  [switch]$WhatIfOnly
)

$ErrorActionPreference = 'Continue'

$patterns = @(
  'antigravity.*watchdog',
  'watchdog.*antigravity',
  'paperclip-watchdog',
  'sabretooth-watchdog',
  'openclaw-paperclip-agent-watchdog',
  'Invoke-DateAppOpsWatchdog',
  'antigravity.*sentry',
  'sentry.*antigravity',
  'hermes.*dashboard',
  'hermes.*desktop',
  'fcc-server',
  'fcc-claude',
  'cloudflared'
)

$taskPattern = 'watchdog|sentry|paperweight|opus|openclaw.*watch|sabretooth-watch'
$results = New-Object System.Collections.Generic.List[object]

foreach ($pattern in $patterns) {
  $matches = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^cloudflared\.exe$' -or $_.CommandLine -match $pattern } |
    Select-Object Name,ProcessId

  foreach ($match in $matches) {
    $label = "$($match.Name):$($match.ProcessId)"
    if ($WhatIfOnly) {
      $results.Add([pscustomobject]@{ type = 'process'; target = $label; action = 'would-stop'; pattern = $pattern })
      continue
    }
    try {
      if ($PSCmdlet.ShouldProcess($label, 'Stop forbidden Sabretooth background loop')) {
        Stop-Process -Id $match.ProcessId -Force -ErrorAction Stop
        $results.Add([pscustomobject]@{ type = 'process'; target = $label; action = 'stopped'; pattern = $pattern })
      }
    } catch {
      $results.Add([pscustomobject]@{ type = 'process'; target = $label; action = "failed: $($_.Exception.Message)"; pattern = $pattern })
    }
  }
}

$tasks = Get-ScheduledTask -ErrorAction SilentlyContinue |
  Where-Object { $_.TaskName -match $taskPattern -or $_.TaskPath -match $taskPattern }

foreach ($task in $tasks) {
  $label = "$($task.TaskPath)$($task.TaskName)"
  if ($WhatIfOnly) {
    $results.Add([pscustomobject]@{ type = 'task'; target = $label; action = 'would-disable'; pattern = $taskPattern })
    continue
  }
  try {
    if ($PSCmdlet.ShouldProcess($label, 'Disable forbidden Sabretooth background loop task')) {
      Disable-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath -ErrorAction Stop | Out-Null
      $results.Add([pscustomobject]@{ type = 'task'; target = $label; action = 'disabled'; pattern = $taskPattern })
    }
  } catch {
    $results.Add([pscustomobject]@{ type = 'task'; target = $label; action = "failed: $($_.Exception.Message)"; pattern = $taskPattern })
  }
}

if ($results.Count -eq 0) {
  [pscustomobject]@{ type = 'summary'; target = 'Sabretooth'; action = 'no-forbidden-loops-found'; pattern = '' }
} else {
  $results
}
