# T5500 KEEP-ALIVE — the deployed-products node's own watchdog (2026-10-05).
#
# T5500 hosts only the deployed products: the domains (through the cloudflared tunnel)
# and the local Ollama model joshlcoleman/Fable that Hermes uses. Nobody should have to
# notice an outage. Every pass this script probes each stage for REAL IDENTITY (not just
# an open port), heals what is down in dependency order, and records what it did.
#
#   Long-running (scheduled task, loops every 60 s):  keepalive.ps1
#   One pass (testing):                               keepalive.ps1 -Once
#
# Outputs:  logs\t5500-keepalive.log   ops\t5500\status.json   ops\t5500\TRIGGERS.jsonl
# Pause:    ops\t5500\PAUSE (while present, probes and logs every pass without healing)
# A stage that stays down for 3 consecutive passes writes a line to TRIGGERS.jsonl so the
# next Claude session sees exactly what the script could not clear by itself.
#
# This script is the only thing that starts these services. Do not start them by hand;
# a hand-started process will be treated as a squatter if it does not answer correctly.
param(
    [switch]$Once,
    [switch]$DryRun,
    [switch]$Test,
    [switch]$FunctionsOnly,
    [string]$RepoPath = ''
)

$ErrorActionPreference = 'Continue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$ScriptRepo  = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Repo        = if ($RepoPath) { $RepoPath } elseif (Test-Path 'C:\ANTIGRAVITY\ops\t5500\keepalive.ps1') { 'C:\ANTIGRAVITY' } else { $ScriptRepo }
$script:BoundRepo = $Repo
$Dir         = Join-Path $Repo 'ops\t5500'
$FleetHelper = Join-Path $Repo 'ops\fleet\Get-FleetEndpoint.ps1'
if (-not (Test-Path -LiteralPath $FleetHelper)) {
    $FleetHelper = Join-Path $ScriptRepo 'ops\fleet\Get-FleetEndpoint.ps1'
}
. $FleetHelper
$T5500Ip     = Get-FleetEndpoint -NodeId 't5500' -SelectField 'Ip'
$DomainsSvc  = Get-FleetService -ServiceId 'domains-server'
$PauseFile   = Join-Path $Repo 'ops\t5500\PAUSE'
$LogFile     = Join-Path $Repo 'logs\t5500-keepalive.log'
$StatusFile  = Join-Path $Dir 'status.json'
$Triggers    = Join-Path $Dir 'TRIGGERS.jsonl'
$Node        = 'C:\Program Files\nodejs\node.exe'
$Cloudflared = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$CfConfig    = Join-Path $env:USERPROFILE '.cloudflared\config.yml'
$Ollama      = Join-Path $env:USERPROFILE 'AppData\Local\Programs\Ollama\ollama.exe'
$FableModel  = 'joshlcoleman/Fable:latest'
$PgBin       = Join-Path $env:USERPROFILE 'pgsql16\bin'
$PgData      = Join-Path $env:USERPROFILE 'pgsql16-data'
$RedisRoot   = Join-Path $env:USERPROFILE 'redis8-win'   # Redis 8: the API's redis-py 8.x speaks RESP3 (HELLO); the Redis 5 build rejects it

if (-not $DryRun -and -not $Test -and -not $FunctionsOnly) {
    New-Item -ItemType Directory -Force -Path ([IO.Path]::GetDirectoryName($LogFile)) | Out-Null
    New-Item -ItemType Directory -Force -Path $Dir | Out-Null
}

if (-not $DryRun -and -not $Test -and -not $FunctionsOnly) {
    # One keep-alive at a time; a second copy (task relaunch, manual run) exits quietly.
    $created = $true
    try {
        $mutex = New-Object System.Threading.Mutex($true, 'Local\ANTIGRAVITY-T5500-Keepalive', [ref]$created)
        if (-not $created) { exit 0 }
    } catch {
        $running = Get-CimInstance Win32_Process -Filter "CommandLine LIKE '%keepalive.ps1%'" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessId -ne $PID }
        if ($running) { exit 0 }
    }
}

function Sync-KeepalivePaths {
    if ($Repo -and $Repo -ne $script:BoundRepo) {
        $script:BoundRepo  = $Repo
        $script:Dir        = Join-Path $Repo 'ops\t5500'
        $script:PauseFile  = Join-Path $Repo 'ops\t5500\PAUSE'
        $script:LogFile    = Join-Path $Repo 'logs\t5500-keepalive.log'
        $script:StatusFile = Join-Path $script:Dir 'status.json'
        $script:Triggers   = Join-Path $script:Dir 'TRIGGERS.jsonl'
    } elseif (-not $script:PauseFile) {
        $script:PauseFile  = Join-Path $Repo 'ops\t5500\PAUSE'
    }
}

function Get-KeepalivePauseFile([string]$repoPath = $Repo) {
    $base = if ($repoPath) { $repoPath } else { $Repo }
    return (Join-Path $base 'ops\t5500\PAUSE')
}

function Test-KeepalivePaused([string]$repoPath = $Repo) {
    Sync-KeepalivePaths
    $pf = Get-KeepalivePauseFile $repoPath
    $script:PauseFile = $pf
    return [bool](Test-Path -LiteralPath $pf)
}

function Log([string]$msg) {
    Sync-KeepalivePaths
    $line = '[{0}] {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
    try {
        $logDir = [IO.Path]::GetDirectoryName($LogFile)
        if ($logDir -and -not (Test-Path -LiteralPath $logDir)) {
            New-Item -ItemType Directory -Force -Path $logDir | Out-Null
        }
        if ((Test-Path $LogFile) -and ((Get-Item $LogFile).Length -gt 4MB)) { Move-Item $LogFile ($LogFile + '.1') -Force }
        Add-Content -Path $LogFile -Value $line -ErrorAction Stop
    } catch {}
}

function Test-Port([int]$port) {
    try {
        $c = New-Object Net.Sockets.TcpClient
        $iar = $c.BeginConnect('127.0.0.1', $port, $null, $null)
        $ok = $iar.AsyncWaitHandle.WaitOne(1500)
        if ($ok) { $c.EndConnect($iar) }
        $c.Close()
        return $ok
    } catch { return $false }
}

function Get-FirstEnvVal([string[]]$keys) {
    foreach ($k in $keys) {
        if (-not $k) { continue }
        $v = Get-EnvVal $k
        if ($v) { return $v }
    }
    return ''
}

