---
name: omniroute-recovery-2026-08-16
description: "OmniRoute providers restored from vault backup — where the backup lives, admin password location, import procedure, current provider state"
metadata: 
  node_type: memory
  type: project
  originSessionId: d12951b0-fb29-465a-a81c-12d09644ffdf
  modified: 2026-08-16T16:46:05.402Z
---

OmniRoute (:20128, npm global omniroute@3.8.49) had ZERO providers configured
after the reinstall — fresh data dir at `~\.omniroute\data` (note: DATA_DIR is
the `data` SUBDIR set by `scripts\omniroute-keepalive.ps1`, not `~\.omniroute`
itself). Restored 2026-08-16 evening.

**The restore payload:**
`C:\Users\joshi\.antigravity-vault\omniroute-legacy-backup-2026-08-16T05-20-49-555Z.json`
— full export (17 provider connections with PLAINTEXT tokens, coder-cascade
combo of 13 models, 86 settings, 1 API key). Re-import it any time via
`POST /api/settings/import-json` (session cookie auth), then RESTART the
server — the credential cache doesn't pick up imported connections live
("No active credentials" until restart). Killing the PID is enough; the
keepalive relaunches it (~30-60s).

**Admin password:** the vault's old INITIAL_PASSWORD does NOT work. Current
admin password: `~\.antigravity-vault\omniroute-admin-password-2026-08-16.txt`
(set via the official tool:
`printf "<pw>" | DATA_DIR="C:\Users\joshi\.omniroute\data" node <npm-global>\omniroute\bin\reset-password.mjs --password-stdin`
— must pass DATA_DIR or it looks in the wrong dir; server restart required).

**API access:** `OMNI_ROUTE_API_KEY` in `C:\ANTIGRAVITY\.env` matches the
imported API key and works on `/v1/chat/completions`. Login endpoint:
`POST /api/auth/login {"password":...}` → session cookie (no token in body).
The CLI (`omniroute sync ...`) authenticates with the API key but its bundle
format ≠ the legacy JSON export format; use import-json for this file.

**State after restore:** 17 configured / 16 active. `claude` connection is
INACTIVE by design (was inactive in the backup). `grok-cli` OAuth token was
already EXPIRED pre-backup — needs re-login to use. Verified live: completion
routed to nvidia/gpt-oss-120b via auto-fallback.

**Other vault OmniRoute files:** `hermes-omniroute.env` (full env incl.
STORAGE_ENCRYPTION_KEY, OAuth client IDs), `laptop-omniroute-home.env`.
`~\.omniroute\.env` carries the active STORAGE_ENCRYPTION_KEY.
`C:\ANTIGRAVITY\omniroute\` is a trimmed source copy (no src/, no data);
its `config\config.json` is just the OpenCode config SCHEMA — not a config.

Related: [[sabretooth-reinstall-2026-08-16]],
[[tunnel-and-secrets-recovery-2026-08-16]]
