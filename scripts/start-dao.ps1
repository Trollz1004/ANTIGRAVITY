# ═══════════════════════════════════════════════════════════════════════════
#  start-dao.ps1   ·   ANTIGRAVITY · #UntilNoKidInNeed DAO Transparency
#  Run from c:\antigravity  ·  Right-click → Run with PowerShell
#  Safe by design: never closes on error, always waits for Enter.
# ═══════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = 'Continue'  # never halt on a single bad step
$ProgressPreference    = 'SilentlyContinue'

# ── Banner ──────────────────────────────────────────────────────────────
function Write-Banner {
  param([string]$Text, [string]$Color = 'Magenta')
  $bar = ('═' * ($Text.Length + 4))
  Write-Host ''
  Write-Host $bar -ForegroundColor $Color
  Write-Host "  $Text  " -ForegroundColor $Color
  Write-Host $bar -ForegroundColor $Color
}

function Write-Step {
  param([string]$Text)
  Write-Host ''
  Write-Host "▸ $Text" -ForegroundColor Cyan
}

function Write-OK   { param($t) Write-Host "  ✓ $t" -ForegroundColor Green }
function Write-Warn { param($t) Write-Host "  ! $t" -ForegroundColor Yellow }
function Write-Err  { param($t) Write-Host "  ✗ $t" -ForegroundColor Red }
function Write-Info { param($t) Write-Host "  · $t" -ForegroundColor Gray }

# ── Safe wrapper · runs a block, logs, never exits ─────────────────────
function Invoke-Safe {
  param([string]$Name, [scriptblock]$Block)
  try {
    & $Block
    return $true
  } catch {
    Write-Err "$Name failed: $($_.Exception.Message)"
    return $false
  }
}

# ── Always-on exit handler · final Press-Enter prompt ──────────────────
function Wait-ForUser {
  Write-Host ''
  Write-Host '═══════════════════════════════════════════════════════════════' -ForegroundColor DarkMagenta
  Write-Host '  Done. Review the output above.' -ForegroundColor White
  Write-Host '  Press ENTER to close this window.' -ForegroundColor Yellow
  Write-Host '═══════════════════════════════════════════════════════════════' -ForegroundColor DarkMagenta
  [void][System.Console]::ReadLine()
}