function Get-FleetProbeHeaders([string[]]$tokenEnvNames) {
    $hdr = @{}
    if ($tokenEnvNames -and $tokenEnvNames.Count -gt 0) {
        $tok = Get-FirstEnvVal $tokenEnvNames
        if ($tok) {
            $hdr['X-Mission-OS-Token'] = $tok
            $hdr['X-Fleet-Token'] = $tok
            $hdr['Authorization'] = "Bearer $tok"
        }
    }
    return $hdr
}

function Get-LoopbackFallbackUrl([string]$url) {
    $loopbackHost = '127.0.0.1'
    $escapedIp = [regex]::Escape($T5500Ip)
    if ($url -match ('^https?://' + $escapedIp + ':')) {
        return ($url -replace ('://' + $escapedIp + ':'), "://${loopbackHost}:")
    }
    return $null
}

function Test-Http([string]$url, [int]$timeoutSec = 10, [string]$mustContain = '', [string[]]$tokenEnvNames = $null, [switch]$AllowLoopbackFallback) {
    $hdr = Get-FleetProbeHeaders $tokenEnvNames
    $targets = @($url)
    if ($AllowLoopbackFallback -or ($tokenEnvNames -and $hdr.Count -eq 0)) {
        $fb = Get-LoopbackFallbackUrl $url
        if ($fb) { $targets += $fb }
    }
    foreach ($target in $targets) {
        try {
            $r = Invoke-WebRequest -Uri $target -Headers $hdr -UseBasicParsing -TimeoutSec $timeoutSec
            if ($r.StatusCode -ne 200) { continue }
            if ($mustContain -and ($r.Content -notmatch [regex]::Escape($mustContain))) { continue }
            return $true
        } catch {}
    }
    return $false
}

function Test-Redis {
    try {
        $c = New-Object Net.Sockets.TcpClient('127.0.0.1', 6379)
        $s = $c.GetStream(); $s.ReadTimeout = 2000
        $b = [Text.Encoding]::ASCII.GetBytes("PING`r`n")
        $s.Write($b, 0, $b.Length)
        $buf = New-Object byte[] 16
        $n = $s.Read($buf, 0, 16)
        $c.Close()
        return ([Text.Encoding]::ASCII.GetString($buf, 0, $n) -match 'PONG')
    } catch { return $false }
}

function Test-PgReady {
    $exe = Join-Path $PgBin 'pg_isready.exe'
    if (-not (Test-Path $exe)) { return (Test-Port 5432) }
    & $exe -h 127.0.0.1 -p 5432 -q 2>$null
    return ($LASTEXITCODE -eq 0)
}

function Stop-PortOwner([int]$port) {
    try {
        Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
            Log ('  stopped PID {0} on :{1}' -f $_.OwningProcess, $port)
        }
        $waited = 0
        while ($waited -lt 10 -and (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)) { Start-Sleep -Seconds 1; $waited++ }
    } catch {}
}

function Get-TunnelProcs {
    # A transient WMI failure under load once returned nothing while the tunnel was running
    # (2026-10-05) and caused a duplicate connector, so an empty answer is asked twice.
    for ($try = 0; $try -lt 2; $try++) {
        $found = @(Get-CimInstance Win32_Process -Filter "Name='cloudflared.exe'" -ErrorAction SilentlyContinue |
            Where-Object { $_.CommandLine -and $_.CommandLine -match [regex]::Escape('.cloudflared\config.yml') })
        if ($found.Count -gt 0) { return $found }
        Start-Sleep -Seconds 2
    }
    return @()
}

# One connector is enough on this box; extras only confuse diagnosis. Keep the oldest.
function Remove-DuplicateTunnels {
    if (Test-KeepalivePaused) { return }
    $procs = @(Get-TunnelProcs | Sort-Object CreationDate)
    if ($procs.Count -le 1) { return }
    foreach ($p in ($procs | Select-Object -Skip 1)) {
        Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
        Log ('duplicate tunnel connector stopped (PID ' + $p.ProcessId + ')')
    }
}

# Reads one value from the process environment. Never opens .env files or logs values.
function Get-EnvVal([string]$key) {
    $v = [Environment]::GetEnvironmentVariable($key)
    if ($v) { return $v.Trim() }
    return ''
}

# Cloud backends cannot be healed from here; probe at most every 10 min and report.
$script:CloudCache = @{}
function Test-Cloud([string]$name, [string]$url, [hashtable]$headers) {
    $hit = $script:CloudCache[$name]
    if ($hit -and ((Get-Date) - $hit.At).TotalMinutes -lt 10) { return $hit.Ok }
    $ok = $false
    try { $r = Invoke-WebRequest -Uri $url -Headers $headers -UserAgent 'antigravity-keepalive/1.0' -UseBasicParsing -TimeoutSec 15; $ok = ($r.StatusCode -eq 200) } catch { $ok = $false }
    $script:CloudCache[$name] = @{ At = Get-Date; Ok = $ok }
    return $ok
}

# ── Domains ────────────────────────────────────────────────────────────────
# Origin = local port that serves the Host header (checked directly, bypassing DNS).
$Domains = @(
    @{ Host = 'youandinotai.com';     Mark = 'assets/index-';        Origin = 3200 },
    @{ Host = 'onlinerecycle.net';    Mark = 'OnlineRecycle';        Origin = 9160 },
    @{ Host = 'dream-online.net';     Mark = 'DREAM Online';         Origin = 9160 }
)
$script:NsCache = @{}

function Get-NsState([string]$h) {
    $hit = $script:NsCache[$h]
    if ($hit -and ((Get-Date) - $hit.At).TotalMinutes -lt 10) { return $hit.State }
    $state = 'unknown'
    try {
        $parts = $h -split '\.'; $zone = if ($parts.Count -gt 2) { ($parts[-2..-1] -join '.') } else { $h }; $ns = @(Resolve-DnsName $zone -Type NS -DnsOnly -ErrorAction Stop | Where-Object { $_.Type -eq 'NS' } | ForEach-Object { $_.NameHost })
        if ($ns | Where-Object { $_ -match 'cloudflare\.com$' }) { $state = 'cloudflare' } elseif ($ns.Count -gt 0) { $state = 'other' }
    } catch {}
    $script:NsCache[$h] = @{ At = Get-Date; State = $state }
    return $state
}

