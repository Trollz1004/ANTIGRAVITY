# Register Mission Control API as a Windows Scheduled Task
# Always-on: starts at boot + login, auto-restarts on crash every 1 min, no time limit
$action = New-ScheduledTaskAction `
    -Execute 'python.exe' `
    -Argument '-m uvicorn mission_control_api.main:app --host 127.0.0.1 --port 8787' `
    -WorkingDirectory 'c:\antigravity\services\mission-control-api'

$triggerBoot = New-ScheduledTaskTrigger -AtStartup
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn

$settings = New-ScheduledTaskSettingsSet `
    -RestartCount 999 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Days 0)

$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Limited

try {
    Register-ScheduledTask `
        -TaskName 'MissionControlAPI' `
        -Action $action `
        -Trigger @($triggerBoot, $triggerLogon) `
        -Settings $settings `
        -Principal $principal `
        -Description 'Mission Control API on 127.0.0.1:8787 — auto-restart on crash, runs at boot' `
        -Force | Out-Null
    Write-Output 'OK: MissionControlAPI scheduled task registered'
    Get-ScheduledTask -TaskName 'MissionControlAPI' | Format-List TaskName, State, Author
    (Get-ScheduledTask -TaskName 'MissionControlAPI').Settings | Format-List RestartCount, RestartInterval, ExecutionTimeLimit
} catch {
    Write-Output ('FAIL: ' + $_.Exception.Message)
    exit 1
}
