@echo off
REM Launch Claude Code backed by local Ollama model joshlcoleman/Fable on T5500
set OLLAMA_HOST=http://127.0.0.1:11434
set OPENAI_COMPAT_BASE_URL=http://192.168.0.15:20128/v1
"C:\Users\joshi\AppData\Local\Programs\Ollama\ollama.exe" launch claude --model joshlcoleman/Fable %*
