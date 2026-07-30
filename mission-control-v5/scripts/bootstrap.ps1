#requires -Version 5.1
<#
.SYNOPSIS
  Mission Control v5 — full-stack bootstrap runtime.

.DESCRIPTION
  Idempotent, self-healing, windowless. On every restart it brings up the whole
  stack in order, with health checks + self-heal, and never lets one failing
  service block the others:

    1. OmniRoute gateway        :20128   omniroute serve (from E:\ANTIGRAVITY)
    2. Ollama                   :11434   ollama serve
    3. Mission Control server   :3151    tsx production server + built client
    4. Electron dashboard               the ONLY visible window (loads :3151)
    5. OpenClaw gateway         :9120    openclaw gateway (moved off :9119 to
                                         avoid colliding with the Hermes
                                         dashboard that you launch manually)
    6. DateApp backend          :8000    uvicorn (needs Docker Postgres/Redis,
                                         best-effort)
    7. DateApp frontend         :3200    static/dev frontend (best-effort; PORT
                                         forced to :3200 so it never binds :8080)
    8. youandinotai.com tunnel          cloudflared named tunnel via the
                                         t5500-dateapp token (best-effort;
                                         liveness via pid file + metrics :20243;
                                         separate from the Hermes tunnel on :20242)
    9. Pieces LTM              :39300    Pieces OS long-term-memory MCP server
                                         (best-effort; v5's pingPieces does the
                                         real MCP health check)

  Each service: verify deps -> heal missing deps -> start hidden if the port
  is not already listening -> health-check -> retry up to -MaxRestarts -> log
  UP or DEGRADED. Workers run with -WindowStyle Hidden and redirected stdout/
  stderr to logs\; nothing pops a console. Electron is the only visible window.

  -Mode Deploy : one-shot bring-up, then exit (used by the logon task).
  -Mode Watch  : long-running supervisor; every -WatchIntervalSec re-runs the
                 health checks and restarts any dead service, relaunching
                 Electron only if it has died. Used by the watchdog task.

  Pure operations only. No secrets in this file — OpenClaw keys are read at
  runtime from the existing C:\Users\joshl\.openclaw\gateway.cmd and never logged.

.PARAMETER RepoRoot
  Mission Control v5 checkout. Defaults to E:\ANTIGRAVITY\mission-control-v5.

.PARAMETER AntigravityRoot
  E:\ANTIGRAVITY — where omniroute serve and the DateApp backend/frontend live.

.PARAMETER DashUrl
  URL Electron loads. Defaults to http://localhost:3151 (production server).

.PARAMETER Mode
  Deploy (one-shot) or Watch (persistent supervisor).

.PARAMETER SkipGui
  Skip launching Electron (for headless testing / watchdog re-runs that don't
  want to steal focus by opening a window).

.EXAMPLE
  pwsh -NoProfile -WindowStyle Hidden -File bootstrap.ps1 -Mode Deploy
#>
param(
  [string]$RepoRoot        = 'E:\ANTIGRAVITY\mission-control-v5',
  [string]$AntigravityRoot  = 'E:\ANTIGRAVITY',
  [string]$DashUrl          = 'http://localhost:3151',
  [ValidateSet('Deploy','Watch')][string]$Mode = 'Deploy',
  [int]$WatchIntervalSec   = 60,
  [int]$HealthTimeoutSec   = 90,
  [int]$MaxRestarts        = 3,
  [int]$HttpProbeTimeoutSec = 15,
  # DateApp frontend: server.ts reads process.env.PORT (default 8080) — force 3200
  # so it never collides with anything squatting :8080.
  [string]$DateAppFrontendPort = '3200',
  # cloudflared named-tunnel metrics port (default 20243 for the dateapp tunnel).
  [int]$TunnelMetricsPort   = 20243,
  # Pieces OS packaged-app AUMID (the os_server host that owns :39300). Launch via
  # shell:AppsFolder; non-critical — v5's pingPieces does the real MCP health check.
  [string]$PiecesAppId      = 'MeshIntelligentTechnologi.PiecesOS_xpmeezj2q5frg!osserver',
  [switch]$SkipGui
)

$ErrorActionPreference = 'Continue'
$LogDir = Join-Path $RepoRoot 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$LogFile = Join-Path $LogDir 'bootstrap.log'

function Write-Log {
  param([string]$Message, [string]$Level = 'INF')
  $line = "[{0} {1}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
  Add-Content -LiteralPath $LogFile -Value $line -Encoding utf8
  if ($VerboseLog -or $Level -eq 'ERR') { Write-Host $line }
}

