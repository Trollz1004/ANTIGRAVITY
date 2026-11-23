# T5500 Always-On Watchdog — canonical 2-node stack (ops/fleet/fleet-map.json)
param(
    [string]$RepoRoot = 'C:\ANTIGRAVITY',
    [string]$NodeLanIp = $(if ($env:NODE_LAN_IP) { $env:NODE_LAN_IP } else { '192.168.0.15' })
)

$ErrorActionPreference = 'Continue'

$LogDir      = Join-Path $RepoRoot 'logs'
$LogFile     = Join-Path $LogDir 't5500-watchdog.log'
$MaxLogBytes = 10MB

$OllamaExe      = Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe'
$CloudflaredExe = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$TunnelConfig   = Join-Path $RepoRoot 'infra\cloudflare\t5500-dateapp.yml'
$ClaudeExe      = Join-Path $env:USERPROFILE '.local\bin\claude.exe'
$OpenCodeExe    = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\SST.opencode_Microsoft.Winget.Source_8wekyb3d8bbwe\opencode.exe'
$MissionPort    = 3130
$OllamaPort     = 11434
$CheckInterval  = 30

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

function Test-NodePort($port) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async  = $client.BeginConnect([System.Net.IPAddress]::Loopback, $port, $null, $null)
        $ok     = $async.AsyncWaitHandle.WaitOne(2000, $false)
        $client.Close()
        return $ok
    } catch {
        return $false
    }
}

function Ensure-Ollama {
    if (Test-NodePort $OllamaPort) { return }
    if (-not (Test-Path $OllamaExe)) { return }
    Log 'Ollama DOWN — starting serve...'
    Start-Process -FilePath $OllamaExe -ArgumentList 'serve' -WindowStyle Hidden -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 10
    if (Test-NodePort $OllamaPort) {
        Log 'Ollama UP after restart.'
    } else {
        Log 'Ollama still DOWN after restart attempt.'
    }
}

function Ensure-MissionOS {
    if (Test-NodePort $MissionPort) { return }
    $startScript = Join-Path $RepoRoot 'scripts\start-mission-control.ps1'
    if (-not (Test-Path $startScript)) {
        Log "Mission OS start script missing: $startScript"
        return
    }
    Log 'Mission OS DOWN — starting...'
    Start-Process -FilePath 'powershell.exe' `
        -ArgumentList '-NonInteractive', '-WindowStyle', 'Hidden', '-ExecutionPolicy', 'Bypass', '-File', $startScript, '-RepoRoot', $RepoRoot, '-Port', "$MissionPort" `
        -WindowStyle Hidden -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 15
    if (Test-NodePort $MissionPort) {
        Log "Mission OS UP on http://${NodeLanIp}:$MissionPort."
    } else {
        Log 'Mission OS still DOWN after restart attempt.'
    }
}

function Ensure-Cloudflared {
    $proc = Get-Process -Name 'cloudflared' -ErrorAction SilentlyContinue
    if ($null -ne $proc) { return }
    if (-not (Test-Path $CloudflaredExe) -or -not (Test-Path $TunnelConfig)) { return }
    Log 'Cloudflared DOWN — starting tunnel...'
    Start-Process -FilePath $CloudflaredExe `
        -ArgumentList "tunnel --config `"$TunnelConfig`" run" `
        -WindowStyle Hidden -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 5
    Log 'Cloudflared start command issued.'
}

function Ensure-ClaudeCLI {
    if ($env:ANTIGRAVITY_FULL_AUTOSTART -ne '1') { return }
    if (-not (Test-Path $ClaudeExe)) { return }
    $proc = Get-Process -Name 'claude' -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*\.local\bin*' }
    if ($null -ne $proc) { return }
    Log "Claude CLI not running — launching headless in $RepoRoot..."
    Start-Process -FilePath $ClaudeExe `
        -ArgumentList '--dangerously-skip-permissions', '--cwd', $RepoRoot `
        -WindowStyle Hidden -ErrorAction SilentlyContinue
    Log 'Claude CLI start command issued.'
}

function Ensure-OpenCodeCLI {
    if ($env:ANTIGRAVITY_FULL_AUTOSTART -ne '1') { return }
    if (-not (Test-Path $OpenCodeExe)) { return }
    $proc = Get-Process -Name 'opencode' -ErrorAction SilentlyContinue
    if ($null -ne $proc) { return }
    Log "OpenCode CLI not running — launching headless in $RepoRoot..."
    Start-Process -FilePath $OpenCodeExe `
        -ArgumentList '--workdir', $RepoRoot `
        -WindowStyle Hidden -ErrorAction SilentlyContinue
    Log 'OpenCode CLI start command issued.'
}

function Open-DashboardBrowser {
    if ($env:ANTIGRAVITY_FULL_AUTOSTART -ne '1') { return }
    $chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
    $urls = @("http://${NodeLanIp}:$MissionPort", 'https://youandinotai.com')
    if (Test-Path $chrome) {
        Start-Process -FilePath $chrome -ArgumentList $urls -ErrorAction SilentlyContinue
    } else {
        foreach ($url in $urls) { Start-Process $url -ErrorAction SilentlyContinue }
    }
    Log 'Dashboard browser tabs opened.'
}

$bootFile = Join-Path $LogDir 'watchdog-boot-marker.txt'
if (-not (Test-Path $bootFile) -or (Get-Content $bootFile -ErrorAction SilentlyContinue) -ne (Get-Date -Format 'yyyy-MM-dd')) {
    Set-Content -Path $bootFile -Value (Get-Date -Format 'yyyy-MM-dd') -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 5
    Open-DashboardBrowser
}

Log '====== T5500 Always-On Watchdog Started ======'
Log "Ollama:$OllamaPort | MissionOS:$MissionPort | Cloudflared | Claude CLI | OpenCode CLI | Interval:${CheckInterval}s"

while ($true) {
    Rotate-Log
    Ensure-Ollama
    Ensure-MissionOS
    Ensure-Cloudflared
    Ensure-ClaudeCLI
    Ensure-OpenCodeCLI
    Start-Sleep -Seconds $CheckInterval
}
