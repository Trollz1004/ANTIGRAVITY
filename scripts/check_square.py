"""Check Square API for subscription plans and checkout links."""
import urllib.request
import json
import ssl

TOKEN = "EAAAl8YxbB79dPEKpMpdqT_3d1CkxrhH6SvqDf0hfN7EH34NXHyXqQo8IwHOk5Gh"
MERCHANT_ID = "ML3C7FMTQS5KX"
LOCATION_ID = "LMX91E4QMFCXF"

ctx = ssl.create_default_context()
headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
    "Square-Version": "2024-01-18"
}

def api_get(path):
    url = f"https://connect.squareup.com{path}"
    req = urllib.request.Request(url, headers=headers)
    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=15)
        return json.loads(resp.read())
    except Exception as e:
        err = ""
        if hasattr(e, "read"):
            err = e.read().decode()
        return {"error": str(e), "detail": err}

def api_post(path, body):
    url = f"https://connect.squareup.com{path}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=15)
        return json.loads(resp.read())
    except Exception as e:
        err = ""
        if hasattr(e, "read"):
            err = e.read().decode()
        return {"error": str(e), "detail": err}

# 1. Check subscription plans
print("=" * 60)
print("1. SUBSCRIPTION PLANS")
print("=" * 60)
result = api_get("/v2/catalog/list?types=SUBSCRIPTION_PLAN")
print(json.dumps(result, indent=2)[:2000])

# 2. Check active subscriptions (customers)
print("\n" + "=" * 60)
print("2. ACTIVE SUBSCRIPTIONS")
print("=" * 60)
result = api_post("/v2/subscriptions/search", {
    "query": {
        "filter": {
            "location_ids": [LOCATION_ID]
        }
    }
})
print(json.dumps(result, indent=2)[:2000])

# 3. Check checkout links
print("\n" + "=" * 60)
print("3. CHECKOUT / PAYMENT LINKS")
print("=" * 60)
result = api_get("/v2/online-checkout/payment-links")
print(json.dumps(result, indent=2)[:2000])

# 4. Check location info
print("\n" + "=" * 60)
print("4. LOCATION INFO")
print("=" * 60)
result = api_get(f"/v2/locations/{LOCATION_ID}")
print(json.dumps(result, indent=2)[:1000])

print("\nDONE")
