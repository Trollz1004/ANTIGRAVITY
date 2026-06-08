Show the standard Claude Code workflow for this repo:
1. Branch: `git checkout -b claude/<short-description>`
2. Read briefings/REPOSITORY_RECORD.md before coding
3. Grep for existing implementation before building new
4. Run policy-boundary check before committing
5. Commit style: `type(scope): message` (fix/feat/test/docs/chore/security)
6. Push and open PR on Trollz1004/ANTIGRAVITY (not draft, use mcp__github__* tools)
7. CI must pass all 6 jobs before merge
8. After merge: run `npx graphify hook-rebuild`
