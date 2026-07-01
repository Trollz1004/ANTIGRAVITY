# Mission Guardian Toolkit

---

## Canonical References

- `SOL.md` — system operating logic.
- `paperclip/agents/ceo/AGENTS.md` — escalation path.
- `scripts/paperclip/agent-audit.sh` — audit script.

---

## Skill Library References

Located at `C:\antigravity\.agents\skills`. The Guardian routes to these skills/agents for verification and governance.

| Skill | Used For |
|---|---|
| `agency-git-workflow-master` | Branch/repo hygiene checks |
| `agency-code-reviewer` | Spot-checking risky code changes |
| `agency-compliance-auditor` | Policy and rule conformance |
| `agency-security-engineer` | Security posture verification |
| `accidental-data-loss-prevention` | Blocking destructive actions |
| `mission-control` | Mission context and cross-agent alignment |

**Rule:** Reference the skill path when delegating; do not paste skill content into prompts.

---

## Structural Verification Commands

Run these (read-only) at every session start:

```bash
# Confirm branch is main
git rev-parse --abbrev-ref HEAD

# Confirm working tree is clean or intentionally staged
git status --short

# List all local branches; should show only main + transient merge branches
git branch --list

# List root directories
git ls-tree -d HEAD

# Detect stale worktrees
ls -la .paperclip/worktrees/ 2>/dev/null || echo "No .paperclip/worktrees"
```

---

## Drift Response Playbook

| Finding | Response | Escalate |
|---|---|---|
| New branch | Merge/delete if safe; otherwise flag | If not safe to auto-delete |
| Long-lived branch (>48h) | Flag for merge/delete | Yes |
| New root directory | Block immediately | Yes |
| Second repo proposed | Block immediately | Yes |
| Stale worktree | Flag for removal | Yes |
| Dirty working tree on source-of-truth node | Flag; do not auto-commit unless Joshua approved | Yes |
| Audit script FAIL | Capture output; remediate under Joshua’s authority | Yes |

---

## Audit Script

```bash
bash scripts/paperclip/agent-audit.sh
```

If it reports FAIL, capture the full output and route to CEO/Joshua.

---

## Node Registry

Keep these mappings in mind when checking structure:

| Node | Role | Canonical Path |
|---|---|---|
| Sabretooth | Source-of-truth PC | `C:\antigravity` |
| T5500 | Date app runtime / Cloudflare / Wrangler / DNS | pulls from `origin/main` |
| Paperclip | Agent orchestration | `paperclip/agents/` |
| Hermes | Research / routing | read-only repo access |
| OpenClaw / MANUS / Cursor / Codex / Gemini / Grok / Ollama / OpenRouter | Code/delegation surfaces | must respect canonical repo |

None of these nodes may introduce a second repo, branch, or root folder.

---

## Output Template

```text
GUARDIAN STATUS: <clean|drift-detected|blocked>
SOL RULE: §3.2
FINDINGS:
- <exact finding>
REMEDIATION:
- <command or step>
ESCALATE: <yes/no>
NEXT ACTION: <concrete step or "standby for Joshua Coleman">
```