# ─────────────────────────────────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────────────────────────────────
try {

  Clear-Host
  Write-Banner 'ANTIGRAVITY · #UntilNoKidInNeed · DAO Transparency Launcher' 'Magenta'
  Write-Host '  Mission: Serve the public transparency dashboard locally.' -ForegroundColor Gray
  Write-Host '  Safety:  This script never modifies live infra and never closes on error.' -ForegroundColor Gray

  # ── 0. Working directory ───────────────────────────────────────────────
  Write-Step '0/7  Locating ANTIGRAVITY root'

  $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
  if ([string]::IsNullOrWhiteSpace($ScriptDir)) { $ScriptDir = (Get-Location).Path }
  Set-Location -Path $ScriptDir
  Write-OK "Working directory: $ScriptDir"

  $DaoFile = Join-Path $ScriptDir 'DAO Transparency.html'
  if (Test-Path $DaoFile) {
    Write-OK "Dashboard file found: DAO Transparency.html"
  } else {
    Write-Warn "Dashboard file not at: $DaoFile"
    Write-Info "Script will still run health checks and the static server."
    Write-Info "Put 'DAO Transparency.html' next to this script if you want it served."
  }

  # ── 1. Software inventory ─────────────────────────────────────────────
  Write-Step '1/7  Software inventory · checking what is installed'

  function Probe {
    param([string]$Name, [string]$Cmd, [string]$Arg = '--version')
    try {
      $v = & $Cmd $Arg 2>&1 | Select-Object -First 1
      if ($LASTEXITCODE -eq 0 -or $v) {
        Write-OK ("{0,-12} {1}" -f $Name, $v)
        return $true
      } else {
        Write-Warn ("{0,-12} not found" -f $Name)
        return $false
      }
    } catch {
      Write-Warn ("{0,-12} not found" -f $Name)
      return $false
    }
  }

  $HasNode   = Probe 'Node'    'node'   '--version'
  $HasNpm    = Probe 'npm'     'npm'    '--version'
  $HasPnpm   = Probe 'pnpm'    'pnpm'   '--version'
  $HasPython = Probe 'Python'  'python' '--version'
  $HasGit    = Probe 'git'     'git'    '--version'
  $HasDocker = Probe 'Docker'  'docker' '--version'

  # ── 2. Health checks on known local services ──────────────────────────
  Write-Step '2/7  Health checks · Hermes / OpenClaw / paperclip / dashboard / mcp'

  $Endpoints = @(
    @{ Name = 'Hermes router';       Url = 'http://localhost:11435/'           },
    @{ Name = 'Hermes (9020)';       Url = 'http://localhost:8000/'            },
    @{ Name = 'Paperclip / MCP';     Url = 'http://localhost:3100/'            },
    @{ Name = 'OpenClaw GW';         Url = 'http://localhost:18789/'           },
    @{ Name = 'Ollama';              Url = 'http://localhost:11434/api/tags'   }
  )

  foreach ($e in $Endpoints) {
    Invoke-Safe "Health check $($e.Name)" {
      try {
        $r = Invoke-WebRequest -Uri $e.Url -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        Write-OK ("{0,-22} {1} {2}" -f $e.Name, $r.StatusCode, $e.Url)
      } catch {
        Write-Warn ("{0,-22} offline  {1}" -f $e.Name, $e.Url)
      }
    } | Out-Null
  }

  # ── 3. Pick a free port for the static server ─────────────────────────
  Write-Step '3/7  Allocating a free local port for the dashboard'

  function Test-PortFree {
    param([int]$Port)
    try {
      $l = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
      $l.Start(); $l.Stop()
      return $true
    } catch { return $false }
  }

  $Candidates = 4173, 4174, 4175, 5173, 5174, 8080, 8081, 8088, 9090
  $ServePort  = $null
  foreach ($p in $Candidates) {
    if (Test-PortFree -Port $p) { $ServePort = $p; break }
  }
  if (-not $ServePort) { $ServePort = 9999 }
  Write-OK "Selected port: $ServePort"

  # ── 4. Decide server mode (Node > Python > none) ──────────────────────
  Write-Step '4/7  Choosing static-server runtime'

  $ServerMode = 'none'
  if ($HasNode) {
    $ServerMode = 'node'; Write-OK 'Using Node + npx serve (preferred)'
  } elseif ($HasPython) {
    $ServerMode = 'python'; Write-OK 'Using Python http.server (fallback)'
  } else {
    Write-Warn 'No Node or Python available. Static server will be skipped.'
    Write-Info 'Install Node from https://nodejs.org  OR  Python from https://python.org'
  }

  # ── 5. Optional: install Node deps if package.json exists ────────────
  Write-Step '5/7  Optional npm install (only if package.json exists at root)'

  if ($HasNode -and (Test-Path (Join-Path $ScriptDir 'package.json'))) {
    Invoke-Safe 'npm install' {
      if ($HasPnpm -and (Test-Path (Join-Path $ScriptDir 'pnpm-lock.yaml'))) {
        Write-Info 'Detected pnpm-lock.yaml. Running: pnpm install --frozen-lockfile'
        & pnpm install --frozen-lockfile 2>&1 | ForEach-Object { Write-Info $_ }
      } else {
        Write-Info 'Running: npm install --no-audit --no-fund --silent'
        & npm install --no-audit --no-fund --silent 2>&1 | ForEach-Object { Write-Info $_ }
      }
      if ($LASTEXITCODE -eq 0) { Write-OK 'Dependencies installed' }
      else { Write-Warn "Install exited with code $LASTEXITCODE — continuing anyway" }
    } | Out-Null
  } else {
    Write-Info 'No package.json at root — skipping (this is fine for a static page)'
  }

  # ── 6. Start the static server ───────────────────────────────────────
  Write-Step '6/7  Starting the static dashboard server'

  $Url = "http://localhost:$ServePort/DAO%20Transparency.html"

  $ServerProc = $null
  switch ($ServerMode) {
    'node' {
      Invoke-Safe 'npx serve' {
        $ServerProc = Start-Process -FilePath 'npx' `
          -ArgumentList @('--yes', 'serve', '-p', "$ServePort", '-L', $ScriptDir) `
          -PassThru -WindowStyle Minimized
        Start-Sleep -Seconds 2
        Write-OK "Static server started on port $ServePort  (PID $($ServerProc.Id))"
        Write-Info "If the page does not load, look for a 'serve' window in the taskbar."
      } | Out-Null
    }
    'python' {
      Invoke-Safe 'python http.server' {
        $ServerProc = Start-Process -FilePath 'python' `
          -ArgumentList @('-m', 'http.server', "$ServePort", '--bind', '127.0.0.1') `
          -PassThru -WindowStyle Minimized -WorkingDirectory $ScriptDir
        Start-Sleep -Seconds 2
        Write-OK "Static server started on port $ServePort  (PID $($ServerProc.Id))"
      } | Out-Null
    }
    'none' {
      Write-Warn 'Skipping server start (no runtime available)'
      Write-Info "You can still open the file directly: $DaoFile"
    }
  }

  # ── 7. Open the dashboard in the default browser ─────────────────────
  Write-Step '7/7  Opening the dashboard'

  if ($ServerMode -ne 'none') {
    Invoke-Safe 'open browser' {
      Start-Process $Url
      Write-OK "Opened: $Url"
    } | Out-Null
  } elseif (Test-Path $DaoFile) {
    Invoke-Safe 'open file' {
      Start-Process $DaoFile
      Write-OK "Opened file directly: $DaoFile"
    } | Out-Null
  }

  # ── Summary ──────────────────────────────────────────────────────────
  Write-Banner 'SUMMARY' 'Magenta'
  Write-Info ("Dashboard URL : " + $(if ($ServerMode -ne 'none') { $Url } else { 'file:// (opened directly)' }))
  Write-Info ("Server mode   : " + $ServerMode)
  Write-Info ("Server port   : " + $ServePort)
  Write-Info  'Admin email   : joshlcoleman@gmail.com  (click "Admin Sign-In →" on the page)'
  Write-Host ''
  Write-Info  'To stop the static server later: close the minimized "serve" or "python" window,'
  Write-Info  'or run:  Get-Process -Name node, python | Where-Object { $_.Id -eq <PID> } | Stop-Process'

}
catch {
  # Last-resort catch · do not crash the window
  Write-Err "Unexpected top-level error: $($_.Exception.Message)"
  Write-Err "Line: $($_.InvocationInfo.ScriptLineNumber)  ·  Script: $($_.InvocationInfo.ScriptName)"
}
finally {
  Wait-ForUser
}
