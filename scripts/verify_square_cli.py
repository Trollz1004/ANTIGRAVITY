import urllib.request
import json
import ssl

TOKEN = "EAAAI4O_Of2e6oSYChICQOa840mGng2hMN6e3bV93JyO4TaWmOGswwyNqHswfmhh"
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

# 1. List ALL payment links to find founding member
print("Checking Payment Links...")
links = api_get("/v2/online-checkout/payment-links")
if "payment_links" in links:
    found = False
    for link in links["payment_links"]:
        print(f"- {link.get('name', 'No Name')}: {link.get('url')} (Price: {link.get('order', {}).get('line_items', [{}])[0].get('base_price_money', {}).get('amount')})")
        if "Founding" in link.get("name", ""):
            found = True
            print(f">>> FOUND: {link['url']}")
    if not found:
        print("Founding Member link NOT found in active links.")
else:
    print(f"Error or no links: {links}")

# 2. List Subscription Plans
print("\nChecking Subscription Plans...")
plans = api_get("/v2/catalog/list?types=SUBSCRIPTION_PLAN")
if "objects" in plans:
    for obj in plans["objects"]:
        plan = obj["subscription_plan_data"]
        print(f"- {plan['name']} (ID: {obj['id']})")
        # Print variations/prices
        for phase in plan.get("phases", []):
            print(f"  - Price: {phase.get('recurring_price_money', {}).get('amount')} {phase.get('recurring_price_money', {}).get('currency')}")
else:
    print(f"Error or no plans: {plans}")
