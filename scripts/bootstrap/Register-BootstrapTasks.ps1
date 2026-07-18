#Requires -Version 5.1
# Register SYSTEM startup + heal tasks for SERVERS only. Never laptop watchdogs.
[CmdletBinding()]
param(
    [ValidateSet('Laptop','T5500','Both')]
    [string]$Target = 'Laptop',
    [string]$RepoRoot = $(if (Test-Path 'C:\antigravity\scripts\bootstrap') { 'C:\antigravity' } else { 'C:\ANTIGRAVITY' })
)

$ErrorActionPreference = 'Stop'

function Assert-Admin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    $p = New-Object Security.Principal.WindowsPrincipal($id)
    if (-not $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Host 'Re-launching elevated...'
        $arg = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Target $Target -RepoRoot `"$RepoRoot`""
        Start-Process powershell.exe -Verb RunAs -ArgumentList $arg | Out-Null
        exit 0
    }
}

function Register-BootTask {
    param(
        [string]$TaskName,
        [string]$ScriptPath,
        [string]$Description,
        [int]$DelaySec = 20,
        [int]$HealMinutes = 5
    )
    if (-not (Test-Path -LiteralPath $ScriptPath)) {
        throw "Missing bootstrap script: $ScriptPath"
    }

    # Service mode: no pause, continuous heal
    $args = "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`" -ServiceMode -HealIntervalSec 90"
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $args -WorkingDirectory (Split-Path $ScriptPath -Parent)

    $tStart = New-ScheduledTaskTrigger -AtStartup
    # Delay via settings / random delay not always available - use once+repeat for heal
    $tHeal = New-ScheduledTaskTrigger -Once -At ((Get-Date).AddMinutes(2)) `
        -RepetitionInterval (New-TimeSpan -Minutes $HealMinutes) `
        -RepetitionDuration (New-TimeSpan -Days 3650)

    $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -MultipleInstances IgnoreNew `
        -RestartCount 5 `
        -RestartInterval (New-TimeSpan -Minutes 2) `
        -ExecutionTimeLimit ([TimeSpan]::Zero) `
        -Hidden

    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger @($tStart, $tHeal) `
        -Principal $principal -Settings $settings -Description $Description -Force | Out-Null

    Write-Host "Registered $TaskName (AtStartup + every ${HealMinutes}m, SYSTEM, no login)"
}

Assert-Admin

$laptopPs1 = Join-Path $RepoRoot 'scripts\bootstrap\Bootstrap-LaptopControlPlane.ps1'
$t5500Ps1  = Join-Path $RepoRoot 'scripts\bootstrap\Bootstrap-T5500DateApp.ps1'

if ($Target -in @('Laptop','Both')) {
    Write-Host 'LAPTOP: refusing watchdog/heal scheduled tasks (Joshua hard rule).'
    Write-Host '  Manual one-shot only: scripts\bootstrap\bootstrap-laptop.bat'
    # Ensure any prior laptop heal task is gone
    foreach ($dead in @('ANTIGRAVITY-Laptop-ControlPlane-Bootstrap','PaperclipLaptopStack')) {
        $existing = Get-ScheduledTask -TaskName $dead -ErrorAction SilentlyContinue
        if ($existing) {
            try {
                Stop-ScheduledTask -TaskName $dead -ErrorAction SilentlyContinue
                Unregister-ScheduledTask -TaskName $dead -Confirm:$false
                Write-Host "  Removed $dead"
            } catch {
                Write-Host "  Could not remove $dead : $($_.Exception.Message)"
            }
        }
    }
}

if ($Target -in @('T5500','Both')) {
    # Prefer C:\ANTIGRAVITY on server
    $tRoot = if (Test-Path 'C:\ANTIGRAVITY\scripts\bootstrap\Bootstrap-T5500DateApp.ps1') { 'C:\ANTIGRAVITY' } else { $RepoRoot }
    $t5500Ps1 = Join-Path $tRoot 'scripts\bootstrap\Bootstrap-T5500DateApp.ps1'
    Register-BootTask -TaskName 'ANTIGRAVITY-T5500-FullStack-Bootstrap' `
        -ScriptPath $t5500Ps1 `
        -Description 'T5500: DateApp API/static, Paperclip date-app, Docker DB, cloudflared, heal. NO OmniRoute. SYSTEM no-login.' `
        -HealMinutes 3

    # Ensure ops watchdog is also enabled if installer present
    $installWd = Join-Path $tRoot 'scripts\t5500\Install-DateAppOpsWatchdog.ps1'
    if (Test-Path $installWd) {
        Write-Host 'Also installing/enabling DateApp Ops Watchdog...'
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installWd
    }

    # Re-enable critical stack tasks if disabled
    foreach ($n in @(
        'YouAndINotAI-API',
        'ANTIGRAVITY-DateApp-Static-3200-SYSTEM',
        'PaperclipDateAppLoopback',
        'PaperclipPrivateAuthProxy',
        'PaperclipDateAppWatchdog',
        'ANTIGRAVITY-T5500-DateApp-Cloudflared-SYSTEM',
        'ANTIGRAVITY-T5500-DateApp-OpsWatchdog',
        'ANTIGRAVITY-YouAndINotAI-PublicStack-T5500'
    )) {
        $t = Get-ScheduledTask -TaskName $n -ErrorAction SilentlyContinue
        if ($t -and $t.State -eq 'Disabled') {
            try {
                Enable-ScheduledTask -TaskName $n | Out-Null
                Write-Host "Enabled previously disabled task: $n"
            } catch {
                Write-Host "Could not enable $n : $($_.Exception.Message)"
            }
        }
    }
}

Write-Host ''
Write-Host 'Done. Test now:'
if ($Target -in @('Laptop','Both')) {
    Write-Host '  LAPTOP: no scheduled heal task. Run manually if needed:'
    Write-Host '    scripts\bootstrap\bootstrap-laptop.bat'
}
if ($Target -in @('T5500','Both')) {
    Write-Host '  schtasks /Run /TN "ANTIGRAVITY-T5500-FullStack-Bootstrap"'
    Write-Host '  or: scripts\bootstrap\bootstrap-t5500.bat'
}
Write-Host ''
Write-Host 'Tasks run as SYSTEM at startup - no user login required.'
