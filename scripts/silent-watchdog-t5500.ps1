# Silent Watchdog for T5500 - ZERO popups, ZERO terminal windows
# Runs as scheduled task with -WindowStyle Hidden
# Pure background monitoring of Mission Control :3151, OmniRoute :20128, Date App :3200

#Requires -Version 5.1
#Requires -RunAsAdministrator

param(
    [string]$RepoRoot = "F:\ANTIGRAVITY",
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
        $tcp.Connect("127.0.0.1", $Port)
        $tcp.Close()
        return $true
    } catch {
        return $false
    }
}

function Start-MissionControl {
    Log "Attempting to start Mission Control on :3151..."
    try {
        # Kill any existing process on :3151
        $proc = Get-NetTCPConnection -LocalPort 3151 -ErrorAction SilentlyContinue
        if ($proc) {
            Get-Process -Id $proc.OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
        
        # Start Mission Control via Python - NO WINDOW
        $pythonPath = (Get-Command python -ErrorAction SilentlyContinue).Source
        if (-not $pythonPath) { Log "ERROR: Python not found"; return }
        
        $backendPath = "$RepoRoot\backend"
        $proc = Start-Process -FilePath $pythonPath -ArgumentList "-m uvicorn server:app --host 127.0.0.1 --port 3151 --log-level error" `
            -WorkingDirectory $backendPath `
            -WindowStyle Hidden `
            -PassThru `
            -ErrorAction SilentlyContinue
        
        if ($proc) {
            Log "Mission Control started (PID: $($proc.Id))"
            Start-Sleep -Seconds 3
            if (Test-Port 3151 "Mission Control") {
                Log "✓ Mission Control ONLINE on :3151"
                return $true
            }
        }
    } catch {
        Log "ERROR starting Mission Control: $_"
    }
    return $false
}

function Start-OmniRoute {
    Log "Attempting to start OmniRoute on :20128..."
    try {
        # Kill existing process
        $proc = Get-NetTCPConnection -LocalPort 20128 -ErrorAction SilentlyContinue
        if ($proc) {
            Get-Process -Id $proc.OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
        
        # Try Docker restart first
        $dockerProc = Start-Process -FilePath "docker" -ArgumentList "restart omni-router" `
            -WindowStyle Hidden `
            -PassThru `
            -ErrorAction SilentlyContinue
        
        if ($dockerProc) {
            Start-Sleep -Seconds 5
            if (Test-Port 20128 "OmniRoute") {
                Log "✓ OmniRoute ONLINE on :20128 (via Docker)"
                return $true
            }
        }
        
        Log "Docker OmniRoute restart failed or port not responding, trying manual startup"
        # Fallback: npm run omniroute:start if needed
    } catch {
        Log "ERROR starting OmniRoute: $_"
    }
    return $false
}

# ============================================================================
# MAIN WATCHDOG LOOP - Pure background, no console, no output
# ============================================================================

Log "=== T5500 Silent Watchdog Started ==="

$serviceStates = @{
    "OmniRoute"       = @{Port=20128; Failures=0; LastCheck=$null; Restart=$true; Service="omni-router"}
    "Mission Control" = @{Port=3151;  Failures=0; LastCheck=$null; Restart=$true; Service="mission-control"}
    "DateApp"         = @{Port=3200;  Failures=0; LastCheck=$null; Restart=$true; Service="dateapp-frontend"}
    "DateApp Backend" = @{Port=8000;  Failures=0; LastCheck=$null; Restart=$false; Service="dateapp-backend"}
    "Paperclip"       = @{Port=3120;  Failures=0; LastCheck=$null; Restart=$false; Service="paperclip"}
    "Hermes"          = @{Port=9119;  Failures=0; LastCheck=$null; Restart=$false; Service="hermes"}
    "OpenClaw"        = @{Port=18789; Failures=0; LastCheck=$null; Restart=$false; Service="openclaw"}
    "Ollama"          = @{Port=11434; Failures=0; LastCheck=$null; Restart=$false; Service="ollama"}
}

$startTime = Get-Date
$maxDuration = 8 * 3600  # 8 hours

while ((Get-Date).Subtract($startTime).TotalSeconds -lt $maxDuration) {
    $allHealthy = $true
    
    foreach ($service in $serviceStates.Keys) {
        $state = $serviceStates[$service]
        $port = $state.Port
        
        if (Test-Port $port $service) {
            $state.Failures = 0
            if (-not $state.LastCheck -or $state.LastCheck -ne "OK") {
                Log "$service (:$port) is ONLINE"
                $state.LastCheck = "OK"
            }
        } else {
            $state.Failures++
            $state.LastCheck = "DOWN"
            $allHealthy = $false
            
            Log "$service (:$port) OFFLINE - Failure count: $($state.Failures)/$FAILURE_THRESHOLD"
            
            # Restart after threshold (only if service is marked for restart)
            if ($state.Failures -ge $FAILURE_THRESHOLD -and $state.Restart) {
                Log "⚠ $($service) threshold reached, attempting restart"
                
                switch ($service) {
                    "Mission Control" { Start-MissionControl }
                    "OmniRoute"       { Start-OmniRoute }
                    "DateApp"         { Log "DateApp (:3200) restart: manual intervention required" }
                    default           { Log "No restart logic for $service — monitoring only" }
                }
                
                $state.Failures = 0
            }
        }
    }
    
    # Sleep silently - NO output to console
    Start-Sleep -Seconds $CHECK_INTERVAL
}

Log "=== Watchdog session ended (8-hour timeout) ==="
