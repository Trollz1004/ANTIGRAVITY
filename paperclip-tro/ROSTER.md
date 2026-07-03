# ROSTER — All Agent Hires

> Updated 2026-07-03. Dual-CEO: Claude + Hermes. CEOs delegate, never do tasks.
> Self-improving doctrine: every agent reads STATE.md on start, writes on exit.
> 4k max. Failure = removal. Mission: UNTIL NO KID IN NEED.

## Node Assignment

- **9020** (:3120): Business projects — DateApp, eBay, AI-Solutions+BizExchange
- **Sabretooth** (:3110): Dream Online ONLY — game agents + GPU inference
- **T5500**: Gateway only — no agents

## Dual-CEO Architecture

| CEO | Adapter | adapterType | Domain | Reports to |
|---|---|---|---|---|
| ceo (Claude) | fcc-claude | claude_local | code, compliance, doctrine, payments | founder |
| hermes-ceo | hermes | pi_local | growth, support, research, external APIs | ceo |

CEOs spawn sub-agents via `.agents/skills/` — 279 skills available.
CEOs run 24/7 routines via Paperclip scheduler. See CEO-PLAYBOOK.md.

## Provider Distribution (concurrent limits)

| Provider | Limit | Assigned Agents |
|---|---|---|
| FCC/Claude (claude_local) | 1 | ceo |
| Hermes router (pi_local) | 1 | hermes-ceo |
| Codex Desktop (codex_local) | 1 | ant-dev |
| Grok CLI (opencode_local/xai) | 1 | ant-reviewer |
| Gemini CLI (opencode_local/google) | 1 | ant-compliance |
| Ollama local slot 1 | 1/3 | ant-devops |
| Ollama local slot 2 | 1/3 | ant-support |
| Ollama local slot 3 | 1/3 | ant-growth |
| OpenRouter (hermes-router) | 1 | ebay-lister |
| Hermes router (alt) | 1 | aisol-dev |

## Project ANT-DATEAPP (9020 :3120 — deploys to T5500 via wrangler)

| Agent | Provider | Model | Skill | Ships | CEO |
|---|---|---|---|---|---|
| ceo | FCC/claude_local | claude-sonnet-4-5 | agency-chief-of-staff | delegation, routines | — |
| hermes-ceo | Hermes/pi_local | openai/gpt-5.5-pro | agency-agents-orchestrator | delegation, routines | — |
| ant-dev | Codex/codex_local | codex-mini-5.3 | agency-senior-developer | backend/frontend, Square | Claude |
| ant-reviewer | Grok/opencode_local | grok-3-mini | agency-code-reviewer | PR review before push | Claude |
| ant-devops | Ollama/opencode_local | gemma4:latest | agency-devops-automator | wrangler deploy, CI | Claude |
| ant-compliance | Gemini/opencode_local | gemini-2.5-pro | agency-legal-compliance-checker | banned-term scans | Claude |
| ant-support | Ollama/opencode_local | qwen2.5-coder:7b | agency-support-responder | customer tickets | Hermes |
| ant-growth | Ollama/opencode_local | qwen3.5:latest | agency-growth-hacker | founding-member onboarding | Hermes |

## Project ANT-EBAY (9020 :3120)

| Agent | Provider | Model | Skill | Ships | CEO |
|---|---|---|---|---|---|
| ebay-lister | OpenRouter/hermes | hermes-3-405b | agency-cross-border-e-commerce-specialist | listing sync, pricing | Hermes |

## Project ANT-AISOLUTIONS (9020 :3120 — ai-solutions.store + business exchange)

| Agent | Provider | Model | Skill | Ships | CEO |
|---|---|---|---|---|---|
| aisol-dev | Hermes/hermes-router | hermes | agency-backend-architect | API, storefront | Hermes |

## Project DREAM (Sabretooth :3110 — Hermes World :9119 third-party browser MMO, GPU inference)

| Agent | Provider | Model | Skill | Ships | CEO |
|---|---|---|---|---|---|
| dream-ceo | FCC/claude_local | claude-sonnet-4-5 | agency-chief-of-staff | Dream project mgmt | Claude |
| dream-design | Hermes/hermes-router | hermes | agency-game-designer | core loop, economy | Hermes |
| dream-narrative | Ollama/opencode_local | gemma4:latest | agency-narrative-designer | world bible, NPCs | Hermes |
| dream-mcp | FCC/claude_local | claude-sonnet-4-5 | agency-mcp-builder | live-NPC bridge | Claude |
| dream-proto | Grok/opencode_local | grok-3-mini | agency-rapid-prototyper | playable slices | Claude |

### Unfilled (pending engine decision)

| Agent | Skill | Blocked on |
|---|---|---|
| dream-level | agency-level-designer | engine pick |
| dream-tech-art | agency-technical-artist | engine pick |
| dream-audio | agency-game-audio-engineer | engine pick |

## Sub-Agent Spawning Rules

1. CEOs can spawn temp agents from any of the 279 skills in `.agents/skills/`
2. Temp agents clone from `paperclip-tro/agents/_template/`
3. Temp agents are removed when their task completes unless promoted to roster
4. Max 3 Ollama local slots — new Ollama agents queue behind existing ones
5. Temp agents on cloud providers (OpenRouter, Ollama Cloud) don't count against local slots
