# Mission stack autostart — runs on Windows login.
# Idempotent: safe to re-run. Each block checks before launching.
# Triggers:
#   Docker Desktop (if installed)
#   Hermes Router (WSL service on :11435)
#   Paperclip Watchdog (paperclip :3100 + cloudflared)
#   Claude Code in Windows Terminal at c:\Antigravity, ready to /resume

$ErrorActionPreference = 'Continue'

$Repo   = 'C:\Antigravity'
$LogDir = "$Repo\logs"
$Log    = "$LogDir\autostart-$(Get-Date -Format 'yyyy-MM-dd').log"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($msg) {
    $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
    Add-Content -Path $Log -Value $line -ErrorAction SilentlyContinue
    Write-Host $line
}

Log '=== mission stack autostart ==='

# ---------- 1. Docker Desktop ----------
$dockerExe = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
if (Test-Path $dockerExe) {
    if (-not (Get-Process 'Docker Desktop' -ErrorAction SilentlyContinue)) {
        Log 'starting Docker Desktop'
        Start-Process $dockerExe -WindowStyle Hidden -ErrorAction SilentlyContinue
    } else {
        Log 'Docker Desktop already running'
    }
} else {
    Log 'Docker Desktop not installed — skipping (Docker.DockerCLI is client-only)'
}

# ---------- 2. Hermes Router (WSL service on :11435) ----------
$hermesPid = $null
try { $hermesPid = (wsl -d Ubuntu -- pgrep -f hermes_router.py 2>$null | Select-Object -First 1) } catch {}
if ([string]::IsNullOrWhiteSpace($hermesPid)) {
    Log 'starting Hermes Router (WSL background)'
    Start-Process wsl -ArgumentList '-d','Ubuntu','--','bash','-lc',
        'nohup bash /mnt/c/Antigravity/scripts/start-hermes-router.sh > /tmp/hermes-router.log 2>&1 & disown' `
        -WindowStyle Hidden -ErrorAction SilentlyContinue
} else {
    Log "Hermes Router already running (PID $hermesPid)"
}

# ---------- 3a. Hermes Router Watchdog (Hermes :11435) ----------
$hermesWatchdogScript = "$Repo\scripts\hermes-watchdog.ps1"
$hermesWatchdogRunning = $false
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'hermes-watchdog\.ps1' } |
    ForEach-Object { $hermesWatchdogRunning = $true }
if (-not $hermesWatchdogRunning) {
    Log 'starting Hermes Router watchdog (hidden)'
    Start-Process -FilePath 'powershell.exe' `
        -ArgumentList '-NonInteractive','-WindowStyle','Hidden','-ExecutionPolicy','Bypass','-File',$hermesWatchdogScript `
        -WindowStyle Hidden -ErrorAction SilentlyContinue
} else {
    Log 'Hermes Router watchdog already running'
}

# ---------- 3b. Paperclip Watchdog (handles paperclip + cloudflared forever) ----------
$watchdogScript = "$Repo\scripts\paperclip-watchdog.ps1"
$watchdogRunning = $false
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'paperclip-watchdog\.ps1' } |
    ForEach-Object { $watchdogRunning = $true }
if (-not $watchdogRunning) {
    Log 'starting Paperclip watchdog (hidden)'
    Start-Process -FilePath 'powershell.exe' `
        -ArgumentList '-NonInteractive','-WindowStyle','Hidden','-ExecutionPolicy','Bypass','-File',$watchdogScript `
        -WindowStyle Hidden -ErrorAction SilentlyContinue
} else {
    Log 'Paperclip watchdog already running'
}

# ---------- 4. Claude Code (Opus CLI) in Windows Terminal ----------
# Opens in lowercase c:\Antigravity to match the existing session cwd casing
# so `--resume` shows the right session list. See memory:
# reference_claude_code_session_resume_gotcha.md
Log 'opening Claude Code (claude --resume) in Windows Terminal at c:\Antigravity'
Start-Process wt -ArgumentList @(
    '-d','c:\Antigravity',
    'powershell.exe','-NoExit','-Command','claude --resume'
) -ErrorAction SilentlyContinue

Log '=== autostart complete ==='
