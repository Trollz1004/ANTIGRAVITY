param(
    [switch]$WatchdogOnly
)

$ErrorActionPreference = 'Stop'

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]'Administrator')) {
    Write-Host 'ERROR: Run this script as Administrator.' -ForegroundColor Red
    exit 1
}

$CurrentUser = "$env:USERDOMAIN\$env:USERNAME"

Write-Host ''
Write-Host '=== Sabretooth Always-On Registration ===' -ForegroundColor Cyan
Write-Host "Running as: $CurrentUser"
Write-Host ''

Write-Host 'Enter your Windows login password (stored for startup task):' -ForegroundColor Yellow
$SecurePass = Read-Host -AsSecureString -Prompt 'Password'
$PlainPass  = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePass))

# --- Remove old tasks ---
foreach ($old in @('ANTIGRAVITY-Paperclip-Watchdog', 'ANTIGRAVITY-Paperclip-Bootstrap', 'ANTIGRAVITY-AutoStart')) {
    Unregister-ScheduledTask -TaskName $old -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "[CLEANUP] Removed old task: $old" -ForegroundColor DarkGray
}

# ---------------------------------------------------------------
# TASK 1 — Watchdog (at startup, no login needed, fully hidden)
# Fires 10s after boot. Restarts Ollama, Paperclip, Cloudflared,
# Claude CLI, and OpenCode CLI if they die. Survives power loss.
# ---------------------------------------------------------------
$WatchdogName   = 'ANTIGRAVITY-Sabretooth-Watchdog'
$WatchdogAction = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument '-NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\ANTIGRAVITY\scripts\sabretooth-watchdog.ps1"'

$WatchdogTrigger        = New-ScheduledTaskTrigger -AtStartup
$WatchdogTrigger.Delay  = 'PT10S'

$WatchdogSettings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -RestartCount 99 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -RunOnlyIfIdle:$false `
    -DisallowHardTerminate:$false `
    -MultipleInstances IgnoreNew

$WatchdogPrincipal = New-ScheduledTaskPrincipal `
    -UserId $CurrentUser `
    -LogonType Password `
    -RunLevel Highest

Register-ScheduledTask `
    -TaskName    $WatchdogName `
    -Action      $WatchdogAction `
    -Trigger     $WatchdogTrigger `
    -Settings    $WatchdogSettings `
    -Principal   $WatchdogPrincipal `
    -Password    $PlainPass `
    -Description 'Keeps Ollama + Paperclip + Cloudflared + Claude CLI + OpenCode CLI alive. Restarts on failure. Survives power loss. Opens dashboard browser on first boot of the day.' `
    -Force | Out-Null

Write-Host "[OK] $WatchdogName registered (fires at startup, runs forever hidden)." -ForegroundColor Green

# ---------------------------------------------------------------
# TASK 2 — Bootstrap (at logon — opens dashboard browser)
# ---------------------------------------------------------------
if (-not $WatchdogOnly) {
    $BootstrapName   = 'ANTIGRAVITY-Bootstrap-Login'
    $BootstrapAction = New-ScheduledTaskAction `
        -Execute 'powershell.exe' `
        -Argument '-NonInteractive -WindowStyle Minimized -ExecutionPolicy Bypass -File "C:\ANTIGRAVITY\scripts\bootstrap-paperclip-ceo.ps1"'

    $BootstrapTrigger       = New-ScheduledTaskTrigger -AtLogOn -User $CurrentUser
    $BootstrapTrigger.Delay = 'PT30S'

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
        -Description 'Logon bootstrap: Paperclip CEO session, Hermes, browser tabs. Fires 30s after login.' `
        -Force | Out-Null

    Write-Host "[OK] $BootstrapName registered (fires 30s after logon)." -ForegroundColor Green
}

# ---------------------------------------------------------------
# FIREWALL — open all service ports
# ---------------------------------------------------------------
Write-Host ''
Write-Host 'Opening firewall ports...' -ForegroundColor Cyan

$firewallPorts = @(
    @{Port=3100; Name='ANTIGRAVITY-Paperclip-HQ'; Proto='TCP'},
    @{Port=11434; Name='ANTIGRAVITY-Ollama'; Proto='TCP'},
    @{Port=11435; Name='ANTIGRAVITY-Hermes-Router'; Proto='TCP'},
    @{Port=3900; Name='ANTIGRAVITY-Brain-MCP'; Proto='TCP'},
    @{Port=18789; Name='ANTIGRAVITY-OpenClaw'; Proto='TCP'},
    @{Port=5173; Name='ANTIGRAVITY-Vite-Dashboard'; Proto='TCP'},
    @{Port=5174; Name='ANTIGRAVITY-Vite-ClawX'; Proto='TCP'},
    @{Port=3000; Name='ANTIGRAVITY-Web-Dev'; Proto='TCP'},
    @{Port=3001; Name='ANTIGRAVITY-Command-Center'; Proto='TCP'},
    @{Port=54329; Name='ANTIGRAVITY-Paperclip-PG'; Proto='TCP'},
    @{Port=6379; Name='ANTIGRAVITY-Redis'; Proto='TCP'},
    @{Port=6333; Name='ANTIGRAVITY-Qdrant'; Proto='TCP'}
)

foreach ($rule in $firewallPorts) {
    $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if ($null -ne $existing) {
        Write-Host "  [EXISTS] $($rule.Name) : $($rule.Port)/$($rule.Proto)" -ForegroundColor DarkGray
        continue
    }
    New-NetFirewallRule `
        -DisplayName $rule.Name `
        -Direction Inbound `
        -Action Allow `
        -Protocol $rule.Proto `
        -LocalPort $rule.Port `
        -Enabled True `
        -Profile Any `
        -ErrorAction SilentlyContinue | Out-Null
    Write-Host "  [OPENED] $($rule.Name) : $($rule.Port)/$($rule.Proto)" -ForegroundColor Green
}

Write-Host ''
Write-Host '--- Start watchdog NOW (without reboot): ---' -ForegroundColor Cyan
Write-Host "  Start-ScheduledTask -TaskName '$WatchdogName'"
Write-Host ''
Write-Host '--- Check watchdog status: ---' -ForegroundColor Cyan
Write-Host "  Get-ScheduledTaskInfo -TaskName '$WatchdogName'"
Write-Host ''
Write-Host '--- Watchdog log: ---' -ForegroundColor Cyan
Write-Host '  Get-Content C:\ANTIGRAVITY\logs\sabretooth-watchdog.log -Tail 50'
Write-Host ''
Write-Host 'Done. Sabretooth is now bulletproof: power loss, crash, reboot — all services auto-recover.' -ForegroundColor Green
Write-Host 'Ollama | Paperclip | Cloudflared | Claude CLI | OpenCode CLI — all always-on.' -ForegroundColor Green