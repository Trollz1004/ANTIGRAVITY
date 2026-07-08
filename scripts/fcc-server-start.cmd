@echo off
:: FCC-Server launcher via WSL
:: Starts free-claude-code proxy on port 8082 with Admin UI at /admin
:: Open http://localhost:8082/admin in browser after startup
set "DISTRO=Ubuntu-24.04"

echo Starting fcc-server in WSL...
echo Admin UI: http://127.0.0.1:8082/admin
echo.
wsl.exe -d %DISTRO% bash -lc "export PATH=\"$HOME/.local/bin:$PATH\"; nohup fcc-server > ~/.fcc/logs/server.out 2>&1 &"
timeout /t 3 /nobreak >nul
wsl.exe -d %DISTRO% bash -lc "curl -sf http://127.0.0.1:8082/health >/dev/null 2>&1 && echo 'fcc-server is RUNNING' || echo 'WARNING: health check failed - check logs'"
start http://localhost:8082/admin
