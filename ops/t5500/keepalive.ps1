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
# A stage that stays down for 3 consecutive passes writes a line to TRIGGERS.jsonl so the
# next Claude session sees exactly what the script could not clear by itself.
#
# This script is the only thing that starts these services. Do not start them by hand;
# a hand-started process will be treated as a squatter if it does not answer correctly.
param([switch]$Once)

$ErrorActionPreference = 'Continue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Repo        = 'C:\ANTIGRAVITY'
$Dir         = Join-Path $Repo 'ops\t5500'
$LogFile     = Join-Path $Repo 'logs\t5500-keepalive.log'
$StatusFile  = Join-Path $Dir 'status.json'
$Triggers    = Join-Path $Dir 'TRIGGERS.jsonl'
$Node        = 'C:\Program Files\nodejs\node.exe'
$Cloudflared = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$CfConfig    = 'C:\Users\joshi\.cloudflared\config.yml'
$Ollama      = 'C:\Users\joshi\AppData\Local\Programs\Ollama\ollama.exe'
$FableModel  = 'joshlcoleman/Fable:latest'
$PgBin       = 'C:\Users\joshi\pgsql16\bin'
$PgData      = 'C:\Users\joshi\pgsql16-data'
$RedisRoot   = 'C:\Users\joshi\redis8-win'   # Redis 8: the API's redis-py 8.x speaks RESP3 (HELLO); the Redis 5 build rejects it

New-Item -ItemType Directory -Force -Path ([IO.Path]::GetDirectoryName($LogFile)) | Out-Null
New-Item -ItemType Directory -Force -Path $Dir | Out-Null

# One keep-alive at a time; a second copy (task relaunch, manual run) exits quietly.
$created = $true
try {
    $mutex = New-Object System.Threading.Mutex($true, 'Local\ANTIGRAVITY-T5500-Keepalive', [ref]$created)
    if (-not $created) { exit 0 }
} catch {
    $running = Get-CimInstance Win32_Process -Filter "CommandLine LIKE '%keepalive.ps1%'" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessId -ne $PID }
    if ($running) { exit 0 }
}

