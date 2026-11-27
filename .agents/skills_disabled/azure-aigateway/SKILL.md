---
name: azure-aigateway
description: 'Configure Azure API Management as an AI Gateway for AI models, MCP tools, and agents. USE FOR: semantic caching, token limit, content safety, load balancing, AI model governance, MCP rate limiting, jailbreak detection, add Azure OpenAI backend, add AI Foundry model, test AI gateway, LLM policies, configure AI backend, token metrics, AI cost control, convert API to MCP, import OpenAPI to gateway. DO NOT USE FOR: deploying APIM (use azure-prepare), general API policies (use azure-deploy), creating new APIM instance (use azure-prepare).'
metadata:
  author: microsoft
  version: '3.0'
compatibility: Requires Azure CLI (az) for configuration and testing
---

# Azure AI Gateway

Configure Azure API Management (APIM) as an AI Gateway for governing AI models, MCP tools, and agents.

> **To deploy APIM**, use the **azure-prepare** skill. See [APIM deployment guide](https://learn.microsoft.com/azure/api-management/get-started-create-service-instance).

## When to Use This Skill

| Category             | Triggers                                                                        |
| -------------------- | ------------------------------------------------------------------------------- |
| **Model Governance** | "semantic caching", "token limits", "load balance AI", "track token usage"      |
| **Tool Governance**  | "rate limit MCP", "protect my tools", "configure my tool", "convert API to MCP" |
| **Agent Governance** | "content safety", "jailbreak detection", "filter harmful content"               |
| **Configuration**    | "add Azure OpenAI backend", "configure my model", "add AI Foundry model"        |
| **Testing**          | "test AI gateway", "call OpenAI through gateway"                                |

---

## Quick Reference

| Policy                                     | Purpose             | Details                                                       |
| ------------------------------------------ | ------------------- | ------------------------------------------------------------- |
| `azure-openai-token-limit`                 | Cost control        | [Model Policies](references/policies.md#token-rate-limiting)  |
| `azure-openai-semantic-cache-lookup/store` | 60-80% cost savings | [Model Policies](references/policies.md#semantic-caching)     |
| `azure-openai-emit-token-metric`           | Observability       | [Model Policies](references/policies.md#token-metrics)        |
| `llm-content-safety`                       | Safety & compliance | [Agent Policies](references/policies.md#content-safety)       |
| `rate-limit-by-key`                        | MCP/tool protection | [Tool Policies](references/policies.md#request-rate-limiting) |

---

## Get Gateway Details

```bash
# Get gateway URL
az apim show --name <apim-name> --resource-group <rg> --query "gatewayUrl" -o tsv

# List backends (AI models)
az apim backend list --service-name <apim-name> --resource-group <rg> \
  --query "[].{id:name, url:url}" -o table

# Get subscription key
az apim subscription keys list \
  --service-name <apim-name> --resource-group <rg> --subscription-id <sub-id>
```

---

## Test AI Endpoint

```bash
GATEWAY_URL=$(az apim show --name <apim-name> --resource-group <rg> --query "gatewayUrl" -o tsv)

curl -X POST "${GATEWAY_URL}/openai/deployments/<deployment>/chat/completions?api-version=2024-02-01" \
  -H "Content-Type: application/json" \
  -H "Ocp-Apim-Subscription-Key: <key>" \
  -d '{"messages": [{"role": "user", "content": "Hello"}], "max_tokens": 100}'
```

---

## Common Tasks

### Add AI Backend

See [references/patterns.md](references/patterns.md#pattern-1-add-ai-model-backend) for full steps.

```bash
# Discover AI resources
az cognitiveservices account list --query "[?kind=='OpenAI']" -o table

# Create backend
az apim backend create --service-name <apim> --resource-group <rg> \
  --backend-id openai-backend --protocol http --url "https://<aoai>.openai.azure.com/openai"

# Grant access (managed identity)
az role assignment create --assignee <apim-principal-id> \
  --role "Cognitive Services User" --scope <aoai-resource-id>
```

### Apply AI Governance Policy

Recommended policy order in `<inbound>`:

1. **Authentication** - Managed identity to backend
2. **Semantic Cache Lookup** - Check cache before calling AI
3. **Token Limits** - Cost control
4. **Content Safety** - Filter harmful content
5. **Backend Selection** - Load balancing
6. **Metrics** - Token usage tracking

See [references/policies.md](references/policies.md#combining-policies) for complete example.

---

## Troubleshooting

| Issue                   | Solution                                           |
| ----------------------- | -------------------------------------------------- |
| Token limit 429         | Increase `tokens-per-minute` or add load balancing |
| No cache hits           | Lower `score-threshold` to 0.7                     |
| Content false positives | Increase category thresholds (5-6)                 |
| Backend auth 401        | Grant APIM "Cognitive Services User" role          |

See [references/troubleshooting.md](references/troubleshooting.md) for details.

---

## References

- [**Detailed Policies**](references/policies.md) - Full policy examples
- [**Configuration Patterns**](references/patterns.md) - Step-by-step patterns
- [**Troubleshooting**](references/troubleshooting.md) - Common issues
- [AI-Gateway Samples](https://github.com/Azure-Samples/AI-Gateway)
- [GenAI Gateway Docs](https://learn.microsoft.com/azure/api-management/genai-gateway-capabilities)

## SDK Quick References

- **Content Safety**: [Python](references/sdk/azure-ai-contentsafety-py.md) | [TypeScript](references/sdk/azure-ai-contentsafety-ts.md)
- **API Management**: [Python](references/sdk/azure-mgmt-apimanagement-py.md) | [.NET](references/sdk/azure-mgmt-apimanagement-dotnet.md)

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
