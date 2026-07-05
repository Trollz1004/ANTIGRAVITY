param(
    [switch]$NoRepair,
    [switch]$DeployPagesOnPublicDown,
    [string]$RepoRoot = "C:\antigravity",
    [string]$StaticDeployDir = "C:\antigravity\frontend\react-app\dist",
    [string]$PagesProjectName = "youandinotai",
    [string]$RuntimeEnvFile = "C:\ProgramData\Antigravity\secrets\cloudflare-wrangler.env",
    [string]$FallbackRuntimeEnvFile = "C:\Users\joshl\OneDrive\Personal Vault\ENV-AUTHORITY-20260608-082127\derived-platform-envs\runtime-misc.env",
    [int]$TimeoutSec = 10
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

$LogDir = Join-Path $RepoRoot "logs\ops-watchdog"
$LogFile = Join-Path $LogDir "dateapp-ops-watchdog.jsonl"
$RunId = [guid]::NewGuid().ToString()
$script:RequiredFailures = New-Object System.Collections.Generic.List[string]
$script:WarnFailures = New-Object System.Collections.Generic.List[string]

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-OpsEvent {
    param(
        [string]$Agent,
        [string]$Level,
        [string]$Message,
        [hashtable]$Data = @{}
    )

    $record = [ordered]@{
        ts = (Get-Date).ToString("o")
        run_id = $RunId
        agent = $Agent
        level = $Level
        message = $Message
        data = $Data
    }
    $json = $record | ConvertTo-Json -Depth 8 -Compress
    Add-Content -LiteralPath $LogFile -Value $json -Encoding UTF8
    Write-Host "[$Level][$Agent] $Message"
}

function Add-Failure {
    param(
        [string]$Name,
        [string]$Message,
        [switch]$WarnOnly
    )
    if ($WarnOnly) {
        $script:WarnFailures.Add("${Name}: $Message") | Out-Null
    } else {
        $script:RequiredFailures.Add("${Name}: $Message") | Out-Null
    }
}

function Import-RuntimeEnvSafe {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        Write-OpsEvent -Agent "env-agent" -Level "warn" -Message "Runtime env file not available" -Data @{ path = $Path }
        return
    }

    $loaded = New-Object System.Collections.Generic.List[string]
    $allowed = "^(CLOUDFLARE_|CF_|WRANGLER_)"
    foreach ($line in Get-Content -LiteralPath $Path -ErrorAction SilentlyContinue) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
        if ($trimmed -notmatch "^([A-Za-z_][A-Za-z0-9_]*)=(.*)$") { continue }
        $key = $matches[1]
        $value = $matches[2].Trim()
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        if ($key -match $allowed) {
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
            $loaded.Add($key) | Out-Null
        }
    }

    Write-OpsEvent -Agent "env-agent" -Level "green" -Message "Runtime env loaded for Cloudflare/Wrangler" -Data @{ keys = @($loaded) }
}

function Get-WranglerPath {
    $cmd = Get-Command wrangler.cmd -ErrorAction SilentlyContinue
    if ($cmd -and (Test-Path -LiteralPath $cmd.Source)) { return $cmd.Source }

    $cmd = Get-Command wrangler -ErrorAction SilentlyContinue
    if ($cmd -and (Test-Path -LiteralPath $cmd.Source)) { return $cmd.Source }

    $candidates = @(
        "C:\Users\joshl\AppData\Roaming\npm\wrangler.cmd",
        "C:\Program Files\nodejs\wrangler.cmd"
    )

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) { return $candidate }
    }

    return $null
}

function Test-HttpHealth {
    param(
        [string]$Agent,
        [string]$Name,
        [string]$Url,
        [switch]$WarnOnly
    )

    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec $TimeoutSec -MaximumRedirection 5
        $code = [int]$response.StatusCode
        if ($code -ge 200 -and $code -lt 400) {
            Write-OpsEvent -Agent $Agent -Level "green" -Message "$Name returned $code" -Data @{ url = $Url; status = $code }
            return $true
        }
        Write-OpsEvent -Agent $Agent -Level "red" -Message "$Name returned $code" -Data @{ url = $Url; status = $code }
        Add-Failure -Name $Name -Message "HTTP $code" -WarnOnly:$WarnOnly
        return $false
    } catch {
        $msg = $_.Exception.Message
        Write-OpsEvent -Agent $Agent -Level "red" -Message "$Name failed" -Data @{ url = $Url; error = $msg }
        Add-Failure -Name $Name -Message $msg -WarnOnly:$WarnOnly
        return $false
    }
}

