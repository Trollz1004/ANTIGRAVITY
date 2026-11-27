---
name: azure-storage
description: 'Azure Storage Services including Blob Storage, File Shares, Queue Storage, Table Storage, and Data Lake. Provides object storage, SMB file shares, async messaging, NoSQL key-value, and big data analytics capabilities. Includes access tiers (hot, cool, archive) and lifecycle management. USE FOR: blob storage, file shares, queue storage, table storage, data lake, upload files, download blobs, storage accounts, access tiers, lifecycle management. DO NOT USE FOR: SQL databases, Cosmos DB (use azure-prepare), messaging with Event Hubs or Service Bus (use azure-messaging).'
---

# Azure Storage Services

## Services

| Service       | Use When                                   | MCP Tools        | CLI                |
| ------------- | ------------------------------------------ | ---------------- | ------------------ |
| Blob Storage  | Objects, files, backups, static content    | `azure__storage` | `az storage blob`  |
| File Shares   | SMB file shares, lift-and-shift            | -                | `az storage file`  |
| Queue Storage | Async messaging, task queues               | -                | `az storage queue` |
| Table Storage | NoSQL key-value (consider Cosmos DB)       | -                | `az storage table` |
| Data Lake     | Big data analytics, hierarchical namespace | -                | `az storage fs`    |

## MCP Server (Preferred)

When Azure MCP is enabled:

- `azure__storage` with command `storage_account_list` - List storage accounts
- `azure__storage` with command `storage_container_list` - List containers in account
- `azure__storage` with command `storage_blob_list` - List blobs in container
- `azure__storage` with command `storage_blob_get` - Download blob content
- `azure__storage` with command `storage_blob_put` - Upload blob content

**If Azure MCP is not enabled:** Run `/azure:setup` or enable via `/mcp`.

## CLI Fallback

```bash
# List storage accounts
az storage account list --output table

# List containers
az storage container list --account-name ACCOUNT --output table

# List blobs
az storage blob list --account-name ACCOUNT --container-name CONTAINER --output table

# Download blob
az storage blob download --account-name ACCOUNT --container-name CONTAINER --name BLOB --file LOCAL_PATH

# Upload blob
az storage blob upload --account-name ACCOUNT --container-name CONTAINER --name BLOB --file LOCAL_PATH
```

## Storage Account Tiers

| Tier     | Use Case                | Performance     |
| -------- | ----------------------- | --------------- |
| Standard | General purpose, backup | Milliseconds    |
| Premium  | Databases, high IOPS    | Sub-millisecond |

## Blob Access Tiers

| Tier    | Access Frequency      | Cost                                 |
| ------- | --------------------- | ------------------------------------ |
| Hot     | Frequent              | Higher storage, lower access         |
| Cool    | Infrequent (30+ days) | Lower storage, higher access         |
| Cold    | Rare (90+ days)       | Lower still                          |
| Archive | Rarely (180+ days)    | Lowest storage, rehydration required |

## Redundancy Options

| Type | Durability | Use Case                   |
| ---- | ---------- | -------------------------- |
| LRS  | 11 nines   | Dev/test, recreatable data |
| ZRS  | 12 nines   | Regional high availability |
| GRS  | 16 nines   | Disaster recovery          |
| GZRS | 16 nines   | Best durability            |

## Service Details

For deep documentation on specific services:

- Blob storage patterns and lifecycle -> [Blob Storage documentation](https://learn.microsoft.com/azure/storage/blobs/storage-blobs-overview)
- File shares and Azure File Sync -> [Azure Files documentation](https://learn.microsoft.com/azure/storage/files/storage-files-introduction)
- Queue patterns and poison handling -> [Queue Storage documentation](https://learn.microsoft.com/azure/storage/queues/storage-queues-introduction)

## SDK Quick References

For building applications with Azure Storage SDKs, see the condensed guides:

- **Blob Storage**: [Python](references/sdk/azure-storage-blob-py.md) | [TypeScript](references/sdk/azure-storage-blob-ts.md) | [Java](references/sdk/azure-storage-blob-java.md) | [Rust](references/sdk/azure-storage-blob-rust.md)
- **Queue Storage**: [Python](references/sdk/azure-storage-queue-py.md) | [TypeScript](references/sdk/azure-storage-queue-ts.md)
- **File Shares**: [Python](references/sdk/azure-storage-file-share-py.md) | [TypeScript](references/sdk/azure-storage-file-share-ts.md)
- **Data Lake**: [Python](references/sdk/azure-storage-file-datalake-py.md)
- **Tables**: [Python](references/sdk/azure-data-tables-py.md) | [Java](references/sdk/azure-data-tables-java.md)

For full package listing across all languages, see [SDK Usage Guide](references/sdk-usage.md).

## Azure SDKs

For building applications that interact with Azure Storage programmatically, Azure provides SDK packages in multiple languages (.NET, Java, JavaScript, Python, Go, Rust). See [SDK Usage Guide](references/sdk-usage.md) for package names, installation commands, and quick start examples.

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
