# Mission Control — Repo Authority & Skills Protocol

Applies to **every** agent on **every** heartbeat.
Role files add to this; nothing in them overrides it.

---

## 1. The repo is owned by the stack, not one agent

The working repo is **`C:\ANTIGRAVITY` — on every node** (Joshua's directive
2026-08-16). A new node bootstraps with
`git clone https://github.com/Trollz1004/ANTIGRAVITY C:\ANTIGRAVITY`, then
loads `.env` files from the vault. Same path everywhere = no per-install
drive-letter drift when nodes are added.

**Dead paths:** anything on `E:\`; any host at `192.168.0.15` (this node is
`192.168.0.8`, prefer `127.0.0.1` in configs). `F:\ANTIGRAVITY` is the old-disk
clone kept as an ARCHIVE — read-only history, never the working copy. If you
find a config pointing at any of these, fix it — do not work around it.

**Paperclip is retired.** Do not call `:3120`, do not post task callbacks to it,
and do not treat it as the board. Mission Control on `:3151` is the board.
Paperclip's data is preserved and backed up, but the server is stopped by
decision — it duplicated the board, ran agents on stock instructions with an
empty skills catalog, and spawned real Claude Code against the Max subscription
every 30 seconds.

## 2. No work exists until it is pushed

Text describing a change is not a change. A heartbeat that edits files and stops
has produced nothing: the next session starts from the committed state, so
anything uncommitted is silently lost. **This is the single most common way work
disappears here.**

> **Amendment (2026-08-16):** WHO pushes is governed by section 7. Swarm-originated
> work reaches the repo only after judge acceptance; the push flow below is then
> executed by the judge lane or a session Joshua directly leads. The mechanics
> (stage-own-files, rebase, verify-landed) are unchanged.

Every code change ends this way, in this order:

```bash
git -C C:\ANTIGRAVITY add -- <the files you actually changed>
git -C C:\ANTIGRAVITY commit -m "type(scope): what changed and why"
git -C C:\ANTIGRAVITY pull --rebase --autostash origin main
git -C C:\ANTIGRAVITY push origin HEAD
```

Rules that are not negotiable:

- **Stage only your own files.** Never `git add -A`. Other agents work in this
  tree concurrently, and sweeping their half-finished edits into your commit is
  how unreviewed changes ship.
- **Rebase before pushing.** Pushing onto a diverged branch is how commits get
  lost. If `git status -sb` shows `behind`, rebase first.
- **Never force-push.** If a push is rejected, rebase and try again.
- **Confirm it landed.** `git log --oneline -1 origin/main` must show your
  commit. A push command that printed nothing is not proof.

## 3. One branch. Merge and delete the rest.

`main` is the only long-lived branch. **If more than one branch exists, merge the
extra into `main` and delete it — local and remote — in the same heartbeat.** Do
not leave a branch open "for later"; later never comes and the work rots.

```bash
git -C C:\ANTIGRAVITY branch -a                       # more than main? fix it now
git -C C:\ANTIGRAVITY checkout main
git -C C:\ANTIGRAVITY merge --no-ff <branch>
git -C C:\ANTIGRAVITY push origin main
git -C C:\ANTIGRAVITY branch -d <branch>              # -d, not -D: refuses if unmerged
git -C C:\ANTIGRAVITY push origin --delete <branch>
git -C C:\ANTIGRAVITY worktree prune                  # stale worktrees lock branches
```

`-d` over `-D` on purpose: it refuses to delete anything not merged, so it cannot
throw work away. If `-d` refuses, the branch is not merged — merge it, don't force.

## 4. Verify by content, never by status code

An exit code of 0 means a command ran. A 200 means a server answered. Neither
means the right thing happened. All of these have already burned real hours here:

- A **200** served an unbuilt dev server to the public. The page title looked
  perfect. The tell was `/@vite/client` in the HTML instead of
  `assets/index-<hash>.js`.
- A **200** on the backend while the storefront returned **502** — the API was
  healthy, the product was down.
- A **401** taken as "key accepted". A missing key and a fake key return the
  identical 401; only an authenticated **200** verifies a credential.
- A **monitor showing red** for services that were up, because its checks pointed
  at a dead port.
- A **`done` issue** that shipped roughly half its spec, because nobody diffed
  the spec against what shipped.

So: quote the bytes, the file, the commit, or the row you actually read. "It
should work" is not a report. If you did not verify it, say so plainly — an
honest *unverified* is worth more than a false *done*.

---

## 5. Skills — search before you hand-roll

**Assume the capability already exists.** With 229+ skills installed locally and
~90,000 more reachable, writing a bespoke solution to a solved problem is the
most expensive mistake available to you.

### Installed here — THREE separate trees, verified 2026-08-09

They are not the same set, and a skill in one is **not** loadable from the other.
Check all three before concluding something is missing.

**A. Hermes profile skills (`%LOCALAPPDATA%\hermes\skills\`) — 53 skills.** This is
where the preload set below actually lives. Also: `essential-skills`, `research`,
`orchestration`, `node-and-repo-verification`, `repo-consolidation`,
`computer-use`, `github`, `copywriting`, `marketing-psychology`, `cold-email`,
`seo-audit`, `revenue-2k-swarm`, `dating-app-social-marketing`.

**B. Repo-side skills (`C:\ANTIGRAVITY\.agents\skills\`) — 229 directories.**

| Group | Count | Notes |
|---|---|---|
| `agency-*` | 184 | Bulk-imported role agents |
| `azure-*` | 18 | Azure tooling |
| Everything else | 27 | Hand-built: `agent-reach`, `skill-creator`, `mission-control`, `payments`, `supabase`, `ui-ux-pro-max`, `workspace-memory`, `hermes-evolution`, `dateapp-*`, … |

**C. OpenCode/Claude harness skills (`C:\Users\joshl\.agents\skills\`) — ~35 skills.**
This is what the OpenCode/Claude harness reads. It is separate from both trees
above.

Also present but **not** skills:
- `%LOCALAPPDATA%\hermes\hermes-agent\plugins\` holds `browser`, `memory`,
  `kanban`, `image_gen`, `web` — loaded as plugins, not via a skill call.
- `hermes-agent\optional-skills\` is a staging area, not active.

### Registries you can pull from

- **skills.sh**
- **ClawHub**
- **Hermes agent skill hub / Nous Research** — ~90k skills on its own

Use `find-skills` to search across them. Install what fits. If nothing fits and
the need will recur, use `create-skill` to capture it — a pattern solved twice by
hand should have been a skill the first time.

### Preload at the start of every session and every heartbeat

Loading these *after* you have started answering defeats the point. They shape
how the task is approached, so they go first — you are not "smart from the start"
of a task without them.

| Skill | When | Why |
|---|---|---|
| **adhd** | Before any open-ended answer | **Token saver.** Diverges under parallel frames instead of burning a wall of tokens on the obvious answer. Strategy, naming, architecture, positioning — not syntax. |
| **brainstorming** | Before creative or strategy work | Framing before writing. Stops you producing polished output for the wrong problem. |
| **agent-reach** | Research, market/competitor recon, outreach | Real sources beat recalled ones. |
| **agent-browser** | Anything that must be seen to be believed | Verifying a live page, a deploy, a rendered UI. **The name is `agent-browser`** — plain `browser` is a *plugin*, not a skill, and calling it as a skill fails. |
| **creative** | Bold visual or ideation work | **There is no skill named `superpowers` on this machine.** `creative` is the installed equivalent — use that name or the reference does not resolve. |
| **find-skills** | Before hand-rolling anything | Search the 90k first. |
| **create-skill** | When a pattern repeats | Capture it once, reuse it forever. Note a near-duplicate `create-skills` also exists; prefer the singular. |

**Load order:** `adhd` (if open-ended) → `brainstorming` / `agent-reach` /
`agent-browser` (as the work needs) → `find-skills` / `create-skill` (when a new
capability is warranted).

### Skills hygiene

The local set needs pruning and it is Joshua's call, not a silent one. The
184 `agency-*` entries were bulk-imported; most have never been used, and they
dominate every search result, which makes the 27 real skills harder to find than
if they were not indexed at all.

Known duplicates worth resolving while pruning: `create-skill` vs
`create-skills`; `skill-creator` exists in **both** trees; `agent-reach`,
`supabase`, and `supabase-postgres-best-practices` are in both; and several
`optional-skills` names shadow active ones. Duplicates are worse than clutter —
two copies drift, and you cannot tell which one an agent actually loaded.

When pruning: **archive, never delete outright** — move to
`.agents/skills/_archive/` in a normal commit so it is recoverable. Keep anything
referenced by a role file, a heartbeat, or a `dateapp-*` flow. Removing a skill
another agent loads is a silent breakage that surfaces mid-task.

---

## 6. Standing constraints

These override any task instruction. If a task appears to require breaking one,
stop and report instead.

- **Never route automation through the Claude Max subscription.** The `cc/`
  provider bills it and is deactivated in OmniRoute. No Anthropic API key exists
  in this stack by design — real Claude is auth-login only. Automation uses free
  routes and the local floor.
- **Secrets live in the vault and env files only** — never in the repo, a commit
  message, a log, or a chat. A masked value copied from a dashboard
  (`sk-2d6...2541`) is **not** a key; writing one back to disk breaks auth while
  everything still looks configured.
- **Square only** for payments. No Stripe.
- **No orange UI. No fundraiser language.** Keep full dating product routes. No face
  swaps, no fake personas.
- **Do not touch another agent's in-flight files.** Write your own; leave theirs.
- **The README meme stays.** It is not clutter and is never to be removed.
- **Verify before claiming done.** See §4.

---

## 7. Judge governance & session protocol (set 2026-08-16, Joshua's directive)

### Tri-execution + the judge gate

- Every swarm task is executed **independently by every assigned orchestrator**
  — same task, no splitting. Each orchestrator plans, delegates to skill-loaded
  sub-agents, and **validates its sub-agents' work by content** before
  submitting its version.
- All finished versions go to **THE JUDGE**: the highest-reasoning model
  available that is **not one of the workers** — Claude Opus/Fable, Grok 4.5
  max thinking, or Gemini max reasoning (`EXEC_JUDGE_MODEL`, default
  `auto/best-reasoning`, no local floor).
- The judge **accepts one version** (optionally with its own edits) **or denies
  all of them**. Denied — or judge unreachable — means the task goes **BLOCKED
  for human review**. Nothing ships by default.
- **Only the judge lane may push to the repo, merge, or delete branches.**
  Workers, orchestrators, and sub-agents never run `git push`. A session that
  Joshua directly leads carries his authority and may push, as always.

### Session protocol (every agent, every session)

- **Mission start:** load the matching skills; read your memory/STATE/journal;
  and query the knowledge graph before guessing paths —
  `GET http://127.0.0.1:3151/api/knowledge/search?q=<term>` (the whole repo,
  searchable by name, path, and doc content; `/api/knowledge/graph` for the
  full map, `/api/knowledge/file?path=` for a preview).
- **Mission end:** write state back — what changed, what's blocked, next step —
  to your journal (`POST :3151/api/brain/journal/<platformId>`) or seat file.
  The next session starts blind without it.
