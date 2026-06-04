Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like '*social-engine*daemon*' } | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Host "Killed PID $($_.ProcessId)"
}
Write-Host "Daemon cleanup complete"
