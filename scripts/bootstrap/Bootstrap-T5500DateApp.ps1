#Requires -Version 5.1
<#
.SYNOPSIS
  T5500 date-app full stack bootstrap + health + self-heal.
  Paperclip date-app (:3100), API (:8000), static (:3200), Docker DB/redis,
  cloudflared, existing scheduled tasks. Does NOT install OmniRoute on T5500.

.NOTES
  - No terminal auto-close on error when run interactively.
  - Designed for SYSTEM scheduled task (no user login).
  - OmniRoute stays on laptop control plane.
#>
[CmdletBinding()]
param(
    [switch]$ServiceMode,
    [switch]$WatchOnce,
    [int]$HealIntervalSec = 90,
    [int]$MaxHealCycles = 0
)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

$RepoRoot = if (Test-Path 'C:\ANTIGRAVITY') { 'C:\ANTIGRAVITY' } else { 'C:\antigravity' }
$LogDir = Join-Path $RepoRoot 'logs\bootstrap-t5500'
$LogFile = Join-Path $LogDir ("bootstrap-{0:yyyyMMdd}.log" -f (Get-Date))
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$DateAppOps = 'C:\antigravity-paperclip-dateapp-ops'
$PublicStack = Join-Path $RepoRoot 'scripts\t5500\Start-YouAndINotAI-PublicStack.ps1'
$OpsWatchdog = Join-Path $RepoRoot 'scripts\t5500\Invoke-DateAppOpsWatchdog.ps1'

# Critical T5500 endpoints
$LocalChecks = @(
    @{ Name = 'DateAppAPI'; Port = 8000; Url = 'http://127.0.0.1:8000/api/v1/health'; Required = $true; Task = 'YouAndINotAI-API' }
    @{ Name = 'DateAppStatic'; Port = 3200; Url = 'http://127.0.0.1:3200/'; Required = $true; Task = 'ANTIGRAVITY-DateApp-Static-3200-SYSTEM' }
    @{ Name = 'PaperclipDateApp'; Port = 3100; Url = 'http://127.0.0.1:3100/api/health'; Required = $false; Task = 'PaperclipDateAppLoopback' }
    @{ Name = 'PaperclipProxy'; Port = 3110; Url = 'http://127.0.0.1:3110/healthz'; Required = $false; Task = 'PaperclipPrivateAuthProxy' }
    @{ Name = 'Postgres'; Port = 5432; Url = $null; Required = $true; Task = $null }
    @{ Name = 'Redis'; Port = 6379; Url = $null; Required = $true; Task = $null }
    @{ Name = 'OpenClaw'; Port = 18789; Url = 'http://127.0.0.1:18789/'; Required = $false; Task = 'OpenClaw Gateway' }
    @{ Name = 'HermesOrGateway'; Port = 9119; Url = 'http://127.0.0.1:9119/'; Required = $false; Task = $null }
)

$PublicUrls = @(
    'https://youandinotai.com/',
    'https://youandinotai.com/affiliate/',
    'https://youandinotai.com/dao/',
    'https://youandinotai.com/go/josh/',
    'https://api.youandinotai.com/api/v1/health',
    'https://paperclip.youandinotai.com/healthz'
)

# NEVER start OmniRoute ports on T5500
$ForbiddenOmniPorts = @(20128, 20129, 20131, 20132)

function Write-BootLog {
    param([string]$Level, [string]$Message)
    $line = '{0} [{1}] {2}' -f (Get-Date -Format o), $Level.ToUpper(), $Message
    Add-Content -LiteralPath $LogFile -Value $line -Encoding UTF8
    if (-not $ServiceMode) { Write-Host $line }
}

function Test-PortOpen([int]$Port) {
    try {
        return [bool](Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1)
    } catch { return $false }
}

