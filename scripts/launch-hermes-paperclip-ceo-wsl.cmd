@echo off
setlocal
title Hermes Paperclip CEO - WSL Orchestration
wsl.exe -d Ubuntu bash -lc "cd /mnt/c/ANTIGRAVITY && chmod +x /mnt/c/ANTIGRAVITY/scripts/bootstrap-paperclip-ceo-wsl.sh && /mnt/c/ANTIGRAVITY/scripts/bootstrap-paperclip-ceo-wsl.sh"