function Test-Origin([hashtable]$d) {
    if ($d.Origin -eq 3200) {
        return (Test-Http ('http://' + $T5500Ip + ':3200/') 10 $d.Mark $null -AllowLoopbackFallback)
    }
    $targets = @('http://' + $T5500Ip + ':' + $d.Origin + '/')
    $loopbackHost = '127.0.0.1'
    if (-not (Get-EnvVal 'FLEET_SHARED_TOKEN')) {
        $targets += ('http://' + $loopbackHost + ':' + $d.Origin + '/')
    }
    foreach ($target in $targets) {
        try {
            $out = & curl.exe --noproxy '*' -s -m 8 -H ('Host: ' + $d.Host) $target 2>$null
            if ((($out | Out-String)) -match [regex]::Escape($d.Mark)) { return $true }
        } catch {}
    }
    return $false
}

# Public hosts whose nameservers are on Cloudflare, whose origin answers, yet whose public
# page does NOT answer: that combination is the tunnel's fault, nothing else's.
function Get-PublicFailures {
    $bad = @()
    foreach ($d in $Domains) {
        if ((Get-NsState $d.Host) -ne 'cloudflare') { continue }
        if (-not (Test-Origin $d)) { continue }
        $pm = if ($d.PublicMark) { $d.PublicMark } else { $d.Mark }; if (-not (Test-Http ('https://' + $d.Host) 20 $pm)) { $bad += $d.Host }
    }
    return $bad
}

# ── DateApp Frontend Staleness & Build-Commit Helpers ───────────────────────
function Get-GitCommit([string]$repoPath) {
    try {
        $head = & git -C $repoPath rev-parse HEAD 2>$null
        if ($LASTEXITCODE -eq 0 -and $head -and $head.Trim().Length -ge 7) {
            return $head.Trim()
        }
    } catch {}
    return $null
}

function Get-FrontendBuildInputs([string]$repoPath) {
    $feDir = Join-Path $repoPath 'domains\youandinotai.com\frontend'
    $publicDir = Join-Path $feDir 'public'
    $files = [System.Collections.Generic.List[System.IO.FileInfo]]::new()

    # 1. src/ (all files recursively)
    $srcDir = Join-Path $feDir 'src'
    if (Test-Path $srcDir) {
        $files.AddRange([System.IO.FileInfo[]]@(Get-ChildItem -Path $srcDir -Recurse -File -ErrorAction SilentlyContinue))
    }

    # 2. public/ (excluding generated sitemap.xml, blog/index.html, and blog/*/index.html)
    if (Test-Path $publicDir) {
        $pubItems = Get-ChildItem -Path $publicDir -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
            $rel = $_.FullName.Substring($publicDir.Length).TrimStart('\', '/')
            -not (
                $rel -ieq 'sitemap.xml' -or
                $rel -ieq 'blog\index.html' -or
                $rel -ieq 'blog/index.html' -or
                $rel -imatch '^blog[\\/][^\\/]+[\\/]index\.html$'
            )
        }
        if ($pubItems) { $files.AddRange([System.IO.FileInfo[]]@($pubItems)) }
    }

    # 3. index.html
    $idx = Join-Path $feDir 'index.html'
    if (Test-Path $idx) { $files.Add((Get-Item $idx)) }

    # 4. Blog content folder (content/blog/youandinotai)
    $blogDir = Join-Path $repoPath 'content\blog'
    if (Test-Path $blogDir) {
        $files.AddRange([System.IO.FileInfo[]]@(Get-ChildItem -Path $blogDir -Recurse -File -ErrorAction SilentlyContinue))
    }

    # 5. build_blog_static.py
    $buildBlogPy = Join-Path $feDir 'build_blog_static.py'
    if (Test-Path $buildBlogPy) { $files.Add((Get-Item $buildBlogPy)) }

    # 6. Vite config
    foreach ($cfg in @('vite.config.ts', 'vite.config.js', 'vitest.config.ts')) {
        $p = Join-Path $feDir $cfg
        if (Test-Path $p) { $files.Add((Get-Item $p)) }
    }

    # 7. Package files
    foreach ($pkg in @('package.json', 'package-lock.json')) {
        $fePkg = Join-Path $feDir $pkg
        if (Test-Path $fePkg) { $files.Add((Get-Item $fePkg)) }
        $rootPkg = Join-Path $repoPath $pkg
        if (Test-Path $rootPkg) { $files.Add((Get-Item $rootPkg)) }
    }

    return $files
}

