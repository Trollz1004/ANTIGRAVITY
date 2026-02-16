import urllib.request
import json
import ssl

TOKEN = "EAAAl4O_Of2e6oSYChlCQOa840mGng2hMN6e3bV93JyO4TaWmOGswwyNqHswfmhh"

ctx = ssl.create_default_context()
headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
    "Square-Version": "2024-01-18"
}

print("Testing locations API...")
url = "https://connect.squareup.com/v2/locations"
req = urllib.request.Request(url, headers=headers)
try:
    resp = urllib.request.urlopen(req, context=ctx, timeout=10)
    print("SUCCESS!")
    print(json.dumps(json.loads(resp.read()), indent=2))
except Exception as e:
    print(f"FAILED: {e}")
    if hasattr(e, "read"):
        print(e.read().decode())
