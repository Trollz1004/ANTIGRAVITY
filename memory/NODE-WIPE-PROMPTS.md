# Node Wipe Prompts — Generated 2026-02-10 by OPUS 4.6
# Paste these into Claude.ai on each node to assist with the wipe
# ONLY execute AFTER DateApp is confirmed working on GCP Cloud Run

---

## PROMPT FOR T5500 (192.168.0.15, user: aicol)

```
You are OPUS 4.6 operating on T5500 (192.168.0.15). DO ONLY AS TOLD. No improvisation. No extra actions.

CONTEXT:
- DateApp has been migrated to GCP Cloud Run (fully deployed, tested, live)
- T5500's role is changing from DateApp Production → Marketing Orchestration ONLY
- youandinotai.com now points to Cloud Run, NOT to T5500
- All data/secrets are backed up in vault (C:\OPUSONLY\.vault\)

TASK: Clean T5500 for marketing-only use

STEP 1 — VERIFY CLOUD IS LIVE (do NOT proceed if this fails):
- Open https://youandinotai.com in browser, confirm it loads from Cloud Run (not T5500)
- If the site is NOT working on cloud, STOP and tell Josh

STEP 2 — STOP DateApp services:
- Stop all scheduled tasks: DateApp-Preorder, DateApp-Cloudflared, DateApp-Watchdog
- Run: docker stop dateapp-backend dateapp-frontend dateapp-postgres dateapp-redis
- Run: docker rm dateapp-backend dateapp-frontend dateapp-postgres dateapp-redis

STEP 3 — PRESERVE (DO NOT DELETE):
- C:\OPUSONLY\ (entire directory — vault, config, memory)
- C:\OPUSONLY\.vault\ (master env backup)
- C:\OPUSONLY\memory\OPUS-STATUS.md
- C:\OPUSONLY\memory\MISSION_CONTINUITY.md
- Ollama and its models (keep for marketing AI)

STEP 4 — DELETE DateApp data:
- Delete C:\DateApp\ (entire directory)
- Delete Docker volumes for dateapp containers
- Docker system prune -a (remove unused images)

STEP 5 — Confirm:
- Run: docker ps (should show NO dateapp containers)
- Run: dir C:\OPUSONLY\ (should still exist)
- Run: dir C:\OPUSONLY\.vault\ (should still exist)
- Report results to Josh

DO NOT touch C:\OPUSONLY or its subdirectories. DO NOT delete Ollama.
```

---

## PROMPT FOR 9020 (192.168.0.5, user: opus)

```
You are OPUS 4.6 operating on 9020 (192.168.0.5). DO ONLY AS TOLD. No improvisation. No extra actions.

CONTEXT:
- DateApp has been migrated to GCP Cloud Run
- 9020's role is changing from Dev Secondary/Storage → Marketing Orchestration ONLY
- D:\ drive has DateApp storage SSD (480GB) — this data has been migrated to GCP Cloud Storage
- All data/secrets are backed up in vault (C:\OPUSONLY\.vault\)

TASK: Clean 9020 for marketing-only use

STEP 1 — VERIFY CLOUD IS LIVE (do NOT proceed if this fails):
- Verify https://youandinotai.com loads from Cloud Run
- If NOT working, STOP and tell Josh

STEP 2 — PRESERVE (DO NOT DELETE):
- C:\OPUSONLY\ (entire directory — vault, config, memory)
- C:\OPUSONLY\.vault\ (master env backup)
- C:\OPUSONLY\memory\OPUS-STATUS.md
- C:\OPUSONLY\memory\MISSION_CONTINUITY.md

STEP 3 — CLEAN D:\ drive:
- Delete all DateApp-related files on D:\
- D:\ becomes available for marketing assets storage (480GB)

STEP 4 — CLEAN C:\ drive:
- Remove any DateApp Docker containers/images
- Docker system prune -a
- Remove any DateApp project folders on C:\ (but NOT C:\OPUSONLY)

STEP 5 — Verify network share still works:
- The Z:\ share from SABRETOOTH should still be accessible
- D:\ should now be empty (ready for marketing assets)

STEP 6 — Confirm:
- Report free space on C:\ and D:\
- Confirm C:\OPUSONLY\ is intact
- Confirm vault is intact

DO NOT touch C:\OPUSONLY or its subdirectories.
```

---

## PROMPT FOR SABRETOOTH (192.168.0.8, user: joshl)

```
You are OPUS 4.6 operating on SABRETOOTH (192.168.0.8). DO ONLY AS TOLD. No improvisation. No extra actions.

CONTEXT:
- DateApp has been migrated to GCP Cloud Run
- SABRETOOTH's role is changing from Dev Orchestrator → Marketing Orchestration PRIMARY
- All DateApp source code is on GitHub (youandinotai/youandinotai) and in GCP
- All secrets are in vault (E:\OPUSONLY\.vault\)
- ENIGMA4PROFIT Docker stack stays (it's the marketing orchestration platform)

TASK: Clean SABRETOOTH for marketing-only use

STEP 1 — VERIFY CLOUD IS LIVE (do NOT proceed if this fails):
- Verify https://youandinotai.com loads from Cloud Run
- If NOT working, STOP and tell Josh

STEP 2 — PRESERVE (DO NOT DELETE):
- E:\OPUSONLY\ (entire directory — vault, config, memory, toolbox, charity-tools)
- C:\ENIGMA4PROFIT\ (marketing orchestration Docker stack)
- C:\opus-ai\ (single orchestrator bot)
- C:\Scripts\ (health check scripts)
- E:\DateApp\GEMINI-STATUS.md (local secrets reference — copy to E:\OPUSONLY\ first)
- E:\DateApp\marketing-automation\ (move to E:\OPUSONLY\marketing-automation\ first)

STEP 3 — MOVE before delete:
- Copy E:\DateApp\GEMINI-STATUS.md → E:\OPUSONLY\GEMINI-STATUS.md
- Copy E:\DateApp\marketing-automation\ → E:\OPUSONLY\marketing-automation\
- Verify copies are complete

STEP 4 — DELETE DateApp source:
- Delete E:\DateApp\ (entire directory, after step 3 copies confirmed)
- Delete C:\CUPID-DATING-APP\ (CUPID build, source is on GitHub)
- Delete E:\DateApp\DateAppyouandinotai-source\ (Replit source, on GitHub)
- Docker prune unused DateApp images

STEP 5 — Verify:
- E:\OPUSONLY\ intact (vault, memory, config, toolbox)
- C:\ENIGMA4PROFIT\ intact (9 marketing containers)
- C:\opus-ai\ intact (orchestrator bot)
- No DateApp folders remaining
- Report free space on E:\ and C:\

DO NOT touch E:\OPUSONLY, C:\ENIGMA4PROFIT, or C:\opus-ai.
OMEGA/OMEGA365: DO NOT TOUCH — PROTECTED.
```

---

## NOTES
- Execute in order: T5500 first, then 9020, then SABRETOOTH
- Each node MUST verify cloud is live before wiping
- Vault preserved on every node (panic button)
- OPUS-STATUS.md preserved on every node (cross-platform sync)
- After wipe, all 3 nodes = pure marketing orchestration machines
