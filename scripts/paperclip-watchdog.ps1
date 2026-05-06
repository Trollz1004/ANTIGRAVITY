# Worker-1: Paperclip Watchdog + Scheduled Task Registration
# Enhanced version of C:\Antigravity\scripts\paperclip-watchdog.ps1
# Path: C:\Antigravity\scripts\paperclip-watchdog.ps1

$ErrorActionPreference = 'Continue'
$LogDir          = 'C:\Antigravity\logs'
$LogFile         = "$LogDir\paperclip-watchdog.log"
$PcStdErr        = "$LogDir\paperclip.stderr.log"
$PcStdOut        = "$LogDir\paperclip.stdout.log"
$MaxLogBytes     = 10MB
$PaperclipScript = 'C:\Antigravity\scripts\start-paperclip.ps1'
$PaperclipPort   = 3100
$CheckInterval   = 30
$TaskName        = 'AntigravityPaperclipWatchdog'
$TaskDesc        = '24/7 Paperclip HQ watchdog — auto-restarts if port 3100 goes down'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
}

function Rotate-Log {
    foreach ($f in @($LogFile, $PcStdErr, $PcStdOut)) {
        if ((Test-Path $f) -and (Get-Item $f).Length -gt $MaxLogBytes) {
            Move-Item $f "$f.1" -Force -ErrorAction SilentlyContinue
        }
    }
}

function Test-LocalPort($port) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async  = $client.BeginConnect('127.0.0.1', $port, $null, $null)
        $ok     = $async.AsyncWaitHandle.WaitOne(2000, $false)
        $client.Close()
        return $ok
    } catch { return $false }
}

function Start-Paperclip {
    Log 'Paperclip DOWN — starting silently...'
    Start-Process -FilePath 'powershell.exe' `
        -ArgumentList '-NonInteractive','-WindowStyle','Hidden','-ExecutionPolicy','Bypass','-File',$PaperclipScript `
        -WindowStyle Hidden `
        -RedirectStandardOutput $PcStdOut `
        -RedirectStandardError  $PcStdErr `
        -ErrorAction SilentlyContinue
    Log "Paperclip start command issued. stderr -> $PcStdErr"
}

function Register-ScheduledTask {
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' `
        -Argument '-NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\Antigravity\scripts\paperclip-watchdog.ps1"'
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest

    $existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($existing) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    }
    Register-ScheduledTask -TaskName $TaskName -Description $TaskDesc -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
    Log "Scheduled task '$TaskName' registered (SYSTEM, AtStartup, run as Highest)"
}

# --- Self-healing: ensure PostgreSQL docker is running ---
function Ensure-PostgresDocker {
    $containerName = 'paperclip-postgres'
    try {
        $running = docker ps --filter "name=$containerName" --format "{{.Names}}" 2>$null
        if ($running -eq $containerName) {
            return
        }
        $exists = docker ps -a --filter "name=$containerName" --format "{{.Names}}" 2>$null
        if ($exists -eq $containerName) {
            Log "PostgreSQL container exists but not running — starting..."
            docker start $containerName 2>&1 | Out-Null
            Log "PostgreSQL docker started."
        } else {
            Log "PostgreSQL container missing — attempting docker run..."
            docker run -d --name $containerName `
                -e POSTGRES_DB=paperclip `
                -e POSTGRES_USER=paperclip `
                -e POSTGRES_PASSWORD=paperclip `
                -p 5432:5432 `
                postgres:16-alpine 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Log "PostgreSQL docker started."
            } else {
                Log "WARN: Could not start PostgreSQL docker."
            }
        }
    } catch {
        Log "Docker check failed: $($_.Exception.Message)"
    }
}

# --- Auto-register scheduled task on first run ---
$registered = Test-Path "$LogDir\.watchdog-task-registered"
if (-not $registered) {
    Register-ScheduledTask
    "1" | Out-File "$LogDir\.watchdog-task-registered" -Encoding ASCII
}

Log '====== Paperclip Watchdog Started ======'
Log "Watching port $PaperclipPort every ${CheckInterval}s. Local-only mode."

while ($true) {
    Rotate-Log

    if (-not (Test-LocalPort $PaperclipPort)) {
        Ensure-PostgresDocker
        Start-Paperclip
        Start-Sleep -Seconds 20
    }

    Start-Sleep -Seconds $CheckInterval
}
