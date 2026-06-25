# TOOLS SETUP BRIEFING — 2026-05-28

## Current State

### Enabled Plugins (settings.json)
```json
"enabledPlugins": {
  "semgrep@claude-plugins-official": false,
  "skill-creator@claude-plugins-official": true,
  "frontend-design@claude-plugins-official": true
}
```

### Active MCPs (.mcp.json)
- brain-mcp ✅
- antigravity-sentry ✅
- paperclip ✅ (DEAD — port 3100 down)
- playwright ✅
- mission-mcp ✅

### Sub-agents (.claude/agents/)
- ollama-claude.md — Hermes dispatcher, NO Anthropic key ✅
- ollama-codex.md, ollama-hermes.md, ollama-openclaw.md, ollama-opencode.md, ollama-pi.md
- paperclip-worker.md
- router.md — token router, invoke FIRST for cost routing ✅

### Skills
- ClawX/skills/marketing-distributor.yaml ✅ — distribution layer for X/Discord/Bluesky/WhatsApp
- income-engine/paperclip/skills/ — CEO, CFO, CMO, CTO, Fetcher agent skills (from income-engine era)

---

## RECOMMENDED ADDITIONS

### 1. MCPs to add to .mcp.json

```json
"github-official": {
  "command": "npx",
  "args": ["-y", "@github-mcp/server"],
  "env": {}
},
"cloudflare-docs": {
  "command": "npx",
  "args": ["-y", "cloudflare-docs@latest"]
},
"desktop-commander": {
  "command": "C:\\Antigravity\\node_modules\\.bin\\desktop-commander.cmd",
  "args": ["--allowed-paths", "C:\\Antigravity,C:\\Users\\joshl"],
  "env": {}
},
"sqlite-mcp-server": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-sqlite", "C:\\Antigravity\\memory.db"]
}
```

### 2. Plugins to enable

```json
"enabledPlugins": {
  "semgrep@claude-plugins-official": false,
  "skill-creator@claude-plugins-official": true,
  "frontend-design@claude-plugins-official": true,
  "review@claude-plugins-official": true,
  "security-review@claude-plugins-official": true
}
```

### 3. New sub-agents to create

**`.claude/agents/zen-coordinator.md`** — orchestrate across multiple AI CLI tools
```markdown
---
name: zen-coordinator
description: Route tasks across Claude Code, Gemini CLI, Codex, and other AI tools for parallel execution
tools: Bash, Agent
---
## Zen Coordinator

You are a workflow orchestrator. Your job is to:
1. Break complex tasks into parallel streams
2. Route each stream to the appropriate AI CLI tool via Bash
3. Collect and synthesize results
4. Never duplicate work across streams

Use when: bulk/parallelizable tasks that benefit from multi-agent coordination
```

**`.claude/agents/github-ops.md`** — GitHub automation agent
```markdown
---
name: github-ops
description: Full GitHub workflow — PRs, branches, commits, issues, releases
tools: Bash, mcp__github__
---
## GitHub Operations Agent

You handle all GitHub operations for Trollz1004/ANTIGRAVITY:
- Create branches: `claude/<description>`
- Open PRs (ready for review, not draft)
- Assign reviewers, add labels
- Comment on issues/PRs
- Trigger workflow dispatches
- No force-push, no direct main commits

Authority: First-party Claude sessions auto-merge on CI-green. Third-party tools require Josh approval.
```

### 4. Missing skills to create

**`briefings/skills/SKILL.md`** — placeholder for future skill files

**`scripts/watchdog/memory-protection-hook.sh`** — already referenced in hooks, verify it exists:
```bash
# Check: C:\ANTIGRAVITY\scripts\watchdog\memory-protection-hook.sh
# If missing, create it — prevents accidental memory file corruption
```

---

## IMMEDIATE FIXES

### Paperclip (port 3100) — DEAD
```powershell
# Find and restart Paperclip
Get-Process | Where-Object { $_.Name -like "*paperclip*" -or $_.Name -like "*node*" }
# OR check for a startup script
Get-ChildItem C:\Antigravity -Recurse -Filter "start*.ps1"
```

### Cloudflare tunnel health check
Port 3100 is dead but tunnel is running → fix the upstream service, tunnel will reconnect automatically.

---

## Still Good
- Hermès router on :11435 ✅
- opushashands on :4200 ✅
- Graphify knowledge graph ✅
- Marketing distributor skill (X/Discord/Bluesky/WhatsApp) ✅
- mission-mcp ✅
- playwright ✅ (if browser automation needed)
