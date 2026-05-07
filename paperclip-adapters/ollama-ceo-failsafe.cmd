@echo off
setlocal
set "ANTIGRAVITY_ROOT=C:\ANTIGRAVITY"
cd /d "%ANTIGRAVITY_ROOT%"
"C:\Users\joshl\AppData\Local\Programs\Ollama\ollama.exe" run llama3.1:8b %*
