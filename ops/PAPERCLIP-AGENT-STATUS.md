# Paperclip agent status — clean repo

Updated: 2026-07-21

## Instance

- Public URL: https://paperclip-clean.youandinotai.com
- Health: `/api/health` returns `status: ok`
- Company: `Trollz1004/clean repo`
- Company ID: `c0e28d64-40f6-497f-bbbe-ec287a7012cc`
- Repo: https://github.com/Trollz1004/clean
- Branch policy: `main` only

## Agents

- Existing CEO agent: `CEO`
- Joined OpenClaw gateway agent: `Hermes CEO - clean repo OpenClaw Gateway`
- Agent ID: `b32e2e0b-db31-43d0-8a2f-49f1c53c4ac5`
- Adapter: `openclaw_gateway`
- Status observed: misconfigured after run failure
- Reports to: CEO agent

## Working OpenCode adapters

These live Paperclip agents are aligned to T5500-local OmniRoute. They are local-only; no Claude, OpenAI, Ollama Cloud, or OpenRouter fallback should be configured.

| Agent | Adapter | Model | Base URL |
|---|---|---|---|
| `CEO OmniRoute Local Models via OpenCode` | `opencode_local` | `auto/best-coding` | `http://192.168.0.15:20128/api/v1` |
| `Founding Engineer` | `opencode_local` | `auto/best-coding` | `http://192.168.0.15:20128/api/v1` |
| `OpenCode Self-Hosted Models` | `opencode_local` | `auto/best-coding` | `http://192.168.0.15:20128/api/v1` |
| `Hermes Local CEO Adapter` | `opencode_local` | `auto/best-coding` | `http://192.168.0.15:20128/api/v1` |
| `CEO` | `opencode_local` | `auto/best-coding` | `http://192.168.0.15:20128/api/v1` |

Target model is the verified OmniRoute alias `auto/best-coding`. Do not default Paperclip agents to unverified `ornith` or direct vendor model IDs.

## Broken or pending adapters

| Agent | Adapter | Current state | Required fix |
|---|---|---|---|
| `Hermes CEO - clean repo OpenClaw Gateway` | `openclaw_gateway` | `error` | OpenClaw gateway must accept Paperclip payload schema on `18789` |
| `Hermes Local CEO Adapter` | `opencode_local` | prior `error` state | Successful wake after OmniRoute/Ollama local model is healthy |
| `CEO` | `opencode_local` | prior `error` state | Successful wake after OmniRoute/Ollama local model is healthy |

Attempted to pause the broken adapters via the available agent API key; Paperclip returned `403 Forbidden`. A board/admin user must pause or edit those records in the UI if they should stop waking.

## T5500 adapter rule

- Hermes dashboard owns port `9119` and must not be used by OpenClaw.
- OpenClaw gateway belongs on port `18789`.
- Paperclip agent adapter config must point to the OpenClaw gateway on `18789`, not Hermes dashboard on `9119`.
- Current failure observed in Paperclip run output: `invalid agent params: at root: unexpected property 'paperclip'`.
- Fix requires editing or recreating the Paperclip OpenClaw gateway agent with the correct adapter params schema.

## Join request

- Request ID: `452b22ec-4e5a-42a6-b89f-2bd62b6ab1cc`
- Status: `approved`
- Approved by: `local-board`
- API key claim: completed

## Local files

- Join response (contains claim secret; local only): `%USERPROFILE%\.openclaw\workspace\paperclip-join-request-clean.json`
- Claimed Paperclip API key (secret; local only): `%USERPROFILE%\.openclaw\workspace\paperclip-claimed-api-key.json`
- Installed OpenClaw skill: `%USERPROFILE%\.openclaw\skills\paperclip\SKILL.md`

Do not commit the local key files.