function Test-Port {
  param([int]$Port)
  try { return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) }
  catch { return $false }
}

function Wait-Port {
  param([int]$Port, [int]$TimeoutSec)
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    if (Test-Port -Port $Port) { return $true }
    Start-Sleep -Milliseconds 800
  }
  return $false
}

function Test-Http {
  param([string]$Url)
  try {
    $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $HttpProbeTimeoutSec -ErrorAction Stop
    return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500)
  } catch { return $false }
}

function Wait-Http {
  param([string]$Url, [int]$TimeoutSec)
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    if (Test-Http -Url $Url) { return $true }
    Start-Sleep -Milliseconds 1500
  }
  return $false
}

# Start a long-running worker with NO visible window. Output goes to log files.
function Start-HiddenWorker {
  param(
    [string]$FilePath,
    [string[]]$Arguments = @(),
    [string]$WorkDir = (Get-Location).Path,
    [string]$LogBase
  )
  $out = "$LogBase.out.log"
  $err = "$LogBase.err.log"
  try {
    $p = Start-Process -FilePath $FilePath -ArgumentList $Arguments `
      -WorkingDirectory $WorkDir -WindowStyle Hidden `
      -RedirectStandardOutput $out -RedirectStandardError $err -PassThru
    return $p
  } catch {
    Write-Log "failed to start $FilePath : $($_.Exception.Message)" 'ERR'
    return $null
  }
}

# Resolve a command; if missing, run a heal block and recheck. Returns $true if
# the command is available after healing, $false otherwise (caller skips gracefully).
function Resolve-Or-Heal {
  param([string]$Cmd, [scriptblock]$Heal)
  if (Get-Command $Cmd -ErrorAction SilentlyContinue) { return $true }
  Write-Log "command not found: $Cmd — attempting self-heal"
  if ($Heal) {
    try { & $Heal } catch { Write-Log "heal for $Cmd failed: $($_.Exception.Message)" 'ERR' }
  }
  return [bool](Get-Command $Cmd -ErrorAction SilentlyContinue)
}

# Generic ensure: heal deps -> if already up, skip -> start -> health-check ->
# retry up to MaxRestarts -> log status. Never throws; returns $true if healthy.
function Ensure-Service {
  param(
    [string]$Name,
    [int]$Port,
    [string]$HealthUrl,
    [int]$TimeoutSec,
    [scriptblock]$Start,
    [scriptblock]$Heal,
    [bool]$Critical = $false
  )
  Write-Log "==> $Name : ensure"
  if ($Heal) { try { & $Heal } catch { Write-Log "$Name heal error: $($_.Exception.Message)" 'ERR' } }

  if ($Port -gt 0 -and (Test-Port -Port $Port)) {
    $healthy = if ($HealthUrl) { Test-Http -Url $HealthUrl } else { $true }
    Write-Log ("{0} already listening on :{1} ({2})" -f $Name, $Port, $(if($healthy){'healthy'}else{'unhealthy'}))
    if ($healthy) { return $true }
  }

  for ($attempt = 1; $attempt -le $MaxRestarts; $attempt++) {
    if ($Port -gt 0 -and (Test-Port -Port $Port)) { break }
    Write-Log "$Name start attempt $attempt"
    try { & $Start } catch { Write-Log "$Name start threw: $($_.Exception.Message)" 'ERR' }
    if ($Port -gt 0) {
      if (Wait-Port -Port $Port -TimeoutSec ([math]::Min(30, $TimeoutSec))) { break }
    }
  }

  if ($HealthUrl) {
    $ok = Wait-Http -Url $HealthUrl -TimeoutSec $TimeoutSec
  } elseif ($Port -gt 0) {
    $ok = Test-Port -Port $Port
  } else {
    $ok = $true
  }

  if ($ok) {
    Write-Log "$Name UP" 'INF'
    return $true
  }
  $tag = if ($Critical) { 'CRITICAL' } else { 'DEGRADED' }
  Write-Log "$Name $tag — not healthy after $MaxRestarts attempts (see logs\$Name.*.log)" 'ERR'
  return $false
}

# ── Service start blocks ─────────────────────────────────────────────────────

