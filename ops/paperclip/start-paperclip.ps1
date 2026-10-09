# Paperclip (Mission Control) launcher — fixed port, never drifts (2026-10-09).
#
# Paperclip uses detect-port: if its port is taken it silently moves to the next free
# one (3100 -> 3101 -> ...), which broke every script that expected a fixed address.
# This launcher makes the port deterministic:
#   1. If Paperclip already answers on $Port, do nothing.
#   2. Stop any Paperclip copy running on a drifted port.
#   3. Stop whatever else is squatting on $Port.
#   4. Start Paperclip with PORT=$Port, then confirm it really listens on $Port.
#      If it drifted anyway, stop it and report failure (the keepalive retries).
#
# Runs from the non-elevated scheduled task "ANTIGRAVITY Paperclip" with -Foreground (the task
# owns the process; Paperclip's embedded Postgres refuses to run elevated, and the keepalive is
# elevated). The keepalive only starts that task when :3917 does not answer.
# Manual one-off:  powershell -ExecutionPolicy Bypass -File ops\paperclip\start-paperclip.ps1
param([int]$Port = 3917, [switch]$Foreground)

$ErrorActionPreference = 'Continue'
$Repo    = 'C:\ANTIGRAVITY'
$LogFile = Join-Path $Repo 'logs\paperclip.log'
$Exe     = Join-Path $env:APPDATA 'npm\paperclipai.cmd'
if (-not (Test-Path $Exe)) { $Exe = 'C:\Users\joshi\AppData\Roaming\npm\paperclipai.cmd' }

function Log([string]$m) {
    $line = '[{0}] [paperclip-launcher] {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m
    try { Add-Content -Path (Join-Path $Repo 'logs\t5500-keepalive.log') -Value $line } catch {}
    Write-Output $line
}

function Test-Paperclip([int]$p) {
    try {
        $r = Invoke-WebRequest -Uri ("http://127.0.0.1:{0}/api/health" -f $p) -UseBasicParsing -TimeoutSec 6
        return ($r.StatusCode -eq 200 -and $r.Content -match '"status"\s*:\s*"ok"')
    } catch { return $false }
}

function Get-PaperclipProcs {
    @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -and $_.CommandLine -match 'paperclipai' -and $_.CommandLine -notmatch 'start-paperclip\.ps1' })
}

if (Test-Paperclip $Port) { Log "already UP on :$Port"; exit 0 }

if (-not (Test-Path $Exe)) { Log "paperclipai not installed ($Exe) - run: npm i -g paperclipai"; exit 2 }

# 2. Drifted or hung copies.
foreach ($p in Get-PaperclipProcs) {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    Log ("stopped stale Paperclip PID {0}" -f $p.ProcessId)
}

# 3. Squatter on the fixed port.
Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    $name = (Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    Log ("stopped {0} (PID {1}) squatting on :{2}" -f $name, $_.OwningProcess, $Port)
}
Start-Sleep -Seconds 2

# 4. Start pinned.
$env:PORT = "$Port"
$env:PAPERCLIP_OPEN_ON_LISTEN = 'false'
$cmd = '""{0}" run >> "{1}" 2>&1"' -f $Exe, $LogFile
if ($Foreground) {
    Log "starting Paperclip on :$Port (foreground, task-owned)"
    & cmd.exe /c $cmd
    Log ("Paperclip process exited (code {0})" -f $LASTEXITCODE)
    exit 1
}
Start-Process -FilePath cmd.exe -ArgumentList @('/c', $cmd) -WorkingDirectory $Repo -WindowStyle Hidden
Log "starting Paperclip on :$Port"

$deadline = (Get-Date).AddSeconds(150)
while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 4
    if (Test-Paperclip $Port) { Log "UP on :$Port"; exit 0 }
}

# Did it drift? Find any Paperclip listener on another port and stop it.
foreach ($p in Get-PaperclipProcs) {
    $ports = @(Get-NetTCPConnection -OwningProcess $p.ProcessId -State Listen -ErrorAction SilentlyContinue | ForEach-Object LocalPort)
    if ($ports.Count) { Log ("Paperclip came up on :{0} instead of :{1} - stopping it" -f ($ports -join ','), $Port) }
}
Log "did not come up on :$Port within 150 s (see logs\paperclip.log)"
exit 1
