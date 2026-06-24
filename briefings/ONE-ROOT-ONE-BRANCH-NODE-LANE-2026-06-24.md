# One Root, One Branch, Node Lane Rule - 2026-06-24

Joshua directive: ANTIGRAVITY uses one repo, one root, one branch, and one
canonical folder shape across nodes.

## Canonical Code Shape

- Repo: `Trollz1004/ANTIGRAVITY`
- Branch: `main`
- Windows root on every Windows node: `C:\antigravity`
- All production/dev/operator nodes may hold the full repo checkout.
- Node isolation is enforced by runtime role, scheduled tasks, ports, tunnels,
  domains, env, and orchestrator scope.
- Node isolation is not enforced by hiding code, creating sibling repos, using
  long-lived node branches, or maintaining separate roots as active truth.

## Node Lane Rule

Every orchestrator must stay in its assigned lane even though it can see the full
codebase.

- T5500: public date-app runtime, Cloudflare tunnel, Square date-app payment
  flow, Paperclip date-app/support package, OpenClaw support gateway.
- Sabretooth: Codex/Claude/operator work, repo maintenance, marketing/content
  Paperclip work, FCC/Ollama/local model coordination.
- 9020: Hermes Router, ai-solutions/business-exchange runtime, related operator
  checks.

If an orchestrator routes work out of its lane, the fix is to correct or replace
that orchestrator/configuration. The fix is not to create another active repo,
another root, or another branch authority.

## Operational Rule

- Pull `main` before editing shared repo state.
- Keep node checkouts clean and synced to `origin/main`.
- Commit completed repo changes back to `main`.
- Do not use unmerged branches, node-local folders, backup roots, downloads, or
  OneDrive handoff files as active source code.
- OneDrive handoff files can carry context and env inventory, but they are not
  repo source and must not be committed.

