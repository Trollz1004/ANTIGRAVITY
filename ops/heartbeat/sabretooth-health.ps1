<#
.SYNOPSIS
  SABRETOOTH deterministic health probe. No AI CLI is invoked anywhere in this
  script — it is plain PowerShell 5.1-compatible code (no modules) that probes,
  logs, and can run the existing House one-pass to heal. Runs every 30 minutes
  from the scheduled task ANTIGRAVITY-Sabretooth-Health.

.NOTES
  Bypasses the system proxy for localhost probes ([System.Net.WebRequest]::
  DefaultWebProxy = $null) because this box has been seen routing 127.0.0.1
  through a configured proxy, which times out. 6-second timeouts on every
  network probe so one dead service can't stall the whole pass.

  -Verbose prints a formatted table to the console (used by `drift health`).
  Without -Verbose the script is silent except for its two output files —
  matching the House's own "watchdog never steals the console" rule.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Continue'
[System.Net.WebRequest]::DefaultWebProxy = $null

$Repo = 'C:\ANTIGRAVITY'
$HeartbeatDir = Join-Path $Repo 'ops\heartbeat'
$JsonOut = Join-Path $HeartbeatDir 'sabretooth-health.json'
$LogOut = Join-Path $HeartbeatDir 'health.log'
$TriggersOut = Join-Path $HeartbeatDir 'TRIGGERS.jsonl'
$HealLock = Join-Path $HeartbeatDir '.heal-lock'
$AutoHealFlag = Join-Path $HeartbeatDir '.auto-heal-enabled'
$HouseScript = Join-Path $Repo 'scripts\fables-house\FABLES-HOUSE.ps1'
New-Item -ItemType Directory -Force -Path $HeartbeatDir | Out-Null

function Nowz { (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ') }

# ── HTTP probe: identity-checked, never trusts a bare 200 ──────────────────
function Test-HttpIdentity {
    param([string]$Url, [int]$TimeoutSec = 6, [string]$MustContain = $null)
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec -ErrorAction Stop
        $ok = $r.StatusCode -eq 200
        if ($ok -and $MustContain) { $ok = ($r.Content -match [regex]::Escape($MustContain)) }
        return @{ ok = $ok; status = $r.StatusCode; detail = $(if ($ok) { 'identity ok' } else { "HTTP $($r.StatusCode), missing '$MustContain'" }) }
    } catch {
        $msg = $_.Exception.Message
        # Known box quirk: TLS to some hosts throws SEC_E_INTERNAL_ERROR via schannel.
        # Record it distinctly rather than counting it as a plain failure.
        if ($msg -match 'SEC_E_INTERNAL_ERROR|schannel') {
            return @{ ok = $null; status = 'SCHANNEL'; detail = $msg }
        }
        return @{ ok = $false; status = 0; detail = $msg }
    }
}

function Test-TcpPort {
    param([string]$HostName = '127.0.0.1', [int]$Port, [int]$TimeoutMs = 6000)
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $iar = $client.BeginConnect($HostName, $Port, $null, $null)
        $connected = $iar.AsyncWaitHandle.WaitOne($TimeoutMs, $false)
        if ($connected -and $client.Connected) { $client.EndConnect($iar); $client.Close(); return $true }
        $client.Close(); return $false
    } catch { return $false }
}

# Raw TCP PING\r\n against Redis — redis-cli.exe is not installed on this box's
# PATH check path (the House uses the absolute path under C:\Users\joshi\redis-win,
# this probe avoids depending on that binary at all).
function Test-RedisPing {
    param([string]$HostName = '127.0.0.1', [int]$Port = 6379, [int]$TimeoutMs = 6000)
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $iar = $client.BeginConnect($HostName, $Port, $null, $null)
        if (-not $iar.AsyncWaitHandle.WaitOne($TimeoutMs, $false)) { $client.Close(); return @{ ok = $false; detail = 'connect timeout' } }
        $client.EndConnect($iar)
        $stream = $client.GetStream()
        $stream.ReadTimeout = $TimeoutMs
        $bytes = [System.Text.Encoding]::ASCII.GetBytes("PING`r`n")
        $stream.Write($bytes, 0, $bytes.Length)
        $buf = New-Object byte[] 64
        $n = $stream.Read($buf, 0, $buf.Length)
        $resp = [System.Text.Encoding]::ASCII.GetString($buf, 0, $n)
        $client.Close()
        return @{ ok = ($resp -match '\+PONG'); detail = $resp.Trim() }
    } catch { return @{ ok = $false; detail = $_.Exception.Message } }
}

