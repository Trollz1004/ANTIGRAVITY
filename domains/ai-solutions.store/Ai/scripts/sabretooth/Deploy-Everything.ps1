<#
.SYNOPSIS
  Sabretooth all-in-one deployer for ANTIGRAVITY / Paperclip / YouAndINotAI.

.DESCRIPTION
  Brings up everything that can be brought up locally on Sabretooth, in order,
  WITHOUT closing on errors. Each phase reports PASS / WARN / FAIL into a
  summary table at the end. Window stays open so Josh can read the table.

  Default behavior is safe and idempotent:
    - git fetch (no auto-pull, no push)
    - docker compose up -d for known stacks
    - start Ollama if not running
    - install JS / Python deps for paperclip-mcp + frontends + dashboard
    - build youandinotai/ and apps/dashboard/
    - start Paperclip server on :3100 in its own window
    - start Cloudflare tunnels in their own windows
    - start paperclip-mcp server in its own window
    - health-check every endpoint
    - print summary

  Cloudflare Pages publishing (wrangler pages deploy) is OFF by default.
  Use -Publish to enable. GCR / Cloud Run is never touched.

.PARAMETER OnlyHealthcheck
  Skip every install / build / start step. Just probe endpoints.

.PARAMETER SkipDocker
  Don't touch docker compose stacks.

.PARAMETER SkipBuilds
  Don't run npm / pnpm / pip installs or frontend builds.

.PARAMETER Publish
  After successful builds, run wrangler pages deploy for youandinotai/dist
  and apps/dashboard/dist.

.PARAMETER LogDir
  Where to write the run log. Default E:\ANTIGRAVITY\logs.

.NOTES
  Designed to be launched from a Sabretooth desktop shortcut targeting:
    pwsh -NoProfile -ExecutionPolicy Bypass -File "E:\ANTIGRAVITY\scripts\sabretooth\Deploy-Everything.ps1"

  Hermes (paperclip-9020) is intentionally NOT launched.
#>

[CmdletBinding()]
param(
  [switch]$OnlyHealthcheck,
  [switch]$SkipDocker,
  [switch]$SkipBuilds,
  [switch]$Publish,
  [string]$LogDir = 'E:\ANTIGRAVITY\logs',
  [string]$RepoRoot = 'E:\ANTIGRAVITY'
)

# Never crash the window. Continue through every error.
$ErrorActionPreference = 'Continue'
$ProgressPreference    = 'SilentlyContinue'

# ---------- helpers ----------------------------------------------------------

$script:Results = New-Object System.Collections.Generic.List[object]
$script:StartedAt = Get-Date

function Write-Banner {
  param([string]$Text)
  Write-Host ''
  Write-Host ('=' * 78) -ForegroundColor DarkCyan
  Write-Host (" $Text") -ForegroundColor Cyan
  Write-Host ('=' * 78) -ForegroundColor DarkCyan
}

function Add-Result {
  param(
    [string]$Phase,
    [ValidateSet('PASS','WARN','FAIL','SKIP')] [string]$Status,
    [string]$Detail = ''
  )
  $script:Results.Add([PSCustomObject]@{
    Phase  = $Phase
    Status = $Status
    Detail = $Detail
  }) | Out-Null

  $color = switch ($Status) {
    'PASS' { 'Green' }
    'WARN' { 'Yellow' }
    'FAIL' { 'Red' }
    'SKIP' { 'DarkGray' }
  }
  Write-Host ("[{0,-4}] {1,-38} {2}" -f $Status, $Phase, $Detail) -ForegroundColor $color
}

function Invoke-Phase {
  param(
    [string]$Name,
    [scriptblock]$Body,
    [switch]$WarnOnFail
  )
  Write-Host "`n--- $Name ---" -ForegroundColor DarkCyan
  try {
    & $Body
  }
  catch {
    $msg = $_.Exception.Message
    if ($WarnOnFail) {
      Add-Result -Phase $Name -Status 'WARN' -Detail $msg
    } else {
      Add-Result -Phase $Name -Status 'FAIL' -Detail $msg
    }
  }
}

function Test-Tcp {
  param([string]$HostName, [int]$Port, [int]$TimeoutMs = 1500)
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $iar = $client.BeginConnect($HostName, $Port, $null, $null)
    $ok  = $iar.AsyncWaitHandle.WaitOne($TimeoutMs, $false)
    if ($ok) { $client.EndConnect($iar) | Out-Null; return $true }
    return $false
  }
  catch { return $false }
  finally { $client.Close() }
}

