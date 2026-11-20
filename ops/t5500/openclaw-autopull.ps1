<#
.SYNOPSIS
One-pass T5500 OpenClaw autopull and targeted service restarter.

.DESCRIPTION
Pulls merged main work onto the T5500 without human intervention using fast-forward pull only.
Follows ops/runbook/T5500-NODE-RUNBOOK.md section 3:
- Does nothing when ops\t5500\PAUSE-AUTOPULL exists.
- Does nothing when origin/main is not straight ahead of HEAD.
- Does nothing when a tracked local change touches a file the pull would change.
- Maps changed paths to services:
  * domains/youandinotai.com/backend -> port 8000
  * ops/domains-server, domains/onlinerecycle.net, domains/dream-online.net -> port 9160
  * mission-os -> scheduled task "ANTIGRAVITY Mission Control"
  * ops/t5500/keepalive.ps1 -> restart of scheduled task "ANTIGRAVITY T5500 Keepalive"
  * domains/youandinotai.com/frontend -> no action (keepalive rebuilds the site)
- Without -Apply: prints what it would do.
- With -Apply: runs git pull --ff-only, stops the process owning each mapped port
  (or restarts the mapped scheduled task), and writes one UTF-8 no-BOM JSON record
  under logs\autopull.
#>
[CmdletBinding()]
param(
    [switch]$Apply,
    [string]$RepoPath = '',
    [string]$Remote = 'origin',
    [string]$Branch = 'main',
    [int]$BackendPort = 8000,
    [int]$DomainsPort = 9160,
    [string]$MissionControlTask = 'ANTIGRAVITY Mission Control',
    [string]$KeepaliveTask = 'ANTIGRAVITY T5500 Keepalive',
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
        service  = 'date-app-api'
        kind     = 'port'
        port     = 8000
        stopPort = $BackendPort
        target   = '8000'
        action   = 'stop-port:8000'
    }
}
if ($needDomains9160) {
    $MappedServices += [ordered]@{
        service  = 'domains-server'
        kind     = 'port'
        port     = 9160
        stopPort = $DomainsPort
        target   = '9160'
        action   = 'stop-port:9160'
    }
}
if ($needMissionControl) {
    $MappedServices += [ordered]@{
        service = 'mission-os'
        kind    = 'task'
        task    = $MissionControlTask
        target  = $MissionControlTask
        action  = "restart-task:$MissionControlTask"
    }
}
if ($needKeepaliveRestart) {
    $MappedServices += [ordered]@{
        service = 'keepalive'
        kind    = 'task'
        task    = $KeepaliveTask
        target  = $KeepaliveTask
        action  = "restart-task:$KeepaliveTask"
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
        } else {
            Write-Output ("Would restart scheduled task '{0}' ({1})" -f $svc.task, $svc.action)
        }
    }
    if ($frontendChanged) {
        Write-Output "Frontend changed (domains/youandinotai.com/frontend): no action needed because the keepalive rebuilds the site."
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

$RecordedServices = @()
foreach ($svc in $MappedServices) {
    if ($svc.kind -eq 'port') {
        $pids = @(Stop-AutopullPortOwner -Port ([int]$svc.stopPort))
        Write-Output ("Stopped port {0} owner (runtimePort={1}, pids={2})" -f $svc.port, $svc.stopPort, ($pids -join ','))
        $RecordedServices += [ordered]@{
            service     = $svc.service
            kind        = 'port'
            port        = $svc.port
            target      = $svc.target
            action      = $svc.action
            stoppedPids = $pids
        }
    } else {
        $taskStatus = Restart-AutopullTask -TaskName ([string]$svc.task)
        Write-Output ("Restarted task '{0}' (status={1})" -f $svc.task, $taskStatus)
        $RecordedServices += [ordered]@{
            service = $svc.service
            kind    = 'task'
            task    = $svc.task
            target  = $svc.target
            action  = $svc.action
            status  = $taskStatus
        }
    }
}

if ($frontendChanged) {
    Write-Output "Frontend changed (domains/youandinotai.com/frontend): no action needed because the keepalive rebuilds the site."
}

$LogDir = Join-Path $RepoPath 'logs\autopull'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$NowUtc = (Get-Date).ToUniversalTime()
$IsoTime = $NowUtc.ToString('o')
$Stamp = $NowUtc.ToString('yyyyMMdd-HHmmss-fff')
$ShortSha = if ($AppliedCommit.Length -ge 8) { $AppliedCommit.Substring(0, 8) } else { $AppliedCommit }
$RecordPath = Join-Path $LogDir ("autopull-{0}-{1}.json" -f $Stamp, $ShortSha)

$RecordObj = [ordered]@{
    time             = $IsoTime
    oldCommit        = $OldCommit
    newCommit        = $AppliedCommit
    changedServices  = @($RecordedServices)
    old_commit       = $OldCommit
    new_commit       = $AppliedCommit
    changed_services = @($RecordedServices)
    changedFiles     = @($ChangedFiles)
}

$JsonText = ($RecordObj | ConvertTo-Json -Depth 6) + "`n"
[IO.File]::WriteAllText($RecordPath, $JsonText, (New-Object Text.UTF8Encoding $false))

Write-Output "Pulled $OldCommit -> $AppliedCommit"
Write-Output "Record: $RecordPath"
exit 0
