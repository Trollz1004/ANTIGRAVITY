# Register Paperclip HQ as bulletproof always-on services.
# Run ONCE as Administrator. Re-run any time to update.
#
# Creates two Task Scheduler tasks:
#   ANTIGRAVITY-Paperclip-Watchdog  — fires at STARTUP (no login needed), runs forever, hidden
#   ANTIGRAVITY-Paperclip-Bootstrap — fires at LOGON, opens browser tabs for the CEO session
#
# The watchdog uses stored credentials so it survives power loss / restart without a login session.

param(
    [switch]$WatchdogOnly  # skip bootstrap task registration
)

$ErrorActionPreference = 'Stop'

# --- Admin check ---
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]'Administrator')) {
    Write-Host 'ERROR: Run this script as Administrator.' -ForegroundColor Red
    exit 1
}

$CurrentUser = "$env:USERDOMAIN\$env:USERNAME"

Write-Host ''
Write-Host '=== Paperclip HQ — Bulletproof Registration ===' -ForegroundColor Cyan
Write-Host "Running as: $CurrentUser"
Write-Host ''

# --- Stored-credential password prompt ---
# Task Scheduler needs the user password to run tasks when the user is NOT logged in.
Write-Host 'Enter your Windows login password so the watchdog can run at startup without a login:' -ForegroundColor Yellow
$SecurePass = Read-Host -AsSecureString -Prompt 'Password'
$PlainPass  = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePass))

# ---------------------------------------------------------------
# TASK 1 — Watchdog (at startup, no login needed, fully hidden)
# ---------------------------------------------------------------
$WatchdogName   = 'ANTIGRAVITY-Paperclip-Watchdog'
$WatchdogAction = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument '-NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\ANTIGRAVITY\scripts\paperclip-watchdog.ps1"'

$WatchdogTrigger        = New-ScheduledTaskTrigger -AtStartup
$WatchdogTrigger.Delay  = 'PT15S'   # 15s after boot so network/disk settle

$WatchdogSettings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -RestartCount 99 `
    -RestartInterval (New-TimeSpan -Minutes 2) `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -RunOnlyIfIdle:$false `
    -DisallowHardTerminate:$false `
    -MultipleInstances IgnoreNew

$WatchdogPrincipal = New-ScheduledTaskPrincipal `
    -UserId $CurrentUser `
    -LogonType Password `
    -RunLevel Highest

Unregister-ScheduledTask -TaskName $WatchdogName -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask `
    -TaskName    $WatchdogName `
    -Action      $WatchdogAction `
    -Trigger     $WatchdogTrigger `
    -Settings    $WatchdogSettings `
    -Principal   $WatchdogPrincipal `
    -Password    $PlainPass `
    -Description 'Keeps Paperclip HQ (port 3100) + Cloudflare tunnel alive. Restarts silently on failure. Survives reboot without login. NO WINDOWS OPEN.' `
    -Force | Out-Null

Write-Host "[OK] $WatchdogName registered (fires at startup, runs forever hidden)." -ForegroundColor Green

# ---------------------------------------------------------------
# TASK 2 — CEO Bootstrap (at logon — opens browser, Hermes, etc.)
# ---------------------------------------------------------------
if (-not $WatchdogOnly) {
    $BootstrapName   = 'ANTIGRAVITY-Paperclip-Bootstrap'
    $BootstrapAction = New-ScheduledTaskAction `
        -Execute 'powershell.exe' `
        -Argument '-NonInteractive -WindowStyle Minimized -ExecutionPolicy Bypass -File "C:\ANTIGRAVITY\scripts\bootstrap-paperclip-ceo.ps1"'

    $BootstrapTrigger       = New-ScheduledTaskTrigger -AtLogOn -User $CurrentUser
    $BootstrapTrigger.Delay = 'PT30S'   # 30s after login so watchdog is already up

    $BootstrapSettings = New-ScheduledTaskSettingsSet `
        -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
        -RestartCount 2 `
        -RestartInterval (New-TimeSpan -Minutes 1) `
        -StartWhenAvailable `
        -RunOnlyIfNetworkAvailable:$false

    $BootstrapPrincipal = New-ScheduledTaskPrincipal `
        -UserId    $CurrentUser `
        -LogonType Interactive `
        -RunLevel  Highest

    Unregister-ScheduledTask -TaskName $BootstrapName -Confirm:$false -ErrorAction SilentlyContinue

    Register-ScheduledTask `
        -TaskName    $BootstrapName `
        -Action      $BootstrapAction `
        -Trigger     $BootstrapTrigger `
        -Settings    $BootstrapSettings `
        -Principal   $BootstrapPrincipal `
        -Description 'CEO session bootstrap: opens Paperclip browser tabs and Hermes chat. Fires 30s after logon.' `
        -Force | Out-Null

    Write-Host "[OK] $BootstrapName registered (fires 30s after logon)." -ForegroundColor Green
}

Write-Host ''
Write-Host '--- Start watchdog NOW (without rebooting): ---' -ForegroundColor Cyan
Write-Host "  Start-ScheduledTask -TaskName '$WatchdogName'"
Write-Host ''
Write-Host '--- Check watchdog status: ---' -ForegroundColor Cyan
Write-Host "  Get-ScheduledTaskInfo -TaskName '$WatchdogName'"
Write-Host ''
Write-Host '--- Watchdog log: ---' -ForegroundColor Cyan
Write-Host '  Get-Content C:\ANTIGRAVITY\logs\paperclip-watchdog.log -Tail 50'
Write-Host ''
Write-Host 'Done. Paperclip HQ will now survive reboots, power loss, and process crashes.' -ForegroundColor Green
Write-Host 'NO windows will pop up or steal focus during watchdog operation.' -ForegroundColor Green
