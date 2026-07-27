<#
.SYNOPSIS
  ANTIGRAVITY Clean Stack bootstrap — single source of truth for auto-start.
  Starts the full stack on system restart (and self-heals if a listener dies):
    docker(NOT used) -> ollama -> omniroute -> paperclip(embedded-postgres) -> cloudflared tunnel -> mcp/openclaw
  Idempotent: only starts what is not already listening. No Docker/Postgres container dependency.
  Paperclip uses embedded-postgres (self-contained) so it is stable behind the URL proxy.
#>
param(
  [int]$HealIntervalSec = 0   # if >0, loop forever healing every N seconds
)

$ErrorActionPreference = 'Continue'
$LogDir = 'E:\ANTIGRAVITY\logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$log = Join-Path $LogDir ('cleanstack-{0:yyyyMMdd-HHmmss}.log' -f (Get-Date))
function L($m){ $l = "[{0}] {1}" -f (Get-Date -Format o), $m; Write-Host $l; Add-Content -Path $log -Value $l -Encoding utf8 }

function Test-Port($port){
  try { $r = Invoke-WebRequest -Uri "http://127.0.0.1:$port/" -TimeoutSec 3 -UseBasicParsing -ErrorAction SilentlyContinue; return ($null -ne $r) }
  catch { return $false }
}
function Test-PortHealth($port, $path='/api/health'){
  try { $r = Invoke-WebRequest -Uri "http://127.0.0.1:$port$path" -TimeoutSec 4 -UseBasicParsing; return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) }
  catch { return $false }
}
function Start-Background($exe, $Arguments, $tag){
  if (-not $exe) { L "start $tag skipped: exe missing"; return $null }
  if ($null -eq $Arguments) { $Arguments = @() }
  if ($Arguments -isnot [System.Collections.IEnumerable] -or $Arguments -is [string]) {
    $Arguments = @($Arguments)
  }
  $cleanArgs = @($Arguments | Where-Object { $_ -ne $null })
  if (-not $cleanArgs) { $cleanArgs = @('') }
  try {
    $p = Start-Process -FilePath $exe -ArgumentList $cleanArgs -WindowStyle Hidden -PassThru
    L "started $tag (pid $($p.Id))"
    return $p
  } catch {
    L "start $tag failed: $_"
    return $null
  }
}

function Ensure-Ollama {
  if (Test-PortHealth 11434 '/api/tags') { L 'ollama: up'; return }
  L 'ollama: starting'
  $exe = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
  if (-not (Test-Path $exe)) { L "ollama exe missing: $exe"; return }
  Start-Background $exe @('serve') 'ollama'
  for ($i=0;$i -lt 20;$i++){ Start-Sleep -Seconds 2; if (Test-PortHealth 11434 '/api/tags'){ L 'ollama: ready'; return } }
  L 'ollama: did not come up in time'
}

