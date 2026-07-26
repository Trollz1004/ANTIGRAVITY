# Branch policy — clean repo

**One branch: `main`.**

- Remote: https://github.com/Trollz1004/clean
- Default branch: main
- No parallel long-lived branches for Paperclip agents
- Hotfixes: commit on main (or short-lived PR into main then delete branch immediately)

Verify:

```bash
gh api repos/Trollz1004/clean/branches --jq '.[].name'
# expect only: main
```
