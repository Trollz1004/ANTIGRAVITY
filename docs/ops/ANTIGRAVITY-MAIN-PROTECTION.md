# ANTIGRAVITY `main` Branch Protection Contract (Matching `dream-online`)

## 1. Purpose

Enforce identical repository-ruleset guarantees on `Trollz1004/ANTIGRAVITY` (`main`) and `Trollz1004/dream-online` (`main`):

- **Pull requests only**: no direct pushes to `main` (`pull_request` rule required).
- **Merge commits only**: `allowed_merge_methods: ["merge"]` (no squash or rebase merges that drop per-commit `Authored-by:` trailers).
- **No force push**: `non_fast_forward` rule active.
- **No branch deletion**: `deletion` rule active.
- **Zero bypass actors**: `bypass_actors: []` (`current_user_can_bypass: "never"`).
- **Required status checks**: repository-specific CI gates must pass before merge.

> **Authority boundary**: Agent lanes inspect and verify branch rulesets read-only. Only the Judge lane (or repository owner) runs `-Apply` to mutate GitHub repository settings.

---

## 2. Live Ruleset Audit (2026-11-16)

| Property | `Trollz1004/dream-online` | `Trollz1004/ANTIGRAVITY` |
| --- | --- | --- |
| Ruleset ID | `24055763` | `23633706` |
| Name | `main: tests before merge` | `main-quality-gate` |
| Enforcement | `active` | `active` |
| Target | `branch` | `branch` |
| Ref Condition (`include`) | `["~DEFAULT_BRANCH"]` | `["refs/heads/main"]` (canonicalized to `["~DEFAULT_BRANCH"]`) |
| Bypass Actors | `[]` (`never`) | `[]` (`never`) |
| Block Deletion (`deletion`) | Enabled | Enabled |
| Block Force Push (`non_fast_forward`) | Enabled | Enabled |
| Require Pull Request (`pull_request`) | Enabled (`allowed_merge_methods: ["merge"]`) | Enabled (`allowed_merge_methods: ["merge"]`) |
| Unattributed Change Extra Approval | `true` | `true` |
| Required Status Checks | `Local smoke and contract checks`, `Engine headless suite` | `quality-gate`, `doctrine-check`, `guardian-check`, `Scan for forbidden patterns` |

---

## 3. Canonical Ruleset Payload for `Trollz1004/ANTIGRAVITY` (`23633706`)

```json
{
  "name": "main-quality-gate",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "deletion"
    },
    {
      "type": "non_fast_forward"
    },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "required_reviewers": [],
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "require_extra_approval_for_unattributed_changes": true,
        "allowed_merge_methods": ["merge"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          { "context": "quality-gate" },
          { "context": "doctrine-check" },
          { "context": "guardian-check" },
          { "context": "Scan for forbidden patterns" }
        ]
      }
    }
  ]
}
```

---

## 4. Exact `gh api` Commands

### Read-Only Audit (Default)

```powershell
# Inspect dream-online reference ruleset
gh api repos/Trollz1004/dream-online/rulesets/24055763

# Inspect ANTIGRAVITY main ruleset
gh api repos/Trollz1004/ANTIGRAVITY/rulesets/23633706

# Run the scripted audit + dry-run command printer
powershell -NoProfile -ExecutionPolicy Bypass -File ops\github\protect-antigravity-main.ps1
```

### Judge-Only Enforcement (`-Apply`)

```powershell
# Apply canonical ruleset 23633706 on Trollz1004/ANTIGRAVITY (Judge only)
powershell -NoProfile -ExecutionPolicy Bypass -File ops\github\protect-antigravity-main.ps1 -Apply
```

Under the hood, `-Apply` writes the canonical JSON payload to a temporary file and runs:

```powershell
gh api --method PUT repos/Trollz1004/ANTIGRAVITY/rulesets/23633706 --input $PayloadPath
```
