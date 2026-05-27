$ErrorActionPreference = 'Continue'

$LogDir     = 'C:\ANTIGRAVITY\logs'
$LogFile    = "$LogDir\sabretooth-watchdog.log"
$MaxLogBytes = 10MB

$OllamaExe        = 'C:\Users\joshl\AppData\Local\Programs\Ollama\ollama.exe'
$PaperclipExe     = 'C:\Users\joshl\AppData\Roaming\npm\paperclipai.cmd'
$CloudflaredExe   = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$TunnelConfig     = 'C:\ANTIGRAVITY\infra\cloudflare\paperclip-hq.yml'
$ClaudeExe        = 'C:\Users\joshl\.local\bin\claude.exe'
$OpenCodeExe      = 'C:\Users\joshl\AppData\Local\Microsoft\WinGet\Packages\SST.opencode_Microsoft.Winget.Source_8wekyb3d8bbwe\opencode.exe'
$PythonExe        = 'C:\Windows\py.exe'
$OpusHasHandsDir  = 'C:\Antigravity\_handoff-staging-2026-05-26\_deploy\opushashands'
$PaperclipPort    = 3100
$OllamaPort       = 11434
$OpusHasHandsPort = 4200
$CheckInterval    = 30

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
}

function Rotate-Log {
    if ((Test-Path $LogFile) -and (Get-Item $LogFile).Length -gt $MaxLogBytes) {
        Move-Item $LogFile "$LogFile.1" -Force -ErrorAction SilentlyContinue
    }
}

function Test-LocalPort($port) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async  = $client.BeginConnect('127.0.0.1', $port, $null, $null)
        $ok     = $async.AsyncWaitHandle.WaitOne(2000, $false)
        $client.Close()
        return $ok
    } catch {
        return $false
    }
}

function Ensure-Ollama {
    if (Test-LocalPort $OllamaPort) { return }
    Log 'Ollama DOWN — starting serve...'
    Start-Process -FilePath $OllamaExe -ArgumentList 'serve' -WindowStyle Hidden -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 10
    if (Test-LocalPort $OllamaPort) {
        Log 'Ollama UP after restart.'
    } else {
        Log 'Ollama still DOWN after restart attempt.'
    }
}

function Ensure-Paperclip {
    if (Test-LocalPort $PaperclipPort) { return }
    Log 'Paperclip DOWN — starting...'
    Start-Process -FilePath 'powershell.exe' `
        -ArgumentList '-NonInteractive', '-WindowStyle', 'Hidden', '-ExecutionPolicy', 'Bypass', '-File', 'C:\ANTIGRAVITY\scripts\start-paperclip.ps1' `
        -WindowStyle Hidden -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 15
    if (Test-LocalPort $PaperclipPort) {
        Log 'Paperclip UP after restart.'
    } else {
        Log 'Paperclip still DOWN after restart attempt.'
    }
}

function Ensure-Cloudflared {
    $proc = Get-Process -Name 'cloudflared' -ErrorAction SilentlyContinue
    if ($null -ne $proc) { return }
    Log 'Cloudflared DOWN — starting tunnel...'
    Start-Process -FilePath $CloudflaredExe `
        -ArgumentList "tunnel --config `"$TunnelConfig`" run" `
        -WindowStyle Hidden -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 5
    Log 'Cloudflared start command issued.'
}

function Ensure-ClaudeCLI {
    $proc = Get-Process -Name 'claude' -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*\.local\bin*' }
    if ($null -ne $proc) { return }
    Log 'Claude CLI not running — launching headless in C:\ANTIGRAVITY...'
    Start-Process -FilePath $ClaudeExe `
        -ArgumentList '--dangerously-skip-permissions', '--cwd', 'C:\ANTIGRAVITY' `
        -WindowStyle Hidden -ErrorAction SilentlyContinue
    Log 'Claude CLI start command issued.'
}

function Ensure-OpenCodeCLI {
    $proc = Get-Process -Name 'opencode' -ErrorAction SilentlyContinue
    if ($null -ne $proc) { return }
    Log 'OpenCode CLI not running — launching headless in C:\ANTIGRAVITY...'
    Start-Process -FilePath $OpenCodeExe `
        -ArgumentList '--workdir', 'C:\ANTIGRAVITY' `
        -WindowStyle Hidden -ErrorAction SilentlyContinue
    Log 'OpenCode CLI start command issued.'
}

function Ensure-OpusHasHands {
    # Serves OpusHasHands hub on 127.0.0.1:4200.
    # Cloudflare tunnel ingress (paperclip-antigravity, c7bc9665-...) routes
    # opushashands.youandinotai.com -> http://127.0.0.1:4200.
    if (Test-LocalPort $OpusHasHandsPort) { return }
    Log 'OpusHasHands DOWN — starting python http.server on 4200...'
    if (-not (Test-Path $OpusHasHandsDir)) {
        Log "OpusHasHands dir missing: $OpusHasHandsDir — cannot start."
        return
    }
    Start-Process -FilePath $PythonExe `
        -ArgumentList '-m', 'http.server', $OpusHasHandsPort, '--bind', '127.0.0.1' `
        -WorkingDirectory $OpusHasHandsDir `
        -RedirectStandardOutput "$LogDir\opushashands-server.log" `
        -RedirectStandardError "$LogDir\opushashands-server.log.err" `
        -WindowStyle Hidden -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    if (Test-LocalPort $OpusHasHandsPort) {
        Log 'OpusHasHands UP — opushashands.youandinotai.com now live.'
    } else {
        Log 'OpusHasHands still DOWN after restart attempt.'
    }
}

function Open-DashboardBrowser {
    $chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
    $urls = @('http://localhost:3100', 'https://paperclip-hq.youandinotai.com')
    if (Test-Path $chrome) {
        Start-Process -FilePath $chrome -ArgumentList $urls -ErrorAction SilentlyContinue
    } else {
        foreach ($url in $urls) { Start-Process $url -ErrorAction SilentlyContinue }
    }
    Log 'Dashboard browser tabs opened.'
}

$bootFile = "$LogDir\watchdog-boot-marker.txt"
if (-not (Test-Path $bootFile) -or (Get-Content $bootFile -ErrorAction SilentlyContinue) -ne (Get-Date -Format 'yyyy-MM-dd')) {
    Set-Content -Path $bootFile -Value (Get-Date -Format 'yyyy-MM-dd') -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 5
    Open-DashboardBrowser
}

Log '====== Sabretooth Always-On Watchdog Started ======'
Log "Ollama:$OllamaPort | Paperclip:$PaperclipPort | OpusHasHands:$OpusHasHandsPort | Cloudflared | Claude CLI | OpenCode CLI | Interval:${CheckInterval}s"

while ($true) {
    Rotate-Log
    Ensure-Ollama
    Ensure-Paperclip
    Ensure-OpusHasHands
    Ensure-Cloudflared
    Ensure-ClaudeCLI
    Ensure-OpenCodeCLI
    Start-Sleep -Seconds $CheckInterval
}