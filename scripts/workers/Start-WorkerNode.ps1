# Starts a worker node role. Worker nodes do not own Mission Control, Agent Hub,
# payment webhooks, database primaries, or doctrine.

[CmdletBinding()]
param(
  [ValidateSet('web','ai','display')]
  [string]$Role = 'ai',
  [string]$RepoRoot = 'C:\antigravity',
  [string]$NodeName = $env:COMPUTERNAME,
  [string]$AgentHubUrl = 'http://192.168.0.8:3130'
)

$ErrorActionPreference = 'Continue'
$LogDir = Join-Path $RepoRoot 'logs'
$LogFile = Join-Path $LogDir "worker-$NodeName.log"
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

function Start-PowerShellScript([string]$Script, [string[]]$Args) {
  if (-not (Test-Path -LiteralPath $Script)) {
    Log "WARN missing script $Script"
    return
  }
  Start-Process -FilePath powershell -ArgumentList (@('-NoProfile','-ExecutionPolicy','Bypass','-File',$Script) + $Args) -WorkingDirectory $RepoRoot -WindowStyle Hidden | Out-Null
}

Log "=== worker startup role=$Role node=$NodeName hub=$AgentHubUrl ==="

$agentHubHealth = $AgentHubUrl.TrimEnd('/') + '/health'
if (-not (Test-HttpOk $agentHubHealth)) {
  Log "FAIL_CLOSED Agent Hub unreachable at $agentHubHealth; worker services were not started."
  Write-Heartbeat 'startup' 'fail_closed' @{ healthUrl = $agentHubHealth; reason = 'agent_hub_unreachable' }
  exit 2
}

Write-Heartbeat 'startup' 'agent_hub_reachable' @{ healthUrl = $agentHubHealth }

if ($Role -eq 'ai') {
  $env:AGENT_HUB_URL = $AgentHubUrl
  Start-PowerShellScript (Join-Path $RepoRoot 'scripts\start-omni-router.ps1') @('-RepoRoot', $RepoRoot, '-Port', '11436')
  Log 'AI worker started OmniRouter. Optional FCC/OpenCode/Ollama/OpenClaw remain manual until configured.'
  Write-Heartbeat 'service_start' 'started' @{ service = 'omni-router'; healthUrl = 'http://127.0.0.1:11436/health' }
} elseif ($Role -eq 'web') {
  Log 'Web worker role registered. Add web/API replica start commands after service targets are confirmed.'
  Write-Heartbeat 'service_start' 'registered_only' @{ service = 'web-worker' }
} else {
  Log 'Display worker role registered. No background repair loops started.'
  Write-Heartbeat 'service_start' 'registered_only' @{ service = 'display-worker' }
}

Log 'Worker node startup complete.'
Write-Heartbeat 'startup' 'complete'
