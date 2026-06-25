# Starts or verifies the T5500 public YouAndINotAI stack after boot/power loss.
# Docker is best-effort. The current live backend path is Python uvicorn on 8000,
# static frontend on 3200, and cloudflared as the public tunnel.

$ErrorActionPreference = "Stop"

$Root = "C:\ANTIGRAVITY"
$Backend = Join-Path $Root "backend\fastapi-app"
$LogDir = Join-Path $Root "logs"
$Log = Join-Path $LogDir "youandinotai-public-stack.log"
$ApiOut = Join-Path $LogDir "youandinotai-api.out.log"
$ApiErr = Join-Path $LogDir "youandinotai-api.err.log"
$Cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
$TunnelTokenPath = "C:\Users\joshl\.cloudflared\t5500-dateapp.token"
$TunnelOut = Join-Path $LogDir "t5500-dateapp-tunnel.log"
$TunnelErr = Join-Path $LogDir "t5500-dateapp-tunnel.err.log"
$Docker = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
$DockerDesktop = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
$Python = "C:\Users\joshl\AppData\Roaming\uv\python\cpython-3.12-windows-x86_64-none\python.exe"
$StaticLauncher = Join-Path $LogDir "start-dateapp-static-3200.cmd"
$TunnelProcessPattern = "cloudflared.*tunnel.*run.*--token"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-StackLog {
    param([string]$Message)
    $line = "$(Get-Date -Format s) $Message"
    Write-Output $line
    Add-Content -LiteralPath $Log -Value $line
}

function Test-TcpPort {
    param([int]$Port)
    return Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
}

function Wait-TcpPort {
    param(
        [int]$Port,
        [int]$TimeoutSeconds = 120
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-TcpPort -Port $Port) {
            Write-StackLog "port $Port ready"
            return
        }
        Start-Sleep -Seconds 2
    }
    throw "Timed out waiting for port $Port"
}

function Wait-HttpOk {
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 240
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
                Write-StackLog "http ready $Url status=$($response.StatusCode)"
                return
            }
        } catch {
            Write-StackLog "http not ready ${Url}: $($_.Exception.Message)"
        }
        Start-Sleep -Seconds 3
    }
    throw "Timed out waiting for $Url"
}

function Start-DockerBestEffort {
    if ((Test-TcpPort -Port 5432) -and (Test-TcpPort -Port 6379)) {
        Write-StackLog "database/cache ports already listening; skipping Docker startup"
        return
    }

    try {
        $dockerService = Get-Service -Name "com.docker.service" -ErrorAction SilentlyContinue
        if ($dockerService) {
            Set-Service -Name "com.docker.service" -StartupType Automatic
            if ($dockerService.Status -ne "Running") {
                Write-StackLog "starting Docker service"
                Start-Service -Name "com.docker.service"
            }
        }

        if (Test-Path -LiteralPath $DockerDesktop) {
            Write-StackLog "starting Docker Desktop best-effort"
            Start-Process -FilePath $DockerDesktop -WindowStyle Hidden
        }

        if (Test-Path -LiteralPath $Docker) {
            for ($i = 1; $i -le 24; $i++) {
                & $Docker info *> $null
                if ($LASTEXITCODE -eq 0) {
                    Write-StackLog "docker ready"
                    Set-Location $Backend
                    & $Docker compose --env-file .env up -d
                    if ($LASTEXITCODE -ne 0) {
                        Write-StackLog "docker compose returned $LASTEXITCODE; continuing if ports are available"
                    }
                    return
                }
                Start-Sleep -Seconds 5
            }
        }
        Write-StackLog "docker did not become ready; continuing with non-Docker stack"
    } catch {
        Write-StackLog "docker startup skipped after error: $($_.Exception.Message)"
    }
}

function Start-BackendIfNeeded {
    if (Test-TcpPort -Port 8000) {
        Write-StackLog "backend port already listening"
        return
    }
    if (-not (Test-Path -LiteralPath $Python)) {
        throw "python not found at $Python"
    }
    if (-not (Test-Path -LiteralPath $Backend)) {
        throw "backend path missing at $Backend"
    }
    Write-StackLog "starting uvicorn backend"
    Start-Process -FilePath $Python `
        -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "debug") `
        -WorkingDirectory $Backend `
        -WindowStyle Hidden `
        -RedirectStandardOutput $ApiOut `
        -RedirectStandardError $ApiErr
}

function Start-StaticIfNeeded {
    if (Test-TcpPort -Port 3200) {
        Write-StackLog "static frontend port already listening"
        return
    }

    $staticTask = Get-ScheduledTask -TaskName "ANTIGRAVITY-DateApp-Static-3200-SYSTEM" -ErrorAction SilentlyContinue
    if ($staticTask) {
        Write-StackLog "starting static frontend task"
        Start-ScheduledTask -TaskName "ANTIGRAVITY-DateApp-Static-3200-SYSTEM"
        return
    }

    if (-not (Test-Path -LiteralPath $StaticLauncher)) {
        Write-StackLog "static frontend task and launcher are missing; continuing because backend serves the public root"
        return
    }
    Write-StackLog "starting static frontend launcher"
    Start-Process -FilePath $StaticLauncher -WindowStyle Hidden
}

function Test-TunnelRunning {
    $service = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq "Running") {
        return $true
    }

    $match = Get-CimInstance Win32_Process |
        Where-Object { $_.CommandLine -match $TunnelProcessPattern } |
        Select-Object -First 1
    return [bool]$match
}

function Start-TunnelIfNeeded {
    if (Test-TunnelRunning) {
        Write-StackLog "cloudflared tunnel already running"
        return
    }
    if (-not (Test-Path -LiteralPath $Cloudflared)) {
        throw "cloudflared not found at $Cloudflared"
    }
    if (-not (Test-Path -LiteralPath $TunnelTokenPath)) {
        throw "tunnel token not found at $TunnelTokenPath"
    }

    $token = (Get-Content -LiteralPath $TunnelTokenPath -Raw).Trim()
    $args = @("tunnel", "--no-autoupdate", "run", "--token", $token)
    Write-StackLog "starting cloudflared in foreground"
    Write-StackLog "startup complete; task will remain running while tunnel is active"
parent of 22d51cba (chore: clean business-only public surfaces)
    & $Cloudflared @args >> $TunnelOut 2>> $TunnelErr
    throw "cloudflared exited with code $LASTEXITCODE; see $TunnelErr"
}

Write-StackLog "startup begin"
Start-DockerBestEffort
Start-BackendIfNeeded
Start-StaticIfNeeded
Wait-TcpPort -Port 5432 -TimeoutSeconds 180
Wait-TcpPort -Port 6379 -TimeoutSeconds 180
Wait-TcpPort -Port 8000 -TimeoutSeconds 240
Wait-HttpOk -Url "http://127.0.0.1:8000/api/v1/health" -TimeoutSeconds 240
Start-TunnelIfNeeded
Write-StackLog "startup complete; stack already running"
