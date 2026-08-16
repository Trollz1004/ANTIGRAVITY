@echo off
rem FABLE'S HOUSE silent watchdog — logon entry. Copies to shell:startup.
rem Completely hidden: no window, no console output, no cursor theft. All
rem activity goes to C:\ANTIGRAVITY\logs\fables-house.log only.
start "" powershell.exe -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\ANTIGRAVITY\scripts\fables-house\FABLES-HOUSE.ps1" -Watchdog
