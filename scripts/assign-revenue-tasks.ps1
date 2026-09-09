# assign-revenue-tasks.ps1 — the daily revenue routine.
#
# Posts the day's tasks from revenue-playbook.json to Mission Control (:3151).
# The swarm runs them on FREE OmniRoute routes (executor 'auto'; the cc/ provider
# that bills the Max subscription is deactivated), and the materializer commits
# every File: block the workers emit into mission-control-output/ and pushes.
# Net effect: revenue assets accumulate in the repo daily at $0 API cost, and
# nothing is lost to drift.
#
# WHAT THIS IS NOT: a watchdog. It runs once, posts, logs, exits. It restarts
# nothing, monitors nothing, and if the board is down it says so in the log and
# quits — it does NOT try to start services.
#
# AGENTS DRAFT, A HUMAN SHIPS: outbound actions (sending email, submitting
# directories, posting socials) stay with Joshua. This routine only produces
# the assets, truthfully — the playbook doctrine bans invented metrics.
#
# Registered as scheduled task ANTIGRAVITY-RevenueTasks (daily 09:00).
# Kill switch: delete that task, or create scripts\REVENUE-ROUTINE.DISABLED.

$ErrorActionPreference = 'Stop'
$root = 'F:\ANTIGRAVITY'
$log  = Join-Path $root 'logs\revenue-assign.log'
$playbookPath = Join-Path $root 'scripts\revenue-playbook.json'
$board = 'http://127.0.0.1:3151'

function Log($msg) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $msg"
  New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null
  Add-Content -Path $log -Value $line
  Write-Host $line
}

if (Test-Path (Join-Path $root 'scripts\REVENUE-ROUTINE.DISABLED')) {
  Log 'kill-switch file present - doing nothing.'
  exit 0
}

# Board must be up and must be v5 (the agent swarm), not something squatting the port.
try {
  $health = (Invoke-WebRequest -Uri "$board/api/health" -UseBasicParsing -TimeoutSec 10).Content | ConvertFrom-Json
  if ($health.name -notmatch 'Agency Swarm v5') { Log "ABORT: :3151 is '$($health.name)', not the v5 board."; exit 1 }
  if (-not $health.routerLive) { Log 'ABORT: board up but OmniRoute is not live - tasks would all fail.'; exit 1 }
} catch {
  Log "ABORT: board unreachable on :3151 - $($_.Exception.Message.Split("`n")[0])"
  exit 1
}

$playbook = Get-Content $playbookPath -Raw | ConvertFrom-Json
$today = (Get-Date).DayOfWeek.ToString()
$tasks = $playbook.days.$today
if (-not $tasks) { Log "no playbook entries for $today - nothing to assign."; exit 0 }

# Skip if today's tasks were already posted (rerun-safe: title match on today's board).
$existing = ((Invoke-WebRequest -Uri "$board/api/tasks" -UseBasicParsing -TimeoutSec 10).Content | ConvertFrom-Json).tasks
$todayStamp = Get-Date -Format 'yyyy-MM-dd'

$posted = 0
foreach ($t in $tasks) {
  $title = "[$todayStamp] $($t.title)"
  if ($existing | Where-Object { $_.title -eq $title }) { Log "skip (already posted today): $title"; continue }
  $body = @{
    title    = $title
    prompt   = "$($playbook.doctrine)`n`n=== TASK ===`n$($t.prompt)"
    agentIds = @($t.agent)
    mode     = 'reasoning'
    executor = 'auto'
  } | ConvertTo-Json -Depth 4
  try {
    $r = Invoke-WebRequest -Uri "$board/api/tasks" -Method POST -ContentType 'application/json' -Body $body -UseBasicParsing -TimeoutSec 15
    $id = ($r.Content | ConvertFrom-Json).id
    Log "posted [$($t.agent)] $title -> $id"
    $posted++
  } catch {
    Log "FAILED to post '$title': $($_.Exception.Message.Split("`n")[0])"
  }
}
Log "done - $posted task(s) posted for $today."
