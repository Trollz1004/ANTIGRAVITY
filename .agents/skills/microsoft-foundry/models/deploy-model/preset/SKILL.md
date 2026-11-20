---
name: preset
description: 'Intelligently deploys Azure OpenAI models to optimal regions by analyzing capacity across all available regions. Automatically checks current region first and shows alternatives if needed. USE FOR: quick deployment, optimal region, best region, automatic region selection, fast setup, multi-region capacity check, high availability deployment, deploy to best location. DO NOT USE FOR: custom SKU selection (use customize), specific version selection (use customize), custom capacity configuration (use customize), PTU deployments (use customize).'
license: MIT
metadata:
  author: Microsoft
  version: '1.0.1'
---

# Deploy Model to Optimal Region

Automates intelligent Azure OpenAI model deployment by checking capacity across regions and deploying to the best available option.

## What This Skill Does

1. Verifies Azure authentication and project scope
2. Checks capacity in current project's region
3. If no capacity: analyzes all regions and shows available alternatives
4. Filters projects by selected region
5. Supports creating new projects if needed
6. Deploys model with GlobalStandard SKU
7. Monitors deployment progress

## Prerequisites

- Azure CLI installed and configured
- Active Azure subscription with Cognitive Services read/create permissions
- Azure AI Foundry project resource ID (`PROJECT_RESOURCE_ID` env var or provided interactively)
  - Format: `/subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.CognitiveServices/accounts/{account}/projects/{project}`
  - Found in: Azure AI Foundry portal → Project → Overview → Resource ID

## Quick Workflow

### Fast Path (Current Region Has Capacity)

```
1. Check authentication → 2. Get project → 3. Check current region capacity
→ 4. Deploy immediately
```

### Alternative Region Path (No Capacity)

```
1. Check authentication → 2. Get project → 3. Check current region (no capacity)
→ 4. Query all regions → 5. Show alternatives → 6. Select region + project
→ 7. Deploy
```

---

## Deployment Phases

| Phase                      | Action                                                                                  | Key Commands                                                               |
| -------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1. Verify Auth             | Check Azure CLI login and subscription                                                  | `az account show`, `az login`                                              |
| 2. Get Project             | Parse `PROJECT_RESOURCE_ID` ARM ID, verify exists                                       | `az cognitiveservices account show`                                        |
| 3. Get Model               | List available models, user selects model + version                                     | `az cognitiveservices account list-models`                                 |
| 4. Check Current Region    | Query capacity using GlobalStandard SKU                                                 | `az rest --method GET .../modelCapacities`                                 |
| 5. Multi-Region Query      | If no local capacity, query all regions                                                 | Same capacity API without location filter                                  |
| 6. Select Region + Project | User picks region; find or create project                                               | `az cognitiveservices account list`, `az cognitiveservices account create` |
| 7. Deploy                  | Generate unique name, calculate capacity (50% available, min 50 TPM), create deployment | `az cognitiveservices account deployment create`                           |

For detailed step-by-step instructions, see [workflow reference](references/workflow.md).

---

## Error Handling

| Error              | Symptom                         | Resolution                                                                                                                                        |
| ------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth failure       | `az account show` returns error | Run `az login` then `az account set --subscription <id>`                                                                                          |
| No quota           | All regions show 0 capacity     | Defer to the [quota skill](../../../quota/quota.md) for increase requests and troubleshooting; check existing deployments; try alternative models |
| Model not found    | Empty capacity list             | Verify model name with `az cognitiveservices account list-models`; check case sensitivity                                                         |
| Name conflict      | "deployment already exists"     | Append suffix to deployment name (handled automatically by `generate_deployment_name` script)                                                     |
| Region unavailable | Region doesn't support model    | Select a different region from the available list                                                                                                 |
| Permission denied  | "Forbidden" or "Unauthorized"   | Verify Cognitive Services Contributor role: `az role assignment list --assignee <user>`                                                           |

---

## Advanced Usage

```bash
# Custom capacity
az cognitiveservices account deployment create ... --sku-capacity <value>

# Check deployment status
az cognitiveservices account deployment show --name <acct> --resource-group <rg> --deployment-name <name> --query "{Status:properties.provisioningState}"

# Delete deployment
az cognitiveservices account deployment delete --name <acct> --resource-group <rg> --deployment-name <name>
```

## Notes

- **SKU:** GlobalStandard only — **API Version:** 2024-10-01 (GA stable)

---

## Related Skills

- **microsoft-foundry** - Parent skill for Azure AI Foundry operations
- **[quota](../../../quota/quota.md)** — For quota viewing, increase requests, and troubleshooting quota errors, defer to this skill
- **azure-quick-review** - Review Azure resources for compliance
- **azure-cost-estimation** - Estimate costs for Azure deployments
- **azure-validate** - Validate Azure infrastructure before deployment

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
<!-- TROLLZ1004-SPINE:END -->
