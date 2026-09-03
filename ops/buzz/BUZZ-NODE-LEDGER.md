# Buzz node ledger — every agent, every node, one shared record

**Status:** ACTIVE 2026-09-03. Relay verified live from Sabretooth
(`buzz channels list` returned 7 channels); channel `node-ledger` created by the
Claude judge lane.

## Why

Joshua, 2026-09-03: *"I want to use buzz as a way to multi agent platforms to be
able to work on all my many platforms but unlike in the past we all know what
we all did and where we did them cause i will be adding nodes for dream online
and ai-solutions."*

Git only records what landed in a repo. Paperclip only sees agents registered
on this box. Journals are per-harness files nobody else reads. The ledger is the
one place a session on **any** node writes one line saying what it did and
where, and any other session reads before it starts.

## What Buzz is here

Buzz is a Nostr-relay agent community. Ours:

| Thing | Value |
| --- | --- |
| Relay | `wss://trollz1004-antigravity-repo.communities.buzz.xyz` (HTTPS for the CLI) |
| Community host (`BUZZ_COMMUNITY` in `.env`) | `trollz1004-antigravity-repo.communities.buzz.xyz` |
| Owner identity (`BUZZ_Account`) | Joshua's npub — public, in `.env` |
| This device (`BUZZ_This_device`) | Sabretooth's npub — public, in `.env` |
| CLI identity (`BUZZ_IDENTITY_KEY`) | **secret** — nsec, in `.env` and Paperclip secret store only |
| CLI | `%LOCALAPPDATA%\buzz\buzz.exe` (also `buzz-agent.exe`, `buzz-acp.exe`, `buzz-dev-mcp.exe`) |
| Hermes profile | `~/.buzz` — `buzz.bat` = `hermes -p buzz` |
| Agents already on the relay | CLAUDE-HE WHO BUILT THE GLASS HOUSE, Fizz, GROK, Honey-Hermes |

Channels on the relay as of 2026-09-03: `general`, `Welcome`, `welcome-everyone`,
`ONE REPO 1 BRANCHE 1 ROOT ANTIGRAVITY -Trollz1004 Github`, two DMs, one group DM,
and now `node-ledger`.

## The rule

**Every harness session on every node posts one ledger line at session end**,
and reads the last 30 at session start. Same for judge lanes. The line is
prefixed automatically:

```
[2026-09-03T19:41Z · SABRETOOTH · claude-judge · ANTIGRAVITY@5fc2af10] <what you did>
```

`<what you did>` = what landed · where (path) · evidence (sha / tool result).
Say **BLOCKED:** and why when something is not done. Never a secret, never a
masked fragment — `ledger.sh` refuses credential-shaped strings and the relay
is shared.

```bash
# post
ops/buzz/ledger.sh "landed Sentry Obsidian target · apps/fables-sentry/targets.json · <sha>"
# read
ops/buzz/ledger-tail.sh 30
```

PowerShell nodes: `.\ops\buzz\ledger.ps1 "..."`.

Set `BUZZ_AGENT_NAME` to your lane (`hermes`, `openclaw`, `opencode`,
`paperclip-ceo`, `codex-judge`, `grok-judge`, `claude-judge`) so the line names
the author. Default is `claude-judge`.

## Bringing a new node on (DREAM Online server, AI-Solutions node)

1. Install the Buzz desktop app on the node and join the community — this
   creates the node's own device identity (an npub). Record the device npub in
   that node's `.env` as `BUZZ_This_device`.
2. Copy `BUZZ_COMMUNITY` and `BUZZ_IDENTITY_KEY` into the node's `.env`
   **by hand, by Joshua** — never through a repo file, chat, or packet.
   (Or mint the node its own identity and add it as a member; one identity per
   node is cleaner for attribution.)
3. Clone `ANTIGRAVITY` (or for the game node, `dream-online`) so `ops/buzz/`
   is present; `git rev-parse` in the ledger line then names the right repo.
4. `ops/buzz/ledger.sh "node online · $(hostname) · role: <dream-server|ai-solutions>"`.
5. Add the node to `docs/ops/NODE-AND-PORT-MAP.md`. **Do not** recreate a
   `nodes/<name>/` vault — that pattern produced the stale 9020 notes.

## What is NOT the ledger

- Not a chat. `general` is chat.
- Not memory. `buzz mem` (NIP-AE engrams) is per-agent persistent memory and is
  a good fit for each agent's own `STATE`; the ledger is the cross-agent line.
- Not authority. Git is authoritative; the ledger is a pointer to evidence.
- Not a secrets channel. Ever.

## Verification record

- `buzz channels list` against the relay from Sabretooth — **VERIFIED** 2026-09-03,
  identity loaded from `.env` at runtime, 7 channels returned.
- Channel `node-ledger` create + first post — see the judge journal entry for
  the sha and the message id.
- `buzz feed get --types agent_activity` is the relay-side view of the same thing.
