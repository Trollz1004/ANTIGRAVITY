# SOL.md

v1.0.0 — 2026-07-07 — Architecture truth. Josh's word from 2026-07-07 overrides all older docs.

## Topology

- Sabretooth `192.168.0.8` is DREAM ONLINE MMORPG only. The lowercase `antigravity` checkout exists only on Sabretooth.
- T5500 `192.168.0.15` carries ANTIGRAVITY at `C:\ANTIGRAVITY`. It hosts the Hermes third-party open-source workspace on `:3000`, driven by the official Hermes web GUI on `:9119`. Ollama runs at `192.168.0.15:11434`. T5500 is a Desktop Commander node.
- 9020 `192.168.0.5` carries ANTIGRAVITY. It is not retired.

## Services

| Service | Port / Endpoint | Role |
| --- | --- | --- |
| Hermes Workspace | `:3000` | Third-party open-source Hermes command center GUI on T5500. |
| Official Hermes Web GUI | `:9119` | Official Hermes runtime/dashboard backing the workspace. |
| Ollama | `192.168.0.15:11434` | Local model runtime on T5500. |
| PaperclipAI | `:3110` | One human-facing mission-control entrypoint. Not retired. |
| Agent Hub | `:3130` | Dispatcher and leads CRM in `services/agent-hub`; Express; `api_key` header; fail-closed. |
| Paperweight | `:4200` | Optional fallback. |
| fcc-claude | `:8082` | Free executor proxy. |
| ClawX / OpenClaw | `:18789` | Capable GUI/operator lane. May handle WhatsApp allowlist support when assigned, but is not limited to support. |
| supportclaw container | `:18895` | Support container. |
| Supabase | `jmvgdqomvnkfgknmgwxp` | Uses pooler `aws-1-us-east-2.pooler.supabase.com:5432`, `sslmode=require`, role `agent_hub_svc`; never master password; credentials from env only. |

## Products

One LLC owns these product surfaces:

- `youandinotai.com` — Square only.
- `onlinerecycle.org`.
- `ai-solutions.store`.
- DREAM ONLINE.
