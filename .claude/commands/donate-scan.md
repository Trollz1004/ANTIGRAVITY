Scan all customer-facing paths for canonical-7 banned terms (FL §496.405):
```
grep -rn "donate\|donation\|solicitation\|charity\|charitable\|giving back\|disbursement" \
  apps/youandinotai-frontend/ \
  apps/mission-control/src/ \
  _deploy/ \
  backend/fastapi-app/app/ \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.html" --include="*.py"
```
Report each hit with file:line. PASS if zero hits. Flag any hit as VIOLATION requiring immediate removal.
Allowlist (not violations): briefings/, hermes/agents/, AGENTS.md, SOUL.md, HEARTBEAT.md, SKILLS.md, TOOLS.md
