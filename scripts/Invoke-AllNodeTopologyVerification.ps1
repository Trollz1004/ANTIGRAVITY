# Runs topology verification across known nodes and writes a single report.
#
# This is evidence collection only. It does not start/stop services, mutate DNS,
# read secrets, or charge payments.
#
# Examples:
#   powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\Invoke-AllNodeTopologyVerification.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\Invoke-AllNodeTopologyVerification.ps1 -IncludePending

[CmdletBinding()]
param(
  [string]$RepoRoot = 'C:\antigravity',
  [string]$NodePoolPath = '',
  [string]$RemoteTempRoot = '',
  [switch]$IncludePending,
  [switch]$NoSsh
)

$ErrorActionPreference = 'Continue'

if (-not $NodePoolPath) {
  $NodePoolPath = Join-Path $RepoRoot 'ops\mission-control\node-pool.json'
}

$LogDir = Join-Path $RepoRoot 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$ReportPath = Join-Path $LogDir "all-node-topology-verification-$stamp.json"
$LocalVerifier = Join-Path $RepoRoot 'scripts\verify-node-topology.ps1'

function New-Result {
  param(
    [string]$NodeId,
    [string]$HostName,
    [string]$Role,
    [string]$Status,
    [string]$Message,
    [object]$Data = $null
  )
  [pscustomobject]@{
    node = $NodeId
    host = $HostName
    role = $Role
    status = $Status
    message = $Message
    data = $Data
  }
}

function Get-VerifyRole {
  param($Node)
  $roleText = "$($Node.role) $($Node.id)".ToLowerInvariant()
  if ($roleText -match 'dream-online|game') { return 'Display' }
  if ($roleText -match 'sabretooth|control-dev') { return 'Sabretooth' }
  if ($roleText -match 't5500|front-door|load-balancer|hermes') { return 'T5500' }
  if ($roleText -match 'ai-adapter|omnirouter|ollama|openclaw|fcc') { return 'WorkerAi' }
  if ($roleText -match 'web|api') { return 'WorkerWeb' }
  if ($roleText -match 'display|manual') { return 'Display' }
  return 'AllHttp'
}

function Invoke-LocalVerify {
  param(
    [string]$Role,
    [string]$NodeId,
    [string]$HostName
  )
  if (-not (Test-Path -LiteralPath $LocalVerifier)) {
    return New-Result $NodeId $HostName $Role 'fail' "Missing verifier: $LocalVerifier"
  }
  $outputPath = Join-Path $LogDir "node-topology-$NodeId-$stamp.json"
  $raw = & powershell -NoProfile -ExecutionPolicy Bypass -File $LocalVerifier -Role $Role -RepoRoot $RepoRoot -OutputPath $outputPath 2>&1
  $exit = $LASTEXITCODE
  $status = if ($exit -eq 0) { 'pass' } elseif ($exit -eq 2) { 'warn' } else { 'fail' }
  $data = $null
  if (Test-Path -LiteralPath $outputPath) {
    try { $data = Get-Content -Raw -LiteralPath $outputPath | ConvertFrom-Json } catch {}
  }
  return New-Result $NodeId $HostName $Role $status "local verifier exit=$exit" @{ outputPath = $outputPath; report = $data; raw = ($raw -join "`n") }
}

