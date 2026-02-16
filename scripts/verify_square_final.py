import urllib.request
import json
import ssl

TOKEN = "EAAAl4O_Of2e6oSYChlCQOa840mGng2hMN6e3bV93JyO4TaWmOGswwyNqHswfmhh"
LOCATION_ID = "L24ZX5WRA41TH"

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

print("Checking Subscription Plans...")
plans = api_get("/v2/catalog/list?types=SUBSCRIPTION_PLAN")
if "objects" in plans:
    for obj in plans["objects"]:
        plan = obj["subscription_plan_data"]
        print(f"- {plan['name']} (ID: {obj['id']})")
        for phase in plan.get("phases", []):
            print(f"  - Price: {phase.get('recurring_price_money', {}).get('amount')} {phase.get('recurring_price_money', {}).get('currency')}")
else:
    print(f"No subscription plans found or error: {plans}")

print("\nChecking Payment Links...")
links = api_get("/v2/online-checkout/payment-links")
if "payment_links" in links:
    for link in links["payment_links"]:
        print(f"- {link.get('name', 'No Name')}: {link.get('url')} (Location: {link.get('location_id')})")
else:
    print(f"No payment links found or error: {links}")
