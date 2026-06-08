<#
  Register ANTIGRAVITY-Oracle tasks on Sabretooth — hidden, no focus steal.
  powershell -File c:\antigravity\scripts\watchdog\register-oracle-sabretooth.ps1
#>

param([switch]$Unregister)

$ErrorActionPreference = 'Stop'
$Repo = if (Test-Path 'c:\antigravity') { 'c:\antigravity' } else { 'c:\antigravity' }
$Bootstrap = Join-Path $Repo 'scripts\watchdog\bootstrap-sabretooth-hidden.ps1'
$Respawn = Join-Path $Repo 'scripts\watchdog\oracle-respawn.ps1'
$User = "$env:USERDOMAIN\$env:USERNAME"

function Register-OracleTask($Name, $Script, $Triggers) {
    if (-not (Test-Path $Script)) { throw "Missing: $Script" }
    $argList = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $Script + '"'
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $argList
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartInterval (New-TimeSpan -Minutes 2) -RestartCount 5 -Hidden
    $principal = New-ScheduledTaskPrincipal -UserId $User -LogonType Interactive -RunLevel Limited
    $existing = Get-ScheduledTask -TaskName $Name -ErrorAction SilentlyContinue
    if ($existing) {
        Set-ScheduledTask -TaskName $Name -Action $action -Trigger $Triggers -Settings $settings -Principal $principal | Out-Null
        Write-Host "[ok] Updated $Name"
    } else {
        $desc = "ANTIGRAVITY Oracle hidden - $Script"
        Register-ScheduledTask -TaskName $Name -Action $action -Trigger $Triggers -Settings $settings -Principal $principal -Description $desc | Out-Null
        Write-Host "[ok] Registered $Name"
    }
}

if ($Unregister) {
    foreach ($n in @('ANTIGRAVITY-Oracle-Bootstrap', 'ANTIGRAVITY-Oracle-Respawn')) {
        if (Get-ScheduledTask -TaskName $n -ErrorAction SilentlyContinue) {
            Unregister-ScheduledTask -TaskName $n -Confirm:$false
            Write-Host "[ok] Removed $n"
        }
    }
    exit 0
}

$logon = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$startup = New-ScheduledTaskTrigger -AtStartup
try { $startup.Delay = 'PT2M' } catch { }

Register-OracleTask 'ANTIGRAVITY-Oracle-Bootstrap' $Bootstrap @($logon, $startup)
Register-OracleTask 'ANTIGRAVITY-Oracle-Respawn' $Respawn @($logon, $startup)

Write-Host "Oracle tasks registered (Hidden). No cmd windows."
Write-Host "Start-ScheduledTask -TaskName ANTIGRAVITY-Oracle-Bootstrap"
Write-Host "Start-ScheduledTask -TaskName ANTIGRAVITY-Oracle-Respawn"