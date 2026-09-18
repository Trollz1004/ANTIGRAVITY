---
name: fullstack-session
description: "Complete session workflow: skills, MCPs, dashboard, GitHub, bridges."
version: 1.0.0
author: Joshua (joshlcoleman), Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [session, workflow, skills, dashboard, github, mcp, bridges, fullstack]
    related_skills: [session-memory, agent-workflow, brainstorm]
---

# Fullstack Session Skill

## When to Use

- Starting a new session that requires full infrastructure setup
- Researching and creating multiple skills
- Building dashboards with multi-bridge integration
- Managing GitHub repos via API
- Configuring MCP connections and agent profiles

## The Session Start Sequence

### 1. Memory Load

```
1. skill_view("session-memory")
2. read_file("~/.hermes/skills/productivity/session-memory/memory.md")
3. Parse YAML frontmatter for session metadata
4. Inject context silently
5. Check for stale entries (>7 days)
```

### 2. Skill Discovery

```
1. skills_list() — see all available skills
2. skill_view(name) — load relevant skills
3. Check skills.sh for new topic skills: npx skills add <author/repo> --skill <name>
4. Install from hub: hermes skills install official/<category>/<skill>
5. Create custom skills for repeated workflows
```

### 3. MCP Verification

```
1. Check omniroute: curl http://192.168.0.8:20128/v1/models
2. Check openviking: curl http://127.0.0.1:1933/health
3. Check supabase: verify project URL and keys
4. Check playwright: npx playwright --version
5. Check mission-mcp: verify server status
```

### 4. GitHub Operations

```
1. Verify PAT: curl -H "Authorization: token $PAT" https://api.github.com/user
2. Create repo: POST /user/repos
3. Push: git push origin master
4. Handle rulesets: GET /repos/{owner}/{repo}/rulesets
5. Delete blocking rulesets: DELETE /repos/{owner}/{repo}/rulesets/{id}
6. Remove secrets from history: git filter-branch --index-filter 'git rm --cached --ignore-unmatch <file>'
```

### 5. Dashboard Build

```
1. Create standalone HTML (no server needed)
2. Sidebar navigation with panels
3. Bridge status indicators
4. Terminal emulator for CLI bridges
5. Browser frame with iframe
6. Skills grid with cards
7. Chat interface for agent communication
8. Responsive grid layout
```

## Skill Creation Workflow

### Research

```
1. Search skills.sh for topic: npx skills topics
2. Inspect peer skills: skill_view("peer-skill")
3. Identify gaps in current skill set
4. Define skill purpose and triggers
```

### Authoring

```
1. Create directory: mkdir -p ~/.hermes/skills/<category>/<name>/
2. Write SKILL.md with frontmatter:
   - name: lowercase-hyphens
   - description: ≤60 chars, one sentence
   - version: semver
   - author: "Joshua (joshlcoleman), Hermes Agent"
   - license: MIT
   - platforms: [linux, macos, windows]
   - metadata.hermes.tags: [relevant, tags]
   - metadata.hermes.related_skills: [peer-skills]
3. Sections: When to Use, Prerequisites, Quick Reference, Procedure, Pitfalls, Verification
4. Add references/ for detailed docs
5. Add scripts/ for helper tools
```

### Testing

```
1. New session: hermes chat -q "/<skill-name> test"
2. Verify skill loads
3. Check instructions are actionable
4. Validate pitfalls section
5. Confirm verification checklist works
```

## Dashboard Architecture

### Panels

| Panel | Bridge | Technology |
|-------|--------|------------|
| Overview | All | Status cards |
| Buzz | Slack-like | Chat messages |
| Obsidian | Local REST API | Notes list |
| Hermes | Session memory | Memory viewer |
| Claude Code | Headless CLI | Terminal emulator |
| Copilot | BYOK endpoint | Config form |
| Browser | Chrome CDP | iframe |
| Skills | Skill inventory | Card grid |
| Settings | Config | Forms |

