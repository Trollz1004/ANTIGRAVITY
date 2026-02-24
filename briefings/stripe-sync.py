"""
stripe-sync.py — Pull last 10 days of Stripe charges + payment intents.
Stdlib only. Reads STRIPE_SECRET_KEY from C:\OPUSONLY\.env.
Output: C:\OPUSONLY\briefings\stripe\last_10_days.json
"""

import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

ENV_PATH = r"C:\OPUSONLY\.env"
OUTPUT_DIR = r"C:\OPUSONLY\briefings\stripe"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "last_10_days.json")
STRIPE_API = "https://api.stripe.com/v1"
WINDOW_DAYS = 10


def read_stripe_key():
    """Parse .env file for STRIPE_SECRET_KEY."""
    if not os.path.isfile(ENV_PATH):
        print(f"ERROR: .env not found at {ENV_PATH}")
        sys.exit(1)

    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("STRIPE_SECRET_KEY="):
                val = line.split("=", 1)[1].strip().strip('"').strip("'")
                if not val:
                    print("ERROR: STRIPE_SECRET_KEY is empty in .env")
                    sys.exit(1)
                return val

    print("ERROR: STRIPE_SECRET_KEY not found in .env")
    sys.exit(1)


def make_auth_header(secret_key):
    """Basic auth header: secret key as username, empty password."""
    credentials = f"{secret_key}:"
    encoded = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")
    return f"Basic {encoded}"


def stripe_get(endpoint, auth_header, params=None):
    """GET a Stripe API endpoint. Returns parsed JSON or None on error."""
    url = f"{STRIPE_API}/{endpoint}"
    if params:
        query = urllib.parse.urlencode(params, doseq=False)
        url = f"{url}?{query}"

    req = urllib.request.Request(url, method="GET")
    req.add_header("Authorization", auth_header)

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"ERROR: Stripe API returned {e.code} for {endpoint}")
        try:
            err = json.loads(body)
            msg = err.get("error", {}).get("message", body[:200])
            print(f"  -> {msg}")
        except Exception:
            print(f"  -> {body[:200]}")
        return None
    except urllib.error.URLError as e:
        print(f"ERROR: Network error hitting {endpoint}: {e.reason}")
        return None
    except Exception as e:
        print(f"ERROR: Unexpected error hitting {endpoint}: {e}")
        return None


# Need urllib.parse for query encoding
import urllib.parse


def fetch_all_pages(endpoint, auth_header, base_params):
    """Fetch all pages from a Stripe list endpoint (auto-paginate)."""
    all_data = []
    params = dict(base_params)

    while True:
        result = stripe_get(endpoint, auth_header, params)
        if result is None:
            break

        items = result.get("data", [])
        all_data.extend(items)

        if result.get("has_more") and items:
            params["starting_after"] = items[-1]["id"]
        else:
            break

    return all_data


def main():
    secret_key = read_stripe_key()
    auth_header = make_auth_header(secret_key)

    now = datetime.now(timezone.utc)
    window_start = now - timedelta(days=WINDOW_DAYS)
    created_gte = int(window_start.timestamp())

    print(f"Syncing Stripe data from {window_start.strftime('%Y-%m-%d')} to {now.strftime('%Y-%m-%d')}...")

    # Fetch charges
    print("  Fetching charges...", end=" ", flush=True)
    charges = fetch_all_pages("charges", auth_header, {
        "created[gte]": created_gte,
        "limit": 100,
    })
    print(f"{len(charges)} found")

    # Fetch payment intents
    print("  Fetching payment intents...", end=" ", flush=True)
    payment_intents = fetch_all_pages("payment_intents", auth_header, {
        "created[gte]": created_gte,
        "limit": 100,
    })
    print(f"{len(payment_intents)} found")

    # Calculate summary
    total_revenue_cents = sum(
        c.get("amount", 0) for c in charges if c.get("status") == "succeeded"
    )

    output = {
        "synced_at": now.isoformat(),
        "window_start": window_start.strftime("%Y-%m-%d"),
        "window_end": now.strftime("%Y-%m-%d"),
        "charges": charges,
        "payment_intents": payment_intents,
        "summary": {
            "total_charges": len(charges),
            "total_revenue_cents": total_revenue_cents,
            "total_payment_intents": len(payment_intents),
        },
    }

    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    revenue_dollars = total_revenue_cents / 100.0
    print(f"\nSynced {len(charges)} charges, ${revenue_dollars:.2f} revenue, "
          f"{len(payment_intents)} payment intents (last {WINDOW_DAYS} days)")
    print(f"Saved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
