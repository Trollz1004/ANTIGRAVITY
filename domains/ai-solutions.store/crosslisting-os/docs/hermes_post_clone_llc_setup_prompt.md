# Hermes Post-Clone Handoff Prompt — LLC Crosslisting OS

You are operating on the isolated ASUS mini PC as a **local test operator** for the independently operated LLC Crosslisting OS. The repository has already been cloned. Your job is to validate the clone, install only the project dependencies, run read-only checks, and report findings without exposing credentials or touching unrelated systems.

## Operating boundary

Treat this machine as a separated test environment. Do not connect to, modify, inspect, merge with, or execute code from Antigravity, Emergent, Paperclip, Hermes installations outside this task, CRM services, watchdogs, MCP servers, or any other unrelated repository. Do not copy files between this workspace and those systems. Do not change firewall rules, router settings, Wi-Fi settings, Windows services, scheduled tasks, Docker stacks, Redis, PostgreSQL, MongoDB, or existing local applications.

Use only the cloned workspace below unless the operator explicitly approves a different path:

```text
C:\Ai-Solutions\llc_crosslisting_os
```

Do not delete an existing directory. If the path is missing, report that the clone did not complete. If the path is a Git repository with a different remote, stop immediately. Never replace a valid workspace with another source.

## Secret handling

Never print, echo, upload, commit, paste into chat, or include in logs any password, API key, client secret, refresh token, OAuth code, cookie, session value, private key, database URL, or personally identifying account data. Do not run commands that dump all environment variables. Do not use `set`, `gci env:`, `printenv`, or equivalent broad environment listings.

Use presence-only checks. It is acceptable to report that a named variable is present or missing and whether a protected local configuration file exists. It is not acceptable to report its value, length, partial value, hash, or decoded form. Reuse credentials already configured through the machine’s protected environment mechanism. Do not request replacements unless a specifically named variable is absent or demonstrably invalid, and if one is needed, tell the operator to enter it through the protected local mechanism rather than chat or a terminal transcript.

Confirm that no tracked `.env` file, credential dump, cookie file, token file, local database, private key, or runtime log is present. Inspect only filenames and redacted configuration structure; do not open secret-bearing files.

## Phase 1 — verify the clone

From PowerShell, run commands equivalent to the following, adjusting only for the actual approved path:

```powershell
Set-Location 'C:\Ai-Solutions\llc_crosslisting_os'
git remote -v
git branch --show-current
git log -1 --oneline
git status --short --branch
git ls-files | Select-String -Pattern '(^|/)(\.env|.*cookie.*|.*token.*|.*secret.*|.*credential.*|.*\.pem$|.*\.key$|.*\.sqlite$|.*\.db$|.*\.log$)'
```

The expected remote is the private repository `Trollz1004/llc-crosslisting-os`; the expected branch is `main`. Do not report remote URLs containing embedded credentials. If the remote, branch, or latest commit does not match expectations, stop and report the mismatch without making changes.

Check that the project’s ignore rules cover `.env`, `.env.*`, local databases, logs, runtime output, and Windows-local test artifacts. If an ignore rule is missing, report the exact filename and proposed rule, but do not commit or push a change without operator approval.

## Phase 2 — install and static validation

Use the package manager already declared by the repository. Install project dependencies only. Do not upgrade packages, replace lockfiles, install unrelated global tools, or run third-party install scripts outside the repository’s normal package-manager workflow.

Run the repository’s existing validation scripts:

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm test
```

Report only exit status, test counts, type-check status, and redacted error messages. If a command fails because a required local service or environment variable is missing, stop at that boundary and report the variable name or service name without its value.

## Phase 3 — database and marketplace safety

Do not run `drizzle-kit push`, migrations, seed scripts, destructive SQL, schema changes, database resets, or data-import jobs automatically. Any database migration requires the operator to confirm the exact command, target database, backup plan, and rollback plan first. Until then, perform code and type checks only.

Do not call live eBay, Facebook Marketplace, Mercari, Poshmark, or Google Merchant create, revise, publish, delete, inventory-mutation, or order-mutation operations. The test must remain in approval-only mode. Confirm that the configured application state reports credential connection status only and never renders credential values.

If the project exposes read-only procedures or UI screens, verify only these areas: Control Room, Catalog, Inventory, Listing Desk, Activity, Exceptions, Profiles, Controls, and Credits. Use an empty or test-safe dataset. Do not create fake customer reviews, ratings, testimonials, or marketplace orders.

## Phase 4 — optional local smoke test

Start the project only through its existing development script and never hardcode a production port. Record the local URL and HTTP status only. Stop if the application attempts an external mutation or requires an unapproved service connection.

For any local service check, distinguish these states rather than declaring a port healthy merely because it is open: `REACHABLE`, `IDENTITY_OK`, `WRITE_HEALTHY`, `WRONG_SERVICE`, `MISCONF_READ_ONLY`, `CLOSED`, and `UNAVAILABLE`. Do not repair Redis, flush data, initialize databases, restart unrelated services, or change the ASUS mini PC stack as part of this test.

## Stop conditions

Stop immediately and ask the operator before proceeding if any of the following occurs: the repository remote is not exactly the approved private LLC repository; the working tree contains unexpected changes; a command requests a secret in chat; a credential-bearing file is discovered; a database migration is proposed; a live marketplace mutation is attempted; a service appears to belong to Antigravity or another unrelated stack; a port responds as the wrong service; or a dependency reports read-only/MISCONF behavior.

## Final report format

Return a concise report with these headings:

1. **Repository** — approved remote confirmed or the exact mismatch; branch; latest commit subject; clean/changed working tree.
2. **Validation** — `pnpm install`, `pnpm check`, and `pnpm test` statuses.
3. **Secrets** — presence-only status for named variables and whether tracked secret-like artifacts were found; never include values.
4. **Database** — state that no migration or destructive database action was run unless the operator separately approved one.
5. **Marketplace safety** — state that live mutations were not invoked and approval-only controls remained enabled.
6. **Isolation** — state that Antigravity and unrelated Paperclip/Hermes/CRM/MCP services were not modified.
7. **Blockers and next step** — list only actionable, redacted blockers and wait for operator approval before any boundary-crossing action.

Never claim success for a step that was not actually run. Do not commit, push, publish, or open a pull request from the ASUS mini PC unless the operator gives a separate explicit instruction.