function Test-HttpOk([string]$Url, [int]$TimeoutSec = 10) {
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec
        return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400)
    } catch {
        $resp = $_.Exception.Response
        if ($resp) {
            $code = [int]$resp.StatusCode
            if ($code -in 200, 301, 302, 401, 403) { return $true }
        }
        return $false
    }
}

function Start-TaskSafe([string]$Name) {
    if ([string]::IsNullOrWhiteSpace($Name)) { return $false }
    $t = Get-ScheduledTask -TaskName $Name -ErrorAction SilentlyContinue
    if (-not $t) {
        Write-BootLog 'warn' "task missing: $Name"
        return $false
    }
    try {
        if ($t.State -eq 'Disabled') {
            Write-BootLog 'info' "enabling task $Name"
            Enable-ScheduledTask -TaskName $Name -ErrorAction SilentlyContinue | Out-Null
        }
        if ($t.State -ne 'Running') {
            Write-BootLog 'info' "starting task $Name"
            Start-ScheduledTask -TaskName $Name -ErrorAction Stop
        } else {
            Write-BootLog 'ok' "task already running: $Name"
        }
        return $true
    } catch {
        Write-BootLog 'error' "task start failed $Name : $($_.Exception.Message)"
        return $false
    }
}

function Ensure-Docker {
    if ((Test-PortOpen 5432) -and (Test-PortOpen 6379)) {
        Write-BootLog 'ok' 'Postgres/Redis ports up'
        return
    }
    $svc = Get-Service com.docker.service -ErrorAction SilentlyContinue
    if ($svc) {
        try {
            if ($svc.StartType -ne 'Automatic') { Set-Service com.docker.service -StartupType Automatic -ErrorAction SilentlyContinue }
            if ($svc.Status -ne 'Running') {
                Write-BootLog 'info' 'starting Docker service'
                Start-Service com.docker.service -ErrorAction SilentlyContinue
            }
        } catch {
            Write-BootLog 'warn' "docker service: $($_.Exception.Message)"
        }
    }
    $desktop = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
    $docker = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
    if (Test-Path $desktop) {
        Start-Process -FilePath $desktop -WindowStyle Hidden -ErrorAction SilentlyContinue
    }
    Start-TaskSafe 'YouAndINotAI-DockerDesktop-T5500-User' | Out-Null

    if (Test-Path $docker) {
        for ($i = 0; $i -lt 18; $i++) {
            & $docker info *> $null
            if ($LASTEXITCODE -eq 0) {
                Write-BootLog 'ok' 'docker ready'
                # Prefer known running containers; compose only if missing
                $names = & $docker ps --format '{{.Names}}' 2>$null
                if ($names -notmatch 'uandinotai-postgres|postgres') {
                    $composeDir = Join-Path $RepoRoot 'backend\fastapi-app'
                    if (Test-Path (Join-Path $composeDir 'docker-compose.yml')) {
                        Push-Location $composeDir
                        try {
                            if (Test-Path .env) {
                                & $docker compose --env-file .env up -d 2>&1 | Out-Null
                            } else {
                                & $docker compose up -d 2>&1 | Out-Null
                            }
                            Write-BootLog 'info' "docker compose exit=$LASTEXITCODE"
                        } finally { Pop-Location }
                    }
                }
                return
            }
            Start-Sleep -Seconds 5
        }
    }
    Write-BootLog 'warn' 'Docker not fully ready - continuing if ports appear later'
}

