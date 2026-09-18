# ═══════════════════════════════════════════════════════════════════════════
#  FABLE'S HOUSE — Sabretooth full-stack bootstrap, validation-gated, self-healing
#  Built for the Shriners presentation window. 2026-08-16.
#
#  Rules of the House:
#   - A stage does NOT start until every stage before it has VALIDATED (not
#     just launched — answered a real probe).
#   - A required stage that fails is retried forever with backoff. The window
#     NEVER closes on error; it tells you exactly which brick is loose.
#   - After full bring-up it becomes a watchdog: re-validates every stage every
#     60s and heals anything that fell.
#   - Optional stages (Ollama, Stack Health) warn and continue if absent.
#
#  Run:  FABLES-HOUSE.cmd            (repo root — console stays open)
#        powershell -File scripts\fables-house\FABLES-HOUSE.ps1 -Once   (single pass, no watchdog)
# ═══════════════════════════════════════════════════════════════════════════
param([switch]$Once, [switch]$Watchdog)

$ErrorActionPreference = 'Continue'
$Repo = 'C:\ANTIGRAVITY'
$LogFile = Join-Path $Repo 'logs\fables-house.log'
New-Item -ItemType Directory -Force -Path (Split-Path $LogFile) | Out-Null

function Log($msg, $color = 'Gray') {
    $line = "[{0}] {1}" -f (Get-Date -Format 'HH:mm:ss'), $msg
    # Watchdog mode is SILENT: file only — no console output, no window, no
    # cursor theft, ever (Joshua's rule). Interactive mode prints normally.
    if (-not $Watchdog) { Write-Host $line -ForegroundColor $color }
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
}

function Test-Port($port) {
    try { (Test-NetConnection 127.0.0.1 -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue) } catch { $false }
}

# ── One House at a time (2026-09-10). Two watchdogs double every heal: an
# elevated one from the logon task plus a non-elevated one from drift both ran on
# 2026-09-10 and neither could see the other's processes. Whoever starts last wins.
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.ProcessId -ne $PID -and $_.Name -eq 'powershell.exe' -and $_.CommandLine -match 'FABLES-HOUSE[.]ps1' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; Log ("  stopped an older House process (PID {0}) - one House at a time" -f $_.ProcessId) 'DarkGray' }

# Staleness: a service whose process started before its code was last written is
# running OLD code. That is not health. The House restarts it (it can, because
# the logon task runs the House elevated; a non-elevated shell cannot touch those).
function Get-NewestWriteUtc([string[]]$paths) {
    $newest = [datetime]::MinValue
    foreach ($p in $paths) {
        if (-not (Test-Path $p)) { continue }
        $items = if ((Get-Item $p).PSIsContainer) { Get-ChildItem $p -Recurse -File -ErrorAction SilentlyContinue } else { Get-Item $p }
        foreach ($i in $items) { if ($i.LastWriteTimeUtc -gt $newest) { $newest = $i.LastWriteTimeUtc } }
    }
    return $newest
}
function Test-Fresh($startedAtIso, [string[]]$codePaths) {
    try { $started = ([datetime]::Parse($startedAtIso)).ToUniversalTime() } catch { return $false }
    return ($started -gt (Get-NewestWriteUtc $codePaths))
}
function Stop-PortOwner($port) {
    try {
        Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
            ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue; Log ("  stopped PID {0} on :{1} (stale)" -f $_.OwningProcess, $port) 'DarkGray' }
        # A killed process can lag in TIME_WAIT/closing before the port frees -
        # poll instead of a flat sleep so the next Start-Process never races a
        # port that's still held.
        $waited = 0
        while ($waited -lt 10 -and (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)) {
            Start-Sleep -Seconds 1
            $waited++
        }
    } catch {}
}

