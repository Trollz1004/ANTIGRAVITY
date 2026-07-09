# Updates ops/mission-control/node-pool.json with a worker/display node identity.
# This script edits repo routing data only. It does not configure DNS or services.

[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)]
  [string]$NodeId,
  [Parameter(Mandatory=$true)]
  [string]$HostAddress,
  [ValidateSet('stateless-web-worker','ai-adapter-worker','thin-display-manual-checkin')]
  [string]$Role = 'ai-adapter-worker',
  [string]$Hardware = 'pending',
  [string]$RepoRoot = 'C:\antigravity'
)

$ErrorActionPreference = 'Stop'

$NodePoolPath = Join-Path $RepoRoot 'ops\mission-control\node-pool.json'
if (-not (Test-Path -LiteralPath $NodePoolPath)) {
  throw "Missing node pool config: $NodePoolPath"
}

$pool = Get-Content -Raw -LiteralPath $NodePoolPath | ConvertFrom-Json
$nodes = @($pool.nodes)
$existing = $nodes | Where-Object { $_.id -eq $NodeId } | Select-Object -First 1

if ($existing) {
  $existing.host = $HostAddress
  $existing.role = $Role
  $existing.hardware = $Hardware
} else {
  $health = @()
  if ($Role -eq 'ai-adapter-worker') {
    $health = @("http://$HostAddress:11436/health")
  }
  $newNode = [pscustomobject]@{
    id = $NodeId
    host = $HostAddress
    hardware = $Hardware
    role = $Role
    authority = 'none'
    autostart = if ($Role -eq 'stateless-web-worker') { 'web/API replicas only' } elseif ($Role -eq 'ai-adapter-worker') { 'OmniRouter/FCC/OpenCode/Ollama/OpenClaw workers only' } else { 'browser/display/manual check-in only' }
    health = $health
  }
  $pool.nodes += $newNode
}

$pool.lastUpdated = (Get-Date -Format 'yyyy-MM-dd')
$pool | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $NodePoolPath -Encoding UTF8
Write-Host "Updated $NodePoolPath for $NodeId -> $HostAddress ($Role)"
