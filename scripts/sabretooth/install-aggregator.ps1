param(
    [string]$RepoRoot = "c:\antigravity"
)

$ErrorActionPreference = "Stop"
$ServiceRoot = Join-Path $RepoRoot "services\health-aggregator"
$Python = Join-Path $ServiceRoot ".venv\Scripts\python.exe"

if (!(Test-Path $Python)) {
    py -3.12 -m venv (Join-Path $ServiceRoot ".venv")
    & $Python -m pip install -r (Join-Path $ServiceRoot "requirements.txt")
}

$Action = New-ScheduledTaskAction -Execute $Python -Argument "-m uvicorn app.main:app --host 127.0.0.1 --port 11436" -WorkingDirectory $ServiceRoot
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel LeastPrivilege
Register-ScheduledTask -TaskName "ANTIGRAVITY-HealthAggregator" -Action $Action -Trigger $Trigger -Principal $Principal -Force

netsh interface portproxy set v4tov4 listenaddress=0.0.0.0 listenport=11436 connectaddress=127.0.0.1 connectport=11436 | Out-Null
if (-not (Get-NetFirewallRule -DisplayName "ANTIGRAVITY Health Aggregator 11436" -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName "ANTIGRAVITY Health Aggregator 11436" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 11436 -Profile Private | Out-Null
}

Write-Host "ANTIGRAVITY Health Aggregator scheduled on boot and exposed on TCP 11436."
