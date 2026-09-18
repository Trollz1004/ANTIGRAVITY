---
name: sabretooth-reinstall-2026-08-16
description: "Post-reinstall machine state — user profile is joshi, agent harnesses wiped, what is actually installed"
metadata: 
  node_type: memory
  type: project
  originSessionId: f0495f9c-6315-43f8-a806-9c955e53072b
  modified: 2026-08-16T15:44:08.322Z
---

Windows was reinstalled on SABRETOOTH-NODE around 2026-08-15. The user profile is now
`C:\Users\joshi` (old `C:\Users\joshl` is GONE). The old data disk re-lettered D:→F:.

**CANONICAL PATH CHANGE (Joshua's directive, later on 2026-08-16): the working repo is
`C:\ANTIGRAVITY` on EVERY node** — same path everywhere so added nodes never hit
drive-letter drift. `F:\ANTIGRAVITY` is the old-disk clone kept as ARCHIVE, not the
working copy. C:\ANTIGRAVITY was converted to a real clone in place (git init +
fetch + checkout -f); deps reinstalled there; env files copied over from F:.
OmniRoute (npm global, :20128/:20129) runs with data at `~\.omniroute\data`,
keepalive in Startup folder pointing at C:\ANTIGRAVITY\scripts. The
`sabretooth-ops` skill in `.agents/skills/` documents the whole stack.

**Installed and working:** official Claude Code (`C:\Users\joshi\.local\bin\claude.exe`),
git 2.55, Node 24 LTS + corepack/pnpm 9.15.4, Python 3.13, Docker 29. All repo deps
reinstalled and building (frontend, MC5, MCP servers, backend/MC6 venvs).

**gh CLI RESTORED 2026-08-16 evening:** v2.97.0 at `C:\Program Files\GitHub CLI\gh.exe`
(winget), logged in as Trollz1004 via browser device flow, token in Windows keyring
with repo/read:org/gist scopes. Shells opened pre-install need the full path.

**Wiped by the reinstall, STILL not installed (re-audited later 2026-08-16):** Hermes
(runs on Joshua's laptop, not this box), OpenClaw, FCC (`fcc-claude`), OpenCode CLI,
Ollama (no binary, :11434 closed), wrangler, **cloudflared** (no service, no
process — youandinotai.com and api.youandinotai.com return HTTP 530, tunnel DOWN),
and the joshl-profile skill trees (Hermes 53 + OpenCode 35). Live skill tree:
`C:\ANTIGRAVITY\.agents\skills` (~44). OmniRoute WAS resurrected (npm global
omniroute@3.8.49, :20128 answering). Mission Control :3151 up; Stack Health :8787
and date app :3200 not running. Repo-local git identity set (Trollz1004 /
joshlcoleman@gmail.com) — global git identity is still unset.

`backend` venv intentionally skips `emergentintegrations` (Emergent's private index;
lazy-imported, backend boots without it). `drift.cmd` in `~\.local\bin` = Win+R launcher
for `claude --continue --dangerously-skip-permissions` in F:\ANTIGRAVITY.

OpenWork 0.18.25 (different-ai/openwork, OpenCode-engine GUI) installed at
`%LOCALAPPDATA%\Programs\@openworkdesktop` on 2026-08-16; pairing via app.openworklabs.com
was opened in Joshua's browser (completion unverified). Related: [[judge-governance-2026-08-16]]
