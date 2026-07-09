# Open Issues
> Each agent appends blockers here. CEOs triage and assign resolution.

## CRITICAL
- [ ] RESTORE: Run Desktop\RUN-NOW-restore-and-verify.bat on T5500. True git tip 66c8390 orphaned by Gordon force-push. All code work blocked until restored.
- [ ] GitHub branch protection on main: enable after restore (block force pushes)

## HIGH
- [ ] Codex governance prompt: run after restore (adds gordon to roster, bundles fixes)
- [ ] Desktop Commander: re-enable in claude.ai Settings
- [ ] ANTIGRAVITY MCP :3140: run RUN-FIRST-TIME.bat, add cloudflared ingress
- [ ] WSL2 + Claude Code: install on T5500 (needs one UAC click)

## MEDIUM
- [ ] OmniRouter on T5500: set OMNI_ROUTER_PROXY_ENABLED=1 + provider env vars, then start
- [ ] 9020 resync: after main restore, sync 9020 node
- [ ] GA4 tags: verify tag installation on all 3 domains (aidoesitall.org, ai-solutions.store, onlinerecycle.org)
- [ ] QuickBooks: not connected — financial health check incomplete without it

## LOW
- [ ] FCC hijack runbook: commit to docs/runbooks/
- [ ] Reboot test: validate ANTIGRAVITY-Bootstrap + power-loss recovery on T5500
