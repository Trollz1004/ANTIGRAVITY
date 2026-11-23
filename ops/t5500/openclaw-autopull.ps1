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
  * ops/domains-server, domains/onlinerecycle.net, domains/dream-online.net -> port 9160 (public check: onlinerecycle.net/health commit-specific fields or build stamp; picture: onlinerecycle.net)
  * mission-os -> scheduled task "ANTIGRAVITY Mission Control" (port 3130)
  * ops/t5500/keepalive.ps1 -> restart of scheduled task "ANTIGRAVITY T5500 Keepalive"
  * domains/youandinotai.com/frontend -> no restart action (keepalive rebuilds port 3200; public check + picture: youandinotai.com)
- Without -Apply: prints what it would do.
- With -Apply:
  1. Records the port owner's process id and start time before the pull.
  2. Runs git pull --ff-only.
  3. Stops the process owning each mapped port (or restarts the mapped scheduled task). If Stop-Process is refused, records 'restart refused: access denied' and marks the service FAILED-TO-RESTART (not LIVE) without pausing for that alone.
  4. Waits up to three minutes (180s) for each mapped service to answer on its 192.168.0.15 port, then 127.0.0.1 on the same port, recording which address answered and the port owner's process id and start time after. A restart counts only when the id changed and the new start time is after the pull.
  5. Checks the public address by content (youandinotai.com, api.youandinotai.com/health containing 'status', onlinerecycle.net/health containing the commit-specific field list or a build stamp).
  6. Takes one headless picture of each changed public page with ops/eyes/shoot-page.mjs into logs\autopull beside the JSON record.
  7. Writes FAILED in the JSON record and creates ops\t5500\PAUSE-AUTOPULL only when both the local check and the public check fail, without rolling back code by itself.
  8. Names the pull request numbers merged between oldCommit and newCommit in the JSON record.
