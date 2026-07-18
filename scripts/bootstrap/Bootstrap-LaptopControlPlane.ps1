#Requires -Version 5.1
<#
.SYNOPSIS
  Laptop control-plane bootstrap: Hermes, Paperclip (marketing), OmniRoute if present,
  Ollama, OpenClaw support, health checks + self-heal loop.

.NOTES
  - OmniRoute belongs on the LAPTOP only (not T5500).
  - Marketing Paperclip is separate from T5500 date-app Paperclip (:3100).
  - Does not close on error. Logs to C:\antigravity\logs\bootstrap-laptop.
  - Safe for Scheduled Task / SYSTEM (no interactive browser when -ServiceMode).
#>
[CmdletBinding()]
param(
    [switch]$ServiceMode,
    [switch]$WatchOnce,
    [int]$HealIntervalSec = 60,
    [int]$MaxHealCycles = 0  # 0 = forever in service mode
)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

$RepoRoot = if (Test-Path 'C:\antigravity\.git') { 'C:\antigravity' } elseif (Test-Path 'C:\ANTIGRAVITY\.git') { 'C:\ANTIGRAVITY' } else { 'C:\antigravity' }
$LogDir = Join-Path $RepoRoot 'logs\bootstrap-laptop'
$LogFile = Join-Path $LogDir ("bootstrap-{0:yyyyMMdd}.log" -f (Get-Date))
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

