# Repository Branch Audit — Finished Branch Cleanup (2026-11-26)

Josh ordered on 2026-11-26 at 22:20 ET: "delete any branches not needed".
One-off exception to rule 7 in RULES.md for branches only, in Trollz1004/ANTIGRAVITY only.

## Deleted Branches (22 branches)

Verified that all PRs associated with each branch were merged or closed with no open PRs:
1. `ai/inbox/b7-recycle-device-posts-three`
2. `ai/inbox/b8-recycle-devices-four`
3. `ai/inbox/b26-onlinerecycle-booking-timezone-slots-city`
4. `ai/inbox/b27-onlinerecycle-booking-phone-sms-inquiry-guard`
5. `ai/inbox/b32-onlinerecycle-crawlable-spincards-cookie-banner`
6. `ai/inbox/blog-recycle-20261125-0610`
7. `ai/inbox/blog-recycle-20261126-0610`
8. `ai/inbox/f1b-search-fixes-green`
9. `ai/inbox/f4b-vault-measure-only`
10. `ai/inbox/f7-rebase-550-553`
11. `ai/inbox/f8-recycle-towns-four`
12. `ai/inbox/g1-funding-recycle-drafts`
13. `ai/inbox/hb2-house-block-antigravity`
14. `ai/inbox/pr361-eyes-notes`
15. `ai/inbox/pr364-badge-script-and-dotfiles`
16. `ai/inbox/pr371-payment-accounts-and-prices`
17. `ai/inbox/s1-recycle-meta-descriptions`
18. `ai/inbox/scrub-agent-journals-antigravity`
19. `ai/inbox/truth-sweep-antigravity-products`
20. `ai/inbox/02-crosslister-local-storage`
21. `claude/finalize-stage-b8-stray-master`
22. `feat/dreamforge-full-site`

## Kept Branches (9 branches)

1. `ai/inbox/tw1-fold-towns` — KEPT (PR #571 open)
2. `dependabot/pip/backend/certifi-2026.10.18` — KEPT (PR #621 open)
3. `dependabot/pip/crm/backend/certifi-2026.10.18` — KEPT (PR #618 open)
4. `dependabot/pip/crm/backend/filelock-4.2.1` — KEPT (PR #617 open)
5. `dependabot/pip/crm/backend/litellm-1.109.0.dev1` — KEPT (PR #619 open)
6. `dependabot/pip/crm/backend/pyasn1-0.6.5` — KEPT (PR #616 open)
7. `dependabot/pip/crm/backend/pymongo-4.18.3` — KEPT (PR #620 open)
8. `main` — KEPT (default branch)
9. `sabretooth/hermes-opsis-sync` — KEPT (no shared history with main; Josh decides)

## Verification Output

Command: `gh api --paginate 'repos/Trollz1004/ANTIGRAVITY/branches?per_page=100' --jq '.[].name'`

```text
ai/inbox/tw1-fold-towns
dependabot/pip/backend/certifi-2026.10.18
dependabot/pip/crm/backend/certifi-2026.10.18
dependabot/pip/crm/backend/filelock-4.2.1
dependabot/pip/crm/backend/litellm-1.109.0.dev1
dependabot/pip/crm/backend/pyasn1-0.6.5
dependabot/pip/crm/backend/pymongo-4.18.3
main
sabretooth/hermes-opsis-sync
```
