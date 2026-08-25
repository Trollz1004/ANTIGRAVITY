# Post-Wipe Recovery Guide

Plain-English instructions. Read this if a node has been factory-reset and you need to bring it back online.

**Superseded 2026-08-25.** One ruling in this guide is no longer in force. The line under "What is NOT in these scripts" that read "Paperclip in any form. Paperclip is retired. Do not install it." is itself retired. Paperclip is the live Mission Control runtime on Sabretooth, and a rebuilt Sabretooth is not recovered until it is back. See that section, and `agent-contracts/PAPERCLIP-MCP-CONNECTOR-EVIDENCE.md` for the observed state of that runtime. Nothing else in this guide was re-verified in that pass. In particular the node table and every T5500 instruction below pre-date the Sabretooth-only ruling recorded in `.agents/skills/mission-control/SKILL.md`, and the tunnel runbook this guide links twice is no longer in the tree.

---

## Which script to run

| Node               | Role                                | Script                                        |
| ------------------ | ----------------------------------- | --------------------------------------------- |
| Sabretooth or 9020 | Helper node (Ollama compute worker) | `scripts/post-wipe-bootstrap-helper-node.ps1` |
| T5500              | Primary orchestrator                | `scripts/post-wipe-bootstrap-T5500.ps1`       |

When in doubt: if it is NOT the big workstation with the RTX card that runs the full Hermes GUI, it is a helper node.

---

## Only prerequisite before running

**Sign into OneDrive first as joshlcoleman@gmail.com.**

That is the only thing you have to do manually before launching the script. OneDrive carries:

- The credential vault (Personal Vault / MASTER-UNIVERSAL-ENV-TROLLZ1004.env)
- The Claude memory mirror (doctrine files that every Claude session needs)
- The earlier install script for OpenCode / Gemini

Wait until the OneDrive tray icon shows a checkmark (sync complete). Then run the script. If OneDrive is not present the script will stop immediately and tell you exactly what to do.

---

## How to run

1. Right-click PowerShell → Run as Administrator
2. Navigate to where the script lives (OneDrive or the ANTIGRAVITY repo once cloned):
   ```
   Set-ExecutionPolicy Bypass -Scope Process -Force
   C:\Antigravity\scripts\post-wipe-bootstrap-helper-node.ps1
   ```
   Or for T5500:
   ```
   C:\Antigravity\scripts\post-wipe-bootstrap-T5500.ps1
   ```

**Single command to copy-paste for a helper node:**

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; & "C:\Antigravity\scripts\post-wipe-bootstrap-helper-node.ps1"
```

**Single command for T5500:**

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; & "C:\Antigravity\scripts\post-wipe-bootstrap-T5500.ps1"
```

If the ANTIGRAVITY repo is not cloned yet (brand-new wipe before the script has ever run), grab the script from OneDrive:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
& "C:\Users\joshl\OneDrive\install-helper-node-after-windows-clean.ps1"
```

That earlier script will clone ANTIGRAVITY, after which you can run the full bootstrap above.

---

## Estimated time

| Phase                                                             | Time                                   |
| ----------------------------------------------------------------- | -------------------------------------- |
| Core toolchain (Chocolatey, Git, Node, Python, winget packages)   | ~10 min                                |
| Ollama install + model pulls (~8 GB for helper, ~15 GB for T5500) | ~20-40 min depending on internet speed |
| Hermes Workspace install                                          | ~5 min                                 |
| Hermes Agent CLI + config                                         | ~3 min                                 |
| Claude Code + Codex CLIs                                          | ~3 min                                 |
| Memory sync + service registration                                | ~2 min                                 |
| **Helper node total**                                             | **~40-60 min**                         |
| **T5500 total (heavier models + mission-mcp build)**              | **~60-90 min**                         |

---

## Interactive steps (the ones that need you)

The scripts do everything possible unattended. There are three things that need a browser:

1. **hermes auth login** — OAuth for Nous / OpenRouter. A browser window opens. Log in. Takes about 30 seconds. Run this after the script finishes.
2. **Tailscale join** — The script calls `tailscale up`. A browser window opens to approve the node joining the tailnet. Approve it. ~30 seconds.
3. **cloudflared tunnel login (T5500 only)** — The script will tell you to run `cloudflared tunnel login`. A browser opens to authorize Cloudflare. After that, follow the tunnel migration runbook at `C:\Antigravity\briefings\TUNNEL-MIGRATION-RUNBOOK-2026-05-12.md`.

Everything else runs without you.

---

## If a step fails

The script writes a verbose log to `C:\bootstrap-helper-YYYYMMDD-HHmmss.log` (helper) or `C:\bootstrap-T5500-YYYYMMDD-HHmmss.log` (T5500). Open it and search for `[FAIL]` or `[WARN]`.

**The script is idempotent.** Fix the issue (see common failures below) and re-run. Already-completed steps are skipped automatically.

### Common failures and fixes

| Failure                              | Cause                                       | Fix                                                                                           |
| ------------------------------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| "OneDrive not found"                 | OneDrive not signed in                      | Sign in as joshlcoleman@gmail.com, wait for sync, re-run                                      |
| Vault env file missing               | Personal Vault locked                       | Open File Explorer → OneDrive → Personal Vault → authenticate                                 |
| `winget` not found                   | Very fresh Windows install                  | Run Windows Update once; winget ships with App Installer. Or install from Microsoft Store.    |
| Ollama model pull timeout            | Slow internet or Ollama not running         | Re-run script; the model pull section is idempotent and resumes                               |
| `hermes` not found after pip install | pip installed to wrong Python               | Run `pip show hermes-agent` to find install location; add to PATH                             |
| `pnpm` not found                     | corepack enable failed                      | Run `npm install -g pnpm` as fallback                                                         |
| mission-mcp service fails (T5500)    | Build not complete or Node version mismatch | `cd C:\Antigravity\services\mission-mcp && pnpm install && pnpm build` then re-run            |
| cloudflared tunnel not configured    | Fresh install, no tunnel credentials        | Follow `TUNNEL-MIGRATION-RUNBOOK-2026-05-12.md` manually                                      |
| OPENROUTER_API_KEY warning           | Vault not loaded                            | Set it manually: `$env:OPENROUTER_API_KEY = "sk-or-v1-..."` (from vault) then add to User env |

---

## How to verify success

After the script finishes, the self-test section prints a PASS/FAIL list. Green = good.

Quick manual spot-checks:

```powershell
# Ollama responding?
Invoke-RestMethod http://localhost:11434/api/tags

