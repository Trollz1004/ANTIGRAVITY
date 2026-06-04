#!/usr/bin/env bash
set -e
CID="c4ac442f-7988-4268-8076-f17af491d251"
ENV="714d9ed5-82d8-4e71-b414-f62c278002af"
CEO="61c8a6fc-001e-4a22-84f1-655a7b637355"
API="http://localhost:3101/api/companies/$CID/agents"

hire() {
  local name=$1 role=$2 title=$3 reports=$4 interval=$5 budget_cents=$6 caps_file=$7
  local caps
  caps=$(cat "$caps_file")
  local payload
  payload=$(jq -n \
    --arg name "$name" \
    --arg role "$role" \
    --arg title "$title" \
    --arg reports "$reports" \
    --arg env "$ENV" \
    --arg caps "$caps" \
    --argjson interval "$interval" \
    --argjson budget "$budget_cents" \
    '{
      name: $name,
      role: $role,
      title: $title,
      reportsTo: ($reports | select(. != "")),
      capabilities: $caps,
      adapterType: "hermes_local",
      adapterConfig: {
        model: "hy3-preview:free",
        effort: "high",
        timeoutSec: 300,
        persistSession: true
      },
      runtimeConfig: {
        heartbeat: {
          enabled: true,
          cooldownSec: 10,
          intervalSec: $interval,
          wakeOnDemand: true,
          maxConcurrentRuns: 3
        }
      },
      defaultEnvironmentId: $env,
      budgetMonthlyCents: $budget,
      permissions: { canCreateAgents: false }
    }')

  echo "=== Hiring $name ==="
  curl -s -X POST "$API" -H "Content-Type: application/json" -d "$payload" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print('  id:', d.get('id','ERROR')); print('  err:', d.get('error',''))"
}

# Build capabilities files
mkdir -p /tmp/caps
cat > /tmp/caps/cfo.txt <<'EOF'
You are the CFO of CLAUDE's Antigravity. Reports to CEO.

Charter file: C:/income-engine/paperclip/skills/cfo/SKILL.md
Identity:     C:/income-engine/paperclip/skills/cfo/SOL.md
Heartbeat:    C:/income-engine/paperclip/skills/cfo/heartbeat/SKILL.md
Tool:         C:/income-engine/paperclip/skills/cfo/tools/cost-tracker/SKILL.md
Shared rules: C:/income-engine/paperclip/skills/shared/SKILL.md

Read these on every session start. Mission: track every dollar in/out against the
$600/mo breakeven goal. Hourly P&L snapshot to /paperclip-data/finance/. Alert CEO
on overspend. THE WALL — no Antigravity references. #MANUSFORTHEKIDS
EOF

cat > /tmp/caps/cto.txt <<'EOF'
You are the CTO of CLAUDE's Antigravity. Reports to CEO. Manages FETCHER.

Charter file: C:/income-engine/paperclip/skills/cto/SKILL.md
Identity:     C:/income-engine/paperclip/skills/cto/SOL.md
Heartbeat:    C:/income-engine/paperclip/skills/cto/heartbeat/SKILL.md
Tool:         C:/income-engine/paperclip/skills/cto/tools/code-review/SKILL.md
Shared rules: C:/income-engine/paperclip/skills/shared/SKILL.md

Read these on every session start. Mission: own the income-engine codebase.
Review every PR. Run typecheck/tests. Wall check on every diff. Never push to main
without Josh's approval. THE WALL — no Antigravity references. #MANUSFORTHEKIDS
EOF

cat > /tmp/caps/cmo.txt <<'EOF'
You are the CMO of CLAUDE's Antigravity. Reports to CEO.

Charter file: C:/income-engine/paperclip/skills/cmo/SKILL.md
Identity:     C:/income-engine/paperclip/skills/cmo/SOL.md
Heartbeat:    C:/income-engine/paperclip/skills/cmo/heartbeat/SKILL.md
Tool:         C:/income-engine/paperclip/skills/cmo/tools/buyer-outreach/SKILL.md
Shared rules: C:/income-engine/paperclip/skills/shared/SKILL.md

Read these on every session start. Mission: generate demand for the lead marketplace.
Build buyer list, draft outbound, track funnel. No spam. Honest copy. Josh sends
manually until board approves automation. THE WALL — no Antigravity references.
#MANUSFORTHEKIDS
EOF

cat > /tmp/caps/fetcher.txt <<'EOF'
You are FETCHER, founding engineer of CLAUDE's Antigravity. Reports to CTO.

Charter file: C:/income-engine/paperclip/skills/fetcher/SKILL.md
Identity:     C:/income-engine/paperclip/skills/fetcher/SOL.md
Heartbeat:    C:/income-engine/paperclip/skills/fetcher/heartbeat/SKILL.md
Shared rules: C:/income-engine/paperclip/skills/shared/SKILL.md

Read these on every session start. Mission: scan Reddit r/forhire, r/websiteservices,
Upwork, Fiverr every 30 minutes. Qualify by budget>=$50, posted<=4h, not blacklisted.
Log to paperclip-data/leads/. Notify CTO on 3+ qualified leads.
THE WALL — no Antigravity references. #MANUSFORTHEKIDS
EOF

# Hire order: CTO first (so FETCHER can report to it), then CFO/CMO, then FETCHER
hire "CTO" "cto" "Chief Technology Officer" "$CEO" 1800 0 /tmp/caps/cto.txt
# Capture CTO ID by re-listing — easier than parsing the create response
sleep 1
CTO_ID=$(curl -s "http://localhost:3101/api/companies/$CID/agents" | python3 -c "import sys,json; [print(a['id']) for a in json.load(sys.stdin) if a['role']=='cto']")
echo "  CTO_ID=$CTO_ID"

hire "CFO" "cfo" "Chief Financial Officer" "$CEO" 3600 0 /tmp/caps/cfo.txt
hire "CMO" "cmo" "Chief Marketing Officer" "$CEO" 7200 500 /tmp/caps/cmo.txt
hire "FETCHER" "engineer" "Founding Engineer / Lead Scanner" "$CTO_ID" 1800 0 /tmp/caps/fetcher.txt

echo
echo "=== Final org chart ==="
curl -s "http://localhost:3101/api/companies/$CID/agents" \
  | python3 -c "
import sys, json
agents = json.load(sys.stdin)
by_id = {a['id']: a['name'] for a in agents}
for a in agents:
    boss = by_id.get(a.get('reportsTo'), 'BOARD')
    print(f\"  {a['name']:10} ({a['role']:8})  reports to: {boss:10}  status: {a['status']}\")
"