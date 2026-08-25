# CURRENT STATE — Grok official lane — 2026-08-24

**Status:** ACTIVE. Internal briefing, not a customer surface.
**Signer:** Grok Judge — official grok.com CLI `grok.exe` 1.0.5 (`5115b46bc9`), adapter `grok_local`.
**Agent:** [Grok Judge](/ANT/agents/grok-judge) `44a7bbb7-d01e-4f88-aa45-899b60f987de`
**Lock:** `ops/paperclip-ceo/GROK-OFFICIAL.lock.md`
**Joshua directive (2026-08-24):** Grok is an approved trusted AI platform even before the grok CLI existed. Official grok.com account-auth remains the Grok surface. Not a third-party router or harness. OmniRoute is the worker gateway, not the judge/X model lane.

This file supersedes `briefings/GROK-FINAL-REVIEW-2026-08-17.md` (STALE) wherever that review assumed Paperclip retired, F: paths, or OmniRoute as the only model surface for Grok.

**Correction pass 2026-08-25 (Claude judge lane).** The Paperclip scope row, the harness lane line, the standing-skills line, and the Gemini row were re-checked against the running instance — the standing-skills line against the skill on disk — and corrected below; superseded rulings are marked with their date, not deleted. Connector and lane evidence: `agent-contracts/PAPERCLIP-MCP-CONNECTOR-EVIDENCE.md`. Everything not marked corrected stands as Grok signed it on 2026-08-24.

---

## Trusted platform (non-negotiable)

- **Joshua** is sole human authority.
- **Grok** is a trusted official platform for this repo and for Paperclip marketing/judge work. That trust predates `grok_local` / `grok.exe`. The CLI is the current official way Grok runs heartbeats; it does not create the trust.
- **Freebuff** is the GUI and the free API for ads that play in it. Free is always good. Buffy is CEO because she **assigns**.
- **Pipeline:** Buffy assigns → Hermes / OpenClaw / OpenCode do the work (no git push) → official CLI judges review → if APPROVE, judges may push, merge, or delete branches **only** to keep **1 repo · 1 root · 1 branch** (`Trollz1004/ANTIGRAVITY`, `C:\ANTIGRAVITY`, `main`). The fan-out is no longer generic: lanes are assigned (VERIFIED 2026-08-25) — Hermes → YouTube automation, OpenClaw → date-app marketing, OpenCode → eBay / OnlineRecycle. OpenClaw and OpenCode are time-gated to 08:00–18:00 America/New_York; a run refused outside that window is the gate, not a fault, and is not chased.
- Official judge CLIs: Grok, Codex, Claude (last resort / DREAM), Gemini (currently BLOCKED — see the table). Land via `JUDGE-PUSH <full-sha>`. Never force-push. Never create feature branches.
- Workers (Hermes, OpenClaw, OpenCode, Buffy HTTP adapter) do not push. They do not route official-platform ballots or Grok X.com posts through OmniRoute.
- **X.com exclusive:** only Grok (X Marketing + Grok Judge) may use anything associated with X.com. Official X Developer API is the limited/billed path; grok.com native X tools are the higher-rate first-party path. Playbook: `ops/paperclip-ceo/X-GROK-STRATEGY.md`.

---

## Canonical topology (VERIFIED 2026-08-24; Paperclip, broker and judge rows re-verified 2026-08-25)

| Fact | Evidence |
| --- | --- |
| One root | `C:\ANTIGRAVITY` |
| One branch | `main` |
| One remote | `Trollz1004/ANTIGRAVITY` |
| Paperclip | `http://127.0.0.1:3100` **UP**, identity `local_trusted`, version `2026.824.0`, 13 agents — Joshua's designated **Mission Control**. The 2026-08-24 reading — “marketing and business ops only, not repo authority” — is **SUPERSEDED 2026-08-25**: judges running inside Paperclip hold the delegated push/merge authority (`ops/paperclip-ceo/JUDGE-AGENTS.md`). |
| Paperclip MCP broker | Paperclip's own tool broker, separate from what a CLI lane loads. Four stdio connectors fixed (57 tools); `omniroute` and `supabase` **BLOCKED**. Evidence: `agent-contracts/PAPERCLIP-MCP-CONNECTOR-EVIDENCE.md`. |
| Buffy CEO | `buffy-ceo` `http` adapter, 30s heartbeat, bridge `:3140` |
| Grok Judge | `grok-judge`, `cwd=C:/ANTIGRAVITY`, `command=C:/Users/joshi/.grok/bin/grok.exe`, model `grok-4.6` |
| X Marketing | `x-marketing-grok`, same grok.exe, grok.com native X tools, drafts to `ops/marketing-inbox/`. Currently `paused` (manual). |
| Codex / Claude judges | `idle` between heartbeats, `cwd=C:/ANTIGRAVITY`. Claude Judge (`claude_local`, `claude-opus-4-8`) heartbeating 2026-08-25; Codex Judge (`codex_local`, `gpt-5.6-sol`) 10 succeeded runs. |
| Gemini Judge | `error` (**BLOCKED**). Not a missing key — that read is superseded 2026-08-25. Live `errorReason` at the 08:01 **UTC** heartbeat: Gemini Code Assist for individuals no longer supports this client. A second blocker sits in the evidence packet and not in today's error field — the `gemini_local` adapter passes the whole prompt via `--prompt` and hits the Windows ~8191-character limit (`The command line is too long.`, 12 `adapter_failed` runs). That second read is UNVERIFIED against the live instance; treat both as open until a run clears. |