function Start-Omniroute {
  $cmd = (Get-Command omniroute.cmd -ErrorAction SilentlyContinue)
  if (-not $cmd) { $cmd = Get-Command omniroute -ErrorAction SilentlyContinue }
  if (-not $cmd) { Write-Log 'omniroute still not resolved; cannot start' 'ERR'; return }
  Start-HiddenWorker -FilePath 'cmd.exe' -Arguments @('/c','omniroute','serve') `
    -WorkDir $AntigravityRoot -LogBase (Join-Path $LogDir 'omniroute') | Out-Null
}

function Start-Ollama {
  $exe = (Get-Command ollama -ErrorAction SilentlyContinue).Source
  if (-not $exe) { Write-Log 'ollama not resolved; cannot start' 'ERR'; return }
  Start-HiddenWorker -FilePath $exe -Arguments @('serve') `
    -WorkDir $env:USERPROFILE -LogBase (Join-Path $LogDir 'ollama') | Out-Null
}

function Start-MissionControlServer {
  # Build the client if the production bundle is missing (fresh machine / wiped dist).
  $dist = Join-Path $RepoRoot 'client\dist\index.html'
  if (-not (Test-Path $dist)) {
    Write-Log 'client/dist missing — building client (one-time)'
    Push-Location $RepoRoot
    try { cmd.exe /c 'npm run build' *>> (Join-Path $LogDir 'client-build.log') } catch { Write-Log "client build error: $_" 'ERR' }
    Pop-Location
  }
  Start-HiddenWorker -FilePath 'cmd.exe' -Arguments @('/c','npm','start') `
    -WorkDir $RepoRoot -LogBase (Join-Path $LogDir 'mc-server') | Out-Null
}

function Start-OpenClaw {
  # Read OpenClaw keys from the existing gateway.cmd at runtime — never log them,
  # never write them into the repo. Move the gateway off :9119 (Hermes dashboard)
  # to :9120 to avoid the port clash.
  $gw = 'C:\Users\joshl\.openclaw\gateway.cmd'
  $module = 'C:\Users\joshl\AppData\Roaming\npm\node_modules\openclaw\dist\index.js'
  if (-not (Test-Path $module)) { Write-Log "openclaw module missing: $module" 'ERR'; return }
  if (Test-Path $gw) {
    foreach ($line in Get-Content $gw) {
      if ($line -match '^\s*set\s+"([^"]+)=(.+?)"\s*$') {
        $k = $Matches[1]; $v = $Matches[2]
        if ($k -in 'OPENAI_API_KEY','KIMI_API_KEY','HOME','TMPDIR') { Set-Item -Path "Env:$k" -Value $v }
      }
    }
  } else {
    Write-Log 'gateway.cmd missing — OpenClaw keys unavailable' 'ERR'
  }
  Set-Item -Path 'Env:OPENCLAW_GATEWAY_PORT' -Value '9120'
  # Repair the config before each start so a bad agents.defaults.memorySearch.store
  # (the cold-test DEGRADED cause) doesn't keep OpenClaw down. Single shot, no loop.
  Repair-OpenClawConfig
  Start-HiddenWorker -FilePath 'C:\Program Files\nodejs\node.exe' `
    -Arguments @($module, 'gateway', '--port', '9120') `
    -WorkDir $env:USERPROFILE -LogBase (Join-Path $LogDir 'openclaw') | Out-Null
}

# Run `openclaw doctor --fix` once. Best-effort: never throws, never blocks. The
# cold test showed OpenClaw DEGRADED on an invalid memorySearch.store config; this
# self-heals it on every Deploy and on every Watch restart.
function Repair-OpenClawConfig {
  if (-not (Get-Command openclaw -ErrorAction SilentlyContinue)) { return }
  try {
    cmd.exe /c 'openclaw doctor --fix' *>> (Join-Path $LogDir 'openclaw-doctor.log')
    Write-Log 'openclaw doctor --fix ran'
  } catch { Write-Log "openclaw doctor error: $($_.Exception.Message)" 'ERR' }
}

# Pieces OS hosts the LTM MCP server on :39300. It auto-starts at login via its own
# installer; we only launch it if :39300 is dark. Packaged app — start via its AUMID
# through shell:AppsFolder, falling back to the Start Menu shortcut. Non-critical.
function Start-Pieces {
  if (Test-Port -Port 39300) { return }
  Write-Log 'Pieces :39300 dark — attempting launch'
  $launched = $false
  try {
    Start-Process -FilePath "shell:AppsFolder\$PiecesAppId" -ErrorAction Stop | Out-Null
    $launched = $true
  } catch {
    $lnk = 'C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Pieces for Developers.lnk'
    if (Test-Path $lnk) {
      try { Start-Process -FilePath $lnk -ErrorAction Stop | Out-Null; $launched = $true }
      catch { Write-Log "Pieces launch via shortcut failed: $($_.Exception.Message)" 'ERR' }
    } else { Write-Log "Pieces shortcut missing; cannot auto-launch (AUMID=$PiecesAppId)" 'ERR' }
  }
  if ($launched) { Write-Log 'Pieces launch requested (packaged app — waits for os_server)' }
}

function Start-DateAppBackend {
  $docker = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
  $dd     = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
  $py     = 'C:\Users\joshl\AppData\Roaming\uv\python\cpython-3.12-windows-x86_64-none\python.exe'
  $backend = Join-Path $AntigravityRoot 'backend\fastapi-app'
  if (-not (Test-Path $py))     { Write-Log 'python/uv not found; DateApp backend skipped' 'ERR'; return }
  if (-not (Test-Path $backend)) { Write-Log "backend missing: $backend" 'ERR'; return }

  # The backend reads its own .env via pydantic (DATABASE_URL / SUPABASE_DB_URL /
  # REDIS_URL). We only peek here to decide whether the local Docker Postgres/Redis
  # are still needed — values are never logged. When SUPABASE_DB_URL is set the
  # backend uses Supabase (remote Postgres), so we skip local Postgres. When
  # REDIS_URL points at a remote host we skip local Redis too.
  $envFile = Join-Path $backend '.env'
  $supabase = ''; $redisUrl = ''
  if (Test-Path $envFile) {
    foreach ($line in Get-Content $envFile) {
      if ($line -match '^\s*SUPABASE_DB_URL\s*=\s*(.+)$') { $supabase = $Matches[1].Trim().Trim('"').Trim("'") }
      elseif ($line -match '^\s*REDIS_URL\s*=\s*(.+)$') { $redisUrl = $Matches[1].Trim().Trim('"').Trim("'") }
    }
  }
  $needPostgres = -not $supabase
  $needRedis    = ($redisUrl -eq '') -or ($redisUrl -match 'localhost|127\.0\.0\.1')
  Write-Log ("DateApp DB: {0}; Redis: {1}" -f `
    $(if($supabase){'Supabase (remote)'}else{'local Postgres (Docker)'}),`
    $(if(-not $needRedis){'remote'}else{'local (Docker)'}))

  # Best-effort Docker for local Postgres/Redis — only when still needed. Never fatal.
  if (($needPostgres -and -not (Test-Port 5432)) -or ($needRedis -and -not (Test-Port 6379))) {
    try {
      $svc = Get-Service com.docker.service -ErrorAction SilentlyContinue
      if ($svc -and $svc.Status -ne 'Running') { Start-Service com.docker.service -ErrorAction SilentlyContinue }
      if (Test-Path $dd) { Start-Process -FilePath $dd -WindowStyle Hidden -ErrorAction SilentlyContinue | Out-Null }
      if (Test-Path $docker) {
        for ($i = 1; $i -le 24; $i++) {
          & $docker info *> $null; if ($LASTEXITCODE -eq 0) {
            Push-Location $backend
            & $docker compose --env-file .env up -d *>> (Join-Path $LogDir 'dateapp-docker.log')
            Pop-Location; break
          }
          Start-Sleep -Seconds 5
        }
      }
    } catch { Write-Log "docker best-effort skipped: $($_.Exception.Message)" 'ERR' }
  }

  Start-HiddenWorker -FilePath $py `
    -Arguments @('-m','uvicorn','app.main:app','--host','0.0.0.0','--port','8000','--log-level','info') `
    -WorkDir $backend -LogBase (Join-Path $LogDir 'dateapp-backend') | Out-Null
}

function Start-DateAppFrontend {
  # If the frontend is hosted off-box (Vercel/Cloudflare Pages — set VITE_API_URL
  # to the public backend URL in the host's build env), skip the local :3200 worker.
  if ($env:DATEAPP_FRONTEND_HOSTED -eq 'true') { Write-Log 'DateApp frontend hosted off-box (Vercel/Cloudflare) — local :3200 worker skipped'; return }
  $dir = Join-Path $AntigravityRoot 'frontend\react-app'
  if (-not (Test-Path (Join-Path $dir 'server.ts'))) { Write-Log 'dateapp frontend server.ts missing; skipped' 'ERR'; return }
  if (-not (Test-Path (Join-Path $dir 'node_modules'))) {
    Push-Location $dir
    try { cmd.exe /c 'npm install' *>> (Join-Path $LogDir 'dateapp-frontend-install.log') } catch {}
    Pop-Location
  }
  # server.ts:14 is `const PORT = Number(process.env.PORT || 8080)` — it defaults
  # to :8080, which Docker/other things squat. Force PORT to the configured :3200.
  if (Test-Port -Port 8080) { Write-Log ":8080 already in use — DateApp frontend will bind :$DateAppFrontendPort instead" }
  $env:PORT = $DateAppFrontendPort
  Start-HiddenWorker -FilePath 'cmd.exe' -Arguments @('/c','npx','tsx','server.ts') `
    -WorkDir $dir -LogBase (Join-Path $LogDir 'dateapp-frontend') | Out-Null
}