function Resolve-OmniRouteExe {
  $cmd = Get-Command omniroute -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $candidates = @(
    (Join-Path $env:ProgramFiles 'nodejs\node.exe'),
    (Join-Path ${env:ProgramFiles(x86)} 'nodejs\node.exe'),
    (Join-Path $env:LOCALAPPDATA 'Programs\nodejs\node.exe')
  )
  foreach ($c in $candidates) {
    if ($c -and (Test-Path $c)) { return $c }
  }
  $which = Get-Command node -ErrorAction SilentlyContinue
  if ($which) { return $which.Source }
  return (Join-Path ${env:ProgramFiles} 'nodejs\node.exe')
}
function Resolve-OmniRouteScript {
  $script = (Resolve-Path 'omniroute' -ErrorAction SilentlyContinue)
  if ($script) { return $script.Path }
  $script = (Get-Command omniroute.cmd -ErrorAction SilentlyContinue).Source
  if ($script) { return $script }
  $script = (Get-Command omniroute -ErrorAction SilentlyContinue).Source
  if ($script) { return $script }
  $npmRoot = (Join-Path $env:APPDATA 'npm')
  foreach ($t in @('omniroute.cmd','omniroute.ps1','omniroute.mjs')) {
    if (Test-Path (Join-Path $npmRoot $t)) { return (Join-Path $npmRoot $t) }
  }
  foreach ($t in @('node_modules\omniroute\bin\omniroute.mjs','node_modules\omniroute\dist\omniroute.mjs','node_modules\omniroute\omniroute.mjs')) {
    if (Test-Path (Join-Path $npmRoot $t)) { return (Join-Path $npmRoot $t) }
  }
  return $null
}
function Ensure-OmniRoute {
  if (Test-Port 20128) { L 'omniroute: up'; return }
  L 'omniroute: starting'
  $exe = Resolve-OmniRouteExe
  $script = Resolve-OmniRouteScript
  if (-not $exe -or -not $script) { L "omniroute exe/script missing: exe=$exe script=$script"; return }
  Start-Background $exe @($script) 'omniroute'
  for ($i=0;$i -lt 15;$i++){ Start-Sleep -Seconds 2; if (Test-Port 20128){ L 'omniroute: ready'; return } }
  L 'omniroute: did not come up in time'
}

function Ensure-Paperclip {
  if (Test-PortHealth 3120) { L 'paperclip: up'; return }
  L 'paperclip: starting (embedded-postgres, no docker)'
  $loop = 'C:\antigravity-paperclip-dateapp-ops\scripts\run-paperclip-loopback.ps1'
  if (-not (Test-Path $loop)) { L "loopback script missing: $loop"; return }
  Start-Background 'powershell.exe' @('-NoProfile','-ExecutionPolicy','Bypass','-File',$loop) 'paperclip'
  for ($i=0;$i -lt 30;$i++){ Start-Sleep -Seconds 2; if (Test-PortHealth 3120){ L 'paperclip: ready'; return } }
  L 'paperclip: did not come up in time'
}

function Ensure-Cloudflared {
  # external proxy: tunnel hermes-t5500.yml -> paperclip-clean.youandinotai.com :3120
  $cfg = 'C:\Users\joshl\.cloudflared\hermes-t5500.yml'
  $cf = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
  if (-not (Test-Path $cf)) { L 'cloudflared exe missing'; return }
  $running = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { [string]$_.CommandLine -like "*$cfg*" } | Select-Object -First 1
  if ($running) { L 'cloudflared tunnel: already running'; return }
  L 'cloudflared tunnel: starting'
  Start-Background $cf @('tunnel','--config',$cfg,'run') 'cloudflared'
  Start-Sleep -Seconds 5
}

function Ensure-MCP {
  # OpenClaw gateway / MCP on 18789 (already typically up); start if down
  if (Test-Port 18789) { L 'mcp/openclaw gw: up'; return }
  L 'mcp/openclaw gw: attempting start'
  $launcher = 'C:\Users\joshl\.openclaw\openclaw.exe'
  if (Test-Path $launcher) { Start-Background $launcher @('gateway','serve') 'openclaw-gw' }
  else { L 'openclaw launcher not found; skip (start manually if needed)' }
  for ($i=0;$i -lt 10;$i++){ Start-Sleep -Seconds 2; if (Test-Port 18789){ L 'mcp/openclaw gw: ready'; return } }
  L 'mcp/openclaw gw: did not come up'
}

L '=== Clean Stack bootstrap start ==='
Ensure-Ollama
Ensure-OmniRoute
Ensure-Paperclip
Ensure-Cloudflared
Ensure-MCP
L '=== Clean Stack bootstrap complete ==='

if ($HealIntervalSec -gt 0) {
  L "=== entering heal loop every $HealIntervalSec s ==="
  while ($true) {
    Start-Sleep -Seconds $HealIntervalSec
    Ensure-Ollama; Ensure-OmniRoute; Ensure-Paperclip; Ensure-Cloudflared; Ensure-MCP
  }
}
