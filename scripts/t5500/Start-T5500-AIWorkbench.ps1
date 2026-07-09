# Starts or verifies T5500 AI workbench services after boot/power loss.
# This does not start Agent Hub authority. Sabretooth owns Agent Hub.

[CmdletBinding()]
param(
  [string]$RepoRoot = 'C:\antigravity',
  [string]$HermesWorkspace = "$env:USERPROFILE\hermes-workspace",
  [int]$HermesWorkspacePort = 3010,
  [switch]$StartFcc
)

$ErrorActionPreference = 'Continue'
$LogDir = Join-Path $RepoRoot 'logs'
$LogFile = Join-Path $LogDir 't5500-ai-workbench.log'
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

function Start-PowerShellScript([string]$Script, [string[]]$Args) {
  if (-not (Test-Path -LiteralPath $Script)) {
    Log "WARN missing script $Script"
    return
  }
  Start-Process -FilePath powershell -ArgumentList (@('-NoProfile','-ExecutionPolicy','Bypass','-File',$Script) + $Args) -WorkingDirectory $RepoRoot -WindowStyle Hidden | Out-Null
}

function Start-HermesDashboard {
  if (Test-Port 9119) {
    Log 'Hermes dashboard already listening on :9119.'
    return
  }
  $hermes = Get-Command hermes -ErrorAction SilentlyContinue
  if (-not $hermes) {
    Log 'WARN hermes command not found; dashboard not started.'
    return
  }
  Log 'Starting Hermes dashboard on :9119.'
  $cmd = "set `"HERMES_SKIP_NODE_BOOTSTRAP=1`"&& `"$($hermes.Source)`" dashboard --port 9119 --host 127.0.0.1 --no-open --skip-build"
  Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $cmd -WorkingDirectory $RepoRoot -WindowStyle Hidden | Out-Null
}

function Start-HermesWorkspace {
  if (Test-Port $HermesWorkspacePort) {
    Log "Hermes workspace already listening on :$HermesWorkspacePort."
    return
  }
  $pnpm = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
  if (-not $pnpm) { $pnpm = Get-Command pnpm -ErrorAction SilentlyContinue }
  if (-not $pnpm) {
    Log 'WARN pnpm not found; Hermes workspace not started.'
    return
  }
  if (-not (Test-Path -LiteralPath (Join-Path $HermesWorkspace 'package.json'))) {
    Log "WARN Hermes workspace missing at $HermesWorkspace"
    return
  }
  Log "Starting Hermes workspace on :$HermesWorkspacePort."
  $cmd = "cd /d `"$HermesWorkspace`" && set PORT=$HermesWorkspacePort&& set HOST=127.0.0.1&& `"$($pnpm.Source)`" dev --host 127.0.0.1 --port $HermesWorkspacePort"
  Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $cmd -WorkingDirectory $HermesWorkspace -WindowStyle Hidden | Out-Null
}

function Start-FccIfRequested {
  if (-not $StartFcc) {
    Log 'FCC not started; pass -StartFcc when this node owns FCC.'
    return
  }
  if (Test-Port 8082) {
    Log 'FCC already listening on :8082.'
    return
  }
  $fcc = Get-Command fcc-server -ErrorAction SilentlyContinue
  if (-not $fcc) {
    Log 'WARN fcc-server not found.'
    return
  }
  Log 'Starting FCC on :8082.'
  Start-Process -FilePath $fcc.Source -WorkingDirectory $RepoRoot -WindowStyle Hidden | Out-Null
}

Log '=== T5500 AI workbench startup ==='
Start-PowerShellScript (Join-Path $RepoRoot 'scripts\start-hermes-support-gateway.ps1') @('-RepoRoot', $RepoRoot, '-Port', '9110')
Start-PowerShellScript (Join-Path $RepoRoot 'scripts\start-omni-router.ps1') @('-RepoRoot', $RepoRoot, '-Port', '11436')
Start-HermesDashboard
Start-HermesWorkspace
Start-FccIfRequested

foreach ($port in 9110,9119,$HermesWorkspacePort,11436,8082) {
  $state = if (Test-Port $port) { 'UP' } else { 'down' }
  Log (':{0} {1}' -f $port, $state)
}
