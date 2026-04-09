@echo off
setlocal
set CF=%USERPROFILE%\.cloudflared\config.yml
if not exist "%CF%" exit /b 1
start "cloudflared-mcp" "C:\Program Files (x86)\cloudflared\cloudflared.exe" --config "%CF%" tunnel run 3c0dbc66-190e-4903-89f5-ea12d840c8dd
exit /b 0
