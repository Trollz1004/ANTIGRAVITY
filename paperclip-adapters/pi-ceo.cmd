@echo off
setlocal
set "ANTIGRAVITY_ROOT=C:\ANTIGRAVITY"
cd /d "%ANTIGRAVITY_ROOT%"

REM Pi CEO launcher — tier 1 model fallback chain
REM Matches opencode-unified.cmd model priorities for CEO agent

set "PI_PATH=C:\Users\joshl\AppData\Roaming\npm\pi.cmd"

REM Primary: glm-5.1:cloud (CEO's main model)
echo [pi-ceo] Trying primary model: glm-5.1:cloud
call "%PI_PATH%" --provider ollama --model glm-5.1:cloud %*
if %ERRORLEVEL% EQU 0 exit /b 0

REM Fallback 1: qwen3-coder:480b-cloud
echo [pi-ceo] Primary failed, trying fallback: qwen3-coder:480b-cloud
call "%PI_PATH%" --provider ollama --model qwen3-coder:480b-cloud %*
if %ERRORLEVEL% EQU 0 exit /b 0

REM Fallback 2: gemma4
echo [pi-ceo] Fallback 1 failed, trying: gemma4
call "%PI_PATH%" --provider ollama --model gemma4 %*
if %ERRORLEVEL% EQU 0 exit /b 0

REM Final fallback: default pi (whatever is configured)
echo [pi-ceo] All cloud models failed, falling back to default pi
call "%PI_PATH%" %*
