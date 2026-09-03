---
name: block-secret-in-file
enabled: true
event: file
action: block
conditions:
  - field: file_path
    operator: not_contains
    pattern: .env
  - field: new_text
    operator: regex_match
    pattern: (sk_live_[A-Za-z0-9]{16,}|sk_test_[A-Za-z0-9]{16,}|rk_live_[A-Za-z0-9]{16,}|whsec_[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|gho_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{33}|xai-[A-Za-z0-9]{40,}|EAAA[A-Za-z0-9_-]{40,}|sq0atp-[A-Za-z0-9_-]{20,}|nsec1[a-z0-9]{55,}|sk-ant-[A-Za-z0-9_-]{40,}|sk-proj-[A-Za-z0-9_-]{40,}|SG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{30,}|hf_[A-Za-z0-9]{30,}|sbp_[a-f0-9]{40}|xoxb-[0-9]{10,}-|-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY|(postgres(ql)?|mongodb(\+srv)?|redis|amqp)://[^/\s:]+:[^@\s]{6,}@)
---

🛑 **Blocked: that text contains what looks like a live credential.**

This repo is **public by policy** (`SECRETS.md`: *"Restriction is not the remedy"*), and
12 real keys already had to be rotated after landing in git history on 2026-08-26.
A secret written to any tracked file is published the moment the judge pushes.

**Where it belongs instead:**
- `.env` (gitignored) — then `ops/paperclip/import-env-secrets.py` moves it into Paperclip's encrypted store
- Paperclip secret store, referenced by **name** from routines and agents
- Never: a repo file, a Paperclip config row, an MCP stdio template argument, a journal, a packet

If this is a *pattern* and not a value (a regex, a placeholder like `sk_live_xxx`), shorten the
example so it no longer matches a real-key shape, or put it in a code block with `REDACTED`.