function Get-FrontendStaleness([string]$repoPath) {
    $feDir      = Join-Path $repoPath 'domains\youandinotai.com\frontend'
    $distDir    = Join-Path $feDir 'dist'
    $distIdx    = Join-Path $distDir 'index.html'
    $commitFile = Join-Path $distDir 'build-commit.txt'

    $inputs = Get-FrontendBuildInputs $repoPath
    $newest = $null
    $newestTime = [datetime]::MinValue
    foreach ($file in $inputs) {
        if ($file.LastWriteTimeUtc -gt $newestTime) {
            $newestTime = $file.LastWriteTimeUtc
            $newest = $file
        }
    }
    $relNewest = if ($newest) {
        $n = $newest.FullName
        if ($n.StartsWith($repoPath, [System.StringComparison]::OrdinalIgnoreCase)) { $n.Substring($repoPath.Length).TrimStart('\', '/') } else { $n }
    } else { $null }

    if (-not (Test-Path $distIdx)) {
        return [PSCustomObject]@{
            NeedsRebuild = $true
            Reason       = 'dist/index.html is missing'
            GitHead      = (Get-GitCommit $repoPath)
            BuildCommit  = $null
            DistTime     = $null
            NewestFile   = $relNewest
            NewestTime   = $(if ($newest) { $newestTime } else { $null })
            InputsCount  = $inputs.Count
        }
    }

    $distTime = (Get-Item $distIdx).LastWriteTimeUtc
    $gitHead  = Get-GitCommit $repoPath
    $builtCommit = $null
    if (Test-Path $commitFile) {
        try {
            $builtCommit = (Get-Content $commitFile -ErrorAction SilentlyContinue | Select-Object -First 1)
            if ($builtCommit) { $builtCommit = $builtCommit.Trim() }
        } catch {}
    }

    # 1. Primary check: git commit recorded at build time vs current repo HEAD
    if ($gitHead -and $builtCommit) {
        if ($builtCommit -ne $gitHead) {
            $headShort  = if ($gitHead.Length -ge 8) { $gitHead.Substring(0, 8) } else { $gitHead }
            $builtShort = if ($builtCommit.Length -ge 8) { $builtCommit.Substring(0, 8) } else { $builtCommit }
            return [PSCustomObject]@{
                NeedsRebuild = $true
                Reason       = "repo HEAD ($headShort) differs from build commit ($builtShort)"
                GitHead      = $gitHead
                BuildCommit  = $builtCommit
                DistTime     = $distTime
                NewestFile   = $relNewest
                NewestTime   = $(if ($newest) { $newestTime } else { $null })
                InputsCount  = $inputs.Count
            }
        }
    }

    # 2. File-time check: fallback when build-commit is missing or untracked/local edits exist
    if ($newest -and ($distTime -lt $newestTime)) {
        $reason = if (-not $builtCommit) {
            "dist/index.html is older than $relNewest ($($newestTime.ToString('yyyy-MM-dd HH:mm:ss')) UTC, build commit not recorded)"
        } else {
            "dist/index.html is older than $relNewest ($($newestTime.ToString('yyyy-MM-dd HH:mm:ss')) UTC)"
        }
        return [PSCustomObject]@{
            NeedsRebuild = $true
            Reason       = $reason
            GitHead      = $gitHead
            BuildCommit  = $builtCommit
            DistTime     = $distTime
            NewestFile   = $relNewest
            NewestTime   = $newestTime
            InputsCount  = $inputs.Count
        }
    }

    $headDisplay = if ($gitHead) { if ($gitHead.Length -ge 8) { $gitHead.Substring(0, 8) } else { $gitHead } } else { 'unknown' }

    return [PSCustomObject]@{
        NeedsRebuild = $false
        Reason       = "dist/index.html is up to date (HEAD $headDisplay, newest input $($newestTime.ToString('yyyy-MM-dd HH:mm:ss')) UTC)"
        GitHead      = $gitHead
        BuildCommit  = $builtCommit
        DistTime     = $distTime
        NewestFile   = $relNewest
        NewestTime   = $newestTime
        InputsCount  = $inputs.Count
    }
}

function Record-FrontendBuildCommit([string]$repoPath) {
    try {
        $head = Get-GitCommit $repoPath
        if (-not $head) { return }
        $distDir = Join-Path $repoPath 'domains\youandinotai.com\frontend\dist'
        if (-not (Test-Path $distDir)) { return }
        $commitFile = Join-Path $distDir 'build-commit.txt'
        Set-Content -Path $commitFile -Value $head -Encoding UTF8 -Force
    } catch {}
}

function Get-KeepaliveAgentDriftAndEnv {
    param(
        [string]$RepoRoot = $Repo,
        [string]$Node = 't5500',
        [bool]$NoWriteStatus = $false
    )

    $driftScript = Join-Path $RepoRoot 'ops\agents\check-agent-drift.ps1'
    $envCheckScript = Join-Path $RepoRoot 'ops\agents\env-names-check.ps1'

    $driftedFiles = New-Object System.Collections.Generic.List[object]
    $scannedCount = 0
    $driftedCount = 0
    $driftLight = 'green'
    $driftOk = $true

    if (Test-Path -LiteralPath $driftScript) {
        $rawLines = & $driftScript -Node $Node -RepoRoot $RepoRoot -SoftExit -NoWriteStatus:$NoWriteStatus 2>&1
        foreach ($item in @($rawLines)) {
            $line = [string]$item
            if ($line -match '^\[DRIFT\]\s+\(([^)]+)\)\s+(.+)$') {
                $driftedFiles.Add([ordered]@{ file = $matches[2].Trim(); reason = $matches[1].Trim() })
            } elseif ($line -match '^\[CHECK\]\s+Summary\b.*light=([a-z]+),\s+ok=(true|false),\s+scanned=(\d+),\s+drifted=(\d+)') {
                $driftLight = $matches[1]
                $driftOk = ($matches[2] -eq 'true')
                $scannedCount = [int]$matches[3]
                $driftedCount = [int]$matches[4]
            }
        }
        if ($driftedFiles.Count -gt 0 -and $driftedCount -eq 0) {
            $driftedCount = $driftedFiles.Count
            $driftOk = $false
            $driftLight = 'amber'
        }
    } else {
        $driftLight = 'amber'
        $driftOk = $false
    }

    $targetServices = New-Object System.Collections.Generic.List[string]
    if (Test-Path -LiteralPath $envCheckScript) {
        $envRaw = (& $envCheckScript -RepoRoot $RepoRoot -Node $Node -ListTargetsOnly -Json 2>$null) -join "`n"
        if (-not [string]::IsNullOrWhiteSpace($envRaw)) {
            try {
                $parsed = $envRaw | ConvertFrom-Json
                foreach ($svc in @($parsed.services)) {
                    if ($null -ne $svc -and -not [string]::IsNullOrWhiteSpace([string]$svc.service)) {
                        $targetServices.Add([string]$svc.service)
                    }
                }
            } catch {}
        }
    }

    $nodeLight = if ($driftedCount -gt 0) { 'amber' } else { 'green' }
    return [ordered]@{
        agentDrift = [ordered]@{
            light = $driftLight
            ok = $driftOk
            scannedCount = $scannedCount
            driftedCount = $driftedCount
            driftedFiles = $driftedFiles.ToArray()
        }
        envTargets = [ordered]@{
            listOnly = $true
            node = $Node
            targetCount = $targetServices.Count
            services = $targetServices.ToArray()
        }
        nodeLight = $nodeLight
    }
}

# ── Stages (dependency order) ──────────────────────────────────────────────
$Stages = @(
    @{ Key = 'ollama'; Name = 'Ollama (Fable pinned)'; Settle = 25
       Probe = { (Test-Path (Join-Path $env:USERPROFILE 'AppData\Local\Programs\Ollama\lib\ollama\llama-server.exe')) -and (Test-Http ('http://' + $T5500Ip + ':11434/api/tags') 8 'joshlcoleman/Fable' @('OLLAMA_GUARD_TOKEN', 'FLEET_SHARED_TOKEN') -AllowLoopbackFallback) }
       Heal  = {
           $llamaSrv = Join-Path $env:USERPROFILE 'AppData\Local\Programs\Ollama\lib\ollama\llama-server.exe'
           $cachedSetup = Join-Path $env:USERPROFILE 'AppData\Local\Ollama\OllamaSetup.exe'
           if (-not (Test-Path $llamaSrv) -and (Test-Path $cachedSetup)) {
               Log '  llama-server.exe missing (broken auto-upgrade) - repairing from cached OllamaSetup.exe'
               Get-Process ollama, 'ollama app' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
               Start-Sleep -Seconds 3
               Start-Process -FilePath $cachedSetup -ArgumentList @('/VERYSILENT', '/NORESTART', '/SUPPRESSMSGBOXES') -Wait -WindowStyle Hidden
               Get-Process 'ollama app' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
               Remove-Item (Join-Path $env:USERPROFILE 'AppData\Local\Ollama\updates_v2') -Recurse -Force -ErrorAction SilentlyContinue
               Log ('  OllamaSetup repair finished (llama-server exists=' + (Test-Path $llamaSrv) + ')')
           }
           $loopbackHost = '127.0.0.1'
           $fleetToken = Get-EnvVal 'FLEET_SHARED_TOKEN'
           $ollamaBind = if ($fleetToken) { '0.0.0.0' } else { $loopbackHost }
           if (-not (Test-Port 11434)) {
               Log ('  starting ollama serve (' + $ollamaBind + ' on port 11434)')
               $env:OLLAMA_HOST = ($ollamaBind + ':11434')
               Start-Process -FilePath $Ollama -ArgumentList 'serve' -WindowStyle Hidden
               $w = 0; while ($w -lt 40 -and -not (Test-Port 11434)) { Start-Sleep -Seconds 1; $w++ }
           }
           # Loading with keep_alive -1 pins Fable in VRAM so Hermes never pays a cold load.
           try {
               $b = @{ model = $FableModel; keep_alive = -1 } | ConvertTo-Json
               $ollamaHdr = Get-FleetProbeHeaders @('OLLAMA_GUARD_TOKEN', 'FLEET_SHARED_TOKEN')
               $pinUrl = if ($fleetToken) { 'http://' + $T5500Ip + ':11434/api/generate' } else { 'http://' + $loopbackHost + ':11434/api/generate' }
               Invoke-RestMethod -Uri $pinUrl -Method Post -Headers $ollamaHdr -Body $b -ContentType 'application/json' -TimeoutSec 140 | Out-Null
           } catch { Log ('  pin failed: ' + $_.Exception.Message) }
       } },

    @{ Key = 'postgres'; Name = 'PostgreSQL :5432'; Settle = 100
       Probe = { Test-PgReady }
       Heal  = {
           # Preferred path: the dedicated boot task (2026-10-17) so the manual portable
           # install stops depending on this elevated loop to exist at all.
           $t = Get-ScheduledTask -TaskName 'ANTIGRAVITY Postgres' -ErrorAction SilentlyContinue
           if ($t) {
               if ($t.State -eq 'Running') { Stop-ScheduledTask -TaskName 'ANTIGRAVITY Postgres'; Start-Sleep -Seconds 2 }
               Start-ScheduledTask -TaskName 'ANTIGRAVITY Postgres'
               Log '  started task "ANTIGRAVITY Postgres"'
               return
           }
           $pidFile = Join-Path $PgData 'postmaster.pid'
           if ((Test-Path $pidFile) -and -not (Get-Process postgres -ErrorAction SilentlyContinue)) {
               Move-Item $pidFile ($pidFile + '.stale-' + (Get-Date -Format 'yyyyMMddHHmmss')) -Force
               Log '  cleared stale postmaster.pid'
           }
           Start-Process -FilePath (Join-Path $PgBin 'pg_ctl.exe') -ArgumentList @('start', '-D', $PgData, '-w', '-t', '80', '-l', (Join-Path $Repo 'logs\pg-t5500.log')) -WindowStyle Hidden
       } },

    @{ Key = 'redis'; Name = 'Redis :6379'; Settle = 20
       Probe = { Test-Redis }
       Heal  = {
           $exe = Get-ChildItem $RedisRoot -Recurse -Filter redis-server.exe -ErrorAction SilentlyContinue | Select-Object -First 1
           if (-not $exe) { Log ('  redis-server.exe not found under ' + $RedisRoot); return }
           Start-Process -FilePath $exe.FullName -ArgumentList @('--bind', '127.0.0.1', '--port', '6379', '--maxmemory', '256mb', '--maxmemory-policy', 'allkeys-lru') -WorkingDirectory $exe.DirectoryName -WindowStyle Hidden
       } },

    @{ Key = 'domains'; Name = ('Domains static sites :{0}' -f $DomainsSvc.port); Settle = 20
       Probe = { Test-Http (Get-FleetServiceUrl -ServiceId 'domains-server' -PathSuffix '/health') 6 'domains-server' @('FLEET_SHARED_TOKEN', 'DOMAINS_SERVER_TOKEN') -AllowLoopbackFallback }
       Heal  = {
           if (Test-Port ([int]$DomainsSvc.port)) { Stop-PortOwner ([int]$DomainsSvc.port) }
           $loopbackHost = '127.0.0.1'
           $fleetToken = Get-EnvVal 'FLEET_SHARED_TOKEN'
           $env:DOMAINS_SERVER_HOST = if ($fleetToken) { Get-FleetBindHost -ServiceId 'domains-server' } else { $loopbackHost }
           $env:DOMAINS_SERVER_PORT = [string]$DomainsSvc.port
           Start-Process -FilePath $Node -ArgumentList @('ops\domains-server\server.mjs') -WorkingDirectory $Repo -WindowStyle Hidden
       } },

    @{ Key = 'frontend'; Name = 'Date-app frontend :3200'; Settle = 60
       Probe = {
           if (-not (Test-Http ('http://' + $T5500Ip + ':3200/') 10 'assets/index-' $null -AllowLoopbackFallback)) { return $false }
           $stale = Get-FrontendStaleness $Repo
           if ($stale.NeedsRebuild) {
               if (-not $script:FrontendRebuildPending) {
                   Log ('  Date-app rebuild triggered on :3200: ' + $stale.Reason)
               }
               return $false
           }
           if (-not (Test-KeepalivePaused)) {
               Record-FrontendBuildCommit $Repo
           }
           $script:FrontendRebuildPending = $false
           return $true
       }
       Heal  = {
           $stale = Get-FrontendStaleness $Repo
           if (Test-Port 3200) {
               $own = (Get-NetTCPConnection -LocalPort 3200 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess
               $pn = (Get-Process -Id $own -ErrorAction SilentlyContinue).ProcessName
               if ($pn -eq 'node') { Stop-PortOwner 3200 } else { Log ('  :3200 held by ' + $pn + ' - not killing; Date-app rebuild skipped'); $script:FrontendRebuildPending = $false; return }
           }
           if (-not $stale.NeedsRebuild) {
               Log ('  Date-app rebuild skipped: ' + $stale.Reason)
               $script:FrontendRebuildPending = $false
           } else {
               $script:FrontendRebuildPending = $true
               Log ('  Date-app rebuild started: ' + $stale.Reason)
               $distIdx = Join-Path $Repo 'domains\youandinotai.com\frontend\dist\index.html'
               Remove-Item $distIdx -Force -ErrorAction SilentlyContinue
           }
           Start-Process -FilePath cmd -ArgumentList @('/c', (Join-Path $Repo 'scripts\fables-house\tab-dateapp.cmd')) -WindowStyle Hidden
       } },

    @{ Key = 'api'; Name = 'Date-app API :8000'; Settle = 60; Needs = @('postgres', 'redis')
       Probe = { Test-Http ('http://' + $T5500Ip + ':8000/api/v1/health') 30 '"db_connected":true' $null -AllowLoopbackFallback }
       Heal  = {
           $py = Join-Path $Repo 'backend\.venv\Scripts\python.exe'
           $pyOk = $false
           try { $v = (& $py --version 2>&1 | Out-String); $pyOk = ($LASTEXITCODE -eq 0 -and $v -match 'Python 3') } catch {}
           if (-not $pyOk) { Log '  API venv python is broken - API cannot start until the venv is rebuilt'; return }
           if (Test-Port 8000) { Stop-PortOwner 8000 }
           Start-Process -FilePath powershell -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $Repo 'scripts\fables-house\tab-dateapp-api.ps1')) -WindowStyle Hidden
       } },

    @{ Key = 'tunnel'; Name = 'Cloudflared tunnel (domains PUBLIC)'; Settle = 45
       Probe = { (@(Get-TunnelProcs).Count -ge 1) -and (@(Get-PublicFailures).Count -eq 0) }
       Heal  = {
           # @() matters: a single CIM object has no usable .Count in Windows PowerShell 5.1,
           # which made one healthy connector look like zero and spawned a duplicate every pass.
           $procs = @(Get-TunnelProcs)
           if ($procs.Count -gt 0) {
               # The tunnel is running but a public page that should answer does not. Restart it
               # only when the origins are healthy; otherwise the origin stage is the real problem.
               if (-not $script:Up['domains'] -or -not $script:Up['frontend']) { Log '  tunnel running; origins are down - not restarting tunnel'; return }
               foreach ($p in $procs) { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue; Log ('  stopped tunnel PID ' + $p.ProcessId + ' before restart') }
               Start-Sleep -Seconds 3
           }
           Start-Process -FilePath $Cloudflared -ArgumentList @('tunnel', '--config', $CfConfig, '--no-autoupdate', '--logfile', (Join-Path $Repo 'logs\cloudflared-t5500.log'), '--loglevel', 'info', 'run') -WindowStyle Hidden
           Log '  started cloudflared tunnel'
       } },

    @{ Key = 'hermes-gateway'; Name = 'Hermes API gateway :8643'; Settle = 25
       Probe = { Test-Http ('http://' + $T5500Ip + ':8643/health') 6 'hermes-agent' @('MISSION_OS_TOKEN', 'FLEET_SHARED_TOKEN') -AllowLoopbackFallback }
       Heal  = {
           if (Test-Port 8643) { Stop-PortOwner 8643 }
           $hDir = Join-Path $env:LOCALAPPDATA 'hermes'
           $hPy = Join-Path $hDir 'tools\python-3.14.7+20260901-win32-x64\python.exe'
           if (Test-Path $hPy) {
               Start-Process -FilePath $hPy -ArgumentList @('-m', 'hermes_cli.main', 'gateway', 'run') -WorkingDirectory $hDir -WindowStyle Hidden
               Log '  started Hermes API gateway :8643'
           }
       } },

    @{ Key = 'mission-control'; Name = 'Mission Control (JARVIS/OPSIS) :3130'; Settle = 30
       Probe = { Test-Http ('http://' + $T5500Ip + ':3130/api/mos-state.json') 8 'mission-agent-os' @('MISSION_OS_TOKEN', 'FLEET_SHARED_TOKEN') -AllowLoopbackFallback }
       Heal  = {
           $t = Get-ScheduledTask -TaskName 'ANTIGRAVITY Mission Control' -ErrorAction SilentlyContinue
           if ($t) {
               if ($t.State -eq 'Running') { Stop-ScheduledTask -TaskName 'ANTIGRAVITY Mission Control' -ErrorAction SilentlyContinue; Start-Sleep -Seconds 2 }
               Start-ScheduledTask -TaskName 'ANTIGRAVITY Mission Control'
               Log '  started task "ANTIGRAVITY Mission Control" (:3130)'
           } else {
               if (Test-Port 3130) { Stop-PortOwner 3130 }
               Start-Process -FilePath $Node -ArgumentList @('mission-os\server.mjs') -WorkingDirectory $Repo -WindowStyle Hidden
               Log '  started mission-os\server.mjs (:3130)'
           }
       } },

    @{ Key = 'social-command-center'; Name = 'Social Command Center & Marketing (:3130/marketing)'; Settle = 20; Needs = @('mission-control')
       # 2026-10-20: Paperclip is permanently retired by Joshua's ruling. All marketing plans,
       # 4-gate compliance/copy-score checks, Fable voice drafting, and 22-platform Social Command
       # Center run natively inside Mission Agent OS on :3130 (/marketing & /api/marketing/plans).
       Probe = { Test-Http ('http://' + $T5500Ip + ':3130/api/marketing/plans') 8 'social-command-center-v5' @('MISSION_OS_TOKEN', 'FLEET_SHARED_TOKEN') -AllowLoopbackFallback }
       Heal  = {
           if (Test-Port 3130) { Stop-PortOwner 3130; Start-Sleep -Seconds 2 }
           Start-Process -FilePath $Node -ArgumentList @('mission-os\server.mjs') -WorkingDirectory $Repo -WindowStyle Hidden
           Log '  restarted mission-os\server.mjs (:3130) for Social Command Center'
       } },

    @{ Key = 'omniroute'; Name = 'OmniRoute gateway :20128'; Settle = 90
       # Non-elevated task "ANTIGRAVITY OmniRoute". 401 without a key = alive and enforcing auth.
       Probe = { try { $r = Invoke-WebRequest 'http://192.168.0.15:20128/' -UseBasicParsing -TimeoutSec 10; ($r.StatusCode -eq 200) } catch { $_.Exception.Response.StatusCode.value__ -in 401, 403 } }
       Heal  = {
           $t = Get-ScheduledTask -TaskName 'ANTIGRAVITY OmniRoute' -ErrorAction SilentlyContinue
           if (-not $t) { Log '  task "ANTIGRAVITY OmniRoute" missing'; return }
           if ($t.State -eq 'Running') { Stop-ScheduledTask -TaskName 'ANTIGRAVITY OmniRoute'; Start-Sleep -Seconds 3 }
           Start-ScheduledTask -TaskName 'ANTIGRAVITY OmniRoute'
           Log '  started task "ANTIGRAVITY OmniRoute"'
       } },

    @{ Key = 'obsidian'; Name = 'Obsidian vault REST :27123 (memory)'; Settle = 40
       # Desktop app: agent-windows.ps1 (interactive, at logon) opens it. Before logon this is DOWN by design.
       Probe = {
           $obsTok = Get-FirstEnvVal @('OBSIDIAN_REST_API_KEY', 'OBSIDIAN_API_KEY', 'FLEET_SHARED_TOKEN')
           $obsHeaders = if ($obsTok) { @{ Authorization = ('Bearer ' + $obsTok); 'X-Fleet-Token' = $obsTok; 'X-Mission-OS-Token' = $obsTok } } else { @{} }
           $ok = Test-Cloud 'obsidian' ('http://' + $T5500Ip + ':27123/') $obsHeaders
           if (-not $ok) {
               $loopbackHost = '127.0.0.1'
               $ok = Test-Cloud 'obsidian-loopback' ('http://' + $loopbackHost + ':27123/') $obsHeaders
           }
           return $ok
       }
       Heal  = { $script:CloudCache.Remove('obsidian'); $script:CloudCache.Remove('obsidian-loopback'); Log '  Obsidian is opened by the agent-windows supervisor after logon' } },

    @{ Key = 'supabase'; Name = 'Supabase (memory backup)'; Settle = 0
       Probe = { $k = Get-EnvVal 'SUPABASE_SECRET_KEY'; Test-Cloud 'supabase' ((Get-EnvVal 'SUPABASE_URL') + '/rest/v1/') @{ apikey = $k; Authorization = ('Bearer ' + $k) } }
       Heal  = { $script:CloudCache.Remove('supabase'); Log '  Supabase unreachable or key rejected (cloud - check environment variable)' } },

    @{ Key = 'supermemory'; Name = 'Supermemory (memory backup)'; Settle = 0
       Probe = { Test-Cloud 'supermemory' 'https://api.supermemory.ai/v3/settings' @{ Authorization = ('Bearer ' + (Get-EnvVal 'SUPER_MEMORY_API_KEY')) } }
       Heal  = { $script:CloudCache.Remove('supermemory'); Log '  Supermemory unreachable or key rejected (cloud)' } },

    @{ Key = 'vercel'; Name = 'Vercel API'; Settle = 0
       Probe = { Test-Cloud 'vercel' 'https://api.vercel.com/v2/user' @{ Authorization = ('Bearer ' + (Get-EnvVal 'VERCEL_API_KEY')) } }
       Heal  = { $script:CloudCache.Remove('vercel'); Log '  Vercel unreachable or token rejected (cloud)' } },

    @{ Key = 'hermes'; Name = 'Hermes customer support desk'; Settle = 45; Needs = @('ollama', 'api')
       # After logon, ops\t5500\agent-windows.ps1 runs Hermes in a visible HERMES window and
       # reopens it if closed. While that supervisor is up the keepalive defers to it and
       # retires the hidden pre-logon copy (separate sessions, so the mutex cannot see both).
       Probe = {
           $all = @(Get-CimInstance Win32_Process -Filter "CommandLine LIKE '%hermes-support.ps1%'" -ErrorAction SilentlyContinue)
           $sup = @(Get-CimInstance Win32_Process -Filter "CommandLine LIKE '%agent-windows.ps1%'" -ErrorAction SilentlyContinue)
           if ($sup.Count -ge 1) {
               $hidden  = @($all | Where-Object { $_.CommandLine -notmatch '-Console' })
               $visible = @($all | Where-Object { $_.CommandLine -match '-Console' })
               if ($visible.Count -ge 1) {
                   if (-not (Test-KeepalivePaused)) {
                       foreach ($p in $hidden) { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue; Log ('  retired hidden Hermes PID ' + $p.ProcessId + ' (visible window owns support)') }
                   }
               }
               return ($visible.Count -ge 1)
           }
           return ($all.Count -ge 1)
       }
       Heal  = {
           if (@(Get-CimInstance Win32_Process -Filter "CommandLine LIKE '%agent-windows.ps1%'" -ErrorAction SilentlyContinue).Count -ge 1) {
               Log '  agent-windows supervisor owns Hermes - it reopens the window'
               return
           }
           Start-Process -FilePath powershell -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', (Join-Path $Dir 'hermes-support.ps1')) -WindowStyle Hidden
           Log '  started Hermes customer support harness (hidden, pre-logon)'
       } }
)

$script:Fails  = @{}
$script:Up     = @{}
$script:Result = @{}

function Add-Trigger([string]$stage, [int]$passes) {
    try {
        $o = [ordered]@{ ts = (Get-Date).ToUniversalTime().ToString('o'); kind = 'stage_failed'; stage = $stage; consecutive_passes = $passes; host = $env:COMPUTERNAME }
        Add-Content -Path $Triggers -Value ($o | ConvertTo-Json -Compress)
    } catch {}
}

function Invoke-Stage($s) {
    $key = $s.Key; $name = $s.Name
    $paused = Test-KeepalivePaused
    $ok = $false
    try { $ok = [bool](& $s.Probe) } catch { $ok = $false }
    if ($ok) {
        $script:Up[$key] = $true
        $script:Result[$key] = 'UP'
        $script:Fails[$key] = 0
        if ($paused) {
            Log ('[' + $name + '] UP (healing is paused)')
        }
        return
    }

    if ($paused) {
        $n = 1 + [int]$script:Fails[$key]; $script:Fails[$key] = $n
        $script:Up[$key] = $false; $script:Result[$key] = 'DOWN'
        Log ('[' + $name + '] DOWN - healing is paused (' + $PauseFile + ') (consecutive pass ' + $n + ')')
        return
    }

    foreach ($n in @($s.Needs)) {
        if ($n -and -not $script:Up[$n]) {
            $script:Up[$key] = $false; $script:Result[$key] = "WAITING ($n down)"
            Log ('[' + $name + '] down, waiting on ' + $n)
            return
        }
    }

    Log ('[' + $name + '] DOWN - healing')
    try { & $s.Heal } catch { Log ('  heal error: ' + $_.Exception.Message) }
    $deadline = (Get-Date).AddSeconds($s.Settle)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 3
        try { if ([bool](& $s.Probe)) { $ok = $true; break } } catch {}
    }
    if ($ok) {
        Log ('[' + $name + '] HEALED')
        $script:Up[$key] = $true; $script:Result[$key] = 'HEALED'; $script:Fails[$key] = 0
    } else {
        if ($key -eq 'frontend' -and $script:FrontendRebuildPending) {
            Log '  Date-app rebuild failed: dist/index.html is still missing or stale'
            $script:FrontendRebuildPending = $false
        }
        $n = 1 + [int]$script:Fails[$key]; $script:Fails[$key] = $n
        $script:Up[$key] = $false; $script:Result[$key] = 'DOWN'
        Log ('[' + $name + '] still DOWN after heal (consecutive pass ' + $n + ')')
        if ($n -ge 20 -and $n % 20 -eq 0) { Add-Trigger $key $n }
    }
}

