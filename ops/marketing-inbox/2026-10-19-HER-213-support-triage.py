import json, os, urllib.request

api = os.environ["PAPERCLIP_API_URL"].rstrip("/")
if not api.endswith("/api"):
    api += "/api"
key = os.environ["PAPERCLIP_API_KEY"]
run = os.environ["PAPERCLIP_RUN_ID"]

def req(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(api + path, data=data, method=method, headers={
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "X-Paperclip-Run-Id": run,
    })
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return resp.status, json.load(resp)
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception as e:
        return 0, type(e).__name__ + ": " + str(e)[:200]

# 1. Check operator ticket queue (requires valid operator session)
status, body = req("GET", "/api/v1/support/operator/tickets")
print("operator queue status:", status, body)

# 2. Check support tickets table
status, body = req("GET", "/api/v1/support/tickets")
print("support tickets count:", body.get("total", "N/A") if isinstance(body, dict) else "N/A")

# 3. Check marketing inbox queue
status, body = req("GET", "/api/marketing/queue")
print("marketing queue status:", status, body)

# 4. Check local draft inbox
status, body = req("GET", "/ops/marketing-inbox")
print("local inbox status:", status, body)

# 5. Check public FAQ (already live)
PY
python C:/ANTIGRAVITY/ops/marketing-inbox/2026-10-19-HER-213-support-triage.py