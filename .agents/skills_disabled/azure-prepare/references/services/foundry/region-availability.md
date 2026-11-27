# Foundry Region Availability

⚠️ **Very limited — varies by model**

| Region           | GPT-6 Astra | GPT-6.1 Sol | Embeddings |
| ---------------- | :---------: | :---------: | :--------: |
| `eastus`         |   ✅        |   ✅        |     ✅     |
| `eastus2`        |   ✅        |   ✅        |     ✅     |
| `westus`         |   ⚠️        |   ⚠️        |     ✅     |
| `westus3`        |   ✅        |   ⚠️        |     ✅     |
| `southcentralus` |   ✅        |   ✅        |     ✅     |
| `swedencentral`  |   ✅        |   ✅        |     ✅     |
| `westeurope`     |   ⚠️        |   ✅        |     ✅     |

> Check `docs/standards/AGENT-STANDARD.md` (active house models: `Opus 5.5` / `Fable`, `Gemini 4 Carbon`, `GPT-6 Astra`, `GPT-6.1 Sol`) and https://learn.microsoft.com/azure/ai-services/openai/concepts/models for current region availability.

## Recommended Regions

| Need                    | Recommended Region                   |
| ----------------------- | ------------------------------------ |
| Full model availability | `eastus`, `eastus2`, `swedencentral` |
| Europe compliance       | `swedencentral`, `westeurope`        |
| With SWA                | `eastus2` (only overlap)             |
