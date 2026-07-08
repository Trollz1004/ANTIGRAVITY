@echo off
:: ANTIGRAVITY — Stop All Services
set "DISTRO=Ubuntu-24.04"
echo Stopping FCC-Server...
wsl.exe -d %DISTRO% bash -lc "exec /mnt/c/ANTIGRAVITY/scripts/fcc-server-stop.sh"
echo Stopping Hermes Dashboard...
wsl.exe -d %DISTRO% bash -lc "pkill -f 'hermes.exe dashboard' 2>/dev/null && echo 'Stopped' || echo 'Not running'"
echo Done.
