# ROSTER — All Agent Hires

> Updated 2026-07-03. Self-improving doctrine: every agent reads STATE.md on
> start, writes on exit. 4k max. Failure = removal.

## Node Assignment

- **9020** (:3120): Business projects — DateApp, eBay, AI-Solutions+BizExchange
- **Sabretooth** (:3110): Dream Online ONLY — game agents + GPU inference
- **T5500**: Gateway only — no agents

## Provider Distribution (concurrent limits)

| Provider | Limit | Assigned Agents |
|---|---|---|
| FCC/Claude (claude_local) | 1 | ceo |
| Codex Desktop (codex_local) | 1 | ant-dev |
| Grok CLI (opencode_local/xai) | 1 | ant-reviewer |
| Gemini CLI (opencode_local/google) | 1 | ant-compliance |
| Ollama local slot 1 | 1/3 | ant-devops |
| Ollama local slot 2 | 1/3 | ant-support |
| Ollama local slot 3 | 1/3 | ant-growth |
| OpenRouter (hermes-router) | 1 | ebay-lister |
| Hermes router | 1 | aisol-dev |

## Project ANT-DATEAPP (9020 :3120 — deploys to T5500 via wrangler)

| Agent | Provider | Model | Skill | Ships |
|---|---|---|---|---|
| ceo | FCC/claude_local | claude-sonnet-4-5 | agency-chief-of-staff | project mgmt, escalation |
| ant-dev | Codex/codex_local | codex-mini-5.3 | agency-senior-developer | backend/frontend, Square checkout |
| ant-reviewer | Grok/opencode_local | grok-3-mini | agency-code-reviewer | PR review before push |
| ant-devops | Ollama/opencode_local | gemma4:latest | agency-devops-automator | wrangler deploy to T5500, CI |
| ant-compliance | Gemini/opencode_local | gemini-2.5-pro | agency-legal-compliance-checker | banned-term scans |
| ant-support | Ollama/opencode_local | qwen2.5-coder:7b | agency-support-responder | customer tickets (OpenClaw) |
| ant-growth | Ollama/opencode_local | qwen3.5:latest | agency-growth-hacker | founding-member onboarding |

## Project ANT-EBAY (9020 :3120)

| Agent | Provider | Model | Skill | Ships |
|---|---|---|---|---|
| ebay-lister | OpenRouter/hermes | hermes-3-405b | agency-cross-border-e-commerce-specialist | listing sync, pricing |

## Project ANT-AISOLUTIONS (9020 :3120 — ai-solutions.store + business exchange)

| Agent | Provider | Model | Skill | Ships |
|---|---|---|---|---|
| aisol-dev | Hermes/hermes-router | hermes | agency-backend-architect | API, storefront |

## Project DREAM (Sabretooth :3110 — Hermes World :9119 third-party browser MMO, GPU inference)

| Agent | Provider | Model | Skill | Ships |
|---|---|---|---|---|
| dream-ceo | FCC/claude_local | claude-sonnet-4-5 | agency-chief-of-staff | Dream project mgmt |
| dream-design | Hermes/hermes-router | hermes | agency-game-designer | core loop, economy |
| dream-narrative | Ollama/opencode_local | gemma4:latest | agency-narrative-designer | world bible, NPCs |
| dream-mcp | FCC/claude_local | claude-sonnet-4-5 | agency-mcp-builder | live-NPC bridge |
| dream-proto | Grok/opencode_local | grok-3-mini | agency-rapid-prototyper | playable slices |

### Unfilled (pending engine decision)

| Agent | Skill | Blocked on |
|---|---|---|
| dream-level | agency-level-designer | engine pick |
| dream-tech-art | agency-technical-artist | engine pick |
| dream-audio | agency-game-audio-engineer | engine pick |
