# Worker-2: Hermes Router Self-Healing Bootstrap
# Path: C:\Antigravity\scripts\paperclip-boot.ps1
# Boots all ANTIGRAVITY services in correct dependency order, self-heals on failure.
# Run manually or via scheduled task.

$ErrorActionPreference = 'Continue'
$LogDir   = 'C:\Antigravity\logs'
$LogFile  = "$LogDir\paperclip-boot.log"
$MaxLogMB = 10
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
}

function Rotate-Log {
    if ((Test-Path $LogFile) -and (Get-Item $LogFile).Length -gt ($MaxLogMB * 1MB)) {
        Move-Item $LogFile "$LogFile.1" -Force -ErrorAction SilentlyContinue
    }
}

function Test-Port($port, $timeout=2000) {
    try {
        $c = New-Object System.Net.Sockets.TcpClient
        $a = $c.BeginConnect('127.0.0.1', $port, $null, $null)
        $ok = $a.AsyncWaitHandle.WaitOne($timeout, $false)
        $c.Close()
        return $ok
    } catch { return $false }
}

function Wait-For-Port($port, $seconds=30) {
    $limit = (Get-Date).AddSeconds($seconds)
    while ((Get-Date) -lt $limit) {
        if (Test-Port $port 1000) { return $true }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

function Ensure-DockerContainer($name, $image, $portExt, $portInt, $envVars=@()) {
    try {
        $running = docker ps --filter "name=$name" --format "{{.Names}}" 2>$null
        if ($running -eq $name) {
            Log "  [OK] Docker container '$name' already running."
            return
        }
        $exists = docker ps -a --filter "name=$name" --format "{{.Names}}" 2>$null
        if ($exists -eq $name) {
            Log "  [START] Docker container '$name' exists, starting..."
            docker start $name 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Log "  [OK] Docker container '$name' started."
                return
            } else {
                Log "  [WARN] docker start '$name' failed — will try run..."
            }
        }
        $args_run = @("run", "-d", "--name", $name, "-p", "${portExt}:${portInt}")
        foreach ($e in $envVars) { $args_run += "-e"; $args_run += $e }
        $args_run += $image
        Log "  [BOOT] docker $($args_run -join ' ')..."
        docker @args_run 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Log "  [OK] Docker container '$name' started fresh."
        } else {
            Log "  [ERROR] Failed to start docker container '$name'."
        }
    } catch {
        Log "  [ERROR] Docker exception for '$name': $($_.Exception.Message)"
    }
}

function Start-ProcessWSL($cmd) {
    try {
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = 'wsl.exe'
        $psi.Arguments = "-d Ubuntu -- bash -lc `"$cmd`""
        $psi.WindowStyle = 'Hidden'
        $psi.UseShellExecute = $false
        $psi.RedirectStandardOutput = $false
        $psi.RedirectStandardError = $false
        [System.Diagnostics.Process]::Start($psi) | Out-Null
    } catch {
        Log "  [WARN] WSL process error: $($_.Exception.Message)"
    }
}

# ─── BOOT SEQUENCE ───────────────────────────────────────────────────────────
Log '=============================================='
Log 'ANTIGRAVITY Self-Healing Bootstrap v1.0'
Log '=============================================='

# Phase 1: Docker containers
Log '[PHASE 1] Docker containers...'
Ensure-DockerContainer 'paperclip-postgres' 'postgres:16-alpine' '5432' '5432' @('POSTGRES_DB=paperclip','POSTGRES_USER=paperclip','POSTGRES_PASSWORD=paperclip')
Ensure-DockerContainer 'litellm' 'ghcr.io/berriai/litellm:main' '4000' '8000' @()

# Phase 2: Ollama check (informational only)
Log '[PHASE 2] Ollama...'
$ollama = Get-Command ollama -ErrorAction SilentlyContinue
if ($ollama) {
    Log '  [OK] Ollama found in PATH.'
} else {
    Log '  [SKIP] Ollama not in PATH — skipping.'
}

# Phase 3: Hermes Router (WSL)
Log '[PHASE 3] Hermes Router...'
if (Test-Port 11435) {
    Log '  [OK] Hermes Router already on :11435.'
} else {
    Log '  [BOOT] Starting Hermes Router via WSL...'
    Start-ProcessWSL 'nohup bash /mnt/c/Antigravity/scripts/start-hermes-router.sh > /tmp/hermes-router.log 2>&1 &'
    if (Wait-For-Port 11435 20) {
        Log '  [OK] Hermes Router UP on :11435.'
    } else {
        Log '  [WARN] Hermes Router did not bind within 20s.'
    }
}

# Phase 4: Mission Control
Log '[PHASE 4] Mission Control...'
if (Test-Port 8787) {
    Log '  [OK] Mission Control already on :8787.'
} else {
    Log '  [BOOT] Starting Mission Control via WSL...'
    Start-ProcessWSL 'nohup bash -c "cd /mnt/c/Antigravity && python -m uvicorn antigravity.main:app --host 0.0.0.0 --port 8787" > /tmp/mission-control.log 2>&1 &'
    if (Wait-For-Port 8787 20) {
        Log '  [OK] Mission Control UP on :8787.'
    } else {
        Log '  [WARN] Mission Control did not bind within 20s.'
    }
}

# Phase 5: Paperclip HQ
Log '[PHASE 5] Paperclip HQ...'
if (Test-Port 3100) {
    Log '  [OK] Paperclip already on :3100.'
} else {
    Log '  [BOOT] Starting Paperclip via start-paperclip.ps1...'
    Start-Process powershell.exe -ArgumentList '-NonInteractive','-WindowStyle','Hidden','-ExecutionPolicy','Bypass','-File','C:\Antigravity\scripts\start-paperclip.ps1'
    if (Wait-For-Port 3100 30) {
        Log '  [OK] Paperclip HQ UP on :3100.'
    } else {
        Log '  [WARN] Paperclip did not bind within 30s.'
    }
}

# Phase 6: OpenClaw
Log '[PHASE 6] OpenClaw...'
if (Test-Port 18789) {
    Log '  [OK] OpenClaw already on :18789.'
} else {
    Log '  [BOOT] Attempting OpenClaw via WSL...'
    Start-ProcessWSL 'nohup bash -c "cd /mnt/c/Antigravity && python -m uvicorn openclaw.main:app --host 0.0.0.0 --port 18789" > /tmp/openclaw.log 2>&1 &'
    if (Wait-For-Port 18789 20) {
        Log '  [OK] OpenClaw UP on :18789.'
    } else {
        Log '  [SKIP] OpenClaw not available.'
    }
}

# Summary
Log '=============================================='
Log '[SUMMARY] Service status:'
foreach ($svc in @(
    @{Name='Paperclip HQ'; Port=3100},
    @{Name='Hermes Router'; Port=11435},
    @{Name='Mission Control'; Port=8787},
    @{Name='Litellm'; Port=4000},
    @{Name='OpenClaw'; Port=18789}
)) {
    $status = if (Test-Port $svc.Port) { '[UP]' } else { '[DOWN]' }
    Log "  $($svc.Name) :$($svc.Port) $($status)"
}
Log 'Bootstrap complete.'
Rotate-Log