# Cloudflare Access gate check — for a hostname that is DELIBERATELY behind
# Access, seeing the sign-in page (not the app) is the correct, healthy state.
# Looks for the Access markers in the returned body rather than trusting a
# bare 200 (Rule 7: verify identity, not status).
function Test-AccessGate {
    param([string]$Url, [int]$TimeoutSec = 8)
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec -ErrorAction Stop
        $isAccessGate = ($r.Content -match 'Cloudflare Access' -or $r.Content -match 'cloudflareaccess\.com' -or $r.Content -match 'One-time PIN' -or $r.Content -match 'Sign in with')
        return @{ ok = $isAccessGate; status = $r.StatusCode; detail = $(if ($isAccessGate) { 'Access sign-in gate present' } else { "HTTP $($r.StatusCode), no Access markers found" }) }
    } catch {
        $msg = $_.Exception.Message
        if ($msg -match 'SEC_E_INTERNAL_ERROR|schannel') { return @{ ok = $null; status = 'SCHANNEL'; detail = $msg } }
        # A 1033/edge error still throws via Invoke-WebRequest with a status code attached.
        $code = 0
        if ($_.Exception.Response) { try { $code = [int]$_.Exception.Response.StatusCode } catch {} }
        return @{ ok = $false; status = $code; detail = $msg }
    }
}

# Domain landing-page probe that tells "not yet delegated to Cloudflare" (an
# expected, named pending state) apart from an actual DOWN once it is.
function Test-DomainLanding {
    param([string]$Domain, [string]$MustContain, [int]$TimeoutSec = 8)
    $nsNames = ''
    try {
        $ns = Resolve-DnsName -Name $Domain -Type NS -ErrorAction Stop
        $nsNames = (($ns | Where-Object { $_.Type -eq 'NS' } | Select-Object -ExpandProperty NameHost) -join ',')
    } catch {
        $nsNames = "resolve failed: $($_.Exception.Message)"
    }
    if ($nsNames -notmatch 'cloudflare') {
        return @{ status = 'PENDING NAMESERVERS'; detail = "NS=$nsNames" }
    }
    $probe = Test-HttpIdentity -Url "https://$Domain/" -TimeoutSec $TimeoutSec -MustContain $MustContain
    if ($probe.ok -eq $true) { return @{ status = 'UP'; detail = $probe.detail } }
    elseif ($probe.status -eq 'SCHANNEL') { return @{ status = 'SCHANNEL'; detail = $probe.detail } }
    else { return @{ status = 'DOWN'; detail = "NS=$nsNames; $($probe.detail)" } }
}

function Get-EnvKey {
    param([string]$Name, [string]$EnvFile = 'C:\ANTIGRAVITY\.env')
    try {
        foreach ($line in Get-Content $EnvFile -ErrorAction Stop) {
            if ($line -match ('^' + [regex]::Escape($Name) + '=(.*)$')) { return $Matches[1].Trim('"') }
        }
    } catch {}
    return ''
}

