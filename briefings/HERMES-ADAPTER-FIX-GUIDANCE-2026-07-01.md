# Hermes Adapter Command Line Fix Guidance - 2026-07-01

**Related Issue:** TRO-34 (delegated under TRO-1)

**Problem:** Hermes and Hermes 2 (and grok_local) adapters fail with `adapter_failed - "The command line is too long."` when Paperclip invokes them for issue execution, especially during wake/continuation with large payloads (issue title/desc/continuationSummary).

Seen in:
- Multiple system retries on TRO-1 and children.
- Comment e0d59cda on TRO-6: "Blocked on adapter issue: both Hermes and Hermes 2 fail with \"adapter_failed - command line too long\" when Paperclip invokes them for issue execution."

**Root Cause (from .agent-core/HEARTBEAT.md):**
The complete wake context is delivered exclusively through the `PAPERCLIP_WAKE_PAYLOAD_JSON` environment variable.
Never pass, interpolate, or embed `PAPERCLIP_WAKE_PAYLOAD_JSON` (or full issue bodies/continuation summaries) as a literal command-line argument when launching agent processes.
On Windows this commonly exceeds cmd.exe (~8191 char) or CreateProcess limits.

**Fix Guidance:**
- Adapters/launchers must rely on environment variables (or temp files / stdin / pipes) for all large wake/continuation data.
- When the system generates `continuationSummary`, avoid duplicating the full original `issue.title` + `issue.description` inside the summary body; keep summaries concise to reduce payload bloat.
- Update the Hermes adapter launcher (in Paperclip runtime / adapter config) to:
  1. Set the payload via `$env:PAPERCLIP_WAKE_PAYLOAD_JSON = $json` or equivalent before spawn.
  2. Launch the agent process without the large JSON as CLI arg (e.g., use `pwsh -File script.ps1` or `python agent.py` without embedding).
  3. The agent script reads from env at start.

**References:**
- .agent-core/HEARTBEAT.md (Wake Payload Handling section)
- TRO-1 comments (e.g. de5adc84, system retries)
- TRO-6 comment e0d59cda
- TRO-34 comment bae0172b (this guidance)

**Unblock Owner/Action:** Pi / Hermes adapter team / launcher maintainers. Implement the env-var-only rule in the process spawn logic for agent adapters (grok_local, hermes, etc.).

This is the documented class of failure. Implementing the rule will unblock execution for TRO-1/TRO-6 and similar.
