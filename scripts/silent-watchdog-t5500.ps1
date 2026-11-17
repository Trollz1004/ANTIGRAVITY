# Silent Watchdog for T5500 - ZERO popups, ZERO terminal windows
# Runs as scheduled task with -WindowStyle Hidden
# Background monitoring of Mission OS :3130, OmniRoute :20128, Date App :3200/:8000, Hermes :8643/:9119 (ops/fleet/fleet-map.json)

#Requires -Version 5.1
#Requires -RunAsAdministrator

param(
    [string]$RepoRoot = "C:\ANTIGRAVITY",
    [string]$NodeLanIp = $(if ($env:NODE_LAN_IP) { $env:NODE_LAN_IP } else { "192.168.0.15" }),
    [int]$CHECK_INTERVAL = 30,  # seconds between health checks
    [int]$FAILURE_THRESHOLD = 3  # failures before restart
)

# CRITICAL: Suppress all output, no popups, no console
$ErrorActionPreference = 'SilentlyContinue'
$ProgressPreference = 'SilentlyContinue'
$WarningPreference = 'SilentlyContinue'
$InformationPreference = 'SilentlyContinue'

# Ensure log directory exists
$logDir = "$RepoRoot\logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

$logFile = "$logDir\watchdog-silent-$(Get-Date -Format 'yyyyMMdd').log"

function Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $logFile -Value "[$timestamp] $Message" -Force
}

function Test-Port {
    param([int]$Port, [string]$Service)
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect($NodeLanIp, $Port)
        $tcp.Close()
        return $true
    } catch {
        return $false
    }
}

function Start-MissionOS {
    Log "Attempting to start Mission OS on :3130..."
    try {
        $proc = Get-NetTCPConnection -LocalPort 3130 -ErrorAction SilentlyContinue
        if ($proc) {
            Get-Process -Id $proc.OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }

        $startScript = "$RepoRoot\scripts\start-mission-control.ps1"
        if (-not (Test-Path $startScript)) { Log "ERROR: start-mission-control.ps1 not found"; return $false }

        $proc = Start-Process -FilePath "powershell.exe" `
            -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$startScript`" -RepoRoot `"$RepoRoot`" -Port 3130" `
            -WindowStyle Hidden `
            -PassThru `
            -ErrorAction SilentlyContinue

        if ($proc) {
            Log "Mission OS started (PID: $($proc.Id))"
            Start-Sleep -Seconds 3
            if (Test-Port 3130 "Mission OS") {
                Log "Mission OS ONLINE on $NodeLanIp:3130"
                return $true
            }
        }
    } catch {
        Log "ERROR starting Mission OS: $_"
    }
    return $false
}

function Start-OmniRoute {
    Log "Attempting to start OmniRoute on :20128..."
    try {
        $proc = Get-NetTCPConnection -LocalPort 20128 -ErrorAction SilentlyContinue
        if ($proc) {
            Get-Process -Id $proc.OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }

        $dockerProc = Start-Process -FilePath "docker" -ArgumentList "restart omni-router" `
            -WindowStyle Hidden `
            -PassThru `
            -ErrorAction SilentlyContinue

        if ($dockerProc) {
            Start-Sleep -Seconds 5
            if (Test-Port 20128 "OmniRoute") {
                Log "OmniRoute ONLINE on $NodeLanIp:20128 (via Docker)"
                return $true
            }
        }

        Log "Docker OmniRoute restart failed or port not responding"
    } catch {
        Log "ERROR starting OmniRoute: $_"
    }
    return $false
}

# ============================================================================
# MAIN WATCHDOG LOOP - Pure background, no console, no output
# ============================================================================

Log "=== T5500 Silent Watchdog Started ($NodeLanIp) ==="

$serviceStates = @{
    "OmniRoute"        = @{Port=20128; Failures=0; LastCheck=$null; Restart=$true;  Service="omni-router"}
    "Mission OS"       = @{Port=3130;  Failures=0; LastCheck=$null; Restart=$true;  Service="mission-os"}
    "DateApp"          = @{Port=3200;  Failures=0; LastCheck=$null; Restart=$false; Service="dateapp-frontend"}
    "DateApp Backend"  = @{Port=8000;  Failures=0; LastCheck=$null; Restart=$false; Service="dateapp-backend"}
    "Hermes API"       = @{Port=8643;  Failures=0; LastCheck=$null; Restart=$false; Service="hermes-api"}
    "Hermes Dashboard" = @{Port=9119;  Failures=0; LastCheck=$null; Restart=$false; Service="hermes"}
    "Ollama"           = @{Port=11434; Failures=0; LastCheck=$null; Restart=$false; Service="ollama"}
}

$startTime = Get-Date
$maxDuration = 8 * 3600  # 8 hours

while ((Get-Date).Subtract($startTime).TotalSeconds -lt $maxDuration) {
    foreach ($service in $serviceStates.Keys) {
        $state = $serviceStates[$service]
        $port = $state.Port

        if (Test-Port $port $service) {
            $state.Failures = 0
            if (-not $state.LastCheck -or $state.LastCheck -ne "OK") {
                Log "$service ($NodeLanIp`:$port) is ONLINE"
                $state.LastCheck = "OK"
            }
        } else {
            $state.Failures++
            $state.LastCheck = "DOWN"
            Log "$service ($NodeLanIp`:$port) OFFLINE - Failure count: $($state.Failures)/$FAILURE_THRESHOLD"

            if ($state.Failures -ge $FAILURE_THRESHOLD -and $state.Restart) {
                Log "$($service) threshold reached, attempting restart"
                switch ($service) {
                    "Mission OS" { Start-MissionOS | Out-Null }
                    "OmniRoute"  { Start-OmniRoute | Out-Null }
                    default      { Log "No restart logic for $service — monitoring only" }
                }
                $state.Failures = 0
            }
        }
    }

    Start-Sleep -Seconds $CHECK_INTERVAL
}

Log "=== Watchdog session ended (8-hour timeout) ==="
