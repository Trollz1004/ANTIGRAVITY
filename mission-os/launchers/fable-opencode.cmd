@echo off
REM Launch OpenCode backed by local Ollama model joshlcoleman/Fable on T5500
set OLLAMA_HOST=http://192.168.0.15:11434
set OPENAI_COMPAT_BASE_URL=http://192.168.0.15:20128/v1
"%USERPROFILE%\AppData\Local\Programs\Ollama\ollama.exe" launch opencode --model joshlcoleman/Fable %*
