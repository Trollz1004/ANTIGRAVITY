# scripts/install-boot-services-admin.ps1
# Run ONCE from an ADMIN PowerShell on Sabretooth. Idempotent.
#
# Goal: paperclip-hq.youandinotai.com survives Sabretooth power loss without
# any human PIN-in. Two pieces:
#
#   1. cloudflared as a Windows Service (runs as SYSTEM, starts at BOOT,
#      before user login). The tunnel comes alive the moment Windows boots.
#
#   2. Paperclip + watchdog as Task Scheduler tasks with S4U logon (runs
#      as joshl, AT BOOT, with no password storage required). S4U works
#      with Joshua's passwordless / PIN-only setup.
#
# After this runs, the chain is:
#   power on -> Windows boots -> cloudflared service starts -> tunnel up
#                            \-> Paperclip task starts as joshl -> :3100 alive
#                                                              -> tunnel forwards
# All before anyone signs in.

$ErrorActionPreference = 'Stop'

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "ADMIN required. Right-click PowerShell -> Run as Administrator -> retry."
}

Write-Host "`n=== 1. cloudflared as Windows Service ===" -ForegroundColor Cyan

$src = 'c:\antigravity\infra\cloudflare\paperclip-hq.yml'
$dst = "$env:USERPROFILE\.cloudflared\config.yml"
$cf  = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'

if (-not (Test-Path $cf))  { throw "cloudflared.exe not at $cf" }
if (-not (Test-Path $src)) { throw "tunnel config missing at $src" }

# Mirror config to the default location cloudflared service expects
Copy-Item -Path $src -Destination $dst -Force
Write-Host "  config: $src -> $dst"

# Tear down any existing user-mode cloudflared and prior service install
Get-Process cloudflared -EA SilentlyContinue | Stop-Process -Force -EA SilentlyContinue
$existing = Get-Service -Name cloudflared -EA SilentlyContinue
if ($existing) {
    Write-Host "  existing service found - uninstalling first for clean reinstall"
    & $cf service uninstall 2>&1 | Out-Null
    Start-Sleep 2
}

# Install
$out = & $cf service install 2>&1 | Out-String
Write-Host "  install output: $($out.Trim())"

# Set to Automatic, start now
Set-Service -Name cloudflared -StartupType Automatic
Start-Service -Name cloudflared
Start-Sleep 3
$svc = Get-Service -Name cloudflared
Write-Host ("  service: {0} ({1})" -f $svc.Status, $svc.StartType)

Write-Host "`n=== 2. Paperclip auto-start at boot (Task Scheduler S4U as joshl) ===" -ForegroundColor Cyan

$taskName    = 'Antigravity-Paperclip-Boot'
$startScript = 'c:\antigravity\scripts\start-paperclip.ps1'
if (-not (Test-Path $startScript)) { throw "start-paperclip.ps1 missing at $startScript" }

# Idempotent: remove prior version of this task if it exists
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -EA SilentlyContinue

$action    = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$startScript`""
$trigger   = New-ScheduledTaskTrigger -AtStartup
# S4U: run as joshl with HIGHEST run level, no password required.
# Trade-off: no network credentials. Paperclip is localhost-only so this is fine.
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\joshl" -LogonType S4U -RunLevel Highest
$settings  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger `
    -Principal $principal -Settings $settings | Out-Null
Write-Host "  task: $taskName registered (AtStartup, S4U as joshl)"

# Also register the watchdogs at boot so they catch any drift
$watchdogs = @(
    @{ name='Antigravity-Paperclip-Watchdog-Boot'; script='c:\antigravity\scripts\paperclip-watchdog.ps1' }
    @{ name='Antigravity-Hermes-Watchdog-Boot';    script='c:\antigravity\scripts\hermes-watchdog.ps1'    }
)
foreach ($w in $watchdogs) {
    if (-not (Test-Path $w.script)) { Write-Host "  skip $($w.name): script missing"; continue }
    Unregister-ScheduledTask -TaskName $w.name -Confirm:$false -EA SilentlyContinue
    $a = New-ScheduledTaskAction -Execute 'powershell.exe' `
        -Argument "-NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$($w.script)`""
    Register-ScheduledTask -TaskName $w.name -Action $a -Trigger $trigger `
        -Principal $principal -Settings $settings | Out-Null
    Write-Host "  task: $($w.name) registered"
}

Write-Host "`n=== Verify ===" -ForegroundColor Cyan
Get-Service cloudflared | Format-Table Name, Status, StartType -AutoSize
Get-ScheduledTask -TaskName 'Antigravity-*-Boot' | Format-Table TaskName, State -AutoSize

Write-Host ""
Write-Host "DONE. Reboot to verify: Sabretooth boots -> tunnel + paperclip alive before login." -ForegroundColor Green
Write-Host "If anything fails after reboot, logs are at c:\antigravity\logs\."
