---
name: azure-messaging
description: 'Troubleshoot and resolve issues with Azure Messaging SDKs for Event Hubs and Service Bus. Covers connection failures, authentication errors, message processing issues, and SDK configuration problems. USE FOR: event hub SDK error, service bus SDK issue, messaging connection failure, AMQP error, event processor host issue, message lock lost, send timeout, receiver disconnected, SDK troubleshooting, azure messaging SDK, event hub consumer, service bus queue issue, topic subscription error, enable logging event hub, service bus logging, eventhub python, servicebus java, eventhub javascript, servicebus dotnet, event hub checkpoint, event hub not receiving messages, service bus dead letter DO NOT USE FOR: creating Event Hub or Service Bus resources (use azure-prepare), monitoring metrics (use azure-observability), cost analysis (use azure-cost-optimization)'
---

# Azure Messaging SDK Troubleshooting

## Quick Reference

| Property      | Value                                                          |
| ------------- | -------------------------------------------------------------- |
| **Services**  | Azure Event Hubs, Azure Service Bus                            |
| **MCP Tools** | `mcp_azure_mcp_eventhubs`, `mcp_azure_mcp_servicebus`          |
| **Best For**  | Diagnosing SDK connection, auth, and message processing issues |

## When to Use This Skill

- SDK connection failures, auth errors, or AMQP link errors
- Message lock lost, session lock, or send/receive timeouts
- Event processor or message handler stops processing
- SDK configuration questions (retry, prefetch, batch size)

## MCP Tools

| Tool                           | Command           | Use                                             |
| ------------------------------ | ----------------- | ----------------------------------------------- |
| `mcp_azure_mcp_eventhubs`      | Namespace/hub ops | List namespaces, hubs, consumer groups          |
| `mcp_azure_mcp_servicebus`     | Queue/topic ops   | List namespaces, queues, topics, subscriptions  |
| `mcp_azure_mcp_monitor`        | `logs_query`      | Query diagnostic logs with KQL                  |
| `mcp_azure_mcp_resourcehealth` | `get`             | Check service health status                     |
| `mcp_azure_mcp_documentation`  | Doc search        | Search Microsoft Learn for troubleshooting docs |

## Diagnosis Workflow

1. **Identify the SDK and version** — Ask which language SDK and version the user is on
2. **Check resource health** — Use `mcp_azure_mcp_resourcehealth` to verify the namespace is healthy
3. **Review the error message** — Match against language-specific troubleshooting guide
4. **Look up documentation** — Use `mcp_azure_mcp_documentation` to search Microsoft Learn for the error or topic
5. **Check configuration** — Verify connection string, entity name, consumer group
6. **Recommend fix** — Apply remediation, citing documentation found

## Connectivity Troubleshooting

See [Service Troubleshooting Guide](references/service-troubleshooting.md) for ports, WebSocket fallback, IP firewall, private endpoints, and service tags.

## SDK Troubleshooting Guides

- **Event Hubs**: [Python](references/sdk/azure-eventhubs-py.md) | [Java](references/sdk/azure-eventhubs-java.md) | [JS](references/sdk/azure-eventhubs-js.md) | [.NET](references/sdk/azure-eventhubs-dotnet.md)
- **Service Bus**: [Python](references/sdk/azure-servicebus-py.md) | [Java](references/sdk/azure-servicebus-java.md) | [JS](references/sdk/azure-servicebus-js.md) | [.NET](references/sdk/azure-servicebus-dotnet.md)

## References

Use `mcp_azure_mcp_documentation` to search Microsoft Learn for latest guidance. See [Service Troubleshooting Guide](references/service-troubleshooting.md) for network and service-level docs.

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