function Test-LocalPort {
    param(
        [string]$Agent,
        [string]$Name,
        [int]$Port,
        [switch]$WarnOnly
    )

    $listening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.LocalPort -eq $Port }

    if ($listening) {
        Write-OpsEvent -Agent $Agent -Level "green" -Message "$Name port $Port is listening" -Data @{ port = $Port; pids = @($listening | Select-Object -ExpandProperty OwningProcess -Unique) }
        return $true
    }

    Write-OpsEvent -Agent $Agent -Level "red" -Message "$Name port $Port is not listening" -Data @{ port = $Port }
    Add-Failure -Name $Name -Message "port $Port not listening" -WarnOnly:$WarnOnly
    return $false
}

function Get-TaskState {
    param([string]$TaskName)
    $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if (-not $task) { return $null }
    return $task.State
}

function Start-RepairTask {
    param(
        [string]$Agent,
        [string]$TaskName,
        [switch]$Restart
    )

    $state = Get-TaskState -TaskName $TaskName
    if (-not $state) {
        Write-OpsEvent -Agent $Agent -Level "red" -Message "Scheduled task missing: $TaskName"
        Add-Failure -Name $TaskName -Message "scheduled task missing"
        return $false
    }

    if ($NoRepair) {
        Write-OpsEvent -Agent $Agent -Level "warn" -Message "Repair disabled for task $TaskName" -Data @{ state = "$state" }
        return $false
    }

    try {
        if ($Restart -and $state -eq "Running") {
            Write-OpsEvent -Agent $Agent -Level "warn" -Message "Stopping task for repair: $TaskName"
            Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 5
        }

        Write-OpsEvent -Agent $Agent -Level "warn" -Message "Starting task for repair: $TaskName" -Data @{ previous_state = "$state" }
        Start-ScheduledTask -TaskName $TaskName
        return $true
    } catch {
        Write-OpsEvent -Agent $Agent -Level "red" -Message "Failed to start task $TaskName" -Data @{ error = $_.Exception.Message }
        Add-Failure -Name $TaskName -Message $_.Exception.Message
        return $false
    }
}

function Invoke-SystemAgent {
    $os = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue
    if ($os) {
        Write-OpsEvent -Agent "system-agent" -Level "green" -Message "System memory snapshot" -Data @{
            free_gb = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
            total_gb = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
        }
    }

    $top = Get-Process -ErrorAction SilentlyContinue |
        Sort-Object WorkingSet64 -Descending |
        Select-Object -First 6 Id, ProcessName, @{Name = "WSMB"; Expression = { [math]::Round($_.WorkingSet64 / 1MB, 1) }}

    Write-OpsEvent -Agent "system-agent" -Level "green" -Message "Top memory processes recorded" -Data @{ processes = @($top) }
}

function Invoke-WranglerPagesAgent {
    $wrangler = Get-WranglerPath

    if (-not $wrangler) {
        Write-OpsEvent -Agent "wrangler-pages-agent" -Level "red" -Message "Wrangler is not on PATH"
        Add-Failure -Name "wrangler" -Message "not on PATH"
        return
    }

    $version = & $wrangler --version 2>&1
    Write-OpsEvent -Agent "wrangler-pages-agent" -Level "green" -Message "Wrangler available" -Data @{ path = $wrangler; version = ($version -join "`n") }

    $whoami = & $wrangler whoami 2>&1
    $whoamiText = ($whoami -join "`n")
    if ($LASTEXITCODE -eq 0) {
        Write-OpsEvent -Agent "wrangler-pages-agent" -Level "green" -Message "Wrangler auth available" -Data @{ result = $whoamiText }
    } else {
        Write-OpsEvent -Agent "wrangler-pages-agent" -Level "red" -Message "Wrangler auth check failed" -Data @{ result = $whoamiText }
        Add-Failure -Name "wrangler auth" -Message "whoami failed"
        return
    }

    $deployments = & $wrangler pages deployment list --project-name $PagesProjectName 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-OpsEvent -Agent "wrangler-pages-agent" -Level "green" -Message "Cloudflare Pages deployment list reachable" -Data @{
            project = $PagesProjectName
            output = (($deployments -join "`n") | Select-Object -First 1)
        }
    } else {
        Write-OpsEvent -Agent "wrangler-pages-agent" -Level "red" -Message "Cloudflare Pages deployment list failed" -Data @{
            project = $PagesProjectName
            output = ($deployments -join "`n")
        }
        Add-Failure -Name "pages deployment list" -Message "wrangler failed"
    }
}

