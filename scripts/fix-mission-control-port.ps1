# Mission Control API - Fix Orphan PID 10744 on Port 8787
# Run as Administrator

# 1. Check if PID 10744 still owns port 8787
Write-Host "=== Step 1: Checking port 8787 ownership ===" -ForegroundColor Cyan
Get-NetTCPConnection -LocalPort 8787 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress,LocalPort,OwningProcess,State

# 2. Stop the old elevated process
Write-Host "`n=== Step 2: Stopping PID 10744 ===" -ForegroundColor Cyan
Stop-Process -Id 10744 -Force
Start-Sleep -Seconds 2

# 3. Verify port is free
Write-Host "`n=== Step 3: Verifying port 8787 is free ===" -ForegroundColor Cyan
if (Get-NetTCPConnection -LocalPort 8787 -ErrorAction SilentlyContinue) {
  Write-Error ":8787 still bound -- investigate before restart"
  exit 1
} else {
  Write-Host ":8787 is free, ready to restart" -ForegroundColor Green
}

# 4. Relaunch Mission Control API on 0.0.0.0:8787
Write-Host "`n=== Step 4: Relaunching Mission Control API ===" -ForegroundColor Cyan
$env:MISSION_CONTROL_BIND = "0.0.0.0:8787"
Set-Location c:\antigravity\services\mission-control-api
python -m uvicorn mission_control_api.main:app --host 0.0.0.0 --port 8787
