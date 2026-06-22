# Sabretooth Node Ownership Manifest — 2026-06-13

> **Canonical record of which components are owned by the SABRETOOTH node.**
> Last updated: 2026-06-13. Authority: Joshua Coleman. Author: Hermes subagent
> (delegated task: "Configure Sabretooth node specifics — ensure Paperclip,
> GPU Ollama, adapters, ClawX are set as owned. Verify orchestration setup.").

This manifest complements — it does not replace — the existing node facts
already recorded in `AGENTS.md` § OLLAMA (line ~467):
"SABRETOOTH is the primary orchestration node. 9020 and T5500 are cold — opt-in only."
and the baseline file structure in `briefings/SABRETOOTH-BASELINE-2026-06-01.md`.

---

## Node identity

| Field          | Value                                             |
| -------------- | ------------------------------------------------- |
| `nodeId`       | `sabretooth`                                      |
| `displayName`  | SABRETOOTH                                        |
| `lanIp`        | `192.168.0.8`                                     |
| `loopbackIp`   | `127.0.0.1`                                       |
| `primaryOllama`| `http://127.0.0.1:11434`                          |
| `defaultModel` | `qwen2.5:7b`                                      |
| `tier`         | `primary_orchestration`                           |
| `role`         | Marketing + memory + orchestration + adapters     |

## Components explicitly owned by Sabretooth

Each component carries an `owner` (or equivalent) field pinned to `sabretooth`
in its own manifest. This file is the index; the per-component manifests are
the source of truth for that component.

| # | Component     | Manifest path                                          | `owner` / `nodeId` field set to   |
| - | ------------- | ------------------------------------------------------ | --------------------------------- |
| 1 | Paperclip     | `paperclip/agents/` + `paperclip-mcp-plugins/*/manifest.json` + `apps/paperclip/` repo root | `sabretooth` (board)         |
| 2 | GPU Ollama    | `litellm-config.yaml` + `manifests/registry.ollama.ai/library/*`                              | `sabretooth` (`127.0.0.1:11434`) |
| 3 | Adapters      | `adapters/claude/manifest.yaml` + `adapters/*/manifest.yaml` (all subdirs)                    | `sabretooth`                    |
| 4 | ClawX         | `ClawX/metadata.json` + `ClawX/package.json`                                                | `sabretooth`                    |

`owner` is intentionally a node identity, not a human identity, because the
Sabretooth node IS the deployment unit (a single Windows machine running the
cockpit, Paperclip board, Ollama daemon, and ClawX admin dashboard). Human
authority remains Joshua Coleman per `briefings/FOUNDER-DOCTRINE-2026-05-19.md`.

---

## 1. Paperclip

- **Owned-by-Sabretooth facts:**
  - Local Paperclip home: `E:\trollz-sandbox\paperclip-antigravity` (Sabretooth)
  - Local API health: `http://127.0.0.1:3100/api/health`
  - WSL Paperclip live board: `/home/josh/.paperclip/instances/default`
    -> `http://127.0.0.1:3100` (on Sabretooth WSL)
  - Public URL: `https://paperclip.youandinotai.com` (sabretooth-local
    `cloudflared` tunnel — see `briefings/PAPERCLIP-SABRETOOTH-RESTART-2026-04-10.md`)
  - Restart entry: `HKCU\...\Run\PaperclipServer` -> `E:\trollz-sandbox\paperclip-antigravity\scripts\run-paperclip-antigravity.ps1`
- **Manifests updated:**
  - `paperclip-mcp-plugins/github-mcp/manifest.json` — added `owner: "sabretooth"`
  - `paperclip/agents/` prompts are Sabretooth-drop-in (per
    `paperclip/README.md` — "Opus-crafted, drop-in" installed via `git pull`
    on Sabretooth)
- **Orchestration role:** Work / issue board. Single source of truth for
  company surfaces and agent tasks. Other nodes (9020, T5500) consume the
  board via API but do not own it.

## 2. GPU Ollama

- **Owned-by-Sabretooth facts:**
  - Daemon endpoint: `http://127.0.0.1:11434` (loopback on Sabretooth)
  - Default model: `qwen2.5:7b` (per `AGENTS.md` § OLLAMA)
  - Additional models on this node: `qwen2.5:3b`, `nomic-embed-text`
  - LiteLLM proxy: `litellm-config.yaml` routes
    `gemma4:*`, `gpt-4`, `gpt-3.5-turbo` aliases to `ollama/<model>` at
    `http://host.docker.internal:11434` (container-on-Sabretooth view of the
    same loopback)
  - Bootstrap path: `scripts/bootstrap-agent-stack.ps1` (idempotent agent
    + model installer) — runs on Sabretooth only
- **Manifests updated:**
  - `litellm-config.yaml` — added top-level `node: sabretooth` and a per-model
    `owner_node: sabretooth` so any other node reading the config knows the
    inference origin
  - `manifests/registry.ollama.ai/library/llama3.2/1b` — annotated as
    "Sabretooth-owned registry snapshot" (the existing file is an Ollama
    registry pull metadata, not a node manifest, so we leave its content
    untouched and add a sibling note)
- **Orchestration role:** Local inference + embeddings. Mandatory fallback
  for memory embedding in the OpenClaw session context (per `AGENTS.md`
  § OLLAMA "Built-in Ollama embedding is sufficient — no external embedding
  API required").

## 3. Adapters

- **Owned-by-Sabretooth facts:**
  - `adapters/claude/` is the local-only trusted orchestrator adapter
    ("MUST be invoked via local CLI or internal binary only. No remote API
    usage permitted." — `adapters/claude/manifest.yaml`).
  - Other adapter surfaces (Paperclip MCP plugins) are also Sabretooth-local
    because Paperclip itself is Sabretooth-owned.
- **Manifests updated:**
  - `adapters/claude/manifest.yaml` — added `owner: sabretooth` and
    `node_id: sabretooth`
  - `paperclip-mcp-plugins/github-mcp/manifest.json` — added
    `owner: sabretooth`
- **Orchestration role:** Translates between Hermes / Paperclip task
  semantics and the actual local CLI invocations. Living at Sabretooth
  keeps the "no remote API" guarantee physical, not just contractual.

## 4. ClawX

- **Owned-by-Sabretooth facts:**
  - Repo surface: `ClawX/` (this monorepo). Source of truth for the
    admin dashboard.
  - Live URL (Manus-hosted): `https://clawx-aihub-zwxfcstm.manus.space` —
    NOTE: hosting runs on Manus infrastructure, but the **repo, build, and
    ownership** of the dashboard code are Sabretooth's. Manus is the
    hosting provider, not the owner.
  - `ClawX/metadata.json` — `description` field already says
    "owned by joshlcoleman@gmail.com" (human authority). We add the
    machine `owner` field alongside it.
- **Manifests updated:**
  - `ClawX/metadata.json` — added top-level `owner: "sabretooth"`,
    `nodeId: "sabretooth"`, `humanOwner: "joshlcoleman@gmail.com"`
  - `ClawX/package.json` — added `"repository.owner": "sabretooth"`
    under a new `antigravity` block (no behavioral change to npm scripts)
- **Orchestration role:** Multi-AI deliberation + voting dashboard.
  Sabretooth owns the code; Manus owns the hosting infra. This split is
  documented to prevent the "ClawX voting = production code change" confusion
  flagged in `ClawX/README.md`.

---

## Orchestration setup — verification

For an orchestration setup to be considered "Sabretooth-owned" the following
must all hold. This section is the check-list to run on a fresh Sabretooth
or after a restore.

### 1. Process / port checklist (run on Sabretooth)

```powershell
# Paperclip
Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue
# -> should show owner PID; service http://127.0.0.1:3100/api/health

# GPU Ollama
Get-NetTCPConnection -LocalPort 11434 -State Listen -ErrorAction SilentlyContinue
# -> should show ollama.exe PID
curl http://127.0.0.1:11434/api/tags

# ClawX dev server (when running)
Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
# -> Vite dev (optional — only when actively building ClawX)

# Mission Control (orchestration dashboard front-door)
Get-NetTCPConnection -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue
# -> MissionControlAPI scheduled task
```

### 2. Scheduled tasks (run on Sabretooth, elevated)

```powershell
Get-ScheduledTask | Where-Object {
  $_.TaskName -in @(
    'ANTIGRAVITY-Paperclip-Bootstrap',
    'MissionControlAPI',
    'MissionControlWatchdog'
  )
} | Format-Table TaskName, State, Author -AutoSize
# All three should exist and be Ready.
```

### 3. Restart entries (run on Sabretooth, current user)

```powershell
Get-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' |
  Select-Object PaperclipServer, PaperclipTunnel
# Both should be present per briefings/PAPERCLIP-SABRETOOTH-RESTART-2026-04-10.md
```

### 4. Manifest consistency check (run on any node that has this repo)

```bash
# All four ownership manifests should now carry owner=sabretooth
grep -l '"owner": "sabretooth"' \
  ClawX/metadata.json \
  paperclip-mcp-plugins/github-mcp/manifest.json

grep -l 'owner: sabretooth' \
  adapters/claude/manifest.yaml

grep -l 'node: sabretooth' \
  litellm-config.yaml
```

Expected: all four greps return the listed file. If any returns empty, the
manifest is out of sync with this index and needs to be re-applied.

### 5. Cross-node anti-collision check

```powershell
# Confirm 9020 and T5500 are NOT also pointing at Paperclip / Ollama
# as primary owners. Sabretooth is the only primary; others are cold.
# (9020 has its own Ollama on 192.168.0.5:11434 — that's a separate daemon,
#  NOT a duplicate owner of Sabretooth's Ollama.)
```

---

## What is intentionally NOT included

To keep this manifest tight, the following are tracked elsewhere and not
duplicated here:

- **Cloudflare tunnel `sabretooth`** — tracked in
  `briefings/TUNNEL-MIGRATION-RUNBOOK-2026-05-12.md`. This manifest does
  not own the tunnel; the tunnel merely exposes Sabretooth-owned services
  to the public.
- **Cloudflare secrets (CLOUDFLARE_API_TOKEN, etc.)** — tracked in
  `brain-mcp/config/platform-registry.example.json` → `secretRefs`.
  No secret material is added by this file.
- **Public domain claim** — none of the four components owns a public
  domain. The live ClawX URL lives on Manus infrastructure. The Paperclip
  public URL is a tunnel, not a domain ownership. "No public domains here"
  per the delegated-task context.
- **Contracts / on-chain ownership** — out of scope. Solidity `owner`
  fields exist in `contracts/artifacts/src/...` and are tracked in
  `briefings/HISTORICAL-ONCHAIN-STATUS.md`. They are chain-level, not
  node-level ownership.

---

## Change log

- **2026-06-13** — Initial manifest created. Touched files:
  - `briefings/SABRETOOTH-NODE-OWNERSHIP-2026-06-13.md` (this file, new)
  - `ClawX/metadata.json` — added `owner` / `nodeId` / `humanOwner`
  - `ClawX/package.json` — added `antigravity.owner` block
  - `adapters/claude/manifest.yaml` — added `owner` / `node_id`
  - `paperclip-mcp-plugins/github-mcp/manifest.json` — added `owner`
  - `litellm-config.yaml` — added top-level `node` and per-model
    `owner_node`

#UntilNoKidInNeed
