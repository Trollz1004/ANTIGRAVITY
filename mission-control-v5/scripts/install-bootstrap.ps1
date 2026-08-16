#requires -Version 5.1
<#
.SYNOPSIS
  One-time installer for the Mission Control v5 bootstrap runtime.

.DESCRIPTION
  Registers a single hidden scheduled task that fires at logon and runs the
  self-healing supervisor (bootstrap.ps1 -Mode Watch). The supervisor's first
  pass deploys the whole stack (OmniRoute, Ollama, v5 server, Electron dashboard,
  OpenClaw :9120, DateApp backend/frontend, youandinotai tunnel) and then keeps
  health-checking and restarting anything that dies — including Electron.

  It also removes the stale duplicate Mission Control / DateApp scheduled tasks
  and disables the superseded startup-folder entries (the broken
  MissionControlGUI.cmd pointing at the old C:\antigravity path, and the OpenClaw
  Gateway.cmd that ran OpenClaw on :9119). Hermes tasks and startup entries are
  NOT touched.

  All task actions use pwsh -WindowStyle Hidden — no console window ever pops.

.PARAMETER DryRun
  Print what would change without registering/removing/disabling anything.

.EXAMPLE
  pwsh -NoProfile -ExecutionPolicy Bypass -File install-bootstrap.ps1
#>
param(
  [string]$Bootstrap = 'C:\ANTIGRAVITY\mission-control-v5\scripts\bootstrap.ps1',
  [switch]$DryRun
)
$ErrorActionPreference = 'Continue'

function L($m){ Write-Host "[install-bootstrap] $m" }

if (-not (Test-Path $Bootstrap)) { L "bootstrap.ps1 not found at $Bootstrap — aborting"; exit 1 }

$pwsh = (Get-Command pwsh -ErrorAction SilentlyContinue).Source
if (-not $pwsh) { $pwsh = (Get-Command powershell -ErrorAction SilentlyContinue).Source }
if (-not $pwsh) { L 'neither pwsh nor powershell found — aborting'; exit 1 }
L "using shell: $pwsh"

# ── 1. Register the self-healing supervisor task (logon, interactive, hidden) ──
# Interactive (not S4U) so it can relaunch the visible Electron dashboard in the
# user's session. One task: first pass = deploy, then supervises forever.
$watchArg = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Bootstrap`" -Mode Watch"
$action    = New-ScheduledTaskAction -Execute $pwsh -Argument $watchArg
$trigger   = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings  = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
  -ExecutionTimeLimit ([TimeSpan]::Zero) `
  -MultipleInstances IgnoreNew `
  -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 2)

# Remove any pre-existing MissionControl* tasks first (dedup), then register fresh.
foreach ($n in 'MissionControlWatchdog','MissionControlGUI') {
  if (Get-ScheduledTask -TaskName $n -ErrorAction SilentlyContinue) {
    L "removing existing task: $n"
    if (-not $DryRun) { try { Unregister-ScheduledTask -TaskName $n -Confirm:$false -ErrorAction SilentlyContinue } catch { L "could not remove ${n}: $_" } }
  }
}
L "registering MissionControlWatchdog (logon, hidden, self-healing)"
if (-not $DryRun) {
  try {
    Register-ScheduledTask -TaskName 'MissionControlWatchdog' -Action $action -Trigger $trigger `
      -Principal $principal -Settings $settings -Description 'Mission Control v5 self-healing supervisor (deploy + health checks)' `
      -Force | Out-Null
    L 'registered MissionControlWatchdog'
  } catch { L "FAILED to register MissionControlWatchdog: $_ — try running elevated"; exit 1 }
}

# ── 2. Remove stale duplicate tasks the bootstrap now supersedes ───────────────
$stale = @(
  'ANTIGRAVITY-DateApp-Serve-3200',
  'ANTIGRAVITY-DateApp-Serve-3200-IT',
  'ANTIGRAVITY-T5500-DateApp-Cloudflared'
)
foreach ($n in $stale) {
  if (Get-ScheduledTask -TaskName $n -ErrorAction SilentlyContinue) {
    L "removing stale task: $n"
    if (-not $DryRun) { try { Unregister-ScheduledTask -TaskName $n -Confirm:$false -ErrorAction SilentlyContinue } catch { L "could not remove ${n}: $_" } }
  }
}

# ── 3. Disable superseded startup-folder entries (reversible: .disabled) ──────
$startup = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$disable = @('MissionControlGUI.cmd','OpenClaw Gateway.cmd')
foreach ($f in $disable) {
  $src = Join-Path $startup $f
  $dst = "$src.disabled"
  if (Test-Path $src) {
    L "disabling startup entry: $f"
    if (-not $DryRun) { Move-Item -Path $src -Destination $dst -Force -ErrorAction SilentlyContinue }
  } elseif (Test-Path $dst) {
    L "already disabled: $f"
  }
}

# ── 4. Start it now so we don't have to reboot to verify ───────────────────────
if (-not $DryRun) {
  L 'starting MissionControlWatchdog now (first pass deploys the stack)'
  try { Start-ScheduledTask -TaskName 'MissionControlWatchdog' -ErrorAction Stop } catch { L "could not auto-start: $_ — run: Start-ScheduledTask MissionControlWatchdog" }
}
L 'done. On every logon the supervisor deploys + self-heals. Dashboard appears on screen automatically.'