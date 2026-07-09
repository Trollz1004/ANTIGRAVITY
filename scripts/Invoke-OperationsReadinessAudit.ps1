# Read-only operations readiness audit for the active multi-node goal.
# It does not mutate DNS, secrets, payments, services, git state, or scheduled tasks.

[CmdletBinding()]
param(
  [string]$RepoRoot = 'C:\antigravity',
  [string]$T5500Host = '192.168.0.15',
  [string]$T5500User = 'joshl',
  [string]$OutputPath = ''
)

$ErrorActionPreference = 'Continue'

$LogDir = Join-Path $RepoRoot 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
if (-not $OutputPath) {
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $OutputPath = Join-Path $LogDir "operations-readiness-audit-$stamp.json"
}

function New-Gate {
  param(
    [string]$Name,
    [string]$Status,
    [string]$Message,
    [object]$Data = $null
  )
  [pscustomobject]@{
    name = $Name
    status = $Status
    message = $Message
    data = $Data
  }
}

function Get-TaskSummaryLocal {
  param([string[]]$Names)
  $rows = @()
  foreach ($name in $Names) {
    $task = Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
    if (-not $task) {
      $rows += [pscustomobject]@{ taskName = $name; found = $false; state = 'Missing'; actions = @() }
      continue
    }
    $rows += [pscustomobject]@{
      taskName = $task.TaskName
      found = $true
      state = [string]$task.State
      actions = @($task.Actions | ForEach-Object { "$($_.Execute) $($_.Arguments)".Trim() })
    }
  }
  return $rows
}

function Invoke-RemotePowerShellJson {
  param(
    [string]$HostName,
    [string]$UserName,
    [string]$Script
  )
  $ssh = Get-Command ssh -ErrorAction SilentlyContinue
  if (-not $ssh) {
    return [pscustomobject]@{ ok = $false; error = 'ssh_not_found'; raw = '' }
  }
  $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($Script))
  $raw = & $ssh.Source -o BatchMode=yes -o ConnectTimeout=8 "$UserName@$HostName" "powershell -NoProfile -EncodedCommand $encoded" 2>&1
  $exit = $LASTEXITCODE
  $text = ($raw -join "`n")
  if ($exit -ne 0) {
    return [pscustomobject]@{ ok = $false; error = "ssh_exit_$exit"; raw = $text }
  }
  try {
    return [pscustomobject]@{ ok = $true; value = ($text | ConvertFrom-Json); raw = $text }
  } catch {
    return [pscustomobject]@{ ok = $false; error = $_.Exception.Message; raw = $text }
  }
}

$gates = New-Object System.Collections.Generic.List[object]

$topologyScript = Join-Path $RepoRoot 'scripts\Invoke-AllNodeTopologyVerification.ps1'
if (Test-Path -LiteralPath $topologyScript) {
  $topologyRaw = & powershell -NoProfile -ExecutionPolicy Bypass -File $topologyScript 2>&1
  $topologyExit = $LASTEXITCODE
  $topologyText = ($topologyRaw -join "`n")
  $topologyReport = $null
  try { $topologyReport = $topologyText | ConvertFrom-Json } catch {}
  if ($topologyExit -eq 0) {
    $gates.Add((New-Gate 'live-node-topology' 'pass' 'Known live nodes pass topology verification.' $topologyReport))
  } else {
    $gates.Add((New-Gate 'live-node-topology' 'fail' "Topology verifier exit=$topologyExit." @{ raw = $topologyText; report = $topologyReport }))
  }
} else {
  $gates.Add((New-Gate 'live-node-topology' 'fail' "Missing topology verifier: $topologyScript"))
}

$sabreTasks = Get-TaskSummaryLocal @('ANTIGRAVITY-Sabretooth-Control')
$sabreTask = $sabreTasks | Select-Object -First 1
if ($sabreTask.found -and $sabreTask.state -ne 'Disabled' -and (($sabreTask.actions -join ' ') -match 'node-sabretooth-autostart\.bat')) {
  $gates.Add((New-Gate 'sabretooth-restart-task' 'pass' 'Sabretooth clean control task is enabled.' $sabreTask))
} else {
  $gates.Add((New-Gate 'sabretooth-restart-task' 'fail' 'Sabretooth clean control task missing, disabled, or points at the wrong script.' $sabreTask))
}

$oldSabreTasks = Get-TaskSummaryLocal @(
  'ANTIGRAVITY-Cloudflared-Paperclip',
  'ANTIGRAVITY-Sabretooth-Watchdog',
  'MissionControlWatchdog',
  'PaperclipHQ-Watchdog'
)
$enabledOld = @($oldSabreTasks | Where-Object { $_.found -and $_.state -ne 'Disabled' })
if ($enabledOld.Count -eq 0) {
  $gates.Add((New-Gate 'sabretooth-forbidden-recovery-tasks' 'pass' 'Forbidden Sabretooth recovery loops are not enabled.' $oldSabreTasks))
} else {
  $gates.Add((New-Gate 'sabretooth-forbidden-recovery-tasks' 'fail' 'Forbidden Sabretooth recovery loops are enabled.' $enabledOld))
}

