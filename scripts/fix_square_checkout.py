"""
Fix Square Checkout Links - YouAndINotAI
=========================================
Tests Square API token, creates payment links, outputs URLs.
Run: python scripts/fix_square_checkout.py YOUR_TOKEN_HERE
"""
import json, os, sys, urllib.request, urllib.error, uuid

TOKEN = sys.argv[1] if len(sys.argv) > 1 else os.getenv(
    "SQUARE_ACCESS_TOKEN",
    "EAAAl4O_Of2e6oSYChlCQOa840mGng2hMN6e3bV93JyO4TaWmOGswwyNqHswfmhh"
)
LOCATION = os.getenv("SQUARE_LOCATION_ID", "L24ZX5WRA41TH")
BASE = "https://connect.squareup.com/v2"

def api(endpoint, method="GET", data=None):
    headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json", "Square-Version": "2025-01-23"}
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(f"{BASE}/{endpoint}", data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode()), r.status
    except urllib.error.HTTPError as e:
        try: return json.loads(e.read().decode()), e.code
        except: return {"error": str(e)}, e.code

print(f"=== Square Checkout Fix ===")
print(f"Token: ...{TOKEN[-8:]}")
print(f"Location: {LOCATION}\n")

# Test token
r, s = api("locations")
if s != 200:
    print(f"TOKEN FAILED ({s})")
    print(json.dumps(r, indent=2))
    print("\nGet a new token from: https://developer.squareup.com/apps")
    sys.exit(1)

for loc in r.get("locations", []):
    print(f"Location: {loc['name']} ({loc['id']}) - {loc['status']}")

# Check existing payment links
print("\n--- Existing Payment Links ---")
r, s = api("online-checkout/payment-links")
links = r.get("payment_links", []) if s == 200 else []
for l in links:
    print(f"  {l.get('url')} | {l.get('description', 'N/A')}")
if not links:
    print("  None found")

# Check catalog
print("\n--- Catalog ---")
r, s = api("catalog/list")
items = r.get("objects", []) if s == 200 else []
print(f"  {len(items)} items")
for i in items:
    t = i["type"]
    d = i.get(f"{t.lower()}_data", {})
    print(f"    [{t}] {d.get('name', i['id'])}")

# Create payment links
print("\n--- Creating Payment Links ---")
tiers = [
    ("YouAndINotAI - Free ($1 Bot-Shield)", 100, "Bot-Shield Verification Fee - $1 one-time payment to prove you're human"),
    ("YouAndINotAI - Founding Member ($14.99/mo)", 1499, "Founding Member Monthly - Lock in $14.99/mo for life. V8 Verified dating."),
]
new_links = []
for name, cents, desc in tiers:
    data = {
        "idempotency_key": str(uuid.uuid4()),
        "quick_pay": {"name": name, "price_money": {"amount": cents, "currency": "USD"}, "location_id": LOCATION},
        "checkout_options": {
            "redirect_url": "https://youandinotai.com/success",
            "accepted_payment_methods": {"apple_pay": True, "google_pay": True},
        },
    }
    r, s = api("online-checkout/payment-links", "POST", data)
    if s in (200, 201):
        link = r.get("payment_link", {})
        url = link.get("url", "N/A")
        print(f"  CREATED: {name} -> {url}")
        new_links.append({"name": name, "url": url, "id": link.get("id")})
    else:
        print(f"  FAILED {name}: {s} - {json.dumps(r)}")

if new_links:
    out = json.dumps({"location": LOCATION, "links": new_links}, indent=2)
    os.makedirs("data", exist_ok=True)
    with open("data/square-payment-links.json", "w") as f:
        f.write(out)
    print(f"\nSaved to data/square-payment-links.json")
    print("\n=== UPDATE LANDING PAGE WITH THESE URLs ===")
    for l in new_links:
        print(f"  {l['name']}: {l['url']}")
