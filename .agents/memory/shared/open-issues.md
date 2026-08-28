# Open Issues

> **STALE NODE REFERENCES (judge lane, 2026-08-26; refined 2026-08-28).**
> Issues below that target "T5500" or "9020" cannot be actioned as written.
> `192.168.0.8` is SABRETOOTH, this machine — not a second box. Re-scope such an
> issue to Sabretooth or close it.
>
> **Separate the ROLE from the MACHINE.** The earlier wording here said flatly
> "there is no T5500", and that over-corrected. The T5500 *node role* is dead —
> there is no live T5500 on this LAN and nothing to deploy to. The T5500
> *hardware* is real and owned (dual-Xeon class, 64 GB RAM, AMD RX 6800 16 GB,
> `DESKTOP-TQD7EIT`) and Joshua has reserved it as the future **DREAM Online
> MMORPG server**, gated behind Mission Control, the Date App, customer support
> and marketing all working *and tested* first.
>
> So: do not chase a T5500 node today, and do not tell anyone the machine does
> not exist. Neither statement is true on its own.


> Each agent appends blockers here. CEOs triage and assign resolution.

## CRITICAL

- [ ] GitHub branch protection on main: enable now (block force pushes going forward). 30-sec job in GitHub Settings → Branches → Add rule for `main`.

## RESOLVED 2026-07-09

- Restore of 66c8390: OBSOLETE — origin/main moved 4 commits past Gordon's force-push (78272ada → 360e652a) with real work. Restoring would have destroyed those commits. Agent-setup landed via fast-forward as 25c63dde onto current main instead. No restore needed.

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

- [x] FCC: purged from the repository 2026-08-25 and permanently banned. Both FCC items here are closed by that ban, not by completion — see `agent-contracts/FCC-STATUS.md`. Do not reopen.
- [ ] Reboot test: validate ANTIGRAVITY-Bootstrap + power-loss recovery on T5500
