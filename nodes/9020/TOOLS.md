# TOOLS.md

Host cheat sheet for node 9020 (i7k32GB1050ti). Contract: [[AGENTS]].

## Ports

| Port  | Service                    | Bind           | Status |
|-------|----------------------------|----------------|--------|
| 3050  | business-exchange (Next.js dev) | localhost | DOWN |
| 3100  | Paperclip                  | configured     | NOT running |
| 3140  | node-agent (Mission Control tie-in) | 0.0.0.0 | up |
| 11434 | Ollama                     | all interfaces | up |
| 18789 | OpenClaw gateway           | loopback       | up (first-run never finished) |
| 20128 | omni-router                | loopback       | up |

## Paths

- OpenClaw: `~/.openclaw`
- OpenCode: `~/.opencode` and `~/.config/opencode` (installed, empty config)
- Paperclip: `~/.paperclip/instances/default`
- Claude Code: `~/.claude`
- node-agent: `C:/node-agent/node-agent.js`
- business-exchange source (UNVERSIONED — see [[AGENTS]] guardrail):
  - `C:/Users/joshl/business-exchange`
  - `C:/node-workloads/9020/business-exchange`

## Commands

Start business-exchange dev server (port 3050):

```
cd C:/Users/joshl/business-exchange && npm run dev
```
