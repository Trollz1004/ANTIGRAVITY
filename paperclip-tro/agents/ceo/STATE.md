# hermes-ceo — Self-Improving State File
> Max 4k tokens. Read on start. Write on exit ONLY. Timestamp every write.
> updated: 2026-07-03T00:00:00Z

## Last Session
Josh changed Paperclip architecture to Hermes-only active agent. Paperclip is the visible timestamped board/feed over Hermes work via local Hermes port 9119.

## Decisions
- Hermes is the only required active Paperclip agent.
- `.agents/skills/` are departments Hermes loads on demand, not permanent board staff.
- FCC-Claude/ChatPlayground/browser UIs are optional helper resources controlled/monitored by Hermes/Opus, not standing authority.
- Subagents are temporary task workers only.

## Learned
- Prior multi-agent roster was too much overhead for Josh's desired workflow.
- Paperclip value is organization: tasks, routines, issues, goals, timestamps, evidence, done state.
