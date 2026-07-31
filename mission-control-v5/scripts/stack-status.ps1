# stack-status.ps1 - one look at the whole stack. Read-only: starts nothing,
# kills nothing, restarts nothing. Run it any time to see what is actually up.
$ErrorActionPreference = 'SilentlyContinue'

$services = @(
  @{ Name = 'OmniRoute gateway'; Port = 20128; Cmd = 'omniroute serve  (or the OmniRoute desktop app)'; Core = $true },
  @{ Name = 'Ollama';            Port = 11434; Cmd = 'ollama serve  (usually already running)';         Core = $true },
  @{ Name = 'Mission Control';   Port = 3151;  Cmd = 'cd E:\ANTIGRAVITY\mission-control-v5 && npm start'; Core = $true },
  @{ Name = 'FCC proxy';         Port = 8082;  Cmd = 'fcc-serve';                                      Core = $false },
  @{ Name = 'Hermes dashboard';  Port = 9119;  Cmd = 'hermes dashboard';                               Core = $false },
  @{ Name = 'OpenClaw (ClawX)';  Port = 18789; Cmd = 'ClawX starts this itself - never run a 2nd one'; Core = $false },
  @{ Name = 'DateApp frontend';  Port = 3200;  Cmd = 'see START-STACK.md step 6';                      Core = $false },
  @{ Name = 'DateApp backend';   Port = 8000;  Cmd = 'see START-STACK.md step 6';                      Core = $false },
  @{ Name = 'llama.cpp embed';   Port = 8081;  Cmd = 'scripts\tab-llamacpp-embed.cmd  (optional)';     Core = $false },
  @{ Name = 'Pieces LTM';        Port = 39300; Cmd = 'Pieces OS app (auto-starts)';                    Core = $false }
)

$down = @()
Write-Host ''
Write-Host '  ANTIGRAVITY STACK STATUS' -ForegroundColor Cyan
Write-Host ''
foreach ($s in $services) {
  $conn = Get-NetTCPConnection -LocalPort $s.Port -State Listen | Select-Object -First 1
  if ($conn) {
    $proc = (Get-Process -Id $conn.OwningProcess).ProcessName
    Write-Host ("  UP    :{0,-6} {1,-20} [{2}]" -f $s.Port, $s.Name, $proc) -ForegroundColor Green
  } else {
    $tag = if ($s.Core) { 'CORE DOWN' } else { 'down' }
    $color = if ($s.Core) { 'Red' } else { 'DarkYellow' }
    Write-Host ("  {0,-5} :{1,-6} {2,-20} start with: {3}" -f $tag, $s.Port, $s.Name, $s.Cmd) -ForegroundColor $color
    $down += $s
  }
}

# Public site: the tunnel can be healthy while the site 403s (Vite host check),
# so check the real URL, not just the tunnel process.
$tunnel = $null -ne (Invoke-WebRequest -Uri 'http://127.0.0.1:20243/metrics' -UseBasicParsing -TimeoutSec 4)
$public = try { (Invoke-WebRequest -Uri 'https://youandinotai.com/' -UseBasicParsing -TimeoutSec 20).StatusCode } catch { 'unreachable' }
Write-Host ''
Write-Host ("  tunnel: {0}   youandinotai.com: HTTP {1}" -f $(if ($tunnel) { 'running' } else { 'DOWN' }), $public)

# PORT is the variable that caused the 2026-07-31 browser-spam loop.
if ($env:PORT) {
  Write-Host ''
  Write-Host ("  WARNING: PORT=$env:PORT is set in this shell. Anything you launch from here") -ForegroundColor Yellow
  Write-Host ("  will try to bind that port. Open a fresh terminal before starting services.") -ForegroundColor Yellow
}

Write-Host ''
if ($down.Count -eq 0) { Write-Host '  Everything is up.' -ForegroundColor Green }
else { Write-Host ("  {0} service(s) down - start commands shown above." -f $down.Count) }
Write-Host ''
