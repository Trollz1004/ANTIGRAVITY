@echo off
:: EASY BUTTON: Ollama model server (port 11434)
setlocal
echo [fix] checking http://127.0.0.1:11434 ...
powershell -NoProfile -Command "try { $null = (New-Object Net.Sockets.TcpClient('127.0.0.1', 11434)); exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% EQU 0 ( echo [fix] already up — nothing to do & exit /b 0 )
echo [fix] starting: ollama serve
start "Ollama" ollama serve
echo [fix] issued.
exit /b 0
