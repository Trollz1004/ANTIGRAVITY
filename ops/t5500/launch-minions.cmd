@echo off
title Launch Minions
echo ========================================================
echo Launching Interactive Ollama Minions:
echo   - Hermes (Customer Support Desk)
echo   - OpenClaw (Node 24/7 Sentry)
echo ========================================================

start "Hermes Customer Support (youandinotai.com)" cmd /k "cd /d C:\ANTIGRAVITY && ollama run hermes-support"
start "OpenClaw Node Sentry (T5500 Watchdog)" cmd /k "cd /d C:\ANTIGRAVITY && ollama run openclaw-sentry"
