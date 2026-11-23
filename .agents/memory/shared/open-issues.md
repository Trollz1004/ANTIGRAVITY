# Open Issues

> **Aligned to 2-Node Fleet (`ops/fleet/fleet-map.json`):**
> Active workloads run only on **T5500 (`192.168.0.15`, Front-of-House)** and **Alienware (`192.168.0.40`, Workshop)**. Legacy third-node references are retired.

> Each agent appends blockers here.

## CRITICAL

- [ ] GitHub branch protection on main: keep branch protection active (PR + judge verification before merge).

## HIGH

- [ ] Desktop Commander: verify enabled in claude.ai Settings when working live.
- [ ] WSL2 + Claude Code: verify on active workstations as needed.

## MEDIUM

- [ ] OmniRoute on T5500 (`192.168.0.15:20128`): confirm provider auth and catalog health.
- [ ] Analytics tags: verify measurement configuration on active live domains (`youandinotai.com`, `onlinerecycle.net`, `dream-online.net`).
- [ ] QuickBooks: connect when operator authorizes for financial reporting.

## LOW

- [x] FCC Judge ban enforced: `agent-contracts/FCC-STATUS.md` (worker lane only on Alienware `192.168.0.40:8082`, never a judge).
- [ ] Reboot test: validate boot resilience and power-loss recovery on T5500 (`192.168.0.15`) and Alienware (`192.168.0.40`).
