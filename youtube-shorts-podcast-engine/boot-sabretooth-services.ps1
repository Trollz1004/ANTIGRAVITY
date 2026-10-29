param(
  [switch]$OpenBrowser
)

$ErrorActionPreference = "Continue"
$AnyError = $false

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host " SABRETOOTH (192.168.0.8) POWER-LOSS & EASY-BUTTON SELF-HEALING BOOTSTRAP" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

function Test-TcpPort {
  param([string]$HostName = "127.0.0.1", [int]$Port = 80, [int]$TimeoutMs = 1500)
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $iar = $client.BeginConnect($HostName, $Port, $null, $null)
    $wait = $iar.AsyncWaitHandle.WaitOne($TimeoutMs, $false)
    if (-not $wait) { $client.Close(); return $false }
    $client.EndConnect($iar)
    $client.Close()
    return $true
  } catch {
    return $false
  }
}

# 1. OBSIDIAN (:27123)
if (-not (Test-TcpPort -HostName "127.0.0.1" -Port 27123)) {
  Write-Host "[HEALING] Starting Obsidian Vault (Sabretooth)..." -ForegroundColor Yellow
  $obsExe = "$env:LOCALAPPDATA\Programs\Obsidian\Obsidian.exe"
  if (Test-Path $obsExe) {
    Start-Process -FilePath $obsExe -WindowStyle Minimized
    Start-Sleep -Seconds 3
  }
}

# 2. OLLAMA GPU (:11434)
if (-not (Test-TcpPort -HostName "127.0.0.1" -Port 11434)) {
  Write-Host "[HEALING] Starting Ollama 16GB AMD GPU Server (:11434)..." -ForegroundColor Yellow
  $ollamaExe = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
  if (Test-Path $ollamaExe) {
    Start-Process -FilePath $ollamaExe -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 2
  }
}

# 3. SABRETOOTH GPU MEDIA WORKER (:8391)
if (-not (Test-TcpPort -HostName "127.0.0.1" -Port 8391)) {
  Write-Host "[HEALING] Starting Sabretooth GPU Media & TTS Worker (:8391)..." -ForegroundColor Yellow
  $workerScript = "C:\Ai-Dream-Team\Antigravity\youtube-shorts-podcast-engine\sabretooth_opsis_worker.mjs"
  if (Test-Path $workerScript) {
    Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList "cmd.exe /c node `"$workerScript`"" | Out-Null
    Start-Sleep -Seconds 2
  }
}

# 4. HERMES DEFAULT ORCHESTRATOR & GATEWAY (:9119)
if (-not (Test-TcpPort -HostName "127.0.0.1" -Port 9119)) {
  Write-Host "[HEALING] Starting Hermes Default Orchestrator (:9119)..." -ForegroundColor Yellow
  $hermesPy = "C:\Users\joshl\AppData\Local\hermes\tools\python-3.14.9+20261021-win32-x64\python.exe"
  if (Test-Path $hermesPy) {
    Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList "cmd.exe /c `"$hermesPy`" -m hermes_cli.main dashboard --port 9119 --no-open" | Out-Null
    Start-Sleep -Seconds 3
  }
}

# 5. FREE CLAUDE CODE (:8082/admin)
if (-not (Test-TcpPort -HostName "127.0.0.1" -Port 8082)) {
  Write-Host "[HEALING] Starting Free Claude Code Admin & MCP Server (:8082)..." -ForegroundColor Yellow
  $fccExe = "C:\Users\joshl\.fcc\venv\Scripts\fcc-server.exe"
  if (Test-Path $fccExe) {
    Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList "cmd.exe /c `"$fccExe`" --auto-started" | Out-Null
    Start-Sleep -Seconds 3
  }
}

# 6. SABRETOOTH COMMAND STUDIO GUI (:8392)
if (-not (Test-TcpPort -HostName "127.0.0.1" -Port 8392)) {
  Write-Host "[HEALING] Starting Sabretooth Command Studio GUI (:8392)..." -ForegroundColor Yellow
  $serverJs = "C:\Ai-Dream-Team\Antigravity\HermesLeadGen\server.js"
  if (Test-Path $serverJs) {
    Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList "cmd.exe /c cd /d C:\Ai-Dream-Team\Antigravity\HermesLeadGen && node server.js" | Out-Null
    Start-Sleep -Seconds 2
  }
}

Write-Host ""
Write-Host "================ RED LIGHT / GREEN LIGHT STATUS REPORT ================" -ForegroundColor White

$checks = @(
  @{ Name = "Sabretooth GUI Studio (:8392)"; Host = "127.0.0.1"; Port = 8392; Url = "http://192.168.0.8:8392/" },
  @{ Name = "Hermes Default Jarvis (:9119)"; Host = "127.0.0.1"; Port = 9119; Url = "http://127.0.0.1:9119/chat?profile=default&resume=local-profile" },
  @{ Name = "Free Claude Code Admin (:8082)"; Host = "127.0.0.1"; Port = 8082; Url = "http://127.0.0.1:8082/admin" },
  @{ Name = "Sabretooth GPU Worker (:8391)"; Host = "127.0.0.1"; Port = 8391; Url = "http://127.0.0.1:8391/health" },
  @{ Name = "Ollama 16GB AMD GPU (:11434)"; Host = "127.0.0.1"; Port = 11434; Url = "http://127.0.0.1:11434/api/tags" },
  @{ Name = "Obsidian REST API (:27123)"; Host = "127.0.0.1"; Port = 27123; Url = "http://127.0.0.1:27123/" },
  @{ Name = "T5500 Shared ai-memory (:49374)"; Host = "192.168.0.15"; Port = 49374; Url = "http://192.168.0.15:49374/health" },
  @{ Name = "T5500 OmniRoute Router (:20128)"; Host = "192.168.0.15"; Port = 20128; Url = "http://192.168.0.15:20128/v1/models" }
)

foreach ($c in $checks) {
  $up = Test-TcpPort -HostName $c.Host -Port $c.Port
  if ($up) {
    Write-Host (" [GREEN LIGHT] {0,-34} -> {1}" -f $c.Name, $c.Url) -ForegroundColor Green
  } else {
    Write-Host (" [RED LIGHT]   {0,-34} -> {1}" -f $c.Name, $c.Url) -ForegroundColor Red
    $AnyError = $true
  }
}

if ($OpenBrowser) {
  Start-Process "http://192.168.0.8:8392/"
  Start-Process "http://127.0.0.1:9119/chat?profile=default&resume=local-profile"
  Start-Process "http://127.0.0.1:8082/admin"
}

if ($AnyError) { exit 1 } else { exit 0 }
