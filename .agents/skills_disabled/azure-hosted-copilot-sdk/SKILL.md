---
name: azure-hosted-copilot-sdk
description: 'Build and deploy GitHub Copilot SDK apps to Azure. USE FOR: build copilot app, create copilot app, copilot SDK, @github/copilot-sdk, scaffold copilot project, copilot-powered app, deploy copilot app, host on azure, azure model, BYOM, bring your own model, use my own model, azure openai model, DefaultAzureCredential, self-hosted model, copilot SDK service, chat app with copilot, copilot-sdk-service template, azd init copilot, CopilotClient, createSession, sendAndWait, GitHub Models API. DO NOT USE FOR: using Copilot (not building with it), Copilot Extensions, Azure Functions without Copilot, general web apps without copilot SDK, Foundry agent hosting (use microsoft-foundry skill), agent evaluation (use microsoft-foundry skill).'
---

# GitHub Copilot SDK on Azure

## Step 1: Route

| User wants                           | Action                                                      |
| ------------------------------------ | ----------------------------------------------------------- |
| Build new (empty project)            | Step 2A (scaffold)                                          |
| Add new SDK service to existing repo | Step 2B (scaffold alongside)                                |
| Deploy existing SDK app to Azure     | Step 2C (add infra to existing SDK app)                     |
| Add SDK to existing app code         | [Integrate SDK](references/existing-project-integration.md) |
| Use Azure/own model                  | Step 3 (BYOM config)                                        |

## Step 2A: Scaffold New (Greenfield)

`azd init --template azure-samples/copilot-sdk-service`

Template includes API (Express/TS) + Web UI (React/Vite) + infra (Bicep) + Dockerfiles + token scripts — do NOT recreate. See [SDK ref](references/copilot-sdk.md).

## Step 2B: Add SDK Service to Existing Repo

User has existing code and wants a new Copilot SDK service alongside it. Scaffold template to a temp dir, copy the API service + infra into the user's repo, adapt `azure.yaml` to include both existing and new services. See [deploy existing ref](references/deploy-existing.md).

## Step 2C: Deploy Existing SDK App

User already has a working Copilot SDK app and needs Azure infra. See [deploy existing ref](references/deploy-existing.md).

## Step 3: Model Configuration

Three model paths (layers on top of 2A/2B):

| Path                | Config                                                               |
| ------------------- | -------------------------------------------------------------------- |
| **GitHub default**  | No `model` param — SDK picks default                                 |
| **GitHub specific** | `model: "<name>"` — use `listModels()` to discover                   |
| **Azure BYOM**      | `model` + `provider` with `bearerToken` via `DefaultAzureCredential` |

See [model config ref](references/azure-model-config.md).

## Step 4: Deploy

Invoke **azure-prepare** (skip its Step 0 routing — scaffolding is done) → **azure-validate** → **azure-deploy** in order.

## Rules

- Read `AGENTS.md` in user's repo before changes
- Docker required (`docker info`)

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
- `First read: the house index, https://github.com/Trollz1004/dream-online/blob/main/docs/house/INDEX.md, then the newest rulings in the claude.ai project Ai-Dream-Team as the index describes.`
- `Funding comes first and game work is paused (ruled 2026-11-13).`
- `The wheel: tickets in the .fable-kitchen inbox on the Alienware; runner ops/router/inbox-runner.ts in dream-online; lane rules in orders/RULES.md in the kitchen.`
- `Merging (ruled 2026-11-16): nothing merges with a failing required check; platform and marketing changes need the checks plus one trusted review; game and engine work keeps two offerings and two judges; whoever merges looks at the files and leaves a one-line verdict.`
- `Public text passes the go gate: the product does what the text says, stop-slop plus a humanizer pass, only what is true, every outside fact links the exact page.`
- `Marketing team log: https://github.com/Trollz1004/ANTIGRAVITY/tree/main/marketing/team (public; nothing private goes in).`
<!-- TROLLZ1004-SPINE:END -->