function Ensure-CoreTasks {
    # Date-app money path
    Start-TaskSafe 'YouAndINotAI-API' | Out-Null
    Start-TaskSafe 'ANTIGRAVITY-DateApp-Static-3200-SYSTEM' | Out-Null
    Start-TaskSafe 'ANTIGRAVITY-DateApp-Serve-3200' | Out-Null

    # Paperclip date-app (NOT marketing laptop 3101)
    Start-TaskSafe 'PaperclipDateAppLoopback' | Out-Null
    Start-TaskSafe 'PaperclipPrivateAuthProxy' | Out-Null
    Start-TaskSafe 'PaperclipDateAppWatchdog' | Out-Null

    # Tunnel / public
    Start-TaskSafe 'ANTIGRAVITY-T5500-DateApp-Cloudflared-SYSTEM' | Out-Null
    Start-TaskSafe 'Hermes_Cloudflared_Tunnel_SYSTEM' | Out-Null

    # Public stack orchestrator if present
    if (Test-Path $PublicStack) {
        $t = Get-ScheduledTask -TaskName 'ANTIGRAVITY-YouAndINotAI-PublicStack-T5500' -ErrorAction SilentlyContinue
        if ($t) {
            if ($t.State -eq 'Disabled') { Enable-ScheduledTask -TaskName 'ANTIGRAVITY-YouAndINotAI-PublicStack-T5500' -ErrorAction SilentlyContinue | Out-Null }
            Start-TaskSafe 'ANTIGRAVITY-YouAndINotAI-PublicStack-T5500' | Out-Null
        } else {
            Write-BootLog 'info' 'running public stack script once (no task)'
            try {
                powershell.exe -NoProfile -ExecutionPolicy Bypass -File $PublicStack
            } catch {
                Write-BootLog 'warn' "public stack script: $($_.Exception.Message)"
            }
        }
    }

    # DateApp ops package loopback scripts if tasks missing
    $loop = Join-Path $DateAppOps 'scripts\run-paperclip-loopback.ps1'
    if (-not (Test-PortOpen 3100) -and (Test-Path $loop)) {
        Write-BootLog 'info' 'starting paperclip loopback script directly'
        Start-Process powershell.exe -ArgumentList @(
            '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $loop
        ) -WindowStyle Hidden | Out-Null
        Start-Sleep -Seconds 20
    }
}

function Assert-NoOmniRouteOnT5500 {
    foreach ($p in $ForbiddenOmniPorts) {
        if (Test-PortOpen $p) {
            Write-BootLog 'error' "FORBIDDEN OmniRoute-style port listening on T5500 :$p - do not use; OmniRoute is laptop-only"
        }
    }
}

function Invoke-HealthReport {
    $fail = 0
    Write-BootLog 'info' '=== T5500 HEALTH ==='
    Write-BootLog 'info' ("host={0}" -f $env:COMPUTERNAME)
    Assert-NoOmniRouteOnT5500

    foreach ($c in $LocalChecks) {
        $portOk = Test-PortOpen $c.Port
        $httpOk = if ($c.Url) { Test-HttpOk $c.Url } else { $portOk }
        $status = if ($httpOk) { 'OK' } elseif ($portOk) { 'PORT-ONLY' } else { 'DOWN' }
        $msg = '{0,-20} :{1,-5} {2}' -f $c.Name, $c.Port, $status
        if ($status -eq 'DOWN' -and $c.Required) {
            Write-BootLog 'error' $msg
            $fail++
            if ($c.Task) { Start-TaskSafe $c.Task | Out-Null }
        } elseif ($status -eq 'DOWN') {
            Write-BootLog 'warn' $msg
        } else {
            Write-BootLog 'ok' $msg
        }
    }

    Write-BootLog 'info' '=== PUBLIC URLS ==='
    foreach ($u in $PublicUrls) {
        $ok = Test-HttpOk $u 15
        Write-BootLog $(if ($ok) { 'ok' } else { 'warn' }) ("  {0} -> {1}" -f $u, $(if ($ok) { 'OK' } else { 'DOWN' }))
    }

    # Affiliate / dao markers when public root is up
    try {
        $aff = Invoke-WebRequest 'https://youandinotai.com/affiliate/' -UseBasicParsing -TimeoutSec 12
        $dao = Invoke-WebRequest 'https://youandinotai.com/dao/' -UseBasicParsing -TimeoutSec 12
        $affOk = $aff.Content -match 'Affiliate Program'
        $daoOk = $dao.Content -match 'Member Council'
        Write-BootLog $(if ($affOk) { 'ok' } else { 'warn' }) "affiliate title marker=$affOk"
        Write-BootLog $(if ($daoOk) { 'ok' } else { 'warn' }) "dao title marker=$daoOk"
    } catch {
        Write-BootLog 'warn' "public marker check failed: $($_.Exception.Message)"
    }

    return $fail
}

