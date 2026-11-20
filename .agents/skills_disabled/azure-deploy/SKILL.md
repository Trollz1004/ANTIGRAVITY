---
name: azure-deploy
description: 'Deploy already-prepared applications to Azure by running azd up, azd deploy, or infrastructure provisioning commands. Supports Bicep and Terraform projects. WHEN: "run azd up", "run azd deploy", "execute deployment", "provision infrastructure", "push to production", "push to cloud", "go live", "ship it", "bicep deploy", "terraform apply", "publish to Azure", "launch on Azure".'
---

# Azure Deploy

> **AUTHORITATIVE GUIDANCE — MANDATORY COMPLIANCE**
>
> **PREREQUISITE**: The **azure-validate** skill **MUST** be invoked and completed with status `Validated` BEFORE executing this skill.

> **⛔ STOP — PREREQUISITE CHECK REQUIRED**
> Before proceeding, verify BOTH prerequisites are met:
>
> 1. **azure-prepare** was invoked and completed → `.azure/plan.md` exists
> 2. **azure-validate** was invoked and passed → plan status = `Validated`
>
> If EITHER is missing, **STOP IMMEDIATELY**:
>
> - No plan? → Invoke **azure-prepare** skill first
> - Status not `Validated`? → Invoke **azure-validate** skill first
>
> **⛔ DO NOT MANUALLY UPDATE THE PLAN STATUS**
>
> You are **FORBIDDEN** from changing the plan status to `Validated` yourself. Only the **azure-validate** skill is authorized to set this status after running actual validation checks. If you update the status without running validation, deployments will fail.
>
> **DO NOT ASSUME** the app is ready. **DO NOT SKIP** validation to save time. Skipping steps causes deployment failures. The complete workflow ensures success:
>
> `azure-prepare` → `azure-validate` → `azure-deploy`

## Triggers

Activate this skill when user wants to:

- Deploy their application to Azure
- Publish, host, or launch their app
- Push updates to existing deployment
- Run `azd up` or `az deployment`
- Ship code to production
- Deploy Azure Functions to the cloud
- Deploy an application that already includes API Management (APIM) gateway infrastructure

> **APIM / AI Gateway**: Use this skill to deploy applications whose APIM/AI gateway infrastructure was already created during **azure-prepare**. For creating or changing APIM resources, see [APIM deployment guide](https://learn.microsoft.com/azure/api-management/get-started-create-service-instance). For AI governance policies, invoke **azure-aigateway** skill.

## Rules

1. Run after azure-prepare and azure-validate
2. `.azure/plan.md` must exist with status `Validated`
3. **Pre-deploy checklist required** — [Pre-Deploy Checklist](references/pre-deploy-checklist.md)
4. ⛔ **Destructive actions require `ask_user`** — [global-rules](references/global-rules.md)

---

## Steps

| #   | Action                                                                                                            | Reference                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | **Check Plan** — Read `.azure/plan.md`, verify status = `Validated` AND **Validation Proof** section is populated | `.azure/plan.md`                                           |
| 2   | **Pre-Deploy Checklist** — MUST complete ALL steps                                                                | [Pre-Deploy Checklist](references/pre-deploy-checklist.md) |
| 3   | **Load Recipe** — Based on `recipe.type` in `.azure/plan.md`                                                      | [recipes/README.md](references/recipes/README.md)          |
| 4   | **Execute Deploy** — Follow recipe steps                                                                          | Recipe README                                              |
| 5   | **Handle Errors** — See recipe's `errors.md`                                                                      | —                                                          |
| 6   | **Verify Success** — Confirm deployment completed and endpoints are accessible                                    | —                                                          |

> **⛔ VALIDATION PROOF CHECK**
>
> When checking the plan, verify the **Validation Proof** section (Section 7) contains actual validation results with commands run and timestamps. If this section is empty, validation was bypassed — invoke **azure-validate** skill first.

## SDK Quick References

- **Azure Developer CLI**: [azd](references/sdk/azd-deployment.md)
- **Azure Identity**: [Python](references/sdk/azure-identity-py.md) | [.NET](references/sdk/azure-identity-dotnet.md) | [TypeScript](references/sdk/azure-identity-ts.md) | [Java](references/sdk/azure-identity-java.md)

## MCP Tools

| Tool                              | Purpose                              |
| --------------------------------- | ------------------------------------ |
| `mcp_azure_mcp_subscription_list` | List available subscriptions         |
| `mcp_azure_mcp_group_list`        | List resource groups in subscription |
| `mcp_azure_mcp_azd`               | Execute AZD commands                 |

## References

- [Troubleshooting](references/troubleshooting.md) - Common issues and solutions

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
<!-- TROLLZ1004-SPINE:END -->
