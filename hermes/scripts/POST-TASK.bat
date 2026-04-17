@echo off
REM ============================================
REM POST-TASK.bat — Add a task to HERMES queue
REM Usage: POST-TASK.bat [platform] [content]
REM Example: POST-TASK.bat twitter "your post text here"
REM ============================================

setlocal enabledelayedexpansion

set PLATFORM=%1
set CONTENT=%2

if "%PLATFORM%"=="" (
    echo Usage: POST-TASK.bat [platform] [content]
    echo Example: POST-TASK.bat twitter "hello world"
    exit /b 1
)

if "%CONTENT%"=="" (
    echo Error: content cannot be empty
    exit /b 1
)

REM Load queue
set QUEUE_FILE=I:\HERMES\tasks\queue.json

REM Generate task ID (timestamp-based)
for /f %%t in ('powershell -Command "Get-Date -Format 'yyyyMMddHHmmss'"') do set TASK_ID=H%%t

REM Build task JSON
set TASK={"id":"%TASK_ID%","platform":"%PLATFORM%","content":"%CONTENT%","status":"pending","created":"%date% %time%"}

echo [ADDING TASK]
echo Platform: %PLATFORM%
echo Content: %CONTENT%
echo Task ID: %TASK_ID%

REM Read existing queue, append task, write back
powershell -Command "^
\$queue = Get-Content '%QUEUE_FILE%' | ConvertFrom-Json; ^
\$task = '%TASK%' | ConvertFrom-Json; ^
\$queue.tasks += \$task; ^
\$queue | ConvertTo-Json -Depth 10 | Set-Content '%QUEUE_FILE%'"

if %errorlevel% equ 0 (
    echo [OK] Task added to queue
) else (
    echo [ERROR] Failed to add task
)

endlocal
