"""
Twitter Retry Script — Repost to 33 cities that failed due to rate limiting / DNS errors.
Run with: python twitter_retry.py
Reads API keys from C:\OPUS\scripts\.env or environment variables.
"""
import json
import os
import sys
import time
from pathlib import Path

# Failed cities from tweet-results-20260216-0035.json
FAILED_CITIES = [
    ("Madison", "WI"), ("Durham", "NC"), ("Savannah", "GA"), ("Charleston", "SC"),
    ("Knoxville", "TN"), ("Chattanooga", "TN"), ("Little Rock", "AR"),
    ("Springfield", "MO"), ("Huntsville", "AL"), ("Grand Rapids", "MI"),
    ("Des Moines", "IA"), ("Tallahassee", "FL"), ("Baton Rouge", "LA"),
    ("Providence", "RI"), ("Spokane", "WA"), ("Tacoma", "WA"),
    ("Greensboro", "NC"), ("Winston Salem", "NC"), ("Dayton", "OH"),
    ("Akron", "OH"), ("Tulsa", "OK"), ("Wichita", "KS"),
    ("Laredo", "TX"), ("Lubbock", "TX"), ("Corpus Christi", "TX"),
    ("Reno", "NV"), ("Fayetteville", "AR"), ("Columbia", "SC"),
    ("Augusta", "GA"), ("Macon", "GA"), ("Jackson", "MS"),
    ("Sioux Falls", "SD"), ("Fargo", "ND"),
]

BRAND = {
    "name": "YouAndINotAI",
    "url": "youandinotai.com",
    "price": "$14.99/mo",
    "handle": "@AiCollab4Kids",
}

TWEET_TEMPLATES = [
    "{city}, {state} — 47% of dating profiles are bots. YouAndINotAI verifies every human w/ V8 Cloud + Plaid. Founding members: {price} locked forever. {url} #{city_tag} #NoBots #DatingApp",
    "Attention {city} singles 🚨 Tired of bots? YouAndINotAI uses 8-layer verification (Plaid-powered). Only 100 founding spots at {price}/forever. {url} #{city_tag} #RealDating",
    "{city} dating scene got a bot problem? Not anymore. V8 Cloud Verification on every profile. {price} founding member = locked forever. {url} #{city_tag} #HumanVerified",
]


def get_tweet_text(city, state, idx):
    """Generate tweet text for a city."""
    city_tag = city.replace(" ", "")
    template = TWEET_TEMPLATES[idx % len(TWEET_TEMPLATES)]
    return template.format(
        city=city, state=state,
        city_tag=city_tag,
        price=BRAND["price"],
        url=BRAND["url"],
    )


def main():
    # Check for API keys
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    key, val = line.split("=", 1)
                    os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))

    api_key = os.environ.get("TWITTER_API_KEY", "")
    api_secret = os.environ.get("TWITTER_API_KEY_SECRET", "")
    access_token = os.environ.get("TWITTER_ACCESS_TOKEN", "")
    access_secret = os.environ.get("TWITTER_ACCESS_TOKEN_SECRET", "")

    if not all([api_key, api_secret, access_token, access_secret]):
        print("❌ Twitter API keys not found. Set TWITTER_API_KEY, TWITTER_API_KEY_SECRET,")
        print("   TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET in environment or .env")
        print(f"\n📋 {len(FAILED_CITIES)} cities to retry:")
        for c, s in FAILED_CITIES:
            print(f"   - {c}, {s}")
        print("\nDry run - previewing tweets:")
        for i, (city, state) in enumerate(FAILED_CITIES[:5]):
            print(f"\n  [{i+1}] {get_tweet_text(city, state, i)}")
        print(f"\n  ... and {len(FAILED_CITIES) - 5} more")
        return

    import tweepy

    client = tweepy.Client(
        consumer_key=api_key,
        consumer_secret=api_secret,
        access_token=access_token,
        access_token_secret=access_secret,
    )

    results = []
    print(f"🐦 Retrying {len(FAILED_CITIES)} failed cities...")

    for i, (city, state) in enumerate(FAILED_CITIES):
        text = get_tweet_text(city, state, i)
        try:
            response = client.create_tweet(text=text)
            tweet_id = response.data["id"]
            url = f"https://x.com/{BRAND['handle'].lstrip('@')}/status/{tweet_id}"
            results.append({
                "city": city, "state": state,
                "tweet_id": str(tweet_id), "url": url,
                "posted": time.strftime("%Y-%m-%dT%H:%M:%S"),
            })
            print(f"  ✅ [{i+1}/{len(FAILED_CITIES)}] {city}, {state} — {url}")
            # Rate limit: 20 sec between tweets to stay under 300/3hr limit
            time.sleep(20)
        except Exception as e:
            results.append({"city": city, "state": state, "error": str(e)})
            print(f"  ❌ [{i+1}/{len(FAILED_CITIES)}] {city}, {state} — {e}")
            if "429" in str(e):
                print("  ⏸️  Rate limited. Waiting 60s...")
                time.sleep(60)

    # Save results
    out_path = Path(__file__).parent / f"tweet-retry-results-{time.strftime('%Y%m%d-%H%M')}.json"
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)

    success = sum(1 for r in results if "tweet_id" in r)
    print(f"\n✅ Retry complete: {success}/{len(FAILED_CITIES)} posted")
    print(f"📄 Results saved to: {out_path}")


if __name__ == "__main__":
    main()
