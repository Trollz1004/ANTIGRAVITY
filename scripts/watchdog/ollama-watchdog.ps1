# Ollama watchdog for T5500.
# Keeps :11434 up without opening a window.

$ErrorActionPreference = 'Continue'

$Repo = 'c:\antigravity'
$LogDir = Join-Path $Repo 'logs'
$LogFile = Join-Path $LogDir 'ollama-watchdog.log'
$OllamaExe = Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe'
$Port = 11434
$CheckIntervalSec = 30
$MaxLogBytes = 5MB

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log([string]$Msg) {
    if ((Test-Path $LogFile) -and ((Get-Item $LogFile).Length -gt $MaxLogBytes)) {
        Move-Item $LogFile "$LogFile.old" -Force -ErrorAction SilentlyContinue
    }
    Add-Content -Path $LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Msg"
}

function Test-Port([int]$ListenPort) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async = $client.BeginConnect('127.0.0.1', $ListenPort, $null, $null)
        $ok = $async.AsyncWaitHandle.WaitOne(1500, $false)
        $client.Close()
        return $ok
    } catch {
        return $false
    }
}

function Start-Ollama {
    if (-not (Test-Path $OllamaExe)) {
        Log "ollama.exe missing at $OllamaExe"
        return
    }

    Log 'Ollama DOWN - starting serve...'
    Start-Process -FilePath $OllamaExe -ArgumentList 'serve' -WindowStyle Hidden -ErrorAction SilentlyContinue
    Log 'Ollama start command issued.'
}

Log "Ollama watchdog started (port $Port, interval ${CheckIntervalSec}s)."

while ($true) {
    if (-not (Test-Port $Port)) {
        Start-Ollama
        Start-Sleep -Seconds 10
    }

    Start-Sleep -Seconds $CheckIntervalSec
}
