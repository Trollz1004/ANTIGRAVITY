---
name: legacy-node-reinstall-2026-08-16
description: "Archived 2026-08-16 Windows reinstall baseline (retired third node -> superseded by 2-node fleet in ops/fleet/fleet-map.json)"
metadata: 
  node_type: memory
  type: project
  originSessionId: f0495f9c-6315-43f8-a806-9c955e53072b
  modified: 2026-08-16T15:44:08.322Z
---

> **RETIRED THIRD-NODE RECORD:** This historical post-reinstall snapshot documented the former third node (now retired). Active workloads run across **two nodes only** per `ops/fleet/fleet-map.json`: **Alienware (`192.168.0.40`, Workshop)** and **T5500 (`192.168.0.15`, Front-of-House)**.

Windows was reinstalled on the legacy studio host around 2026-08-15. User home resolves via `%USERPROFILE%` (never hardcode user directory names). The old data disk re-lettered D:→F:.

**CANONICAL PATH CONVENTION:** Canonical repository clones sit under `C:\ANTIGRAVITY` (T5500) and `%USERPROFILE%\antigravity\build\ANTIGRAVITY` (Alienware workshop). `F:\ANTIGRAVITY` is kept as ARCHIVE, not an active working copy. OmniRoute runs on T5500 (`192.168.0.15:20128`) with data at `~\.omniroute\data`. See `.agents/skills/t5500-node/SKILL.md` for live T5500 node operations.

**Installed and working:** official Claude Code (`%USERPROFILE%\.local\bin\claude.exe`),
git 2.55, Node 24 LTS + corepack/pnpm 9.15.4, Python 3.13, Docker 29.

**gh CLI RESTORED 2026-08-16 evening:** v2.97.0 at `C:\Program Files\GitHub CLI\gh.exe`
(winget), logged in as Trollz1004 via browser device flow, token in Windows keyring
with repo/read:org/gist scopes. Shells opened pre-install need the full path.

**Post-reinstall gaps resolved in later passes:** `cloudflared`, local CLI harnesses, Ollama, and skill catalogs were reconciled into the active 2-node layout (`192.168.0.40` and `192.168.0.15`). Live skill tree: `.agents/skills/`. Repo-local git identity set (`Trollz1004` / `joshlcoleman@gmail.com`).

`backend` venv intentionally skips `emergentintegrations` (Emergent's private index; lazy-imported, backend boots without it). Related: [[judge-governance-2026-08-16]]
