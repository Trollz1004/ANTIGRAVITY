# Starts the canonical Paperclip Hermes stack for Josh's local repo.
#
# Canonical identity:
#   - Hermes CEO / operator UI:     http://127.0.0.1:3000  (Hermes Workspace)
#   - Hermes Agent dashboard:       http://127.0.0.1:9119  (real dashboard APIs)
#   - Claude adapter:               http://127.0.0.1:8082  (FCC / fcc-claude)
#   - Paperclip HQ:                 http://127.0.0.1:3110  (started separately by start-paperclip.ps1)
#
# This script is safe to run repeatedly. It only starts missing listeners.

[CmdletBinding()]
param(
  [string]$RepoRoot = 'c:\antigravity',
  [string]$HermesWorkspace = "$env:USERPROFILE\hermes-workspace",
  [switch]$AlsoStartPaperclip
)

$ErrorActionPreference = 'Continue'
$LogDir = Join-Path $RepoRoot 'logs'
$LogFile = Join-Path $LogDir 'paperclip-hermes.log'
$PowerShellExe = 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe'
$PnpmCmd = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
$PnpmExe = if ($PnpmCmd) { $PnpmCmd.Source } else { $null }
if (-not $PnpmExe) {
  $PnpmCmd = Get-Command pnpm -ErrorAction SilentlyContinue
  $PnpmExe = if ($PnpmCmd) { $PnpmCmd.Source } else { $null }
}
$HermesCmd = Get-Command hermes -ErrorAction SilentlyContinue
$HermesExe = if ($HermesCmd) { $HermesCmd.Source } else { $null }
$HermesTuiDir = Join-Path $env:LOCALAPPDATA 'hermes\hermes-agent\ui-tui'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log([string]$Message) {
  $line = '[{0}] {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
  Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
  Write-Output $line
}

function Test-LocalPort([int]$Port) {
  try {
    $client = [System.Net.Sockets.TcpClient]::new()
    $async = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
    $ok = $async.AsyncWaitHandle.WaitOne(1200, $false)
    $client.Close()
    return [bool]$ok
  } catch {
    return $false
  }
}

function Start-FccAdapter {
  if (Test-LocalPort 8082) {
    Log 'FCC adapter already listening on :8082.'
    return
  }
  $fccCommand = Get-Command fcc-server -ErrorAction SilentlyContinue
  $fccServer = if ($fccCommand) { $fccCommand.Source } else { $null }
  if (-not $fccServer) {
    Log 'WARN: fcc-server not found on PATH; fcc-claude adapter cannot be started.'
    return
  }
  Log 'Starting FCC adapter on :8082 (fcc-server).'
  Start-Process -FilePath $fccServer -WorkingDirectory $RepoRoot -WindowStyle Hidden | Out-Null
}

function Start-HermesWorkspace {
  if (Test-LocalPort 3000) {
    Log 'Hermes Workspace already listening on :3000.'
    return
  }
  if (-not (Test-Path (Join-Path $HermesWorkspace 'package.json'))) {
    Log "WARN: Hermes Workspace package.json not found at $HermesWorkspace."
    return
  }
  if (-not $PnpmExe) {
    Log 'WARN: pnpm not found on PATH; Hermes Workspace cannot be started.'
    return
  }

  Log "Starting Hermes Workspace on :3000 from $HermesWorkspace."
  $cmd = "cd /d `"$HermesWorkspace`" && set PORT=3000&& set HOST=127.0.0.1&& `"$PnpmExe`" dev --host 127.0.0.1 --port 3000"
  Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $cmd -WorkingDirectory $HermesWorkspace -WindowStyle Hidden | Out-Null
}

function Test-HermesDashboard {
  try {
    $status = Invoke-RestMethod -Uri 'http://127.0.0.1:9119/api/status' -TimeoutSec 3 -ErrorAction Stop
    return [bool]$status.version
  } catch {
    return $false
  }
}

function Stop-LocalPortListener([int]$Port) {
  try {
    $rows = netstat -ano | Select-String (':{0}\s+.*LISTENING' -f $Port)
    foreach ($row in $rows) {
      $pidText = ($row.Line.Trim() -split '\s+')[-1]
      $pid = 0
      if ([int]::TryParse($pidText, [ref]$pid) -and $pid -gt 0) {
        Log (':{0} is occupied by PID {1}; stopping wrong listener.' -f $Port, $pid)
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
      }
    }
  } catch {
    Log (':{0} listener cleanup failed: {1}' -f $Port, $_.Exception.Message)
  }
}

function Start-HermesDashboard {
  if (Test-HermesDashboard) {
    Log 'Hermes Agent dashboard already healthy on :9119.'
    return
  }
  if (Test-LocalPort 9119) {
    Log 'WARN: :9119 is listening but is not the Hermes dashboard API; replacing it.'
    Stop-LocalPortListener 9119
    Start-Sleep -Seconds 1
  }
  if (-not $HermesExe) {
    Log 'WARN: hermes command not found on PATH; Hermes dashboard cannot be started.'
    return
  }

  Log 'Starting real Hermes Agent dashboard on :9119.'
  $cmd = "set `"HERMES_SKIP_NODE_BOOTSTRAP=1`"&& set `"HERMES_TUI_DIR=$HermesTuiDir`"&& `"$HermesExe`" dashboard --port 9119 --host 127.0.0.1 --no-open --skip-build"
  Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $cmd -WorkingDirectory $RepoRoot -WindowStyle Hidden | Out-Null
}

function Start-PaperclipIfRequested {
  if (-not $AlsoStartPaperclip) { return }
  if (Test-LocalPort 3110) {
    Log 'Paperclip HQ already listening on :3110.'
    return
  }
  $script = Join-Path $RepoRoot 'scripts\start-paperclip.ps1'
  if (-not (Test-Path $script)) {
    Log "WARN: Paperclip start script missing: $script"
    return
  }
  Log 'Starting Paperclip HQ on :3110.'
  Start-Process -FilePath $PowerShellExe -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',$script) -WorkingDirectory $RepoRoot -WindowStyle Minimized | Out-Null
}

Log '=== start-paperclip-hermes.ps1 ==='
Start-FccAdapter
Start-HermesWorkspace
Start-HermesDashboard
Start-PaperclipIfRequested
Start-Sleep -Seconds 3

foreach ($p in 8082,3000,9119,3110) {
  $state = if (Test-LocalPort $p) { 'UP' } else { 'down' }
  Log (':{0} {1}' -f $p, $state)
}

Log 'Canonical Hermes Workspace: http://127.0.0.1:3000 ; Hermes dashboard: http://127.0.0.1:9119 ; FCC adapter: http://127.0.0.1:8082/admin'
