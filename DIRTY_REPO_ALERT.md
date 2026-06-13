# ⚠️ REPO DIRTY ALERT

**Repo:** `C:\ANTIGRAVITY` (mounted at `/mnt/c/Antigravity` in WSL)
**Detected:** 2026-06-13 (cron run — dirty-repo watcher)
**Detection command:** `git status --porcelain`

## Alert

**ALERT: Repo C:\ANTIGRAVITY is dirty. Run 'git status' to review changes.**

## Status

The repository has untracked, modified, and renamed files. **No auto-commit was performed**, per cron instructions.

### Staged additions (`A ` / `AM`)
- `A  apps/mission-control/public/stream-paperclip.html`
- `A  apps/mission-control/public/stream-safe.html`
- `AM apps/paperclip`
- `A  docs/archive/root-cleanup-2026-06-12/README.md`
- `A  docs/operations/antigravity-one-root-mission-control-plan.md`
- `A  hermes/agents/ceo-business-exchange.md`
- `A  hermes/agents/ceo-hermes-sideworld.md`

### Modified tracked files
- `M  apps/paperweight/data/paperweight.db`
- `M  apps/paperweight/paperweight.py`
- `M  apps/paperweight/static/index.html`
- `M  apps/paperweight/test_paperweight.py`
- ` M .agents/skills/payments/SKILL.md`
- ` M .agents/skills/revenue-model/SKILL.md`
- ` M .claude/commands/square-status.md`
- ` M CLAUDE.md`
- ` M backend/fastapi-app/app/revenue_allocation.py`
- ` M backend/ledger.py`
- ` M briefings/CHROME-EXTENSION-AGENT-DEPLOY-PROMPTS-2026-06-05.md`
- ` M briefings/DOCTRINE-AUDIT-HERMES-SETUP-GUIDE-2026-06-05.md`
- ` M briefings/HERMES-MANUS-ORCHESTRATION-LAYERS-2026-06-05.md`
- ` M briefings/REPOSITORY_RECORD.md`
- ` M briefings/TEST-COVERAGE-AUDIT-2026-05-12.md`
- ` M campaign-deliverables/payment-flow-verification.md`
- ` M hermes/agents/AGENTS.md`
- ` M hermes/agents/CFO/AGENTS.md`
- ` M services/mission-control-api/src/mission_control_api/probes/__init__.py`
- ` M services/mission-control-api/src/mission_control_api/routes/health.py`
- ` M skills/revenue-model/SKILL.md`

### Renames (`R`, intentional archival)
Root files moved into `docs/archive/root-cleanup-2026-06-12/`:
- `High-Traffic_Social_Communities_and_Dating_App_Mar-Genspark_AI_Sheets-*.csv` → `data/`
- `Genspark.html`, `Marketing Maven Remix-saved.html` → `html/`
- `68d7a6c5...png` → `media/`
- `chrome.css`, `mission-control-manus.bundle`, `mission-control.html`, `serve-cockpit.js` → `mission-control-static/`
- `# ANTIGRAVITY.md`, `Note` → `notes/`
- `hermes_agent-0.15.0-py3-none-any.whl.sigstore.json` → `release-metadata/`
- `ANTICRON_SYNC_REPORT.md`, `CONSOLIDATION_MANIFEST.md`, `paperweight-mission-control.pdf`, `telegram_integration_recommendations.pdf`, `test_result.md` → `reports/`
- `invite.ics` → `data/`
- `bootstrap_hermes_audit.sh`, `create_audit_commit_stdin.sh` → `scripts/audit/`

### Untracked (`??`)
- `DIRTY_REPO_ALERT.md` (this file)
- `backend/fastapi-app/REVENUE_STREAMS_IMPLEMENTATION.md`
- `backend/fastapi-app/app/revenue_streams.py`
- `backend/fastapi-app/tests/test_revenue_streams.py`
- `backend/legacy_modernizer_api.py`
- `briefings/HERMES-CONSOLIDATION-PHASE3-DIRECTIVE-2026-06-13.md`
- `services/mission-control-api/src/mission_control_api/probes/compliance.py`
- `test_revenue_streams_simple.py`
- `verify_implementation.py`

## Discord delivery note

The cron job asked to push this alert to Discord `#engineering`. Attempted delivery via `hermes send --to discord:#engineering`, but:

- `~/.hermes/.env` contains no `DISCORD_BOT_TOKEN` / Discord webhook URL.
- `~/.hermes/channel_directory.json` shows `discord: []` — no channels discovered.
- Discord is configured at the gateway level in `config.yaml` (`require_mention`, `allowed_channels`, `channel_prompts: {}`) but the gateway has never been started with a token, so no channels are visible to `hermes send`.

**Result:** No Discord delivery possible from this cron session. This file is the on-disk alert; the cron run's final response is the user-facing copy.

## Recommended follow-up

1. Review changes with `git status` / `git diff` from `C:\ANTIGRAVITY`.
2. If changes are intentional, commit on the appropriate feature branch (do not push to `main` without review).
3. If you want this alert pushed to Discord `#engineering` automatically going forward, run `hermes gateway setup` (or set `DISCORD_BOT_TOKEN` in `~/.hermes/.env`) so the cron job has a delivery channel.

— end of alert —
