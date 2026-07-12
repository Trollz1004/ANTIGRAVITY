# NPC memory artifact store (minimal prototype)

**Issue:** TRO-126  
**Skill:** `.agents/skills/dream-live-npc/`  
**Backend:** workspace JSON file (persona + episodic + relationships)

## API

Dot-source `Npc-memory-store.ps1`:

| Function | Purpose |
|---|---|
| `Read-NpcMemory -NpcId <id>` | Load persona state artifact |
| `Write-NpcMemory -NpcId <id> -Memory @{...}` | Append episodic row (idempotent by `memory_id` / `event_id`) |
| `Invoke-NpcMemoryRoundtrip` | One write + one read + proof stamp |

## Demo

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .agents/skills/dream-live-npc/examples/demo-write-read-roundtrip.ps1
```

Proof output: `examples/tro-126-write-read-demo.json`  
Bootstrap persona: `examples/mira-dockwarden.state.json`

## Out of scope (later)

- Qdrant episodic vectors
- Postgres relationship rows / world ledger
- Live webhook wake path (TRO-66 / engine bridge)