function Test-HttpOk {
  param([string]$Url, [int]$TimeoutSec = 6)
  try {
    $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec -MaximumRedirection 5
    return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500)
  }
  catch { return $false }
}

function Start-DetachedWindow {
  param([string]$Title, [string]$Command, [string]$WorkingDirectory = $RepoRoot)
  $psExe = (Get-Command pwsh -ErrorAction SilentlyContinue).Source
  if (-not $psExe) { $psExe = 'powershell.exe' }
  $full = "`$Host.UI.RawUI.WindowTitle = '$Title'; cd '$WorkingDirectory'; $Command"
  Start-Process -FilePath $psExe -ArgumentList @(
    '-NoExit','-NoProfile','-ExecutionPolicy','Bypass','-Command', $full
  ) -WorkingDirectory $WorkingDirectory | Out-Null
}

function Resolve-FirstExisting {
  param([string[]]$Candidates)
  foreach ($c in $Candidates) { if ($c -and (Test-Path $c)) { return $c } }
  return $null
}

# ---------- pre-flight -------------------------------------------------------

Write-Banner "ANTIGRAVITY / PAPERCLIP — SABRETOOTH DEPLOY"
Write-Host ("RepoRoot       : {0}" -f $RepoRoot)
Write-Host ("OnlyHealthcheck: {0}" -f $OnlyHealthcheck)
Write-Host ("SkipDocker     : {0}" -f $SkipDocker)
Write-Host ("SkipBuilds     : {0}" -f $SkipBuilds)
Write-Host ("Publish (CF)   : {0}" -f $Publish)

