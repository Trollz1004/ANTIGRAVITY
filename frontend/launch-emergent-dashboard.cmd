@echo off
rem Relaunch Emergent Dashboard on Port 3210 (Hidden, permanent)
cd /d "C:\ANTIGRAVITY\frontend"
set PORT=3210
set BROWSER=none
powershell -Command "Start-Process 'npx' -ArgumentList 'craco','start' -WorkingDirectory 'C:\ANTIGRAVITY\frontend' -WindowStyle Hidden"
echo Emergent dashboard launched on port 3210
