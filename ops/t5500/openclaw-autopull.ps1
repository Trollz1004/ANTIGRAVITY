<#
.SYNOPSIS
One-pass T5500 OpenClaw autopull, targeted service restarter, post-pull verifier, and pause way-back.

.DESCRIPTION
Pulls merged main work onto the T5500 without human intervention using fast-forward pull only.
Follows ops/runbook/T5500-NODE-RUNBOOK.md section 3:
- Does nothing when ops\t5500\PAUSE-AUTOPULL exists.
- Does nothing when origin/main is not straight ahead of HEAD.
- Does nothing when a tracked local change touches a file the pull would change.
- Maps changed paths to services:
  * domains/youandinotai.com/backend -> port 8000 (public check: api.youandinotai.com/health)
  * ops/domains-server, domains/onlinerecycle.net, domains/dream-online.net -> port 9160 (public check + picture: onlinerecycle.net)
  * mission-os -> scheduled task "ANTIGRAVITY Mission Control" (port 3130)
  * ops/t5500/keepalive.ps1 -> restart of scheduled task "ANTIGRAVITY T5500 Keepalive"
  * domains/youandinotai.com/frontend -> no restart action (keepalive rebuilds port 3200; public check + picture: youandinotai.com)
- Without -Apply: prints what it would do.
- With -Apply:
  1. Runs git pull --ff-only.
  2. Stops the process owning each mapped port (or restarts the mapped scheduled task).
  3. Waits up to three minutes (180s) for each mapped service to answer on its 192.168.0.15 port.
  4. Checks the public address by content (youandinotai.com, api.youandinotai.com/health, onlinerecycle.net).
  5. Takes one headless picture of each changed public page with ops/eyes/shoot-page.mjs into logs\autopull beside the JSON record.
  6. If a service does not come back or fails its content check, writes FAILED in the JSON record and creates ops\t5500\PAUSE-AUTOPULL without rolling back code by itself.
#>
[CmdletBinding()]
param(
    [switch]$Apply,
    [string]$RepoPath = '',
    [string]$Remote = 'origin',
    [string]$Branch = 'main',
    [string]$NodeHost = '192.168.0.15',
    [int]$BackendPort = 8000,
    [int]$DomainsPort = 9160,
    [int]$FrontendPort = 3200,
    [int]$MissionControlPort = 3130,
    [string]$MissionControlTask = 'ANTIGRAVITY Mission Control',
    [string]$KeepaliveTask = 'ANTIGRAVITY T5500 Keepalive',
    [string]$PublicWebUrl = 'https://youandinotai.com',
    [string]$PublicApiHealthUrl = 'https://api.youandinotai.com/health',
    [string]$PublicRecycleUrl = 'https://onlinerecycle.net',
    [int]$WaitTimeoutSeconds = 180,
    [int]$PollIntervalMs = 2000,
    [string]$ShootPageScript = '',
    [switch]$SkipFetch,
    [switch]$SkipProcessStop
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'
$env:GIT_TERMINAL_PROMPT = '0'

if (-not $RepoPath) {
    $RepoPath = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
} elseif (Test-Path $RepoPath) {
    $RepoPath = (Resolve-Path $RepoPath).Path
}

$PauseFile = Join-Path $RepoPath 'ops\t5500\PAUSE-AUTOPULL'
if (Test-Path $PauseFile) {
    Write-Output "SKIP: ops\t5500\PAUSE-AUTOPULL exists ($PauseFile) - autopull paused."
    exit 0
}

function Invoke-Git([string[]]$GitArgs) {
    $out = & git -C $RepoPath @GitArgs 2>&1
    $code = $LASTEXITCODE
    $text = (($out | ForEach-Object { [string]$_ }) -join "`n").Trim()
    return [pscustomobject]@{
        ExitCode = $code
        Output   = $text
    }
}

function Stop-AutopullPortOwner([int]$Port) {
    $stoppedPids = @()
    if ($SkipProcessStop) {
        return $stoppedPids
    }
    try {
        $conns = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
        $pids = @($conns | ForEach-Object { [int]$_.OwningProcess } | Where-Object { $_ -gt 0 -and $_ -ne $PID } | Select-Object -Unique)
        foreach ($procId in $pids) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            $stoppedPids += $procId
        }
        $waited = 0
        while ($waited -lt 50 -and (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)) {
            Start-Sleep -Milliseconds 100
            $waited++
        }
    } catch {}
    return $stoppedPids
}