$remoteTaskScript = @'
$ProgressPreference = 'SilentlyContinue'
$names = @(
  'ANTIGRAVITY-T5500-RuntimeOps',
  'ANTIGRAVITY-T5500-RuntimeOps-Health30m',
  'ANTIGRAVITY-Bootstrap',
  'ANTIGRAVITY-DateApp-Serve-3200',
  'ANTIGRAVITY-DateApp-Serve-3200-IT',
  'ANTIGRAVITY-DateApp-Static-3200-SYSTEM',
  'T5500-DateApp-Cloudflared',
  'ANTIGRAVITY-T5500-DateApp-Cloudflared',
  'ANTIGRAVITY-YouAndINotAI-PublicStack-T5500',
  'YouAndINotAI-PublicStack-T5500'
)
$rows = foreach ($name in $names) {
  $task = Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
  if (-not $task) {
    [pscustomobject]@{ taskName = $name; found = $false; state = 'Missing'; actions = @() }
  } else {
    [pscustomobject]@{
      taskName = $task.TaskName
      found = $true
      state = [string]$task.State
      actions = @($task.Actions | ForEach-Object { "$($_.Execute) $($_.Arguments)".Trim() })
    }
  }
}
$rows | ConvertTo-Json -Depth 6
'@
$remoteTasks = Invoke-RemotePowerShellJson -HostName $T5500Host -UserName $T5500User -Script $remoteTaskScript
if (-not $remoteTasks.ok) {
  $gates.Add((New-Gate 't5500-restart-tasks' 'fail' 'Could not inspect T5500 scheduled tasks over SSH.' $remoteTasks))
} else {
  $taskRows = @($remoteTasks.value)
  $runtime = $taskRows | Where-Object { $_.taskName -eq 'ANTIGRAVITY-T5500-RuntimeOps' } | Select-Object -First 1
  $runtimeHealth = $taskRows | Where-Object { $_.taskName -eq 'ANTIGRAVITY-T5500-RuntimeOps-Health30m' } | Select-Object -First 1
  $cloudflared = @($taskRows | Where-Object { $_.taskName -match 'Cloudflared' -and $_.found -and $_.state -ne 'Disabled' })
  $dateAppRecovery = @($taskRows | Where-Object { $_.taskName -match 'PublicStack|DateApp|Bootstrap' -and $_.found -and $_.state -ne 'Disabled' })
  if ($runtime.found -and $runtime.state -ne 'Disabled' -and $runtimeHealth.found -and $runtimeHealth.state -ne 'Disabled' -and $cloudflared.Count -gt 0 -and $dateAppRecovery.Count -gt 0) {
    $gates.Add((New-Gate 't5500-restart-tasks' 'pass' 'T5500 runtime, health, Cloudflared, and date-app recovery tasks are enabled.' $taskRows))
  } else {
    $gates.Add((New-Gate 't5500-restart-tasks' 'fail' 'T5500 recovery task set is incomplete or disabled.' $taskRows))
  }
}

$nodePoolPath = Join-Path $RepoRoot 'ops\mission-control\node-pool.json'
if (Test-Path -LiteralPath $nodePoolPath) {
  $pool = Get-Content -Raw -LiteralPath $nodePoolPath | ConvertFrom-Json
  $pending = @($pool.nodes | Where-Object { -not $_.host -or $_.host -eq 'pending' })
  if ($pending.Count -eq 0) {
    $gates.Add((New-Gate 'worker-node-registration' 'pass' 'All node-pool workers have concrete hosts.' $pool.nodes))
  } else {
    $gates.Add((New-Gate 'worker-node-registration' 'incomplete' 'Some worker nodes are still pending IP/host registration.' $pending))
  }
} else {
  $gates.Add((New-Gate 'worker-node-registration' 'fail' "Missing node-pool config: $nodePoolPath"))
}

$gates.Add((New-Gate 'dns-routing' 'incomplete' 'DNS/Wrangler/Cloudflare mutation and public URL proof have not been run by this audit.'))
$gates.Add((New-Gate 'payment-transactions' 'incomplete' 'Date app, Business Exchange, and Online Recycle payment transactions have not been charged or webhook-verified by this audit.'))
$gates.Add((New-Gate 'physical-power-loss' 'incomplete' 'No physical reboot or power-loss cycle was performed by this audit.'))

$summary = @{
  pass = @($gates | Where-Object status -eq 'pass').Count
  fail = @($gates | Where-Object status -eq 'fail').Count
  warn = @($gates | Where-Object status -eq 'warn').Count
  incomplete = @($gates | Where-Object status -eq 'incomplete').Count
}

$report = [pscustomobject]@{
  timestamp = (Get-Date).ToString('o')
  repoRoot = $RepoRoot
  t5500Host = $T5500Host
  summary = $summary
  gates = $gates
}

$report | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
$report | ConvertTo-Json -Depth 20

if ($summary['fail'] -gt 0) { exit 1 }
if ($summary['incomplete'] -gt 0 -or $summary['warn'] -gt 0) { exit 2 }
exit 0
