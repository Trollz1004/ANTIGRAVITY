# Power-Loss / Reboot Auto-Start — Setup Instructions

## 1. Windows Startup (GUI launcher)

1. Press `Win + R`, type `shell:startup`, hit Enter
2. Confirm `ANTIGRAVITY-SERVICES-AUTOSTART.cmd` is present
3. Use `C:\Antigravity\START-ALL.bat` manually when you want the cockpit windows/browser tabs opened

Now every Windows login runs:
- WSL services (Paperclip, Ollama, FCC, Hermes Router, Hermes Gateway, Hermes Dashboard, OpenCode server)
- Does not steal focus or open chat windows during boot
- `START-ALL.bat` opens Paperclip, FCC Admin, Hermes Dashboard, Hermes Desktop, and OpenCode when needed

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
