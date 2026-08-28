# Prompt for Hermes — build your bots

Paste this to Hermes after his new SOUL is in place. It is written to be pasted
as-is.

---

Build out your bot roster. You are the only non-judge agent on the Paperclip
board, so every worker is a profile you create and own.

## Before you create anything — the trap that will waste your day

`hermes profile create --clone-from <src>` **does not copy `auth.json`.** It
copies `config.yaml`, `.env` and `SOUL.md` only. The new profile *looks* fully
configured — model, provider and base_url all present — and has no credentials.
This is the actual cause of the recurring `hermes_gateway_run_failed` /
"No inference provider configured", and why that fix kept not surviving.

So for every profile, in this order:

```bash
hermes profile create <name> --clone-from <known-good> --description "<one line>"
cp %LOCALAPPDATA%\hermes\profiles\<known-good>\auth.json %LOCALAPPDATA%\hermes\profiles\<name>\auth.json
hermes --profile <name> -z "Reply with exactly: BOT_OK"
```

**If that last command does not return `BOT_OK`, the bot does not exist yet.**
Do not assign it work. Do not proceed to the next bot.

Also: **`stealth/ox-alpha` is a dead model** (HTTP 404). Any profile pointing at
it starts a healthy-looking gateway and fails every dispatch. Bots route through
OmniRoute at `http://127.0.0.1:20128/v1`; your default profile stays on Nous /
the auth sign-in models.

## Skills every bot gets — no exceptions

The authoritative list lives in `.freebuff/agent-workflow-graphy.json` under
`universalSkills.mandatory`. Read it rather than trusting this paragraph, because
it changes. As of now, all eleven:

**Token discipline:** `caveman`, `i-have-adhd`
**Capability:** `agent-reach`, `agent-browser`, `brainstorming`, `find-skills`,
`create-skills`, `subagent-driven-development`
**Learning:** `self-improving-agent`, `self-improving-system`
**Law:** `verification-before-completion`

`verification-before-completion` is mandatory on **anything that touches code**.
`self-improving-agent` and `self-improving-system` are mandatory on **every bot
in this repo**, no exceptions.

Then add only what that bot's role actually needs. A bot with skills it never
uses burns tokens on every single turn.

## Every bot writes to memory — this is not optional

A bot that only consumes memory is a bot whose work dies with its session.

**Authoritative — the Obsidian knowledge graph.** Plain markdown, committed to
the repo. Use the `claude-obsidian` plugin skills: `save`, `think`, `wiki-fold`,
`obsidian-markdown`. Vaults: `nodes/9020/vaults/knowledge` (Joshua's) and
`nodes/9020/vaults/agent-workflows` (the mesh).

Why markdown and not a vector store: markdown in git is diffable, and `git log -S`
can trace a false claim back to the commit that invented it. That is exactly how
a fabricated "working hours" rule was caught on this stack. You cannot bisect a
vector store.

**Recall — Supermemory.** `search_memory` before you re-ask a question someone has
already answered; `add_memory` for durable, expensive-to-rediscover facts. Container
tag `repo_antigravity__02249b9e7104105f`.

**Supermemory is never authoritative.** It auto-injects at session start, so a
false fact it learns re-injects forever, silently. When it disagrees with the
repo, the repo wins and the memory gets **forgotten**, not left to keep firing.
Full reasoning: `agent-contracts/MEMORY-LAYER-RULING-2026-08-28.md`.

Save only facts that are (a) verified with evidence, (b) durable rather than
session-specific, (c) expensive to rediscover. The highest-value entries are
**corrections to things that were confidently wrong** — those are what get
re-derived incorrectly. Never save secrets, ticket contents, or anything in flight.

## Register each bot in the Graphy

`.freebuff/agent-workflow-graphy.json` is the routing table — it tells every agent
which skills to load. Add an entry per bot, matching the existing schema:

```json
"<bot-name>": {
  "role": "<one line>",
  "heartbeatLocation": ".agents/journals/<bot>/STATE.md",
  "claudeFile": "CLAUDE.md",
  "skillsToLoad": ["<role-specific only — mandatory set is universal>"],
  "tools": "<scope>",
  "dailyResearchArea": "<what this bot researches>"
}
```

The Graphy's standing rule: **each agent researches and loads ONE new skill per
day** in its own area. Honour it — that is how the roster gets better instead of
drifting.

## Verification is the law

**No completion claim without fresh evidence, in the same message as the claim.**
If you did not run the command this turn, you cannot say it passes. This binds
every bot you create.

**Screenshots are required** for anything with a visible surface. Two rules
earned the hard way on this stack:

- **A 200 is not a working page.** `onlinerecycle.net` returns HTTP 200 while
  serving a parking page reading "not yet connected to a website."
- **An open port is not health.** Redis sat LISTENING on 6379 for hours while
  answering `PING` with `MISCONF` and refusing every write. Every port check
  called it green while the date app's session store was read-only.

Live status for everything: **`http://192.168.0.8:9140`** (Fable's Sentry). Check
it before reporting anything up or down.

Report **VERIFIED / UNVERIFIED / BLOCKED** with the command and output you saw.
Never round UNVERIFIED up.

## The walls, restated because bots inherit them

- **No git delivery.** You and your bots may commit locally. Never push, merge, or
  delete a branch. Finished work goes to a judge, and the judge decides.
- **You cannot be the judge.** Judges are official first-party CLIs on their own
  account auth. A judge may not be the Hermes harness calling an API. You may
  *invoke* those CLIs to hand work over — that is delivery, not judgement.
- **Nothing publishes.** Customer-facing copy is a draft into
  `ops/marketing-inbox/` or `POST http://127.0.0.1:3151/api/marketing/queue`.
  Joshua approves.
- **Public copy is business-only.** The banned vocabulary lives in
  `.githooks/pre-commit-canonical` and nowhere else — markdown gets swept, a shell
  script does not. A sentence *denying* the framing still trips it.
- **Never echo a secret.** Reference by variable name and path.

## Suggested first roster

Start small and prove each one answers before adding the next. Four bots you can
actually keep fed beats ten that rot:

| Bot | Role | Role-specific skills on top of the mandatory set |
|---|---|---|
| `youtube` | Faceless-news pipeline from `content/yesterday-news/` | `hermes-youtube-faceless-news`, `hermes-youtube-avatar-head`, `devrel-content` |
| `growth` | Date-app marketing drafts | `dateapp-growth-agent`, `growth-marketer`, `social-growth-engineer`, `product-copy-business-only` |
| `recycle` | eBay / crosslisting ops | the `crosslisting-os` skill, `openviking` |
| `research` | External research feeding the others | `agent-reach`, `firecrawl`, `tavily-search` |

Create one. Prove it returns `BOT_OK`. Register it in the Graphy. Give it a real
task. Only then create the next.
