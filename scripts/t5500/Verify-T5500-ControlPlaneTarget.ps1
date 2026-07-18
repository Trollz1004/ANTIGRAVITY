[CmdletBinding()]
param(
    [string]$ExpectedHostname = 'DESKTOP-H4B53GL',
    [string]$OmniRouteBaseUrl = $env:OMNIROUTE_BASE_URL
)

$ErrorActionPreference = 'SilentlyContinue'

function Get-TaskSummary {
    param([string]$Name)

    $task = Get-ScheduledTask -TaskName $Name -ErrorAction SilentlyContinue
    if (-not $task) {
        return [ordered]@{ name = $Name; exists = $false; state = 'Missing'; lastResult = $null }
    }

    $info = Get-ScheduledTaskInfo -TaskName $Name -ErrorAction SilentlyContinue
    return [ordered]@{
        name       = $Name
        exists     = $true
        state      = [string]$task.State
        lastResult = if ($info) { $info.LastTaskResult } else { $null }
    }
}

function Test-HttpStatus {
    param(
        [Parameter(Mandatory = $true)][string]$Uri,
        [hashtable]$Headers = @{}
    )

    try {
        $response = Invoke-WebRequest -Uri $Uri -Headers $Headers -UseBasicParsing -TimeoutSec 8
        return [ordered]@{ reachable = $true; status = [int]$response.StatusCode; error = $null }
    } catch {
        $status = $null
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $status = [int]$_.Exception.Response.StatusCode
        }
        return [ordered]@{ reachable = ($null -ne $status); status = $status; error = $_.Exception.Message }
    }
}

$knownPorts = @(8000, 9119, 11436, 18789, 20128, 20129, 20131, 20132, 3130, 3140)
$listeners = @(
    Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $knownPorts -contains $_.LocalPort } |
        Sort-Object LocalPort, LocalAddress |
        ForEach-Object {
            [ordered]@{
                address = $_.LocalAddress
                port    = $_.LocalPort
                pid     = $_.OwningProcess
            }
        }
)

$repo = 'C:\ANTIGRAVITY'
$repoExists = Test-Path (Join-Path $repo '.git')
$repoBranch = $null
$repoHead = $null
$repoDirtyEntries = $null
if ($repoExists -and (Get-Command git -ErrorAction SilentlyContinue)) {
    $repoBranch = (git -C $repo branch --show-current 2>$null | Select-Object -First 1)
    $repoHead = (git -C $repo rev-parse --short HEAD 2>$null | Select-Object -First 1)
    $repoDirtyEntries = @((git -C $repo status --porcelain 2>$null)).Count
}

$nodeAgentTask = Get-TaskSummary -Name 'NodeAgent-T5500'
$port3140Listeners = @($listeners | Where-Object { $_.port -eq 3140 })
$unsafeNodeAgentDisabled = (-not $nodeAgentTask.exists) -or ($nodeAgentTask.state -eq 'Disabled')

$omniRoute = [ordered]@{
    configured = -not [string]::IsNullOrWhiteSpace($OmniRouteBaseUrl)
    baseUrl    = if ([string]::IsNullOrWhiteSpace($OmniRouteBaseUrl)) { $null } else { '[CONFIGURED]' }
    apiKey     = if ([string]::IsNullOrWhiteSpace($env:OMNIROUTE_API_KEY)) { 'MISSING' } else { 'PRESENT' }
    probe      = $null
}

if ($omniRoute.configured) {
    $base = $OmniRouteBaseUrl.TrimEnd('/')
    $modelsUri = if ($base.EndsWith('/v1')) { "$base/models" } else { "$base/v1/models" }
    $headers = @{}
    if (-not [string]::IsNullOrWhiteSpace($env:OMNIROUTE_API_KEY)) {
        $headers.Authorization = "Bearer $($env:OMNIROUTE_API_KEY)"
    }
    $omniRoute.probe = Test-HttpStatus -Uri $modelsUri -Headers $headers
}

$result = [ordered]@{
    checkedAt = (Get-Date).ToString('o')
    node = [ordered]@{
        hostname = $env:COMPUTERNAME
        expected = $ExpectedHostname
        matches  = ($env:COMPUTERNAME -eq $ExpectedHostname)
        identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    }
    paths = [ordered]@{
        repoC = Test-Path 'C:\ANTIGRAVITY'
        repoE = Test-Path 'E:\ANTIGRAVITY'
        mcpDirectory = Test-Path 'C:\antigravity-mcp'
        mcpDirectoryHasFiles = @((Get-ChildItem 'C:\antigravity-mcp' -Force -ErrorAction SilentlyContinue)).Count -gt 0
    }
    repo = [ordered]@{
        exists       = $repoExists
        branch       = $repoBranch
        head         = $repoHead
        dirtyEntries = $repoDirtyEntries
    }
    tasks = @(
        $nodeAgentTask
        (Get-TaskSummary -Name 'ANTIGRAVITY-Bootstrap')
        (Get-TaskSummary -Name 'OpenClaw Gateway')
        (Get-TaskSummary -Name 'Hermes_Dashboard_9119')
        (Get-TaskSummary -Name 'ANTIGRAVITY-OmniRouter-11436')
    )
    listeners = $listeners
    safety = [ordered]@{
        unsafeNodeAgentDisabled = $unsafeNodeAgentDisabled
        port3140ListenerCount   = $port3140Listeners.Count
        noT5500OmniRoutePorts   = @($listeners | Where-Object { $_.port -in @(20128, 20129, 20131, 20132) }).Count -eq 0
    }
    omniRouteControlPlane = $omniRoute
}

$result | ConvertTo-Json -Depth 8

if (-not $result.node.matches -or -not $unsafeNodeAgentDisabled) {
    exit 1
}

exit 0