function Log([string]$msg) {
    $line = '[{0}] {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
    try {
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

function Test-Http([string]$url, [int]$timeoutSec = 10, [string]$mustContain = '') {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec $timeoutSec
        if ($r.StatusCode -ne 200) { return $false }
        if ($mustContain -and ($r.Content -notmatch [regex]::Escape($mustContain))) { return $false }
        return $true
    } catch { return $false }
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
    $procs = @(Get-TunnelProcs | Sort-Object CreationDate)
    if ($procs.Count -le 1) { return }
    foreach ($p in ($procs | Select-Object -Skip 1)) {
        Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
        Log ('duplicate tunnel connector stopped (PID ' + $p.ProcessId + ')')
    }
}

# Reads one value from the runtime env file. Never logged.
function Get-EnvVal([string]$key) {
    try {
        $line = Select-String -Path (Join-Path $Repo '.env') -Pattern ('^\s*' + $key + '\s*=') -ErrorAction Stop | Select-Object -Last 1
        if ($line) { return ($line.Line -split '=', 2)[1].Trim().Trim('"', "'") }
    } catch {}
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
    @{ Host = 'dream-online.net';     Mark = 'DREAM Online';         Origin = 9160 },
    @{ Host = 'untilnokidinneed.com'; Mark = 'Until No Kid In Need'; Origin = 9160 }
)
$script:NsCache = @{}

function Get-NsState([string]$h) {
    $hit = $script:NsCache[$h]
    if ($hit -and ((Get-Date) - $hit.At).TotalMinutes -lt 10) { return $hit.State }
    $state = 'unknown'
    try {
        $ns = @(Resolve-DnsName $h -Type NS -DnsOnly -ErrorAction Stop | Where-Object { $_.Type -eq 'NS' } | ForEach-Object { $_.NameHost })
        if ($ns | Where-Object { $_ -match 'cloudflare\.com$' }) { $state = 'cloudflare' } elseif ($ns.Count -gt 0) { $state = 'other' }
    } catch {}
    $script:NsCache[$h] = @{ At = Get-Date; State = $state }
    return $state
}

function Test-Origin([hashtable]$d) {
    if ($d.Origin -eq 3200) { return (Test-Http 'http://127.0.0.1:3200/' 10 $d.Mark) }
    try {
        $out = & curl.exe --noproxy '*' -s -m 8 -H ('Host: ' + $d.Host) ('http://127.0.0.1:' + $d.Origin + '/') 2>$null
        return ((($out | Out-String)) -match [regex]::Escape($d.Mark))
    } catch { return $false }
}

# Public hosts whose nameservers are on Cloudflare, whose origin answers, yet whose public
# page does NOT answer: that combination is the tunnel's fault, nothing else's.
function Get-PublicFailures {
    $bad = @()
    foreach ($d in $Domains) {
        if ((Get-NsState $d.Host) -ne 'cloudflare') { continue }
        if (-not (Test-Origin $d)) { continue }
        if (-not (Test-Http ('https://' + $d.Host) 20 $d.Mark)) { $bad += $d.Host }
    }
    return $bad
}

# ── Stages (dependency order) ──────────────────────────────────────────────
$Stages = @(
    @{ Key = 'ollama'; Name = 'Ollama (Fable pinned)'; Settle = 150
       Probe = { Test-Http 'http://127.0.0.1:11434/api/ps' 8 'joshlcoleman/Fable' }
       Heal  = {
           if (-not (Test-Port 11434)) {
               Log '  starting ollama serve'
               Start-Process -FilePath $Ollama -ArgumentList 'serve' -WindowStyle Hidden
               $w = 0; while ($w -lt 40 -and -not (Test-Port 11434)) { Start-Sleep -Seconds 1; $w++ }
           }
           # Loading with keep_alive -1 pins Fable in VRAM so Hermes never pays a cold load.
           try {
               $b = @{ model = $FableModel; keep_alive = -1 } | ConvertTo-Json
               Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/generate' -Method Post -Body $b -ContentType 'application/json' -TimeoutSec 140 | Out-Null
           } catch { Log ('  pin failed: ' + $_.Exception.Message) }
       } },

    @{ Key = 'postgres'; Name = 'PostgreSQL :5432'; Settle = 100
       Probe = { Test-PgReady }
       Heal  = {
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

    @{ Key = 'domains'; Name = 'Domains static sites :9160'; Settle = 20
       Probe = { Test-Http 'http://127.0.0.1:9160/health' 6 'domains-server' }
       Heal  = {
           if (Test-Port 9160) { Stop-PortOwner 9160 }
           # Loopback (this probe) plus THIS node's LAN address, per the "use the 192 endpoints" ruling;
           # never every interface. server.mjs defaults to the dead T5500 address, so set it here.
           $env:DOMAINS_SERVER_HOST = '127.0.0.1,192.168.0.15'
           Start-Process -FilePath $Node -ArgumentList @('ops\domains-server\server.mjs') -WorkingDirectory $Repo -WindowStyle Hidden
       } },

    @{ Key = 'frontend'; Name = 'Date-app frontend :3200'; Settle = 60
       Probe = { Test-Http 'http://127.0.0.1:3200/' 10 'assets/index-' }
       Heal  = {
           if (Test-Port 3200) {
               $own = (Get-NetTCPConnection -LocalPort 3200 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess
               $pn = (Get-Process -Id $own -ErrorAction SilentlyContinue).ProcessName
               if ($pn -eq 'node') { Stop-PortOwner 3200 } else { Log ('  :3200 held by ' + $pn + ' - not killing'); return }
           }
           Start-Process -FilePath cmd -ArgumentList @('/c', (Join-Path $Repo 'scripts\fables-house\tab-dateapp.cmd')) -WindowStyle Hidden
       } },

    @{ Key = 'api'; Name = 'Date-app API :8000'; Settle = 60; Needs = @('postgres', 'redis')
       Probe = { Test-Http 'http://127.0.0.1:8000/api/v1/health' 30 '"db_connected":true' }
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

    @{ Key = 'paperclip'; Name = 'Paperclip Mission Control :3917'; Settle = 170
       # Fixed port. Runs under its own NON-elevated task "ANTIGRAVITY Paperclip" (embedded
       # Postgres refuses to run as admin, and this keepalive is elevated). The task's launcher
       # clears squatters and drifted copies so Paperclip is only ever on :3917.
       Probe = { Test-Http 'http://127.0.0.1:3917/api/health' 6 '"status":"ok"' }
       Heal  = {
           $t = Get-ScheduledTask -TaskName 'ANTIGRAVITY Paperclip' -ErrorAction SilentlyContinue
           if (-not $t) { Log '  task "ANTIGRAVITY Paperclip" missing - cannot start Paperclip'; return }
           if ($t.State -eq 'Running') {
               $age = ((Get-Date) - (Get-ScheduledTaskInfo -TaskName 'ANTIGRAVITY Paperclip').LastRunTime).TotalMinutes
               if ($age -lt 5) { Log ('  Paperclip task still booting ({0:N1} min) - waiting' -f $age); return }
               Stop-ScheduledTask -TaskName 'ANTIGRAVITY Paperclip'; Start-Sleep -Seconds 3
           }
           Start-ScheduledTask -TaskName 'ANTIGRAVITY Paperclip'
           Log '  started task "ANTIGRAVITY Paperclip"'
       } },

    @{ Key = 'omniroute'; Name = 'OmniRoute gateway :20128'; Settle = 90
       # Non-elevated task "ANTIGRAVITY OmniRoute". 401 without a key = alive and enforcing auth.
       Probe = { try { Invoke-WebRequest 'http://127.0.0.1:20128/v1/models' -UseBasicParsing -TimeoutSec 8 | Out-Null; $true } catch { $_.Exception.Response.StatusCode.value__ -in 401, 403 } }
       Heal  = {
           $t = Get-ScheduledTask -TaskName 'ANTIGRAVITY OmniRoute' -ErrorAction SilentlyContinue
           if (-not $t) { Log '  task "ANTIGRAVITY OmniRoute" missing'; return }
           if ($t.State -eq 'Running') { Stop-ScheduledTask -TaskName 'ANTIGRAVITY OmniRoute'; Start-Sleep -Seconds 3 }
           Start-ScheduledTask -TaskName 'ANTIGRAVITY OmniRoute'
           Log '  started task "ANTIGRAVITY OmniRoute"'
       } },

    @{ Key = 'obsidian'; Name = 'Obsidian vault REST :27123 (memory)'; Settle = 40
       # Desktop app: agent-windows.ps1 (interactive, at logon) opens it. Before logon this is DOWN by design.
       Probe = { Test-Cloud 'obsidian' 'http://127.0.0.1:27123/' @{ Authorization = ('Bearer ' + (Get-EnvVal 'OBSIDIAN_REST_API_KEY')) } }
       Heal  = { $script:CloudCache.Remove('obsidian'); Log '  Obsidian is opened by the agent-windows supervisor after logon' } },

    @{ Key = 'supabase'; Name = 'Supabase (memory backup)'; Settle = 0
       Probe = { $k = Get-EnvVal 'SUPABASE_SECRET_KEY'; Test-Cloud 'supabase' ((Get-EnvVal 'SUPABASE_URL') + '/rest/v1/') @{ apikey = $k; Authorization = ('Bearer ' + $k) } }
       Heal  = { $script:CloudCache.Remove('supabase'); Log '  Supabase unreachable or key rejected (cloud - check key in .env)' } },

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
                   foreach ($p in $hidden) { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue; Log ('  retired hidden Hermes PID ' + $p.ProcessId + ' (visible window owns support)') }
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
    $ok = $false
    try { $ok = [bool](& $s.Probe) } catch { $ok = $false }
    if ($ok) { $script:Up[$key] = $true; $script:Result[$key] = 'UP'; $script:Fails[$key] = 0; return }

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
        $n = 1 + [int]$script:Fails[$key]; $script:Fails[$key] = $n
        $script:Up[$key] = $false; $script:Result[$key] = 'DOWN'
        Log ('[' + $name + '] still DOWN after heal (consecutive pass ' + $n + ')')
        if ($n -ge 20 -and $n % 20 -eq 0) { Add-Trigger $key $n }
    }
}

function Write-Status {
    $stages = foreach ($s in $Stages) { [ordered]@{ stage = $s.Name; status = $script:Result[$s.Key]; consecutive_failures = [int]$script:Fails[$s.Key] } }
    $doms = foreach ($d in $Domains) {
        $ns = Get-NsState $d.Host
        $origin = if (Test-Origin $d) { 'OK' } else { 'DOWN' }
        $public = if ($ns -ne 'cloudflare') { 'PENDING NAMESERVERS' } elseif (Test-Http ('https://' + $d.Host) 20 $d.Mark) { 'UP' } else { 'DOWN' }
        [ordered]@{ domain = $d.Host; nameservers = $ns; origin = $origin; public = $public }
    }
    $o = [ordered]@{ updated = (Get-Date).ToString('s'); node = $env:COMPUTERNAME; stages = @($stages); domains = @($doms) }
    try { $o | ConvertTo-Json -Depth 5 | Set-Content -Path $StatusFile -Encoding UTF8 } catch {}
}

function Invoke-Pass {
    $script:Up = @{}; $script:Result = @{}
    Remove-DuplicateTunnels
    foreach ($s in $Stages) { Invoke-Stage $s }
    Write-Status
}

Log ('keep-alive started (once=' + [bool]$Once + ', pid=' + $PID + ')')
do {
    try { Invoke-Pass } catch { Log ('pass error: ' + $_.Exception.Message) }
    if ($Once) { break }
    Start-Sleep -Seconds 60
} while ($true)