function Write-Status {
    Sync-KeepalivePaths
    $paused = Test-KeepalivePaused
    $stages = foreach ($s in $Stages) { [ordered]@{ stage = $s.Name; status = $script:Result[$s.Key]; consecutive_failures = [int]$script:Fails[$s.Key] } }
    $doms = foreach ($d in $Domains) {
        $ns = Get-NsState $d.Host
        $origin = if (Test-Origin $d) { 'OK' } else { 'DOWN' }
        $pm = if ($d.PublicMark) { $d.PublicMark } else { $d.Mark }; $public = if ($ns -ne 'cloudflare') { 'PENDING NAMESERVERS' } elseif (Test-Http ('https://' + $d.Host) 20 $pm) { 'UP' } else { 'DOWN' }
        [ordered]@{ domain = $d.Host; nameservers = $ns; origin = $origin; public = $public }
    }
    $e4 = Get-KeepaliveAgentDriftAndEnv -RepoRoot $Repo -NoWriteStatus:([bool]$DryRun -or $paused)
    $anyStageDown = @($stages | Where-Object { $_.status -ne 'UP' }).Count -gt 0
    $nodeLight = if ($anyStageDown) { 'red' } elseif ($e4.agentDrift.driftedCount -gt 0) { 'amber' } else { 'green' }
    $o = [ordered]@{
        updated = (Get-Date).ToString('s')
        node = $env:COMPUTERNAME
        paused = $paused
        pauseFile = $(if ($paused) { $PauseFile } else { $null })
        nodeLight = $nodeLight
        agentDrift = $e4.agentDrift
        envTargets = $e4.envTargets
        stages = @($stages)
        domains = @($doms)
    }
    try {
        $statusDir = [IO.Path]::GetDirectoryName($StatusFile)
        if ($statusDir -and -not (Test-Path -LiteralPath $statusDir)) {
            New-Item -ItemType Directory -Force -Path $statusDir | Out-Null
        }
        $o | ConvertTo-Json -Depth 6 | Set-Content -Path $StatusFile -Encoding UTF8
    } catch {}
}

