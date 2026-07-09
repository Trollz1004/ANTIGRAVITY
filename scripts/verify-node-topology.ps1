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

function Test-HttpJson {
  param(
    [string]$Name,
    [string]$Url,
    [string[]]$RequiredFields = @(),
    [int]$TimeoutSec = 5
  )
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec $TimeoutSec
    $contentType = [string]$response.Headers['Content-Type']
    $json = $response.Content | ConvertFrom-Json
    $missing = @()
    foreach ($field in $RequiredFields) {
      if (-not ($json.PSObject.Properties.Name -contains $field)) {
        $missing += $field
      }
    }
    if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 500) {
      return New-Check $Name 'fail' "HTTP $($response.StatusCode)" @{ url = $Url; code = $response.StatusCode; contentType = $contentType }
    }
    if ($missing.Count -gt 0) {
      return New-Check $Name 'fail' "JSON response is missing required fields: $($missing -join ', ')" @{ url = $Url; code = $response.StatusCode; contentType = $contentType; missing = $missing }
    }
    return New-Check $Name 'pass' "HTTP $($response.StatusCode) JSON" @{ url = $Url; code = $response.StatusCode; contentType = $contentType }
  } catch {
    return New-Check $Name 'fail' $_.Exception.Message @{ url = $Url }
  }
}

function Test-NotDateAppApi {
  param(
    [string]$Name,
    [string]$Url,
    [int]$TimeoutSec = 5
  )
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec $TimeoutSec
    $contentType = [string]$response.Headers['Content-Type']
    try {
      $json = $response.Content | ConvertFrom-Json
      $fields = @($json.PSObject.Properties.Name)
      $looksLikeDateAppHealth = (
        ($fields -contains 'status') -and
        (($fields -contains 'db_connected') -or ($fields -contains 'square_connected') -or ($fields -contains 'redis_connected'))
      )
      if ($looksLikeDateAppHealth) {
        return New-Check $Name 'fail' 'T5500 port 3000 is serving date-app API JSON; API routing must use :8000 / api.youandinotai.com instead.' @{ url = $Url; code = $response.StatusCode; contentType = $contentType }
      }
    } catch {
      return New-Check $Name 'pass' 'T5500 port 3000 did not return date-app API JSON.' @{ url = $Url; code = $response.StatusCode; contentType = $contentType }
    }
    return New-Check $Name 'pass' 'T5500 port 3000 is not date-app API health.' @{ url = $Url; code = $response.StatusCode; contentType = $contentType }
  } catch {
    return New-Check $Name 'pass' 'No date-app API response on T5500 port 3000.' @{ url = $Url }
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
    [string]$NamePattern = '',
    [string]$CommandPattern = ''
  )
  try {
    $matches = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
      Where-Object {
        (($NamePattern -ne '') -and ($_.Name -match $NamePattern)) -or
        (($CommandPattern -ne '') -and ($_.CommandLine -match $CommandPattern))
      } |
      Select-Object -First 5 Name,ProcessId
    if ($matches) {
      return New-Check $Name 'fail' 'Forbidden process pattern found' @{
        namePattern = $NamePattern
        commandPattern = $CommandPattern
        count = @($matches).Count
        processes = @($matches | ForEach-Object { "$($_.Name):$($_.ProcessId)" })
      }
    }
    return New-Check $Name 'pass' 'No forbidden process pattern found' @{
      namePattern = $NamePattern
      commandPattern = $CommandPattern
    }
  } catch {
    return New-Check $Name 'warn' $_.Exception.Message @{
      namePattern = $NamePattern
      commandPattern = $CommandPattern
    }
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
  $checks.Add((Test-ProcessAbsent 'sabretooth forbidden process cloudflared' -NamePattern '^cloudflared\.exe$' -CommandPattern 'cloudflared'))
  $checks.Add((Test-ProcessAbsent 'sabretooth forbidden process hermes dashboard' -CommandPattern 'hermes.*dashboard'))
  $checks.Add((Test-ProcessAbsent 'sabretooth forbidden process hermes desktop' -CommandPattern 'hermes.*desktop'))
  $checks.Add((Test-ProcessAbsent 'sabretooth forbidden process fcc server' -CommandPattern 'fcc-server|fcc-claude'))
  $checks.Add((Test-ProcessAbsent 'sabretooth forbidden process antigravity watchdog' -CommandPattern 'antigravity.*watchdog|watchdog.*antigravity|paperclip-watchdog|sabretooth-watchdog|openclaw-paperclip-agent-watchdog|Invoke-DateAppOpsWatchdog'))
  $checks.Add((Test-ProcessAbsent 'sabretooth forbidden process antigravity sentry' -CommandPattern 'antigravity.*sentry|sentry.*antigravity'))
}

if ($Role -eq 'T5500' -or $Role -eq 'AllHttp') {
  $checks.Add((Test-Http 't5500 date-app backend' 'http://127.0.0.1:8000/api/v1/health'))
  $checks.Add((Test-HttpJson 't5500 date-app backend json truth' 'http://127.0.0.1:8000/api/v1/health' @('status','db_connected','redis_connected','square_connected')))
  $checks.Add((Test-HttpJson 't5500 public api json truth' 'https://api.youandinotai.com/api/v1/health' @('status','db_connected','redis_connected','square_connected')))
  $checks.Add((Test-NotDateAppApi 't5500 port 3000 not date-app api' 'http://127.0.0.1:3000/api/v1/health'))
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
