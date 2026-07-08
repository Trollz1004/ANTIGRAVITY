@echo off
:: Stop fcc-server in WSL
set "DISTRO=Ubuntu-24.04"
wsl.exe -d %DISTRO% bash -lc "pkill -f fcc-server 2>/dev/null && echo 'Stopped fcc-server' || echo 'No fcc-server running'"
