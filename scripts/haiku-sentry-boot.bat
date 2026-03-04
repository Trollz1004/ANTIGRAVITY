@echo off
:: Haiku Sentry — boot announcement
:: Called by Task Scheduler at logon

:: Wait for network and Docker to be ready
timeout /t 30 /nobreak >nul

node C:\ANTIGRAVITY\scripts\haiku-sentry.js --boot
