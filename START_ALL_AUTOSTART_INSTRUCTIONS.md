# Power-Loss / Reboot Auto-Start — Setup Instructions

## 1. Windows Startup (GUI launcher)

1. Press `Win + R`, type `shell:startup`, hit Enter
2. Confirm `ANTIGRAVITY-SERVICES-AUTOSTART.cmd` is present
3. Use `C:\Antigravity\START-ALL.bat` manually when you want the cockpit windows/browser tabs opened

Now every Windows login runs:
- WSL services (Paperclip, Ollama, FCC, Hermes Router, Hermes Gateway, Hermes Dashboard, OpenCode server)
- Does not steal focus or open chat windows during boot
- `START-ALL.bat` opens Paperclip, FCC Admin, Hermes Dashboard, Hermes Desktop, and OpenCode when needed

## 1b. CLI Trio - interactive Claude tabs (added 2026-06-24)

On login, after the background services come up, Sabretooth auto-opens 3 Windows
Terminal tabs - one per Claude lane - so the Opus cofounder is resumed and the
two OPUSnot workers are warm for Paperclip orchestration.

| Tab | Color | Runs | Banner identity |
|-----|-------|------|-----------------|
| **OPUS-REAL** | green | `claude --continue`, no `ANTHROPIC_BASE_URL` -> Pro OAuth | "Claude Pro" + Opus - the real cofounder |
| **FCC** | orange | `claude` via fcc proxy `:8082` | API usage billing + Opus variant |
| **OLLAMA** | purple | `claude --model ollama/minimax-m2.5:cloud` via `:8082` | model name (minimax3), not opus |

Only **OPUS-REAL** shows "Claude Pro" - that's how you tell the cofounder from
an OPUSnot at a glance. Each tab falls back to a shell if `claude` exits, so a
tab never dies silently.

The FCC and Ollama tabs do not read `.fcc/.env`; they point Claude Code at the
already-running FCC proxy on `:8082`. Restart `fcc-server.service` after env
changes so the server process, not the tabs, picks up routing updates.

Files:
- `scripts/cli-opus-real.sh`, `scripts/cli-fcc.sh`, `scripts/cli-ollama.sh` - per-tab logic
- `scripts/start-cli-trio.cmd` - manual launcher (double-click to test; skips if all three lanes are already alive)
- `shell:startup\ANTIGRAVITY-CLI-TRIO-AUTOSTART.cmd` - boot entry (waits for `:8082`, then launches)

Switch the Ollama brain by editing `OLLAMA_MODEL` in `scripts/cli-ollama.sh`
(`ollama/minimax-m2.5:cloud` cloud, or `ollama/gemma4:latest` local/free).

## 2. Linux systemd (already configured)

These auto-start on boot via systemd user services:

| Service | File |
|---------|------|
| `fcc-server.service` | `~/.config/systemd/user/fcc-server.service` |
| `paperclip.service` | `~/.config/systemd/user/paperclip.service` |
| `hermes-gateway.service` | `~/.config/systemd/user/hermes-gateway.service` |
| `hermes-router.service` | `~/.config/systemd/user/hermes-router.service` |
| `hermes-dashboard.service` | `~/.config/systemd/user/hermes-dashboard.service` |
| `opencode-server.service` | `~/.config/systemd/user/opencode-server.service` |

Check status: `systemctl --user list-units | grep -E "fcc|hermes"`
