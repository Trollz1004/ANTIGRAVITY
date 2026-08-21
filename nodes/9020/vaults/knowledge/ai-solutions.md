---
name: ai-solutions
description: AI Solutions product line - source locations, enterprise repo, and the untracked-app finding
type: project
created: 2026-08-21
---

# ai-solutions

AI Solutions is the third product line marketed by [[node-9020]] (with [[youandinotai]] and [[dream-online]]): direct utility and software tools, sold alongside [[business-exchange]].

## Where the source actually is (2026-08-21 correction)

- Local source lives INSIDE the antigravity repo: `C:/node-workloads/9020/antigravity-repo/antigravity` (remote `github.com/trollz1004/antigravity.git`, branch `deploy/ai-solutions-store-paypal-cashapp`, last commit 2026-06-24) - at `apps/ai-solutions-exchange` and `scripts/ai-solutions-store`.
- **`apps/ai-solutions-exchange/` is UNTRACKED** in that repo - the app is committed nowhere locally. Treat as unversioned source: never delete, commit before touching.
- Canonical repo per Josh: on the **trollz1004 business/enterprise GitHub** (not verifiable from this host - no gh CLI, probes had no access). Location stated 2026-08-21, unverified.
- `income-engine` source is NOT missing after all (corrected later 2026-08-21): it lives at `antigravity/income-engine/` inside the same repo - with its own `graphy/`, `paperclip/`, `agents/` dirs and a `UNIVERSAL-MEMORY-PROMPT.md` (prior art for the 9020 substrate). The old placeholder README was wrong.
- Additional full ANTIGRAVITY copies: quarantined (`_node-quarantine-20260612-210751/ANTIGRAVITY`, own .git) and OneDrive Personal Vault-Laptop.

## Scope boundary

The antigravity repo contains payment/deploy code (the paypal-cashapp branch). Per the 2026-08-21 directive, payment mechanics must NEVER enter the 9020 marketing agents' context - marketing references the product only. See [[marketing-pipeline]].

## Related

- [[marketing-pipeline]]
- [[business-exchange]]
- [[node-9020]]
- [[Home]]
