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

function Test-Http($url, $timeoutSec = 10, $mustContain = $null) {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec $timeoutSec
        if ($r.StatusCode -ne 200) { return $false }
        if ($mustContain -and ($r.Content -notmatch [regex]::Escape($mustContain))) { return $false }
        return $true
    } catch { return $false }
}

# ── Stage definitions ─────────────────────────────────────────────────────
# Each: Name, Required, Probe (must return $true = healthy), Heal (start it)
$Stages = @(
    @{ Name = 'PostgreSQL :5432'; Required = $true
       Probe = { (& 'C:\Users\joshi\pgsql16\bin\pg_isready.exe' -h 127.0.0.1 -p 5432 -q 2>$null); $LASTEXITCODE -eq 0 }
       Heal  = { & 'C:\Users\joshi\pgsql16\bin\pg_ctl.exe' -D 'C:\Users\joshi\pgsql16-data' -l 'C:\Users\joshi\pgsql16-data.log' start 2>$null | Out-Null } }

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
       # Identity + latency, not a port: on 2026-09-03 the server child sat at
       # ~3 GB, /models took >60 s and completions failed while 20128 stayed
       # open. If the catalog cannot name its own built-in combo inside 20 s,
       # the gateway is not serving and the heal (restart) is the right call.
       Probe = { Test-Http 'http://127.0.0.1:20128/api/v1/models' 20 'auto/best-coding' }
       Heal  = { $env:DATA_DIR = "$env:USERPROFILE\.omniroute\data"
                 $omni = "$env:APPDATA\npm\omniroute.cmd"
                 if (Test-Path $omni) { Start-Process -FilePath $omni -WindowStyle Hidden }
                 else { Log '  OmniRoute npm-global missing — npm i -g omniroute needed' 'Red' } } }

    # Paperclip IS Mission Control (Joshua, 2026-08-25). It carries the board,
    # the agents, and the judge CLI lanes, and it runs its own embedded Postgres.
    # The probe is an IDENTITY check, not a port check: a port answering proves
    # only that something is listening, and starting a second instance on 3100
    # would be worse than leaving it down.
    @{ Name = 'Paperclip :3100 (Mission Control)'; Required = $true
       Probe = { Test-Http 'http://127.0.0.1:3100/api/openapi.json' 20 'Paperclip API' }
       Heal  = { if (Test-Port 3100) {
                     Log '  :3100 answers but is NOT Paperclip — WRONG SERVICE. Not starting a second one.' 'Red'
                 } else {
                     $npx = "$env:APPDATA\npm\npx.cmd"
                     if (-not (Test-Path $npx)) { $npx = 'npx' }
                     Start-Process -FilePath $npx -ArgumentList '-y','paperclipai','run' -WindowStyle Hidden
                 } } }

    @{ Name = 'Frontend :3200 (production bundle)'; Required = $true
       Probe = { Test-Http 'http://127.0.0.1:3200/' 10 'assets/index-' }
       Heal  = { Start-Process cmd -ArgumentList '/c','C:\ANTIGRAVITY\mission-control-v5\scripts\tab-dateapp.cmd' -WindowStyle Hidden } }

    @{ Name = 'Backend API :8000 (db connected)'; Required = $true
       Probe = { Test-Http 'http://127.0.0.1:8000/api/v1/health' 30 '"db_connected":true' }
       Heal  = { Start-Process powershell -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','C:\ANTIGRAVITY\mission-control-v5\scripts\tab-dateapp-api.ps1' -WindowStyle Hidden } }

    @{ Name = 'Cloudflared tunnel (site PUBLIC)'; Required = $true
       Probe = { Test-Http 'https://youandinotai.com' 20 'assets/index-' }
       Heal  = { if (-not (Get-Process cloudflared -ErrorAction SilentlyContinue)) {
                     Start-Process 'C:\Program Files (x86)\cloudflared\cloudflared.exe' -ArgumentList 'tunnel','--config','C:\Users\joshi\.cloudflared\config.yml','run','sabretooth-main' -WindowStyle Hidden
                 } else { Log '  cloudflared runs but public probe failed — check Cloudflare edge / DNS' 'Yellow' } } }

    # No longer the hub - Paperclip is. Kept optional because it still serves the
    # static /paperweight/ page. A failure here must never block bring-up.
    @{ Name = 'Mission Control v5 :3151 (legacy)'; Required = $false
       Probe = { Test-Http 'http://127.0.0.1:3151/' 10 }
       Heal  = { Start-Process cmd -ArgumentList '/c','C:\ANTIGRAVITY\mission-control-v5\scripts\tab-mission-control.cmd' -WindowStyle Hidden } }

    @{ Name = 'Stack Health :8787'; Required = $false
       Probe = { Test-Http 'http://127.0.0.1:8787/' 8 }
       Heal  = { $py = 'C:\ANTIGRAVITY\mission-control-v6\.venv\Scripts\python.exe'
                 if (Test-Path $py) {
                     $env:MC_PORT = '8787'   # child inherits; works on PS 5.1 and 7
                     Start-Process $py -ArgumentList '-m','mission_control','serve' -WorkingDirectory 'C:\ANTIGRAVITY\mission-control-v6' -WindowStyle Hidden
                     Remove-Item Env:MC_PORT -ErrorAction SilentlyContinue
                 } } }

    @{ Name = 'Ollama :11434'; Required = $false
       Probe = { Test-Port 11434 }
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
    @{ Name = 'CEO bridge :3140 (Freebuff seat)'; Required = $false
       Probe = { Test-Http 'http://127.0.0.1:3140/health' 6 'paperclip-freebuff-ceo-bridge' }
       Heal  = { $b = 'C:\ANTIGRAVITY\ops\paperclip-ceo\bridge\start.js'
                 if (Test-Path $b) { Start-Process 'node' -ArgumentList $b -WorkingDirectory 'C:\ANTIGRAVITY\ops\paperclip-ceo\bridge' -WindowStyle Hidden }
                 else { Log '  CEO bridge start.js missing' 'DarkYellow' } } }

    # Serves /health, NOT /api/health, on this build (0.20.5). A probe written
    # against /api/health reports a healthy gateway as down.
    @{ Name = 'Hermes gateway :8642 (paperclip-mc)'; Required = $false
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
       Probe = { Test-Http 'http://127.0.0.1:9140/health' 6 'fables-sentry' }
       Heal  = { $s = 'C:\ANTIGRAVITY\apps\fables-sentry\server.mjs'
                 if (Test-Path $s) { Start-Process 'node' -ArgumentList $s -WorkingDirectory 'C:\ANTIGRAVITY' -WindowStyle Hidden }
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

    # READ-ONLY verification, never a launcher. The judge lanes (Claude, Codex,
    # Grok), the CEO seat, OpenCode and FreeBuff are Paperclip AGENTS driven by
    # its heartbeat scheduler - they are not services with ports, and starting
    # them from here would duplicate what Paperclip already owns. This stage
    # just reports whether Paperclip is actually carrying them, so a silent
    # empty board does not look like a healthy stack.
    @{ Name = 'Paperclip lanes + MCP tools (report only)'; Required = $false
       Probe = { try {
                     $cid = '92223de0-b36b-4d63-93ca-50ebe5007e68'
                     $ag = Invoke-RestMethod -Uri "http://127.0.0.1:3100/api/companies/$cid/agents" -TimeoutSec 15
                     $agents = if ($ag.agents) { $ag.agents } else { $ag }
                     $errored = @($agents | Where-Object { $_.status -eq 'error' })
                     $prof = Invoke-RestMethod -Uri "http://127.0.0.1:3100/api/companies/$cid/tools/profiles" -TimeoutSec 15
                     $profiles = if ($prof.profiles) { $prof.profiles } else { $prof }
                     $always = $profiles | Where-Object { $_.name -like 'Always-on MCP*' } | Select-Object -First 1
                     $tools = if ($always) { @($always.entries).Count } else { 0 }
                     Log ("  lanes: {0} agents, {1} errored | always-on MCP profile: {2} connections" -f @($agents).Count, $errored.Count, $tools) 'DarkGray'
                     if ($errored.Count -gt 0) {
                         Log ("  errored lanes: {0}" -f (($errored | ForEach-Object { $_.name }) -join ', ')) 'Yellow'
                     }
                     return $true
                 } catch { return $false } }
       Heal  = { Log '  Paperclip not answering its agent API yet — it heals via the :3100 stage, not here.' 'DarkYellow' } }
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
    Log 'Bring-up complete. This window is done talking - it will not print again.' 'Cyan'
    Log 'The silent watchdog (hidden, log-file only) guards the House from Startup.' 'Cyan'
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
