# Paperclip Watchdog for Sabretooth
# Monitors critical ANTIGRAVITY services and restarts them on failure.
# Monitored ports:
#   - 8082  FCC (free-claude-code proxy)
#   - 3000  Hermes Workspace dev server
#   - 9119  Hermes Agent dashboard
#   - 3110  Paperclip HQ (optional)
#
# Persistence: this script is started automatically via the Startup folder shortcut
#             at %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\PaperclipWatchdog.lnk.
#             For boot-level persistence without login, register as a scheduled task using
#             scripts\register-paperclip-watchdog-task.ps1 (requires Administrator).
#
# Log: E:\ANTIGRAVITY\logs\paperclip-watchdog.log

$ErrorActionPreference = 'Continue'

$LogDir      = 'E:\ANTIGRAVITY\logs'
$LogFile     = Join-Path $LogDir 'paperclip-watchdog.log'
$MaxLogBytes = 10MB
$CheckIntervalSeconds = 30

# Service definitions.
$Services = @(
    [PSCustomObject]@{
        Port         = 8082
        Name         = 'FCC'
        StartScript  = 'E:\ANTIGRAVITY\scripts\fcc-server-start.sh'
        Launcher     = 'wsl'
        Distro       = 'Ubuntu-24.04'
    },
    [PSCustomObject]@{
        Port         = 3000
        Name         = 'HermesWorkspace'
        StartScript  = 'E:\ANTIGRAVITY\scripts\start-hermes-workspace-windows.ps1'
        Launcher     = 'powershell'
    },
    [PSCustomObject]@{
        Port         = 9119
        Name         = 'HermesDashboard'
        StartScript  = 'E:\ANTIGRAVITY\scripts\hermes-dashboard-start.cmd'
        Launcher     = 'cmd'
    },
    [PSCustomObject]@{
        Port         = 3110
        Name         = 'PaperclipHQ'
        StartScript  = 'E:\ANTIGRAVITY\scripts\start-paperclip.ps1'
        Launcher     = 'powershell'
        Optional     = $true
    }
)

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
}

function Rotate-Log {
    if ((Test-Path $LogFile) -and ((Get-Item $LogFile).Length -gt $MaxLogBytes)) {
        Move-Item -Path $LogFile -Destination "$LogFile.1" -Force -ErrorAction SilentlyContinue
    }
}

function Test-LocalPort($port) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async = $client.BeginConnect('127.0.0.1', $port, $null, $null)
        $ok = $async.AsyncWaitHandle.WaitOne(2000, $false)
        $client.Close()
        return $ok
    } catch {
        return $false
    }
}

function Start-ServiceProcess($svc) {
    $name = $svc.Name
    Log "$name DOWN - issuing start/repair command."

    try {
        if ($svc.Launcher -eq 'wsl') {
            if (-not $svc.StartScript -or (-not (Test-Path $svc.StartScript))) {
                Log "ERROR: missing WSL start script: $($svc.StartScript)"
                return
            }
            $wslPath = "/mnt/c" + ($svc.StartScript.Substring(2) -replace '\\', '/')
            $cmd = "exec $wslPath"
            Start-Process -FilePath 'wsl.exe' -ArgumentList @('-d', $svc.Distro, '--', 'bash', '-lc', $cmd) -WindowStyle Hidden -ErrorAction SilentlyContinue | Out-Null
        } elseif ($svc.Launcher -eq 'powershell') {
            if ($svc.StartScript -and (-not (Test-Path $svc.StartScript))) {
                Log "ERROR: missing start script: $($svc.StartScript)"
                return
            }
            $argList = @('-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden')
            if ($svc.StartScript) {
                $argList += @('-File', $svc.StartScript)
            } else {
                $argList += $svc.Args
            }
            Start-Process -FilePath 'powershell.exe' -ArgumentList $argList -WindowStyle Hidden -ErrorAction SilentlyContinue | Out-Null
        } elseif ($svc.Launcher -eq 'cmd') {
            if ($svc.StartScript -and (-not (Test-Path $svc.StartScript))) {
                Log "ERROR: missing start script: $($svc.StartScript)"
                return
            }
            Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', 'start', '/min', $svc.StartScript) -WindowStyle Hidden -ErrorAction SilentlyContinue | Out-Null
        } else {
            Log "ERROR: unknown launcher '$($svc.Launcher)' for $name"
            return
        }
        Log "$name start command issued."
    } catch {
        Log "ERROR starting ${name}: $($_.Exception.Message)"
    }
}

Log '====== Paperclip Watchdog Started ======'
$required = ($Services | Where-Object { -not $_.Optional } | ForEach-Object { "$($_.Name):$($_.Port)" }) -join ', '
Log "Monitoring required ports: $required | Optional: PaperclipHQ:3110 | Interval: ${CheckIntervalSeconds}s"

while ($true) {
    Rotate-Log

    $missing = @()
    foreach ($svc in $Services) {
        if (Test-LocalPort $svc.Port) { continue }
        $missing += "$($svc.Name):$($svc.Port)"
    }

    if ($missing.Count -gt 0) {
        Log "Missing ports: $($missing -join ', ')"
        foreach ($svc in $Services) {
            if (-not (Test-LocalPort $svc.Port)) {
                Start-ServiceProcess $svc
            }
        }
        # Give services a chance to bind before the next check.
        Start-Sleep -Seconds 20
    }

    Start-Sleep -Seconds $CheckIntervalSeconds
}
