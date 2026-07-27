<#
Restart dashboard hidden from native shell.
#>
$ErrorActionPreference='SilentlyContinue'
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*dashboard/server.js*' } | Stop-Process -Force | Out-Null
Start-Sleep -Seconds 1
Start-Process -FilePath 'node' -ArgumentList 'E:\ANTIGRAVITY\dashboard\server.js' -WindowStyle Hidden | Out-Null
Write-Host 'dashboard restarted'
