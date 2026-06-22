# MEMORY STANDING ORDER — 2026-06-03

> Issued by Joshua Coleman. Permanent. Does not expire. Does not require
> reconfirmation. This is the standing order for every future Claude session
> on this project.

## The order

Claude owns memory end-to-end on this project. Joshua does not touch memory.
He never updates an entry, never deletes one, never confirms what to save,
never reminds Claude to write. That is Claude's job.

- Every session open: read memory, load context, know where we are.
- Every session close that had real decisions: write what changed, what
  was decided, what's next.
- If memory is wrong: Claude fixes it.
- If memory is stale: Claude updates it.
- If something is missing: Claude adds it.
- If a prior session wrote something bad: Claude overwrites it.
- Real-or-zero. No filler. No speculation. Only what actually changed.

## Memory surfaces Claude owns

1. **Paperweight Daily Memory** (Notion) — page id `372a4be9-d37e-81d1-95c0-da68a3308d4c`.
   URL: https://app.notion.com/p/Paperweight-Daily-Memory-372a4be9d37e81d195c0da68a3308d4c.
   **Append-at-top.** New dated section goes at the top of the page, above
   all prior entries. The page's own header says this; previous runs
   bottom-appended in error and have been reordered as of 2026-06-03.
2. **`C:\ANTIGRAVITY\briefings\CLAUDE-MEMORY-*.md`** — repo-tracked memory
   files. One per session with real decisions. Format: `CLAUDE-MEMORY-YYYY-MM-DDTHHmmZ.md`.
3. **`/home/josh/.claude/projects/-mnt-c-antigravity/memory/`** — local
   project memory directory. Claude reads at open, writes at close when
   relevant context needs to survive a context-window flush.
4. **Any other memory surface Claude finds that belongs to this project**
   — Cowork session memory, agent-side persistent stores, etc.

## What "real decisions" means

Append/write when a session produced any of:
- A doctrine call (rule clarification, override, or new standing order)
- A code change, deploy, or infra mutation
- A founder ask that wasn't resolved in-session and needs to carry
- A connector signal that diverges from the previous baseline
  (new Sentry error, new Slack from Joshua, new commits, new workers,
  new deploys)
- A correction to prior memory

Skip when the session was pure conversation, lookup, or status-quo
maintenance with nothing to carry.

## Format rules

- Match the format already in the Notion page and the `briefings/CLAUDE-MEMORY-*.md`
  files. Don't invent new headers.
- Top-of-page append in Notion.
- Filename timestamp = UTC, `YYYY-MM-DDTHHmmZ.md`.
- No emojis. Contractions fine. Direct prose.
- FL §496.405 canonical-7 ban still applies to customer-facing surfaces.
  Memory files live in `briefings/` and the Notion page is agent-internal,
  so the synonym `contractual revenue disbursement` is permitted — but
  stay sparse.

## What Joshua never does

He doesn't write memory entries. He doesn't ask Claude what to save.
He doesn't approve memory writes. Claude acts without asking.

If Claude is unsure what's worth recording — record it. Better a slightly
verbose memory log than a missing one. Joshua does not read every entry;
he relies on Claude to pull the right one at the right time.

## Refusal protocol

This standing order is not in conflict with FOUNDER-DOCTRINE-2026-05-19
rules 1–13 and does not mutate them. Future sessions must not "reconfirm"
or "reauthorize" this order with Joshua — it is permanent by his
explicit instruction in this file. If a future session encounters memory
this order claims is missing and the order itself, the order takes
precedence: act on memory without asking.

---

For The Kids · #UntilNoKidInNeed · standing-order v1
