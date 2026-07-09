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
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log([string]$Message) {
  $line = '[{0}] {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
  Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
  Write-Output $line
}

function Start-PowerShellScript([string]$Script, [string[]]$Args) {
  if (-not (Test-Path -LiteralPath $Script)) {
    Log "WARN missing script $Script"
    return
  }
  Start-Process -FilePath powershell -ArgumentList (@('-NoProfile','-ExecutionPolicy','Bypass','-File',$Script) + $Args) -WorkingDirectory $RepoRoot -WindowStyle Hidden | Out-Null
}

Log "=== worker startup role=$Role node=$NodeName hub=$AgentHubUrl ==="

if ($Role -eq 'ai') {
  $env:AGENT_HUB_URL = $AgentHubUrl
  Start-PowerShellScript (Join-Path $RepoRoot 'scripts\start-omni-router.ps1') @('-RepoRoot', $RepoRoot, '-Port', '11436')
  Log 'AI worker started OmniRouter. Optional FCC/OpenCode/Ollama/OpenClaw remain manual until configured.'
} elseif ($Role -eq 'web') {
  Log 'Web worker role registered. Add web/API replica start commands after service targets are confirmed.'
} else {
  Log 'Display worker role registered. No background repair loops started.'
}

Log 'Worker node startup complete.'