if (-not (Test-Path $RepoRoot)) {
  Add-Result -Phase 'Repo root' -Status 'FAIL' -Detail "$RepoRoot not found. Halting."
  Read-Host "`nPress Enter to close"; exit
}
Set-Location $RepoRoot

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
$LogFile = Join-Path $LogDir ("deploy-{0}.log" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
Start-Transcript -Path $LogFile -Append | Out-Null
Write-Host ("Log file       : {0}" -f $LogFile)

# Tool discovery — non-fatal if missing.
$DockerExe        = Resolve-FirstExisting @(
  'C:\Program Files\Docker\Docker\resources\bin\docker.exe',
  (Get-Command docker -ErrorAction SilentlyContinue).Source
)
$DockerComposeExe = Resolve-FirstExisting @(
  'C:\Program Files\Docker\Docker\resources\bin\docker-compose.exe',
  (Get-Command docker-compose -ErrorAction SilentlyContinue).Source
)
$OllamaExe        = Resolve-FirstExisting @(
  'C:\Users\joshl\AppData\Local\Programs\Ollama\ollama.exe',
  (Get-Command ollama -ErrorAction SilentlyContinue).Source
)
$CloudflaredExe   = Resolve-FirstExisting @(
  'C:\cloudflared\cloudflared.exe',
  (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
)
$PaperclipScript  = Join-Path $RepoRoot 'scripts\start-paperclip.ps1'
$McpCmd           = Join-Path $RepoRoot 'paperclip-mcp\paperclip-mcp.cmd'
$TunnelConfigPC   = Join-Path $RepoRoot 'infra\cloudflare\paperclip-hq.yml'

# ---------- 1. repo state ----------------------------------------------------

Invoke-Phase 'Git fetch + status' {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'git not on PATH' }
  & git fetch origin main 2>&1 | Out-Null
  $branch = (& git rev-parse --abbrev-ref HEAD).Trim()
  $ahead  = (& git rev-list --count "origin/main..HEAD").Trim()
  $behind = (& git rev-list --count "HEAD..origin/main").Trim()
  $dirty  = (& git status --porcelain).Trim().Length -gt 0
  $detail = "branch=$branch ahead=$ahead behind=$behind dirty=$dirty"
  if ($dirty) { Add-Result 'Git fetch + status' 'WARN' "$detail (uncommitted changes)" }
  else        { Add-Result 'Git fetch + status' 'PASS' $detail }
}

# ---------- 2. docker --------------------------------------------------------

if ($SkipDocker -or $OnlyHealthcheck) {
  Add-Result 'Docker stacks' 'SKIP' 'flag set'
}
else {
  Invoke-Phase 'Docker daemon ready' -WarnOnFail {
    if (-not $DockerExe) { throw 'docker.exe not found' }
    & $DockerExe info *> $null
    if ($LASTEXITCODE -ne 0) {
      # Try to start Docker Desktop and wait.
      $dd = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
      if (Test-Path $dd) { Start-Process $dd | Out-Null }
      $waited = 0
      while ($waited -lt 90) {
        Start-Sleep -Seconds 3; $waited += 3
        & $DockerExe info *> $null
        if ($LASTEXITCODE -eq 0) { break }
      }
    }
    if ($LASTEXITCODE -ne 0) { throw "docker info exit $LASTEXITCODE" }
    Add-Result 'Docker daemon ready' 'PASS' ''
  }

  Invoke-Phase 'docker-compose: youandinotai-api (postgres)' -WarnOnFail {
    $f = Join-Path $RepoRoot 'youandinotai-api\docker-compose.yml'
    if (-not (Test-Path $f)) { throw "missing $f" }
    $envFile = Join-Path $RepoRoot '.env'
    $envArg  = @(); if (Test-Path $envFile) { $envArg = @('--env-file', $envFile) }
    & $DockerComposeExe -f $f @envArg up -d 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "compose exit $LASTEXITCODE" }
    Add-Result 'docker-compose: youandinotai-api' 'PASS' 'postgres up'
  }

  Invoke-Phase 'docker-compose: root (qdrant/redis if defined)' -WarnOnFail {
    $f = Join-Path $RepoRoot 'docker-compose.yml'
    if (-not (Test-Path $f)) { Add-Result 'docker-compose: root' 'SKIP' 'no compose file'; return }
    & $DockerComposeExe -f $f up -d 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "compose exit $LASTEXITCODE" }
    Add-Result 'docker-compose: root' 'PASS' ''
  }

  Invoke-Phase 'docker-compose: E:\ANTIGRAVITY (qdrant on T5500-style)' -WarnOnFail {
    $f = 'E:\ANTIGRAVITY\docker-compose.yml'
    if (-not (Test-Path $f)) { Add-Result 'docker-compose: E:\ANTIGRAVITY' 'SKIP' 'not present on this node'; return }
    & $DockerComposeExe -f $f up -d 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "compose exit $LASTEXITCODE" }
    Add-Result 'docker-compose: E:\ANTIGRAVITY' 'PASS' ''
  }

  Invoke-Phase 'docker-compose: litellm proxy' -WarnOnFail {
    $f = Join-Path $RepoRoot 'docker-compose.litellm.yml'
    if (-not (Test-Path $f)) { Add-Result 'docker-compose: litellm' 'SKIP' 'no compose file'; return }
    & $DockerComposeExe -f $f up -d 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "compose exit $LASTEXITCODE" }
    Add-Result 'docker-compose: litellm' 'PASS' ''
  }
}

# ---------- 3. ollama --------------------------------------------------------

if ($OnlyHealthcheck) {
  Add-Result 'Ollama serve' 'SKIP' 'OnlyHealthcheck'
}
else {
  Invoke-Phase 'Ollama serve' -WarnOnFail {
    if (Test-Tcp -HostName '127.0.0.1' -Port 11434) {
      Add-Result 'Ollama serve' 'PASS' 'already listening on 11434'
      return
    }
    if (-not $OllamaExe) { throw 'ollama.exe not found' }
    Start-Process -FilePath $OllamaExe -ArgumentList 'serve' -WindowStyle Minimized | Out-Null
    Start-Sleep -Seconds 4
    if (Test-Tcp -HostName '127.0.0.1' -Port 11434) {
      Add-Result 'Ollama serve' 'PASS' 'started'
    } else {
      throw 'still not listening on 11434 after 4s'
    }
  }
}

# ---------- 4. installs / builds --------------------------------------------

