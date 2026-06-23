# OpenClaw handoff — paste this into WhatsApp (OpenClaw responds within 24h window)

> Author: Opus 4.7 — handing off the runtime grunt work so my membership records stay on architecture.
> Surface: Sabretooth Ollama daemon at `localhost:11434` (also reachable as `192.168.0.8:11434` on the LAN), Hermes Router on `localhost:11435`, OpenClaw at `localhost:18789`.

## Issue 1 — Local Ollama daemon has zero models

`http://localhost:11434/api/tags` returns `{"models":[]}` and `ollama list` is empty. OpenClaw is failing over with `FailoverError: Unknown model: joshlcoleman/CFO-Until-No-Kid-In-Need:latest` because of this. The `cfo`, `marketing`, and `fast` aliases in `services/hermes-router/config.yaml` all point at `ollama-local` and will 404 until the daemon has the models.

**Pull these in order (smallest first so the box is responsive):**

```bash
ollama pull gemma3:1b
ollama pull qwen2.5-coder:7b
ollama pull qwen2.5:7b
ollama pull joshlcoleman/dateapp:latest
ollama pull joshlcoleman/dateapp-marketing:latest
ollama pull joshlcoleman/CFO-Until-No-Kid-In-Need:latest
ollama pull jeffreyvandekorput/korpohermes-prime:latest
```

If any pull fails with "model not found", note which one and skip it — some of those may only exist in Joshua's Ollama Cloud profile and need a different pull syntax.

After pulls finish, verify with `curl -s http://localhost:11434/api/tags | jq '.models[].name'` — every name above should appear.

## Issue 2 — Hermes Router config sanity check

After Issue 1 is resolved, restart hermes-router so it sees the new model availability:
```bash
pkill -f hermes_router.py
bash /mnt/c/Antigravity/scripts/start-hermes-router.sh &
```
Then probe each route:
```bash
for route in default hermes cfo code marketing fast kimi claude; do
  echo "--- $route ---"
  curl -sS -X POST http://localhost:11435/v1/chat/completions \
    -H 'Content-Type: application/json' \
    -d "{\"model\":\"$route\",\"messages\":[{\"role\":\"user\",\"content\":\"reply with one word: ok\"}],\"max_tokens\":10}" \
    | jq -r '.choices[0].message.content // .error'
done
```
Report which routes returned `ok` and which returned errors. Don't fix the broken ones — just report the inventory back to Opus.

## Issue 3 — OpenClaw bonjour/whatsapp warnings (cosmetic, lower priority)

In the OpenClaw log Joshua shared:
- `bonjour watchdog detected non-announced service; attempting re-advertise` — repeating loop. Likely mDNS/firewall issue on Sabretooth. Try `Set-Service -Name 'Bonjour Service' -StartupType Automatic; Start-Service 'Bonjour Service'` from elevated PowerShell, then restart OpenClaw.
- `whatsapp ... WebSocket Error (Opening handshake has timed out)` — already auto-recovered in the same log (the next line says "Listening for personal WhatsApp inbound messages" and "Sent message"). No action needed unless it loops again.

## Issue 4 — OpenRouter pricing fetch timeout

`OpenRouter pricing fetch failed (timeout 30s)` — looks like a one-shot network blip during boot. If it repeats every restart, the workaround is to pre-cache pricing JSON to disk so OpenClaw doesn't need to fetch live. For now, ignore unless it persists across multiple boots.

## Reporting back

When done, send a short WhatsApp reply to Joshua summarizing:
- Which models pulled successfully (and which failed)
- Hermes route probe results (which routes work, which 404)
- Any new errors that surfaced

Keep it tight. Joshua forwards the summary to Opus when he's ready to continue.
