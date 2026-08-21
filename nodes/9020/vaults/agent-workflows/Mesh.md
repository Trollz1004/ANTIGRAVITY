# Mesh

Entry point for the node 9020 agent mesh (host i7k32GB1050ti, human: Josh). Work flows top-down: the confirmed CEO agent [[ornith-ceo]] delegates to the platform agents ([[claude-code-agent]], [[opencode-agent]], [[openclaw-agent]]; [[hermes-agent]] is quarantined), whose drafts are reviewed by the [[judges]] panel (Gemini, Claude, Codex, Copilot, Grok - official instances) and must then pass the [[josh-approval-gate]] before the [[scc]] executes them via [[paperclip]]. Harness agents have zero push authority to git remotes. Cloud-based cores reach Paperclip per [[remote-access]]. Separately, node-agent reports into [[mission-control]]. Nothing is posted to any social channel without explicit approval from Josh.

```mermaid
flowchart TD
    ORNITH["Ornith CEO (confirmed)"] --> CC["Claude Code agent"]
    ORNITH --> OC["OpenCode agent"]
    ORNITH --> OCL["OpenClaw agent"]
    CC --> DRAFT["Content draft"]
    OC --> DRAFT
    OCL --> DRAFT
    HERMES["Hermes (quarantined)"] -.disabled.-> DRAFT
    DRAFT --> JUDGES["Judges: Gemini / Claude / Codex / Copilot / Grok"]
    JUDGES --> GATE{"Josh approval gate"}
    GATE -->|approved| SCC["SCC (Social Command Center)"]
    GATE -->|rejected| DRAFT
    SCC --> PC["Paperclip :3100"]
    PC --> SOCIAL["Social channels"]
    NA["node-agent 0.0.0.0:3140"] --> MC["Mission Control"]
```

## Notes

- [[ornith-ceo]]
- [[claude-code-agent]]
- [[opencode-agent]]
- [[openclaw-agent]]
- [[hermes-agent]]
- [[josh-approval-gate]]
- [[scc]]
- [[paperclip]]
- [[mission-control]]