if ($SkipBuilds -or $OnlyHealthcheck) {
  Add-Result 'Workspace installs + builds' 'SKIP' 'flag set'
}
else {
  Invoke-Phase 'pnpm install (workspace root)' -WarnOnFail {
    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { throw 'pnpm not on PATH' }
    & pnpm install --prefer-offline 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "pnpm exit $LASTEXITCODE" }
    Add-Result 'pnpm install' 'PASS' ''
  }

  Invoke-Phase 'paperclip-mcp pip deps' -WarnOnFail {
    $req = Join-Path $RepoRoot 'paperclip-mcp\requirements.txt'
    if (-not (Test-Path $req)) { Add-Result 'paperclip-mcp pip' 'SKIP' 'no requirements.txt'; return }
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) { throw 'python not on PATH' }
    & python -m pip install -q -r $req 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "pip exit $LASTEXITCODE" }
    Add-Result 'paperclip-mcp pip' 'PASS' ''
  }

  Invoke-Phase 'youandinotai build' -WarnOnFail {
    $dir = Join-Path $RepoRoot 'youandinotai'
    if (-not (Test-Path (Join-Path $dir 'package.json'))) {
      Add-Result 'youandinotai build' 'SKIP' 'no package.json'
      return
    }
    Push-Location $dir
    try {
      & npm ci --no-audit --no-fund 2>&1 | Out-Null
      if ($LASTEXITCODE -ne 0) { throw "npm ci exit $LASTEXITCODE" }
      & npm run build 2>&1 | Out-Null
      if ($LASTEXITCODE -ne 0) { throw "npm run build exit $LASTEXITCODE" }
      Add-Result 'youandinotai build' 'PASS' 'dist/ ready'
    }
    finally { Pop-Location }
  }

  Invoke-Phase 'apps/dashboard build' -WarnOnFail {
    $dir = Join-Path $RepoRoot 'apps\dashboard'
    if (-not (Test-Path (Join-Path $dir 'package.json'))) {
      Add-Result 'apps/dashboard build' 'SKIP' 'no package.json'
      return
    }
    Push-Location $dir
    try {
      & npm ci --no-audit --no-fund 2>&1 | Out-Null
      if ($LASTEXITCODE -ne 0) { throw "npm ci exit $LASTEXITCODE" }
      & npm run build 2>&1 | Out-Null
      if ($LASTEXITCODE -ne 0) { throw "npm run build exit $LASTEXITCODE" }
      Add-Result 'apps/dashboard build' 'PASS' 'dist/ ready'
    }
    finally { Pop-Location }
  }
}

# ---------- 5. servers (background windows) ---------------------------------

if ($OnlyHealthcheck) {
  Add-Result 'Paperclip server :3100' 'SKIP' 'OnlyHealthcheck'
  Add-Result 'paperclip-mcp server' 'SKIP' 'OnlyHealthcheck'
  Add-Result 'Cloudflare tunnel paperclip-hq' 'SKIP' 'OnlyHealthcheck'
}
else {
  Invoke-Phase 'Paperclip server :3100' -WarnOnFail {
    if (Test-Tcp -HostName '127.0.0.1' -Port 3100) {
      Add-Result 'Paperclip server :3100' 'PASS' 'already listening'
      return
    }
    if (-not (Test-Path $PaperclipScript)) { throw "missing $PaperclipScript" }
    Start-DetachedWindow -Title 'Paperclip HQ :3100' -Command "& '$PaperclipScript'"
    Start-Sleep -Seconds 6
    if (Test-Tcp -HostName '127.0.0.1' -Port 3100) {
      Add-Result 'Paperclip server :3100' 'PASS' 'started in new window'
    } else {
      Add-Result 'Paperclip server :3100' 'WARN' 'launched but not yet listening — check the new window'
    }
  }

  Invoke-Phase 'paperclip-mcp server' -WarnOnFail {
    if (-not (Test-Path $McpCmd)) { Add-Result 'paperclip-mcp server' 'SKIP' "no $McpCmd"; return }
    Start-DetachedWindow -Title 'Paperclip MCP' -Command "& '$McpCmd'"
    Add-Result 'paperclip-mcp server' 'PASS' 'launched in new window'
  }

  Invoke-Phase 'Cloudflare tunnel paperclip-hq' -WarnOnFail {
    if (-not $CloudflaredExe) { Add-Result 'Cloudflare tunnel paperclip-hq' 'SKIP' 'cloudflared not found'; return }
    if (-not (Test-Path $TunnelConfigPC)) { Add-Result 'Cloudflare tunnel paperclip-hq' 'SKIP' "missing $TunnelConfigPC"; return }
    $cmd = "& '$CloudflaredExe' tunnel --config '$TunnelConfigPC' run"
    Start-DetachedWindow -Title 'Cloudflared paperclip-hq' -Command $cmd
    Add-Result 'Cloudflare tunnel paperclip-hq' 'PASS' 'launched in new window'
  }
}

