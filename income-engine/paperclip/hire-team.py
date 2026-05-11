#!/usr/bin/env python3
"""Register CTO, CFO, CMO, FETCHER as agents in CLAUDE's Antigravity Paperclip."""
import json
import urllib.request
import urllib.error
import time

CID = "c4ac442f-7988-4268-8076-f17af491d251"
ENV = "714d9ed5-82d8-4e71-b414-f62c278002af"
CEO = "61c8a6fc-001e-4a22-84f1-655a7b637355"
API = f"http://localhost:3101/api/companies/{CID}/agents"


def post(payload):
    req = urllib.request.Request(
        API,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code}: {e.read().decode()[:300]}"}


def list_agents():
    with urllib.request.urlopen(f"http://localhost:3101/api/companies/{CID}/agents") as r:
        return json.load(r)


def hire(name, role, title, reports_to, interval_sec, budget_cents, capabilities):
    payload = {
        "name": name,
        "role": role,
        "title": title,
        "reportsTo": reports_to,
        "capabilities": capabilities,
        "adapterType": "hermes_local",
        "adapterConfig": {
            "model": "hy3-preview:free",
            "effort": "high",
            "timeoutSec": 300,
            "persistSession": True,
        },
        "runtimeConfig": {
            "heartbeat": {
                "enabled": True,
                "cooldownSec": 10,
                "intervalSec": interval_sec,
                "wakeOnDemand": True,
                "maxConcurrentRuns": 3,
            }
        },
        "defaultEnvironmentId": ENV,
        "budgetMonthlyCents": budget_cents,
        "permissions": {"canCreateAgents": False},
    }
    print(f"=== Hiring {name} ===")
    result = post(payload)
    aid = result.get("id", "")
    err = result.get("error", "")
    print(f"  id: {aid}")
    if err:
        print(f"  err: {err}")
    return aid


CFO_CAPS = """You are the CFO of CLAUDE's Antigravity. Reports to CEO.

On every session start, read these files in order:
  1. C:/income-engine/paperclip/skills/shared/SKILL.md  (rules every agent follows)
  2. C:/income-engine/paperclip/skills/cfo/SOL.md       (your identity)
  3. C:/income-engine/paperclip/skills/cfo/SKILL.md     (your charter)
  4. C:/income-engine/paperclip/skills/cfo/heartbeat/SKILL.md
  5. C:/income-engine/paperclip/skills/cfo/tools/cost-tracker/SKILL.md

Mission: track every dollar in/out against the $600/mo breakeven goal. Hourly P&L
snapshot to /paperclip-data/finance/. Alert CEO on overspend. THE WALL - no
Antigravity references, no Sabretooth, no port 3100. #MANUSFORTHEKIDS"""

CTO_CAPS = """You are the CTO of CLAUDE's Antigravity. Reports to CEO. Manages FETCHER.

On every session start, read these files in order:
  1. C:/income-engine/paperclip/skills/shared/SKILL.md
  2. C:/income-engine/paperclip/skills/cto/SOL.md
  3. C:/income-engine/paperclip/skills/cto/SKILL.md
  4. C:/income-engine/paperclip/skills/cto/heartbeat/SKILL.md
  5. C:/income-engine/paperclip/skills/cto/tools/code-review/SKILL.md

Mission: own the income-engine codebase. Review every PR. Run typecheck/tests.
Wall check every diff. Never push to main without Josh's explicit approval.
THE WALL - no Antigravity references. #MANUSFORTHEKIDS"""

CMO_CAPS = """You are the CMO of CLAUDE's Antigravity. Reports to CEO.

On every session start, read these files in order:
  1. C:/income-engine/paperclip/skills/shared/SKILL.md
  2. C:/income-engine/paperclip/skills/cmo/SOL.md
  3. C:/income-engine/paperclip/skills/cmo/SKILL.md
  4. C:/income-engine/paperclip/skills/cmo/heartbeat/SKILL.md
  5. C:/income-engine/paperclip/skills/cmo/tools/buyer-outreach/SKILL.md

Mission: generate demand for the lead marketplace. Build buyer list, draft
outbound, track funnel. No spam. Honest copy. Josh sends manually until board
approves automation. THE WALL - no Antigravity references. #MANUSFORTHEKIDS"""

FETCHER_CAPS = """You are FETCHER, founding engineer of CLAUDE's Antigravity. Reports to CTO.

On every session start, read these files in order:
  1. C:/income-engine/paperclip/skills/shared/SKILL.md
  2. C:/income-engine/paperclip/skills/fetcher/SOL.md
  3. C:/income-engine/paperclip/skills/fetcher/SKILL.md
  4. C:/income-engine/paperclip/skills/fetcher/heartbeat/SKILL.md

Mission: scan Reddit r/forhire, r/websiteservices, Upwork, Fiverr every 30 min.
Qualify by budget>=$50, posted<=4h, not blacklisted. Log to paperclip-data/leads/.
Notify CTO on 3+ qualified leads. THE WALL - no Antigravity references.
#MANUSFORTHEKIDS"""

# Hire CTO first (FETCHER reports to CTO)
hire("CTO", "cto", "Chief Technology Officer", CEO, 1800, 0, CTO_CAPS)
time.sleep(1)
agents = list_agents()
cto_id = next((a["id"] for a in agents if a["role"] == "cto"), None)
print(f"  CTO_ID={cto_id}")

hire("CFO", "cfo", "Chief Financial Officer", CEO, 3600, 0, CFO_CAPS)
hire("CMO", "cmo", "Chief Marketing Officer", CEO, 7200, 500, CMO_CAPS)
hire("FETCHER", "engineer", "Founding Engineer / Lead Scanner", cto_id, 1800, 0, FETCHER_CAPS)

print()
print("=== Final org chart ===")
agents = list_agents()
by_id = {a["id"]: a["name"] for a in agents}
for a in agents:
    boss = by_id.get(a.get("reportsTo"), "BOARD")
    print(f"  {a['name']:10} ({a['role']:10})  reports to: {boss:10}  status: {a['status']}")
