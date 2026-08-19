@echo off
rem ?? llama.cpp embedding server (:8081) ????????????????????????????????????
rem Fills the LLAMACPP_BASE_URL slot used by the local embeddings integration.
rem Runs embeddinggemma-300m (tiny, ~300 MB) ? fast even on this Xeon, and it
rem is the exact model OpenClaw's memorySearch wanted before it was pointed at
rem ollama/nomic-embed-text.
rem
rem NOT on :8080 ? that port is the DateApp frontend's default and the
rem OmniRoute inspector proxy. :8081 keeps everyone out of each other's way.
rem
rem First run downloads the GGUF from HuggingFace into %LOCALAPPDATA%\llama.cpp.
title llama.cpp embeddings (:8081)
cd /d C:\ANTIGRAVITY
echo [llama.cpp] embedding server on http://127.0.0.1:8081/v1 ? Ctrl+C to stop.
"C:\ANTIGRAVITY\tools\llama.cpp\llama-server.exe" ^
  -hf ggml-org/embeddinggemma-300m-qat-q8_0-GGUF ^
  --embeddings --host 127.0.0.1 --port 8081 --n-gpu-layers 99
