# Starts the T5500 public date-app stack after boot or power loss.
# Order matters: Docker engine, compose services, health checks, then tunnel.

$ErrorActionPreference = "Stop"

$Root = "C:\ANTIGRAVITY"
$Backend = Join-Path $Root "backend\fastapi-app"
$LogDir = Join-Path $Root "logs"
$Log = Join-Path $LogDir "youandinotai-public-stack.log"
$Cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
$TunnelTokenPath = "C:\Users\joshl\.cloudflared\t5500-dateapp.token"
$TunnelOut = Join-Path $LogDir "t5500-dateapp-tunnel.log"
$TunnelErr = Join-Path $LogDir "t5500-dateapp-tunnel.err.log"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-StackLog {
    param([string]$Message)
    $line = "$(Get-Date -Format s) $Message"
    Write-Output $line
    Add-Content -LiteralPath $Log -Value $line
}

function Wait-TcpPort {
    param(
        [int]$Port,
        [int]$TimeoutSeconds = 120
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue) {
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
        [int]$TimeoutSeconds = 180
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 8
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
                Write-StackLog "http ready $Url status=$($response.StatusCode)"
                return
            }
        } catch {
            Start-Sleep -Seconds 3
        }
    }
    throw "Timed out waiting for $Url"
}

Write-StackLog "startup begin"

Set-Service -Name "com.docker.service" -StartupType Automatic
$dockerService = Get-Service -Name "com.docker.service"
if ($dockerService.Status -ne "Running") {
    Write-StackLog "starting Docker service"
    Start-Service -Name "com.docker.service"
}

$dockerDesktop = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
if (Test-Path $dockerDesktop) {
    Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
}

$dockerReady = $false
for ($i = 1; $i -le 36; $i++) {
    & docker info *> $null
    if ($LASTEXITCODE -eq 0) {
        $dockerReady = $true
        break
    }
    Start-Sleep -Seconds 5
}
if (-not $dockerReady) {
    throw "Docker engine did not become ready"
}
Write-StackLog "docker ready"

Set-Location $Backend
foreach ($container in @("uandinotai-postgres", "uandinotai-redis", "redis", "uandinotai-app")) {
    $exists = & docker inspect --format "{{.Name}}" $container 2>$null
    if ($LASTEXITCODE -eq 0 -and $exists) {
        Write-StackLog "starting existing container $container"
        try {
            & docker start $container 2>&1 | ForEach-Object {
                Write-StackLog "docker start ${container}: $_"
            }
        } catch {
            Write-StackLog "docker start ${container} returned non-zero; continuing to health checks"
        }
    }
}

& docker compose --env-file .env up -d
if ($LASTEXITCODE -ne 0) {
    Write-StackLog "docker compose up returned non-zero; continuing to health checks"
}

Wait-TcpPort -Port 5432 -TimeoutSeconds 180
Wait-TcpPort -Port 6379 -TimeoutSeconds 180
Wait-TcpPort -Port 8000 -TimeoutSeconds 240
Wait-HttpOk -Url "http://127.0.0.1:8000/api/v1/health" -TimeoutSeconds 240

if (-not (Test-NetConnection -ComputerName 127.0.0.1 -Port 3200 -InformationLevel Quiet -WarningAction SilentlyContinue)) {
    $staticTask = Get-ScheduledTask -TaskName "ANTIGRAVITY-DateApp-Static-3200-SYSTEM" -ErrorAction SilentlyContinue
    if ($staticTask) {
        Write-StackLog "starting static frontend task"
        Start-ScheduledTask -TaskName "ANTIGRAVITY-DateApp-Static-3200-SYSTEM"
    } else {
        $staticScript = Join-Path $LogDir "start-dateapp-static-3200.cmd"
        if (-not (Test-Path $staticScript)) {
            throw "static frontend task and launcher are missing"
        }
        Write-StackLog "starting static frontend launcher"
        Start-Process -FilePath $staticScript -WindowStyle Hidden
    }
}
Wait-TcpPort -Port 3200 -TimeoutSeconds 120

Get-CimInstance Win32_Process |
    Where-Object { $_.CommandLine -match "cloudflared" -and $_.CommandLine -match "55b400f6-76b3-4795-8897-f10b7115b3cd|t5500-dateapp" } |
    ForEach-Object {
        Write-StackLog "stopping stale cloudflared pid=$($_.ProcessId)"
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }

if (-not (Test-Path $Cloudflared)) {
    throw "cloudflared not found at $Cloudflared"
}
if (-not (Test-Path $TunnelTokenPath)) {
    throw "tunnel token not found at $TunnelTokenPath"
}

$token = (Get-Content -LiteralPath $TunnelTokenPath -Raw).Trim()
$args = @("tunnel", "--no-autoupdate", "run", "--token", $token)
Write-StackLog "starting cloudflared in foreground"
Write-StackLog "startup complete; task will remain running while tunnel is active"
& $Cloudflared @args >> $TunnelOut 2>> $TunnelErr
throw "cloudflared exited with code $LASTEXITCODE; see $TunnelErr"
