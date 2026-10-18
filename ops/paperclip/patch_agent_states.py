import urllib.request
import json

def patch_agent(agent_id, data):
    url = f"http://127.0.0.1:4747/api/agents/{agent_id}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "Antigravity/1.0"},
        method="PATCH"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Patched {agent_id}: status {resp.status}")
    except Exception as e:
        print(f"Failed to patch {agent_id}: {e}")

# 1. Fix Codex Judge (set to idle, clear errorReason)
patch_agent("3ff00008-6118-4745-ad53-b927e5948217", {
    "status": "idle",
    "errorReason": None
})

# 2. Fix Wingman - Emergent (disable process heartbeat since it's a cloud agent polling over HTTPS)
patch_agent("5c482d35-063e-41a5-b8f3-2e3c9be4c3ca", {
    "status": "idle",
    "errorReason": None,
    "runtimeConfig": {
        "heartbeat": {
            "enabled": False,
            "intervalSec": 900
        }
    }
})

print("Agents patched.")
