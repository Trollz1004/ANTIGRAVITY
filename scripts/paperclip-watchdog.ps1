# Paperclip Hermes watchdog.
# Keeps the same Hermes identity alive for Paperclip/repo work:
#   fcc-claude adapter :8082, Hermes Workspace :3000, Hermes Agent dashboard :9119.
# Optionally keeps Paperclip HQ :3110 alive via start-paperclip-hermes.ps1 -AlsoStartPaperclip.

[CmdletBinding()]
param(
  [string]$RepoRoot = 'c:\antigravity',
  [int]$CheckIntervalSec = 30,
  [switch]$AlsoStartPaperclip
)

$ErrorActionPreference = 'Continue'
$LogDir = Join-Path $RepoRoot 'logs'
$LogFile = Join-Path $LogDir 'paperclip-watchdog.log'
$StartScript = Join-Path $RepoRoot 'scripts\start-paperclip-hermes.ps1'
$MaxLogBytes = 10MB

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log([string]$Message) {
  $line = '[{0}] {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
  Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
}

function Rotate-Log {
  if ((Test-Path $LogFile) -and ((Get-Item $LogFile).Length -gt $MaxLogBytes)) {
    Move-Item $LogFile "$LogFile.1" -Force -ErrorAction SilentlyContinue
  }
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

function Invoke-Start {
  if (-not (Test-Path $StartScript)) {
    Log "ERROR: missing start script: $StartScript"
    return
  }
  $args = @('-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',"`"$StartScript`"",'-RepoRoot',"`"$RepoRoot`"")
  if ($AlsoStartPaperclip) { $args += '-AlsoStartPaperclip' }
  Log 'Issuing Paperclip Hermes start/repair command.'
  Start-Process -FilePath 'powershell.exe' -ArgumentList ($args -join ' ') -WindowStyle Hidden -WorkingDirectory $RepoRoot | Out-Null
}

Log '====== Paperclip Hermes watchdog started ======'
Invoke-Start

while ($true) {
  Rotate-Log
  $required = @(8082,3000,9119)
  if ($AlsoStartPaperclip) { $required += 3110 }

  $missing = @()
  foreach ($port in $required) {
    if (-not (Test-LocalPort $port)) { $missing += $port }
  }

  if ($missing.Count -gt 0) {
    Log ('Missing ports: {0}' -f ($missing -join ', '))
    Invoke-Start
    Start-Sleep -Seconds 10
  }

  Start-Sleep -Seconds $CheckIntervalSec
}
