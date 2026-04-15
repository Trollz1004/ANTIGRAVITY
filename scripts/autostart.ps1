# ANTIGRAVITY Auto-Start Script
# Runs at logon via Task Scheduler
# Starts: Docker stack, LiteLLM proxy, Paperclip, Claude Code, browser
# Log: C:\ANTIGRAVITY\logs\autostart.log

$ErrorActionPreference = 'Stop'

$LogDir = 'C:\ANTIGRAVITY\logs'
$LogFile = Join-Path $LogDir 'autostart.log'
$PaperclipLog = Join-Path $LogDir 'paperclip.log'
$PaperclipTunnelLog = Join-Path $LogDir 'paperclip-tunnel.log'
$RepoRoot = 'C:\ANTIGRAVITY'
$PaperclipRoot = 'C:\ANTIGRAVITY\paperclip-upstream'
$PaperclipRuntimeRoot = 'C:\ANTIGRAVITY\paperclip-runtime'
$DockerComposeExe = 'C:\Program Files\Docker\Docker\resources\bin\docker-compose.exe'
$DockerExe = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
$CloudflaredExe = 'C:\cloudflared\cloudflared.exe'
$PaperclipTunnelConfig = 'C:\ANTIGRAVITY\infra\cloudflare\paperclip-hq.yml'
$PowerShellExe = 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe'
$PnpmCmd = 'C:\Users\joshl\AppData\Roaming\npm\pnpm.cmd'
$ClaudeWrapper = 'C:\ANTIGRAVITY\paperclip-adapters\claude.ps1'
$ChromeExe = 'C:\Program Files\Google\Chrome\Application\chrome.exe'

function Log($Message) {
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    Write-Host $line
    Add-Content -Path $LogFile -Value $line
}

function Run-Compose($ComposeFile, $Label) {
    Log "Starting $Label..."
    & $DockerComposeExe -f $ComposeFile up -d 2>&1 | ForEach-Object { Log $_ }
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE."
    }
}

function MainStackIsAvailable {
    return (Test-Path 'C:\openclaw') -and (Test-Path 'C:\openclaw\.env')
}

function Ensure-LiteLLMRunning {
    $inspect = & $DockerExe inspect litellm-proxy 2>$null
    if ($LASTEXITCODE -eq 0) {
        $status = & $DockerExe inspect -f '{{.State.Status}}' litellm-proxy 2>$null
        if ($LASTEXITCODE -eq 0 -and $status -eq 'running') {
            Log 'LiteLLM proxy already running.'
            return
        }

        Log 'Starting existing LiteLLM container...'
        & $DockerExe start litellm-proxy 2>&1 | ForEach-Object { Log $_ }
        if ($LASTEXITCODE -ne 0) {
            throw 'Existing LiteLLM container failed to start.'
        }
        return
    }

    Run-Compose -ComposeFile 'C:\ANTIGRAVITY\docker-compose.litellm.yml' -Label 'LiteLLM proxy'
}

function Ensure-PaperclipPortAvailable {
    $listener = Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -eq $listener) {
        return $true
    }

    $processInfo = Get-CimInstance Win32_Process -Filter ("ProcessId = {0}" -f $listener.OwningProcess) -ErrorAction SilentlyContinue
    if ($null -eq $processInfo) {
        return $true
    }

    $commandLine = [string]$processInfo.CommandLine
    if ($commandLine -like '*C:\ANTIGRAVITY*') {
        Log 'Existing Paperclip listener already belongs to ANTIGRAVITY.'
        return $false
    }

    Log ("Stopping stale Paperclip listener on port 3100: PID {0}" -f $processInfo.ProcessId)
    Stop-Process -Id $processInfo.ProcessId -Force
    Start-Sleep -Seconds 2
    return $true
}

function Ensure-PaperclipTunnelRunning {
    $existingTunnel = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object { [string]$_.CommandLine -like "*$PaperclipTunnelConfig*" } |
        Select-Object -First 1

    if ($null -ne $existingTunnel) {
        Log 'Paperclip Cloudflare tunnel already running.'
        return
    }

    Log 'Starting Paperclip Cloudflare tunnel...'
    $paperclipTunnelCommand = "& '$CloudflaredExe' tunnel --config '$PaperclipTunnelConfig' run *>> '$PaperclipTunnelLog' 2>&1"
    Start-Process -FilePath $PowerShellExe -ArgumentList @(
        '-NoProfile',
        '-WindowStyle', 'Hidden',
        '-Command', $paperclipTunnelCommand
    ) | Out-Null
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

try {
    Log "=== ANTIGRAVITY autostart triggered ==="

    Log "Waiting for Docker daemon..."
    $maxWait = 120
    $waited = 0
    while ($waited -lt $maxWait) {
        & $DockerExe info *> $null
        if ($LASTEXITCODE -eq 0) {
            break
        }

        Start-Sleep -Seconds 3
        $waited += 3
    }

    if ($waited -ge $maxWait) {
        throw "Docker not ready after ${maxWait}s."
    }

    Log "Docker ready after ${waited}s."

    if (MainStackIsAvailable) {
        Run-Compose -ComposeFile 'C:\ANTIGRAVITY\docker-compose.yml' -Label 'main docker stack'
    } else {
        Log 'WARNING: Skipping main docker stack because C:\openclaw or C:\openclaw\.env is missing.'
    }

    Ensure-LiteLLMRunning

    if (Ensure-PaperclipPortAvailable) {
        Log 'Starting Paperclip...'
        $paperclipCommand = "Set-Location -LiteralPath 'C:\ANTIGRAVITY'; `$env:DATABASE_URL = 'postgresql://paperclip:paperclip@localhost:5432/paperclip_hq'; paperclipai run *>> '$PaperclipLog' 2>&1"
        Start-Process -FilePath $PowerShellExe -ArgumentList @(
            '-NoExit',
            '-ExecutionPolicy', 'Bypass',
            '-WindowStyle', 'Minimized',
            '-Command', $paperclipCommand
        ) -WorkingDirectory $PaperclipRoot | Out-Null
    }

    Ensure-PaperclipTunnelRunning

    Log "Starting Claude Code..."
    Start-Process -FilePath $PowerShellExe -ArgumentList @(
        '-NoExit',
        '-ExecutionPolicy', 'Bypass',
        '-File', $ClaudeWrapper,
        '--dangerously-skip-permissions'
    ) -WorkingDirectory $RepoRoot | Out-Null

    Log "Waiting 20s for Paperclip to boot..."
    Start-Sleep -Seconds 20

    $paperclipUp = $false
    for ($i = 0; $i -lt 10; $i++) {
        try {
            $response = Invoke-WebRequest -Uri 'http://localhost:3100' -TimeoutSec 3 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                $paperclipUp = $true
                break
            }
        } catch {
        }

        Start-Sleep -Seconds 3
    }

    if ($paperclipUp) {
        Log "Paperclip is up. Opening browser..."
    } else {
        Log "Paperclip did not respond in time. Opening browser anyway."
    }

    if (Test-Path $ChromeExe) {
        Start-Process -FilePath $ChromeExe -ArgumentList 'http://localhost:3100' | Out-Null
    } else {
        Start-Process 'http://localhost:3100' | Out-Null
    }

    Log "=== All services launched ==="
    Log "  Paperclip:  http://localhost:3100"
    Log "  LiteLLM:    http://localhost:11435"
    Log "  Logs:       C:\ANTIGRAVITY\logs\"
    exit 0
} catch {
    Log "ERROR: $($_.Exception.Message)"
    exit 1
}