# Tunnel liveness = pid file alive OR cloudflared metrics port responds. The old
# check matched 't5500-dateapp' in the process cmdline, but that string only appears
# in the token FILE name — the token VALUE (an opaque JWT) is what's on the cmdline,
# so the check always failed (false-negative). Metrics :20243 is the dateapp tunnel's
# default; the Hermes tunnel runs on :20242, so the ports don't collide.
function Test-Tunnel {
  $pidFile = Join-Path $LogDir 'youandinotai-tunnel.pid'
  if (Test-Path $pidFile) {
    $tpid = (Get-Content $pidFile -Raw).Trim()
    if ($tpid -and (Get-Process -Id $tpid -ErrorAction SilentlyContinue)) { return $true }
  }
  # Fall back to the metrics endpoint (alive => tunnel running).
  return (Test-Http -Url "http://127.0.0.1:$TunnelMetricsPort/metrics")
}

function Start-YouAndINotAITunnel {
  $cf = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
  $tokenFile = 'C:\Users\joshl\.cloudflared\t5500-dateapp.token'
  if (-not (Test-Path $cf))        { Write-Log 'cloudflared.exe missing; tunnel skipped' 'ERR'; return }
  if (-not (Test-Path $tokenFile)) { Write-Log 't5500-dateapp.token missing; tunnel skipped' 'ERR'; return }
  # Don't start a second dateapp tunnel — pid file or metrics port already alive.
  if (Test-Tunnel) { Write-Log 'dateapp cloudflared tunnel already running'; return }
  $token = (Get-Content -LiteralPath $tokenFile -Raw).Trim()
  $p = Start-HiddenWorker -FilePath $cf `
    -Arguments @('tunnel','--no-autoupdate','run','--token',$token) `
    -WorkDir $env:USERPROFILE -LogBase (Join-Path $LogDir 'youandinotai-tunnel')
  if ($p) { Set-Content -LiteralPath (Join-Path $LogDir 'youandinotai-tunnel.pid') -Value $p.Id -Encoding utf8 }
}