### Bridge Status

- **Online**: Green dot, active connection
- **Idle**: Yellow dot, ready but not active
- **Offline**: Red dot, not connected

### State Management

```javascript
// Panel switching
function switchPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
}

// Bridge polling
setInterval(() => {
  // Poll each bridge for status
}, 10000);
```

## GitHub API Patterns

### Authentication

```bash
# Verify PAT
curl -s -H "Authorization: token $PAT" https://api.github.com/user

# Check scopes
curl -s -I -H "Authorization: token $PAT" https://api.github.com/user | grep x-oauth-scopes
```

### Repo Management

```bash
# Create repo
curl -s -X POST -H "Authorization: token $PAT" \
  https://api.github.com/user/repos \
  -d '{"name":"hermes","description":"...","private":false}'

# List repos
curl -s -H "Authorization: token $PAT" https://api.github.com/user/repos

# Delete repo
curl -s -X DELETE -H "Authorization: token $PAT" \
  https://api.github.com/repos/{owner}/{repo}
```

### Ruleset Management

```bash
# List rulesets
curl -s -H "Authorization: token $PAT" \
  https://api.github.com/repos/{owner}/{repo}/rulesets

# Delete ruleset
curl -s -X DELETE -H "Authorization: token $PAT" \
  https://api.github.com/repos/{owner}/{repo}/rulesets/{id}
```

### Push with Secret Recovery

```bash
# If secret in history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all

# Force push after cleanup
git push origin master --force
```

## MCP Connection Patterns

### Omniroute (Multi-Model)

```yaml
# config.yaml
delegation:
  base_url: http://192.168.0.8:20128/v1
auxiliary:
  approval:
    base_url: http://192.168.0.8:20128/v1
  compression:
    base_url: http://192.168.0.8:20128/v1
  mcp:
    base_url: http://192.168.0.8:20128/v1
  review:
    base_url: http://192.168.0.8:20128/v1
  skills_hub:
    base_url: http://192.168.0.8:20128/v1
  vision:
    base_url: http://192.168.0.8:20128/v1
```

### OpenViking (Hierarchical Context)

```bash
# Recall before loading large files
ov find '<topic>'

# Commit session at end
ov session commit

# Check status
ov status
```

## Agent Profile Template

```yaml
agent_name:
  role: "Description"
  heartbeatLocation: ".agents/journals/<name>/STATE.md"
  claudeFile: "CLAUDE.md"
  skillsToLoad:
    - skill-1
    - skill-2
  tools: "ALL (unlimited access)"
  dailyResearchArea: "topic, patterns, strategies"
```

## Pitfalls

- **PAT exposure**: Never commit .env with tokens. Use git filter-branch to remove.
- **GitHub rulesets**: Check for blocking rulesets before pushing.
- **Email privacy**: Use `users.noreply.github.com` if email privacy enabled.
- **Skill bloat**: Max 8-12 active skills. Uninstall unused ones.
- **Context bloat**: Heartbeats = locations only, never content.
- **Secret scanning**: GitHub blocks pushes with detected secrets. Remove from history first.

## Verification

### Session Start
- [ ] memory.md loaded and parsed
- [ ] Context injected silently
- [ ] Stale entries noted

### Skill Creation
- [ ] SKILL.md has valid frontmatter
- [ ] Description ≤60 chars
- [ ] All sections present (When to Use, Procedure, Pitfalls, Verification)
- [ ] Peer skills surveyed (no duplication)

### Dashboard
- [ ] All panels functional
- [ ] Bridge status accurate
- [ ] Responsive layout
- [ ] No console errors

### GitHub
- [ ] PAT valid and has correct scopes
- [ ] No secrets in git history
- [ ] Rulesets don't block pushes
- [ ] Single branch (main/master)

### Session End
- [ ] New session block appended to memory.md
- [ ] Metadata updated
- [ ] Obsidian note written if needed
- [ ] GitHub pushed if changes made