# ── one probe pass over every target ────────────────────────────────────────
function Invoke-ProbePass {
    $required = [ordered]@{}
    $optional = [ordered]@{}

    # PostgreSQL 5432 — same pg_isready path the House uses.
    $pgReady = 'C:\Users\joshi\pgsql16\bin\pg_isready.exe'
    if (Test-Path $pgReady) {
        & $pgReady -h 127.0.0.1 -p 5432 -q 2>$null
        $pgOk = ($LASTEXITCODE -eq 0)
        $required['postgres_5432'] = @{ status = $(if ($pgOk) { 'UP' } else { 'DOWN' }); detail = 'pg_isready' }
    } else {
        $portOk = Test-TcpPort -Port 5432
        $required['postgres_5432'] = @{ status = $(if ($portOk) { 'UP' } else { 'DOWN' }); detail = 'pg_isready.exe missing - TCP fallback' }
    }

    # Redis 6379 — raw TCP PING.
    $redis = Test-RedisPing -Port 6379
    $required['redis_6379'] = @{ status = $(if ($redis.ok) { 'UP' } else { 'DOWN' }); detail = $redis.detail }

    # OmniRoute — /api/health ok AND /api/v1/models contains auto/best-coding.
    $omniKey = Get-EnvKey 'OMNI_ROUTE_API_KEY'
    $omniHealth = Test-HttpIdentity -Url 'http://127.0.0.1:20128/api/health' -MustContain 'ok'
    $modelsOk = $false; $modelsDetail = 'not probed'
    try {
        $hdr = @{}
        if ($omniKey) { $hdr['Authorization'] = "Bearer $omniKey" }
        $r = Invoke-WebRequest -Uri 'http://127.0.0.1:20128/api/v1/models' -UseBasicParsing -TimeoutSec 6 -Headers $hdr -ErrorAction Stop
        $modelsOk = ($r.StatusCode -eq 200 -and $r.Content -match 'auto/best-coding')
        $modelsDetail = "HTTP $($r.StatusCode)"
    } catch { $modelsDetail = $_.Exception.Message }
    $omniOk = ($omniHealth.ok -eq $true) -and $modelsOk
    $required['omniroute_20128'] = @{ status = $(if ($omniOk) { 'UP' } else { 'DOWN' }); detail = "health=$($omniHealth.detail); models=$modelsDetail" }

    # Backend API — db_connected:true.
    $backend = Test-HttpIdentity -Url 'http://127.0.0.1:8000/api/v1/health' -MustContain '"db_connected":true'
    $required['backend_8000'] = @{ status = $(if ($backend.ok) { 'UP' } else { 'DOWN' }); detail = $backend.detail }

    # Frontend — production bundle marker.
    $frontend = Test-HttpIdentity -Url 'http://127.0.0.1:3200/' -MustContain 'assets/index-'
    $required['frontend_3200'] = @{ status = $(if ($frontend.ok) { 'UP' } else { 'DOWN' }); detail = $frontend.detail }

    # Public site — SCHANNEL is recorded, not counted as a failure.
    $public = Test-HttpIdentity -Url 'https://youandinotai.com' -TimeoutSec 6 -MustContain 'assets/index-'
    $pubStatus = if ($public.ok -eq $true) { 'UP' } elseif ($public.status -eq 'SCHANNEL') { 'SCHANNEL' } else { 'DOWN' }
    $required['public_youandinotai'] = @{ status = $pubStatus; detail = $public.detail }

    # JARVIS — required, port 9150, identity jarvis-dashboard.
    $jarvis = Test-HttpIdentity -Url 'http://127.0.0.1:9150/health' -MustContain 'jarvis-dashboard'
    $required['jarvis_9150'] = @{ status = $(if ($jarvis.ok) { 'UP' } else { 'DOWN' }); detail = $jarvis.detail }

    # ── optional targets ──
    # mc5_3151 probe removed 2026-09-17: MC5 is retired, per the One Mission
    # Control ruling (JARVIS on :9150 absorbed it).
    # sentry_9140 probe removed 2026-09-18: Fable's Sentry is no longer a
    # separate service — it is folded into JARVIS as /api/sentry, which the
    # jarvis_9150 check above already covers by proving JARVIS itself is up.

    $hermesPort = Test-TcpPort -Port 9119
    $optional['hermes_9119'] = @{ status = $(if ($hermesPort) { 'UP' } else { 'DOWN' }); detail = 'TCP probe' }

    $ollama = Test-HttpIdentity -Url 'http://127.0.0.1:11434/api/tags' -TimeoutSec 6
    $optional['ollama_11434'] = @{ status = $(if ($ollama.ok) { 'UP' } else { 'DOWN' }); detail = $ollama.detail }

    # Domains phase (2026-09-18) — local static vhost server for the three
    # landing sites (dream-online.net, untilnokidinneed.com, onlinerecycle.net).
    $domainsSrv = Test-HttpIdentity -Url 'http://127.0.0.1:9160/health' -MustContain 'domains-server'
    $optional['domains_9160'] = @{ status = $(if ($domainsSrv.ok) { 'UP' } else { 'DOWN' }); detail = $domainsSrv.detail }

    # dashboard.aidoesitall.website is gated by Cloudflare Access on purpose —
    # UP means the Access sign-in page (or its One-time-PIN prompt) is showing,
    # NOT a working dashboard response. Error 1033 (tunnel not reachable) or any
    # other body counts as DOWN.
    $dashAccess = Test-AccessGate -Url 'https://dashboard.aidoesitall.website/'
    $optional['dashboard_access_aidoesitall'] = @{ status = $(if ($dashAccess.ok -eq $true) { 'UP' } elseif ($dashAccess.status -eq 'SCHANNEL') { 'SCHANNEL' } else { 'DOWN' }); detail = $dashAccess.detail }

    # The three domains are pending Joshua's one-time nameserver click at the
    # registrar (see C:\Users\joshi\OneDrive\claude-to-claude\
    # DNS-NAMESERVERS-TO-SET-2026-09-18.md). Until that propagates, live NS
    # still resolves to IONOS (or fails), which is an expected, named state —
    # PENDING NAMESERVERS — not a DOWN. Once NS shows cloudflare, this probes
    # the real landing page the same way the other public probes do.
    $optional['domain_dream_online_net'] = Test-DomainLanding -Domain 'dream-online.net' -MustContain 'DREAM Online'
    $optional['domain_untilnokidinneed_com'] = Test-DomainLanding -Domain 'untilnokidinneed.com' -MustContain 'Until No Kid In Need'
    $optional['domain_onlinerecycle_net'] = Test-DomainLanding -Domain 'onlinerecycle.net' -MustContain 'DIY NAS'

    return @{ required = $required; optional = $optional }
}