function Invoke-RemoteVerify {
  param(
    [string]$Role,
    [string]$NodeId,
    [string]$HostName,
    [string]$UserName = 'joshl'
  )
  if ($NoSsh) {
    return New-Result $NodeId $HostName $Role 'warn' 'SSH skipped by -NoSsh'
  }
  $ssh = Get-Command ssh -ErrorAction SilentlyContinue
  if (-not $ssh) {
    return New-Result $NodeId $HostName $Role 'warn' 'ssh command not found'
  }
  if (-not (Test-Path -LiteralPath $LocalVerifier)) {
    return New-Result $NodeId $HostName $Role 'fail' "Missing local verifier: $LocalVerifier"
  }
  $remote = "$UserName@$HostName"
  $remoteVerifier = 'C:\antigravity\scripts\verify-node-topology.ps1'
  $remoteRepoRoot = 'C:\antigravity'
  $usedTempVerifier = $false

  $probeCommand = "powershell -NoProfile -Command `"if (Test-Path -LiteralPath '$remoteVerifier') { exit 0 } else { exit 44 }`""
  $probeRaw = & $ssh.Source -o BatchMode=yes -o ConnectTimeout=8 $remote $probeCommand 2>&1
  $probeExit = $LASTEXITCODE

  if ($probeExit -eq 44) {
    $scp = Get-Command scp -ErrorAction SilentlyContinue
    if (-not $scp) {
      return New-Result $NodeId $HostName $Role 'fail' "Remote verifier missing and scp command not found" @{ probeRaw = ($probeRaw -join "`n") }
    }

    if (-not $RemoteTempRoot) {
      $RemoteTempRoot = "C:\Users\$UserName\AppData\Local\Temp\antigravity-verify"
    }
    $remoteTempVerifier = Join-Path $RemoteTempRoot 'verify-node-topology.ps1'
    $remoteTempVerifierUnix = $remoteTempVerifier -replace '\\','/'

    $mkdirCommand = "powershell -NoProfile -Command New-Item -ItemType Directory -Force -Path '$RemoteTempRoot'"
    $mkdirRaw = & $ssh.Source -o BatchMode=yes -o ConnectTimeout=8 $remote $mkdirCommand 2>&1
    $mkdirExit = $LASTEXITCODE
    if ($mkdirExit -ne 0) {
      return New-Result $NodeId $HostName $Role 'fail' "Could not create remote temp verifier dir" @{ raw = ($mkdirRaw -join "`n"); tempRoot = $RemoteTempRoot }
    }

    $target = "${remote}:$remoteTempVerifierUnix"
    $copyRaw = & $scp.Source -o BatchMode=yes -o ConnectTimeout=8 $LocalVerifier $target 2>&1
    $copyExit = $LASTEXITCODE
    if ($copyExit -ne 0) {
      return New-Result $NodeId $HostName $Role 'fail' "Could not copy verifier helper to remote temp dir" @{ raw = ($copyRaw -join "`n"); target = $target }
    }

    $remoteVerifier = $remoteTempVerifier
    $remoteRepoRoot = $RemoteTempRoot
    $usedTempVerifier = $true
  } elseif ($probeExit -ne 0) {
    return New-Result $NodeId $HostName $Role 'fail' "Could not probe remote verifier path" @{ raw = ($probeRaw -join "`n"); path = $remoteVerifier; exit = $probeExit }
  }

  $remoteCommand = "powershell -NoProfile -ExecutionPolicy Bypass -File $remoteVerifier -Role $Role -RepoRoot $remoteRepoRoot"
  $raw = & $ssh.Source -o BatchMode=yes -o ConnectTimeout=8 $remote $remoteCommand 2>&1
  $exit = $LASTEXITCODE
  $status = if ($exit -eq 0) { 'pass' } elseif ($exit -eq 2) { 'warn' } else { 'fail' }
  return New-Result $NodeId $HostName $Role $status "ssh verifier exit=$exit" @{
    raw = ($raw -join "`n")
    verifier = $remoteVerifier
    repoRoot = $remoteRepoRoot
    usedTempVerifier = $usedTempVerifier
  }
}

if (-not (Test-Path -LiteralPath $NodePoolPath)) {
  throw "Missing node pool config: $NodePoolPath"
}

$pool = Get-Content -Raw -LiteralPath $NodePoolPath | ConvertFrom-Json
$results = New-Object System.Collections.Generic.List[object]
$localNames = @(
  $env:COMPUTERNAME,
  'localhost',
  '127.0.0.1',
  '192.168.0.8'
) | Where-Object { $_ }

foreach ($node in $pool.nodes) {
  $role = Get-VerifyRole $node
  $hostName = [string]$node.host
  if ((-not $IncludePending) -and (-not $hostName -or $hostName -eq 'pending')) {
    $results.Add((New-Result $node.id $hostName $role 'skip' 'node host pending; skipped'))
    continue
  }

  if ($localNames -contains $hostName -or $node.id -eq 'sabretooth') {
    $results.Add((Invoke-LocalVerify -Role $role -NodeId $node.id -HostName $hostName))
  } else {
    $results.Add((Invoke-RemoteVerify -Role $role -NodeId $node.id -HostName $hostName))
  }
}

$summary = @{
  pass = @($results | Where-Object status -eq 'pass').Count
  fail = @($results | Where-Object status -eq 'fail').Count
  warn = @($results | Where-Object status -eq 'warn').Count
  skip = @($results | Where-Object status -eq 'skip').Count
}

$report = [pscustomobject]@{
  timestamp = (Get-Date).ToString('o')
  repoRoot = $RepoRoot
  nodePoolPath = $NodePoolPath
  summary = $summary
  results = $results
}

$report | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $ReportPath -Encoding UTF8
$report | ConvertTo-Json -Depth 20

if ($summary['fail'] -gt 0) { exit 1 }
if ($summary['warn'] -gt 0) { exit 2 }
exit 0
