# ROSTER — All Agent Hires (Sabretooth :3110 + 9020 :3120)

> Updated 2026-07-03. Self-improving doctrine: every agent reads STATE.md on
> start, writes on exit. 4k max. Failure = removal.

Rule: hire small, fire fast. Every agent ships within its first week or CEO
deletes the seat. All skills in `.agents/skills/<dir>/SKILL.md`.

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

## Project ANT-DATEAPP (youandinotai.com — deploys on T5500 via wrangler)

| Agent | Provider | Model | Skill | Ships |
|---|---|---|---|---|
| ceo | FCC/claude_local | claude-sonnet-4-5 | agency-chief-of-staff | project mgmt, hiring, escalation |
| ant-dev | Codex/codex_local | codex-mini-5.3 | agency-senior-developer | backend/frontend, Square checkout |
| ant-reviewer | Grok/opencode_local | grok-3-mini | agency-code-reviewer | PR review before push |
| ant-devops | Ollama/opencode_local | gemma4:latest | agency-devops-automator | T5500 tunnels, wrangler deploy, CI |
| ant-compliance | Gemini/opencode_local | gemini-2.5-pro | agency-legal-compliance-checker | banned-term scans on public copy |
| ant-support | Ollama/opencode_local | qwen2.5-coder:7b | agency-support-responder | customer tickets (OpenClaw) |
| ant-growth | Ollama/opencode_local | qwen3.5:latest | agency-growth-hacker | founding-member onboarding funnel |

## Project ANT-EBAY (eBay cross-lister — own project)

| Agent | Provider | Model | Skill | Ships |
|---|---|---|---|---|
| ebay-lister | OpenRouter/hermes | hermes-3-405b | agency-cross-border-e-commerce-specialist | listing sync, pricing, inventory |

## Project ANT-AISOLUTIONS (ai-solutions.store + business exchange)

| Agent | Provider | Model | Skill | Ships |
|---|---|---|---|---|
| aisol-dev | Hermes/hermes-router | hermes | agency-backend-architect | API, integrations, storefront |

## Project DREAM (9020 :3120 — MMORPG game creators)

| Agent | Provider | Model | Skill | Ships |
|---|---|---|---|---|
| dream-ceo | FCC/claude_local | claude-sonnet-4-5 | agency-chief-of-staff | project mgmt for DREAM |
| dream-design | Hermes/hermes-router | hermes | agency-game-designer | core loop, economy, pay-for-convenience |
| dream-narrative | Ollama/opencode_local | gemma4:latest | agency-narrative-designer | world bible, NPC personas |
| dream-mcp | FCC/claude_local | claude-sonnet-4-5 | agency-mcp-builder | live-NPC bridge prototype |
| dream-proto | Grok/opencode_local | grok-3-mini | agency-rapid-prototyper | playable slice prototypes |

### Unfilled (pending engine decision)

| Agent | Skill | Blocked on |
|---|---|---|
| dream-level | agency-level-designer | engine pick |
| dream-tech-art | agency-technical-artist | engine pick |
| dream-audio | agency-game-audio-engineer | engine pick |