# Models loaded?
ollama list

# Claude Code working?
claude --version

# Codex working?
codex --version

# Hermes dashboard (after hermes auth login)
# Open browser: http://127.0.0.1:9119

# Paperclip Mission Control (Sabretooth) - check identity, not just the port.
# /api/health reports status and a version but never names the product, so a 200 there
# proves only that something is listening. Check the name as well.
Invoke-RestMethod http://127.0.0.1:3100/api/health                    # expect status "ok"
(Invoke-RestMethod http://127.0.0.1:3100/api/openapi.json).info.title # expect "Paperclip API"

# mission-mcp (T5500 only)
Invoke-WebRequest http://localhost:3901/ -SkipHttpErrorCheck -UseBasicParsing

# Hermes Workspace GUI (T5500 only, after pnpm dev)
# Open browser: http://localhost:3000
```

From T5500, verify a helper node's Ollama is reachable:

```powershell
# Replace HELPER-IP with the helper node's LAN IP or Tailscale IP
Invoke-RestMethod http://HELPER-IP:11434/api/tags
```

---

## Wiring a helper node to T5500's mission-mcp

Once both T5500 and the helper node are up:

1. **On the helper node:** confirm Ollama is running and listening on `0.0.0.0:11434`:

   ```powershell
   ollama list  # shows models
   netstat -an | findstr 11434  # shows 0.0.0.0:11434 LISTENING
   ```

2. **On T5500:** add the helper node to the Hermes router config. Find the hermes-agent config at:
   `%LOCALAPPDATA%\hermes\hermes-agent\config.yaml`

   Add the node under the model routing section or create an Ollama endpoint entry pointing to:
   `http://<HELPER-IP>:11434/v1`

3. **Verify routing from T5500:**

   ```powershell
   # Quick test — ask the helper's Ollama to complete a prompt
   Invoke-RestMethod -Method Post -Uri "http://HELPER-IP:11434/api/generate" `
     -ContentType 'application/json' `
     -Body '{"model":"gemma2:2b","prompt":"ping","stream":false}' |
     Select-Object -ExpandProperty response
   ```

4. **For mission-mcp tool routing:** the MCP server at `http://localhost:3901` on T5500 already has spawn_swarm capability. Register the helper's Ollama endpoint in the MCP config so delegated tasks can route LLM calls there automatically.

---

## Preserve branches (do not delete)

The following branches on `Trollz1004/ANTIGRAVITY` are permanent archives and must never be deleted:

- `9020-preserve-20260511` (SHA `d68b49fb`)
- `sabretooth-preserve-20260511` (SHA `ef952284`)

These contain the pre-wipe state of each node and are the source of truth if you need to recover any configs from before the factory reset.

---

## What is NOT in these scripts

- Paperclip installation or restore steps. The scripts do not stand Paperclip up, and that has not changed — but the ruling that used to sit here, "Paperclip is retired, do not install it," is **superseded as of 2026-08-25**. Paperclip is the active Mission Control runtime on Sabretooth (`paperclipai`, `http://127.0.0.1:3100`, company "ANTIGRAVITY Marketing Co"), and the judge lanes and Paperclip's own MCP connectors hang off it. Bringing it back after a Sabretooth rebuild is a separate, deliberate step taken once the bootstrap script has finished; the node is not recovered without it. Its observed state and the open blockers are recorded in `agent-contracts/PAPERCLIP-MCP-CONNECTOR-EVIDENCE.md`. Mission Control does not move the push wall: harnesses still never push, merge, or delete, and only the judge lane delivers.
- Any credential values. All secrets come from the OneDrive Personal Vault at runtime.
- The youandinotai.com Cloudflare Pages binding — that is managed via Cloudflare Pages dashboard (custom domains UI), separate from the tunnel work.
- The tunnel migration itself (wiring cloudflared to serve `mcp.youandinotai.com`, `hermes.youandinotai.com`, `dashboard.aidoesitall.website` from T5500) — that is covered in `C:\Antigravity\briefings\TUNNEL-MIGRATION-RUNBOOK-2026-05-12.md`.
