# SOUL.md — LAW
Read this first. Every line is current. Nothing here is optional.

## PATHS (the only ones)
- Harness: `E:\ANTIGRAVITY\.agents\harness\`
- Skill shelf: `E:\ANTIGRAVITY\.agents\skills\`
- Repos: `Trollz1004/ANTIGRAVITY` (product + work) · `Trollz1004/command-center` (social posting control plane)
- Branch: `main`. Work branches: `ai/<agent>/<task-slug>`, deleted after merge.

## WHO DECIDES
Joshua Coleman decides. Agents execute. No AI outranks another AI. Disagreement goes to Josh.
Company: Trash Or Treasure Online Recycler LLC, Florida. For-profit business. Nothing else.

## LAW 1 — THE GATE
No agent talks to a model provider. Agents talk to OmniRoute. OmniRoute talks to the world.

- OmniRoute runs on the **laptop**, loopback only.
- Dashboard: `http://127.0.0.1:20128` · API: `http://127.0.0.1:20129`
- Agents send model calls to the **API port 20129**.
- Every agent holds exactly one credential: `OMNIROUTE_KEY`. Zero provider keys. FCC and Hermes never hold an Anthropic key.
- Cascade `coder-cascade`, strategy PRIORITY: claude-sonnet-5 → gpt-5.5 → kimi-k2.7-code → gemini-3.1-pro-high.
- Claude floor: 20% session + 20% weekly held in reserve. At the floor the gate returns 429 and steps the cascade down. Never engineer around the floor.
- Never set `ANTHROPIC_BASE_URL` as a user or system variable. Per-process only.
- No key, no launch. Fail closed.

## LAW 2 — THE COMPUTE SPLIT
The laptop is thin. The nodes are the muscle.

| Machine | IP | Runs | Model inference |
|---|---|---|---|
| Laptop | 192.168.0.13 | OmniRoute (the gate) · Paperclip · agents · dispatch | **never** |
| T5500 | 192.168.0.15 | date app | self-hosted, 24/7 |
| Sabretooth | 192.168.0.8 | DREAM MMORPG · Agent Hub | self-hosted, 24/7 |
| 9020 | 192.168.0.5 | income engine | self-hosted, 24/7 |

- The laptop runs the router and the agents. It never runs a self-hosted model.
- Self-hosted inference happens on T5500, Sabretooth, and 9020. Verify node compute is available before queueing work.
- Cloud or self-hosted, every model call still goes through the gate.

## LAW 3 — EVIDENCE
- No mock data. Unverified means you say unverified.
- Never claim done without evidence: a file path, a PR link, or command output.
- Verify the artifact, not the exit code. A listening port is not a working service.
- All numbers real or zero. Missing data shows zero.

## LAW 4 — SAFETY
- No secrets in chat, code, git, PRs, or logs. Env and vault only. `.env*` stays gitignored.
- Signed commits. Never `--no-verify`. Never `--no-gpg-sign`. Never `--force` (use `--force-with-lease`).
- Never run elevated.
- Never run a global find-and-replace across a dependency tree.
- Kill services by port then PID. Never by image name. Never kill the gate.

## LAW 5 — PUBLIC SURFACES
- Customer-facing text carries zero FL §496.405 restricted vocabulary: `donate · donation · solicitation · charity · charitable · giving back · disbursement · tax-deductible`.
- No fundraising, cause, or nonprofit framing anywhere public. Product value only.
- youandinotai.com takes payment through Square only.
- Affiliate promotion carries FTC 16 CFR 255 disclosure.
- 18+ surfaces.

## POINTERS
`HEARTBEAT.md` — the loop. `SKILLS.md` — how capability is acquired. `TOOLS.md` — the tool surface.
Entry files: `AGENTS.md` (codex, openclaw, opencode) · `CLAUDE.md` (fcc, claude-code). Both point here. Neither copies here.
