# T5500 Consolidation Runbook

**Authored:** 2026-05-11 from 9020 by orchestrator Claude Code.
**Audience:** Claude CLI running on T5500 after the GTX 1070 install.
**Goal:** T5500 becomes the ONLY active node. 9020 + Sabretooth get wiped by Josh after T5500 is confirmed working.

---

## Doctrine (read first, do not re-litigate)

- **ONE repo:** `Trollz1004/ANTIGRAVITY` (caps spelling matters)
- **ONE folder:** `C:\Antigravity` on T5500
- **ONE branch:** `main`
- **Push-to-main authority moves to T5500** (was Sabretooth; Sabretooth will be wiped after `sabretooth-preserve-20260511` lands on origin)
- **Ollama Cloud API key needs rotation** — one was found in a stripped zip during 9020 preserve: `e50184ca...J6w3HWQkWh9KrLCnfpJM6` (Ollama Cloud key, prefix `e50184ca`). Rotate at https://ollama.com/account/keys before redeploying any code that uses it.
- **Paperclip:** one instance on T5500, four companies inside (TRA, AIS, YOU, MAR)
- Hardware: T5500, Dual Xeon, 72GB RAM, single GTX 1070 (8GB VRAM)
- Network: 192.168.0.15

## What is on T5500 already (per Josh, verify)

- `youandinotai.com` real dating-app build — Cloudflare Pages project, but the deploy never got promoted to the production domain. Domain currently serves a placeholder. **This is a priority-1 revenue blocker.**
- Possibly other deploy state. Inventory before assuming.

## What needs to come from 9020 / Sabretooth

- `income-engine/` subtree (already merged into origin/main from Sabretooth, commit `0a24807`, origin HEAD now `08c160c` after this runbook). Just pull.
- **9020 preserve bundle**: branch `9020-preserve-20260511` on origin. Contains `_9020-preserve/income-engine-CLAUDEs/` (Manus dating-app source), `_9020-preserve/support-claw/` (Python support bot), `_9020-preserve/NewsCreator/` (FastAPI+Ollama YouTube automation). See `_9020-preserve/README.md` on that branch for triage instructions.
- **Sabretooth preserve bundle**: branch `sabretooth-preserve-20260511` (to be created by Sabretooth before its wipe — see `SABRETOOTH-PREWIPE.md` on main).
- Paperclip company UUIDs from Sabretooth instance — they will NOT carry over (per-instance state). Recreate by NAME on T5500:
  - Trash Or Treasure Online Recycler LLC → prefix TRA
  - ai-solutions.store → prefix AIS
  - youandinotai.com → prefix YOU
  - marketing → prefix MAR

## Pre-flight (do before pulling anything)

1. Confirm GTX 1070 detected: `nvidia-smi` shows the card, driver loaded, ~8GB VRAM free
2. Confirm Ollama running on port 11434: `curl http://localhost:11434/api/version`
3. Confirm `gh auth status` — if broken, run `gh auth login --web --hostname github.com` once, authorize as Trollz1004, then `setx GITHUB_PERSONAL_ACCESS_TOKEN "$(gh auth token)"`
4. Confirm `wrangler --version` and that `wrangler whoami` shows the correct Cloudflare account

## Step order

### 1. Repo sync
- `cd C:\Antigravity` (create if missing via `git clone https://github.com/Trollz1004/ANTIGRAVITY.git C:\Antigravity`)
- `git fetch origin && git checkout main && git pull --ff-only origin main`
- Verify HEAD ≥ `6c3cab88`

