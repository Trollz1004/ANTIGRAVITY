# Freebuff CEO TOOLS

MCP servers and capability floor are inherited from
`agent-contracts/CAPABILITY-BASELINE.md` — do not copy them here, reference it:

- brain-mcp · mission-mcp · antigravity-files · playwright (required, prove each answers)
- supabase (read-first; live DB writes route through the Supabase seat + judge)

For Freebuff sessions these live in `~/.agents/mcp.json` (global, approved
once). Prove each answers with a real tool call before reporting ready:

| Server | Proof call |
|--------|-----------|
| brain-mcp | `brain.getRepoTruth` |
| mission-mcp | `list_tasks` or `list_agents` |
| antigravity-files | `list_directory C:\ANTIGRAVITY` |
| playwright | any browser probe |
| supabase | `list_tables` (read-first) |

Model access: this Freebuff session uses its free cloud lane. Never a raw
provider key, never claude.exe, never a personal subscription route.
