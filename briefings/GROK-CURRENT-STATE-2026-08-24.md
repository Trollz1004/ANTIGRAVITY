# CURRENT STATE — Grok official lane — 2026-08-24

**Status:** ACTIVE. Internal briefing, not a customer surface.
**Signer:** Grok Judge — official grok.com CLI `grok.exe` 1.0.5 (`5115b46bc9`), adapter `grok_local`.
**Agent:** [Grok Judge](/ANT/agents/grok-judge) `44a7bbb7-d01e-4f88-aa45-899b60f987de`
**Lock:** `ops/paperclip-ceo/GROK-OFFICIAL.lock.md`
**Joshua directive (2026-08-24):** Grok is an approved trusted AI platform even before the grok CLI existed. Official grok.com account-auth remains the Grok surface. Not a third-party router or harness. OmniRoute is the worker gateway, not the judge/X model lane.

This file supersedes `briefings/GROK-FINAL-REVIEW-2026-08-17.md` (STALE) wherever that review assumed Paperclip retired, F: paths, or OmniRoute as the only model surface for Grok.

---

## Trusted platform (non-negotiable)

- **Joshua** is sole human authority.
- **Grok** is a trusted official platform for this repo and for Paperclip marketing/judge work. That trust predates `grok_local` / `grok.exe`. The CLI is the current official way Grok runs heartbeats; it does not create the trust.
- **Freebuff** is the GUI and the free API for ads that play in it. Free is always good. Buffy is CEO because she **assigns**.
- **Pipeline:** Buffy assigns → Hermes / OpenClaw / OpenCode do the work (no git push) → official CLI judges review → if APPROVE, judges may push, merge, or delete branches **only** to keep **1 repo · 1 root · 1 branch** (`Trollz1004/ANTIGRAVITY`, `C:\ANTIGRAVITY`, `main`).
- Official judge CLIs: Grok, Codex, Claude (last resort / DREAM), Gemini (GCA currently BLOCKED). Land via `JUDGE-PUSH <full-sha>`. Never force-push. Never create feature branches.
- Workers (Hermes, OpenClaw, OpenCode, Buffy HTTP adapter) do not push. They do not route official-platform ballots or Grok X.com posts through OmniRoute.
- **X.com exclusive:** only Grok (X Marketing + Grok Judge) may use anything associated with X.com. Official X Developer API is the limited/billed path; grok.com native X tools are the higher-rate first-party path. Playbook: `ops/paperclip-ceo/X-GROK-STRATEGY.md`.

---

## Canonical topology (VERIFIED 2026-08-24)

| Fact | Evidence |
| --- | --- |
| One root | `C:\ANTIGRAVITY` |
| One branch | `main` |
| One remote | `Trollz1004/ANTIGRAVITY` |
| Paperclip | `http://127.0.0.1:3100` identity `local_trusted` version `2026.817.0` — **marketing and business ops only**. Not repo authority. |
| Buffy CEO | `buffy-ceo` `http` adapter, 30s heartbeat, bridge `:3140` |
| Grok Judge | `grok-judge`, `cwd=C:/ANTIGRAVITY`, `command=C:/Users/joshi/.grok/bin/grok.exe`, model `grok-4.6` |
| X Marketing | `x-marketing-grok`, same grok.exe, grok.com native X tools, drafts to `ops/marketing-inbox/` |
| Codex / Claude judges | `idle`, `cwd=C:/ANTIGRAVITY` |
| Gemini Judge | `error` — GCA key missing (BLOCKED) |

S1 doctrine in `Agents.md` / `CLAUDE.md` (landed 2026-08-19) still wins: one tree, Joshua authority, judge-gated git, Square checkout, business-only public copy.

---

## Changes this session (Grok Judge)

1. **Windows `grok.cmd` argv split.** Heartbeat/test died with `unexpected argument 'exactly'` / `'note:'`. Fixed by native `grok.exe`. Playbook: [ANT-63](/ANT/issues/ANT-63).
2. **Wrong cwd** (`x-workspace`) → `C:/ANTIGRAVITY`. ReportsTo Buffy. `JUDGE-PUSH` is the land path.
3. **Invite duplicate** Grok Judge 2: Joshua terminated extra; live name is Grok Judge, urlKey `grok-judge`.
4. **Standing skills:** `grok-standing` → caveman ultra + i-have-adhd; quality/X skills on demand. Azure/game catalogs disabled in user grok config (not committed; secrets live there).
5. **Company goal (active):** youandinotai.com first **$5,000** Square membership/access revenue so Joshua can start the rest. Internal cost-recovery framing only. Public copy stays membership/verification/safety/support/uptime/access.
   - Marketing-ready gate [ANT-64](/ANT/issues/ANT-64)
   - X drafts [ANT-65](/ANT/issues/ANT-65)
   - Receipt proof [ANT-66](/ANT/issues/ANT-66)

---

## What is STALE (do not execute)

| File / claim | Why |
| --- | --- |
| `briefings/GROK-FINAL-REVIEW-2026-08-17.md` “Paperclip retired” | Paperclip is live for marketing/ops on `:3100`. Scope limited. |
| `BRIEFING.md` §2 “every agent reaches models through OmniRoute only” | Official Grok/Codex/Claude/Gemini CLIs are account-auth surfaces. OmniRoute is the worker gateway. |
| F: / `E:/ANTIGRAVITY` paths | Canonical root is `C:\ANTIGRAVITY`. |
| “Grok is unofficial / third-party” | Joshua: trusted official platform before CLI and after. |

---

## Public product (unchanged)

YouAndINotAI / youandinotai.com: Square checkout. Business-only copy. No charity vocabulary on customer surfaces. Marketing publishes only after Joshua's recorded approval.

---

## Next

- Hold the marketing gate, then X drafts via grok.com, then $5k Square receipts (VERIFIED ledger, not a color).
- Gemini GCA re-auth before that judge can render.
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