function Start-Electron {
  if ($SkipGui) { return }
  $exe = Join-Path $RepoRoot 'node_modules\electron\dist\electron.exe'
  if (-not (Test-Path $exe)) { Write-Log "electron binary missing: $exe" 'ERR'; return }
  # Don't open a second dashboard window.
  if (Get-Process -Name electron -ErrorAction SilentlyContinue) { Write-Log 'electron already running'; return }
  $env:MC_DASH_URL = $DashUrl
  try {
    Start-Process -FilePath $exe -ArgumentList @('.') -WorkingDirectory $RepoRoot -ErrorAction Stop | Out-Null
    Write-Log "electron dashboard launched ($DashUrl)"
  } catch { Write-Log "electron launch failed: $($_.Exception.Message)" 'ERR' }
}

# ── Orchestration ────────────────────────────────────────────────────────────

function Invoke-Deploy {
  Write-Log '==== deploy begin ===='

  # Critical path first: router + dashboard.
  Ensure-Service -Name 'OmniRoute' -Port 20128 -HealthUrl 'http://127.0.0.1:20128/v1/models' `
    -TimeoutSec 120 -Critical $true `
    -Start ${function:Start-Omniroute} `
    -Heal { if (-not (Get-Command omniroute -EA SilentlyContinue)) { npm i -g omniroute *> $null } }

  Ensure-Service -Name 'MissionControlServer' -Port 3151 -HealthUrl 'http://localhost:3151/api/health' `
    -TimeoutSec 90 -Critical $true `
    -Start ${function:Start-MissionControlServer} `
    -Heal {
      if (-not (Test-Path (Join-Path $RepoRoot 'node_modules'))) { cmd.exe /c 'npm install && npm run install:all' *>> (Join-Path $LogDir 'mc-install.log') }
    }

  Start-Electron

  # Best-effort supporting services.
  Ensure-Service -Name 'Ollama' -Port 11434 -HealthUrl 'http://127.0.0.1:11434/api/tags' `
    -TimeoutSec 60 -Start ${function:Start-Ollama} -Heal {}

  Ensure-Service -Name 'OpenClaw' -Port 9120 -HealthUrl 'http://127.0.0.1:9120/' `
    -TimeoutSec 60 -Start ${function:Start-OpenClaw} `
    -Heal {
      if (-not (Test-Path 'C:\Users\joshl\AppData\Roaming\npm\node_modules\openclaw\dist\index.js')) { npm i -g openclaw *> $null }
      Repair-OpenClawConfig
    }

  Ensure-Service -Name 'DateAppBackend' -Port 8000 -HealthUrl 'http://127.0.0.1:8000/api/v1/health' `
    -TimeoutSec 120 -Start ${function:Start-DateAppBackend} -Heal {}

  Ensure-Service -Name 'DateAppFrontend' -Port 3200 -HealthUrl 'http://127.0.0.1:3200/' `
    -TimeoutSec 90 -Start ${function:Start-DateAppFrontend} -Heal {}

  # Pieces LTM — port-only health (v5's pingPieces does the real MCP check). Non-critical.
  Ensure-Service -Name 'Pieces LTM' -Port 39300 -HealthUrl '' `
    -TimeoutSec 60 -Start ${function:Start-Pieces} -Heal {}

  # Tunnel has no app port; start it and verify via pid/metrics.
  Start-YouAndINotAITunnel
  Start-Sleep -Seconds 3
  Write-Log ("youandinotai tunnel: {0}" -f $(if(Test-Tunnel){'running'}else{'NOT running — see logs\youandinotai-tunnel.err.log'}))

  Write-Log '==== deploy complete ===='
}

