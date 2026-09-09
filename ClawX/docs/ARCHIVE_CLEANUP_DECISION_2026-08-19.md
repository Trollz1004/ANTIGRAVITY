# Archive Cleanup Decision — 2026-08-19

> **Decision scope:** The `manus/call-layer` branch only. This record documents a narrow, reversible cleanup of generated archive content; it does not remove active source, current contracts, vault credentials, or uncertain historical evidence.

## Inventory Basis

The dated `archive/root-cleanup-2026-08-16` tree contains approximately 330 tracked files. The only discovered generated-cache subtree is `legacy/graphify-out/cache`. No active source reference to that cache subtree was found outside the archive itself.

## Removal Decision

| Candidate | Classification | Action | Reason |
|---|---|---|---|
| `archive/root-cleanup-2026-08-16/legacy/graphify-out/cache` | Generated, dated analysis cache | Remove from the working branch | It is reproducible cache data, not an active Mission Control dependency or a human-facing source of truth. Git history retains recovery evidence. |

## Retained Pending Further Evidence

| Area | Reason retained |
|---|---|
| `agent-work-products` | May contain historical screenshots or outputs useful for auditing; not proven duplicative. |
| `prospecting` | Historical business evidence; not relevant to the current human-tool implementation but not proven safe to remove. |
| `paperclip-agents` | May document historical migration context; no current runtime authority but retention is safer than blind deletion. |
| Other `legacy` records | Require source-by-source classification; neither a path name nor an age stamp alone proves safe deletion. |
