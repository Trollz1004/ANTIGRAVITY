@echo off
setlocal enabledelayedexpansion
set "MODEL=%~1"
shift
if "%MODEL%"=="opus"   set "MODEL=openrouter/nvidia/nemotron-3-ultra-550b-a55b:free"
if "%MODEL%"=="sonnet" set "MODEL=openrouter/nvidia/nemotron-3-super-120b-a12b:free"
if "%MODEL%"=="haiku"  set "MODEL=openrouter/nvidia/nemotron-3-nano-30b-a3b:free"
if "%MODEL%"==""       set "MODEL=openrouter/nvidia/nemotron-3-super-120b-a12b:free"
bash -lc 'cd "E:/ANTIGRAVITY" && bin/pi --provider openrouter --model "'"%MODEL%"'" %*'
endlocal