function Invoke-DateAppLocalAgent {
    $localStatic = Test-HttpHealth -Agent "dateapp-local-agent" -Name "date app local static" -Url "http://127.0.0.1:3200/" -WarnOnly
    if (-not $localStatic) {
        Start-RepairTask -Agent "dateapp-local-agent" -TaskName "ANTIGRAVITY-DateApp-Static-3200-SYSTEM" | Out-Null
        Start-Sleep -Seconds 12
        Test-HttpHealth -Agent "dateapp-local-agent" -Name "date app local static after repair" -Url "http://127.0.0.1:3200/" -WarnOnly | Out-Null
    }

    $localApi = Test-HttpHealth -Agent "dateapp-local-agent" -Name "date app local api" -Url "http://127.0.0.1:8000/api/v1/health" -WarnOnly
    if (-not $localApi) {
        Start-RepairTask -Agent "dateapp-local-agent" -TaskName "ANTIGRAVITY-YouAndINotAI-PublicStack-T5500" | Out-Null
    }
}

function Invoke-PaperclipAgent {
    $paperclip = Test-HttpHealth -Agent "paperclip-agent" -Name "paperclip local api" -Url "http://127.0.0.1:3100/api/health"
    if (-not $paperclip) {
        Start-RepairTask -Agent "paperclip-agent" -TaskName "PaperclipDateAppLoopback" -Restart | Out-Null
        Start-Sleep -Seconds 25
        Test-HttpHealth -Agent "paperclip-agent" -Name "paperclip local api after repair" -Url "http://127.0.0.1:3100/api/health" | Out-Null
    }

    $proxy = Test-HttpHealth -Agent "paperclip-agent" -Name "paperclip private proxy" -Url "http://127.0.0.1:3110/healthz"
    if (-not $proxy) {
        Start-RepairTask -Agent "paperclip-agent" -TaskName "PaperclipPrivateAuthProxy" -Restart | Out-Null
        Start-Sleep -Seconds 10
        Test-HttpHealth -Agent "paperclip-agent" -Name "paperclip private proxy after repair" -Url "http://127.0.0.1:3110/healthz" | Out-Null
    }

    Test-LocalPort -Agent "paperclip-agent" -Name "embedded paperclip postgres" -Port 54329 -WarnOnly | Out-Null
}

function Invoke-CloudflaredAgent {
    $cloudflared = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -eq "cloudflared.exe" }

    if ($cloudflared) {
        Write-OpsEvent -Agent "cloudflared-agent" -Level "green" -Message "cloudflared process is running" -Data @{ count = @($cloudflared).Count }
    } else {
        Write-OpsEvent -Agent "cloudflared-agent" -Level "red" -Message "cloudflared process is not running"
        Start-RepairTask -Agent "cloudflared-agent" -TaskName "ANTIGRAVITY-T5500-DateApp-Cloudflared-SYSTEM" | Out-Null
        Start-Sleep -Seconds 10
    }

    $paperclipPublic = Test-HttpHealth -Agent "cloudflared-agent" -Name "paperclip public health" -Url "https://paperclip.youandinotai.com/healthz"
    $paperclipHqPublic = Test-HttpHealth -Agent "cloudflared-agent" -Name "paperclip hq public health" -Url "https://paperclip-hq.youandinotai.com/healthz"
    $localProxy = Test-HttpHealth -Agent "cloudflared-agent" -Name "paperclip local proxy for tunnel" -Url "http://127.0.0.1:3110/healthz"

    if ((-not $paperclipPublic -or -not $paperclipHqPublic) -and $localProxy -and -not $NoRepair) {
        Write-OpsEvent -Agent "cloudflared-agent" -Level "warn" -Message "Public tunnel unhealthy while local proxy is healthy; restarting cloudflared"
        Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 4
        Start-RepairTask -Agent "cloudflared-agent" -TaskName "ANTIGRAVITY-T5500-DateApp-Cloudflared-SYSTEM" | Out-Null
        Start-Sleep -Seconds 15
        Test-HttpHealth -Agent "cloudflared-agent" -Name "paperclip public health after tunnel repair" -Url "https://paperclip.youandinotai.com/healthz" | Out-Null
        Test-HttpHealth -Agent "cloudflared-agent" -Name "paperclip hq public health after tunnel repair" -Url "https://paperclip-hq.youandinotai.com/healthz" | Out-Null
    }
}

