#!/usr/bin/env python3
"""Access Mission Control dashboard on port 3130"""
import urllib.request
import urllib.error
import json

API_BASE = "http://127.0.0.1:3130"
COMPANY_HERMES = "88ebbf4a-a225-4bc5-abdb-cebdb59be57e"

headers = {
    "User-Agent": "Mozilla/5.0 (Hermes Agent Oversight)",
    "Accept": "application/json",
}

def api_get(endpoint):
    url = f"{API_BASE}{endpoint}"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status, resp.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return None, str(e)

print("=== ACCESSING MISSION CONTROL (PORT 3130) ===\n")

# Try different endpoints
endpoints = [
    "/api/health",
    "/api/heartbeat-runs?limit=10",
    "/api/companies",
    f"/api/companies/{COMPANY_HERMES}",
    "/api/agents/me",
    f"/api/companies/{COMPANY_HERMES}/issues?limit=5",
    "/api/companies/{}/agents".format(COMPANY_HERMES),
]

for ep in endpoints:
    print(f"GET {ep}:")
    status, data = api_get(ep)
    print(f"  Status: {status}")
    if status == 200:
        try:
            parsed = json.loads(data)
            print(f"  Data (truncated): {json.dumps(parsed, indent=2)[:500]}...")
        except:
            print(f"  Raw: {data[:200]}...")
    else:
        print(f"  Error: {data[:200] if data else 'None'}")
    print()