@echo off
setlocal
set "ANTIGRAVITY_ROOT=C:\ANTIGRAVITY"
cd /d "%ANTIGRAVITY_ROOT%"
ollama launch claude --model glm-5.1:cloud %*
