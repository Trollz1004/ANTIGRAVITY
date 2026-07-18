@ECHO off
TITLE Register Paperclip Stack — Windows Startup Task
CD /D "C:\ANTIGRAVITY\scripts"

ECHO ============================================
ECHO  Register Paperclip Stack as Windows
ECHO  Scheduled Task (run at startup)
ECHO ============================================
ECHO.

REM Requires Admin — auto-elevate
NET SESSION >NUL 2>&1
IF %ERRORLEVEL% NEQ 0 (
    ECHO Requesting Administrator privileges...
    PowerShell Start-Process -Verb RunAs cmd.exe -ArgumentList '/c "%~f0"'
    EXIT /B
)

ECHO [Admin] Creating scheduled task "PaperclipLaptopStack"...
schtasks /Create /F /SC ONSTART /DELAY 0000:15 /TN "PaperclipLaptopStack" /TR "cmd.exe /c \"C:\ANTIGRAVITY\scripts\bootstrap-laptop-paperclip.bat\"" /RU "%USERDOMAIN%\%USERNAME%" /RL HIGHEST

IF %ERRORLEVEL% EQU 0 (
    ECHO.
    ECHO SUCCESS: Task "PaperclipLaptopStack" registered.
    ECHO It will run 15 seconds after every system startup.
    ECHO.
    ECHO To test immediately, run:
    ECHO   schtasks /Run /TN "PaperclipLaptopStack"
    ECHO.
    ECHO To view the task:
    ECHO   schtasks /Query /TN "PaperclipLaptopStack"
    ECHO.
    ECHO To remove:
    ECHO   schtasks /Delete /F /TN "PaperclipLaptopStack"
) ELSE (
    ECHO.
    ECHO ERROR: Failed to register task (code %ERRORLEVEL%).
    ECHO Try running manually as Administrator.
)

PAUSE