# Paths (best-effort discovery)
$Node = @(
    'C:\Users\joshl\AppData\Local\hermes\node\node.exe',
    (Get-Command node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source)
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

$Hermes = @(
    'C:\Users\joshl\AppData\Local\hermes\hermes-agent\venv\Scripts\hermes.exe',
    (Get-Command hermes -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source)
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

$Ollama = @(
    'C:\Users\joshl\AppData\Local\Programs\Ollama\ollama.exe',
    (Get-Command ollama -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source)
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

$OmniRouteCli = @(
    'C:\Users\joshl\AppData\Local\hermes\node\omniroute',
    'C:\Users\joshl\AppData\Local\hermes\node\omniroute.cmd',
    (Get-Command omniroute -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source)
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

$PaperclipJs = Join-Path $RepoRoot 'node_modules\paperclipai\dist\index.js'
$PaperclipConfig = Join-Path $RepoRoot 'income-engine\paperclip-data\instances\default\config.json'
$PaperclipData = Join-Path $RepoRoot 'income-engine\paperclip-data'
$OpenClawStandalone = Join-Path $RepoRoot 'SUPPORTCLAW-T5500\openclaw-standalone.js'

# Endpoint map (laptop control plane)
$Endpoints = @(
    @{ Name = 'Ollama';           Port = 11434; Url = 'http://127.0.0.1:11434/api/tags'; Required = $false }
    @{ Name = 'HermesDashboard';  Port = 9119;  Url = 'http://127.0.0.1:9119/'; Required = $false }
    @{ Name = 'PaperclipMarketing'; Port = 3101; Url = 'http://127.0.0.1:3101/api/health'; Required = $true }
    @{ Name = 'OpenClawSupport';  Port = 18895; Url = 'http://127.0.0.1:18895/health'; Required = $false }
    @{ Name = 'OmniRoute';         Port = 20128; Url = 'http://127.0.0.1:20128/v1/models'; Required = $false }
)

function Write-BootLog {
    param([string]$Level, [string]$Message)
    $line = '{0} [{1}] {2}' -f (Get-Date -Format o), $Level.ToUpper(), $Message
    Add-Content -LiteralPath $LogFile -Value $line -Encoding UTF8
    if (-not $ServiceMode) { Write-Host $line }
}

function Test-PortOpen([int]$Port) {
    try {
        $c = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
        return [bool]$c
    } catch { return $false }
}

function Test-HttpOk([string]$Url, [int]$TimeoutSec = 8) {
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec
        return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500)
    } catch {
        $resp = $_.Exception.Response
        if ($resp -and [int]$resp.StatusCode -in @(200, 401, 403)) {
            # 401/403 means process is up (auth required) - treat as alive
            return $true
        }
        return $false
    }
}

function Start-HiddenProcess {
    param(
        [string]$FilePath,
        [string[]]$ArgumentList = @(),
        [string]$WorkingDirectory = $RepoRoot,
        [string]$Name
    )
    if (-not (Test-Path -LiteralPath $FilePath)) {
        Write-BootLog 'warn' "$Name binary missing: $FilePath"
        return $false
    }
    try {
        $out = Join-Path $LogDir ("{0}.out.log" -f $Name)
        $err = Join-Path $LogDir ("{0}.err.log" -f $Name)
        Start-Process -FilePath $FilePath -ArgumentList $ArgumentList `
            -WorkingDirectory $WorkingDirectory -WindowStyle Hidden `
            -RedirectStandardOutput $out -RedirectStandardError $err | Out-Null
        Write-BootLog 'info' "started $Name"
        return $true
    } catch {
        Write-BootLog 'error' "failed start $Name : $($_.Exception.Message)"
        return $false
    }
}

function Ensure-Ollama {
    if (Test-PortOpen 11434) { Write-BootLog 'ok' 'Ollama :11434 up'; return }
    if ($Ollama) {
        Start-HiddenProcess -FilePath $Ollama -ArgumentList @('serve') -Name 'ollama'
        Start-Sleep -Seconds 5
    } else {
        Write-BootLog 'warn' 'Ollama not installed'
    }
}

function Ensure-Hermes {
    if (Test-PortOpen 9119) { Write-BootLog 'ok' 'Hermes :9119 up'; return }
    if ($Hermes) {
        Start-HiddenProcess -FilePath $Hermes -ArgumentList @(
            'dashboard', '--port', '9119', '--host', '127.0.0.1', '--no-open', '--skip-build'
        ) -Name 'hermes-dashboard'
        Start-Sleep -Seconds 12
    } else {
        Write-BootLog 'warn' 'Hermes CLI not found'
    }
}

function Ensure-PaperclipMarketing {
    if (Test-PortOpen 3101) { Write-BootLog 'ok' 'Paperclip marketing :3101 up'; return }
    if (-not $Node) { Write-BootLog 'error' 'node.exe missing - cannot start Paperclip'; return }
    if (-not (Test-Path $PaperclipJs)) { Write-BootLog 'warn' "Paperclip package missing at $PaperclipJs"; return }
    if (-not (Test-Path $PaperclipConfig)) { Write-BootLog 'warn' "Paperclip config missing at $PaperclipConfig"; return }
    Start-HiddenProcess -FilePath $Node -ArgumentList @(
        $PaperclipJs, 'run',
        '--config', $PaperclipConfig,
        '--data-dir', $PaperclipData,
        '--bind', 'loopback'
    ) -Name 'paperclip-marketing'
    Start-Sleep -Seconds 15
}

function Ensure-OpenClaw {
    if (Test-PortOpen 18895) { Write-BootLog 'ok' 'OpenClaw :18895 up'; return }
    if (-not $Node) { return }
    if (Test-Path $OpenClawStandalone) {
        Start-HiddenProcess -FilePath $Node -ArgumentList @($OpenClawStandalone) -Name 'openclaw'
        Start-Sleep -Seconds 6
    } else {
        Write-BootLog 'warn' 'OpenClaw standalone missing'
    }
}

function Ensure-OmniRoute {
    # Control plane ONLY - laptop
    if (Test-PortOpen 20128) { Write-BootLog 'ok' 'OmniRoute :20128 up'; return }

    # Prefer existing scheduled service / npm global if user already set it up
    $candidates = @(
        @{ File = 'C:\Users\joshl\AppData\Local\hermes\node\omniroute.cmd'; Args = @('start') },
        @{ File = 'C:\Users\joshl\AppData\Local\hermes\node\npx.cmd'; Args = @('--yes', 'omniroute', 'start') }
    )
    foreach ($c in $candidates) {
        if (Test-Path $c.File) {
            Start-HiddenProcess -FilePath $c.File -ArgumentList $c.Args -Name 'omniroute'
            Start-Sleep -Seconds 10
            if (Test-PortOpen 20128) { Write-BootLog 'ok' 'OmniRoute started'; return }
        }
    }
    Write-BootLog 'warn' 'OmniRoute :20128 not listening (optional until Joshua finishes laptop router setup)'
}

function Ensure-DockerDesktop {
    $docker = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
    $desktop = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
    if (-not (Test-Path $docker)) {
        Write-BootLog 'info' 'Docker not installed on laptop - skip'
        return
    }
    try {
        & $docker info *> $null
        if ($LASTEXITCODE -eq 0) { Write-BootLog 'ok' 'Docker ready'; return }
    } catch {}
    if (Test-Path $desktop) {
        Write-BootLog 'info' 'Starting Docker Desktop best-effort'
        Start-Process -FilePath $desktop -WindowStyle Hidden
        for ($i = 0; $i -lt 24; $i++) {
            Start-Sleep -Seconds 5
            & $docker info *> $null
            if ($LASTEXITCODE -eq 0) { Write-BootLog 'ok' 'Docker became ready'; return }
        }
    }
    Write-BootLog 'warn' 'Docker not ready (non-fatal on laptop)'
}

function Invoke-HealthReport {
    $fail = 0
    Write-BootLog 'info' '=== HEALTH REPORT ==='
    foreach ($ep in $Endpoints) {
        $portOk = Test-PortOpen $ep.Port
        $httpOk = if ($ep.Url) { Test-HttpOk $ep.Url } else { $portOk }
        $status = if ($httpOk) { 'OK' } elseif ($portOk) { 'PORT-ONLY' } else { 'DOWN' }
        $line = '{0,-22} :{1,-5} {2}  {3}' -f $ep.Name, $ep.Port, $status, $ep.Url
        if ($status -eq 'DOWN' -and $ep.Required) {
            Write-BootLog 'error' $line
            $fail++
        } elseif ($status -eq 'DOWN') {
            Write-BootLog 'warn' $line
        } else {
            Write-BootLog 'ok' $line
        }
    }
    Write-BootLog 'info' 'Public product URLs (external - informational):'
    foreach ($u in @(
        'https://youandinotai.com/',
        'https://youandinotai.com/affiliate/',
        'https://youandinotai.com/dao/',
        'https://youandinotai.com/go/josh/'
    )) {
        $ok = Test-HttpOk $u 12
        Write-BootLog $(if ($ok) { 'ok' } else { 'warn' }) ("  {0} -> {1}" -f $u, $(if ($ok) { 'OK' } else { 'DOWN' }))
    }
    return $fail
}

function Invoke-BootstrapOnce {
    Write-BootLog 'info' "Bootstrap begin host=$env:COMPUTERNAME mode=$(if($ServiceMode){'service'}else{'interactive'})"
    Ensure-DockerDesktop
    Ensure-Ollama
    Ensure-Hermes
    Ensure-PaperclipMarketing
    Ensure-OpenClaw
    Ensure-OmniRoute
    $fail = Invoke-HealthReport
    Write-BootLog 'info' "Bootstrap cycle complete failCount=$fail log=$LogFile"
    return $fail
}

function Invoke-SelfHeal {
    # Restart only what is down
    if (-not (Test-PortOpen 11434)) { Ensure-Ollama }
    if (-not (Test-PortOpen 9119))  { Ensure-Hermes }
    if (-not (Test-PortOpen 3101))  { Ensure-PaperclipMarketing }
    if (-not (Test-PortOpen 18895)) { Ensure-OpenClaw }
    if (-not (Test-PortOpen 20128)) { Ensure-OmniRoute }
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
        Write-Host 'REQUIRED checks failed. Terminal stays open. See log:' -ForegroundColor Yellow
        Write-Host $LogFile
        Write-Host 'Press Enter to exit (window will not auto-close on error).'
        if ([Environment]::UserInteractive -and -not [Console]::IsInputRedirected) { try { [void](Read-Host) } catch {} } else { Write-BootLog 'info' 'skip pause (non-interactive)' }
        exit 2
    } else {
        Write-Host 'All required laptop control-plane checks OK.' -ForegroundColor Green
        Write-Host "Log: $LogFile"
        if (-not $env:BOOTSTRAP_NO_PAUSE) {
            Write-Host 'Press Enter to exit.'
            if ([Environment]::UserInteractive -and -not [Console]::IsInputRedirected) { try { [void](Read-Host) } catch {} } else { Write-BootLog 'info' 'skip pause (non-interactive)' }
        }
        exit 0
    }
}

exit $(if ($fail -gt 0) { 2 } else { 0 })
