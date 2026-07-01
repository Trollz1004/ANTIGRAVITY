$ErrorActionPreference = 'Continue'
$RepoRoot = 'c:\antigravity'
$LogDir = Join-Path $RepoRoot 'logs'
$PaperclipLog = Join-Path $LogDir 'paperclip.log'
$TunnelLog = Join-Path $LogDir 'paperclip-tunnel.log'
$StartPaperclip = Join-Path $RepoRoot 'scripts\start-paperclip.ps1'
$TunnelConfig = 'C:\Users\joshl\.cloudflared\config.yml'
$Cloudflared = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'

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
Log 'Checking Paperclip local listener on :3100.'
$localStatus = Test-Url 'http://127.0.0.1:3100/api/health'
if (-not $localStatus) { $localStatus = Test-Url 'http://127.0.0.1:3100' }

if ($localStatus) {
    Log "Paperclip already responding locally with HTTP $localStatus."
} else {
    Log 'Starting Paperclip local runtime.'
    Start-Process -FilePath 'powershell.exe' -ArgumentList @(
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $StartPaperclip
    ) -WorkingDirectory $RepoRoot -WindowStyle Minimized | Out-Null

    for ($i = 0; $i -lt 45; $i++) {
        Start-Sleep -Seconds 2
        $localStatus = Test-Url 'http://127.0.0.1:3100/api/health'
        if (-not $localStatus) { $localStatus = Test-Url 'http://127.0.0.1:3100' }
        if ($localStatus) { break }
    }
    if ($localStatus) { Log "Paperclip local runtime is responding with HTTP $localStatus." }
    else { Log 'Paperclip local runtime did not respond before timeout.' }
}
Log 'Checking Paperclip Cloudflare tunnel.'
$existingTunnel = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { [string]$_.CommandLine -like "*$TunnelConfig*" } |
    Select-Object -First 1

if ($existingTunnel) {
    Log "Cloudflared tunnel already running as PID $($existingTunnel.ProcessId)."
} elseif ((Test-Path $Cloudflared) -and (Test-Path $TunnelConfig)) {
    Log 'Starting cloudflared Paperclip tunnel.'
    $command = "& '$Cloudflared' tunnel --config '$TunnelConfig' run *>> '$TunnelLog' 2>&1"
    Start-Process -FilePath 'powershell.exe' -ArgumentList @(
        '-NoProfile', '-WindowStyle', 'Hidden', '-Command', $command
    ) -WorkingDirectory $RepoRoot | Out-Null
    Start-Sleep -Seconds 5
} else {
    Log 'Cloudflared executable or tunnel config is missing.'
}

$publicStatus = Test-Url 'https://paperclip-hq.youandinotai.com/api/health'
if (-not $publicStatus) { $publicStatus = Test-Url 'https://paperclip-hq.youandinotai.com' }
if ($publicStatus) { Log "Paperclip public endpoint responded with HTTP $publicStatus." }
else { Log 'Paperclip public endpoint did not respond.' }
Write-Output '=== WRANGLER ==='
$wrangler = Get-Command wrangler -ErrorAction SilentlyContinue
if ($wrangler) {
    Write-Output "wrangler=$($wrangler.Source)"
    try { & wrangler --version } catch { Write-Output "wrangler version failed: $($_.Exception.Message)" }
} else {
    Write-Output 'wrangler=MISSING'
}

Write-Output '=== FINAL PROCESS STATE ==='
Get-CimInstance Win32_Process |
    Where-Object { $_.CommandLine -match 'paperclip|cloudflared|wrangler' } |
    Select-Object ProcessId, Name, CommandLine |
    Format-List

Write-Output '=== FINAL PORTS ==='
foreach ($port in @(3100, 54329)) {
    Write-Output "PORT $port"
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object LocalAddress, LocalPort, State, OwningProcess |
        Format-Table -AutoSize
}