# Hermes repo clone check removed 2026-09-17: Trollz1004/hermes is archived
# (folded into this repo under hermes/); the clone at ~/hermes is a stale
# leftover, not a repo this node's health should track.
function Get-GitStatus {
    param([string]$Path, [string]$Branch)
    $result = @{ path = $Path; dirty = $null; ahead_behind_origin = 'unknown' }
    if (-not (Test-Path $Path)) { $result.detail = 'path missing'; return $result }
    Push-Location $Path
    try {
        $porcelain = & git status --porcelain 2>$null
        $result.dirty_lines = @($porcelain).Count
        $head = (& git rev-parse HEAD 2>$null).Trim()
        $originRef = (& git rev-parse "origin/$Branch" 2>$null).Trim()
        $result.head = $head
        $result.origin = $originRef
        $result.equal_to_origin = ($head -and $originRef -and $head -eq $originRef)
    } catch { $result.detail = $_.Exception.Message } finally { Pop-Location }
    return $result
}

function Get-SaleStatusLine {
    $file = Join-Path $Repo 'ops\sale\YOUANDINOTAI-SALE-LISTING.md'
    if (-not (Test-Path $file)) { return 'sale listing file missing' }
    $lines = Get-Content $file
    $inSection = $false
    $last = $null
    foreach ($line in $lines) {
        if ($line -match '^##\s+Status log') { $inSection = $true; continue }
        if ($inSection -and $line -match '^##\s') { break }
        if ($inSection -and $line.Trim().Length -gt 0) { $last = $line.Trim() }
    }
    return $(if ($last) { $last } else { '(no status log entries)' })
}

function Write-VerboseTable {
    param($Snapshot)
    Write-Host ''
    Write-Host ("SABRETOOTH health @ {0}  overall={1}" -f $Snapshot.ts, $Snapshot.overall) -ForegroundColor Cyan
    Write-Host '-- required --' -ForegroundColor DarkGray
    foreach ($k in $Snapshot.required.Keys) {
        $v = $Snapshot.required[$k]
        $color = switch ($v.status) { 'UP' { 'Green' } 'SCHANNEL' { 'DarkYellow' } default { 'Red' } }
        Write-Host ("  {0,-24} {1,-10} {2}" -f $k, $v.status, $v.detail) -ForegroundColor $color
    }
    Write-Host '-- optional --' -ForegroundColor DarkGray
    foreach ($k in $Snapshot.optional.Keys) {
        $v = $Snapshot.optional[$k]
        $color = switch ($v.status) { 'UP' { 'Green' } default { 'Yellow' } }
        Write-Host ("  {0,-24} {1,-10} {2}" -f $k, $v.status, $v.detail) -ForegroundColor $color
    }
    Write-Host ("git  {0}: {1} dirty lines, equal_to_origin={2}" -f 'ANTIGRAVITY', $Snapshot.git.antigravity.dirty_lines, $Snapshot.git.antigravity.equal_to_origin) -ForegroundColor DarkGray
    Write-Host ("sale: {0}" -f $Snapshot.sale.status_line) -ForegroundColor DarkGray
    Write-Host ''
}

function Get-Overall {
    param($Pass, $Git)
    $requiredFailed = @($Pass.required.Values | Where-Object { $_.status -ne 'UP' -and $_.status -ne 'SCHANNEL' })
    if ($requiredFailed.Count -gt 0) { return 'RED' }
    $optionalFailed = @($Pass.optional.Values | Where-Object { $_.status -ne 'UP' })
    $gitDirtyOrBehind = ($Git.antigravity.dirty_lines -gt 0) -or ($Git.antigravity.equal_to_origin -eq $false)
    if ($optionalFailed.Count -gt 0 -or $gitDirtyOrBehind) { return 'YELLOW' }
    return 'GREEN'
}

