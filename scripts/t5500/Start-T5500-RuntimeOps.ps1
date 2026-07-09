# Starts T5500 runtime-only ops services from a clean runtime bundle.
# This avoids touching a dirty C:\antigravity checkout on T5500.

[CmdletBinding()]
param(
  [string]$RepoRoot = 'C:\antigravity-runtime',
  [int]$NodeBalancerPort = 4180,
  [int]$SupportGatewayPort = 9110,
  [int]$OmniRouterPort = 11436
)

$ErrorActionPreference = 'Continue'
$LogDir = Join-Path $RepoRoot 'logs'
$LogFile = Join-Path $LogDir 't5500-runtime-ops.log'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log([string]$Message) {
  $line = '[{0}] {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
  Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
  Write-Output $line
}

function Test-Port([int]$Port) {
  try {
    return Test-NetConnection 127.0.0.1 -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
  } catch {
    return $false
  }
}

function Wait-Port([int]$Port, [int]$TimeoutSec = 30) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  do {
    if (Test-Port $Port) { return $true }
    Start-Sleep -Seconds 1
  } while ((Get-Date) -lt $deadline)
  return $false
}

function Start-ScriptIfDown {
  param(
    [string]$Name,
    [int]$Port,
    [string]$Script,
    [string[]]$Args
  )
  if (Test-Port $Port) {
    Log "$Name already listening on :$Port"
    return
  }
  if (-not (Test-Path -LiteralPath $Script)) {
    Log "WARN missing $Name script: $Script"
    return
  }
  Start-Process -FilePath powershell.exe -ArgumentList (@(
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    $Script
  ) + $Args) -WorkingDirectory $RepoRoot -WindowStyle Hidden | Out-Null
  Log "Started $Name on :$Port from $Script"
}

Log "=== T5500 runtime ops startup repoRoot=$RepoRoot ==="

Start-ScriptIfDown `
  -Name 'node-balancer' `
  -Port $NodeBalancerPort `
  -Script (Join-Path $RepoRoot 'scripts\t5500\Start-T5500-NodeBalancer.ps1') `
  -Args @('-RepoRoot', $RepoRoot, '-Port', [string]$NodeBalancerPort)

Start-ScriptIfDown `
  -Name 'hermes-support-gateway' `
  -Port $SupportGatewayPort `
  -Script (Join-Path $RepoRoot 'scripts\start-hermes-support-gateway.ps1') `
  -Args @('-RepoRoot', $RepoRoot, '-Port', [string]$SupportGatewayPort)

Start-ScriptIfDown `
  -Name 'omni-router' `
  -Port $OmniRouterPort `
  -Script (Join-Path $RepoRoot 'scripts\start-omni-router.ps1') `
  -Args @('-RepoRoot', $RepoRoot, '-Port', [string]$OmniRouterPort)

foreach ($port in @($NodeBalancerPort, $SupportGatewayPort, $OmniRouterPort)) {
  $state = if (Wait-Port $port 30) { 'UP' } else { 'down' }
  Log (':{0} {1}' -f $port, $state)
}