# ---------- 6. optional Cloudflare Pages publish ----------------------------

if ($Publish -and -not $OnlyHealthcheck) {
  Invoke-Phase 'wrangler pages deploy: youandinotai' -WarnOnFail {
    $dist = Join-Path $RepoRoot 'youandinotai\dist'
    if (-not (Test-Path $dist)) { Add-Result 'wrangler: youandinotai' 'SKIP' 'no dist/'; return }
    if (-not (Get-Command wrangler -ErrorAction SilentlyContinue)) { throw 'wrangler not on PATH' }
    & wrangler pages deploy $dist --project-name youandinotai 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "wrangler exit $LASTEXITCODE" }
    Add-Result 'wrangler: youandinotai' 'PASS' ''
  }

  Invoke-Phase 'wrangler pages deploy: apps/dashboard' -WarnOnFail {
    $dist = Join-Path $RepoRoot 'apps\dashboard\dist'
    if (-not (Test-Path $dist)) { Add-Result 'wrangler: dashboard' 'SKIP' 'no dist/'; return }
    if (-not (Get-Command wrangler -ErrorAction SilentlyContinue)) { throw 'wrangler not on PATH' }
    & wrangler pages deploy $dist --project-name antigravity-dashboard 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "wrangler exit $LASTEXITCODE" }
    Add-Result 'wrangler: dashboard' 'PASS' ''
  }
}
elseif (-not $Publish) {
  Add-Result 'wrangler pages deploy' 'SKIP' '-Publish not set'
}

# ---------- 7. health probes -------------------------------------------------

Write-Host "`n--- Health probes ---" -ForegroundColor DarkCyan

$tcpProbes = @(
  @{ Name = 'Paperclip HQ :3100'; Host = '127.0.0.1'; Port = 3100 }
  @{ Name = 'Ollama :11434';      Host = '127.0.0.1'; Port = 11434 }
  @{ Name = 'Postgres :5432';     Host = '127.0.0.1'; Port = 5432 }
  @{ Name = 'Qdrant :6333';       Host = '127.0.0.1'; Port = 6333 }
  @{ Name = 'Redis :6379';        Host = '127.0.0.1'; Port = 6379 }
  @{ Name = 'OpenClaw API :3200'; Host = '127.0.0.1'; Port = 3200 }
)
foreach ($p in $tcpProbes) {
  if (Test-Tcp -HostName $p.Host -Port $p.Port) {
    Add-Result $p.Name 'PASS' 'TCP open'
  } else {
    Add-Result $p.Name 'WARN' 'TCP closed (may be expected on this node)'
  }
}

$httpProbes = @(
  'https://youandinotai.com',
  'https://api.youandinotai.com',
  'https://paperclip-hq.youandinotai.com',
  'https://mcp.youandinotai.com',
  'https://onlinerecycle.org',
  'https://ai-solutions.store',
  'https://dashboard.aidoesitall.website'
)
foreach ($u in $httpProbes) {
  if (Test-HttpOk -Url $u) {
    Add-Result "HTTP $u" 'PASS' '2xx-4xx'
  } else {
    Add-Result "HTTP $u" 'WARN' 'no response / 5xx / timeout'
  }
}

# ---------- 8. summary -------------------------------------------------------

$elapsed = (Get-Date) - $script:StartedAt
Write-Banner ("SUMMARY  ({0:mm}m{0:ss}s)" -f $elapsed)

$pass = ($script:Results | Where-Object Status -EQ 'PASS').Count
$warn = ($script:Results | Where-Object Status -EQ 'WARN').Count
$fail = ($script:Results | Where-Object Status -EQ 'FAIL').Count
$skip = ($script:Results | Where-Object Status -EQ 'SKIP').Count

$script:Results | Format-Table -AutoSize Phase, Status, Detail | Out-String | Write-Host

$summaryColor = 'Green'
if ($warn) { $summaryColor = 'Yellow' }
if ($fail) { $summaryColor = 'Red' }
Write-Host ("PASS={0}  WARN={1}  FAIL={2}  SKIP={3}" -f $pass, $warn, $fail, $skip) `
  -ForegroundColor $summaryColor

Write-Host ("Log saved to: {0}" -f $LogFile) -ForegroundColor DarkGray
Write-Host ''

try { Stop-Transcript | Out-Null } catch {}

# Keep the window open no matter what.
Read-Host "Press Enter to close this window"