function Invoke-Pass {
    Sync-KeepalivePaths
    $script:Up = @{}; $script:Result = @{}
    if (Test-KeepalivePaused) {
        Log ('[PAUSE] ' + $PauseFile + ' exists - healing is paused; probing and logging only')
    } else {
        Remove-DuplicateTunnels
    }
    foreach ($s in $Stages) { Invoke-Stage $s }
    Write-Status
}

if ($FunctionsOnly) {
    return
}

if ($Test) {
    $testScript = Join-Path $Dir 'test-frontend-staleness.ps1'
    if (Test-Path $testScript) {
        & $testScript -RepoPath $Repo
        exit $LASTEXITCODE
    } else {
        Write-Error "Test script not found at $testScript"
        exit 1
    }
}

if ($DryRun) {
    $stale = Get-FrontendStaleness $Repo
    $e4 = Get-KeepaliveAgentDriftAndEnv -RepoRoot $Repo -NoWriteStatus:$true
    Write-Host "=== Date-App Frontend Rebuild Decision (Dry-Run) ==="
    Write-Host ("Repository root:    " + $Repo)
    Write-Host ("Pause file:         " + $PauseFile + " (Paused: " + (Test-KeepalivePaused) + ")")
    Write-Host ("Frontend directory: domains\youandinotai.com\frontend")
    Write-Host ("Target:             dist\index.html (Exists: " + ($stale.DistTime -ne $null) + ", Time: " + $(if ($stale.DistTime) { $stale.DistTime.ToString('yyyy-MM-dd HH:mm:ss') + ' UTC' } else { 'none' }) + ")")
    Write-Host ("Git HEAD commit:    " + $(if ($stale.GitHead) { $stale.GitHead } else { 'none' }))
    Write-Host ("Build commit file:  dist\build-commit.txt (Recorded: " + $(if ($stale.BuildCommit) { $stale.BuildCommit } else { 'none' }) + ")")
    Write-Host ("Build inputs count: " + $stale.InputsCount + " files (src, public [filtered], index.html, content\blog\youandinotai, build_blog_static.py, vite.config.ts, package files)")
    Write-Host ("Newest input file:  " + $(if ($stale.NewestFile) { $stale.NewestFile + ' (' + $stale.NewestTime.ToString('yyyy-MM-dd HH:mm:ss') + ' UTC)' } else { 'none' }))
    Write-Host ""
    Write-Host ("DECISION:           " + $(if ($stale.NeedsRebuild) { "REBUILD NEEDED" } else { "UP TO DATE" }))
    Write-Host ("REASON:             " + $stale.Reason)
    Write-Host ("[DRY RUN] agentDrift: light={0} ok={1} scanned={2} drifted={3} envTargets={4} nodeLight={5}" -f $e4.agentDrift.light, $e4.agentDrift.ok, $e4.agentDrift.scannedCount, $e4.agentDrift.driftedCount, $e4.envTargets.targetCount, $e4.nodeLight)
    Write-Host "===================================================="
    exit 0
}

Log ('keep-alive started (once=' + [bool]$Once + ', pid=' + $PID + ')')
do {
    try { Invoke-Pass } catch { Log ('pass error: ' + $_.Exception.Message) }
    if ($Once) { break }
    Start-Sleep -Seconds 60
} while ($true)