# ── run pass 1 ───────────────────────────────────────────────────────────
$pass = Invoke-ProbePass
$gitStatus = @{
    antigravity = Get-GitStatus -Path $Repo -Branch 'main'
}
$saleLine = Get-SaleStatusLine
$overall = Get-Overall -Pass $pass -Git $gitStatus

$snapshot = [ordered]@{
    ts = Nowz
    node = 'sabretooth'
    required = $pass.required
    optional = $pass.optional
    git = $gitStatus
    sale = @{ status_line = $saleLine }
    overall = $overall
}

# ── RED path: log trigger, run the House one pass, re-probe, rewrite ──────
if ($overall -eq 'RED') {
    $failedStages = @($pass.required.Keys | Where-Object { $pass.required[$_].status -ne 'UP' -and $pass.required[$_].status -ne 'SCHANNEL' })
    $trigger = [ordered]@{ ts = Nowz; kind = 'stage_failed'; stages = $failedStages; detail = ($pass.required | ConvertTo-Json -Compress -Depth 5) }
    Add-Content -Path $TriggersOut -Value ($trigger | ConvertTo-Json -Compress -Depth 5)

    if (Test-Path $HouseScript) {
        # FABLES-HOUSE.cmd does not forward arguments to the .ps1 (verified by
        # reading it) so a one-pass heal must call the script directly with
        # -Once, the documented one-pass form from the script's own header.
        try {
            & powershell -NoProfile -ExecutionPolicy Bypass -File $HouseScript -Once | Out-Null
        } catch { Write-Verbose "House one-pass errored: $($_.Exception.Message)" }
    } else {
        Write-Verbose "House script not found at $HouseScript - cannot heal"
    }

    Start-Sleep -Seconds 5
    $pass = Invoke-ProbePass
    $gitStatus = @{
        antigravity = Get-GitStatus -Path $Repo -Branch 'main'
    }
    $saleLine = Get-SaleStatusLine
    $overall = Get-Overall -Pass $pass -Git $gitStatus
    $snapshot = [ordered]@{
        ts = Nowz
        node = 'sabretooth'
        required = $pass.required
        optional = $pass.optional
        git = $gitStatus
        sale = @{ status_line = $saleLine }
        overall = $overall
    }

    # Opt-in escalation, documented but left UNUSED by default: if
    # ops/heartbeat/.auto-heal-enabled exists (it does not ship with this repo
    # and this script never creates it), still RED after the House pass, and no
    # .heal-lock newer than 60 minutes, the script MAY run the command stored on
    # the first line of that flag file with a 10-minute timeout. This is
    # deliberately opt-in and unused: Joshua would need to create the flag file
    # himself for this branch to ever execute.
    if ((Test-Path $AutoHealFlag) -and $overall -eq 'RED') {
        $lockStale = $true
        if (Test-Path $HealLock) {
            $lockAge = (Get-Date) - (Get-Item $HealLock).LastWriteTime
            $lockStale = ($lockAge.TotalMinutes -ge 60)
        }
        if ($lockStale) {
            $cmdLine = (Get-Content $AutoHealFlag -TotalCount 1)
            if ($cmdLine) {
                Set-Content -Path $HealLock -Value (Nowz)
                Write-Verbose "Opt-in auto-heal flag present - running: $cmdLine (10-min timeout)"
                try {
                    $job = Start-Job -ScriptBlock { param($c) Invoke-Expression $c } -ArgumentList $cmdLine
                    Wait-Job $job -Timeout 600 | Out-Null
                    Receive-Job $job -ErrorAction SilentlyContinue | Out-Null
                    Remove-Job $job -Force -ErrorAction SilentlyContinue
                } catch { Write-Verbose "opt-in auto-heal command errored: $($_.Exception.Message)" }
            }
        } else {
            Write-Verbose ".heal-lock is newer than 60 minutes - not running opt-in auto-heal again yet"
        }
    }
}

# ── write outputs ───────────────────────────────────────────────────────
$snapshot | ConvertTo-Json -Depth 6 | Set-Content -Path $JsonOut -Encoding UTF8

$reqSummary = ($pass.required.Keys | ForEach-Object { "$($_):$($pass.required[$_].status)" }) -join ' '
$logLine = "[{0}] SABRETOOTH {1} | {2}" -f (Nowz), $overall, $reqSummary
Add-Content -Path $LogOut -Value $logLine

if ($PSBoundParameters.ContainsKey('Verbose') -or $VerbosePreference -ne 'SilentlyContinue') {
    Write-VerboseTable -Snapshot $snapshot
}

exit 0
