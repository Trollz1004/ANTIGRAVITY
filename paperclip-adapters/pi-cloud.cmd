@echo off
setlocal
set "ANTIGRAVITY_ROOT=C:\ANTIGRAVITY"
cd /d "%ANTIGRAVITY_ROOT%"
call "C:\Users\joshl\AppData\Roaming\npm\pi.cmd" --provider ollama --model glm-5.1:cloud %*
