@echo off
setlocal
set "ANTIGRAVITY_ROOT=C:\ANTIGRAVITY"
cd /d "%ANTIGRAVITY_ROOT%"
python "%ANTIGRAVITY_ROOT%\paperclip-mcp\server.py" %*
