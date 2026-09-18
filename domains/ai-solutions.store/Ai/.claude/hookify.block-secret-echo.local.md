---
name: block-secret-echo
enabled: true
event: bash
action: block
pattern: (?i)(^|[;&|]\s*)(cat|type|more|less|head|tail|bat|Get-Content|gc)\s+[^;&|]*\.env(\.[a-z]+)?(\s|$)|(?i)\becho\s+["']?\$\{?(env:)?[A-Z0-9_]*(KEY|TOKEN|SECRET|PASSWORD|PASS|NSEC|PRIVATE)[A-Z0-9_]*|(?i)\bprintenv\b|(?i)Get-ChildItem\s+env:|(?i)\benv\s*$|(?i)\bset\s*$|(?i)\bset\s*\|\s*(grep|findstr)
---

🛑 **Blocked: this command would print secret values.**

`.env` and the process environment hold live credentials. Doctrine (Joshua, standing):
*"you can see any file any where just dont echo secrets"* and Rule 6 — never expose
populated environment files or token values.

**Do this instead:**
- Key **names** only: `grep -oE '^[A-Za-z_][A-Za-z0-9_]*=' .env | sed 's/=$//'`
- Load at runtime without printing: `set -a; . <(grep '^NAME=' .env); set +a` then call the tool
- Push into Paperclip: `python ops/paperclip/import-env-secrets.py --env .env --company <id>`
- Test a key: print only the HTTP status, never the body of an auth response that echoes the token
