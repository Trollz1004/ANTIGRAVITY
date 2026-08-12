# NODES — clean repo

CEO agent reference. Read only when a task touches infra. Confirm before you trust — 2026-07-21 notes flag some of this unverified.

## Sabretooth — 192.168.0.8

- NIC: Intel 82579V Gigabit, MAC `54-04-A6-28-BB-4E`, link 1000/1000
- GPU dead: GTX 1070 (Pascal) + driver 560.94 can't run Ollama 0.31.2 CUDA kernels. Forced `OLLAMA_LLM_LIBRARY=cpu`. Fix = driver 580+, then drop that env line.
- May host OmniRoute gate (:20128) — **UNCONFIRMED**, launcher `C:\antigravity\scripts\bootstrap\Start-OmniRoute.cmd`. Laptop also claims this role. Verify with Josh before assuming either.
- **Confirmed 2026-07-22 (Josh): NOT where Paperclip/Hermes runs.** CEO agent's "Hermes Agent (local)" adapter targets T5500, not here. OmniRoute gate host (:20128) is still a separate open question — see Laptop below.
- Ollama port 11434 local.

## T5500 — 192.168.0.15 (`DESKTOP-H4B53GL`)

- Runs the **live** Paperclip clean instance: local API `http://127.0.0.1:3120`, public via Cloudflare tunnel `hermes-t5500` → https://paperclip.youandinotai.com (alias https://paperclip-clean.youandinotai.com).
- Repo bound: `E:\clean` (Trollz1004/clean, `main` only).
- Health: `curl -sS https://paperclip.youandinotai.com/api/health` → expect `"status":"ok"`.
- **Confirmed 2026-07-22 (Josh): this is where Paperclip / Hermes runs.** CEO agent's "Hermes Agent (local)" adapter targets this node. This is also the node that created the Trollz1004/clean repo (2026-07-21 report).
- **Priority node for the Ornith install runbook** — the live CEO agent's HTTP 404 "model 'ornith' not found" failure traces here. Pull `ornith:9b` on T5500 first; see `ORNITH-INSTALL.md`.
- Ollama port 11434 local.

## 9020 — 192.168.0.5

- Minimal notes on file. Treat as unconfirmed role until Josh specifies — do not assume it runs Paperclip or the gate.
- Ollama port 11434 local, assume until checked.

## Laptop — 192.168.0.13

- **Confirmed 2026-07-22 (Josh): browser/control seat only.** Does NOT run its own live Paperclip instance — supersedes `ops/PAPERCLIP-LAPTOP.md`'s setup instructions, which describe a local Paperclip bind that isn't the live one in practice. Paperclip itself lives on T5500 (see above).
- This is the node this Cowork session bridges to (device `laptop-cqunbkl9`) and where the connected Chrome browser lives — used to drive the live dashboard at the canonical URL below.
- May still host the OmniRoute gate (:20128) via `C:\antigravity\scripts\bootstrap\Start-OmniRoute.cmd` — **UNCONFIRMED**, separate question from Paperclip/Hermes above.
- Session sees the repo at `C:\clean` — cross-check against `E:\clean` used in Paperclip configs elsewhere. Same repo, confirm drive letter isn't drifted.
- Ollama port 11434 local.

## Canonical URLs / ports (confirmed 2026-07-22, Josh)

- Dashboard: `https://paperclip-clean.youandinotai.com` — this is the one to use, not any alternate alias.
- T5500 Paperclip origin: port `3120` (matches table below).
- Hermes GUI: port `9119`.
- OpenClaw gateway: port `18789` — **not** `9119` (that's Hermes GUI's port; don't cross them). Note from Josh: "setup from opencode" — unclear context, flagged here rather than guessed at.

## Shared reference (all nodes)

| Service                  | Port  | Health                                                                        |
| ------------------------ | ----- | ----------------------------------------------------------------------------- |
| Ollama                   | 11434 | `/api/tags`                                                                   |
| OmniRoute (THE GATE)     | 20128 | `/api/v1/models`                                                              |
| FCC-Server               | 8082  | `/health`                                                                     |
| Agent Hub                | 3130  | `/health`                                                                     |
| Mission Control          | 3110  | `/health`                                                                     |
| Mission Control v5       | 3151  | `/api/health`                                                                 |
| Paperclip (clean, T5500) | 3120  | `/api/health`                                                                 |
| Hermes GUI               | 9119  | —                                                                             |
| OpenClaw (ClawX)         | 18789 | `/`                                                                           |
| Hermes Router            | 11435 | disabled by sentinel `~\.openclaw\workspace\DISABLE_SABRETOOTH_HERMES_ROUTER` |

DNS: 192.168.0.1, 205.171.2.26.

## Rules for CEO agent using these nodes

1. Never talk to a model provider directly. Only through OmniRoute (:20128). See `SOUL.md`.
2. Never treat "may host" / "UNCONFIRMED" lines as fact. Ask Josh once, then wait — don't guess and act.
3. This harness has no remote-exec path to Sabretooth/T5500/9020 from a Cowork cloud session. Node work on those three needs a human or an agent already running on that box.
4. Log any node-status change you confirm into `STATE.md`, not into this file — this file is the stable reference, `STATE.md` is the session diary.