#>
[CmdletBinding()]
param(
    [switch]$Apply,
    [string]$RepoPath = '',
    [string]$Remote = 'origin',
    [string]$Branch = 'main',
    [string]$NodeHost = '192.168.0.15',
    [string]$FallbackHost = '127.0.0.1',
    [int]$BackendPort = 8000,
    [int]$DomainsPort = 9160,
    [int]$FrontendPort = 3200,
    [int]$MissionControlPort = 3130,
    [string]$MissionControlTask = 'ANTIGRAVITY Mission Control',
    [string]$KeepaliveTask = 'ANTIGRAVITY T5500 Keepalive',
    [string]$PublicWebUrl = 'https://youandinotai.com',
    [string]$PublicApiHealthUrl = 'https://api.youandinotai.com/health',
    [string]$PublicRecycleUrl = 'https://onlinerecycle.net',
    [string]$PublicRecycleHealthUrl = '',
    [string[]]$DomainsHealthRequiredFields = @(),
    [int]$WaitTimeoutSeconds = 180,
    [int]$PollIntervalMs = 2000,
    [string]$ShootPageScript = '',
    [switch]$SkipFetch,
    [switch]$SkipProcessStop,
    [switch]$SimulateStopAccessDenied
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

function Get-AutopullProcessStartTime([int]$ProcessId) {
    if ($ProcessId -le 0) {
        return $null
    }
    try {
        $proc = Get-Process -Id $ProcessId -ErrorAction Stop
        if ($proc -and $proc.StartTime) {
            return ([datetime]$proc.StartTime).ToUniversalTime()
        }
    } catch {
        try {
            $cim = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
            if ($cim -and $cim.CreationDate) {
                return ([datetime]$cim.CreationDate).ToUniversalTime()
            }
        } catch {}
    }
    return $null
}

function Get-AutopullPortOwner([int]$Port) {
    if ($Port -le 0) {
        return [pscustomobject]@{
            ProcessId    = $null
            StartTimeUtc = $null
            StartTimeIso = $null
            Pids         = @()
        }
    }
    $pids = @()
    try {
        $conns = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
        $pids = @($conns | ForEach-Object { [int]$_.OwningProcess } | Where-Object { $_ -gt 0 -and $_ -ne $PID } | Select-Object -Unique)
    } catch {}
    $primaryPid = if ($pids.Count -gt 0) { [int]$pids[0] } else { $null }
    $startUtc = if ($null -ne $primaryPid) { Get-AutopullProcessStartTime -ProcessId $primaryPid } else { $null }
    $startIso = if ($null -ne $startUtc) { $startUtc.ToString('o') } else { $null }
    return [pscustomobject]@{
        ProcessId    = $primaryPid
        StartTimeUtc = $startUtc
        StartTimeIso = $startIso
        Pids         = $pids
    }
}

function Stop-AutopullPortOwner([int]$Port) {
    $before = Get-AutopullPortOwner -Port $Port
    $stoppedPids = @()
    $refusedPids = @()
    $accessDenied = $false
    $errorNote = ''
    if ($SkipProcessStop) {
        return [pscustomobject]@{
            BeforeOwner = $before
            StoppedPids = $stoppedPids
            RefusedPids = $refusedPids
            StopRefused = $false
            AccessDenied = $false
            RestartNote = ''
        }
    }
    $simulateDenied = [bool]$SimulateStopAccessDenied -or ([Environment]::GetEnvironmentVariable('AUTOPULL_SIMULATE_STOP_ACCESS_DENIED') -eq '1')
    try {
        foreach ($procId in $before.Pids) {
            try {
                if ($simulateDenied) {
                    throw [System.ComponentModel.Win32Exception]::new(5, 'Access is denied')
                }
                Stop-Process -Id $procId -Force -ErrorAction Stop
                $stoppedPids += $procId
            } catch {
                $stillRunning = [bool](Get-Process -Id $procId -ErrorAction SilentlyContinue)
                if ($stillRunning -or $simulateDenied) {
                    $refusedPids += $procId
                    $accessDenied = $true
                    $errorNote = 'restart refused: access denied'
                } else {
                    $stoppedPids += $procId
                }
            }
        }
        if ($stoppedPids.Count -gt 0 -and -not $accessDenied) {
            $waited = 0
            while (
                $waited -lt 50 -and
                @(
                    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
                        Where-Object { $stoppedPids -contains [int]$_.OwningProcess }
                ).Count -gt 0
            ) {
                Start-Sleep -Milliseconds 100
                $waited++
            }
        }
    } catch {}
    return [pscustomobject]@{
        BeforeOwner  = $before
        StoppedPids  = $stoppedPids
        RefusedPids  = $refusedPids
        StopRefused  = $accessDenied
        AccessDenied = $accessDenied
        RestartNote  = $errorNote
    }
}

function Resolve-AutopullDomainsHealthUrl([string]$BaseOrHealthUrl, [string]$ExplicitHealthUrl) {
    if ($ExplicitHealthUrl -and $ExplicitHealthUrl.Trim()) {
        return $ExplicitHealthUrl.Trim()
    }
    $trimmed = ([string]$BaseOrHealthUrl).Trim()
    if (-not $trimmed) {
        return ''
    }
    if ($trimmed -match '/health/?$') {
        return $trimmed
    }
    return ($trimmed.TrimEnd('/') + '/health')
}

function Get-AutopullDomainsHealthRequiredFields([string]$RepoRoot, [string[]]$ExplicitFields) {
    if ($ExplicitFields -and $ExplicitFields.Count -gt 0) {
        return @($ExplicitFields | Where-Object { $_ -and $_.Trim() } | ForEach-Object { $_.Trim() })
    }
    $defaultFields = @('service', 'sites', 'nodeLight', 'bookingNotices', 'bookingNoticesStatus', 'unnotifiedBookings')
    $serverMjs = Join-Path $RepoRoot 'ops\domains-server\server.mjs'
    if (Test-Path $serverMjs) {
        try {
            $raw = [IO.File]::ReadAllText($serverMjs)
            $fnMatch = [regex]::Match($raw, 'function\s+buildDomainsHealthPayload[\s\S]*?return\s*\{([\s\S]*?)\};')
            if ($fnMatch.Success) {
                $objBody = $fnMatch.Groups[1].Value
                $extracted = @()
                $seen = @{}
                foreach ($line in ($objBody -split "`r?`n")) {
                    $clean = ($line -replace '//.*$', '').Trim().TrimEnd(',')
                    if (-not $clean -or $clean.StartsWith('...')) { continue }
                    if ($clean -match '^([A-Za-z_][A-Za-z0-9_]*)\s*:') {
                        $k = $Matches[1]
                        if (-not $seen.ContainsKey($k)) { $seen[$k] = $true; $extracted += $k }
                    } elseif ($clean -match '^([A-Za-z_][A-Za-z0-9_]*)$') {
                        $k = $Matches[1]
                        if (-not $seen.ContainsKey($k)) { $seen[$k] = $true; $extracted += $k }
                    }
                }
                if ($extracted.Count -ge 3) {
                    return $extracted
                }
            }
        } catch {}
    }
    return $defaultFields
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

function Get-AutopullMergedPullRequests([string]$FromCommit, [string]$ToCommit) {
    $prNums = @()
    $seen = @{}
    if (-not $FromCommit -or -not $ToCommit -or $FromCommit -eq $ToCommit) {
        return $prNums
    }
    $logRes = Invoke-Git @('log', '--reverse', '--format=%s', "$FromCommit..$ToCommit")
    if ($logRes.ExitCode -ne 0 -or -not $logRes.Output) {
        return $prNums
    }
    foreach ($line in ($logRes.Output -split "`r?`n")) {
        $subj = $line.Trim()
        if (-not $subj) { continue }
        $matchesList = [regex]::Matches($subj, '(?:\(#(\d+)\)|\bMerge pull request #(\d+)\b)')
        foreach ($m in $matchesList) {
            $rawNum = if ($m.Groups[1].Success) { $m.Groups[1].Value } elseif ($m.Groups[2].Success) { $m.Groups[2].Value } else { '' }
            $parsed = 0
            if ($rawNum -and [int]::TryParse($rawNum, [ref]$parsed) -and $parsed -gt 0) {
                if (-not $seen.ContainsKey($parsed)) {
                    $seen[$parsed] = $true
                    $prNums += $parsed
                }
            }
        }
    }
    return $prNums
}

function Wait-AutopullServicePort([string]$HostIp, [string]$SecondaryHostIp, [int]$Port, [string]$HealthPath, [int]$TimeoutSeconds, [int]$IntervalMs, [int]$BeforePid = 0, [bool]$WaitForNewOwner = $false) {
    $pathPart = if ($HealthPath -and $HealthPath.StartsWith('/')) { $HealthPath } elseif ($HealthPath) { "/$HealthPath" } else { '/' }
    $candidateHosts = @()
    if ($HostIp -and $HostIp.Trim()) {
        $candidateHosts += $HostIp.Trim()
    }
    if ($SecondaryHostIp -and $SecondaryHostIp.Trim() -and ($candidateHosts -notcontains $SecondaryHostIp.Trim())) {
        $candidateHosts += $SecondaryHostIp.Trim()
    }
    $hdr = Get-AutopullProbeHeaders
    $deadline = (Get-Date).AddSeconds([Math]::Max(0, $TimeoutSeconds))
    $attempt = 0
    $reqTimeoutSec = [Math]::Max(1, [Math]::Min(5, [Math]::Ceiling([Math]::Max(1, $TimeoutSeconds))))
    $lastUrl = ''
    $lastAnswered = $null

    do {
        $attempt++
        foreach ($candidateHost in $candidateHosts) {
            $probeUrl = "http://${candidateHost}:${Port}${pathPart}"
            $lastUrl = $probeUrl
            try {
                $resp = Invoke-WebRequest -Uri $probeUrl -Headers $hdr -UseBasicParsing -TimeoutSec $reqTimeoutSec -ErrorAction Stop
                if ([int]$resp.StatusCode -ge 200 -and [int]$resp.StatusCode -lt 400) {
                    $ans = [pscustomobject]@{
                        Answered        = $true
                        AnsweredHost    = $candidateHost
                        AnsweredAddress = "${candidateHost}:${Port}"
                        Url             = $probeUrl
                        StatusCode      = [int]$resp.StatusCode
                        TriedHosts      = $candidateHosts
                        Attempts        = $attempt
                    }
                    $lastAnswered = $ans
                    if ($WaitForNewOwner -and $BeforePid -gt 0 -and (Get-Date) -lt $deadline) {
                        $curOwner = Get-AutopullPortOwner -Port $Port
                        if ($null -eq $curOwner.ProcessId -or [int]$curOwner.ProcessId -eq $BeforePid) {
                            break
                        }
                    }
                    return $ans
                }
            } catch {}
        }

        if ((Get-Date) -lt $deadline) {
            Start-Sleep -Milliseconds ([Math]::Max(50, $IntervalMs))
        }
    } while ((Get-Date) -lt $deadline)

    if ($null -ne $lastAnswered) {
        return $lastAnswered
    }

    return [pscustomobject]@{
        Answered        = $false
        AnsweredHost    = ''
        AnsweredAddress = ''
        Url             = $lastUrl
        StatusCode      = 0
        TriedHosts      = $candidateHosts
        Attempts        = $attempt
    }
}

function Test-AutopullDomainsHealthContent([string]$Url, [string[]]$RequiredFields, [string]$ExpectedCommit, [int]$TimeoutSeconds, [int]$IntervalMs) {
    $deadline = (Get-Date).AddSeconds([Math]::Max(0, [Math]::Min($TimeoutSeconds, 30)))
    $lastStatus = 0
    $reqTimeoutSec = [Math]::Max(1, [Math]::Min(10, [Math]::Ceiling([Math]::Max(1, $TimeoutSeconds))))
    $lastMissingFields = @($RequiredFields)
    $lastBuildStamp = ''
    $shortExpected = if ($ExpectedCommit -and $ExpectedCommit.Length -ge 7) { $ExpectedCommit.Substring(0, 7) } else { $ExpectedCommit }

    do {
        try {
            $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $reqTimeoutSec -ErrorAction Stop
            $lastStatus = [int]$resp.StatusCode
            $body = ([string]$resp.Content).Trim()
            if ($lastStatus -eq 200 -and $body.StartsWith('{')) {
                $parsed = $body | ConvertFrom-Json -ErrorAction Stop
                if ($null -ne $parsed) {
                    $propNames = @($parsed.PSObject.Properties | ForEach-Object { [string]$_.Name })
                    $serviceOk = (-not ($propNames -contains 'service')) -or ([string]$parsed.service -eq 'domains-server')
                    if ($serviceOk -and $propNames.Count -gt 0) {
                        $stampVal = ''
                        foreach ($stampKey in @('buildStamp', 'build_stamp', 'commit', 'gitCommit', 'git_commit', 'buildCommit', 'build_commit', 'sha')) {
                            if ($propNames -contains $stampKey) {
                                $candidate = ([string]$parsed.$stampKey).Trim()
                                if ($candidate) {
                                    $stampVal = $candidate
                                    break
                                }
                            }
                        }
                        $lastBuildStamp = $stampVal
                        $stampMismatch = $false
                        $hasValidBuildStamp = $false
                        if ($stampVal -and $ExpectedCommit) {
                            $exactOrPrefix = ($stampVal -ieq $ExpectedCommit) -or
                                ($stampVal.Length -ge 7 -and $ExpectedCommit.StartsWith($stampVal, [System.StringComparison]::OrdinalIgnoreCase)) -or
                                ($shortExpected -and $stampVal.StartsWith($shortExpected, [System.StringComparison]::OrdinalIgnoreCase))
                            if ($exactOrPrefix) {
                                $hasValidBuildStamp = $true
                            } else {
                                $stampMismatch = $true
                            }
                        }

                        $missing = @($RequiredFields | Where-Object { $propNames -notcontains $_ })
                        $lastMissingFields = $missing
                        $hasAllFields = ($RequiredFields.Count -gt 0 -and $missing.Count -eq 0)

                        if ((-not $stampMismatch) -and ($hasAllFields -or $hasValidBuildStamp)) {
                            return [pscustomobject]@{
                                Passed         = $true
                                Url            = $Url
                                StatusCode     = $lastStatus
                                RequiredFields = $RequiredFields
                                MissingFields  = $missing
                                BuildStamp     = $stampVal
                                Pattern        = ($RequiredFields -join ',')
                            }
                        }
                    }
                }
            }
        } catch {}

        if ((Get-Date) -lt $deadline) {
            Start-Sleep -Milliseconds ([Math]::Max(50, $IntervalMs))
        }
    } while ((Get-Date) -lt $deadline)

    return [pscustomobject]@{
        Passed         = $false
        Url            = $Url
        StatusCode     = $lastStatus
        RequiredFields = $RequiredFields
        MissingFields  = $lastMissingFields
        BuildStamp     = $lastBuildStamp
        Pattern        = ($RequiredFields -join ',')
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
        expectedContent = 'status'
        isPublicPage    = $false
        target          = '8000'
        action          = 'stop-port:8000'
    }
}
if ($needDomains9160) {
    $domainsPublicHealthTarget = Resolve-AutopullDomainsHealthUrl -BaseOrHealthUrl $PublicRecycleUrl -ExplicitHealthUrl $PublicRecycleHealthUrl
    $previewDomainsFields = @(Get-AutopullDomainsHealthRequiredFields -RepoRoot $RepoPath -ExplicitFields $DomainsHealthRequiredFields)
    $MappedServices += [ordered]@{
        service         = 'domains-server'
        kind            = 'port'
        port            = 9160
        stopPort        = $DomainsPort
        checkPort       = $DomainsPort
        healthPath      = '/health'
        publicAddress   = 'onlinerecycle.net/health'
        pageAddress     = 'onlinerecycle.net'
        publicUrl       = $domainsPublicHealthTarget
        publicPageUrl   = $PublicRecycleUrl
        expectedContent = ($previewDomainsFields -join ',')
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
    $previewPrs = @(Get-AutopullMergedPullRequests -FromCommit $OldCommit -ToCommit $NewCommit)
    Write-Output "Mode: DRY-RUN (pass -Apply to pull and restart changed services)"
    Write-Output "RepoPath: $RepoPath"
    Write-Output "OldCommit: $OldCommit"
    Write-Output "NewCommit: $NewCommit"
    Write-Output ("PullRequests: " + ($previewPrs -join ', '))
    Write-Output "Would run: git pull --ff-only $Remote $Branch"
    foreach ($svc in $MappedServices) {
        if ($svc.kind -eq 'port') {
            Write-Output ("Would stop process owning port {0} ({1})" -f $svc.port, $svc.action)
            Write-Output ("Would wait up to {0}s for {1}:{2}{3} (then {4}:{2}{3}) to answer" -f $WaitTimeoutSeconds, $NodeHost, $svc.checkPort, $svc.healthPath, $FallbackHost)
        } else {
            Write-Output ("Would restart scheduled task '{0}' ({1})" -f $svc.task, $svc.action)
            if ($svc.checkPort -gt 0) {
                Write-Output ("Would wait up to {0}s for {1}:{2}{3} (then {4}:{2}{3}) to answer" -f $WaitTimeoutSeconds, $NodeHost, $svc.checkPort, $svc.healthPath, $FallbackHost)
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
        Write-Output ("Would wait up to {0}s for {1}:{2}/ (then {4}:{2}/) to answer, check public address youandinotai.com ({3}) by content, and take one headless picture with ops/eyes/shoot-page.mjs into logs\autopull" -f $WaitTimeoutSeconds, $NodeHost, $FrontendPort, $PublicWebUrl, $FallbackHost)
    }
    if ($MappedServices.Count -eq 0 -and -not $frontendChanged) {
        Write-Output "No mapped service restarts needed."
    }
    exit 0
}

Write-Output "Mode: APPLY"
$PrePullOwners = @{}
foreach ($svc in $MappedServices) {
    if ($svc.kind -eq 'port') {
        $PrePullOwners[[string]$svc.service] = Get-AutopullPortOwner -Port ([int]$svc.stopPort)
    }
}
$PullTimeUtc = (Get-Date).ToUniversalTime()
$PullIsoTime = $PullTimeUtc.ToString('o')

$pullRes = Invoke-Git @('pull', '--ff-only', $Remote, $Branch)
if ($pullRes.ExitCode -ne 0) {
    Write-Output ("ERROR: git pull --ff-only failed: " + $pullRes.Output)
    exit 1
}

$afterHeadRes = Invoke-Git @('rev-parse', 'HEAD')
$AppliedCommit = if ($afterHeadRes.ExitCode -eq 0 -and $afterHeadRes.Output) { $afterHeadRes.Output.Trim() } else { $NewCommit }
$MergedPrNumbers = @(Get-AutopullMergedPullRequests -FromCommit $OldCommit -ToCommit $AppliedCommit)
$DomainsRequiredFields = @(Get-AutopullDomainsHealthRequiredFields -RepoRoot $RepoPath -ExplicitFields $DomainsHealthRequiredFields)

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
        $stopRes = Stop-AutopullPortOwner -Port ([int]$svc.stopPort)
        $beforeOwner = if ($PrePullOwners.ContainsKey([string]$svc.service) -and $null -ne $PrePullOwners[[string]$svc.service].ProcessId) {
            $PrePullOwners[[string]$svc.service]
        } else {
            $stopRes.BeforeOwner
        }
        $pids = @($stopRes.StoppedPids)
        if ($stopRes.StopRefused) {
            Write-Output ("Service {0} on port {1} (runtimePort={2}, pid={3}): {4}" -f $svc.service, $svc.port, $svc.stopPort, $beforeOwner.ProcessId, $stopRes.RestartNote)
        } else {
            Write-Output ("Stopped port {0} owner (runtimePort={1}, pids={2}, beforePid={3}, beforeStartTime={4})" -f $svc.port, $svc.stopPort, ($pids -join ','), $beforeOwner.ProcessId, $beforeOwner.StartTimeIso)
        }
        $svcExpectedContent = if ($svc.service -eq 'domains-server') { ($DomainsRequiredFields -join ',') } else { $svc.expectedContent }
        $RecordedServices += [ordered]@{
            service         = $svc.service
            kind            = 'port'
            port            = $svc.port
            checkPort       = $svc.checkPort
            healthPath      = $svc.healthPath
            publicAddress   = $svc.publicAddress
            pageAddress     = if ($svc['pageAddress']) { $svc['pageAddress'] } else { $svc.publicAddress }
            publicUrl       = $svc.publicUrl
            publicPageUrl   = if ($svc['publicPageUrl']) { $svc['publicPageUrl'] } else { $svc.publicUrl }
            expectedContent = $svcExpectedContent
            isPublicPage    = $svc.isPublicPage
            target          = $svc.target
            action          = $svc.action
            beforePid       = $beforeOwner.ProcessId
            beforeStartTime = $beforeOwner.StartTimeIso
            afterPid        = $null
            afterStartTime  = $null
            pullTime        = $PullIsoTime
            restarted       = $false
            stopRefused     = [bool]$stopRes.StopRefused
            restartNote     = [string]$stopRes.RestartNote
            restartError    = [string]$stopRes.RestartNote
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
            pageAddress     = $svc.publicAddress
            publicUrl       = $svc.publicUrl
            publicPageUrl   = $svc.publicUrl
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
        pageAddress     = 'youandinotai.com'
        publicUrl       = $PublicWebUrl
        publicPageUrl   = $PublicWebUrl
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
$RestartFailedReasons = @()

foreach ($rec in $RecordedServices) {
    if ([int]$rec.checkPort -le 0) {
        $rec.status = 'LIVE'
        continue
    }

    if ($rec.kind -eq 'task' -and $rec.taskStatus -eq 'task-not-registered') {
        $rec.status = 'LIVE'
        continue
    }

    $isPortKind = ($rec.kind -eq 'port')
    $stopWasRefused = ($isPortKind -and [bool]$rec.stopRefused)
    $waitForNewOwner = ($isPortKind -and (-not $SkipProcessStop) -and (-not $stopWasRefused) -and ($null -ne $rec.beforePid) -and ([int]$rec.beforePid -gt 0))
    $effectiveWaitSec = if ($stopWasRefused) { [Math]::Min($WaitTimeoutSeconds, 3) } else { $WaitTimeoutSeconds }
    $beforePidInt = if ($isPortKind -and $null -ne $rec.beforePid) { [int]$rec.beforePid } else { 0 }

    $portCheck = Wait-AutopullServicePort -HostIp $NodeHost -SecondaryHostIp $FallbackHost -Port ([int]$rec.checkPort) -HealthPath ([string]$rec.healthPath) -TimeoutSeconds $effectiveWaitSec -IntervalMs $PollIntervalMs -BeforePid $beforePidInt -WaitForNewOwner $waitForNewOwner
    $localPassed = [bool]$portCheck.Answered
    $rec['portHost'] = [string]$portCheck.AnsweredHost
    $rec['answeredHost'] = [string]$portCheck.AnsweredHost
    $rec['answeredAddress'] = [string]$portCheck.AnsweredAddress
    $rec['localAnsweredOn'] = [string]$portCheck.AnsweredAddress
    $rec['triedHosts'] = @($portCheck.TriedHosts)
    $rec['portAnswered'] = $localPassed
    $rec['localCheckPassed'] = $localPassed
    $rec['portProbeUrl'] = [string]$portCheck.Url

    if ($isPortKind) {
        $afterOwner = Get-AutopullPortOwner -Port ([int]$rec.checkPort)
        $rec['afterPid'] = $afterOwner.ProcessId
        $rec['afterStartTime'] = $afterOwner.StartTimeIso
        $pidChanged = ($null -ne $afterOwner.ProcessId) -and ([int]$afterOwner.ProcessId -gt 0) -and ($afterOwner.ProcessId -ne $rec.beforePid)
        $startedAfterPull = ($null -ne $afterOwner.StartTimeUtc) -and ($afterOwner.StartTimeUtc -gt $PullTimeUtc)
        $restartProved = (-not $stopWasRefused) -and $pidChanged -and $startedAfterPull
        $rec['restarted'] = [bool]$restartProved
        if ((-not $restartProved) -and (-not $rec.restartNote) -and (-not $SkipProcessStop)) {
            $rec['restartNote'] = "restart not proven (beforePid=$($rec.beforePid), afterPid=$($afterOwner.ProcessId), afterStartTime=$($afterOwner.StartTimeIso), pullTime=$PullIsoTime)"
            $rec['restartError'] = $rec['restartNote']
        }
    }

    if ($localPassed) {
        Write-Output ("Verified {0} answered on {1}" -f $rec.service, $portCheck.AnsweredAddress)
    } else {
        Write-Output ("Local check did not answer for {0} on {1} port {2} within {3}s" -f $rec.service, ($portCheck.TriedHosts -join ' or '), $rec.checkPort, $effectiveWaitSec)
    }

    $hasPublicCheck = [bool]$rec.publicUrl
    $publicPassed = $false

    if ($hasPublicCheck) {
        if ($rec.service -eq 'domains-server') {
            $pubCheck = Test-AutopullDomainsHealthContent -Url ([string]$rec.publicUrl) -RequiredFields $DomainsRequiredFields -ExpectedCommit $AppliedCommit -TimeoutSeconds $effectiveWaitSec -IntervalMs $PollIntervalMs
            $rec['requiredHealthFields'] = @($pubCheck.RequiredFields)
            $rec['missingHealthFields'] = @($pubCheck.MissingFields)
            $rec['healthBuildStamp'] = [string]$pubCheck.BuildStamp
        } else {
            $pubCheck = Test-AutopullPublicContent -Url ([string]$rec.publicUrl) -ExpectedPattern ([string]$rec.expectedContent) -TimeoutSeconds $effectiveWaitSec -IntervalMs $PollIntervalMs
        }
        $publicPassed = [bool]$pubCheck.Passed
        $rec['publicCheckPassed'] = $publicPassed
        $picPath = ''

        if ($publicPassed -and $rec.isPublicPage) {
            $shootAddr = if ($rec['pageAddress']) { [string]$rec['pageAddress'] } else { [string]$rec.publicAddress }
            $shootUrl = if ($rec['publicPageUrl']) { [string]$rec['publicPageUrl'] } else { [string]$rec.publicUrl }
            $shotRes = Invoke-AutopullShootPage -PageAddress $shootAddr -PublicUrl $shootUrl -OutDir $LogDir -StampPrefix $StampPrefix
            if ($shotRes.PicturePath) {
                $picPath = $shotRes.PicturePath
                $Pictures += $picPath
                $rec['picture'] = $picPath
                Write-Output ("Captured headless picture for {0}: {1}" -f $shootAddr, $picPath)
            }
        }

        $PublicChecks += [ordered]@{
            address         = $rec.publicAddress
            url             = $rec.publicUrl
            expectedContent = $rec.expectedContent
            passed          = $publicPassed
            status          = if ($publicPassed) { 'LIVE' } else { 'FAILED' }
            picture         = $picPath
        }

        if ($publicPassed) {
            Write-Output ("Verified public content for {0} ({1})" -f $rec.publicAddress, $rec.publicUrl)
        } else {
            Write-Output ("Public content check did not pass for {0} ({1})" -f $rec.publicAddress, $rec.publicUrl)
        }
    }

    if ($stopWasRefused) {
        $rec.status = 'FAILED-TO-RESTART'
        $RestartFailedReasons += "Service $($rec.service): restart refused: access denied (pid=$($rec.beforePid))"
        Write-Output ("FAILED-TO-RESTART: Service {0} - restart refused: access denied" -f $rec.service)
        continue
    }

    $serviceFailed = if ($hasPublicCheck) { (-not $localPassed) -and (-not $publicPassed) } else { (-not $localPassed) }
    if ($serviceFailed) {
        $rec.status = 'FAILED'
        $reason = if ($hasPublicCheck) {
            "Service $($rec.service) failed both local check ($($portCheck.TriedHosts -join ' and ') port $($rec.checkPort)) and public content check ($($rec.publicUrl))"
        } else {
            "Service $($rec.service) did not answer on $($portCheck.TriedHosts -join ' or ') port $($rec.checkPort) within ${WaitTimeoutSeconds}s"
        }
        $FailedReasons += $reason
        Write-Output "FAILED: $reason"
        continue
    }

    if ($isPortKind -and (-not $SkipProcessStop) -and (-not [bool]$rec.restarted)) {
        $rec.status = 'FAILED-TO-RESTART'
        $RestartFailedReasons += "Service $($rec.service) did not prove restart (beforePid=$($rec.beforePid), afterPid=$($rec.afterPid), afterStartTime=$($rec.afterStartTime), pullTime=$PullIsoTime)"
        Write-Output ("FAILED-TO-RESTART: Service {0} did not change process id or start after pull" -f $rec.service)
        continue
    }

    $rec.status = 'LIVE'
}

$OverallStatus = if ($FailedReasons.Count -gt 0) { 'FAILED' } elseif ($RestartFailedReasons.Count -gt 0) { 'FAILED-TO-RESTART' } else { 'LIVE' }
$PausedAutopull = $false

if ($OverallStatus -eq 'FAILED') {
    $pauseLines = @(
        "status: FAILED",
        "time: $IsoTime",
        "oldCommit: $OldCommit",
        "newCommit: $AppliedCommit",
        ("pullRequests: " + ($MergedPrNumbers -join ', ')),
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
    time               = $IsoTime
    status             = $OverallStatus
    result             = $OverallStatus
    live               = ($OverallStatus -eq 'LIVE')
    oldCommit          = $OldCommit
    newCommit          = $AppliedCommit
    pullRequests       = @($MergedPrNumbers)
    mergedPullRequests = @($MergedPrNumbers)
    prNumbers          = @($MergedPrNumbers)
    pull_requests      = @($MergedPrNumbers)
    changedServices    = @($RecordedServices)
    publicChecks       = @($PublicChecks)
    pictures           = @($Pictures)
    pausedAutopull     = $PausedAutopull
    failedReasons      = @($FailedReasons)
    old_commit         = $OldCommit
    new_commit         = $AppliedCommit
    changed_services   = @($RecordedServices)
    changedFiles       = @($ChangedFiles)
}

$JsonText = ($RecordObj | ConvertTo-Json -Depth 7) + "`n"
[IO.File]::WriteAllText($RecordPath, $JsonText, (New-Object Text.UTF8Encoding $false))

Write-Output "Pulled $OldCommit -> $AppliedCommit ($OverallStatus)"
Write-Output "Record: $RecordPath"
if ($OverallStatus -eq 'FAILED') {
    exit 1
}
exit 0
