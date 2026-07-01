# Paperclip Windows Runtime Checklist

**Authority:** Joshua Coleman (`Trollz1004`) / CEO Agent  
**Applies to:** Sabretooth node (source-of-truth Paperclip HQ)  
**Goal:** Everything needed for Paperclip + memory + MCPs starts automatically after restart or power loss.

---

## Required Software

| Software | Purpose | Verify command |
|---|---|---|
| Node.js ≥ 18 | MCP memory bridge, Paperclip backend deps | `node --version` |
| `paperclipai` (npm) | Local Paperclip runtime on `:3100` | `Get-Command paperclipai` |
| Git / `gh` CLI | GitHub MCP plugin + repo ops | `gh auth status` |
| cloudflared | Public tunnel to `paperclip-hq.youandinotai.com` | `cloudflared --version` |
| PowerShell | Watchdog + autostart scripts | ships with Windows |

---

## Required URLs / Ports

| Endpoint | Expected | Checked by |
|---|---|---|
| `http://127.0.0.1:3100/api/health` or `/` | Paperclip local listener | `scripts/paperclip/paperclip-watchdog.ps1` every 60s |
| `https://paperclip-hq.youandinotai.com/api/health` | Public tunnel | `scripts/paperclip/launch-paperclip-hq.ps1` |
| Supabase project REST endpoint | Brain persistence | `scripts/paperclip/mcp-memory-bridge.js` on write |

---

## Required Credentials / Env

Paperclip env is loaded from the stable, repo-local file `C:\antigravity\.env.paperclip`.
This file is gitignored and lives outside the OneDrive timer-locked vault.
`scripts/start-paperclip.ps1` and `scripts/paperclip/mcp-memory-bridge.js` both read `.env.paperclip` first and only fall back to the OneDrive vault or `briefings/` copy if the local file is missing.

Keys required for the memory brain:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (service role key)
- `SUPABASE_PUBLISHABLE_KEY` (already used by date app)

If these are missing, the memory bridge falls back to local `STATE.md` only.

---

## Autostart Components

After running `scripts/paperclip/setup-windows-autostart.ps1` as Administrator, these are registered:

1. **Paperclip Watchdog** — Scheduled task `PaperclipHQ-Watchdog` runs at startup/logon as the current user.
   - Executes `scripts/paperclip/paperclip-watchdog.ps1`.
   - Relaunches Paperclip if `:3100` health fails.
   - Writes to `logs/paperclip-watchdog.log`.

2. **MCP Plugins** — Paperclip itself loads plugins from `paperclip-mcp-plugins/*/manifest.json` when it starts.
   - `agency-agents`
   - `github-mcp`
   - `paperclip-memory`

3. **Cloudflare Tunnel** — Started by `launch-paperclip-hq.ps1` when not already running.

---

## Manual Post-Restart Verification

After a reboot, run in PowerShell:

```powershell
cd C:\antigravity
scripts\paperclip\launch-paperclip-hq.ps1
```

Expected output:

- `Paperclip local runtime is responding with HTTP 200.`
- `Cloudflared tunnel already running` or `Starting cloudflared...`
- `Paperclip public endpoint responded with HTTP 200.`

Then test the memory bridge:

```powershell
node scripts\paperclip\mcp-memory-bridge.js read paperclip-agents-ceo sabretooth
```

Should print the current `STATE.md` content.

---

## If Something Does Not Start

1. Check `logs/paperclip-launch.log`, `logs/paperclip.log`, `logs/paperclip-watchdog.log`, and `logs/paperclip-tunnel.log`.
2. Verify the OneDrive master vault path is reachable: `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env`.
3. Verify `gh auth status` returns a logged-in user.
4. Verify `cloudflared` path in `launch-paperclip-hq.ps1` matches the installed binary.
5. If Supabase writes fail, check `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in the vault.

---

## Node: T5500 Date App

The T5500 node runs the Cloudflare Pages / Wrangler date app and is **not** part of this Sabretooth Paperclip watchdog. T5500 should have its own startup/watchdog for Wrangler/pages dev if required. The Supabase brain is shared, so Paperclip state persists across both nodes.
