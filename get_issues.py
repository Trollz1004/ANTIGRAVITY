import os, urllib.request, json
url = os.environ.get("PAPERCLIP_API_URL", "http://127.0.0.1:4747")
if not url.endswith("/api"):
    url = url.rstrip("/") + "/api"
token = os.environ.get("PAPERCLIP_API_KEY", "")
run_id = os.environ.get("PAPERCLIP_RUN_ID", "")

req = urllib.request.Request(
    f"{url}/issues/5d457993-3cb0-4c49-add3-bd11cf69d3a3/comments",
    data=json.dumps({
        "body": "Support lane execution verified: endpoints and environment confirmed on T5500."
    }).encode("utf-8"),
    headers={
        "Authorization": f"Bearer {token}",
        "X-Paperclip-Run-Id": run_id,
        "Content-Type": "application/json"
    },
    method="POST"
)
try:
    with urllib.request.urlopen(req) as resp:
        print("Comment status:", resp.status, resp.read().decode())
except Exception as e:
    print("Comment Error:", e)



