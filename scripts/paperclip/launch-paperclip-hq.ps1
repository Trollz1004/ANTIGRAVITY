$ErrorActionPreference = 'Continue'
$RepoRoot = 'c:\antigravity'
$LogDir = Join-Path $RepoRoot 'logs'
$PaperclipLog = Join-Path $LogDir 'paperclip.log'
$StartPaperclip = Join-Path $RepoRoot 'scripts\start-paperclip.ps1'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($Message) {
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    Write-Output $line
    Add-Content -Path (Join-Path $LogDir 'paperclip-launch.log') -Value $line
}

function Test-Url($Url) {
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        return $response.StatusCode
    } catch {
        return $null
    }
}

# This launcher is meant to be run non-elevated. The called start-paperclip.ps1
# will refuse to run if it detects an admin token, because Paperclip's embedded
# PostgreSQL rejects administrative Windows accounts.
Log 'Checking Paperclip local listener on :3110.'
$localStatus = Test-Url 'http://127.0.0.1:3110/api/health'
if (-not $localStatus) { $localStatus = Test-Url 'http://127.0.0.1:3110' }

if ($localStatus) {
    Log "Paperclip already responding locally with HTTP $localStatus."
} else {
    Log 'Starting Paperclip local runtime.'
    Start-Process -FilePath 'powershell.exe' -ArgumentList @(
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $StartPaperclip
    ) -WorkingDirectory $RepoRoot -WindowStyle Minimized | Out-Null

    for ($i = 0; $i -lt 45; $i++) {
        Start-Sleep -Seconds 2
        $localStatus = Test-Url 'http://127.0.0.1:3110/api/health'
        if (-not $localStatus) { $localStatus = Test-Url 'http://127.0.0.1:3110' }
        if ($localStatus) { break }
    }
    if ($localStatus) { Log "Paperclip local runtime is responding with HTTP $localStatus." }
    else { Log 'Paperclip local runtime did not respond before timeout.' }
}

# Public URL exposure is handled by Port Warp (or optionally Cloudflare tunnel).
# This launcher only ensures the local :3110 listener is up.
Log 'Local Paperclip HQ launch complete. Expose via Port Warp if public URL is needed.'

Write-Output '=== FINAL PROCESS STATE ==='
Get-CimInstance Win32_Process |
    Where-Object { $_.CommandLine -match 'paperclip|cloudflared|portwarp' } |
    Select-Object ProcessId, Name, CommandLine |
    Format-List

Write-Output '=== FINAL PORTS ==='
foreach ($port in @(3110, 54329)) {
    Write-Output "PORT $port"
    netstat -ano | findstr ":$port " | findstr LISTENING | ForEach-Object { Write-Output $_ }
}
