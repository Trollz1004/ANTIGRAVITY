import urllib.request
import json
import ssl

TOKENS = [
    "EAAAI4O_Of2e6oSYChICQOa840mGng2hMN6e3bV93JyO4TaWmOGswwyNqHswfmhh",
    "EAAAl4O_Of2e6oSYChlCQOa840mGng2hMN6e3bV93JyO4TaWmOGswwyNqHswfmhh"
]
LOCATION_ID = "L24ZX5WRA41TH"

ctx = ssl.create_default_context()

def check_token(token):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Square-Version": "2024-01-18"
    }
    url = "https://connect.squareup.com/v2/catalog/list?types=SUBSCRIPTION_PLAN"
    req = urllib.request.Request(url, headers=headers)
    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=10)
        return True, json.loads(resp.read())
    except Exception as e:
        return False, str(e)

for t in TOKENS:
    print(f"Testing token: {t[:10]}...")
    success, result = check_token(t)
    if success:
        print(f"SUCCESS with token {t[:10]}!")
        print(json.dumps(result, indent=2)[:500])
        # Update verify_square_final.py with the working token
        break
    else:
        print(f"FAILED: {result}")
