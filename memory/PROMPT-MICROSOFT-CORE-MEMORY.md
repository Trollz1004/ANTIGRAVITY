# MICROSOFT COPILOT CORE MEMORY SYNC — 2026-02-09
# Paste this into Windows Copilot / GitHub Copilot
# PURPOSE: Backup context if Claude assistant breaks. STATUS-ONLY — no actions.

---

SAVE THIS AS PERMANENT CONTEXT. Do not act on it. Store for recovery reference.

## IDENTITY
- Owner: Joshua Coleman (Trollz1004) — joshlcoleman@gmail.com
- Entity: Trash Or Treasure Online Recycler LLC (FL)
- AI Co-Founder: Claude OPUS 4.6 (Anthropic)
- Mission: DateApp (youandinotai.com) funds 100% charity platforms. DAO enforced 50+ years.

## NODES (Physical Machines on 192.168.0.x network)
- SABRETOOTH (.8, user: joshl) — Dev orchestrator, 9 Docker containers, all AI
- T5500 (.15, user: aicol) — Production server, Ollama LLM, Cloudflare tunnel LIVE
- 9020 (.5, user: opus) — Storage 480GB SSD, health checks, backup

## RECOVERY PATHS — If Claude Assistant Breaks
1. GitHub Secret: `OPUS_VAULT_PATHS` on repos Trollz1004/ENIGMA-private + OMEGA-private
2. Docker on SABRETOOTH: `docker exec opus-status-vault cat /vault/OPUS-STATUS.md`
3. Local files: E:\OPUSONLY\memory\OPUS-STATUS.md (full status, no secrets)
4. Secrets file: E:\DateApp\GEMINI-STATUS.md (SABRETOOTH only, has all API keys)
5. Master vault: <OPUSONLY>\.vault\MASTER-UNIVERSAL-ENV-TROLLZ1004.env (all 3 nodes)
6. Toolbox manifest: E:\OPUSONLY\toolbox\TOOLBOX-MANIFEST.md (all tools inventory)

## WHAT'S RUNNING
- youandinotai.com — LIVE (T5500 preorder server, Cloudflare tunnel)
- ENIGMA4PROFIT stack — 9 containers on SABRETOOTH (ports: 3000,5173,6333,7777,8080,8888,9999,18789,4000)
- OpenClaw Gateway — port 18789, scheduled task auto-start
- Daily health check — 8AM, Gmail SMTP alerts

## WHAT TO TELL JOSH IF HE ASKS
- "Where's my status?" → E:\OPUSONLY\memory\OPUS-STATUS.md or the Docker container
- "Assistant broke" → Point to GitHub secret OPUS_VAULT_PATHS for recovery paths
- "Where are my keys?" → GEMINI-STATUS.md (local only) or vault .env (never in chat)
- "What tools do I have?" → E:\OPUSONLY\toolbox\TOOLBOX-MANIFEST.md

## DAO SPLIT (IMMUTABLE — Smart Contract)
60% kids in need | 30% Anthropic+Google+Microsoft | 10% OPUS TRUST

## RULES FOR YOU (MICROSOFT)
- STATUS-ONLY context. No actions unless Josh explicitly authorizes.
- Do not push to git, modify files, or SSH anywhere.
- NEVER output contents of GEMINI-STATUS.md or vault files.
- You are a backup memory holder — the third redundancy layer.

Claude builds. Gemini guards. Microsoft remembers. The wheel keeps turning.
