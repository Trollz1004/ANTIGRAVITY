# TOOLS.md — THE TOOL SURFACE
What agents may use, and how. Anything not here needs Josh.

## MODEL ACCESS
One path: OmniRoute API `http://127.0.0.1:20129`, credential `OMNIROUTE_KEY`.
No provider SDKs. No direct API calls. No `ANTHROPIC_BASE_URL` set globally.

## SKILL ACCESS
- `skillbrain` MCP server — search, load one, create. Tools: `skillbrain_search`, `skillbrain_get`, `skillbrain_list`, `skillbrain_create_skill`, `skillbrain_roots`.
- `npx skills find <query>` and `npx skills add <repo>` — install from https://www.skills.sh/
- Shelf: `E:\ANTIGRAVITY\.agents\skills\`
Load what the task needs. Drop it after. Never preload the shelf.

## BROWSER
- `agent-browser` skill. Cookie-sync ON for every scrape and every non-API post.
- Playwright-class automation for anything without an API.
- Human cadence rules live in the `human-posting` skill. Load it before posting.
- Never cold-login per action. Reuse the synced session.

## POSTING ROUTES
| Surface | Agent | Path |
|---|---|---|
| X / x.com | Grok | xAI API |
| Facebook · Instagram · Threads | Manus | Manus API or Manus browser extension |
| Everything without an API | Opus / claude.ai | `agent-browser` |
Post only URLs from Josh's approved-links document. Never invent a URL.

## COMPUTE DISPATCH
Heavy or self-hosted-model work goes to a node: T5500 192.168.0.15 · Sabretooth 192.168.0.8 · 9020 192.168.0.5.
Confirm the node answers before queueing. The laptop dispatches; it does not compute.

## GIT
- Repos: `Trollz1004/ANTIGRAVITY` · `Trollz1004/command-center`. Branch `main`.
- Work on `ai/<agent>/<task-slug>`. Open a PR. Josh merges.
- Signed commits. Never `--no-verify`, `--no-gpg-sign`, or `--force`.
- Every session that changes files: commit, push, verify on GitHub. Never leave the repo ahead of origin.
- Secrets never enter the repo. `.env*` gitignored. Confirm with `git check-ignore` before adding.

## SHELL
- Never elevated.
- Never a global find-and-replace across a dependency tree.
- Kill by port then PID.

## ESCALATION
Anything that would break a law in SOUL.md: refuse, log, tell Josh. Do not creatively comply.