### 2. Inventory what is actually deployed
- Find the dating-app source on T5500 (Josh says it lives here). Likely paths: `C:\youandinotai\`, `C:\Antigravity\youandinotai\`, or in OneDrive
- Identify the Cloudflare Pages project name: `wrangler pages project list`
- Check current deployment: `wrangler pages deployment list --project-name <name>`
- Identify the gap between latest dev deploy and the prod domain mapping

### 3. PRIORITY-1: Push the real dating app build to youandinotai.com
This is the work the previous AI never finished. From Josh: "wrangler dns cloudflared page to domain from the dev page" — translate: the dev-preview deploy exists, but `youandinotai.com` is still pointed at a placeholder/dev URL instead of the latest production build. Fix the custom-domain binding in Cloudflare Pages and promote the latest preview to production.
- `wrangler pages deploy <build-output-dir> --project-name <name> --branch main`
- In Cloudflare dashboard (or `wrangler pages domain add`): bind `youandinotai.com` and `www.youandinotai.com` to the project, production branch = `main`
- Verify: `curl -sS https://youandinotai.com | head -40` shows the real app HTML, not the placeholder

### 4. Paperclip + companies
- Bring up Paperclip on T5500 at `127.0.0.1:3100`
- Create the four companies by NAME (UUIDs will be new — that's fine, reference by name + prefix)
- Confirm Hermes CEO agent is wired per company

### 5. Manus lead-gen pipeline
- Source: `C:\income-engine\backend\` (services, db) + `C:\income-engine\manus-gui-extract\` on 9020. After step 1's pull, it should be at `C:\Antigravity\income-engine\` on T5500
- Stand up the backend on T5500 (Node + MySQL/Drizzle, port TBD — check `package.json` scripts)
- Wire the GUI (LeadMarketplace.tsx, PaperclipIntegration.tsx) into the YOU and AIS Paperclip companies
- This pipeline has never been pointed at a real customer. After it boots cleanly, the next step is sales, not more code.

### 6. NewsCreator (optional, low priority)
- Path on 9020: `C:\NewsCreator-backup\NewsCreator-main\`
- Subtree-merge into `Trollz1004/ANTIGRAVITY` under `news-creator/` OR leave on disk until Josh decides
- Not blocking revenue — defer if step 3-5 are still in motion

### 7. Memory + config consolidation
- T5500 `.claude\projects\` should hold the live memory dirs. OneDrive at `C:\Users\joshl\OneDrive\.claude\` already mirrors. Verify OneDrive is running on T5500 (`Get-Process OneDrive`)
- Pull the latest memory files from OneDrive if T5500's local copy is older

### 8. Verify revenue surfaces are live
- `https://youandinotai.com` → real app (NOT a placeholder/dev page)
- `https://ai-solutions.store` → either real landing or honest "coming soon" with a contact form
- Paperclip dashboard at `http://127.0.0.1:3100` → all 4 companies present, heartbeats green
- Income-engine backend → boots, healthcheck endpoint responds

### 9. Hand back to Josh
- Report: every step above with green/red status
- List: anything blocked, what unblocks it
- DO NOT touch 9020 or Sabretooth yet — Josh wipes those manually after T5500 is confirmed

## Things to NOT do

- Do not delete or modify anything on 9020 / Sabretooth via SSH or network share — Josh handles those nodes physically
- Do not create new GitHub accounts. Trollz1004 is the only one. AidoesitAll is retired.
- Do not push any code containing live tokens, API keys, or PATs. GitHub secret-scanning will block, and we already lost a day to one leaked token this week.
- Do not split the repo. ONE repo doctrine.
- Do not enable memory-lancedb. Still disabled by policy.

## After T5500 is confirmed working (Josh's plan)

- Josh reinstalls Windows fresh on Sabretooth
- Josh reinstalls Windows fresh on 9020
- Both become cold spares or get repurposed later. Not active orchestration nodes.

## Open questions T5500 Claude should answer first turn

1. What is the actual current state of `youandinotai.com` Cloudflare Pages project? Project name, latest deployment, custom-domain bindings.
2. Does `C:\Antigravity\income-engine\` exist on T5500 after the pull? If not, why?
3. Is wrangler authenticated to the correct Cloudflare account?
4. Is Paperclip already installed on T5500 or does it need a fresh install?

Answer those four, then proceed step by step. Report after each numbered step.