function Restart-AutopullTask([string]$TaskName) {
    if ($SkipProcessStop) {
        return 'skipped'
    }
    try {
        $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        if (-not $task) {
            return 'task-not-registered'
        }
        if ($task.State -eq 'Running') {
            Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
        Start-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        return 'restarted'
    } catch {
        return ('error: ' + $_.Exception.Message)
    }
}

function Get-AutopullProbeHeaders {
    $hdr = @{}
    $tok = [Environment]::GetEnvironmentVariable('FLEET_SHARED_TOKEN')
    if ($tok -and $tok.Trim()) {
        $clean = $tok.Trim()
        $hdr['X-Mission-OS-Token'] = $clean
        $hdr['X-Fleet-Token'] = $clean
        $hdr['Authorization'] = "Bearer $clean"
    }
    return $hdr
}

function Wait-AutopullServicePort([string]$HostIp, [int]$Port, [string]$HealthPath, [int]$TimeoutSeconds, [int]$IntervalMs) {
    $pathPart = if ($HealthPath -and $HealthPath.StartsWith('/')) { $HealthPath } elseif ($HealthPath) { "/$HealthPath" } else { '/' }
    $probeUrl = "http://${HostIp}:${Port}${pathPart}"
    $hdr = Get-AutopullProbeHeaders
    $deadline = (Get-Date).AddSeconds([Math]::Max(0, $TimeoutSeconds))
    $attempt = 0
    $reqTimeoutSec = [Math]::Max(1, [Math]::Min(5, [Math]::Ceiling([Math]::Max(1, $TimeoutSeconds))))

    do {
        $attempt++
        try {
            $resp = Invoke-WebRequest -Uri $probeUrl -Headers $hdr -UseBasicParsing -TimeoutSec $reqTimeoutSec -ErrorAction Stop
            if ([int]$resp.StatusCode -ge 200 -and [int]$resp.StatusCode -lt 400) {
                return [pscustomobject]@{
                    Answered   = $true
                    Url        = $probeUrl
                    StatusCode = [int]$resp.StatusCode
                    Attempts   = $attempt
                }
            }
        } catch {}

        if ((Get-Date) -lt $deadline) {
            Start-Sleep -Milliseconds ([Math]::Max(50, $IntervalMs))
        }
    } while ((Get-Date) -lt $deadline)

    return [pscustomobject]@{
        Answered   = $false
        Url        = $probeUrl
        StatusCode = 0
        Attempts   = $attempt
    }
}

function Test-AutopullPublicContent([string]$Url, [string]$ExpectedPattern, [int]$TimeoutSeconds, [int]$IntervalMs) {
    $deadline = (Get-Date).AddSeconds([Math]::Max(0, [Math]::Min($TimeoutSeconds, 30)))
    $lastStatus = 0
    $reqTimeoutSec = [Math]::Max(1, [Math]::Min(10, [Math]::Ceiling([Math]::Max(1, $TimeoutSeconds))))

    do {
        try {
            $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $reqTimeoutSec -ErrorAction Stop
            $lastStatus = [int]$resp.StatusCode
            $body = [string]$resp.Content
            if ($lastStatus -eq 200 -and (-not $ExpectedPattern -or ($body -match $ExpectedPattern))) {
                return [pscustomobject]@{
                    Passed     = $true
                    Url        = $Url
                    StatusCode = $lastStatus
                    Pattern    = $ExpectedPattern
                }
            }
        } catch {}

        if ((Get-Date) -lt $deadline) {
            Start-Sleep -Milliseconds ([Math]::Max(50, $IntervalMs))
        }
    } while ((Get-Date) -lt $deadline)

    return [pscustomobject]@{
        Passed     = $false
        Url        = $Url
        StatusCode = $lastStatus
        Pattern    = $ExpectedPattern
    }
}

function Invoke-AutopullShootPage([string]$PageAddress, [string]$PublicUrl, [string]$OutDir, [string]$StampPrefix) {
    $scriptCandidate = $ShootPageScript
    if (-not $scriptCandidate) {
        $inRepo = Join-Path $RepoPath 'ops\eyes\shoot-page.mjs'
        if (Test-Path $inRepo) {
            $scriptCandidate = $inRepo
        } else {
            $fallbackRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
            $scriptCandidate = Join-Path $fallbackRoot 'ops\eyes\shoot-page.mjs'
        }
    }

    if (-not (Test-Path $scriptCandidate)) {
        return [pscustomobject]@{
            Taken       = $false
            PicturePath = ''
            Output      = "shoot-page.mjs not found at $scriptCandidate"
        }
    }

    $safeSlug = ($PageAddress -replace '[^A-Za-z0-9._-]', '-')
    $picName = "${StampPrefix}-${safeSlug}"
    $out = & node $scriptCandidate --url $PublicUrl --route '/' --out $OutDir --name $picName --selector 'body' 2>&1
    $exitCode = $LASTEXITCODE
    $outText = (($out | ForEach-Object { [string]$_ }) -join "`n").Trim()

    $directPng = Join-Path $OutDir "${picName}.png"
    $desktopPng = Join-Path $OutDir "${picName}-DESKTOP.png"
    $resolvedPng = if (Test-Path $directPng) { $directPng } elseif (Test-Path $desktopPng) { $desktopPng } else { '' }

    return [pscustomobject]@{
        Taken       = ($exitCode -eq 0 -and [bool]$resolvedPng)
        PicturePath = $resolvedPng
        Output      = $outText
    }
}

if (-not $SkipFetch) {
    $fetchRes = Invoke-Git @('fetch', $Remote, $Branch, '--quiet')
    if ($fetchRes.ExitCode -ne 0) {
        Write-Output ("SKIP: git fetch $Remote $Branch failed: " + $fetchRes.Output)
        exit 0
    }
}

$RemoteRef = "$Remote/$Branch"
$headRes = Invoke-Git @('rev-parse', 'HEAD')
$remoteRes = Invoke-Git @('rev-parse', $RemoteRef)

if ($headRes.ExitCode -ne 0 -or -not $headRes.Output -or $remoteRes.ExitCode -ne 0 -or -not $remoteRes.Output) {
    Write-Output "SKIP: unable to resolve HEAD or $RemoteRef."
    exit 0
}

$OldCommit = $headRes.Output.Trim()
$NewCommit = $remoteRes.Output.Trim()

if ($OldCommit -eq $NewCommit) {
    Write-Output "SKIP: $RemoteRef is already at HEAD ($OldCommit) - nothing to do."
    exit 0
}

$ancestorRes = Invoke-Git @('merge-base', '--is-ancestor', 'HEAD', $RemoteRef)
if ($ancestorRes.ExitCode -ne 0) {
    Write-Output "SKIP: $RemoteRef ($NewCommit) is not straight ahead of HEAD ($OldCommit) - refusing non-fast-forward."
    exit 0
}

$aheadRes = Invoke-Git @('rev-list', '--count', "HEAD..$RemoteRef")
$aheadCount = 0
if ($aheadRes.ExitCode -eq 0 -and $aheadRes.Output) {
    [void][int]::TryParse($aheadRes.Output.Trim(), [ref]$aheadCount)
}
if ($aheadCount -le 0) {
    Write-Output "SKIP: $RemoteRef ($NewCommit) is not straight ahead of HEAD ($OldCommit)."
    exit 0
}

$diffRes = Invoke-Git @('diff', '--name-only', "$OldCommit..$NewCommit")
$ChangedFiles = @()
if ($diffRes.Output) {
    $ChangedFiles = @(
        $diffRes.Output -split "`r?`n" |
            ForEach-Object { ($_.Trim() -replace '\\', '/') } |
            Where-Object { $_ -ne '' }
    )
}

$localUnstaged = Invoke-Git @('diff', '--name-only')
$localStaged = Invoke-Git @('diff', '--cached', '--name-only')
$localHead = Invoke-Git @('diff', '--name-only', 'HEAD')

$LocalTrackedFiles = @(
    @(
        ($localUnstaged.Output -split "`r?`n"),
        ($localStaged.Output -split "`r?`n"),
        ($localHead.Output -split "`r?`n")
    ) |
        ForEach-Object { $_ } |
        ForEach-Object { ($_.Trim() -replace '\\', '/') } |
        Where-Object { $_ -ne '' } |
        Select-Object -Unique
)

$pullLookup = @{}
foreach ($f in $ChangedFiles) {
    $pullLookup[$f.ToLowerInvariant()] = $f
}

$OverlappingFiles = @()
foreach ($lf in $LocalTrackedFiles) {
    $k = $lf.ToLowerInvariant()
    if ($pullLookup.ContainsKey($k)) {
        $OverlappingFiles += $pullLookup[$k]
    }
}

if ($OverlappingFiles.Count -gt 0) {
    Write-Output ('SKIP: tracked local change touches file(s) the pull would change: ' + ($OverlappingFiles -join ', '))
    exit 0
}

$needBackend8000 = $false
$needDomains9160 = $false
$needMissionControl = $false
$needKeepaliveRestart = $false
$frontendChanged = $false

foreach ($file in $ChangedFiles) {
    if ($file -match '^domains/youandinotai\.com/backend(?:/|$)') {
        $needBackend8000 = $true
    } elseif ($file -match '^(?:ops/domains-server|domains/onlinerecycle\.net|domains/dream-online\.net)(?:/|$)') {
        $needDomains9160 = $true
    } elseif ($file -match '^mission-os(?:/|$)') {
        $needMissionControl = $true
    } elseif ($file -ieq 'ops/t5500/keepalive.ps1') {
        $needKeepaliveRestart = $true
    } elseif ($file -match '^domains/youandinotai\.com/frontend(?:/|$)') {
        $frontendChanged = $true
    }
}

$MappedServices = @()
if ($needBackend8000) {
    $MappedServices += [ordered]@{
        service         = 'date-app-api'
        kind            = 'port'
        port            = 8000
        stopPort        = $BackendPort
        checkPort       = $BackendPort
        healthPath      = '/health'
        publicAddress   = 'api.youandinotai.com/health'
        publicUrl       = $PublicApiHealthUrl
        expectedContent = '(?:ok|"db_connected"\s*:\s*true)'
        isPublicPage    = $false
        target          = '8000'
        action          = 'stop-port:8000'
    }
}
if ($needDomains9160) {
    $MappedServices += [ordered]@{
        service         = 'domains-server'
        kind            = 'port'
        port            = 9160
        stopPort        = $DomainsPort
        checkPort       = $DomainsPort
        healthPath      = '/health'
        publicAddress   = 'onlinerecycle.net'
        publicUrl       = $PublicRecycleUrl
        expectedContent = 'OnlineRecycle'
        isPublicPage    = $true
        target          = '9160'
        action          = 'stop-port:9160'
    }
}
if ($needMissionControl) {
    $MappedServices += [ordered]@{
        service         = 'mission-os'
        kind            = 'task'
        task            = $MissionControlTask
        port            = 3130
        checkPort       = $MissionControlPort
        healthPath      = '/live'
        publicAddress   = ''
        publicUrl       = ''
        expectedContent = ''
        isPublicPage    = $false
        target          = $MissionControlTask
        action          = "restart-task:$MissionControlTask"
    }
}
if ($needKeepaliveRestart) {
    $MappedServices += [ordered]@{
        service         = 'keepalive'
        kind            = 'task'
        task            = $KeepaliveTask
        port            = 0
        checkPort       = 0
        healthPath      = ''
        publicAddress   = ''
        publicUrl       = ''
        expectedContent = ''
        isPublicPage    = $false
        target          = $KeepaliveTask
        action          = "restart-task:$KeepaliveTask"
    }
}

if (-not $Apply) {
    Write-Output "Mode: DRY-RUN (pass -Apply to pull and restart changed services)"
    Write-Output "RepoPath: $RepoPath"
    Write-Output "OldCommit: $OldCommit"
    Write-Output "NewCommit: $NewCommit"
    Write-Output "Would run: git pull --ff-only $Remote $Branch"
    foreach ($svc in $MappedServices) {
        if ($svc.kind -eq 'port') {
            Write-Output ("Would stop process owning port {0} ({1})" -f $svc.port, $svc.action)
            Write-Output ("Would wait up to {0}s for {1}:{2}{3} to answer" -f $WaitTimeoutSeconds, $NodeHost, $svc.checkPort, $svc.healthPath)
        } else {
            Write-Output ("Would restart scheduled task '{0}' ({1})" -f $svc.task, $svc.action)
            if ($svc.checkPort -gt 0) {
                Write-Output ("Would wait up to {0}s for {1}:{2}{3} to answer" -f $WaitTimeoutSeconds, $NodeHost, $svc.checkPort, $svc.healthPath)
            }
        }
        if ($svc.publicAddress) {
            Write-Output ("Would check public address {0} ({1}) by content" -f $svc.publicAddress, $svc.publicUrl)
        }
        if ($svc.isPublicPage) {
            Write-Output ("Would take one headless picture of {0} with ops/eyes/shoot-page.mjs into logs\autopull" -f $svc.publicAddress)
        }
    }
    if ($frontendChanged) {
        Write-Output "Frontend changed (domains/youandinotai.com/frontend): no action needed because the keepalive rebuilds the site."
        Write-Output ("Would wait up to {0}s for {1}:{2}/ to answer, check public address youandinotai.com ({3}) by content, and take one headless picture with ops/eyes/shoot-page.mjs into logs\autopull" -f $WaitTimeoutSeconds, $NodeHost, $FrontendPort, $PublicWebUrl)
    }
    if ($MappedServices.Count -eq 0 -and -not $frontendChanged) {
        Write-Output "No mapped service restarts needed."
    }
    exit 0
}

Write-Output "Mode: APPLY"
$pullRes = Invoke-Git @('pull', '--ff-only', $Remote, $Branch)
if ($pullRes.ExitCode -ne 0) {
    Write-Output ("ERROR: git pull --ff-only failed: " + $pullRes.Output)
    exit 1
}

$afterHeadRes = Invoke-Git @('rev-parse', 'HEAD')
$AppliedCommit = if ($afterHeadRes.ExitCode -eq 0 -and $afterHeadRes.Output) { $afterHeadRes.Output.Trim() } else { $NewCommit }

$LogDir = Join-Path $RepoPath 'logs\autopull'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$NowUtc = (Get-Date).ToUniversalTime()
$IsoTime = $NowUtc.ToString('o')
$Stamp = $NowUtc.ToString('yyyyMMdd-HHmmss-fff')
$ShortSha = if ($AppliedCommit.Length -ge 8) { $AppliedCommit.Substring(0, 8) } else { $AppliedCommit }
$StampPrefix = "autopull-{0}-{1}" -f $Stamp, $ShortSha
$RecordPath = Join-Path $LogDir ("{0}.json" -f $StampPrefix)

$RecordedServices = @()
foreach ($svc in $MappedServices) {
    if ($svc.kind -eq 'port') {
        $pids = @(Stop-AutopullPortOwner -Port ([int]$svc.stopPort))
        Write-Output ("Stopped port {0} owner (runtimePort={1}, pids={2})" -f $svc.port, $svc.stopPort, ($pids -join ','))
        $RecordedServices += [ordered]@{
            service         = $svc.service
            kind            = 'port'
            port            = $svc.port
            checkPort       = $svc.checkPort
            healthPath      = $svc.healthPath
            publicAddress   = $svc.publicAddress
            publicUrl       = $svc.publicUrl
            expectedContent = $svc.expectedContent
            isPublicPage    = $svc.isPublicPage
            target          = $svc.target
            action          = $svc.action
            stoppedPids     = $pids
            status          = 'PENDING'
        }
    } else {
        $taskStatus = Restart-AutopullTask -TaskName ([string]$svc.task)
        Write-Output ("Restarted task '{0}' (status={1})" -f $svc.task, $taskStatus)
        $RecordedServices += [ordered]@{
            service         = $svc.service
            kind            = 'task'
            task            = $svc.task
            port            = $svc.port
            checkPort       = $svc.checkPort
            healthPath      = $svc.healthPath
            publicAddress   = $svc.publicAddress
            publicUrl       = $svc.publicUrl
            expectedContent = $svc.expectedContent
            isPublicPage    = $svc.isPublicPage
            target          = $svc.target
            action          = $svc.action
            taskStatus      = $taskStatus
            status          = 'PENDING'
        }
    }
}

if ($frontendChanged) {
    Write-Output "Frontend changed (domains/youandinotai.com/frontend): no action needed because the keepalive rebuilds the site."
    $RecordedServices += [ordered]@{
        service         = 'date-app-web'
        kind            = 'frontend'
        port            = 3200
        checkPort       = $FrontendPort
        healthPath      = '/'
        publicAddress   = 'youandinotai.com'
        publicUrl       = $PublicWebUrl
        expectedContent = '(?:assets/index-|YouAndINotAI|<!DOCTYPE html>)'
        isPublicPage    = $true
        target          = '3200'
        action          = 'keepalive-rebuild:3200'
        status          = 'PENDING'
    }
}

$PublicChecks = @()
$Pictures = @()
$FailedReasons = @()

foreach ($rec in $RecordedServices) {
    if ([int]$rec.checkPort -le 0) {
        $rec.status = 'LIVE'
        continue
    }

    if ($rec.kind -eq 'task' -and $rec.taskStatus -eq 'task-not-registered') {
        $rec.status = 'LIVE'
        continue
    }

    $portCheck = Wait-AutopullServicePort -HostIp $NodeHost -Port ([int]$rec.checkPort) -HealthPath ([string]$rec.healthPath) -TimeoutSeconds $WaitTimeoutSeconds -IntervalMs $PollIntervalMs
    $rec['portHost'] = $NodeHost
    $rec['portAnswered'] = [bool]$portCheck.Answered
    $rec['portProbeUrl'] = [string]$portCheck.Url

    if (-not $portCheck.Answered) {
        $rec.status = 'FAILED'
        $reason = "Service $($rec.service) did not answer on ${NodeHost}:$($rec.checkPort) within ${WaitTimeoutSeconds}s"
        $FailedReasons += $reason
        Write-Output "FAILED: $reason"
        continue
    }

    Write-Output ("Verified {0} answered on {1}:{2}" -f $rec.service, $NodeHost, $rec.checkPort)

    if ($rec.publicUrl) {
        $pubCheck = Test-AutopullPublicContent -Url ([string]$rec.publicUrl) -ExpectedPattern ([string]$rec.expectedContent) -TimeoutSeconds $WaitTimeoutSeconds -IntervalMs $PollIntervalMs
        $rec['publicCheckPassed'] = [bool]$pubCheck.Passed
        $picPath = ''

        if ($pubCheck.Passed -and $rec.isPublicPage) {
            $shotRes = Invoke-AutopullShootPage -PageAddress ([string]$rec.publicAddress) -PublicUrl ([string]$rec.publicUrl) -OutDir $LogDir -StampPrefix $StampPrefix
            if ($shotRes.PicturePath) {
                $picPath = $shotRes.PicturePath
                $Pictures += $picPath
                $rec['picture'] = $picPath
                Write-Output ("Captured headless picture for {0}: {1}" -f $rec.publicAddress, $picPath)
            }
        }

        $PublicChecks += [ordered]@{
            address         = $rec.publicAddress
            url             = $rec.publicUrl
            expectedContent = $rec.expectedContent
            passed          = [bool]$pubCheck.Passed
            status          = if ($pubCheck.Passed) { 'LIVE' } else { 'FAILED' }
            picture         = $picPath
        }

        if (-not $pubCheck.Passed) {
            $rec.status = 'FAILED'
            $reason = "Public content check failed for $($rec.publicAddress) ($($rec.publicUrl))"
            $FailedReasons += $reason
            Write-Output "FAILED: $reason"
            continue
        }

        Write-Output ("Verified public content for {0} ({1})" -f $rec.publicAddress, $rec.publicUrl)
    }

    $rec.status = 'LIVE'
}

$OverallStatus = if ($FailedReasons.Count -gt 0) { 'FAILED' } else { 'LIVE' }
$PausedAutopull = $false

if ($OverallStatus -eq 'FAILED') {
    $pauseLines = @(
        "status: FAILED",
        "time: $IsoTime",
        "oldCommit: $OldCommit",
        "newCommit: $AppliedCommit",
        ("reasons: " + ($FailedReasons -join '; '))
    )
    $pauseText = ($pauseLines -join "`n") + "`n"
    $pauseDir = [IO.Path]::GetDirectoryName($PauseFile)
    if ($pauseDir -and -not (Test-Path $pauseDir)) {
        New-Item -ItemType Directory -Force -Path $pauseDir | Out-Null
    }
    [IO.File]::WriteAllText($PauseFile, $pauseText, (New-Object Text.UTF8Encoding $false))
    $PausedAutopull = $true
    Write-Output "FAILED: Created ops\t5500\PAUSE-AUTOPULL ($PauseFile) so the next pass does not make it worse."
}

$RecordObj = [ordered]@{
    time             = $IsoTime
    status           = $OverallStatus
    result           = $OverallStatus
    live             = ($OverallStatus -eq 'LIVE')
    oldCommit        = $OldCommit
    newCommit        = $AppliedCommit
    changedServices  = @($RecordedServices)
    publicChecks     = @($PublicChecks)
    pictures         = @($Pictures)
    pausedAutopull   = $PausedAutopull
    failedReasons    = @($FailedReasons)
    old_commit       = $OldCommit
    new_commit       = $AppliedCommit
    changed_services = @($RecordedServices)
    changedFiles     = @($ChangedFiles)
}

$JsonText = ($RecordObj | ConvertTo-Json -Depth 7) + "`n"
[IO.File]::WriteAllText($RecordPath, $JsonText, (New-Object Text.UTF8Encoding $false))

Write-Output "Pulled $OldCommit -> $AppliedCommit ($OverallStatus)"
Write-Output "Record: $RecordPath"
if ($OverallStatus -eq 'FAILED') {
    exit 1
}
exit 0
