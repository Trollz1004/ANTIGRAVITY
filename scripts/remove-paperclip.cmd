@echo off
REM ============================================================
REM Remove Paperclip HQ + Watchdog — one-time cleanup
REM Run from Windows: double-click or cmd
REM ============================================================

echo Removing Paperclip Watchdog scheduled task...
powershell.exe -NonInteractive -Command "Unregister-ScheduledTask -TaskName 'AntigravityPaperclipWatchdog' -Confirm:$false -ErrorAction SilentlyContinue; if ($?) { echo 'Task removed' } else { echo 'Task not found or already removed' }"

echo Removing Paperclip startup marker...
del /f "c:\antigravity\logs\.watchdog-task-registered" 2>nul

echo Killing any running Paperclip watchdog powershell processes...
powershell.exe -NonInteractive -Command "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -match 'paperclip-watchdog' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; echo \"Killed PID $($_.ProcessId)\" }"

echo Killing any running Paperclip HQ node processes on port 3100...
powershell.exe -NonInteractive -Command "$conn = Get-NetTCPConnection -LocalPort 3100 -ErrorAction SilentlyContinue; if ($conn) { $conn | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue; echo \"Killed PID $($_.OwningProcess) on :3100\" } } else { echo 'Nothing on :3100' }"

echo.
echo DONE. Paperclip HQ + Watchdog removed.
echo The Docker postgres container (paperclip-postgres) is still available if needed.
pause