# Secret for authenticated probes: read from the repo .env at probe time,
# never logged. OmniRoute 3.8.50 gates /v1/models behind the API key.
function Get-EnvKey($name) {
    try {
        foreach ($line in Get-Content 'C:\ANTIGRAVITY\.env' -ErrorAction Stop) {
            if ($line -match ('^' + [regex]::Escape($name) + '=(.*)$')) { return $Matches[1].Trim('"') }
        }
    } catch {}
    return ''
}

function Test-Http($url, $timeoutSec = 10, $mustContain = $null, $bearerEnv = $null) {
    try {
        $hdr = @{}
        if ($bearerEnv) {
            $k = Get-EnvKey $bearerEnv
            if (-not $k) { return $false }
            $hdr['Authorization'] = "Bearer $k"
        }
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec $timeoutSec -Headers $hdr
        if ($r.StatusCode -ne 200) { return $false }
        if ($mustContain -and ($r.Content -notmatch [regex]::Escape($mustContain))) { return $false }
        return $true
    } catch { return $false }
}

# ── Stage definitions ─────────────────────────────────────────────────────
# Each: Name, Required, Probe (must return $true = healthy), Heal (start it)
$Stages = @(
    # 2026-09-15: the old Heal below called pg_ctl.exe with a bare `&` (direct,
    # blocking) invocation. That call runs IN this single-threaded script, so
    # if pg_ctl doesn't return promptly (stale postmaster.pid, disk/AV
    # contention, an already-running server it tries to rebind) the ENTIRE
    # House hangs forever right there — no further stage runs, nothing more
    # is ever logged. Real runs at 07:55/11:47/12:33/12:51 all died exactly
    # this way while pg16 was actually healthy the whole time. Redis's Heal
    # already got this right (Start-Process, non-blocking); Postgres now
    # matches: Start-Process (hidden, never steals focus) + a BOUNDED wait
    # on our side (pg_ctl's own -w -t 60 plus slack) so this script always
    # regains control and keeps logging even if pg_ctl itself misbehaves.
    @{ Name = 'PostgreSQL :5432'; Required = $true
       Probe = { $pgReady = 'C:\Users\joshi\pgsql16\bin\pg_isready.exe'
                 if (Test-Path $pgReady) {
                     (& $pgReady -h 127.0.0.1 -p 5432 -q 2>$null)
                     return ($LASTEXITCODE -eq 0)
                 }
                 Log '  pg_isready.exe missing - falling back to a plain TCP probe on :5432' 'DarkYellow'
                 return (Test-Port 5432) }
       Heal  = { $pgCtl   = 'C:\Users\joshi\pgsql16\bin\pg_ctl.exe'
                 $pgReady = 'C:\Users\joshi\pgsql16\bin\pg_isready.exe'
                 $dataDir = 'C:\Users\joshi\pgsql16-data'
                 $pidFile = Join-Path $dataDir 'postmaster.pid'

                 # Already up? postmaster.pid present + pg_isready happy means a
                 # fresh `start` would only fight the running instance for the
                 # port. Skip the heal entirely.
                 if (Test-Path $pidFile) {
                     $up = $false
                     if (Test-Path $pgReady) { (& $pgReady -h 127.0.0.1 -p 5432 -q 2>$null); $up = ($LASTEXITCODE -eq 0) }
                     else { $up = Test-Port 5432 }
                     if ($up) { Log '  PostgreSQL already running (postmaster.pid present, pg_isready OK) - skipping heal' 'DarkGray'; return }
                 }

                 if (-not (Test-Path $pgCtl)) { Log '  pg_ctl.exe missing at C:\Users\joshi\pgsql16\bin - cannot heal PostgreSQL' 'Red'; return }

                 # Don't stack a second pg_ctl on top of one already in flight
                 # from a prior retry that hasn't finished its own -t 60 wait yet.
                 if (Get-Process -Name 'pg_ctl' -ErrorAction SilentlyContinue) { Log '  pg_ctl already in flight from a previous heal attempt - not starting another' 'DarkGray'; return }

                 $logFile = 'C:\Users\joshi\pgsql16-data.log'
                 $proc = Start-Process -FilePath $pgCtl -ArgumentList '-D',$dataDir,'-l',$logFile,'-w','-t','60','start' -WindowStyle Hidden -PassThru
                 # pg_ctl's own -w/-t bounds IT to 60s; we bound OURSELVES a bit
                 # past that so a misbehaving pg_ctl can never hang this script -
                 # Wait-Process with -Timeout returns (with a non-fatal error we
                 # swallow) instead of blocking indefinitely.
                 Wait-Process -Id $proc.Id -Timeout 75 -ErrorAction SilentlyContinue
                 if ($proc.HasExited) { Log ("  pg_ctl start exited with code {0}" -f $proc.ExitCode) 'DarkGray' }
                 else { Log ("  pg_ctl start did not return within 75s (PID {0}) - not waiting further, will re-probe" -f $proc.Id) 'Yellow' } } }

    @{ Name = 'Redis :6379'; Required = $true
       Probe = { (& 'C:\Users\joshi\redis-win\redis-cli.exe' -h 127.0.0.1 ping 2>$null) -eq 'PONG' }
       # --dir is NOT optional. Without it Redis inherits the launching shell's
       # CWD as its RDB directory. On 2026-08-28 that was C:\WINDOWS\system32,
       # which is not writable: BGSAVE failed, stop-writes-on-bgsave-error
       # kicked in, and Redis answered PING with MISCONF while still LISTENING.
       # The date app's writes were disabled and the watchdog "healed" a broken
       # instance every 60s for hours because the port was open the whole time.
       Heal  = { $rdir = 'C:\Users\joshi\redis-win\data'
                 if (-not (Test-Path $rdir)) { New-Item -ItemType Directory -Force -Path $rdir | Out-Null }
                 Start-Process 'C:\Users\joshi\redis-win\redis-server.exe' -ArgumentList '--bind','127.0.0.1','--port','6379','--dir',$rdir,'--maxmemory','256mb','--maxmemory-policy','allkeys-lru' -WindowStyle Hidden } }

    @{ Name = 'OmniRoute :20128'; Required = $true
       # UPGRADE PROCEDURE (learned 2026-09-06, 3.8.49 -> 3.8.50): npm cannot
       # replace node_modules\omniroute\dist while the gateway runs (EBUSY), and
       # TWO healers relaunch it within seconds of a stop — this watchdog and
       # scripts\omniroute-keepalive.ps1. Stop both powershell hosts first, then
       # the omniroute node/cmd processes, then
       #   npm install -g --allow-scripts=omniroute,keytar,onnxruntime-node,tls-client-node,sharp,@parcel/watcher,@swc/core,protobufjs,koffi,esbuild omniroute@<ver>
       # (without --allow-scripts the postinstalls are skipped silently), then
       # start omniroute.cmd, the keepalive, and this watchdog again. First boot
       # after an upgrade compiles for ~90 s; do not heal-spawn a second copy.
       # Identity + latency, not a port: on 2026-09-03 the server child sat at
       # ~3 GB, /models took >60 s and completions failed while 20128 stayed
       # open. If the catalog cannot name its own built-in combo inside 20 s,
       # the gateway is not serving and the heal (restart) is the right call.
       # 3.8.50+: the catalog is behind the API key; an unauthenticated probe
       # reads 401 and this watchdog would heal-spawn a second gateway (and a
       # dashboard tab) every minute. That spam happened on 2026-09-06.
       Probe = { Test-Http 'http://192.168.0.8:20128/v1/models' 20 'auto/best-coding' 'OMNI_ROUTE_API_KEY' }
       Heal  = { $env:DATA_DIR = "$env:USERPROFILE\.omniroute\data"
                 $omni = "$env:APPDATA\npm\omniroute.cmd"
                 if (Test-Path $omni) { Start-Process -FilePath $omni -WindowStyle Hidden }
                 else { Log '  OmniRoute npm-global missing — npm i -g omniroute needed' 'Red' } } }

    # PARKED. Joshua, 2026-09-10: "no more paperclip". Mission Control is the
    # v5 dashboard on :3151 again. Paperclip is not started, not healed, and its
    # ANT-Paperclip logon task is disabled. This stage only REPORTS whether a
    # stray instance is still answering on 3100 so nobody mistakes it for the hub.
    # History kept in git: it was Mission Control from 2026-08-25 to 2026-09-10.
    @{ Name = 'Paperclip :3100 (PARKED, report only)'; Required = $false
       Probe = { if (Test-Http 'http://127.0.0.1:3100/api/openapi.json' 10 'Paperclip API') {
                     Log '  Paperclip still answering on :3100 - parked, not the hub; stop it or ignore it' 'DarkGray'
                 } else { Log '  Paperclip parked (not running) - expected' 'DarkGray' }
                 return $true }
       Heal  = { } }

    # 2026-09-15: found a foreign CRACO dev server ("Emergent | Fullstack App",
    # launched from frontend\node_modules\@craco\craco) squatting :3200 - the
    # port answered but never carried the prod bundle, so this stage retried
    # forever without ever being able to fix it (tab-dateapp.cmd cannot bind a
    # port something else already holds). Narrow, named guard only: a squatter
    # is killed ONLY when its command line matches the known offender exactly
    # (Hermes is moving that app off :3200 to :3210). Anything else that is
    # squatting the port is logged, never killed, and the stage just keeps
    # retrying as it always has.
    @{ Name = 'Frontend :3200 (production bundle)'; Required = $true
       Probe = { Test-Http 'http://127.0.0.1:3200/' 10 'assets/index-' }
       Heal  = { if ((Test-Port 3200) -and -not (Test-Http 'http://127.0.0.1:3200/' 10 'assets/index-')) {
                     Get-NetTCPConnection -LocalPort 3200 -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
                         $owner = $_.OwningProcess
                         $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$owner" -ErrorAction SilentlyContinue).CommandLine
                         Log ("  SQUATTER on :3200 pid {0}: {1}" -f $owner, $cmd) 'Red'
                         if ($cmd -and $cmd -match [regex]::Escape('@craco\craco') -and $cmd -match [regex]::Escape('C:\ANTIGRAVITY\frontend')) {
                             Stop-Process -Id $owner -Force -ErrorAction SilentlyContinue
                             Log ("  killed known offender (craco dev server) pid {0} on :3200" -f $owner) 'DarkGray'
                         } else {
                             Log '  squatter does not match the known offender - not killing, will keep retrying' 'DarkYellow'
                         }
                     }
                 }
                 Start-Process cmd -ArgumentList '/c','C:\ANTIGRAVITY\scripts\fables-house\tab-dateapp.cmd' -WindowStyle Hidden } }

    @{ Name = 'Backend API :8000 (db connected)'; Required = $true
       Probe = { Test-Http 'http://127.0.0.1:8000/api/v1/health' 30 '"db_connected":true' }
       Heal  = { Start-Process powershell -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','C:\ANTIGRAVITY\scripts\fables-house\tab-dateapp-api.ps1' -WindowStyle Hidden } }

    @{ Name = 'Cloudflared tunnel (site PUBLIC)'; Required = $true
       Probe = { Test-Http 'https://youandinotai.com' 20 'assets/index-' }
       Heal  = { if (-not (Get-Process cloudflared -ErrorAction SilentlyContinue)) {
                     Start-Process 'C:\Program Files (x86)\cloudflared\cloudflared.exe' -ArgumentList 'tunnel','--config','C:\Users\joshi\.cloudflared\config.yml','run','sabretooth-main' -WindowStyle Hidden
                 } else { Log '  cloudflared runs but public probe failed — check Cloudflare edge / DNS' 'Yellow' } } }

    # JARVIS is the one Mission Control on :9150 (ruling 2026-09-17, ops/runbook/
    # SABRETOOTH-NODE-RUNBOOK.md). AIRI dashboard is retired: this stage heals by
    # killing whatever is listening on 9150 that does NOT answer /health with
    # jarvis-dashboard (an old AIRI process included) and starting the JARVIS
    # server in its place, same env/bind conventions AIRI used (0.0.0.0, repo-.env
    # driven). ops/dashboard-airi/server.mjs stays on disk for now (cleanup commit
    # to follow) but is no longer started by the House.
    # 2026-09-17 fix: Heal only ran when the LISTENER answered the wrong identity.
    # A stale-but-correctly-identified process (code on disk newer than the
    # process start) failed the Probe for freshness, but Heal's own re-check of
    # identity passed, so it skipped the kill, tried to bind a second server on
    # the busy port, and looped forever (267009/267014). Heal now runs Stop-PortOwner
    # unconditionally, same as the MC5 and Sentry stages - Invoke-Stage only calls
    # Heal after the Probe has already failed, for any reason (wrong identity,
    # stale, or otherwise unhealthy), so there is nothing left to gate on here.
    @{ Name = 'JARVIS (Mission Control) :9150'; Required = $true
       Probe = { if (-not (Test-Http 'http://127.0.0.1:9150/health' 6 'jarvis-dashboard')) { return $false }
                 try { $hz = Invoke-RestMethod -Uri 'http://127.0.0.1:9150/health' -TimeoutSec 6 } catch { return $false }
                 if ($hz.startedAt -and -not (Test-Fresh $hz.startedAt @('C:\ANTIGRAVITY\mission-control\server.mjs'))) { Log '  JARVIS dashboard server is stale - restarting' 'Yellow'; return $false }
                 return $true }
       Heal  = { Stop-PortOwner 9150
                 Start-Process 'node' -ArgumentList 'C:\ANTIGRAVITY\mission-control\server.mjs' -WorkingDirectory 'C:\ANTIGRAVITY' -WindowStyle Hidden } }

    # 2026-09-18: serves the three landing sites (dream-online.net,
    # untilnokidinneed.com, onlinerecycle.net) as one no-dependency vhost
    # static server, local-only on 127.0.0.1:9160. The cloudflared tunnel
    # ingress routes each domain's Host header at this origin (Unit 3,
    # ops/domains-server/server.mjs). Optional: none of the revenue-stack
    # stages above depend on it.
    @{ Name = 'Domains static sites :9160'; Required = $false
       Probe = { Test-Http 'http://127.0.0.1:9160/health' 6 'domains-server' }
       Heal  = { $d = 'C:\ANTIGRAVITY\ops\domains-server\server.mjs'
                 if (Test-Path $d) { Stop-PortOwner 9160; Start-Process 'node' -ArgumentList $d -WorkingDirectory 'C:\ANTIGRAVITY' -WindowStyle Hidden }
                 else { Log '  domains-server.mjs missing' 'DarkYellow' } } }

    # 2026-09-17: keeps JARVIS (:9150) reachable over vscode.dev after a reboot
    # or a lost LAN path, with no second cloudflared tunnel and no static IP.
    # First use needs Joshua's own one-time interactive sign-in (`code tunnel
    # user login`) - this House NEVER runs that command. `code tunnel user
    # show` proves the sign-in happened without prompting for anything, so the
    # Probe/Heal below use it to tell "not signed in yet" apart from "signed in,
    # service just needs installing or restarting."
    @{ Name = 'VS Code tunnel (JARVIS remote)'; Required = $false
       Probe = { try { $s = (& code tunnel status 2>$null) | ConvertFrom-Json } catch { return $false }
                 return [bool]($s -and $s.tunnel) }
       Heal  = { $who = (& code tunnel user show 2>&1) -join ' '
                 if ($who -notmatch 'logged in') {
                     Log '  VS Code tunnel: NOT CONFIGURED - run once: code tunnel user login, then code tunnel service install' 'DarkYellow'
                     return
                 }
                 try { $s = (& code tunnel status 2>$null) | ConvertFrom-Json } catch { $s = $null }
                 if ($s -and $s.service_installed) {
                     $svc = Get-Service | Where-Object { $_.Name -like '*code*tunnel*' -or $_.DisplayName -like '*Visual Studio Code Tunnel*' } | Select-Object -First 1
                     if ($svc -and $svc.Status -ne 'Running') {
                         Start-Service -Name $svc.Name -ErrorAction SilentlyContinue
                         Log ("  started stopped VS Code tunnel service ({0})" -f $svc.Name) 'DarkGray'
                     } elseif (-not $svc) {
                         # Verified 2026-09-17: on this box `code tunnel service install`
                         # does not register a real SCM service or scheduled task Get-Service
                         # can see - it launches `code-tunnel.exe tunnel service internal-run`
                         # directly. Re-running install is the actual repair path here and is
                         # idempotent, so it is safe to call again even when already installed.
                         Start-Process 'code' -ArgumentList 'tunnel','service','install','--accept-server-license-terms','--name','sabretooth' -WindowStyle Hidden -Wait
                         Log '  no Windows service object for the tunnel - re-ran service install to relaunch it' 'DarkGray'
                     }
                 } else {
                     Start-Process 'code' -ArgumentList 'tunnel','service','install','--accept-server-license-terms','--name','sabretooth' -WindowStyle Hidden -Wait
                     Log '  installed VS Code tunnel service (name: sabretooth)' 'DarkGray'
                 } } }

    @{ Name = 'Ollama :11434'; Required = $false
       # Identity = Joshua's house model joshlcoleman/Fable listed in /api/tags
       # (ruled the mandatory Date App voice model 2026-09-06; ops/fable-model/).
       Probe = { Test-Http 'http://127.0.0.1:11434/api/tags' 5 'joshlcoleman/Fable' }
       Heal  = { $o = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
                 if (Test-Path $o) { Start-Process $o -ArgumentList 'serve' -WindowStyle Hidden }
                 else { Log '  Ollama missing: winget install Ollama.Ollama' 'DarkYellow' } } }

    # Hermes owns 9119. DREAM's DreamOps Bridge was moved to 9133 in 2026-08-25
    # precisely so it stops fighting this. Do not reassign 9119.
    @{ Name = 'Hermes :9119'; Required = $false
       Probe = { Test-Port 9119 }
       Heal  = { $h = "$env:LOCALAPPDATA\hermes\hermes-agent\bin\hermes.exe"
                 if (Test-Path $h) { Start-Process $h -ArgumentList 'serve' -WindowStyle Hidden }
                 else { Log '  Hermes not installed at %LOCALAPPDATA%\hermes — skipping' 'DarkYellow' } } }

    @{ Name = 'OpenClaw :18789'; Required = $false
       Probe = { Test-Port 18789 }
       # 'gateway' is required. Launching openclaw bare runs the CLI and exits;
       # :18789 is the WebSocket Gateway and only binds under this subcommand.
       # Verified 2026-08-28: bare launch left the port closed, `gateway` bound
       # it in seconds.
       Heal  = { $oc = "$env:APPDATA\npm\openclaw.cmd"
                 if (Test-Path $oc) { Start-Process -FilePath $oc -ArgumentList 'gateway' -WindowStyle Hidden }
                 else { Log '  OpenClaw npm-global missing — npm i -g openclaw needed' 'DarkYellow' } } }

    # ── Added 2026-08-28. All three were found DOWN during a session and had
    # nothing supervising them, so each died again at the next restart. They are
    # optional: none should block bring-up of the revenue stack above.
    # CEO bridge :3140 removed 2026-09-10 with Paperclip (it was the Freebuff seat's
    # HTTP adapter). Nothing else called it.

    # Serves /health, NOT /api/health, on this build (0.20.5). A probe written
    # against /api/health reports a healthy gateway as down.
    @{ Name = 'Hermes gateway :8642 (profile paperclip-mc, Hermes lane)'; Required = $false
       Probe = { Test-Http 'http://127.0.0.1:8642/health' 6 'hermes-agent' }
       Heal  = { $h = "$env:LOCALAPPDATA\hermes\hermes-agent\bin\hermes.exe"
                 if (Test-Path $h) { Start-Process $h -ArgumentList '--profile','paperclip-mc','gateway','run','--replace','--accept-hooks' -WindowStyle Hidden }
                 else { Log '  Hermes not installed - gateway skipped' 'DarkYellow' } } }

    # Council ballots, carved out of mission-control-v5 so MC5 can be retired.
    # Paperclip does NOT cover ballots; see PAPERCLIP-COVERAGE-RULING-2026-08-26.md.
    @{ Name = 'Official vote service :9134 (ballots)'; Required = $false
       Probe = { Test-Http 'http://127.0.0.1:9134/health' 6 'official-vote-service' }
       Heal  = { $v = 'C:\ANTIGRAVITY\services\governance\dist\server.js'
                 if (Test-Path $v) { Start-Process 'node' -ArgumentList $v -WorkingDirectory 'C:\ANTIGRAVITY\services\governance' -WindowStyle Hidden }
                 else { Log '  vote service not built - run: cd services\governance; npm install; npm run build' 'DarkYellow' } } }

    # The wall display. Bound to 0.0.0.0 so the Asus mini PC on the LAN can show
    # it. Last stage on purpose: it reports on everything above, so it should
    # come up after the things it watches.
    # Obsidian is Joshua's desktop app, not a service the House starts. The
    # Local REST API plugin (:27123) is how agents read the monorepo vault, so
    # report it — DOWN means Obsidian or the plugin is not running, which is
    # Joshua's click, never a heal.
    @{ Name = 'Obsidian Local REST API :27123 (report only)'; Required = $false
       Probe = { Test-Http 'http://127.0.0.1:27123/' 6 'Obsidian Local REST API' }
       Heal  = { Log '  Obsidian REST not answering: open Obsidian (vault C:\ANTIGRAVITY\Antigravity) — plugin obsidian-local-rest-api must be enabled. Not auto-started on purpose.' 'DarkYellow' } }

    @{ Name = "FABLE'S SENTRY :9140 (wall display)"; Required = $false
       # Identity + freshness: a Sentry started before targets.json or server.mjs
       # changed is showing a wall that no longer exists (2026-09-10: it kept
       # listing Paperclip rows for an hour after they were retired).
       Probe = { if (-not (Test-Http 'http://127.0.0.1:9140/health' 6 'fables-sentry')) { return $false }
                 try { $hz = Invoke-RestMethod -Uri 'http://127.0.0.1:9140/health' -TimeoutSec 6 } catch { return $false }
                 if ($hz.startedAt -and -not (Test-Fresh $hz.startedAt @('C:\ANTIGRAVITY\apps\fables-sentry\server.mjs','C:\ANTIGRAVITY\apps\fables-sentry\targets.json','C:\ANTIGRAVITY\apps\fables-sentry\index.html'))) { Log '  Sentry is stale - restarting on the current wall' 'Yellow'; return $false }
                 if (-not $hz.startedAt) { Log '  Sentry predates the freshness check - restarting once' 'Yellow'; return $false }
                 return $true }
       Heal  = { $s = 'C:\ANTIGRAVITY\apps\fables-sentry\server.mjs'
                 if (Test-Path $s) { Stop-PortOwner 9140; Start-Process 'node' -ArgumentList $s -WorkingDirectory 'C:\ANTIGRAVITY' -WindowStyle Hidden }
                 else { Log '  sentry server.mjs missing' 'DarkYellow' } } }

    # Housekeeping. Not a service, so its Probe always reports OK and the work
    # happens in Heal -- that keeps it on the same bring-up and watchdog cadence
    # as everything else without inventing a second scheduler. Bounds the wake
    # queue and the unrotated logs, both of which grow without limit otherwise.
    @{ Name = 'Housekeeping (wakes + logs)'; Required = $false
       Probe = { $hk = 'C:\ANTIGRAVITY\scripts\fables-house\HOUSEKEEPING.ps1'
                 if (-not (Test-Path $hk)) { return $false }
                 & powershell -NoProfile -ExecutionPolicy Bypass -File $hk | Out-Null
                 return $true }
       Heal  = { Log '  housekeeping script missing at scripts\fables-house\HOUSEKEEPING.ps1' 'DarkYellow' } }

    # 'Paperclip lanes + MCP tools' report stage removed 2026-09-10 with Paperclip.
)

function Invoke-Stage($stage, [int]$maxAttempts = 0) {
    # maxAttempts 0 = forever (required stages during bring-up)
    $attempt = 0
    while ($true) {
        $attempt++
        $ok = $false
        try { $ok = & $stage.Probe } catch { $ok = $false }
        if ($ok) { Log ("  OK  {0}" -f $stage.Name) 'Green'; return $true }

        if ($attempt -eq 1) { Log ("  DOWN {0} - healing..." -f $stage.Name) 'Yellow' }
        try { & $stage.Heal } catch { Log ("  heal error: {0}" -f $_.Exception.Message) 'Red' }

        # give it time to come up, then re-probe inside the loop
        Start-Sleep -Seconds ([Math]::Min(5 + $attempt * 3, 30))
        try { $ok = & $stage.Probe } catch { $ok = $false }
        if ($ok) { Log ("  HEALED {0} (attempt {1})" -f $stage.Name, $attempt) 'Green'; return $true }

        if (-not $stage.Required) {
            Log ("  SKIP {0} (optional, not up after attempt {1})" -f $stage.Name, $attempt) 'DarkYellow'
            return $false
        }
        if ($maxAttempts -gt 0 -and $attempt -ge $maxAttempts) { return $false }
        Log ("  RETRY {0} (attempt {1} failed - the House does not advance past a broken stage)" -f $stage.Name, $attempt) 'Red'
    }
}

# ── Bring-up: strictly ordered, gated ────────────────────────────────────
Log '=== FABLE''S HOUSE - bring-up start ===' 'Cyan'
foreach ($s in $Stages) { Invoke-Stage $s | Out-Null }

Log '=== HOUSE IS UP - public verification ===' 'Cyan'
$pubApi = Test-Http 'https://api.youandinotai.com/api/v1/health' 30 '"db_connected":true'
Log ("  public api.youandinotai.com: {0}" -f ($(if ($pubApi) {'OK'} else {'FAILED'}))) ($(if ($pubApi) {'Green'} else {'Red'}))

if (-not $Watchdog) {
    Log 'Bring-up complete. This window is done talking - it will not print again.' 'Green'
    if ($Once) { exit 0 }
    # 2026-09-10: the bring-up spawns the silent watchdog ITSELF, so the watchdog
    # inherits whatever elevation the bring-up had (the logon task runs Highest).
    # Services the House starts are then always restartable by the House. The
    # Startup-folder launcher (fables-house-watchdog.cmd) was retired the same
    # day: two launchers at logon meant two watchdogs, and a non-elevated one can
    # never restart an elevated service. One House at a time; the guard at the
    # top of this script enforces it.
    Start-Process powershell.exe -ArgumentList '-NonInteractive','-WindowStyle','Hidden','-ExecutionPolicy','Bypass','-File',$PSCommandPath,'-Watchdog' -WindowStyle Hidden
    Log 'The silent watchdog (hidden, log-file only) was spawned by this bring-up and now guards the House.' 'Cyan'
    exit 0
}

# ── Watchdog: hidden + silent. Heals forever, logs to file only. ─────────
Log '=== WATCHDOG (silent) - revalidating every 60s ===' 'Cyan'
while ($true) {
    Start-Sleep -Seconds 60
    foreach ($s in $Stages) {
        $ok = $false; try { $ok = & $s.Probe } catch {}
        if (-not $ok) {
            Log ("WATCHDOG: {0} fell - healing" -f $s.Name) 'Yellow'
            Invoke-Stage $s -maxAttempts 3 | Out-Null
        }
    }
}