function Invoke-DomainAgent {
    foreach ($hostName in @("youandinotai.com", "www.youandinotai.com", "app.youandinotai.com", "api.youandinotai.com", "paperclip.youandinotai.com", "paperclip-hq.youandinotai.com")) {
        try {
            $records = Resolve-DnsName -Name $hostName -ErrorAction Stop
            Write-OpsEvent -Agent "dns-agent" -Level "green" -Message "DNS resolves for $hostName" -Data @{ name = $hostName; records = @($records | Select-Object -First 5 Name, Type, IPAddress, NameHost) }
        } catch {
            Write-OpsEvent -Agent "dns-agent" -Level "red" -Message "DNS failed for $hostName" -Data @{ name = $hostName; error = $_.Exception.Message }
            Add-Failure -Name "dns $hostName" -Message $_.Exception.Message
        }
    }
}

function Invoke-PublicDateAppAgent {
    $rootOk = Test-HttpHealth -Agent "public-dateapp-agent" -Name "youandinotai root" -Url "https://youandinotai.com/"
    $appOk = Test-HttpHealth -Agent "public-dateapp-agent" -Name "youandinotai app host" -Url "https://app.youandinotai.com/"
    Test-HttpHealth -Agent "public-dateapp-agent" -Name "youandinotai terms" -Url "https://youandinotai.com/terms" | Out-Null
    Test-HttpHealth -Agent "public-dateapp-agent" -Name "youandinotai api v1 health" -Url "https://api.youandinotai.com/api/v1/health" -WarnOnly | Out-Null

    if ($DeployPagesOnPublicDown -and (-not $rootOk -or -not $appOk) -and -not $NoRepair) {
        $wrangler = Get-WranglerPath
        if ($wrangler -and (Test-Path -LiteralPath $StaticDeployDir)) {
            Write-OpsEvent -Agent "public-dateapp-agent" -Level "warn" -Message "Public Pages host down; redeploying static output with Wrangler" -Data @{
                project = $PagesProjectName
                dir = $StaticDeployDir
            }
            Push-Location $RepoRoot
            try {
                $deploy = & $wrangler pages deploy $StaticDeployDir --project-name $PagesProjectName --branch main 2>&1
                $code = $LASTEXITCODE
                Write-OpsEvent -Agent "public-dateapp-agent" -Level ($(if ($code -eq 0) { "green" } else { "red" })) -Message "Wrangler Pages deploy completed" -Data @{
                    exit_code = $code
                    output = ($deploy -join "`n")
                }
                if ($code -ne 0) { Add-Failure -Name "wrangler pages deploy" -Message "exit $code" }
            } finally {
                Pop-Location
            }
        } else {
            Write-OpsEvent -Agent "public-dateapp-agent" -Level "red" -Message "Cannot redeploy Pages: wrangler or static output missing" -Data @{
                has_wrangler = [bool]$wrangler
                static_dir_exists = (Test-Path -LiteralPath $StaticDeployDir)
            }
            Add-Failure -Name "pages redeploy" -Message "wrangler or static output missing"
        }
    }
}

if (Test-Path -LiteralPath $RuntimeEnvFile) {
    Import-RuntimeEnvSafe -Path $RuntimeEnvFile
} else {
    Import-RuntimeEnvSafe -Path $FallbackRuntimeEnvFile
}

Write-OpsEvent -Agent "orchestrator" -Level "green" -Message "T5500 date app ops watchdog started" -Data @{
    repo_root = $RepoRoot
    pages_project = $PagesProjectName
    deploy_pages_on_public_down = [bool]$DeployPagesOnPublicDown
    no_repair = [bool]$NoRepair
    runtime_env_path = $RuntimeEnvFile
    fallback_runtime_env_path = $FallbackRuntimeEnvFile
}

Invoke-SystemAgent
Invoke-DateAppLocalAgent
Invoke-PaperclipAgent
Invoke-CloudflaredAgent
Invoke-DomainAgent
Invoke-WranglerPagesAgent
Invoke-PublicDateAppAgent

$summaryLevel = if ($script:RequiredFailures.Count -eq 0) { "green" } else { "red" }
Write-OpsEvent -Agent "orchestrator" -Level $summaryLevel -Message "T5500 date app ops watchdog finished" -Data @{
    required_failures = @($script:RequiredFailures)
    warnings = @($script:WarnFailures)
}

if ($script:RequiredFailures.Count -gt 0) {
    exit 2
}

exit 0