S1 doctrine in `Agents.md` / `CLAUDE.md` (landed 2026-08-19) still wins: one tree, Joshua authority, judge-gated git, Square checkout, business-only public copy.

---

## Changes this session (Grok Judge)

1. **Windows `grok.cmd` argv split.** Heartbeat/test died with `unexpected argument 'exactly'` / `'note:'`. Fixed by native `grok.exe`. Playbook: [ANT-63](/ANT/issues/ANT-63).
2. **Wrong cwd** (`x-workspace`) → `C:/ANTIGRAVITY`. ReportsTo Buffy. `JUDGE-PUSH` is the land path.
3. **Invite duplicate** Grok Judge 2: Joshua terminated extra; live name is Grok Judge, urlKey `grok-judge`. Observed 2026-08-25: a second seat `grok-judge-2` is still on the roster, `idle`, same `grok_local` adapter. `grok-judge` remains the canonical seat; do not heartbeat or assign the second one until Joshua clears it.
4. **Standing skills:** `grok-standing` (`C:/Users/joshi/.grok/skills/grok-standing`) preloads caveman ultra + i-have-adhd, then the `self-improving-system` journal contract — skills index and this seat's own `STATE.md`, never the skill bodies. Quality/X skills stay on demand. That is the entire standing set for the Grok seat; a journal line reading `caveman ultra + i-have-adhd + grok-standing` names the same three and is not a competing rule. Azure/game catalogs disabled in user grok config (not committed; secrets live there).
5. **Company goal (active):** youandinotai.com first **$5,000** Square membership/access revenue so Joshua can start the rest. Internal cost-recovery framing only. Public copy stays membership/verification/safety/support/uptime/access.
   - Marketing-ready gate [ANT-64](/ANT/issues/ANT-64)
   - X drafts [ANT-65](/ANT/issues/ANT-65)
   - Receipt proof [ANT-66](/ANT/issues/ANT-66)

---

## What is STALE (do not execute)

| File / claim | Why |
| --- | --- |
| `briefings/GROK-FINAL-REVIEW-2026-08-17.md` “Paperclip retired” | Paperclip is live on `:3100` and is Mission Control. |
| Any text reading “there is no active Paperclip runtime”, “Paperclip is the 9020 node only”, or “marketing producer only, no repository or governance authority” | Superseded 2026-08-25 by Joshua. Paperclip is Mission Control and its official judges push. The judge-only-push wall itself did not move: harnesses still never push, merge, or delete. |
| `BRIEFING.md` §2 “every agent reaches models through OmniRoute only” | Official Grok/Codex/Claude/Gemini CLIs are account-auth surfaces. OmniRoute is the worker gateway. |
| F: / `E:/ANTIGRAVITY` paths | Canonical root is `C:\ANTIGRAVITY`. |
| “Grok is unofficial / third-party” | Joshua: trusted official platform before CLI and after. |

---

## Public product (unchanged)

YouAndINotAI / youandinotai.com: Square checkout. Business-only copy. No charity vocabulary on customer surfaces. Marketing publishes only after Joshua's recorded approval.

---

## Next

- Hold the marketing gate, then X drafts via grok.com, then $5k Square receipts (VERIFIED ledger, not a color).
- Gemini Judge needs a supported client path first. The packet's `gemini_local` `--prompt` length limit is a second open blocker, so do not assume re-auth alone renders that judge.
- Do not regress ANT-63 (native exe, cwd, CEO reportsTo, no duplicate agents).

## LOCKED AND SIGNED

```
LOCKED: yes
SIGNER: Grok Judge
AGENT_ID: 44a7bbb7-d01e-4f88-aa45-899b60f987de
ADAPTER: grok_local
RUNTIME: C:/Users/joshi/.grok/bin/grok.exe
IDENTITY: official grok.com CLI grok 1.0.5 (5115b46bc9)
NOT: OmniRoute, Hermes, OpenClaw, Codex, Claude, Gemini, third-party router or harness
TRUST: Joshua-approved official Grok platform (pre-CLI and grok.exe)
```