function Invoke-BootstrapOnce {
    Write-BootLog 'info' "T5500 bootstrap begin mode=$(if($ServiceMode){'service'}else{'interactive'})"
    if ($env:COMPUTERNAME -notmatch 'H4B53GL|T5500') {
        Write-BootLog 'warn' "hostname $($env:COMPUTERNAME) is not the known T5500 id - continuing carefully"
    }
    Ensure-Docker
    Ensure-CoreTasks
    Start-Sleep -Seconds 8
    $fail = Invoke-HealthReport

    # Optional structured ops watchdog pass
    if ((Test-Path $OpsWatchdog) -and -not $ServiceMode) {
        Write-BootLog 'info' 'running dateapp ops watchdog once'
        try {
            & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $OpsWatchdog
            Write-BootLog 'info' "ops watchdog exit=$LASTEXITCODE"
        } catch {
            Write-BootLog 'warn' "ops watchdog: $($_.Exception.Message)"
        }
    }

    Write-BootLog 'info' "bootstrap cycle done fail=$fail log=$LogFile"
    return $fail
}

function Invoke-SelfHeal {
    Ensure-Docker
    foreach ($c in $LocalChecks) {
        if ($c.Required -and -not (Test-PortOpen $c.Port)) {
            if ($c.Task) { Start-TaskSafe $c.Task | Out-Null }
        }
    }
    if (-not (Test-PortOpen 3100)) { Start-TaskSafe 'PaperclipDateAppLoopback' | Out-Null }
    if (-not (Test-PortOpen 3110)) { Start-TaskSafe 'PaperclipPrivateAuthProxy' | Out-Null }
    $cf = Get-Process cloudflared -ErrorAction SilentlyContinue
    if (-not $cf) { Start-TaskSafe 'ANTIGRAVITY-T5500-DateApp-Cloudflared-SYSTEM' | Out-Null }
}

# --- main ---
$fail = Invoke-BootstrapOnce

if ($WatchOnce -or $ServiceMode) {
    $cycle = 0
    while ($true) {
        $cycle++
        if ($MaxHealCycles -gt 0 -and $cycle -gt $MaxHealCycles) { break }
        Start-Sleep -Seconds $HealIntervalSec
        Write-BootLog 'info' "heal cycle $cycle"
        Invoke-SelfHeal
        $fail = Invoke-HealthReport
        if (-not $ServiceMode -and $WatchOnce) { break }
    }
}

if (-not $ServiceMode) {
    if ($fail -gt 0) {
        Write-Host ''
        Write-Host 'REQUIRED T5500 checks failed. Window stays open.' -ForegroundColor Yellow
        Write-Host $LogFile
        Write-Host 'Press Enter to exit.'
        if ([Environment]::UserInteractive -and -not [Console]::IsInputRedirected) { try { [void](Read-Host) } catch {} } else { Write-BootLog 'info' 'skip pause (non-interactive)' }
        exit 2
    }
    Write-Host 'T5500 required checks OK.' -ForegroundColor Green
    Write-Host "Log: $LogFile"
    if (-not $env:BOOTSTRAP_NO_PAUSE) {
        Write-Host 'Press Enter to exit.'
        if ([Environment]::UserInteractive -and -not [Console]::IsInputRedirected) { try { [void](Read-Host) } catch {} } else { Write-BootLog 'info' 'skip pause (non-interactive)' }
    }
    exit 0
}

exit $(if ($fail -gt 0) { 2 } else { 0 })