function Invoke-Watch {
  Write-Log "==== watch supervisor start (interval ${WatchIntervalSec}s) ===="
  while ($true) {
    # Re-run health checks; restart anything that died. No GUI unless Electron died.
    $checks = @(
      @{ Name='OmniRoute';           Port=20128; Url='http://127.0.0.1:20128/v1/models'; Start=${function:Start-Omniroute} },
      @{ Name='MissionControlServer'; Port=3151; Url='http://localhost:3151/api/health'; Start=${function:Start-MissionControlServer} },
      @{ Name='Ollama';              Port=11434; Url='http://127.0.0.1:11434/api/tags'; Start=${function:Start-Ollama} },
      @{ Name='OpenClaw';            Port=9120;  Url='http://127.0.0.1:9120/'; Start=${function:Start-OpenClaw} },
      @{ Name='DateAppBackend';      Port=8000;  Url='http://127.0.0.1:8000/api/v1/health'; Start=${function:Start-DateAppBackend} },
      @{ Name='DateAppFrontend';     Port=3200;  Url='http://127.0.0.1:3200/'; Start=${function:Start-DateAppFrontend} },
      @{ Name='Pieces LTM';          Port=39300; Url='';                         Start=${function:Start-Pieces} }
    )
    foreach ($c in $checks) {
      $healthy = if (Test-Port -Port $c.Port) { if ($c.Url) { Test-Http -Url $c.Url } else { $true } } else { $false }
      if (-not $healthy) {
        Write-Log "watch: $($c.Name) down — restarting"
        try { & $c.Start } catch { Write-Log "watch restart $($c.Name) error: $($_.Exception.Message)" 'ERR' }
      }
    }
    # Tunnel (pid file or metrics port)
    if (-not (Test-Tunnel)) { Write-Log 'watch: tunnel down — restarting'; Start-YouAndINotAITunnel }
    # Electron: relaunch only if it died.
    if (-not $SkipGui -and -not (Get-Process -Name electron -ErrorAction SilentlyContinue)) {
      Write-Log 'watch: electron down — relaunching dashboard'
      Start-Electron
    }
    Start-Sleep -Seconds $WatchIntervalSec
  }
}

try {
  if ($Mode -eq 'Watch') { Invoke-Watch } else { Invoke-Deploy }
} catch {
  Write-Log "fatal: $($_.Exception.Message)" 'ERR'
}