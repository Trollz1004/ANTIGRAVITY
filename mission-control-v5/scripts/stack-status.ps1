# stack-status.ps1 - one look at the whole stack. Read-only: starts nothing,
# kills nothing, restarts nothing. Run it any time to see what is actually up.
$ErrorActionPreference = 'SilentlyContinue'

$services = @(
  @{ Name = 'OmniRoute gateway'; Port = 20128; Cmd = 'omniroute serve  (or the OmniRoute desktop app)'; Core = $true },
  @{ Name = 'Ollama';            Port = 11434; Cmd = 'ollama serve  (usually already running)';         Core = $true },
  @{ Name = 'Mission Control';   Port = 3151;  Cmd = 'cd C:\ANTIGRAVITY\mission-control-v5 && npm start'; Core = $true },
  @{ Name = 'FCC proxy';         Port = 8082;  Cmd = 'fcc-serve';                                      Core = $false },
  @{ Name = 'Hermes dashboard';  Port = 9119;  Cmd = 'hermes dashboard';                               Core = $false },
  @{ Name = 'OpenClaw (ClawX)';  Port = 18789; Cmd = 'ClawX starts this itself - never run a 2nd one'; Core = $false },
  @{ Name = 'DateApp frontend';  Port = 3200;  Cmd = 'see START-STACK.md step 6';                      Core = $false },
  @{ Name = 'DateApp backend';   Port = 8000;  Cmd = 'see START-STACK.md step 6';                      Core = $false },
  @{ Name = 'llama.cpp embed';   Port = 8081;  Cmd = 'scripts\tab-llamacpp-embed.cmd  (optional)';     Core = $false }
)

$down = @()
Write-Host ''
Write-Host '  ANTIGRAVITY STACK STATUS' -ForegroundColor Cyan
Write-Host ''
foreach ($s in $services) {
  # -ErrorAction here, not just the script-level preference: under PowerShell 7
  # this cmdlet surfaces a CIM "no matching objects" error for a closed port
  # regardless of $ErrorActionPreference, which is normal output for a service
  # that is simply down.
  $conn = Get-NetTCPConnection -LocalPort $s.Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
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
# Do NOT hardcode the metrics port. cloudflared binds a RANDOM free port for
# /metrics unless launched with --metrics, so a fixed 20243 probe reported
# "tunnel: DOWN" while four connections were live and serving (2026-08-09: the
# real port was 20242). A status board that cries wolf is worse than none - you
# stop believing it right when it matters. Discover the port from the running
# process instead, and confirm with /ready, which reports the actual number of
# established edge connections.
$tunnelState = 'DOWN'
$cfProc = Get-CimInstance Win32_Process -Filter "Name='cloudflared.exe'" -ErrorAction SilentlyContinue
if ($cfProc) {
  $tunnelState = 'process up, /ready unreachable'
  $cfPids = @($cfProc.ProcessId)
  $ports = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $cfPids -contains $_.OwningProcess } |
    Select-Object -ExpandProperty LocalPort -Unique
  foreach ($p in $ports) {
    try {
      $r = Invoke-WebRequest -Uri "http://127.0.0.1:$p/ready" -UseBasicParsing -TimeoutSec 4 -ErrorAction Stop
      $ready = $r.Content | ConvertFrom-Json
      if ($null -ne $ready.readyConnections) {
        $tunnelState = "running ($($ready.readyConnections) conn, metrics :$p)"
        break
      }
    } catch { }
  }
  # More than one cloudflared means two connectors serving the same tunnel - it
  # "works" while quietly splitting traffic, which is its own kind of drift.
  if ($cfPids.Count -gt 1) { $tunnelState += "  [WARNING: $($cfPids.Count) cloudflared processes]" }
}
$public = try { (Invoke-WebRequest -Uri 'https://youandinotai.com/' -UseBasicParsing -TimeoutSec 20).StatusCode } catch { 'unreachable' }
Write-Host ''
Write-Host ("  tunnel: {0}   youandinotai.com: HTTP {1}" -f $tunnelState, $public)

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
