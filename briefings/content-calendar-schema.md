# Content Calendar Schema for mission-mcp (TRO-25 / T-203a)

**Minimal table/schema for entries (date, platform, topic, status, assignee).**

## Fields
- id: string (uuid or slug)
- date: ISO date (YYYY-MM-DD or full datetime)
- platform: enum/string (X, Reddit, Discord, Instagram, Threads, etc.)
- topic: string (e.g. 'Bot-Shield verification', 'Founding Member', 'safety plans')
- caption_ref: string (link or key to caption-bank entry)
- status: enum (draft, scheduled, posted, reviewed, cancelled)
- assignee: string (agent or human id)
- link: url (post URL after published)
- notes: string (compliance notes, performance)

## Example entry
```json
{
  \"id\": \"cc-2026-07-01-x-001\",
  \"date\": \"2026-07-01\",
  \"platform\": \"X\",
  \"topic\": \"Bot-Shield verification explained\",
  \"caption_ref\": \"content/cross-platform-caption-bank.md#SET-1\",
  \"status\": \"scheduled\",
  \"assignee\": \"grok\",
  \"link\": null,
  \"notes\": \"fresh from bank, no legacy claims\"
}
```

## Storage in mission-mcp
Use store_memory with tag 'content-calendar' or write_file to briefings/content-calendar-entries.json

## UI in mission-control
Add to dashboard as list + form (similar to Genspark stub or RunbooksPanel).

Part of T-013 / content calendar into mission-mcp.
