# 9020 Preserve Bundle — 2026-05-11

**Purpose:** Snapshot of code/data that lived ONLY on 9020 (not in any prior commit of `Trollz1004/ANTIGRAVITY`), pushed here on branch `9020-preserve-20260511` so it survives the 9020 factory reset.

This branch is **not for merge into main as-is**. T5500 reviews each subdir and either:
- Subtree-merges valuable parts into the canonical tree under `income-engine/` or a new top-level dir, OR
- Discards if superseded

## Contents

### `income-engine-CLAUDEs/`
Source: `D:\income-engine\CLAUDEs\` on 9020.
Manus-built dating-app + Lead Marketplace React source. Contains `.tsx` components (Agents, Chat, Dashboard, DashboardLayout, DelegationHistory, DelegationModal, Leads, Paperclip, Settings, Tasks, App), Drizzle migrations (`0001_dazzling_speed_demon.sql`, `0002_eminent_jean_grey.sql`), `db.ts`, `IMPLEMENTATION_GUIDE.md`, `SKILL.md`, `task.create.mdx`, `PATH.txt`.

**Stripped during preservation:**
- `CreateGUIInterfacewithManusAPIforOpenClawTasks.zip` (contained an exposed Ollama Cloud API key in `.env.ollama` — would have been blocked by GitHub secret scanning). Key needs rotation.
- `_How to Integrate Multiple AI Agents for Task Automation__.zip` (nested copy of the same zip, same issue).
- Files inside those zips that ARE NOT already present as raw files in this dir: `imageGeneration.ts`, `fetcherAgent.ts`, `ollamaCloud.ts`, `Workspace.tsx`, `OPENCLAW_README.md`, `INTEGRATION_GUIDE.md`, plus `pasted_file_Ry74vT_image.png`. If T5500 needs any of those, recover from the rotated zip Josh will create after key rotation, or rebuild from `income-engine/manus-gui-extract/` in main.

Overlap check: there is partial overlap with `income-engine/manus-gui-extract/` already on main (different snapshot of similar Manus work). Compare before deciding which is canonical.

### `support-claw/`
Source: `D:\support-claw\` on 9020.
Python bot (`bot.py`) + `config.json`, `data/`, `requirements.txt`, setup scripts. Per memory this is the YouAndINotAI support bot (Ollama/Gemini fallback). Not in main yet.

### `NewsCreator/`
Source: `C:\NewsCreator-backup\NewsCreator-main\` on 9020 (preserved earlier 2026-05-11 from the deleted `Trollz1004/NewsCreator` repo).
FastAPI + Ollama YouTube automation app. `app.py`, `cli.py`, web dashboard, session memory. See `NewsCreator/README.md` for original docs.

## What is NOT here (and why)

- `D:\AidoesitAll\` — empty directory on 9020, nothing to preserve
- `C:\paperclip-9020\instances\default\` — stale local Paperclip data with a single non-canonical company UUID (`cbb68f29-...`), superseded by the Sabretooth TRA/AIS/YOU/MAR set; T5500 will create fresh
- `C:\hermes-workspace\` — appears to overlap with `hermes-workspace/` already in main; not duplicated here
- `C:\openclaw\`, `C:\SUPPORTCLAW-9020\`, `C:\Trollz1004\ANTIGRAVITY\` — overlap with existing repo content; recheck before wipe if uncertain

## Action on T5500

After GPU install + first turn:
1. `git fetch origin && git branch -a` — confirm `origin/9020-preserve-20260511` visible
2. `git checkout 9020-preserve-20260511` to inspect, OR `git show origin/9020-preserve-20260511:_9020-preserve/README.md` to read this without checking out
3. For each subdir, decide: merge into main / leave on this branch as archive / discard
4. After Josh wipes 9020, this branch is the only copy — do not force-delete it from origin
