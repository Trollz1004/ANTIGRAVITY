@echo off
rem DREAM stack supervisor launcher. The window stays open on any error (-NoExit and cmd /k from the task).
title DREAM Stack
powershell.exe -NoProfile -ExecutionPolicy Bypass -NoExit -File "%~dp0dream-stack.ps1" %*
