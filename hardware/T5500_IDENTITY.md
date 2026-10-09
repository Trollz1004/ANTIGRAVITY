# T5500 identity (the only node)

Written by Opus (Claude) in the Antigravity IDE, 2026-10-09. Machine-readable twin: [T5500_IDENTITY.json](T5500_IDENTITY.json).

| Field | Value |
|---|---|
| Hostname | `t5500-2-xeon-72-ram-3070-8gb-gpu-ram` |
| CPU | 2x Xeon E5506 @ 2.13 GHz |
| RAM | 72 GB |
| GPU | RTX 3070, 8 GB VRAM |
| Disk | Fanxiang S101 512 GB (~477 GB) |
| LAN | 192.168.0.15, Broadcom GbE 1 Gbps, MAC 18-03-73-18-E5-86 |
| DNS | 192.168.0.1, 205.171.2.26 |

## Rules for every lane on this box
- Every log line names the host and IP. Hermes support already does: `[t5500-2-xeon-72-ram-3070-8gb-gpu-ram/192.168.0.15]`.
- VRAM is 8 GB. Queue model loads; never run two big models at once.
- Hermes runs headless: SDL dummy drivers, UTF-8 output, edge TTS (the OmniRoute key is rejected, so it has no OpenAI TTS).
- Stitch package is `@google/stitch-sdk`. Never use `@withgoogle/stitch-sdk`.
- In the Jarvis model picker, "Grok (official)" (`grok_official`) means a real Grok login only. It never quietly falls back to OmniRoute or Ollama under that name.
- Live date-app domain: youandinotai.com only (the `.online` domain was not renewed).
- GrinDroid is not on this node; it has not been built yet.
- No secrets in git.
