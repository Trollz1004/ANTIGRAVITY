# ANTIGRAVITY Oracle — continuous respawn loop (T5500)
# Restarts down services with WindowStyle Hidden only. Never opens a browser.
# Never uses cmd.exe. Logs to logs/oracle-respawn.log

$ErrorActionPreference = 'Continue'
$Repo = if (Test-Path 'C:\ANTIGRAVITY') { 'C:\ANTIGRAVITY' } else { Split-Path -Parent (Split-Path -Parent $PSScriptRoot) }
$LogDir = Join-Path $Repo 'logs'
$LogFile = Join-Path $LogDir 'oracle-respawn.log'
$IntervalSec = 60
$MaxLogBytes = 5MB

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log([string]$Msg) {
    if ((Test-Path $LogFile) -and ((Get-Item $LogFile).Length -gt $MaxLogBytes)) {
        Move-Item $LogFile "$LogFile.old" -Force -ErrorAction SilentlyContinue
    }
    Add-Content -Path $LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Msg"
}

function Test-Port([int]$Port) {
    try {
        $c = New-Object System.Net.Sockets.TcpClient
        $ar = $c.BeginConnect([System.Net.IPAddress]::Loopback, $Port, $null, $null)
        $ok = $ar.AsyncWaitHandle.WaitOne(1500, $false)
        $c.Close()
        return $ok
    } catch { return $false }
}

function Start-Hidden([string]$Exe, [object]$ArgList = $null, [string]$Wd = $null) {
    $p = @{ FilePath = $Exe; WindowStyle = 'Hidden' }
    if ($null -ne $ArgList -and @($ArgList).Count -gt 0) { $p.ArgumentList = $ArgList }
    if ($Wd) { $p.WorkingDirectory = $Wd }
    Start-Process @p -ErrorAction SilentlyContinue | Out-Null
}

Log "Oracle respawn loop started (interval ${IntervalSec}s)"

while ($true) {
    if (-not (Test-Port 11435)) {
        Log 'RESTART hermes :11435'
        $hrDir = Join-Path $Repo 'services\hermes-router'
        $venvPy = Join-Path $hrDir '.venv\Scripts\python.exe'
        $routerPy = Join-Path $hrDir 'hermes_router.py'
        if (Test-Path $venvPy) { Start-Hidden $venvPy @($routerPy) $hrDir }
        elseif (Test-Path $routerPy) {
            $py = if (Get-Command py -ErrorAction SilentlyContinue) { 'py' } else { 'python' }
            Start-Hidden $py @('-3', $routerPy) $hrDir
        }
    }

    if (-not (Test-Port 11434)) {
        $ollama = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
        if (Test-Path $ollama) {
            Log 'RESTART ollama :11434'
            Start-Hidden $ollama @('serve')
        }
    }

    if (-not (Test-Port 3130)) {
        $startMc = Join-Path $Repo 'scripts\start-mission-control.ps1'
        if (Test-Path $startMc) {
            Log 'RESTART mission-os :3130'
            Start-Hidden 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $startMc, '-RepoRoot', $Repo, '-Port', '3130') $Repo
        }
    }

    if (-not (Get-Process -Name 'cloudflared' -ErrorAction SilentlyContinue)) {
        $cf = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
        $cfCfg = Join-Path $Repo 'infra\cloudflare\t5500-dateapp.yml'
        if ((Test-Path $cf) -and (Test-Path $cfCfg)) {
            Log 'RESTART cloudflared'
            Start-Hidden $cf @('tunnel', '--config', $cfCfg, 'run')
        }
    }

    if ($env:ANTIGRAVITY_ENABLE_SENTRY -eq '1') {
        $sentryRunning = Get-CimInstance Win32_Process -Filter "Name='pythonw.exe'" -ErrorAction SilentlyContinue |
            Where-Object { $_.CommandLine -like '*watchdog\sentry.py*' }
        if (-not $sentryRunning) {
            $sentryPy = Join-Path $Repo 'scripts\watchdog\sentry.py'
            if (Test-Path $sentryPy) {
                Log 'RESTART sentry pythonw'
                $pythonw = (Get-Command pythonw -ErrorAction SilentlyContinue).Source
                if (-not $pythonw) { $pythonw = 'pythonw.exe' }
                Start-Hidden $pythonw @($sentryPy)
            }
        }
    }

    Start-Sleep -Seconds $IntervalSec
}
