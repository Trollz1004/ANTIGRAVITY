---
name: paperweight-daily-memory
category: devops
description: Daily automated memory consolidation and mission-control synchronization for the Paperweight Kanban.
---

# Paperweight Daily Memory Routine

## Trigger
- Scheduled daily at 06:00 Local (Sabretooth).
- Executed via Cowork scheduled task runner.

## Workflow
1. **State Retrieval**:
   - Extract all `pending` and `in_progress` items from the Paperweight Kanban.
   - Search `session_search` for "PAPERWEIGHT update" or "mission-control" from the previous 24 hours.

2. **Consolidation**:
   - Compare current task state against recent agent outputs.
   - Identify completed tasks that were not marked in the UI.
   - Update the `READY-TO-PUSH-HQ.txt` briefing with a delta of changes.

3. **Memory Injection**:
   - Use `memory(action='add')` for any new durable facts discovered during the day.
   - Prune temporary session-state that has been fully resolved into the Kanban.

4. **Briefing Generation**:
   - Generate a 06:00 AM status report for Joshua:
     - Active focus areas.
     - Blocked items requiring authority.
     - Commit SHAs pending manual push.

## Pitfalls
- **Rate Limits**: Ensure this runs natively on Sabretooth; do not chain external API calls to the status check.
- **State Drift**: Always prioritize the `.hermes/kanban` file over transient chat history.

## Verification
- Verify `c:\antigravity\briefings\DAILY-SYNC.md` was updated with today's date.
- confirm no duplicate entries in permanent memory.
