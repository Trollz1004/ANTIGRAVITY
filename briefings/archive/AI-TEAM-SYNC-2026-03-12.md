# AI Team Sync — 2026-03-12

To: Codex, Gemini, Claude, Comet, local workers
Priority: Read before the next scoped task
Repo truth: `C:\ANTIGRAVITY` on `origin/main`
Current baseline: `b841fd4`

## Core Reset

- There is one live repo: `C:\ANTIGRAVITY`
- There is one live branch: `main`
- Codex on Sabretooth is the orchestrator and final repo truth
- Gemini and Claude are collaborators, not separate truth sources
- Comet is research-only

## Payment Truth

- Square is the live payment rail
- Canonical links and payment rules live in `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md`
- Stripe is legacy only
- Customer-facing code must not use `donate`, `donation`, or `solicitation`

## Chain Truth

- Protocol Omega live status is anchored in `briefings/PROTOCOL-OMEGA-ONCHAIN-STATUS.md`
- Keep `60/30/10` fixed
- Do not imply staking, treasury yield, or automatic Square-to-chain routing unless the current repo and runtime prove it

## Watcher Truth

- `CodeX-Fleet-Watcher` is installed on Sabretooth and runs daily at `03:00`
- It writes append-only logs and latest summaries under ignored `CodeX\logs` and `CodeX\state\runtime`
- Current repo-side hardening is committed, but live site header rollout may still lag until Cloudflare Pages redeploys the latest commit

## Current Team Lanes

### Codex
- final authority for repo truth
- architecture, payments, deployment sequencing, git closeout
- pushes `main` after verification

### Gemini
- frontend, browser validation, static-site cleanup, bounded UI work
- use `briefings/gemini/BRIEFING.md`
- use `briefings/gemini-agent-prompt.md`

### Claude
- audits, backend support, proof checks, bounded implementation when assigned
- use `briefings/claude-t5500/BRIEFING.md`

### Comet
- research, policy checks, current-web intelligence
- do not set implementation truth

## Current Priority Stack

1. keep public surfaces truthful
2. keep Square-first payment truth intact
3. keep watcher proof and drift detection healthy
4. finish live header/CSP rollout on deployed public surfaces
5. keep memory and briefings aligned whenever operational truth changes

## Hard Stops

- no OMEGA repo work from ENIGMA-side tasks
- no stale `E:\` or `C:\OPUSONLY` as live truth
- no fake metrics
- no mock data
- no unmerged finished branches
