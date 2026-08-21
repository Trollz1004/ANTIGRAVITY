# NODE.md - Node 9020

- Node id: 9020
- Hostname: i7k32GB1050ti
- Human: Josh (joshl)
- Role: Business Exchange + marketing assets + AI-solutions/income-engine
- Repo root: C:/ANTIGRAVITY/nodes/9020

## Ports and services

| Port  | Service                        | Bind            | Status |
|-------|--------------------------------|-----------------|--------|
| 3050  | business-exchange Next.js dev  | -               | DOWN |
| 11434 | Ollama                         | all interfaces  | up |
| 18789 | OpenClaw gateway               | loopback        | up (first-run never finished) |
| 3100  | Paperclip                      | -               | configured, NOT running |
| 3140  | node-agent (Mission Control tie-in) | 0.0.0.0    | up |
| 20128 | omni-router                    | loopback        | up |

## Platforms on this node

- Claude Code: active
- OpenCode: installed, empty config
- OpenClaw: gateway up, first-run never finished
- Hermes: quarantined/disabled
- Paperclip: installed, not running

## CEO agent: Ornith (CONFIRMED)

Confirmed by Josh 2026-08-21 (relayed via Gemini directive). Ornith = local ~5GB 9B Ollama model, chosen for built-in memory aspects. Not instantiated yet.

## Confirmed architecture (2026-08-21 directive)

- CEO: Ornith (local Ollama 9B).
- Harnesses: OpenClaw, OpenCode, Hermes — **zero push authority to git remotes**.
- Judges: official CLI/browser instances of Gemini, Claude, Codex, Copilot, Grok.
- Human gate: Josh approves all outbound posts before publishing.
- Service: Paperclip on http://localhost:3100 for local task routing.

## Current status (2026-08-21)

NOT marketing anything yet. Active work: the date app (YouAndINotAI, `apps/youandinotai-frontend` in the antigravity repo) and Mission Control (`apps/mission-control`). The marketing pipeline below is architecture for later. Drift-risk controls (shared skills, substrate docs, pinned models on a separate omni-route) apply NOW, during dev.

## Content scope (hard rules)

- Node 9020 is strictly a marketing and content engine. It does NOT handle payments, wallets, or treasury routing.
- No internal tax, deduction, or revenue-split mechanics in any agent prompt, memory, or copy. It must never leak into marketing output.
- All campaigns are 100% product marketing — features, value, user experience:
  - **YouAndINotAI**: human verification, anti-bot matching, community boards, local volunteer meetups.
  - **Dream Online**: persistent-memory AI NPCs, kid-safe environments, free-to-play with cosmetic/convenience options.
  - **Business Exchange & AI Solutions**: direct utility and software tools.
- Zero charity buzzwords, zero solicitation language (FL §496.405 compliance).

## Hard rule: human approval for marketing content

Every piece of marketing content requires explicit human (Josh) approval before posting. No agent posts autonomously. Josh is the judge of marketing content.

## Guardrail: business-exchange unversioned source

business-exchange source (C:/Users/joshl/business-exchange and C:/node-workloads/9020/business-exchange) is UNVERSIONED source code. Never delete, never "clean up" duplicates. Run git init before touching it.

## Secrets

Never write any secret, token, password, or key into any file in this repo. Reference secrets by name + location only.
