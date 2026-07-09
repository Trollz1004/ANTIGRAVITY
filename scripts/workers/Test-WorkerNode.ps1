# Checks a worker node and restarts only its assigned worker role when safe.
# Workers fail closed when Sabretooth Agent Hub is unreachable.

[CmdletBinding()]
param(
  [ValidateSet('web','ai','display')]
  [string]$Role = 'ai',
  [string]$RepoRoot = 'C:\antigravity',
  [string]$NodeName = $env:COMPUTERNAME,
  [string]$AgentHubUrl = 'http://192.168.0.8:3130',
  [switch]$NoRestart
)

$ErrorActionPreference = 'Continue'
$LogDir = Join-Path $RepoRoot 'logs'
$LogFile = Join-Path $LogDir "worker-$NodeName-health.log"
$HeartbeatFile = Join-Path $LogDir "worker-$NodeName-heartbeat.jsonl"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log([string]$Message) {
  $line = '[{0}] {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
  Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
  Write-Output $line
}

function Write-Heartbeat([string]$Event, [string]$Status, [hashtable]$Extra = @{}) {
  $payload = [ordered]@{
    timestamp = (Get-Date).ToUniversalTime().ToString('o')
    node = $NodeName
    role = $Role
    event = $Event
    status = $Status
    agentHubUrl = $AgentHubUrl
    repoRoot = $RepoRoot
    logFile = $LogFile
  }
  foreach ($key in $Extra.Keys) {
    $payload[$key] = $Extra[$key]
  }
  ($payload | ConvertTo-Json -Compress -Depth 8) | Add-Content -Path $HeartbeatFile -ErrorAction SilentlyContinue
}

function Test-HttpOk([string]$Url) {
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500)
  } catch {
    return $false
  }
}

function Start-WorkerRole {
  $script = Join-Path $RepoRoot 'scripts\workers\Start-WorkerNode.ps1'
  if (-not (Test-Path -LiteralPath $script)) {
    Log "FAIL missing worker start script: $script"
    Write-Heartbeat 'health_check' 'missing_start_script' @{ script = $script }
    return
  }

  Start-Process -FilePath powershell.exe -ArgumentList @(
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    $script,
    '-Role',
    $Role,
    '-RepoRoot',
    $RepoRoot,
    '-NodeName',
    $NodeName,
    '-AgentHubUrl',
    $AgentHubUrl
  ) -WorkingDirectory $RepoRoot -WindowStyle Hidden | Out-Null
  Log "Restart requested for worker role=$Role"
}

$agentHubHealth = $AgentHubUrl.TrimEnd('/') + '/health'
if (-not (Test-HttpOk $agentHubHealth)) {
  Log "FAIL_CLOSED Agent Hub unreachable at $agentHubHealth; no worker repair attempted."
  Write-Heartbeat 'health_check' 'fail_closed' @{ healthUrl = $agentHubHealth; reason = 'agent_hub_unreachable' }
  exit 2
}

$localHealth = @()
if ($Role -eq 'ai') {
  $localHealth = @('http://127.0.0.1:11436/health')
}

$failed = @()
foreach ($url in $localHealth) {
  if (-not (Test-HttpOk $url)) {
    $failed += $url
  }
}

if ($failed.Count -gt 0) {
  Log ("WARN local health failed: " + ($failed -join ', '))
  Write-Heartbeat 'health_check' 'local_health_failed' @{ failedHealth = $failed }
  if (-not $NoRestart) {
    Start-WorkerRole
  }
  exit 1
}

Log "PASS worker health role=$Role"
Write-Heartbeat 'health_check' 'pass' @{ localHealth = $localHealth; agentHubHealth = $agentHubHealth }
