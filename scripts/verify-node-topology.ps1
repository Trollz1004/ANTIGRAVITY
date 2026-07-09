# Verifies node topology after restart/power loss without reading secrets.
#
# Examples:
#   powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\verify-node-topology.ps1 -Role Sabretooth
#   powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\verify-node-topology.ps1 -Role T5500
#   powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\verify-node-topology.ps1 -Role WorkerAi

[CmdletBinding()]
param(
  [ValidateSet('Sabretooth','T5500','WorkerAi','WorkerWeb','Display','AllHttp')]
  [string]$Role = 'AllHttp',
  [string]$RepoRoot = 'C:\antigravity',
  [string]$OutputPath = ''
)

$ErrorActionPreference = 'Continue'

$LogDir = Join-Path $RepoRoot 'logs'
$NodePoolPath = Join-Path $RepoRoot 'ops\mission-control\node-pool.json'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

if (-not $OutputPath) {
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $OutputPath = Join-Path $LogDir "node-topology-verification-$stamp.json"
}

function New-Check {
  param(
    [string]$Name,
    [string]$Status,
    [string]$Message,
    [hashtable]$Data = @{}
  )
  [pscustomobject]@{
    name = $Name
    status = $Status
    message = $Message
    data = $Data
  }
}

function Test-Http {
  param(
    [string]$Name,
    [string]$Url,
    [int]$TimeoutSec = 5
  )
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec $TimeoutSec
    $status = if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { 'pass' } else { 'fail' }
    return New-Check $Name $status "HTTP $($response.StatusCode)" @{ url = $Url; code = $response.StatusCode }
  } catch {
    return New-Check $Name 'fail' $_.Exception.Message @{ url = $Url }
  }
}

function Test-PortClosed {
  param(
    [string]$Name,
    [int]$Port
  )
  try {
    $open = Test-NetConnection 127.0.0.1 -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($open) {
      return New-Check $Name 'fail' "Forbidden listener is open on :$Port" @{ port = $Port }
    }
    return New-Check $Name 'pass' "No listener on :$Port" @{ port = $Port }
  } catch {
    return New-Check $Name 'warn' $_.Exception.Message @{ port = $Port }
  }
}

function Test-ProcessAbsent {
  param(
    [string]$Name,
    [string]$Pattern
  )
  try {
    $matches = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -match $Pattern -or $_.CommandLine -match $Pattern } |
      Select-Object -First 5 Name,ProcessId
    if ($matches) {
      return New-Check $Name 'fail' "Forbidden process pattern found: $Pattern" @{ pattern = $Pattern; count = @($matches).Count }
    }
    return New-Check $Name 'pass' "No process pattern found: $Pattern" @{ pattern = $Pattern }
  } catch {
    return New-Check $Name 'warn' $_.Exception.Message @{ pattern = $Pattern }
  }
}

function Convert-LoopbackUrl {
  param(
    [string]$Url,
    [string]$TargetHost
  )
  if (-not $TargetHost -or $TargetHost -eq 'pending') { return $Url }
  $replacement = '://{0}:' -f $TargetHost
  return $Url -replace '://127\.0\.0\.1:', $replacement -replace '://localhost:', $replacement
}

$checks = New-Object System.Collections.Generic.List[object]

if ($Role -eq 'Sabretooth' -or $Role -eq 'AllHttp') {
  $checks.Add((Test-Http 'sabretooth mission-control' 'http://127.0.0.1:3110/api/health'))
  $checks.Add((Test-Http 'sabretooth agent-hub' 'http://127.0.0.1:3130/health'))
}

if ($Role -eq 'Sabretooth') {
  foreach ($port in @(3000, 8082, 9119, 11435)) {
    $checks.Add((Test-PortClosed "sabretooth forbidden port $port" $port))
  }
  foreach ($pattern in @('cloudflared', 'hermes.*dashboard', 'hermes.*desktop', 'fcc-server', 'watchdog', 'sentry')) {
    $checks.Add((Test-ProcessAbsent "sabretooth forbidden process $pattern" $pattern))
  }
}

if ($Role -eq 'T5500' -or $Role -eq 'AllHttp') {
  $checks.Add((Test-Http 't5500 date-app backend' 'http://127.0.0.1:8000/api/v1/health'))
  $checks.Add((Test-Http 't5500 date-app frontend' 'http://127.0.0.1:3200/'))
  $checks.Add((Test-Http 't5500 node-balancer' 'http://127.0.0.1:4180/health'))
  $checks.Add((Test-Http 't5500 hermes-support-gateway' 'http://127.0.0.1:9110/health'))
  $checks.Add((Test-Http 't5500 hermes-dashboard' 'http://127.0.0.1:9119/api/status'))
  $checks.Add((Test-Http 't5500 omni-router' 'http://127.0.0.1:11436/health'))
}

if ($Role -eq 'WorkerAi') {
  $checks.Add((Test-Http 'worker-ai omni-router' 'http://127.0.0.1:11436/health'))
  $checks.Add((Test-Http 'worker-ai ollama optional' 'http://127.0.0.1:11434/api/tags'))
}

if ($Role -eq 'WorkerWeb') {
  $checks.Add((New-Check 'worker-web placeholder' 'warn' 'No web/API replica target is configured yet.' @{}))
}

if ($Role -eq 'Display') {
  $checks.Add((New-Check 'display node' 'pass' 'Display/manual check-in role has no background service requirement.' @{}))
}

if ($Role -eq 'AllHttp' -and (Test-Path -LiteralPath $NodePoolPath)) {
  try {
    $pool = Get-Content -Raw -LiteralPath $NodePoolPath | ConvertFrom-Json
    foreach ($node in $pool.nodes) {
      foreach ($url in @($node.health)) {
        $checkUrl = Convert-LoopbackUrl -Url $url -TargetHost $node.host
        $checks.Add((Test-Http "node-pool $($node.id) $checkUrl" $checkUrl))
      }
    }
  } catch {
    $checks.Add((New-Check 'node-pool config' 'fail' $_.Exception.Message @{ path = $NodePoolPath }))
  }
}

$summary = @{
  pass = @($checks | Where-Object status -eq 'pass').Count
  fail = @($checks | Where-Object status -eq 'fail').Count
  warn = @($checks | Where-Object status -eq 'warn').Count
}

$report = [pscustomobject]@{
  timestamp = (Get-Date).ToString('o')
  role = $Role
  repoRoot = $RepoRoot
  summary = $summary
  checks = $checks
}

$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
$report | ConvertTo-Json -Depth 8

if ($summary['fail'] -gt 0) { exit 1 }
if ($summary['warn'] -gt 0) { exit 2 }
exit 0
